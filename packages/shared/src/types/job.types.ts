// Queue Job Types (NEW for async execution)

export interface CodeExecutionJobData {
  jobId: string;
  userId: string;
  code: string;
  language: 'python';
  problemId?: number;
  userSessionId?: string; // For persistent file storage
  timestamp: number;
}

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

export interface JobResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    stdout: string;
    stderr: string;
    executionTime: number;
    plots?: string[];
    files?: Array<{
      name: string;
      size: number;
      path: string;
    }>;
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
    total: number;
    results?: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
      error?: string;
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
