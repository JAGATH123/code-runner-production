import { NextResponse } from 'next/server';
import { DataService } from '@/lib/database/data-service';

/**
 * Compare problem 52 from different data sources
 * GET /api/debug/test-sources
 */
export async function GET() {
  // SECURITY: Block in production - exposes database connection info
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    const problemId = 52;

    // Source 1: Web app's direct database connection
    console.log('🔍 Fetching from Web App Direct DB...');
    const webAppDirect = await DataService.getProblemById(problemId);

    // Source 2: Backend API service
    console.log('🔍 Fetching from Backend API...');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const backendApiResponse = await fetch(`${apiUrl}/problems/${problemId}`);
    const backendApi = await backendApiResponse.json();

    return NextResponse.json({
      sources: {
        'Web App Direct DB': {
          connected_to: process.env.MONGODB_URI?.substring(0, 50) || 'localhost (default)',
          data: {
            problem_id: webAppDirect?.problem_id,
            title: webAppDirect?.title,
            case_title: webAppDirect?.case_title,
            case_explanation_preview: webAppDirect?.case_explanation?.substring(0, 150),
          }
        },
        'Backend API Service': {
          api_url: apiUrl,
          data: {
            problem_id: backendApi?.problem_id,
            title: backendApi?.title,
            case_title: backendApi?.case_title,
            case_explanation_preview: backendApi?.case_explanation?.substring(0, 150),
          }
        }
      },
      comparison: {
        titles_match: webAppDirect?.case_title === backendApi?.case_title,
        explanation_match: webAppDirect?.case_explanation === backendApi?.case_explanation,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error testing sources:', error);
    return NextResponse.json(
      { error: 'Failed to test sources', details: error.message },
      { status: 500 }
    );
  }
}
