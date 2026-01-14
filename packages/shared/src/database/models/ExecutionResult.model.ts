import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutionResult extends Document {
  jobId: string;
  userId: string;
  problemId?: number;
  code: string;
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

const ExecutionResultSchema = new Schema<IExecutionResult>({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  problemId: Number,
  code: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  result: Schema.Types.Mixed,
  submissionResult: Schema.Types.Mixed,
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800, // Auto-delete after 7 days (604800 seconds)
  },
  completedAt: Date,
}, {
  collection: 'execution_results',
});

// Indexes
ExecutionResultSchema.index({ jobId: 1 }, { unique: true });
ExecutionResultSchema.index({ userId: 1, createdAt: -1 });
ExecutionResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // TTL index

export const ExecutionResult = mongoose.models.ExecutionResult || mongoose.model<IExecutionResult>('ExecutionResult', ExecutionResultSchema);
