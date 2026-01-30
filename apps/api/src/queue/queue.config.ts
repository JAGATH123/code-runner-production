import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Load .env.local if it exists (needed for module-level initialization)
const envPaths = [
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(process.cwd(), 'apps/api/.env.local'),
  path.resolve(process.cwd(), '.env.local'),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Fallback to default .env
dotenv.config();

// Lazy initialization - these will be set when initializeQueues() is called
export let redis: Redis;
export let codeExecutionQueue: Queue;
export let codeSubmissionQueue: Queue;

let initialized = false;

// Initialize queues - call this AFTER dotenv.config() has run
export function initializeQueues() {
  if (initialized) {
    return;
  }

  console.log('🔍 Redis Environment Variables Check:');
  console.log('  REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not set');
  console.log('  REDIS_HOST:', process.env.REDIS_HOST || 'not set');
  console.log('  REDIS_PORT:', process.env.REDIS_PORT || 'not set');

  // Create Redis connection config for BullMQ - parse URL into ConnectionOptions
  const redisConfig = process.env.REDIS_URL
    ? {
        host: new URL(process.env.REDIS_URL).hostname,
        port: parseInt(new URL(process.env.REDIS_URL).port),
        password: new URL(process.env.REDIS_URL).password || undefined,
      }
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      };

  console.log('📡 Redis Connection:', process.env.REDIS_URL ? `Using REDIS_URL (${redisConfig.host}:${redisConfig.port})` : `Using host/port config (${redisConfig.host}:${redisConfig.port})`);

  // Create standalone Redis connection for other uses
  redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
      });

  // Queue options - use connection config
  const queueOptions: QueueOptions = {
    connection: redisConfig,
    defaultJobOptions: {
      attempts: 3, // Retry failed jobs 3 times
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 second delay
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 100, // Keep last 100 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
        count: 500, // Keep last 500 failed jobs
      },
    },
  };

  // Create queues
  codeExecutionQueue = new Queue('code-execution', queueOptions);
  codeSubmissionQueue = new Queue('code-submission', queueOptions);

  // Log queue events
  codeExecutionQueue.on('error', (error) => {
    console.error('Code Execution Queue Error:', error);
  });

  codeSubmissionQueue.on('error', (error) => {
    console.error('Code Submission Queue Error:', error);
  });

  console.log('✅ Queues initialized');
  initialized = true;
}

// Auto-initialize when module loads (dotenv.config() has already run in index.ts)
initializeQueues();
