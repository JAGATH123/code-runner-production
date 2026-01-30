// IMPORTANT: Load environment variables FIRST, before any other imports
// This ensures REDIS_URL and other env vars are available when modules load
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Try multiple possible paths for .env.local
const possiblePaths = [
  path.resolve(__dirname, '../.env.local'),          // From dist folder
  path.resolve(__dirname, '../../.env.local'),       // From src folder (tsx)
  path.resolve(process.cwd(), '.env.local'),         // From current directory
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (existsSync(envPath)) {
    // Note: console.log used here because logger not yet initialized
    console.log('Loading .env.local from:', envPath);
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log('✅ Loaded .env.local');
      envLoaded = true;
      break;
    }
  }
}

if (!envLoaded) {
  console.log('⚠️  No .env.local found, trying default .env');
}

// Load .env as fallback
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectToDatabase, validateEnv, getLogger } from '@code-runner/shared';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Initialize logger
const logger = getLogger('api');

// Validate environment variables at startup (fail fast if misconfigured)
validateEnv('api');

// Import routes
import problemsRoutes from './routes/problems.routes';
import levelsRoutes from './routes/levels.routes';
import sessionsRoutes from './routes/sessions.routes';
import executionRoutes from './routes/execution.routes';
import progressRoutes from './routes/progress.routes';
import authRoutes from './routes/auth.routes';
import cheatsheetsRoutes from './routes/cheatsheets.routes';

// Import Redis and queue initializer (AFTER dotenv is loaded)
import { redis, initializeQueues } from './queue/queue.config';

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Force cache bust for Railway deployment
const BUILD_ID = '20260119-1';

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - support multiple origins
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

logger.info('CORS configuration loaded', { origins: corsOrigins });

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Morgan HTTP logging with Winston stream
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.http(message.trim());
    },
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'code-runner-api',
  });
});

// Redis health check endpoint
app.get('/health/redis', async (req, res) => {
  try {
    // Test Redis connection
    await redis.ping();

    // Get Redis info
    const redisStatus = redis.status;

    res.json({
      status: 'healthy',
      redis: {
        connected: redisStatus === 'ready',
        status: redisStatus,
        host: redis.options.host || 'unknown',
        port: redis.options.port || 'unknown',
      },
      environment: {
        REDIS_URL: process.env.REDIS_URL ? '✅ Set' : '❌ Not set',
        REDIS_HOST: process.env.REDIS_HOST || 'not set',
        REDIS_PORT: process.env.REDIS_PORT || 'not set',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      redis: {
        connected: false,
        status: redis.status,
      },
      environment: {
        REDIS_URL: process.env.REDIS_URL ? '✅ Set' : '❌ Not set',
        REDIS_HOST: process.env.REDIS_HOST || 'not set',
        REDIS_PORT: process.env.REDIS_PORT || 'not set',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/problems', problemsRoutes);
app.use('/levels', levelsRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/execution', executionRoutes); // New queue-based execution
app.use('/progress', progressRoutes);
app.use('/cheatsheets', cheatsheetsRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Store server instance for graceful shutdown
let server: any;

// Start server
async function startServer() {
  try {
    // Initialize queues (must be called after dotenv.config())
    initializeQueues();

    // Connect to MongoDB
    logger.info('Connecting to MongoDB', {
      uri: process.env.MONGODB_URI?.substring(0, 70) + '...',
    });
    await connectToDatabase();
    logger.info('Connected to MongoDB successfully');

    // Start Express server
    server = app.listen(PORT, () => {
      logger.info('API Server started', {
        port: PORT,
        healthCheck: `http://localhost:${PORT}/health`,
        environment: process.env.NODE_ENV || 'development',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
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
    // Stop accepting new connections
    if (server) {
      logger.info('Closing HTTP server (finishing current requests)...');
      await new Promise<void>((resolve, reject) => {
        server.close((err: Error | undefined) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed');
    }

    // Close Redis connection
    if (redis) {
      logger.info('Closing Redis connection...');
      await redis.quit();
      logger.info('Redis connection closed');
    }

    // Close MongoDB connection
    const mongoose = await import('mongoose');
    if (mongoose.connection.readyState !== 0) {
      logger.info('Closing MongoDB connection...');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }

    logger.info('API service shutdown complete');
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

// Start the server
startServer();

export default app;
