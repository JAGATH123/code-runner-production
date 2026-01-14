export interface FileInfo {
    name: string;
    size: number;
    path: string;
}
export interface ExecutionResult {
    stdout: string;
    stderr: string;
    status: 'Success' | 'Error' | 'Timeout' | 'Running' | 'Submitting' | '';
    executionTime: number | null;
    plots?: string[];
    files?: FileInfo[];
    executionDir?: string;
    pygameBundle?: {
        html: string;
        wasm: string;
        data: string;
        js: string;
    };
}
export interface SubmissionResult {
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
}
//# sourceMappingURL=execution.types.d.ts.map