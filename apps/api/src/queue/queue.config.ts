import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

// Redis connection configuration
// Use REDIS_URL if available (Railway, Heroku, etc.), otherwise fall back to individual vars
console.log('🔍 Redis Environment Variables Check:');
console.log('  REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not set');
console.log('  REDIS_HOST:', process.env.REDIS_HOST || 'not set');
console.log('  REDIS_PORT:', process.env.REDIS_PORT || 'not set');

const redisConnection = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // Required for BullMQ
    };

console.log('📡 Redis Connection Config:', typeof redisConnection === 'string' ? 'Using REDIS_URL' : 'Using host/port config');

// Create Redis connection
export const redis = new Redis(redisConnection, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

// Queue options
const queueOptions: QueueOptions = {
  connection: redis,  // Use the same Redis connection instance
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
