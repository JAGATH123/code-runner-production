import { NextResponse } from 'next/server';
import { GPUContainerPool } from '@/lib/execution/gpu-container-pool';

// Initialize GPU-aware container pool on startup
let poolInitialized = false;

async function ensurePoolInitialized() {
  if (!poolInitialized) {
    await GPUContainerPool.initialize();
    poolInitialized = true;
  }
}

// GPU-enabled Python execution endpoint
export async function POST(request: Request) {
  try {
    const { code, input, language, images, userSessionId } = await request.json();

    if (language !== 'python') {
      return NextResponse.json({ error: 'Only Python is supported' }, { status: 400 });
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Ensure GPU-aware pool is initialized
    await ensurePoolInitialized();

    // Execute code using GPU-aware container pool
    // Automatically detects GPU requirements and uses appropriate container
    // Pass images for Pygame support and userSessionId for persistent file storage
    const result = await GPUContainerPool.executeCode(code, input || '', images || [], userSessionId);

    // Add pool statistics for monitoring
    const poolStats = GPUContainerPool.getPoolStats();

    return NextResponse.json({
      ...result,
      _poolStats: poolStats // Includes CPU/GPU pool info
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred during code execution.',
      stdout: '',
      stderr: 'Internal server error',
      status: 'Error',
      executionTime: 0,
      usedGPU: false
    }, { status: 500 });
  }
}
