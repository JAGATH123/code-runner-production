/**
 * Legacy file info (for backward compatibility)
 */
export interface FileInfo {
    name: string;
    size: number;
    path: string;
}
/**
 * Generated file from code execution (images, text files, etc.)
 */
export interface ExecutionFile {
    name: string;
    type: 'image' | 'text' | 'data';
    data: string;
    mimeType: string;
}
/**
 * Result of code execution
 */
export interface ExecutionResult {
    stdout: string;
    stderr: string;
    status: 'Success' | 'Error' | 'Timeout' | 'Running' | 'Submitting' | '';
    executionTime: number | null;
    exitCode?: number;
    files?: ExecutionFile[] | FileInfo[];
    plots?: string[];
    executionDir?: string;
    pygameBundle?: {
        html: string;
        wasm: string;
        data: string;
        js: string;
    };
}
/**
 * Result of code submission (grading)
 */
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
/**
 * Test case result for submissions
 */
export interface TestCaseResult {
    input: string;
    expected_output: string;
    actual_output: string;
    status: 'passed' | 'failed';
    error?: string;
    is_hidden?: boolean;
}
//# sourceMappingURL=execution.types.d.ts.map