import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Lazy Redis store creation - stores are created on first use
let storesCreated = false;
let stores: Record<string, any> = {};

function getRedisStore(prefix: string) {
  if (!stores[prefix]) {
    // Lazy import redis to ensure it's initialized
    const { redis } = require('../queue/queue.config');

    stores[prefix] = new RedisStore({
      // @ts-ignore - ioredis client compatibility
      sendCommand: async (...args: any[]) => {
        const command = args[0];
        const commandArgs = args.slice(1);

        // ioredis uses direct method calls
        if (command.toUpperCase() === 'SCRIPT') {
          return await redis.script(...commandArgs);
        }

        const method = command.toLowerCase();
        if (typeof redis[method] === 'function') {
          return await redis[method](...commandArgs);
        }

        throw new Error(`Redis command not supported: ${command}`);
      },
      prefix: `rl:${prefix}:`,
    });
  }
  return stores[prefix];
}

// General API rate limiter (Redis store created lazily)
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per minute
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use getter to defer store creation until first request
  get store() { return getRedisStore('api'); },
});

// Per-user execution rate limit (short window)
export const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 executions per minute per user
  message: {
    error: 'Too Many Executions',
    message: 'Too many code executions. Please wait before running more code.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip || 'anonymous',
  get store() { return getRedisStore('exec'); },
});

// Per-user daily execution limit
export const dailyExecutionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.DAILY_EXECUTION_LIMIT || '500'), // 500 executions per day
  message: {
    error: 'Daily Limit Reached',
    message: 'Daily execution limit reached. Try again tomorrow.',
    retryAfter: 86400,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip || 'anonymous',
  get store() { return getRedisStore('daily'); },
});

// Auth endpoints rate limiter (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    error: 'Too Many Authentication Attempts',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  get store() { return getRedisStore('auth'); },
});
