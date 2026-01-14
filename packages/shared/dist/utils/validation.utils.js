"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ageGroupSchema = exports.problemIdSchema = exports.codeSchema = exports.passwordSchema = exports.usernameSchema = exports.emailSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
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