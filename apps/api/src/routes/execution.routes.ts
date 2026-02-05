import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Models, CodeExecutionJobData, SubmissionJobData } from '@code-runner/shared';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth.middleware';
import { executionLimiter, dailyExecutionLimiter } from '../middleware/rateLimit.middleware';
import { codeExecutionQueue, codeSubmissionQueue } from '../queue/queue.config';

const router = Router();

// Queue backpressure settings
const MAX_QUEUE_DEPTH = parseInt(process.env.MAX_QUEUE_DEPTH || '200');

/**
 * POST /execution/submit
 * Submit code for execution (returns jobId immediately)
 */
router.post('/submit', executionLimiter, dailyExecutionLimiter, optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { code, problemId, userSessionId } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Code is required and must be a string',
      });
    }

    if (code.length > 50000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Code is too long (max 50,000 characters)',
      });
    }

    // Check queue depth (backpressure) - reject if system is overloaded
    const jobCounts = await codeExecutionQueue.getJobCounts();
    const queueDepth = jobCounts.waiting + jobCounts.active;

    if (queueDepth >= MAX_QUEUE_DEPTH) {
      return res.status(503).json({
        error: 'System Busy',
        message: 'System is currently overloaded. Please try again in a few seconds.',
        queueDepth,
        estimatedWait: `${Math.ceil(queueDepth / 10)} seconds`,
      });
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Get user ID (or use 'anonymous')
    const userId = req.user?.userId || 'anonymous';

    // Create job data
    const jobData: CodeExecutionJobData = {
      jobId,
      userId,
      code,
      language: 'python',
      problemId,
      userSessionId,
      timestamp: Date.now(),
    };

    // Add job to queue
    await codeExecutionQueue.add('execute-code', jobData, {
      jobId, // Use our UUID as job ID
    });

    // Save initial job status to database
    await Models.ExecutionResult.create({
      jobId,
      userId,
      problemId,
      code,
      status: 'pending',
      createdAt: new Date(),
    });

    // Return job ID immediately
    res.json({
      jobId,
      status: 'queued',
      message: 'Code submitted for execution',
    });
  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: 'Failed to submit code' });
  }
});

/**
 * GET /execution/result/:jobId
 * Get execution result by job ID (polling endpoint)
 */
router.get('/result/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // Fetch result from database
    const result = await Models.ExecutionResult.findOne({ jobId });

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found',
      });
    }

    // Return result
    res.json({
      jobId: result.jobId,
      status: result.status,
      result: result.result,
      submissionResult: result.submissionResult,
      error: result.error,
      createdAt: result.createdAt,
      completedAt: result.completedAt,
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

/**
 * POST /execution/submit/grade
 * Submit code for grading (runs against all test cases)
 */
// TODO: Change back to authMiddleware after implementing user authentication
router.post('/submit/grade', executionLimiter, dailyExecutionLimiter, optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { code, problemId } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Code is required',
      });
    }

    if (!problemId || typeof problemId !== 'number') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID is required',
      });
    }

    // Check queue depth (backpressure) - reject if system is overloaded
    const jobCounts = await codeSubmissionQueue.getJobCounts();
    const queueDepth = jobCounts.waiting + jobCounts.active;

    if (queueDepth >= MAX_QUEUE_DEPTH) {
      return res.status(503).json({
        error: 'System Busy',
        message: 'Grading system is currently overloaded. Please try again in a few seconds.',
        queueDepth,
        estimatedWait: `${Math.ceil(queueDepth / 10)} seconds`,
      });
    }

    // Verify problem exists
    const problem = await Models.Problem.findOne({ problem_id: problemId });
    if (!problem) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Problem not found',
      });
    }

    // Get all test cases (including hidden ones)
    const testCases = await Models.TestCase.find({ problem_id: problemId });

    if (testCases.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No test cases found for this problem',
      });
    }

    // Generate unique job ID
    const jobId = uuidv4();
    const userId = req.user?.userId || 'anonymous';

    // Create submission job data
    const jobData: SubmissionJobData = {
      jobId,
      userId,
      code,
      problemId,
      testCases: testCases.map((tc) => ({
        input: tc.input,
        expected_output: tc.expected_output,
        is_hidden: tc.is_hidden,
      })),
      timestamp: Date.now(),
    };

    // Add job to submission queue
    await codeSubmissionQueue.add('grade-submission', jobData, {
      jobId,
    });

    // Save initial status
    await Models.ExecutionResult.create({
      jobId,
      userId,
      problemId,
      code,
      status: 'pending',
      createdAt: new Date(),
    });

    res.json({
      jobId,
      status: 'queued',
      message: 'Code submitted for grading',
      testCaseCount: testCases.length,
    });
  } catch (error) {
    console.error('Error submitting for grading:', error);
    res.status(500).json({ error: 'Failed to submit code for grading' });
  }
});

/**
 * GET /execution/queue/stats
 * Get queue statistics (for monitoring)
 */
router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    const [executionCounts, submissionCounts] = await Promise.all([
      codeExecutionQueue.getJobCounts(),
      codeSubmissionQueue.getJobCounts(),
    ]);

    res.json({
      execution: executionCounts,
      submission: submissionCounts,
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({ error: 'Failed to fetch queue statistics' });
  }
});

export default router;
