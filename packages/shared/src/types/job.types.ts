// Queue Job Types for async execution

import { ExecutionFile } from './execution.types';

/**
 * Job data for simple code execution (test runs)
 */
export interface CodeExecutionJobData {
  jobId: string;
  userId: string;
  code: string;
  input?: string; // User input for stdin
  language: 'python';
  problemId?: number;
  userSessionId?: string; // For persistent file storage
  timestamp: number;
}

/**
 * Job data for code submission (grading with test cases)
 */
export interface SubmissionJobData {
  jobId: string;
  userId: string;
  code: string;
  problemId: number;
  testCases: Array<{
    input: string;
    expected_output: string;
    is_hidden?: boolean;
  }>;
  timestamp: number;
}

/**
 * Result of a job execution
 */
export interface JobResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    stdout: string;
    stderr: string;
    status: 'Success' | 'Error' | 'Timeout';
    executionTime: number;
    exitCode?: number;
    // Generated files (images, text, etc.)
    files?: ExecutionFile[];
    // Legacy fields
    plots?: string[];
    pygameBundle?: {
      html: string;
      wasm: string;
      data: string;
      js: string;
    };
  };
  submissionResult?: {
    status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Error';
    passed: number;
    failed: number;
    total: number;
    passRate: number;
    allPassed: boolean;
    executionTime: number;
    testResults?: Array<{
      input: string;
      expected_output: string;
      actual_output: string;
      status: 'passed' | 'failed';
      error?: string;
      is_hidden?: boolean;
    }>;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export type JobType = 'code-execution' | 'code-submission';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  queues: {
    [key in JobType]: {
      name: string;
      concurrency: number;
      limiter?: {
        max: number;
        duration: number;
      };
    };
  };
}
