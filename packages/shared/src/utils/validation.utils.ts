import { z } from 'zod';

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
