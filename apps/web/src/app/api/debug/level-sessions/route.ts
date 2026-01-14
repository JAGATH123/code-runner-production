import { NextResponse } from 'next/server';

/**
 * Show session structure for a specific level
 * GET /api/debug/level-sessions?ageGroup=11-14&levelNumber=2
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ageGroup = searchParams.get('ageGroup') || '11-14';
    const levelNumber = parseInt(searchParams.get('levelNumber') || '2');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/levels/${ageGroup}`, {
      cache: 'no-store',
    });

    const levels = await response.json();
    const level = levels.find((l: any) => l.level_number === levelNumber);

    if (!level) {
      return NextResponse.json(
        { error: 'Level not found' },
        { status: 404 }
      );
    }

    const sessionInfo = level.sessions.map((session: any, index: number) => ({
      position: index + 1,
      session_id: session.session_id,
      session_number: session.session_number,
      title: session.title,
      problems_count: session.problems.length,
      first_problem_title: session.problems[0]?.title,
      first_problem_id: session.problems[0]?.problem_id,
    }));

    return NextResponse.json({
      level_number: level.level_number,
      level_title: level.title,
      total_sessions: level.sessions.length,
      sessions: sessionInfo,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch session info', details: error.message },
      { status: 500 }
    );
  }
}
