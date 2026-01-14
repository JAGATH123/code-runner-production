import { NextResponse } from 'next/server';
import { DataService } from '@/lib/database/data-service';

/**
 * Clear all cached data
 * GET /api/cache/clear
 */
export async function GET() {
  try {
    // Clear all caches
    await DataService.invalidateCache('problem');
    await DataService.invalidateCache('level');
    await DataService.invalidateCache('session');
    await DataService.invalidateCache('progress');

    const stats = DataService.getCacheStats();

    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      stats
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
