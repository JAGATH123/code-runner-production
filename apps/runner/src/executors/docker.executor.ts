import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { getLogger } from '@code-runner/shared';
import { ContainerPool } from './container-pool';

const execAsync = promisify(exec);
const logger = getLogger('docker-executor');

// Container pool instance (singleton)
let containerPool: ContainerPool | null = null;

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

    logger.info('Initializing Docker executor');

    // Ensure Docker image exists
    await this.ensureImageExists();

    // Initialize container pool if enabled
    if (ContainerPool.isEnabled()) {
      logger.info('Container pooling enabled - initializing pool');
      containerPool = new ContainerPool({
        imageName: this.IMAGE_NAME,
      });
      await containerPool.initialize();
      logger.info('Container pool initialized successfully');
    } else {
      logger.info('Container pooling disabled - using per-execution containers');
    }

    this.initialized = true;
    logger.info('Docker executor initialized successfully');
  }

  /**
   * Execute Python code in a sandboxed Docker container
   * Uses container pool if enabled for better performance
   */
  static async executeCode(code: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Use container pool if enabled
      if (containerPool) {
        return await this.executeWithPool(code, input, startTime);
      } else {
        return await this.executeWithFreshContainer(code, input, startTime);
      }

    } catch (error) {
      logger.error('Docker execution error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
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
   * Execute using container pool (faster, reuses containers)
   */
  private static async executeWithPool(
    code: string,
    input: string,
    startTime: number
  ): Promise<ExecutionResult> {
    let pooledContainer = null;

    try {
      // Acquire container from pool
      pooledContainer = await containerPool!.acquire();

      // Execute code in pooled container
      const result = await this.runCodeInContainer(pooledContainer.id, code, input);
      const executionTime = Date.now() - startTime;

      // Release container back to pool (with cleanup)
      await containerPool!.release(pooledContainer.id, true);

      return {
        ...result,
        executionTime
      };

    } catch (error) {
      // If execution failed, release container without cleanup (will be destroyed)
      if (pooledContainer) {
        await containerPool!.release(pooledContainer.id, false).catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Execute using fresh container (original behavior, slower but simpler)
   */
  private static async executeWithFreshContainer(
    code: string,
    input: string,
    startTime: number
  ): Promise<ExecutionResult> {
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
      logger.error('Failed to create container', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Container creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async destroyContainer(containerId: string): Promise<void> {
    try {
      await execAsync(`docker stop -t 2 ${containerId}`).catch(() => {});
      await execAsync(`docker rm -f ${containerId}`);
    } catch (error) {
      logger.warn('Failed to destroy container', {
        containerId,
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error('Code execution error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        stdout: '',
        stderr: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'Error'
      };
    }
  }

  private static async ensureImageExists(): Promise<void> {
    try {
      // Check if image exists using docker images command
      const { stdout } = await execAsync(`docker images -q ${this.IMAGE_NAME}`);
      if (stdout.trim()) {
        logger.info('Docker image exists', { image: this.IMAGE_NAME });
        return;
      }
    } catch (error) {
      logger.warn('Failed to check Docker image', { error: String(error) });
    }

    // Image doesn't exist, try to build it
    logger.info('Building Docker image', { image: this.IMAGE_NAME });

    // Dockerfile is in the sandbox subdirectory
    const sandboxPath = join(process.cwd(), 'sandbox');
    try {
      await execAsync(`docker build -t ${this.IMAGE_NAME} .`, {
        cwd: sandboxPath
      });
      logger.info('Docker image built successfully', { image: this.IMAGE_NAME });
    } catch (buildError) {
      // If build fails, check if image was built externally
      try {
        const { stdout } = await execAsync(`docker images -q ${this.IMAGE_NAME}`);
        if (stdout.trim()) {
          logger.info('Docker image found (built externally)', { image: this.IMAGE_NAME });
          return;
        }
      } catch {}

      throw new Error(`Failed to build Docker image: ${buildError instanceof Error ? buildError.message : String(buildError)}`);
    }
  }

  /**
   * Get container pool statistics (for monitoring)
   */
  static getPoolStats() {
    if (!containerPool) {
      return {
        enabled: false,
        reason: 'Container pooling is disabled'
      };
    }

    return {
      enabled: true,
      ...containerPool.getStats()
    };
  }

  /**
   * Shutdown container pool gracefully
   */
  static async shutdown(): Promise<void> {
    logger.info('Shutting down Docker executor');

    if (containerPool) {
      await containerPool.shutdown();
      containerPool = null;
    }

    this.initialized = false;
    logger.info('Docker executor shutdown complete');
  }
}
