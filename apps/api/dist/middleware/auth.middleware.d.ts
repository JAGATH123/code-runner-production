import { Request, Response, NextFunction } from 'express';
import { AuthToken } from '@code-runner/shared';
declare global {
    namespace Express {
        interface Request {
            user?: AuthToken;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void;
