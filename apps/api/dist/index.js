"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTANT: Load environment variables FIRST, before any other imports
// This ensures REDIS_URL and other env vars are available when modules load
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// For CommonJS (since we're using type: commonjs)
const envLocalPath = path_1.default.resolve(__dirname, '../.env.local');
console.log('Loading .env.local from:', envLocalPath);
const result = dotenv_1.default.config({ path: envLocalPath });
if (result.error) {
    console.log('⚠️  Failed to load .env.local:', result.error.message);
}
else {
    console.log('✅ Loaded .env.local');
}
dotenv_1.default.config(); // Load .env as fallback
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
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
const cheatsheets_routes_1 = __importDefault(require("./routes/cheatsheets.routes"));
// Import Redis and queue initializer (AFTER dotenv is loaded)
const queue_config_1 = require("./queue/queue.config");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Force cache bust for Railway deployment
const BUILD_ID = '20260119-1';
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
// Redis health check endpoint
app.get('/health/redis', async (req, res) => {
    try {
        // Test Redis connection
        await queue_config_1.redis.ping();
        // Get Redis info
        const redisStatus = queue_config_1.redis.status;
        res.json({
            status: 'healthy',
            redis: {
                connected: redisStatus === 'ready',
                status: redisStatus,
                host: queue_config_1.redis.options.host || 'unknown',
                port: queue_config_1.redis.options.port || 'unknown',
            },
            environment: {
                REDIS_URL: process.env.REDIS_URL ? '✅ Set' : '❌ Not set',
                REDIS_HOST: process.env.REDIS_HOST || 'not set',
                REDIS_PORT: process.env.REDIS_PORT || 'not set',
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            redis: {
                connected: false,
                status: queue_config_1.redis.status,
            },
            environment: {
                REDIS_URL: process.env.REDIS_URL ? '✅ Set' : '❌ Not set',
                REDIS_HOST: process.env.REDIS_HOST || 'not set',
                REDIS_PORT: process.env.REDIS_PORT || 'not set',
            },
            timestamp: new Date().toISOString(),
        });
    }
});
// API Routes
app.use('/auth', auth_routes_1.default);
app.use('/problems', problems_routes_1.default);
app.use('/levels', levels_routes_1.default);
app.use('/sessions', sessions_routes_1.default);
app.use('/execution', execution_routes_1.default); // New queue-based execution
app.use('/progress', progress_routes_1.default);
app.use('/cheatsheets', cheatsheets_routes_1.default);
// 404 handler
app.use(notFoundHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Start server
async function startServer() {
    try {
        // Initialize queues (must be called after dotenv.config())
        (0, queue_config_1.initializeQueues)();
        // Connect to MongoDB
        console.log('🔍 MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 70) + '...');
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