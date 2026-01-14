import { Router, Request, Response } from 'express';
import { Models } from '@code-runner/shared';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(apiLimiter);

/**
 * GET /sessions/:id
 * Get a specific session by ID with its problems
 */
router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    // Get all problems for this session
    const problems = await Models.Problem.find({ session_id: sessionId }).sort({
      problem_id: 1,
    });

    if (problems.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Return session info with problems
    res.json({
      session_id: sessionId,
      title: problems[0]?.session_title || `Session ${sessionId}`,
      problems,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

export default router;
