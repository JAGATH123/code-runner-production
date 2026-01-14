import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: 'Success' | 'Error' | 'Timeout';
  executionTime: number;
}

export interface TestCaseResult {
  input: string;
  expected_output: string;
  actual_output: string;
  status: 'passed' | 'failed';
  error?: string;
}

export class DockerExecutor {
  private static readonly EXECUTION_TIMEOUT = 5000; // 5 seconds for student code
  private static readonly IMAGE_NAME = 'python-code-runner';
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing Docker executor...');

    // Ensure Docker image exists
    await this.ensureImageExists();

    this.initialized = true;
    console.log('✅ Docker executor initialized');
  }

  /**
   * Execute Python code in a sandboxed Docker container
   */
  static async executeCode(code: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Create container with security constraints
      const containerName = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const containerId = await this.createContainer(containerName);

      try {
        // Execute code in container
        const result = await this.runCodeInContainer(containerId, code, input);
        const executionTime = Date.now() - startTime;

        return {
          ...result,
          executionTime
        };
      } finally {
        // Cleanup container
        await this.destroyContainer(containerId);
      }
    } catch (error) {
      console.error('Docker execution error:', error);
      const executionTime = Date.now() - startTime;

      return {
        stdout: '',
        stderr: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'Error',
        executionTime
      };
    }
  }

  /**
   * Execute code against multiple test cases
   */
  static async executeWithTestCases(
    code: string,
    testCases: Array<{ input: string; expected_output: string; is_hidden?: boolean }>
  ): Promise<{
    results: TestCaseResult[];
    passed: number;
    failed: number;
    totalExecutionTime: number;
  }> {
    const startTime = Date.now();
    const results: TestCaseResult[] = [];

    for (const testCase of testCases) {
      try {
        const execution = await this.executeCode(code, testCase.input);

        const actualOutput = execution.stdout.trim();
        const expectedOutput = testCase.expected_output.trim();
        const passed = actualOutput === expectedOutput && execution.status === 'Success';

        results.push({
          input: testCase.input,
          expected_output: expectedOutput,
          actual_output: actualOutput,
          status: passed ? 'passed' : 'failed',
          error: execution.status === 'Error' ? execution.stderr : undefined
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expected_output: testCase.expected_output,
          actual_output: '',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalExecutionTime = Date.now() - startTime;

    return { results, passed, failed, totalExecutionTime };
  }

  private static async createContainer(name: string): Promise<string> {
    try {
      const dockerCmd = [
        'docker run -d',
        `--name ${name}`,
        '--network none',
        '--memory 128m',
        '--cpus="0.5"',
        '--read-only',
        '--tmpfs /tmp:size=50m',
        '--user 1000:1000',
        this.IMAGE_NAME
      ].join(' ');

      const { stdout } = await execAsync(dockerCmd);
      const containerId = stdout.trim();

      return containerId;
    } catch (error) {
      console.error('Failed to create container:', error);
      throw new Error(`Container creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async destroyContainer(containerId: string): Promise<void> {
    try {
      await execAsync(`docker stop -t 2 ${containerId}`).catch(() => {});
      await execAsync(`docker rm -f ${containerId}`);
    } catch (error) {
      console.warn(`Failed to destroy container ${containerId}:`, error);
    }
  }

  private static async runCodeInContainer(
    containerId: string,
    code: string,
    input: string
  ): Promise<Omit<ExecutionResult, 'executionTime'>> {
    const sessionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workDir = `/tmp/${sessionId}_work`;

    try {
      // Create working directory
      await execAsync(`docker exec ${containerId} sh -c "mkdir -p ${workDir}"`);

      // Write code file using stdin piping (Windows compatible)
      const hostCodePath = join(tmpdir(), `${sessionId}.py`);
      await writeFile(hostCodePath, code, 'utf8');

      const isWindows = process.platform === 'win32';
      const catCommand = isWindows ? 'type' : 'cat';

      await execAsync(`${catCommand} "${hostCodePath}" | docker exec -i ${containerId} sh -c "cat > ${workDir}/${sessionId}.py"`);

      // Write input file if provided
      if (input) {
        const hostInputPath = join(tmpdir(), `${sessionId}.txt`);
        await writeFile(hostInputPath, input, 'utf8');

        try {
          await execAsync(`${catCommand} "${hostInputPath}" | docker exec -i ${containerId} sh -c "cat > ${workDir}/${sessionId}.txt"`);
        } finally {
          await unlink(hostInputPath).catch(() => {});
        }
      }

      // Cleanup host code file
      await unlink(hostCodePath).catch(() => {});

      // Execute Python code with timeout
      const execCommand = input
        ? `docker exec ${containerId} sh -c "cd ${workDir} && cat ${sessionId}.txt | timeout ${this.EXECUTION_TIMEOUT / 1000}s python ${sessionId}.py"`
        : `docker exec ${containerId} sh -c "cd ${workDir} && timeout ${this.EXECUTION_TIMEOUT / 1000}s python ${sessionId}.py"`;

      let stdout = '';
      let stderr = '';

      try {
        const result = await Promise.race([
          execAsync(execCommand),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Execution timeout')), this.EXECUTION_TIMEOUT);
          })
        ]);

        stdout = result.stdout || '';
        stderr = result.stderr || '';
      } catch (error: any) {
        stdout = error.stdout || '';
        stderr = error.stderr || '';

        if (error.message === 'Execution timeout' && !stderr) {
          stderr = `Code execution timed out (${this.EXECUTION_TIMEOUT / 1000} seconds limit)`;
        }
      }

      // Cleanup working directory
      await execAsync(`docker exec ${containerId} rm -rf ${workDir}`).catch(() => {});

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        status: stderr.trim() ? 'Error' : 'Success'
      };
    } catch (error) {
      console.error('Code execution error:', error);

      return {
        stdout: '',
        stderr: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'Error'
      };
    }
  }

  private static async ensureImageExists(): Promise<void> {
    try {
      await execAsync(`docker inspect ${this.IMAGE_NAME}`);
      console.log(`Docker image ${this.IMAGE_NAME} exists`);
    } catch {
      console.log(`Building Docker image ${this.IMAGE_NAME}...`);

      // Assume Dockerfile is in project root
      const projectRoot = process.cwd();
      await execAsync(`docker build -t ${this.IMAGE_NAME} -f Dockerfile .`, {
        cwd: projectRoot
      });

      console.log(`Docker image ${this.IMAGE_NAME} built successfully`);
    }
  }
}
