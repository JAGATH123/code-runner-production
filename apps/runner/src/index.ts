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
        logger.info('Container pool statistics', poolStats);
      }
    }, 5 * 60 * 1000);

    // Log initial pool stats
    const initialPoolStats = DockerExecutor.getPoolStats();
    logger.info('Container pool status', initialPoolStats);

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
