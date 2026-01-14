import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PoolContainer {
  id: string;
  busy: boolean;
  lastUsed: number;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: 'Success' | 'Error' | 'Timeout';
  executionTime: number;
  plots?: string[];
}

export class ContainerPool {
  private static containers: Map<string, PoolContainer> = new Map();
  private static readonly POOL_SIZE = 10;
  private static readonly IDLE_TIMEOUT = 300000; // 5 minutes
  private static readonly EXECUTION_TIMEOUT = 10000; // 10 seconds
  private static readonly IMAGE_NAME = 'python-code-runner';
  private static initialized = false;
  private static initializing = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) {
      // Wait for initialization to complete
      while (this.initializing && !this.initialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.initializing = true;
    console.log('Initializing container pool...');

    // Build image if not exists
    await this.ensureImageExists();

    // Create initial pool
    for (let i = 0; i < this.POOL_SIZE; i++) {
      try {
        await this.createPoolContainer();
      } catch (error) {
        console.warn(`Failed to create container ${i}:`, error);
      }
    }

    // Start cleanup task every minute
    setInterval(() => this.cleanupIdleContainers(), 60000);

    this.initialized = true;
    this.initializing = false;
    console.log(`Container pool initialized with ${this.containers.size} containers`);
  }

  static async executeCode(code: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Get available container
      const container = await this.getAvailableContainer();

      try {
        // Execute code in container
        const result = await this.runCodeInContainer(container.id, code, input);

        const executionTime = Date.now() - startTime;
        return {
          ...result,
          executionTime
        };
      } finally {
        // Return container to pool
        this.returnContainer(container.id);
      }
    } catch (error) {
      console.error('Container execution error:', error);
      const executionTime = Date.now() - startTime;

      return {
        stdout: '',
        stderr: `Container execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'Error',
        executionTime
      };
    }
  }

  private static async getAvailableContainer(): Promise<PoolContainer> {
    // Find free container
    for (const [id, container] of this.containers) {
      if (!container.busy) {
        container.busy = true;
        container.lastUsed = Date.now();
        return container;
      }
    }

    // No free containers, create temporary one
    console.log('Pool exhausted, creating temporary container');
    const newContainer = await this.createPoolContainer(true);
    return newContainer;
  }

  private static async createPoolContainer(temporary = false): Promise<PoolContainer> {
    try {
      // Create container with security restrictions
      const containerName = `pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { stdout } = await execAsync(
        `docker run -d --name ${containerName} ` +
        `--network none --memory 128m --cpus="0.5" ` +
        `--read-only --tmpfs /tmp:size=50m ` +
        `--user 1000:1000 ` +
        `${this.IMAGE_NAME}`
      );

      const containerId = stdout.trim();
      const container: PoolContainer = {
        id: containerId,
        busy: temporary,
        lastUsed: Date.now()
      };

      if (!temporary) {
        this.containers.set(containerId, container);
      }

      console.log(`Created container: ${containerId}`);
      return container;
    } catch (error) {
      console.error('Failed to create container:', error);
      throw new Error(`Container creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async runCodeInContainer(
    containerId: string,
    code: string,
    input: string
  ): Promise<Omit<ExecutionResult, 'executionTime'>> {
    const sessionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Detect matplotlib usage and inject plot saving code if needed
      const hasMatplotlib = this.detectMatplotlibUsage(code);
      const processedCode = hasMatplotlib ? this.injectPlotSavingCode(code) : code;

      // Create code file in container using base64 encoding to avoid shell escaping issues
      const codeBase64 = Buffer.from(processedCode, 'utf8').toString('base64');
      const codeCommand = `echo '${codeBase64}' | base64 -d > /tmp/${sessionId}.py`;
      await execAsync(`docker exec ${containerId} sh -c "${codeCommand}"`);

      // Create input file if needed
      if (input) {
        const inputBase64 = Buffer.from(input, 'utf8').toString('base64');
        const inputCommand = `echo '${inputBase64}' | base64 -d > /tmp/${sessionId}.txt`;
        await execAsync(`docker exec ${containerId} sh -c "${inputCommand}"`);
      }

      // Execute Python code with timeout
      const execCommand = input
        ? `docker exec ${containerId} sh -c "cd /tmp && cat ${sessionId}.txt | timeout ${this.EXECUTION_TIMEOUT / 1000}s python ${sessionId}.py"`
        : `docker exec ${containerId} sh -c "cd /tmp && timeout ${this.EXECUTION_TIMEOUT / 1000}s python ${sessionId}.py"`;

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

        if (error.message?.includes('timeout') || error.message?.includes('Execution timeout')) {
          stderr = 'Code execution timed out (10 seconds limit)';
        }
      }

      // Extract plots if matplotlib was used
      let plots: string[] | undefined;
      if (hasMatplotlib && stdout) {
        plots = this.extractPlotsFromOutput(stdout);
        // Remove plot markers from stdout
        stdout = stdout.replace(/\[PLOT_B64:[^\]]+\]/g, '').replace(/\[PLOT_DATA_START\][\s\S]*?\[PLOT_DATA_END\]/g, '');
      }

      // Cleanup files
      await execAsync(`docker exec ${containerId} rm -f /tmp/${sessionId}.*`).catch(() => {
        // Ignore cleanup errors
      });

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        status: stderr.trim() ? 'Error' : 'Success',
        plots
      };

    } catch (error) {
      console.error('Code execution error:', error);

      // Cleanup files on error
      await execAsync(`docker exec ${containerId} rm -f /tmp/${sessionId}.*`).catch(() => {});

      return {
        stdout: '',
        stderr: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'Error'
      };
    }
  }

  private static detectMatplotlibUsage(code: string): boolean {
    return /import\s+matplotlib|from\s+matplotlib|plt\.|pyplot\./i.test(code);
  }

  private static injectPlotSavingCode(code: string): string {
    const plotCapture = `
import os
import base64
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')

# Monkey patch plt.show() to save plots instead
_original_show = plt.show
_plot_counter = 0

def _save_plot(*args, **kwargs):
    global _plot_counter
    plot_path = f"/tmp/plot_{_plot_counter}.png"
    plt.savefig(plot_path, dpi=100, bbox_inches='tight')

    # Read and encode plot
    try:
        with open(plot_path, 'rb') as f:
            plot_data = f.read()
            b64_data = base64.b64encode(plot_data).decode('utf-8')
            print(f"[PLOT_B64:{b64_data}]")
    except Exception as e:
        print(f"[PLOT_ERROR:{e}]")

    _plot_counter += 1
    plt.close()

plt.show = _save_plot

`;
    return plotCapture + '\n' + code;
  }

  private static extractPlotsFromOutput(stdout: string): string[] {
    const plots: string[] = [];
    const plotMatches = stdout.match(/\[PLOT_B64:([^\]]+)\]/g);

    if (plotMatches) {
      for (const match of plotMatches) {
        const base64Data = match.match(/\[PLOT_B64:([^\]]+)\]/)?.[1];
        if (base64Data) {
          plots.push(`data:image/png;base64,${base64Data}`);
        }
      }
    }

    return plots;
  }

  private static returnContainer(containerId: string): void {
    const container = this.containers.get(containerId);
    if (container) {
      container.busy = false;
      container.lastUsed = Date.now();
    }
  }

  private static async cleanupIdleContainers(): Promise<void> {
    const now = Date.now();
    const containersToRemove: string[] = [];

    for (const [id, container] of this.containers) {
      if (!container.busy && (now - container.lastUsed) > this.IDLE_TIMEOUT) {
        containersToRemove.push(id);
      }
    }

    // Remove idle containers
    for (const id of containersToRemove) {
      try {
        await execAsync(`docker stop ${id}`);
        await execAsync(`docker rm ${id}`);
        this.containers.delete(id);
        console.log(`Cleaned up idle container: ${id}`);
      } catch (error) {
        console.error(`Failed to cleanup container ${id}:`, error);
        this.containers.delete(id); // Remove from tracking anyway
      }
    }

    // Ensure minimum pool size
    const currentSize = this.containers.size;
    const neededContainers = Math.max(0, this.POOL_SIZE - currentSize);

    for (let i = 0; i < neededContainers; i++) {
      try {
        await this.createPoolContainer();
      } catch (error) {
        console.warn(`Failed to create replacement container:`, error);
      }
    }
  }

  private static async ensureImageExists(): Promise<void> {
    try {
      await execAsync(`docker inspect ${this.IMAGE_NAME}`);
      console.log('Docker image exists');
    } catch {
      console.log('Building Docker image...');
      await execAsync(`docker build -t ${this.IMAGE_NAME} .`);
      console.log('Docker image built successfully');
    }
  }

  // Get pool statistics
  static getPoolStats(): { total: number; busy: number; idle: number } {
    let busy = 0;
    let idle = 0;

    for (const container of this.containers.values()) {
      if (container.busy) {
        busy++;
      } else {
        idle++;
      }
    }

    return {
      total: this.containers.size,
      busy,
      idle
    };
  }
}