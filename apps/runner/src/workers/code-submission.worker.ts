import { Worker, Job } from 'bullmq';
import { SubmissionJobData, Models } from '@code-runner/shared';
import { DockerExecutor } from '../executors/docker.executor';

// Redis connection configuration - use REDIS_URL if available
const redisConnection = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    };

export class CodeSubmissionWorker {
  private worker: Worker;

  constructor() {
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
    console.log(`[CodeSubmission] Processing grading job ${job.data.jobId} for problem ${job.data.problemId}`);

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

      console.log(
        `[CodeSubmission] Job ${job.data.jobId} completed - ${testResults.passed}/${totalTests} tests passed (${passRate.toFixed(1)}%)`
      );

      // TODO: Update user progress when Progress model is added to shared package
      if (allPassed) {
        console.log(`[CodeSubmission] All tests passed for user ${job.data.userId} on problem ${job.data.problemId}`);
      }
    } catch (error) {
      console.error(`[CodeSubmission] Job ${job.data.jobId} failed:`, error);

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
      console.log(`✅ Grading job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Grading job ${job?.id} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('Submission worker error:', err);
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
