import mongoose, { Document } from 'mongoose';
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
export declare const ExecutionResult: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=ExecutionResult.model.d.ts.map