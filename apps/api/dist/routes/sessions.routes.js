"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@code-runner/shared");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
router.use(rateLimit_middleware_1.apiLimiter);
/**
 * GET /sessions/:id
 * Get a specific session by ID with its problems
 */
router.get('/:id', auth_middleware_1.optionalAuthMiddleware, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        if (isNaN(sessionId)) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }
        // Get all problems for this session
        const problems = await shared_1.Models.Problem.find({ session_id: sessionId }).sort({
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
    }
    catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});
exports.default = router;
//# sourceMappingURL=sessions.routes.js.map