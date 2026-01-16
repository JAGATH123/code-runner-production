import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

// Redis connection configuration
// Use REDIS_URL if available (Railway, Heroku, etc.), otherwise fall back to individual vars
console.log('🔍 Redis Environment Variables Check:');
console.log('  REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not set');
console.log('  REDIS_HOST:', process.env.REDIS_HOST || 'not set');
console.log('  REDIS_PORT:', process.env.REDIS_PORT || 'not set');

// Create Redis connection config for BullMQ
const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };

console.log('📡 Redis Connection:', process.env.REDIS_URL ? 'Using REDIS_URL' : 'Using host/port config');

// Create standalone Redis connection for other uses
export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

// Queue options - use connection string/config directly for BullMQ
const queueOptions: QueueOptions = {
  connection: redisConfig as any,  // BullMQ will create its own Redis instance
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
export const codeExecutionQueue = new Queue('code-execution', queueOptions);
export const codeSubmissionQueue = new Queue('code-submission', queueOptions);

// Log queue events
codeExecutionQueue.on('error', (error) => {
  console.error('Code Execution Queue Error:', error);
});

codeSubmissionQueue.on('error', (error) => {
  console.error('Code Submission Queue Error:', error);
});

console.log('✅ Queues initialized');
