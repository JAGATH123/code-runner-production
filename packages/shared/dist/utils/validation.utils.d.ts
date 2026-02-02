import { z } from 'zod';
type ServiceType = 'api' | 'runner' | 'web';
/**
 * Validate environment variables at startup.
 * Call this at the start of each service to ensure required env vars are set.
 * Throws an error and exits if validation fails.
 */
export declare function validateEnv(service?: ServiceType): {
    MONGODB_URI: string;
    JWT_SECRET: string;
    NODE_ENV: "development" | "staging" | "production";
    REDIS_URL?: string | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PORT?: string | undefined;
    CORS_ORIGIN?: string | undefined;
    PORT?: string | undefined;
} | {
    JWT_SECRET: string;
    NODE_ENV: "development" | "staging" | "production";
    REDIS_URL?: string | undefined;
    REDIS_HOST?: string | undefined;
    SANDBOX_IMAGE?: string | undefined;
    CONTAINER_POOL_MIN?: string | undefined;
    CONTAINER_POOL_MAX?: string | undefined;
} | {
    MONGODB_URI: string;
    NODE_ENV: "development" | "staging" | "production";
    NEXT_PUBLIC_API_URL?: string | undefined;
};
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
export {};
//# sourceMappingURL=validation.utils.d.ts.map