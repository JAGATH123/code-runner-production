"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeSubmissionQueue = exports.codeExecutionQueue = exports.redis = void 0;
exports.initializeQueues = initializeQueues;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
let initialized = false;
// Initialize queues - call this AFTER dotenv.config() has run
function initializeQueues() {
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
    exports.redis = process.env.REDIS_URL
        ? new ioredis_1.default(process.env.REDIS_URL, { maxRetriesPerRequest: null })
        : new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: null,
        });
    // Queue options - use connection config
    const queueOptions = {
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
    initialized = true;
}
//# sourceMappingURL=queue.config.js.map