"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const shared_1 = require("@code-runner/shared");
function authMiddleware(req, res, next) {
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
        const decoded = (0, shared_1.verifyToken)(token);
        // Attach user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
}
// Optional auth middleware (doesn't fail if no token)
function optionalAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            req.user = (0, shared_1.verifyToken)(token);
        }
        next();
    }
    catch (error) {
        // Ignore token errors in optional auth
        next();
    }
}
//# sourceMappingURL=auth.middleware.js.map