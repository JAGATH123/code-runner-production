// IMPORTANT: Load environment variables FIRST, before any other imports
// This ensures REDIS_URL and other env vars are available when modules load
import dotenv from 'dotenv';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
// Note: console.log used here because logger not yet initialized
console.log('Loading .env.local from:', envLocalPath);
const result = dotenv.config({ path: envLocalPath });
if (result.error) {
  console.log('⚠️  Failed to load .env.local:', result.error.message);
} else {
  console.log('✅ Loaded .env.local');
}
dotenv.config(); // Load .env as fallback

import { connectToDatabase, getLogger } from '@code-runner/shared';
import { DockerExecutor } from './executors/docker.executor';
import { CodeExecutionWorker } from './workers/code-execution.worker';
import { CodeSubmissionWorker } from './workers/code-submission.worker';

// Initialize logger
const logger = getLogger('runner');

let executionWorker: CodeExecutionWorker;
let submissionWorker: CodeSubmissionWorker;

/**
 * Format pool stats as a readable table
 */
function formatPoolStats(stats: any): string {
  if (!stats.enabled) {
    return '  Container pooling is disabled';
  }

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push('  ┌─────────────────────────────────────────────────────────────────┐');
  lines.push('  │                    CONTAINER POOL STATUS                        │');
  lines.push('  ├─────────────────────────────────────────────────────────────────┤');

  // Summary section
  lines.push('  │  SUMMARY                                                        │');
  lines.push(`  │    Total Containers: ${String(stats.total).padEnd(4)} │ In Use: ${String(stats.inUse).padEnd(4)} │ Available: ${String(stats.available).padEnd(4)}│`);
  lines.push(`  │    Utilization: ${String(stats.utilization + '%').padEnd(6)} │ Total Executions: ${String(stats.totalExecutions).padEnd(18)}│`);
  lines.push('  ├─────────────────────────────────────────────────────────────────┤');

  // Limits section
  lines.push('  │  SCALING LIMITS                                                 │');
  lines.push(`  │    Min: ${String(stats.limits.min).padEnd(3)} │ Soft Max: ${String(stats.limits.soft).padEnd(3)} │ Hard Max: ${String(stats.limits.hard).padEnd(21)}│`);

  // Scaling status
  const scalingStatus = stats.scaling.atHardLimit ? '🔴 AT HARD LIMIT' :
                        stats.scaling.atSoftLimit ? '🟡 AT SOFT LIMIT' :
                        '🟢 CAN SCALE UP';
  lines.push(`  │    Status: ${scalingStatus.padEnd(52)}│`);
  lines.push('  ├─────────────────────────────────────────────────────────────────┤');

  // Containers section
  lines.push('  │  CONTAINERS                                                     │');
  lines.push('  │    Name                              │ Status │ Execs │ Age(s) │');
  lines.push('  │  ────────────────────────────────────┼────────┼───────┼────────│');

  if (stats.containers && stats.containers.length > 0) {
    for (const container of stats.containers) {
      const status = container.inUse ? '🔵 BUSY' : '🟢 IDLE';
      const name = container.name.length > 36 ? container.name.substring(0, 33) + '...' : container.name;
      lines.push(`  │    ${name.padEnd(36)} │ ${status} │ ${String(container.executions).padStart(5)} │ ${String(container.ageSeconds).padStart(6)} │`);
    }
  } else {
    lines.push('  │    (no containers)                                             │');
  }

  lines.push('  └─────────────────────────────────────────────────────────────────┘');
  lines.push('');

  return lines.join('\n');
}

async function startRunner() {
  try {
    logger.info('Starting Code Runner Worker Service');

    // Log environment configuration
    logger.info('Environment configuration', {
      redisUrl: process.env.REDIS_URL ? `SET (${process.env.REDIS_URL.substring(0, 50)}...)` : 'NOT SET',
      redisHost: process.env.REDIS_HOST || 'not set',
      redisPort: process.env.REDIS_PORT || 'not set',
      nodeEnv: process.env.NODE_ENV || 'development',
      cwd: process.cwd(),
    });

    // Connect to MongoDB
    await connectToDatabase();
    logger.info('Connected to MongoDB successfully');

    // Initialize Docker executor (skip if SKIP_DOCKER_INIT is set)
    if (process.env.SKIP_DOCKER_INIT === 'true') {
      logger.warn('Skipping Docker initialization (SKIP_DOCKER_INIT=true)');
      logger.warn('Code execution will fail until Docker is available');
    } else {
      await DockerExecutor.initialize();
      logger.info('Docker executor initialized');
    }

    // Start BullMQ workers
    executionWorker = new CodeExecutionWorker();
    logger.info('Code execution worker started');

    submissionWorker = new CodeSubmissionWorker();
    logger.info('Code submission worker started');

    logger.info('Runner service is ready to process jobs', {
      environment: process.env.NODE_ENV || 'development',
    });

    // Log pool stats periodically (every 5 minutes)
    setInterval(() => {
      const poolStats = DockerExecutor.getPoolStats();
      if (poolStats.enabled) {
        console.log(formatPoolStats(poolStats));
      }
    }, 5 * 60 * 1000);

    // Log initial pool stats
    const initialPoolStats = DockerExecutor.getPoolStats();
    console.log(formatPoolStats(initialPoolStats));

  } catch (error) {
    logger.error('Failed to start runner service', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Graceful shutdown
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;
  logger.info('Received shutdown signal', { signal });

  try {
    // Close workers (they will finish current jobs)
    if (executionWorker) {
      logger.info('Closing code execution worker (finishing current jobs)...');
      await executionWorker.close();
      logger.info('Code execution worker closed');
    }

    if (submissionWorker) {
      logger.info('Closing code submission worker (finishing current jobs)...');
      await submissionWorker.close();
      logger.info('Code submission worker closed');
    }

    // Shutdown Docker executor and container pool
    logger.info('Shutting down Docker executor and container pool...');
    await DockerExecutor.shutdown();
    logger.info('Docker executor shutdown complete');

    // Close MongoDB connection
    const mongoose = await import('mongoose');
    if (mongoose.connection.readyState !== 0) {
      logger.info('Closing MongoDB connection...');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }

    logger.info('Runner service shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: String(reason),
    promise: String(promise),
  });
  shutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  shutdown('uncaughtException');
});

// Start the runner service
startRunner();
