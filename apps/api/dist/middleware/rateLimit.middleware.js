"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.executionLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// General API rate limiter
exports.apiLimiter = (0, express_rate_limit_1.default)({
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
exports.executionLimiter = (0, express_rate_limit_1.default)({
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
exports.authLimiter = (0, express_rate_limit_1.default)({
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
//# sourceMappingURL=rateLimit.middleware.js.map