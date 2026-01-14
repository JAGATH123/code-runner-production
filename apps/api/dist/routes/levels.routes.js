"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@code-runner/shared");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
router.use(rateLimit_middleware_1.apiLimiter);
/**
 * GET /levels/:age_group
 * Get all levels for a specific age group
 */
router.get('/:age_group', auth_middleware_1.optionalAuthMiddleware, async (req, res) => {
    try {
        const { age_group } = req.params;
        // Validate age group
        if (age_group !== '11-14' && age_group !== '15-18') {
            return res.status(400).json({
                error: 'Invalid age group. Must be "11-14" or "15-18"',
            });
        }
        // Since we don't have a Level model in shared (problems are stored with level info),
        // we need to aggregate levels from problems
        const levels = await shared_1.Models.Problem.aggregate([
            { $match: { age_group } },
            {
                $group: {
                    _id: '$level_number',
                    level_number: { $first: '$level_number' },
                    age_group: { $first: '$age_group' },
                    problems: { $push: '$$ROOT' },
                },
            },
            { $sort: { level_number: 1 } },
        ]);
        // Transform the aggregated data to match the Level interface
        const formattedLevels = levels.map((level) => {
            // Group problems into sessions
            const sessionMap = new Map();
            level.problems.forEach((problem) => {
                if (!sessionMap.has(problem.session_id)) {
                    sessionMap.set(problem.session_id, {
                        session_id: problem.session_id,
                        level_id: level.level_number,
                        session_number: sessionMap.size + 1,
                        title: problem.session_title || `Session ${sessionMap.size + 1}`,
                        description: problem.session_introduction || '',
                        introduction_content: problem.session_introduction || '',
                        problems: [],
                    });
                }
                sessionMap.get(problem.session_id).problems.push(problem);
            });
            const sessions = Array.from(sessionMap.values());
            // Generate meaningful session titles ONLY when missing or generic (e.g., "Session 1", "Session 2")
            // Don't overwrite existing descriptive titles like "Session 7: User-Defined Functions"
            sessions.forEach((session, index) => {
                const isGenericTitle = !session.title || /^Session \d+$/.test(session.title);
                if (isGenericTitle) {
                    // Analyze problem titles to generate a meaningful session title
                    const problemTitles = session.problems.map((p) => p.title?.toLowerCase() || '');
                    const sessionText = problemTitles.join(' ');
                    // Generate session title based on content
                    if (sessionText.includes('print') && sessionText.includes('output')) {
                        session.title = `Session ${index + 1}: Print & Output`;
                    }
                    else if (sessionText.includes('variable') && !sessionText.includes('input')) {
                        session.title = `Session ${index + 1}: Variables`;
                    }
                    else if (sessionText.includes('input') && sessionText.includes('variable')) {
                        session.title = `Session ${index + 1}: Variables & Input`;
                    }
                    else if (sessionText.includes('data type') || sessionText.includes('int') || sessionText.includes('float')) {
                        session.title = `Session ${index + 1}: Data Types`;
                    }
                    else if (sessionText.includes('if') || sessionText.includes('condition') || sessionText.includes('else')) {
                        session.title = `Session ${index + 1}: Conditionals`;
                    }
                    else if (sessionText.includes('while') || sessionText.includes('for') || sessionText.includes('loop')) {
                        session.title = `Session ${index + 1}: Loops`;
                    }
                    else if (sessionText.includes('function') || sessionText.includes('def')) {
                        session.title = `Session ${index + 1}: Functions`;
                    }
                    else if (sessionText.includes('list') || sessionText.includes('array')) {
                        session.title = `Session ${index + 1}: Lists`;
                    }
                    else if (sessionText.includes('string') || sessionText.includes('text')) {
                        session.title = `Session ${index + 1}: Strings`;
                    }
                    else if (sessionText.includes('tuple') || sessionText.includes('set') || sessionText.includes('dict')) {
                        session.title = `Session ${index + 1}: Data Structures`;
                    }
                    else {
                        // Use first problem title as hint
                        const firstProblemTitle = session.problems[0]?.title || '';
                        if (firstProblemTitle) {
                            // Extract key concepts from first problem title
                            const words = firstProblemTitle.split(' ');
                            const keyWord = words.find((w) => w.length > 4) || words[0];
                            session.title = `Session ${index + 1}: ${keyWord}`;
                        }
                        else {
                            session.title = `Session ${index + 1}: Coding Challenges`;
                        }
                    }
                }
            });
            // Generate description from session count and difficulty
            const difficulties = new Set(level.problems.map((p) => p.difficulty));
            const difficultyText = Array.from(difficulties).join(', ');
            return {
                level_id: level.level_number,
                level_number: level.level_number,
                title: `Mission ${level.level_number}: Code Convergence`,
                age_group: level.age_group,
                description: `Complete ${level.problems.length} challenges across ${sessions.length} sessions`,
                sessions,
            };
        });
        res.json(formattedLevels);
    }
    catch (error) {
        console.error('Error fetching levels:', error);
        res.status(500).json({ error: 'Failed to fetch levels' });
    }
});
exports.default = router;
//# sourceMappingURL=levels.routes.js.map