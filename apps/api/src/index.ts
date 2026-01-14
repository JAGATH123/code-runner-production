import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectToDatabase } from '@code-runner/shared';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import problemsRoutes from './routes/problems.routes';
import levelsRoutes from './routes/levels.routes';
import sessionsRoutes from './routes/sessions.routes';
import executionRoutes from './routes/execution.routes';
import progressRoutes from './routes/progress.routes';
import authRoutes from './routes/auth.routes';

// Load environment variables - prioritize .env.local over .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // Load .env as fallback

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - support multiple origins
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

console.log('🔐 CORS allowed origins:', corsOrigins);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'code-runner-api',
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/problems', problemsRoutes);
app.use('/levels', levelsRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/execution', executionRoutes); // New queue-based execution
app.use('/progress', progressRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ API Server running on http://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
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

export default app;
