export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=password.utils.d.ts.map