import dotenv from 'dotenv';
import { connectToDatabase } from '@code-runner/shared';
import { DockerExecutor } from './executors/docker.executor';
import { CodeExecutionWorker } from './workers/code-execution.worker';
import { CodeSubmissionWorker } from './workers/code-submission.worker';

// Load environment variables
dotenv.config();

let executionWorker: CodeExecutionWorker;
let submissionWorker: CodeSubmissionWorker;

async function startRunner() {
  try {
    console.log('🚀 Starting Code Runner Worker Service...');

    // Connect to MongoDB
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Initialize Docker executor
    await DockerExecutor.initialize();
    console.log('✅ Docker executor initialized');

    // Start BullMQ workers
    executionWorker = new CodeExecutionWorker();
    console.log('✅ Code execution worker started');

    submissionWorker = new CodeSubmissionWorker();
    console.log('✅ Code submission worker started');

    console.log('🎉 Runner service is ready to process jobs!');
    console.log('Environment:', process.env.NODE_ENV || 'development');
  } catch (error) {
    console.error('❌ Failed to start runner service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down runner service...');

  try {
    if (executionWorker) {
      await executionWorker.close();
      console.log('✅ Code execution worker closed');
    }

    if (submissionWorker) {
      await submissionWorker.close();
      console.log('✅ Code submission worker closed');
    }

    console.log('✅ Runner service shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});

// Start the runner service
startRunner();
