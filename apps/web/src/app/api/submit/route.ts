import { NextResponse } from 'next/server';
import { DataService } from '@/lib/database/data-service';
import { SubmissionExecutor } from '@/lib/execution/submission-executor';
import { GPUContainerPool } from '@/lib/execution/gpu-container-pool';
import type { SubmissionResult } from '@/lib/types';

type TestCase = { input: string; expected_output: string };

// Initialize GPU-aware container pool on startup
let poolInitialized = false;

async function ensurePoolInitialized() {
  if (!poolInitialized) {
    await GPUContainerPool.initialize();
    poolInitialized = true;
  }
}

// Real Python submission endpoint using Docker sandbox
export async function POST(request: Request) {
  try {
    // Ensure GPU-aware pool is initialized
    await ensurePoolInitialized();
    const { problemId, code, language } = await request.json();

    if (language !== 'python') {
      return NextResponse.json({ error: 'Only Python is supported' }, { status: 400 });
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const cases: TestCase[] = await DataService.getTestCasesForProblem(problemId);

    if (!cases) {
      return NextResponse.json({ error: 'Problem or test cases not found' }, { status: 404 });
    }

    // Get problem details to check if it's a Pygame problem
    const problem = await DataService.getProblemById(problemId);
    const isPygameProblem = problem && (problem.session_id === 42 || problem.session_id === 43);

    // Execute code against all test cases
    const summary = await SubmissionExecutor.executeSubmission(code, cases, isPygameProblem);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Submission execution error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred during submission evaluation.',
      summary: {
        status: 'Wrong Answer',
        passed: 0,
        total: 0
      } as SubmissionResult
    }, { status: 500 });
  }
}
