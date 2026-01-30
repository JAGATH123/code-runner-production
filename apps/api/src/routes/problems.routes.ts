import { Router, Request, Response } from 'express';
import { Models } from '@code-runner/shared';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimit.middleware';
import { unescapeObject } from '../utils/unescape';

const router = Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

/**
 * GET /problems
 * Get all problems
 */
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const problems = await Models.Problem.find().sort({ problem_id: 1 });
    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

/**
 * GET /problems/:id
 * Get a specific problem by ID
 */
router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const problemId = parseInt(req.params.id);

    if (isNaN(problemId)) {
      return res.status(400).json({ error: 'Invalid problem ID' });
    }

    console.log(`[DEBUG] Looking for problem_id: ${problemId}`);
    const problem = await Models.Problem.findOne({ problem_id: problemId }).lean();
    console.log(`[DEBUG] Found problem:`, problem ? `ID ${(problem as any).problem_id} - ${(problem as any).title}` : 'NULL');

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Unescape special characters (convert \n to actual newlines, etc.)
    const unescapedProblem = unescapeObject(problem);
    res.json(unescapedProblem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

/**
 * GET /problems/:id/test-cases
 * Get test cases for a problem
 */
router.get('/:id/test-cases', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const problemId = parseInt(req.params.id);

    if (isNaN(problemId)) {
      return res.status(400).json({ error: 'Invalid problem ID' });
    }

    // Get only visible test cases (is_hidden: false)
    const testCases = await Models.TestCase.find({
      problem_id: problemId,
      is_hidden: false,
    }).sort({ test_case_id: 1 }).lean();

    // Unescape special characters in test cases
    const unescapedTestCases = unescapeObject(testCases);
    res.json(unescapedTestCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({ error: 'Failed to fetch test cases' });
  }
});

/**
 * GET /problems/:id/test-cases/all
 * Get ALL test cases for a problem (including hidden ones)
 * This will be used by the runner service
 */
router.get('/:id/test-cases/all', async (req: Request, res: Response) => {
  try {
    const problemId = parseInt(req.params.id);

    if (isNaN(problemId)) {
      return res.status(400).json({ error: 'Invalid problem ID' });
    }

    // Get all test cases including hidden ones
    const testCases = await Models.TestCase.find({
      problem_id: problemId,
    }).sort({ test_case_id: 1 }).lean();

    // Unescape special characters in test cases (important for runner)
    const unescapedTestCases = unescapeObject(testCases);
    res.json(unescapedTestCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({ error: 'Failed to fetch test cases' });
  }
});

export default router;
