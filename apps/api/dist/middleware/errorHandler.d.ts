import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction): void;
export declare function createError(message: string, statusCode?: number): ApiError;
