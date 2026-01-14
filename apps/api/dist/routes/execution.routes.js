"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const shared_1 = require("@code-runner/shared");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const queue_config_1 = require("../queue/queue.config");
const router = (0, express_1.Router)();
/**
 * POST /execution/submit
 * Submit code for execution (returns jobId immediately)
 */
router.post('/submit', rateLimit_middleware_1.executionLimiter, auth_middleware_1.optionalAuthMiddleware, async (req, res) => {
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
        // Generate unique job ID
        const jobId = (0, uuid_1.v4)();
        // Get user ID (or use 'anonymous')
        const userId = req.user?.userId || 'anonymous';
        // Create job data
        const jobData = {
            jobId,
            userId,
            code,
            language: 'python',
            problemId,
            userSessionId,
            timestamp: Date.now(),
        };
        // Add job to queue
        await queue_config_1.codeExecutionQueue.add('execute-code', jobData, {
            jobId, // Use our UUID as job ID
        });
        // Save initial job status to database
        await shared_1.Models.ExecutionResult.create({
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
    }
    catch (error) {
        console.error('Error submitting code:', error);
        res.status(500).json({ error: 'Failed to submit code' });
    }
});
/**
 * GET /execution/result/:jobId
 * Get execution result by job ID (polling endpoint)
 */
router.get('/result/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        // Fetch result from database
        const result = await shared_1.Models.ExecutionResult.findOne({ jobId });
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
    }
    catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ error: 'Failed to fetch result' });
    }
});
/**
 * POST /execution/submit/grade
 * Submit code for grading (runs against all test cases)
 */
router.post('/submit/grade', rateLimit_middleware_1.executionLimiter, auth_middleware_1.authMiddleware, async (req, res) => {
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
        // Verify problem exists
        const problem = await shared_1.Models.Problem.findOne({ problem_id: problemId });
        if (!problem) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Problem not found',
            });
        }
        // Get all test cases (including hidden ones)
        const testCases = await shared_1.Models.TestCase.find({ problem_id: problemId });
        if (testCases.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No test cases found for this problem',
            });
        }
        // Generate unique job ID
        const jobId = (0, uuid_1.v4)();
        const userId = req.user.userId;
        // Create submission job data
        const jobData = {
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
        await queue_config_1.codeSubmissionQueue.add('grade-submission', jobData, {
            jobId,
        });
        // Save initial status
        await shared_1.Models.ExecutionResult.create({
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
    }
    catch (error) {
        console.error('Error submitting for grading:', error);
        res.status(500).json({ error: 'Failed to submit code for grading' });
    }
});
/**
 * GET /execution/queue/stats
 * Get queue statistics (for monitoring)
 */
router.get('/queue/stats', async (req, res) => {
    try {
        const [executionCounts, submissionCounts] = await Promise.all([
            queue_config_1.codeExecutionQueue.getJobCounts(),
            queue_config_1.codeSubmissionQueue.getJobCounts(),
        ]);
        res.json({
            execution: executionCounts,
            submission: submissionCounts,
        });
    }
    catch (error) {
        console.error('Error fetching queue stats:', error);
        res.status(500).json({ error: 'Failed to fetch queue statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=execution.routes.js.map