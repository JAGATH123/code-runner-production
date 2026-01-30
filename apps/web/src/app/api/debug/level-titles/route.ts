import { NextResponse } from 'next/server';

/**
 * Show level titles for debugging
 * GET /api/debug/level-titles?ageGroup=11-14
 */
export async function GET(request: Request) {
  // SECURITY: Block in production - debug endpoint
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ageGroup = searchParams.get('ageGroup') || '11-14';

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/levels/${ageGroup}`, {
      cache: 'no-store',
    });

    const levels = await response.json();

    const titles = levels.map((level: any) => ({
      level_number: level.level_number,
      title: level.title,
      sessions_count: level.sessions?.length || 0,
      problems_count: level.description,
    }));

    return NextResponse.json({
      age_group: ageGroup,
      levels: titles,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch level titles', details: error.message },
      { status: 500 }
    );
  }
}
