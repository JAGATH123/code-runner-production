import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';

// API endpoint to delete a specific file
export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Delete the file
    await unlink(filePath);

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete file'
    }, { status: 500 });
  }
}
