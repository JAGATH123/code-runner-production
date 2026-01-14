import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const usernameSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const codeSchema: z.ZodString;
export declare const problemIdSchema: z.ZodNumber;
export declare const ageGroupSchema: z.ZodEnum<["11-14", "15-18"]>;
export declare function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: string[];
};
//# sourceMappingURL=validation.utils.d.ts.map