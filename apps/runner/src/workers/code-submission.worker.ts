import { Worker, Job, ConnectionOptions } from 'bullmq';
import { SubmissionJobData, Models, getLogger } from '@code-runner/shared';
import { DockerExecutor } from '../executors/docker.executor';

const logger = getLogger('code-submission-worker');

export class CodeSubmissionWorker {
  private worker: Worker;

  constructor() {
    // Redis connection configuration - configured in constructor to ensure env vars are loaded
    logger.info('Initializing CodeSubmissionWorker', {
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
      'code-submission',
      async (job: Job<SubmissionJobData>) => {
        return await this.processJob(job);
      },
      {
        connection: redisConnection,
        concurrency: 3, // Lower concurrency for grading (more resource intensive)
        limiter: {
          max: 5, // Max 5 grading jobs
          duration: 1000, // per 1 second
        },
      }
    );

    this.setupEventHandlers();
  }

  private async processJob(job: Job<SubmissionJobData>): Promise<void> {
    logger.info('Processing grading job', {
      jobId: job.data.jobId,
      problemId: job.data.problemId,
      userId: job.data.userId,
    });

    try {
      // Update status to processing
      await Models.ExecutionResult.updateOne(
        { jobId: job.data.jobId },
        { status: 'processing' }
      );

      // Execute code against all test cases
      const testResults = await DockerExecutor.executeWithTestCases(
        job.data.code,
        job.data.testCases
      );

      // Calculate pass rate
      const totalTests = testResults.results.length;
      const passRate = (testResults.passed / totalTests) * 100;
      const allPassed = testResults.passed === totalTests;

      // Save submission result to database
      await Models.ExecutionResult.updateOne(
        { jobId: job.data.jobId },
        {
          status: 'completed',
          submissionResult: {
            testResults: testResults.results.map((r, i) => ({
              ...r,
              is_hidden: job.data.testCases[i].is_hidden,
            })),
            passed: testResults.passed,
            failed: testResults.failed,
            total: totalTests,
            passRate,
            allPassed,
            executionTime: testResults.totalExecutionTime,
          },
          completedAt: new Date(),
        }
      );

      logger.info('Grading job completed', {
        jobId: job.data.jobId,
        passed: testResults.passed,
        total: totalTests,
        passRate: passRate.toFixed(1),
        allPassed,
        executionTime: testResults.totalExecutionTime,
      });

      // TODO: Update user progress when Progress model is added to shared package
      if (allPassed) {
        logger.info('All tests passed', {
          userId: job.data.userId,
          problemId: job.data.problemId,
        });
      }
    } catch (error) {
      logger.error('Grading job failed', {
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
      logger.info('Grading job completed successfully', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Grading job failed', {
        jobId: job?.id,
        error: err.message,
        stack: err.stack,
      });
    });

    this.worker.on('error', (err) => {
      logger.error('Submission worker error', {
        error: err.message,
        stack: err.stack,
      });
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
