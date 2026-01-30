import { z } from 'zod';

// =============================================================================
// Environment Validation
// =============================================================================

// Base environment schema (required by all services)
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});

// API service environment schema
const apiEnvSchema = baseEnvSchema.extend({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  PORT: z.string().optional(),
});

// Runner service environment schema
const runnerEnvSchema = baseEnvSchema.extend({
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  SANDBOX_IMAGE: z.string().optional(),
  CONTAINER_POOL_MIN: z.string().optional(),
  CONTAINER_POOL_MAX: z.string().optional(),
});

// Web service environment schema
const webEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
});

type ServiceType = 'api' | 'runner' | 'web';

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
export function validateEnv(service: ServiceType = 'api') {
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
export const emailSchema = z.string().email('Invalid email address');

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters');

// Code validation
export const codeSchema = z
  .string()
  .min(1, 'Code cannot be empty')
  .max(50000, 'Code is too long (max 50,000 characters)');

// Problem ID validation
export const problemIdSchema = z.number().int().positive('Problem ID must be a positive integer');

// Age group validation
export const ageGroupSchema = z.enum(['11-14', '15-18']);

// Helper function to validate data against a schema
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
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
