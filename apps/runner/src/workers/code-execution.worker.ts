import { Worker, Job, ConnectionOptions } from 'bullmq';
import { CodeExecutionJobData, Models, getLogger } from '@code-runner/shared';
import { DockerExecutor } from '../executors/docker.executor';

const logger = getLogger('code-execution-worker');

export class CodeExecutionWorker {
  private worker: Worker;

  constructor() {
    // Redis connection configuration - configured in constructor to ensure env vars are loaded
    logger.info('Initializing CodeExecutionWorker', {
      redisUrl: process.env.REDIS_URL ? `SET (${process.env.REDIS_URL.substring(0, 30)}...)` : 'NOT SET',
      redisHost: process.env.REDIS_HOST || 'not set',
      redisPort: process.env.REDIS_PORT || 'not set',
    });

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

    logger.info('Redis connection configured', {
      source: process.env.REDIS_URL ? 'REDIS_URL' : 'REDIS_HOST/PORT',
      host: redisConnection.host,
      port: redisConnection.port,
    });

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
    logger.info('Processing code execution job', { jobId: job.data.jobId });

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

      // Save result to database (including files if any)
      await Models.ExecutionResult.updateOne(
        { jobId: job.data.jobId },
        {
          status: 'completed',
          result: {
            stdout: result.stdout,
            stderr: result.stderr,
            status: result.status,
            executionTime: result.executionTime,
            exitCode: result.exitCode,
            // Include generated files (images, etc.)
            files: result.files,
          },
          completedAt: new Date(),
        }
      );

      logger.info('Code execution job completed', {
        jobId: job.data.jobId,
        status: result.status,
        executionTime: result.executionTime,
        filesCount: result.files?.length || 0,
      });

    } catch (error) {
      logger.error('Code execution job failed', {
        jobId: job.data.jobId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

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
      logger.info('Job completed successfully', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Job failed', {
        jobId: job?.id,
        error: err.message,
        stack: err.stack,
      });
    });

    this.worker.on('error', (err) => {
      logger.error('Worker error', {
        error: err.message,
        stack: err.stack,
      });
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
