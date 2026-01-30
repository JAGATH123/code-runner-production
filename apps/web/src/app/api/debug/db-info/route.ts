import { NextResponse } from 'next/server';
import { DataService } from '@/lib/database/data-service';

/**
 * Debug endpoint to check database connection and problem data
 * GET /api/debug/db-info?problemId=52
 */
export async function GET(request: Request) {
  // SECURITY: Block in production - exposes database info
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const problemId = parseInt(searchParams.get('problemId') || '52');

    // Get environment info
    const envInfo = {
      MONGODB_URI: process.env.MONGODB_URI ?
        process.env.MONGODB_URI.substring(0, 50) + '...' :
        'NOT SET (will default to localhost)',
      MONGODB_DB: process.env.MONGODB_DB || 'code-runner (default)',
    };

    // Get problem from database
    const problem = await DataService.getProblemById(problemId);

    return NextResponse.json({
      environment: envInfo,
      problem: problem ? {
        problem_id: problem.problem_id,
        title: problem.title,
        case_title: problem.case_title,
        case_explanation: problem.case_explanation?.substring(0, 100) + '...',
      } : null,
      cacheStats: DataService.getCacheStats(),
    });
  } catch (error) {
    console.error('Error getting DB info:', error);
    return NextResponse.json(
      { error: 'Failed to get DB info', details: error.message },
      { status: 500 }
    );
  }
}
