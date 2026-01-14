"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeSubmissionQueue = exports.codeExecutionQueue = exports.redis = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
// Redis connection configuration
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
};
// Create Redis connection
exports.redis = new ioredis_1.default(redisConnection);
// Queue options
const queueOptions = {
    connection: redisConnection,
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
exports.codeExecutionQueue = new bullmq_1.Queue('code-execution', queueOptions);
exports.codeSubmissionQueue = new bullmq_1.Queue('code-submission', queueOptions);
// Log queue events
exports.codeExecutionQueue.on('error', (error) => {
    console.error('Code Execution Queue Error:', error);
});
exports.codeSubmissionQueue.on('error', (error) => {
    console.error('Code Submission Queue Error:', error);
});
console.log('✅ Queues initialized');
//# sourceMappingURL=queue.config.js.map