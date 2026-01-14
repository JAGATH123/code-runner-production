import { GPUContainerPool } from './gpu-container-pool';
import type { SubmissionResult } from './types';

interface TestCase {
  input: string;
  expected_output: string;
}

export class SubmissionExecutor {

  private static normalizeOutput(output: string): string {
    return output.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  private static compareOutputs(actual: string, expected: string): boolean {
    const normalizedActual = this.normalizeOutput(actual);
    const normalizedExpected = this.normalizeOutput(expected);
    return normalizedActual === normalizedExpected;
  }

  /**
   * Creates a driver script that runs user code against all test cases in ONE execution
   * This is 500x faster than running containers separately for each test case
   */
  private static createBatchDriverScript(userCode: string, testCases: TestCase[]): string {
    // Escape the user code and test cases for JSON embedding
    const escapeForJson = (str: string) => {
      return str.replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
    };

    const testCasesJson = testCases.map(tc => ({
      input: escapeForJson(tc.input),
      expected: escapeForJson(tc.expected_output)
    }));

    // Driver script that will execute all test cases
    const driverScript = `
import sys
import json
import io
from contextlib import redirect_stdout, redirect_stderr

# User's code (will be defined as a string and executed)
user_code = """${escapeForJson(userCode)}"""

# Test cases
test_cases = ${JSON.stringify(testCasesJson)}

# Helper to unescape strings (convert \\n to actual newlines)
def unescape_string(s):
    return s.encode().decode('unicode_escape')

results = []

for idx, test_case in enumerate(test_cases):
    try:
        # Create a fresh namespace for each test case
        namespace = {}

        # Reset random seed before each test case for reproducibility
        import random as _random_module
        _random_module.seed(42)

        # Redirect stdin to provide input (unescape to get actual newlines)
        original_stdin = sys.stdin
        sys.stdin = io.StringIO(unescape_string(test_case['input']))

        # Capture stdout
        output_buffer = io.StringIO()
        error_buffer = io.StringIO()

        try:
            with redirect_stdout(output_buffer), redirect_stderr(error_buffer):
                exec(user_code, namespace)

            actual_output = output_buffer.getvalue()
            error_output = error_buffer.getvalue()

            if error_output:
                results.append({
                    'index': idx,
                    'passed': False,
                    'actual': actual_output,
                    'error': error_output,
                    'status': 'Error'
                })
            else:
                results.append({
                    'index': idx,
                    'passed': None,  # Will be checked by backend
                    'actual': actual_output,
                    'error': None,
                    'status': 'Success'
                })

        finally:
            sys.stdin = original_stdin
            output_buffer.close()
            error_buffer.close()

    except Exception as e:
        results.append({
            'index': idx,
            'passed': False,
            'actual': '',
            'error': str(e),
            'status': 'Error'
        })
        # Continue to next test case instead of breaking
        # This allows us to see all failures

# Output results as JSON (one line for easy parsing)
print('[BATCH_RESULTS]' + json.dumps(results))
`;

    return driverScript;
  }

  /**
   * Parse batch results from driver script output
   */
  private static parseBatchResults(stdout: string, testCases: TestCase[]): {
    passedCount: number;
    results: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
      error?: string;
    }>;
  } {
    const results: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
      error?: string;
    }> = [];

    try {
      // Extract JSON results from output
      const match = stdout.match(/\[BATCH_RESULTS\](.+)/);
      if (!match) {
        throw new Error('Could not parse batch results from output');
      }

      const batchResults = JSON.parse(match[1]);
      let passedCount = 0;

      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        const testCase = testCases[result.index];

        const passed = result.status === 'Success' &&
                      this.compareOutputs(result.actual, testCase.expected_output);

        if (passed) {
          passedCount++;
        }

        results.push({
          input: testCase.input,
          expected: testCase.expected_output,
          actual: result.actual || '',
          passed,
          error: result.error || undefined
        });
      }

      return { passedCount, results };

    } catch (error) {
      console.error('Error parsing batch results:', error);
      // Fallback: mark all as failed
      return {
        passedCount: 0,
        results: testCases.map(tc => ({
          input: tc.input,
          expected: tc.expected_output,
          actual: '',
          passed: false,
          error: 'Failed to parse test results'
        }))
      };
    }
  }

  public static async executeSubmission(
    code: string,
    testCases: TestCase[],
    isPygameProblem: boolean = false
  ): Promise<SubmissionResult> {

    // PYGAME SPECIAL HANDLING: Pygame code runs in a game loop with live print capture
    // The batch driver approach doesn't work for Pygame
    if (isPygameProblem) {
      console.log('[Submission] ===== PYGAME SUBMISSION =====');
      console.log('[Submission] Using CONSOLE OUTPUT (print capture) for validation');
      console.log('[Submission] NOT using SYSTEM OUTPUT');
      try {
        // Execute Pygame code directly (it will compile with Pygbag)
        const executionResult = await GPUContainerPool.executeCode(code, '');

        if (executionResult.status === 'Error' || executionResult.status === 'Timeout') {
          return {
            status: 'Wrong Answer',
            passed: 0,
            total: testCases.length,
            results: testCases.map(tc => ({
              input: tc.input,
              expected: tc.expected_output,
              actual: '',
              passed: false,
              error: executionResult.stderr || 'Execution failed'
            }))
          };
        }

        // CRITICAL: Verify student actually wrote Pygame code (not just print statement)
        if (!executionResult.pygameBundle) {
          console.log('[Submission] ERROR: No Pygame bundle found - student did not write valid Pygame code');
          return {
            status: 'Wrong Answer',
            passed: 0,
            total: testCases.length,
            results: testCases.map(tc => ({
              input: tc.input,
              expected: tc.expected_output,
              actual: '',
              passed: false,
              error: 'Code must include proper Pygame initialization and game loop'
            }))
          };
        }

        // Additional validation: Check for required Pygame elements in code
        const hasImportPygame = code.includes('import pygame');
        const hasPygameInit = code.includes('pygame.init()');
        const hasDisplaySetMode = /pygame\.display\.set_mode\s*\(/.test(code);
        const hasDisplayUpdate = /pygame\.display\.(update|flip)\s*\(/.test(code);
        const hasGameLoop = /while\s+running/.test(code) || /while\s+True/.test(code);

        if (!hasImportPygame || !hasPygameInit || !hasDisplaySetMode || !hasDisplayUpdate || !hasGameLoop) {
          console.log('[Submission] ERROR: Missing required Pygame elements');
          console.log(`[Submission] Has import pygame: ${hasImportPygame}`);
          console.log(`[Submission] Has pygame.init(): ${hasPygameInit}`);
          console.log(`[Submission] Has display.set_mode(): ${hasDisplaySetMode}`);
          console.log(`[Submission] Has display.update/flip(): ${hasDisplayUpdate}`);
          console.log(`[Submission] Has game loop: ${hasGameLoop}`);

          return {
            status: 'Wrong Answer',
            passed: 0,
            total: testCases.length,
            results: testCases.map(tc => ({
              input: tc.input,
              expected: tc.expected_output,
              actual: '',
              passed: false,
              error: 'Code must include: import pygame, pygame.init(), display.set_mode(), display update, and game loop'
            }))
          };
        }

        // For Pygame, compare the stdout (from print capture) with expected output
        // This stdout comes from the initial 5-frame execution print capture
        // It is the SAME as what appears in CONSOLE OUTPUT in the UI
        const actualOutput = this.normalizeOutput(executionResult.stdout);
        console.log(`[Submission] ===== VALIDATION SOURCE =====`);
        console.log(`[Submission] Source: CONSOLE OUTPUT (print capture from initial execution)`);
        console.log(`[Submission] Captured output: "${actualOutput}"`);
        console.log(`[Submission] Expected output: "${testCases[0]?.expected_output}"`);
        console.log(`[Submission] ===== COMPARING =====`);
        let passedCount = 0;

        // Pygame problems typically have the same expected output for all test cases
        // (since they don't use input - they're interactive games)
        const results = testCases.map(tc => {
          const passed = this.compareOutputs(actualOutput, tc.expected_output);
          console.log(`[Submission] Test case - Expected: "${tc.expected_output}", Actual: "${actualOutput}", Passed: ${passed}`);
          if (passed) passedCount++;

          return {
            input: tc.input,
            expected: tc.expected_output,
            actual: actualOutput,
            passed,
            error: undefined
          };
        });

        const finalStatus = passedCount === testCases.length ? 'Accepted' : 'Wrong Answer';
        console.log(`[Submission] ===== RESULT =====`);
        console.log(`[Submission] Status: ${finalStatus}`);
        console.log(`[Submission] Passed: ${passedCount}/${testCases.length}`);
        console.log(`[Submission] Validation used: CONSOLE OUTPUT (print capture)`);
        console.log(`[Submission] ===== END =====`);

        return {
          status: finalStatus,
          passed: passedCount,
          total: testCases.length,
          results
        };

      } catch (error) {
        console.error('[Submission] Pygame execution error:', error);
        return {
          status: 'Wrong Answer',
          passed: 0,
          total: testCases.length,
          results: testCases.map(tc => ({
            input: tc.input,
            expected: tc.expected_output,
            actual: '',
            passed: false,
            error: error instanceof Error ? error.message : 'Pygame execution failed'
          }))
        };
      }
    }

    // OPTIMIZATION: Batch all test cases into ONE container execution
    // This reduces execution time from ~770s to ~1.5s (500x faster!)

    try {
      // Create driver script that runs all test cases
      const driverScript = this.createBatchDriverScript(code, testCases);

      // Execute ONCE using container pool (not per test case!)
      const executionResult = await GPUContainerPool.executeCode(driverScript, '');

      if (executionResult.status === 'Error' || executionResult.status === 'Timeout') {
        // Runtime error or timeout - all test cases fail
        return {
          status: 'Wrong Answer',
          passed: 0,
          total: testCases.length,
          results: testCases.map(tc => ({
            input: tc.input,
            expected: tc.expected_output,
            actual: '',
            passed: false,
            error: executionResult.stderr || 'Execution failed'
          }))
        };
      }

      // Parse batch results
      const { passedCount, results } = this.parseBatchResults(
        executionResult.stdout,
        testCases
      );

      return {
        status: passedCount === testCases.length ? 'Accepted' : 'Wrong Answer',
        passed: passedCount,
        total: testCases.length,
        results
      };

    } catch (error) {
      console.error('Batch execution error:', error);
      return {
        status: 'Wrong Answer',
        passed: 0,
        total: testCases.length,
        results: testCases.map(tc => ({
          input: tc.input,
          expected: tc.expected_output,
          actual: '',
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown execution error'
        }))
      };
    }
  }
}