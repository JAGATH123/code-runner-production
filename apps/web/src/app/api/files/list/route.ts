import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// API endpoint to list all files in user's persistent directory
export async function POST(request: Request) {
  try {
    const { userSessionId } = await request.json();

    if (!userSessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const persistentDir = join(tmpdir(), `user_files_${userSessionId}`);

    try {
      const fileNames = await readdir(persistentDir);

      const files = await Promise.all(
        fileNames.map(async (name) => {
          const filePath = join(persistentDir, name);
          const stats = await stat(filePath);

          return {
            name,
            size: stats.size,
            path: filePath
          };
        })
      );

      return NextResponse.json({ files });
    } catch (error) {
      // Directory doesn't exist or is empty
      return NextResponse.json({ files: [] });
    }
  } catch (error) {
    console.error('File list error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to list files'
    }, { status: 500 });
  }
}
