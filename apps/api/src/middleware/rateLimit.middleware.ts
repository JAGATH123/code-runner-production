import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30'), // 30 requests per minute
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for code execution (to prevent abuse)
export const executionLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // 5 executions per minute
  message: {
    error: 'Too Many Requests',
    message: 'You can only submit 5 code executions per minute. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if authenticated, otherwise IP
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

// Auth endpoints rate limiter (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});
