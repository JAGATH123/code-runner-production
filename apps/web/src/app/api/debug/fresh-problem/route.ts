import { NextResponse } from 'next/server';

/**
 * Fetch problem 52 with NO CACHING to prove data is fresh
 * GET /api/debug/fresh-problem?id=52
 */
export async function GET(request: Request) {
  // SECURITY: Block in production - debug endpoint
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('id') || '52';

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // Fetch with cache-busting timestamp
    const url = `${apiUrl}/problems/${problemId}?_t=${Date.now()}`;
    console.log('🔍 Fetching fresh data from:', url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

    const data = await response.json();

    return NextResponse.json({
      message: 'This is FRESH data directly from Backend API → MongoDB Atlas',
      timestamp: new Date().toISOString(),
      problem: {
        problem_id: data.problem_id,
        title: data.title,
        case_title: data.case_title,
        case_number: data.case_number,
        case_explanation: data.case_explanation,
        description: data.description,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching fresh problem:', error);
    return NextResponse.json(
      { error: 'Failed to fetch', details: error.message },
      { status: 500 }
    );
  }
}
