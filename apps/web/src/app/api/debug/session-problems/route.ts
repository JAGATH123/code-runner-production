import { NextResponse } from 'next/server';

/**
 * Check problem order within a session
 * GET /api/debug/session-problems?ageGroup=11-14&levelNumber=2&sessionNumber=1
 */
export async function GET(request: Request) {
  // SECURITY: Block in production - debug endpoint
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ageGroup = searchParams.get('ageGroup') || '11-14';
    const levelNumber = parseInt(searchParams.get('levelNumber') || '2');
    const sessionNumber = parseInt(searchParams.get('sessionNumber') || '1');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/levels/${ageGroup}`, {
      cache: 'no-store',
    });

    const levels = await response.json();
    const level = levels.find((l: any) => l.level_number === levelNumber);

    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    const session = level.sessions.find((s: any) => s.session_number === sessionNumber);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const problemOrder = session.problems.map((p: any, index: number) => ({
      display_position: index + 1,
      problem_id: p.problem_id,
      title: p.title,
      case_number: p.case_number,
    }));

    return NextResponse.json({
      level_number: levelNumber,
      session_number: sessionNumber,
      session_title: session.title,
      session_id: session.session_id,
      total_problems: session.problems.length,
      problems: problemOrder,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch session problems', details: error.message },
      { status: 500 }
    );
  }
}
