"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@code-runner/shared");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
// Apply rate limiting to all routes
router.use(rateLimit_middleware_1.apiLimiter);
/**
 * GET /problems
 * Get all problems
 */
router.get('/', auth_middleware_1.optionalAuthMiddleware, async (req, res) => {
    try {
        const problems = await shared_1.Models.Problem.find().sort({ problem_id: 1 });
        res.json(problems);
    }
    catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});
/**
 * GET /problems/:id
 * Get a specific problem by ID
 */
router.get('/:id', auth_middleware_1.optionalAuthMiddleware, async (req, res) => {
    try {
        const problemId = parseInt(req.params.id);
        if (isNaN(problemId)) {
            return res.status(400).json({ error: 'Invalid problem ID' });
        }
        const problem = await shared_1.Models.Problem.findOne({ problem_id: problemId });
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }
        res.json(problem);
    }
    catch (error) {
        console.error('Error fetching problem:', error);
        res.status(500).json({ error: 'Failed to fetch problem' });
    }
});
/**
 * GET /problems/:id/test-cases
 * Get test cases for a problem
 */
router.get('/:id/test-cases', auth_middleware_1.optionalAuthMiddleware, async (req, res) => {
    try {
        const problemId = parseInt(req.params.id);
        if (isNaN(problemId)) {
            return res.status(400).json({ error: 'Invalid problem ID' });
        }
        // Get only visible test cases (is_hidden: false)
        const testCases = await shared_1.Models.TestCase.find({
            problem_id: problemId,
            is_hidden: false,
        }).sort({ test_case_id: 1 });
        res.json(testCases);
    }
    catch (error) {
        console.error('Error fetching test cases:', error);
        res.status(500).json({ error: 'Failed to fetch test cases' });
    }
});
/**
 * GET /problems/:id/test-cases/all
 * Get ALL test cases for a problem (including hidden ones)
 * This will be used by the runner service
 */
router.get('/:id/test-cases/all', async (req, res) => {
    try {
        const problemId = parseInt(req.params.id);
        if (isNaN(problemId)) {
            return res.status(400).json({ error: 'Invalid problem ID' });
        }
        // Get all test cases including hidden ones
        const testCases = await shared_1.Models.TestCase.find({
            problem_id: problemId,
        }).sort({ test_case_id: 1 });
        res.json(testCases);
    }
    catch (error) {
        console.error('Error fetching test cases:', error);
        res.status(500).json({ error: 'Failed to fetch test cases' });
    }
});
exports.default = router;
//# sourceMappingURL=problems.routes.js.map