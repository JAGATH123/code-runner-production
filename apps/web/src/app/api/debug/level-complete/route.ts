import { NextResponse } from 'next/server';

/**
 * Check complete level structure including final challenges
 * GET /api/debug/level-complete?levelNumber=1
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ageGroup = searchParams.get('ageGroup') || '11-14';
    const levelNumber = parseInt(searchParams.get('levelNumber') || '1');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/levels/${ageGroup}`, {
      cache: 'no-store',
    });

    const levels = await response.json();
    const level = levels.find((l: any) => l.level_number === levelNumber);

    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    const sessionSummary = level.sessions.map((s: any) => ({
      session_id: s.session_id,
      session_number: s.session_number,
      title: s.title,
      problems_count: s.problems.length,
      first_problem_id: s.problems[0]?.problem_id,
    }));

    return NextResponse.json({
      level_number: levelNumber,
      level_title: level.title,
      total_sessions: level.sessions.length,
      sessions: sessionSummary,
      has_final_challenge: level.sessions.length > 10,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get level structure', details: error.message },
      { status: 500 }
    );
  }
}
