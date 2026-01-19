import { Worker, Job, ConnectionOptions } from 'bullmq';
import { CodeExecutionJobData, Models } from '@code-runner/shared';
import { DockerExecutor } from '../executors/docker.executor';

// Redis connection configuration - use REDIS_URL if available
console.log('[CodeExecutionWorker] Redis config check:');
console.log('[CodeExecutionWorker] REDIS_URL:', process.env.REDIS_URL ? `SET (${process.env.REDIS_URL.substring(0, 30)}...)` : '❌ NOT SET');
console.log('[CodeExecutionWorker] REDIS_HOST:', process.env.REDIS_HOST || 'not set');
console.log('[CodeExecutionWorker] REDIS_PORT:', process.env.REDIS_PORT || 'not set');

const redisConnection: ConnectionOptions = process.env.REDIS_URL
  ? {
      host: new URL(process.env.REDIS_URL).hostname,
      port: parseInt(new URL(process.env.REDIS_URL).port),
      password: new URL(process.env.REDIS_URL).password || undefined,
      maxRetriesPerRequest: null,
    }
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    };

console.log('[CodeExecutionWorker] Using:', process.env.REDIS_URL ? `REDIS_URL (${redisConnection.host}:${redisConnection.port})` : `host ${redisConnection.host}:${redisConnection.port}`);

export class CodeExecutionWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'code-execution',
      async (job: Job<CodeExecutionJobData>) => {
        return await this.processJob(job);
      },
      {
        connection: redisConnection,
        concurrency: 5, // Process 5 jobs concurrently
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // per 1 second
        },
      }
    );

    this.setupEventHandlers();
  }

  private async processJob(job: Job<CodeExecutionJobData>): Promise<void> {
    console.log(`[CodeExecution] Processing job ${job.data.jobId}`);

    try {
      // Update status to processing
      await Models.ExecutionResult.updateOne(
        { jobId: job.data.jobId },
        { status: 'processing' }
      );

      // Execute code using Docker
      const result = await DockerExecutor.executeCode(
        job.data.code,
        '' // No input for simple execution
      );

      // Save result to database
      await Models.ExecutionResult.updateOne(
        { jobId: job.data.jobId },
        {
          status: 'completed',
          result: {
            stdout: result.stdout,
            stderr: result.stderr,
            status: result.status,
            executionTime: result.executionTime,
          },
          completedAt: new Date(),
        }
      );

      console.log(`[CodeExecution] Job ${job.data.jobId} completed - ${result.status}`);
    } catch (error) {
      console.error(`[CodeExecution] Job ${job.data.jobId} failed:`, error);

      // Save error to database
      await Models.ExecutionResult.updateOne(
        { jobId: job.data.jobId },
        {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        }
      );

      throw error; // Re-throw for BullMQ retry logic
    }
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('Worker error:', err);
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
