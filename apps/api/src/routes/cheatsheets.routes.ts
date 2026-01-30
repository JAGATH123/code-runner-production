import { Router, Request, Response } from 'express';
import { Models } from '@code-runner/shared';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(apiLimiter);

/**
 * GET /cheatsheets/session/:session_id
 * Get cheat sheet for a specific session
 */
router.get('/session/:session_id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.session_id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const cheatSheet = await Models.CheatSheet.findOne({
      session_id: sessionId,
    });

    if (!cheatSheet) {
      return res.status(404).json({
        error: 'Cheat sheet not found for this session',
        session_id: sessionId,
      });
    }

    res.json(cheatSheet);
  } catch (error) {
    console.error('Error fetching cheat sheet:', error);
    res.status(500).json({ error: 'Failed to fetch cheat sheet' });
  }
});

/**
 * GET /cheatsheets/level/:age_group/:level_number
 * Get all cheat sheets for a specific level
 */
router.get('/level/:age_group/:level_number', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { age_group, level_number } = req.params;
    const levelNum = parseInt(level_number);

    if (isNaN(levelNum)) {
      return res.status(400).json({ error: 'Invalid level number' });
    }

    if (age_group !== '11-14' && age_group !== '15-18') {
      return res.status(400).json({ error: 'Invalid age group' });
    }

    const cheatSheets = await Models.CheatSheet.find({
      age_group,
      level_number: levelNum,
    }).sort({ session_id: 1 });

    res.json({
      age_group,
      level_number: levelNum,
      cheat_sheets: cheatSheets,
      count: cheatSheets.length,
    });
  } catch (error) {
    console.error('Error fetching cheat sheets:', error);
    res.status(500).json({ error: 'Failed to fetch cheat sheets' });
  }
});

/**
 * GET /cheatsheets
 * Get all cheat sheets (for admin/testing)
 */
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const cheatSheets = await Models.CheatSheet.find().sort({ session_id: 1 });

    res.json({
      cheat_sheets: cheatSheets,
      count: cheatSheets.length,
    });
  } catch (error) {
    console.error('Error fetching cheat sheets:', error);
    res.status(500).json({ error: 'Failed to fetch cheat sheets' });
  }
});

export default router;
