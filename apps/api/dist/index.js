"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const shared_1 = require("@code-runner/shared");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
// Import routes
const problems_routes_1 = __importDefault(require("./routes/problems.routes"));
const levels_routes_1 = __importDefault(require("./routes/levels.routes"));
const sessions_routes_1 = __importDefault(require("./routes/sessions.routes"));
const execution_routes_1 = __importDefault(require("./routes/execution.routes"));
const progress_routes_1 = __importDefault(require("./routes/progress.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
// Load environment variables - prioritize .env.local over .env
dotenv_1.default.config({ path: '.env.local' });
dotenv_1.default.config(); // Load .env as fallback
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, helmet_1.default)()); // Security headers
// CORS configuration - support multiple origins
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];
console.log('🔐 CORS allowed origins:', corsOrigins);
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev')); // Logging
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'code-runner-api',
    });
});
// API Routes
app.use('/auth', auth_routes_1.default);
app.use('/problems', problems_routes_1.default);
app.use('/levels', levels_routes_1.default);
app.use('/sessions', sessions_routes_1.default);
app.use('/execution', execution_routes_1.default); // New queue-based execution
app.use('/progress', progress_routes_1.default);
// 404 handler
app.use(notFoundHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Start server
async function startServer() {
    try {
        // Connect to MongoDB
        await (0, shared_1.connectToDatabase)();
        console.log('✅ Connected to MongoDB');
        // Start Express server
        app.listen(PORT, () => {
            console.log(`✅ API Server running on http://localhost:${PORT}`);
            console.log(`✅ Health check: http://localhost:${PORT}/health`);
            console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
// Start the server
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map