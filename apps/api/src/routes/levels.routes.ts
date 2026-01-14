import { Router, Request, Response } from 'express';
import { Models } from '@code-runner/shared';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(apiLimiter);

/**
 * GET /levels/:age_group
 * Get all levels for a specific age group
 */
router.get('/:age_group', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { age_group } = req.params;

    // Validate age group
    if (age_group !== '11-14' && age_group !== '15-18') {
      return res.status(400).json({
        error: 'Invalid age group. Must be "11-14" or "15-18"',
      });
    }

    // Since we don't have a Level model in shared (problems are stored with level info),
    // Fetch all problems and group manually (Mongoose aggregation has limits)
    const allProblems = await Models.Problem.find({ age_group }).lean();
    console.log(`[DEBUG] Found ${allProblems.length} total problems for age group ${age_group}`);

    // Group by level_number manually
    const levelMap = new Map();
    allProblems.forEach((problem: any) => {
      if (!levelMap.has(problem.level_number)) {
        levelMap.set(problem.level_number, {
          _id: problem.level_number,
          level_number: problem.level_number,
          age_group: problem.age_group,
          problems: [],
        });
      }
      levelMap.get(problem.level_number).problems.push(problem);
    });

    const levels = Array.from(levelMap.values()).sort((a, b) => a.level_number - b.level_number);

    // Transform the aggregated data to match the Level interface
    const formattedLevels = levels.map((level) => {
      // Debug: Check how many problems we have
      if (level.level_number === 1) {
        console.log(`[DEBUG] Level 1 aggregation returned ${level.problems.length} problems`);
        const uniqueSessions = [...new Set(level.problems.map((p: any) => p.session_id))];
        console.log(`[DEBUG] Unique session IDs in problems:`, uniqueSessions.sort((a: number, b: number) => a - b));
      }

      // Hardcoded session titles from database (Mongoose aggregation doesn't include session_title field)
      const sessionTitlesFromDB: { [key: string]: { [sessionId: number]: string } } = {
        '11-14': {
          1: 'Session 1: Understanding Output & Displaying Messages in Python',
          2: 'Session 2: Understanding Variables, Data Types',
          3: 'Session 3: Input Function and Type Conversions',
          4: 'Session 4: Understanding Operators in Python',
          5: 'Session 5: Understanding if, if-else Statements and Comparison Operators',
          6: 'Session 6: Nested Conditional Statements',
          7: 'Session 7: Introduction to Lists',
          8: 'Session 8: Advanced List Operations',
          9: 'Session 9: For Loops and Iteration',
          10: 'Session 10: Working with Range',
        }
      };

      // Group problems into sessions
      const sessionMap = new Map();
      level.problems.forEach((problem: any) => {
        if (!sessionMap.has(problem.session_id)) {
          // Try to get title from database mapping first
          const dbTitle = sessionTitlesFromDB[level.age_group]?.[problem.session_id];
          const fallbackTitle = problem.session_title || `Session ${sessionMap.size + 1}`;

          sessionMap.set(problem.session_id, {
            session_id: problem.session_id,
            level_id: level.level_number,
            session_number: sessionMap.size + 1,
            title: dbTitle || fallbackTitle,
            description: problem.session_introduction || '',
            introduction_content: problem.session_introduction || '',
            problems: [],
          });
        }
        sessionMap.get(problem.session_id).problems.push(problem);
      });

      const sessions = Array.from(sessionMap.values());

      // Debug: Log session IDs before filtering
      if (level.level_number === 1) {
        console.log(`[DEBUG] Level 1 has ${sessions.length} sessions:`, sessions.map(s => s.session_id));
      }

      // Sort sessions by session_id to ensure correct order
      sessions.sort((a, b) => a.session_id - b.session_id);

      // Update session numbers to match sorted order (1, 2, 3, 4...)
      sessions.forEach((session, index) => {
        session.session_number = index + 1;

        // Sort problems within each session by case_number (or problem_id if case_number is same)
        session.problems.sort((a: any, b: any) => {
          if (a.case_number !== b.case_number) {
            return a.case_number - b.case_number;
          }
          return a.problem_id - b.problem_id;
        });
      });

      // Generate meaningful session titles ONLY when missing or generic (e.g., "Session 1", "Session 2")
      // Don't overwrite existing descriptive titles from the database
      sessions.forEach((session, index) => {
        // Check if title is missing or purely generic (just "Session 1" with nothing after)
        const isGenericTitle = !session.title || /^Session \d+$/.test(session.title);

        // If title already has descriptive content (like "Session 1: Something"), keep it
        const hasDescriptiveContent = session.title && session.title.includes(':') && session.title.split(':')[1].trim().length > 0;

        if (isGenericTitle && !hasDescriptiveContent) {
          // Analyze problem titles to generate a meaningful session title
          const problemTitles = session.problems.map((p: any) => p.title?.toLowerCase() || '');
          const sessionText = problemTitles.join(' ');

          // Generate session title based on content
          if (sessionText.includes('print') && sessionText.includes('output')) {
            session.title = `Session ${index + 1}: Print & Output`;
          } else if (sessionText.includes('variable') && !sessionText.includes('input')) {
            session.title = `Session ${index + 1}: Variables`;
          } else if (sessionText.includes('input') && sessionText.includes('variable')) {
            session.title = `Session ${index + 1}: Variables & Input`;
          } else if (sessionText.includes('data type') || sessionText.includes('int') || sessionText.includes('float')) {
            session.title = `Session ${index + 1}: Data Types`;
          } else if (sessionText.includes('if') || sessionText.includes('condition') || sessionText.includes('else')) {
            session.title = `Session ${index + 1}: Conditionals`;
          } else if (sessionText.includes('while') || sessionText.includes('for') || sessionText.includes('loop')) {
            session.title = `Session ${index + 1}: Loops`;
          } else if (sessionText.includes('function') || sessionText.includes('def')) {
            session.title = `Session ${index + 1}: Functions`;
          } else if (sessionText.includes('list') || sessionText.includes('array')) {
            session.title = `Session ${index + 1}: Lists`;
          } else if (sessionText.includes('string') || sessionText.includes('text')) {
            session.title = `Session ${index + 1}: Strings`;
          } else if (sessionText.includes('tuple') || sessionText.includes('set') || sessionText.includes('dict')) {
            session.title = `Session ${index + 1}: Data Structures`;
          } else {
            // Use first problem title as hint
            const firstProblemTitle = session.problems[0]?.title || '';
            if (firstProblemTitle) {
              // Extract key concepts from first problem title
              const words = firstProblemTitle.split(' ');
              const keyWord = words.find((w: string) => w.length > 4) || words[0];
              session.title = `Session ${index + 1}: ${keyWord}`;
            } else {
              session.title = `Session ${index + 1}: Coding Challenges`;
            }
          }
        }
      });

      // Generate descriptive level title based on content
      const levelTitles: { [key: string]: { [levelNum: number]: string } } = {
        '11-14': {
          1: 'Mission 1: Python Fundamentals',
          2: 'Mission 2: Data Structures & Functions',
          3: 'Mission 3: Object-Oriented Programming',
          4: 'Mission 4: Error Handling & File Operations',
        },
        '15-18': {
          1: 'Mission 1: Advanced Python Concepts',
          2: 'Mission 2: Data Structures & Algorithms',
          3: 'Mission 3: Advanced OOP & Design Patterns',
          4: 'Mission 4: System Programming & Optimization',
        }
      };

      const levelTitle = levelTitles[level.age_group]?.[level.level_number] ||
                        `Mission ${level.level_number}: Code Convergence`;

      return {
        level_id: level.level_number,
        level_number: level.level_number,
        title: levelTitle,
        age_group: level.age_group,
        description: `Complete ${level.problems.length} challenges across ${sessions.length} sessions`,
        sessions,
      };
    });

    res.json(formattedLevels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

export default router;
