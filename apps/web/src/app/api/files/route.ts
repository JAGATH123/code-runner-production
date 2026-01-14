import { NextResponse } from 'next/server';
import { GPUContainerPool } from '@/lib/execution/gpu-container-pool';

// API endpoint to retrieve file contents from host filesystem
export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Retrieve file content from host filesystem
    const content = await GPUContainerPool.getFileContent(filePath);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('File retrieval error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to retrieve file'
    }, { status: 500 });
  }
}
