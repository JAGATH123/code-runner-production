import { NextResponse } from 'next/server';

/**
 * Get session by session_id
 * GET /api/sessions/[session_id]
 */
export async function GET(
  request: Request,
  { params }: { params: { session_id: string } }
) {
  try {
    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.session_id);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // Fetch levels for 11-14 age group (primary age group for sessions)
    const response = await fetch(`${apiUrl}/levels/11-14`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      // Try 15-18 age group as fallback
      const response15 = await fetch(`${apiUrl}/levels/15-18`, {
        cache: 'no-store',
      });

      if (!response15.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch levels' },
          { status: 500 }
        );
      }

      const levels15 = await response15.json();
      const session15 = findSessionInLevels(levels15, sessionId);

      if (session15) {
        return NextResponse.json({ session: session15 }, {
          headers: { 'Cache-Control': 'no-store' }
        });
      }

      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const levels = await response.json();
    let session = findSessionInLevels(levels, sessionId);

    // If not found in 11-14, try 15-18
    if (!session) {
      const response15 = await fetch(`${apiUrl}/levels/15-18`, {
        cache: 'no-store',
      });

      if (response15.ok) {
        const levels15 = await response15.json();
        session = findSessionInLevels(levels15, sessionId);
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to find a session by ID across all levels
 */
function findSessionInLevels(levels: any[], sessionId: number): any | null {
  for (const level of levels) {
    if (level.sessions && Array.isArray(level.sessions)) {
      const session = level.sessions.find((s: any) => s.session_id === sessionId);
      if (session) {
        // Add level_id to session if not present
        return {
          ...session,
          level_id: session.level_id || level.level_id || level.level_number,
        };
      }
    }
  }
  return null;
}
