import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cheatsheets/[session_id]
 * Proxy endpoint to fetch cheat sheet from backend API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { session_id: string } }
) {
  try {
    const resolvedParams = await params;
    const { session_id } = resolvedParams;

    // Validate session_id
    const sessionId = parseInt(session_id);
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Call backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const apiUrl = `${backendUrl}/cheatsheets/session/${sessionId}`;

    console.log(`[CheatSheet API] Fetching from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: 'Cheat sheet not found for this session',
            session_id: sessionId
          },
          { status: 404 }
        );
      }

      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[CheatSheet API] Successfully fetched cheat sheet for session ${sessionId}`);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[CheatSheet API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load cheat sheet',
        details: error.message
      },
      { status: 500 }
    );
  }
}
