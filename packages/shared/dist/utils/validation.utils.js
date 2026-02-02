"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ageGroupSchema = exports.problemIdSchema = exports.codeSchema = exports.passwordSchema = exports.usernameSchema = exports.emailSchema = void 0;
exports.validateEnv = validateEnv;
exports.validate = validate;
const zod_1 = require("zod");
// =============================================================================
// Environment Validation
// =============================================================================
// Base environment schema (required by all services)
const baseEnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production']).default('development'),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});
// API service environment schema
const apiEnvSchema = baseEnvSchema.extend({
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    REDIS_URL: zod_1.z.string().optional(),
    REDIS_HOST: zod_1.z.string().optional(),
    REDIS_PORT: zod_1.z.string().optional(),
    CORS_ORIGIN: zod_1.z.string().optional(),
    PORT: zod_1.z.string().optional(),
});
// Runner service environment schema
const runnerEnvSchema = baseEnvSchema.extend({
    REDIS_URL: zod_1.z.string().optional(),
    REDIS_HOST: zod_1.z.string().optional(),
    SANDBOX_IMAGE: zod_1.z.string().optional(),
    CONTAINER_POOL_MIN: zod_1.z.string().optional(),
    CONTAINER_POOL_MAX: zod_1.z.string().optional(),
});
// Web service environment schema
const webEnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production']).default('development'),
    NEXT_PUBLIC_API_URL: zod_1.z.string().optional(),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
});
const schemaMap = {
    api: apiEnvSchema,
    runner: runnerEnvSchema,
    web: webEnvSchema,
};
/**
 * Validate environment variables at startup.
 * Call this at the start of each service to ensure required env vars are set.
 * Throws an error and exits if validation fails.
 */
function validateEnv(service = 'api') {
    const schema = schemaMap[service];
    const result = schema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Environment validation failed:');
        result.error.issues.forEach(issue => {
            console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
        });
        console.error('');
        console.error('Please set the required environment variables and restart.');
        process.exit(1);
    }
    console.log(`✅ Environment validation passed for ${service} service`);
    return result.data;
}
// =============================================================================
// Data Validation Schemas
// =============================================================================
// Email validation
exports.emailSchema = zod_1.z.string().email('Invalid email address');
// Username validation
exports.usernameSchema = zod_1.z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores');
// Password validation
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters');
// Code validation
exports.codeSchema = zod_1.z
    .string()
    .min(1, 'Code cannot be empty')
    .max(50000, 'Code is too long (max 50,000 characters)');
// Problem ID validation
exports.problemIdSchema = zod_1.z.number().int().positive('Problem ID must be a positive integer');
// Age group validation
exports.ageGroupSchema = zod_1.z.enum(['11-14', '15-18']);
// Helper function to validate data against a schema
function validate(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    return {
        success: false,
        errors: result.error.errors.map((err) => err.message),
    };
}
//# sourceMappingURL=validation.utils.js.map