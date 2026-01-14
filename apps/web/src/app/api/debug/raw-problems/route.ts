import { NextResponse } from 'next/server';

/**
 * Check raw problem data from API to see if session_title is included
 * GET /api/debug/raw-problems?levelNumber=1
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

    // Get first problem from first session to inspect its structure
    const firstSession = level.sessions[0];
    const firstProblem = firstSession?.problems[0];

    return NextResponse.json({
      level_number: levelNumber,
      first_session: {
        session_id: firstSession?.session_id,
        session_title_in_api_response: firstSession?.title,
        problems_count: firstSession?.problems?.length,
      },
      first_problem_structure: {
        problem_id: firstProblem?.problem_id,
        title: firstProblem?.title,
        has_session_title_field: 'session_title' in (firstProblem || {}),
        session_title_value: firstProblem?.session_title,
        all_fields: Object.keys(firstProblem || {}),
      }
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check raw problems', details: error.message },
      { status: 500 }
    );
  }
}
