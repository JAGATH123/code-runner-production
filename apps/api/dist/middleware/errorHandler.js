"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createError = createError;
function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Log error for debugging
    console.error(`[Error] ${statusCode} - ${message}`);
    console.error(err.stack);
    // Send error response
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
function createError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
}
//# sourceMappingURL=errorHandler.js.map