import { NextResponse } from 'next/server';

/**
 * DEPRECATED: This endpoint is no longer supported.
 *
 * This endpoint bypassed the proper queue-based execution system,
 * causing inconsistent behavior and making the system impossible to scale.
 *
 * Use the proper API instead:
 * POST /api/execution/submit/grade (via Express API at process.env.NEXT_PUBLIC_API_URL)
 */
export async function POST(request: Request) {
  return NextResponse.json(
    {
      error: 'This endpoint is deprecated and no longer supported',
      message: 'Please update your code to use the proper execution API',
      migration: {
        old: 'POST /api/submit',
        new: 'POST ${NEXT_PUBLIC_API_URL}/execution/submit/grade',
        documentation: 'See IMPLEMENTATION_PLAN.md Phase 1 for details'
      }
    },
    {
      status: 410, // 410 Gone - resource permanently removed
      headers: {
        'X-Deprecated': 'true',
        'X-Deprecation-Date': '2025-01-29',
      }
    }
  );
}
