import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthToken } from '@code-runner/shared';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthToken;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

// Optional auth middleware (doesn't fail if no token)
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.user = verifyToken(token);
    }

    next();
  } catch (error) {
    // Ignore token errors in optional auth
    next();
  }
}
