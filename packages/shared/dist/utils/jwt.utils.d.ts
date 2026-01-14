import { AuthToken } from '../types';
export declare function generateToken(payload: Omit<AuthToken, 'iat' | 'exp'>): string;
export declare function verifyToken(token: string): AuthToken;
export declare function decodeToken(token: string): AuthToken | null;
//# sourceMappingURL=jwt.utils.d.ts.map