import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir, readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { parsePythonError, formatErrorForDisplay } from '../parsers/python-error-parser';

const execAsync = promisify(exec);

interface PoolContainer {
  id: string;
  busy: boolean;
  lastUsed: number;
  type: 'cpu' | 'gpu';
  temporary: boolean; // Track if this is a temporary container to be deleted after use
}

export interface FileInfo {
  name: string;
  size: number;
  path: string;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: 'Success' | 'Error' | 'Timeout';
  executionTime: number;
  plots?: string[];
  usedGPU?: boolean;
  files?: FileInfo[];
  executionDir?: string;
  pygameBundle?: {
    html: string;
    wasm: string;
    data: string;
    js: string;
  };
}

export class GPUContainerPool {
  private static cpuContainers: Map<string, PoolContainer> = new Map();
  private static gpuContainers: Map<string, PoolContainer> = new Map();

  private static readonly CPU_POOL_SIZE = 20; // Pre-warm 20 containers for fast response
  private static readonly GPU_POOL_SIZE = 5; // GPU containers for ML/AI workloads
  private static readonly IDLE_TIMEOUT = 600000; // 10 minutes - keep containers alive longer
  private static readonly EXECUTION_TIMEOUT = 15000; // 15 seconds (reduced for faster response)
  private static readonly CPU_IMAGE_NAME = 'python-code-runner';
  private static readonly GPU_IMAGE_NAME = 'python-code-runner-gpu';

  private static initialized = false;
  private static initializing = false;
  private static gpuAvailable = false;

  /**
   * Clean up all stopped containers on startup
   */
  private static async cleanupAllContainersOnStartup(): Promise<void> {
    try {
      console.log('Cleaning up stopped pool containers from previous runs...');

      // Find all stopped pool containers (both CPU and GPU)
      const { stdout: stoppedStdout } = await execAsync('docker ps -aq --filter "name=pool-" --filter "status=exited"');
      const stoppedIds = stoppedStdout.trim().split('\n').filter(id => id.length > 0);

      if (stoppedIds.length > 0) {
        console.log(`Found ${stoppedIds.length} stopped containers, removing...`);
        for (const id of stoppedIds) {
          await execAsync(`docker rm -f ${id}`).catch(() => {});
        }
        console.log(`✅ Cleaned up ${stoppedIds.length} stopped containers`);
      } else {
        console.log('No stopped containers found');
      }
    } catch (error) {
      console.warn('Error during startup cleanup:', error);
    }
  }

  /**
   * Reuse existing containers from previous server runs instead of destroying them
   * This makes server restarts much faster!
   */
  private static async reuseExistingContainers(): Promise<void> {
    try {
      console.log('Looking for existing pool containers to reuse...');

      // Get all RUNNING pool containers
      const { stdout: runningStdout } = await execAsync('docker ps -q --filter "name=pool-cpu" --filter "status=running"');
      const runningCpuIds = runningStdout.trim().split('\n').filter(id => id.length > 0);

      const { stdout: runningGpuStdout } = await execAsync('docker ps -q --filter "name=pool-gpu" --filter "status=running"');
      const runningGpuIds = runningGpuStdout.trim().split('\n').filter(id => id.length > 0);

      // Reuse running CPU containers (up to pool size)
      const excessCpuIds: string[] = [];
      for (let i = 0; i < runningCpuIds.length; i++) {
        const id = runningCpuIds[i];
        if (this.cpuContainers.size < this.CPU_POOL_SIZE) {
          this.cpuContainers.set(id, {
            id,
            busy: false,
            lastUsed: Date.now(),
            type: 'cpu',
            temporary: false
          });
          console.log(`Reused existing CPU container: ${id.substring(0, 12)}`);
        } else {
          // Mark excess containers for removal
          excessCpuIds.push(id);
        }
      }

      // Reuse running GPU containers (up to pool size)
      const excessGpuIds: string[] = [];
      for (let i = 0; i < runningGpuIds.length; i++) {
        const id = runningGpuIds[i];
        if (this.gpuContainers.size < this.GPU_POOL_SIZE) {
          this.gpuContainers.set(id, {
            id,
            busy: false,
            lastUsed: Date.now(),
            type: 'gpu',
            temporary: false
          });
          console.log(`Reused existing GPU container: ${id.substring(0, 12)}`);
        } else {
          // Mark excess containers for removal
          excessGpuIds.push(id);
        }
      }

      console.log(`Reused ${this.cpuContainers.size} CPU and ${this.gpuContainers.size} GPU containers`);

      // Remove excess running containers beyond pool size
      const totalExcess = excessCpuIds.length + excessGpuIds.length;
      if (totalExcess > 0) {
        console.log(`Removing ${excessCpuIds.length} excess CPU and ${excessGpuIds.length} excess GPU containers...`);
        for (const id of [...excessCpuIds, ...excessGpuIds]) {
          try {
            await execAsync(`docker stop -t 2 ${id}`);
            await execAsync(`docker rm -f ${id}`);
            console.log(`Removed excess container: ${id.substring(0, 12)}`);
          } catch (error) {
            console.warn(`Failed to remove excess container ${id.substring(0, 12)}:`, error);
          }
        }
        console.log(`✅ Removed ${totalExcess} excess containers`);
      }

      // Only clean up STOPPED/EXITED containers (not running ones)
      const { stdout: stoppedStdout } = await execAsync('docker ps -aq --filter "name=pool-" --filter "status=exited"');
      const stoppedIds = stoppedStdout.trim().split('\n').filter(id => id.length > 0);

      if (stoppedIds.length > 0) {
        console.log(`Cleaning up ${stoppedIds.length} stopped containers...`);
        for (const id of stoppedIds) {
          await execAsync(`docker rm -f ${id}`).catch(() => {});
        }
      }

    } catch (error) {
      console.warn('Error during container reuse:', error);
    }
  }

  static async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) {
      while (this.initializing && !this.initialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.initializing = true;
    console.log('Initializing GPU-aware container pool...');

    // Clean up stopped containers from previous runs FIRST
    await this.cleanupAllContainersOnStartup();

    // Reuse existing containers from previous runs (FAST!)
    await this.reuseExistingContainers();

    // Check GPU availability
    this.gpuAvailable = await this.checkGPUAvailability();
    console.log(`GPU available: ${this.gpuAvailable}`);

    // Build CPU image
    await this.ensureImageExists(this.CPU_IMAGE_NAME, 'Dockerfile');

    // Build GPU image if GPU is available
    if (this.gpuAvailable) {
      await this.ensureImageExists(this.GPU_IMAGE_NAME, 'Dockerfile.gpu');
    }

    // Only create containers if we don't have enough (reused containers count!)
    const neededCpuContainers = this.CPU_POOL_SIZE - this.cpuContainers.size;
    if (neededCpuContainers > 0) {
      console.log(`Creating ${neededCpuContainers} new CPU containers...`);
      for (let i = 0; i < neededCpuContainers; i++) {
        try {
          await this.createPoolContainer('cpu');
        } catch (error) {
          console.warn(`Failed to create CPU container ${i}:`, error);
        }
      }
    } else {
      console.log('CPU pool already full from reused containers!');
    }

    // Create GPU container pool (only if needed)
    if (this.gpuAvailable) {
      const neededGpuContainers = this.GPU_POOL_SIZE - this.gpuContainers.size;
      if (neededGpuContainers > 0) {
        console.log(`Creating ${neededGpuContainers} new GPU containers...`);
        for (let i = 0; i < neededGpuContainers; i++) {
          try {
            await this.createPoolContainer('gpu');
          } catch (error) {
            console.warn(`Failed to create GPU container ${i}:`, error);
          }
        }
      } else {
        console.log('GPU pool already full from reused containers!');
      }
    }

    // Start cleanup task
    setInterval(() => this.cleanupIdleContainers(), 60000);

    this.initialized = true;
    this.initializing = false;
    console.log(`Pool initialized - CPU: ${this.cpuContainers.size}, GPU: ${this.gpuContainers.size}`);
  }

  static async executeCode(code: string, input: string = '', images: Array<{ name: string; data: string }> = [], userSessionId?: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Detect if code requires GPU
      const requiresGPU = this.detectGPUUsage(code);
      const useGPU = requiresGPU && this.gpuAvailable;

      console.log(`Execution request - GPU required: ${requiresGPU}, GPU available: ${this.gpuAvailable}, Using GPU: ${useGPU}, Session: ${userSessionId || 'none'}`);

      // Get appropriate container
      const container = await this.getAvailableContainer(useGPU ? 'gpu' : 'cpu');

      try {
        // Execute code in container
        const result = await this.runCodeInContainer(container.id, code, input, useGPU, images, userSessionId);

        const executionTime = Date.now() - startTime;
        return {
          ...result,
          executionTime,
          usedGPU: useGPU
        };
      } finally {
        // Return container to pool (or delete if temporary)
        await this.returnContainer(container.id, container.type);
      }
    } catch (error) {
      console.error('Container execution error:', error);
      const executionTime = Date.now() - startTime;

      return {
        stdout: '',
        stderr: `Container execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'Error',
        executionTime,
        usedGPU: false
      };
    }
  }

  private static async checkGPUAvailability(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('nvidia-smi --query-gpu=name --format=csv,noheader');
      console.log('GPU detected:', stdout.trim());
      return true;
    } catch {
      console.log('No GPU detected or NVIDIA drivers not installed');
      return false;
    }
  }

  private static detectGPUUsage(code: string): boolean {
    // Detect GPU-related libraries and operations
    const gpuPatterns = [
      /import\s+torch/i,
      /from\s+torch/i,
      /torch\.(cuda|device|tensor)/i,
      /\.to\(['"]cuda['"]\)/i,
      /\.cuda\(\)/i,
      /import\s+tensorflow/i,
      /from\s+tensorflow/i,
      /tf\.device\(['"]GPU/i,
      /import\s+cupy/i,
      /from\s+cupy/i,
      /cp\./i,
      /@cuda\.jit/i,
      /from\s+numba\s+import\s+cuda/i,
    ];

    return gpuPatterns.some(pattern => pattern.test(code));
  }

  private static async getAvailableContainer(type: 'cpu' | 'gpu'): Promise<PoolContainer> {
    const pool = type === 'gpu' ? this.gpuContainers : this.cpuContainers;
    const poolSize = type === 'gpu' ? this.GPU_POOL_SIZE : this.CPU_POOL_SIZE;

    // PRIORITY 1: Find free container from the main pool (non-temporary containers)
    for (const [id, container] of pool) {
      if (!container.busy && !container.temporary) {
        // Verify container still exists before using it
        try {
          await execAsync(`docker inspect ${id}`);
          container.busy = true;
          container.lastUsed = Date.now();
          console.log(`Using idle ${type.toUpperCase()} pool container: ${id.substring(0, 12)}`);
          return container;
        } catch (error) {
          // Container no longer exists, remove from pool
          console.warn(`Container ${id.substring(0, 12)} no longer exists, removing from pool`);
          pool.delete(id);
          continue;
        }
      }
    }

    // PRIORITY 2: All pool containers busy - create temporary one immediately
    console.log(`All ${type.toUpperCase()} pool containers busy (${pool.size} total), creating temporary container`);
    const newContainer = await this.createPoolContainer(type, true);
    return newContainer;
  }

  private static async createPoolContainer(type: 'cpu' | 'gpu', temporary = false): Promise<PoolContainer> {
    try {
      const containerName = `pool-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const imageName = type === 'gpu' ? this.GPU_IMAGE_NAME : this.CPU_IMAGE_NAME;

      let dockerCmd = `docker run -d --name ${containerName} --network none `;

      if (type === 'gpu') {
        // GPU container with more resources
        dockerCmd += `--gpus all --memory 4g --cpus="2.0" `;
        dockerCmd += `--read-only --tmpfs /tmp:size=100m `;
        dockerCmd += `--user 1000:1000 `;
        dockerCmd += `-e NVIDIA_VISIBLE_DEVICES=all `;
        dockerCmd += `-e NVIDIA_DRIVER_CAPABILITIES=compute,utility `;
      } else {
        // CPU container with limited resources
        dockerCmd += `--memory 128m --cpus="0.5" `;
        dockerCmd += `--read-only --tmpfs /tmp:size=50m `;
        dockerCmd += `--user 1000:1000 `;
      }

      dockerCmd += imageName;

      const { stdout } = await execAsync(dockerCmd);
      const containerId = stdout.trim();

      const container: PoolContainer = {
        id: containerId,
        busy: true, // Always start as busy
        lastUsed: Date.now(),
        type,
        temporary // Mark if temporary
      };

      // Add to pool tracking (even temporary ones, for cleanup)
      if (type === 'gpu') {
        this.gpuContainers.set(containerId, container);
      } else {
        this.cpuContainers.set(containerId, container);
      }

      console.log(`Created ${temporary ? 'TEMPORARY' : 'pool'} ${type.toUpperCase()} container: ${containerId.substring(0, 12)}`);
      return container;
    } catch (error) {
      console.error(`Failed to create ${type} container:`, error);
      throw new Error(`Container creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async runCodeInContainer(
    containerId: string,
    code: string,
    input: string,
    isGPU: boolean,
    images: Array<{ name: string; data: string }> = [],
    userSessionId?: string
  ): Promise<Omit<ExecutionResult, 'executionTime' | 'usedGPU'>> {
    const sessionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create or use persistent directory for user session
    const persistentDir = userSessionId ? join(tmpdir(), `user_files_${userSessionId}`) : null;
    if (persistentDir) {
      await mkdir(persistentDir, { recursive: true });
      console.log(`[Persistent] Using directory: ${persistentDir}`);
    }

    try {
      // Detect matplotlib usage and inject plot saving code if needed
      const hasMatplotlib = this.detectMatplotlibUsage(code);
      let processedCode = hasMatplotlib ? this.injectPlotSavingCode(code) : code;

      // Detect pygame usage and compile with Pygbag for interactive gameplay
      const hasPygame = this.detectPygameUsage(code);
      let pygameBundle: { html: string; wasm: string; data: string; js: string } | undefined;
      let skipDockerExecution = false;

      if (hasPygame) {
        console.log('[Pygame] Detected Pygame code, compiling with Pygbag for interactive gameplay...');

        // STEP 1: Execute code in regular Python to capture print output
        let pygamePrintOutput = '';
        try {
          console.log('[Pygame] Executing code in regular Python to capture print output...');

          // Create modified code that exits after a few frames to capture initial print output
          // Add frame counter at the start, and modify the while loop to limit iterations
          const captureCode = `frame_count = 0\n${code}`
            .replace(
              /while\s+running:/,
              `while running and frame_count < 5:`  // Run only 5 frames
            )
            .replace(
              /pygame\.display\.(flip|update)\(\)/g,
              (match, method) => {
                // Only increment inside the while loop (check if next lines are indented)
                return `pygame.display.${method}()`;
              }
            )
            .replace(
              /while running and frame_count < 5:/,
              `while running and frame_count < 5:\n    frame_count += 1`  // Increment at start of loop
            );

          const hostCodePath = join(tmpdir(), `${sessionId}_capture.py`);
          await writeFile(hostCodePath, captureCode, 'utf8');

          const isWindows = process.platform === 'win32';
          const catCommand = isWindows ? 'type' : 'cat';
          await execAsync(`${catCommand} "${hostCodePath}" | docker exec -i ${containerId} sh -c "cat > /tmp/${sessionId}_capture.py"`);

          const { stdout: capturedOutput } = await execAsync(
            `docker exec ${containerId} sh -c "cd /tmp && timeout 3s python ${sessionId}_capture.py 2>&1"`,
            { timeout: 4000 }
          );

          // Clean up Pygame initialization messages but keep actual print output
          pygamePrintOutput = capturedOutput
            .split('\n')
            .filter(line => {
              const trimmed = line.trim();
              // Filter out empty lines
              if (!trimmed) return false;
              // Filter out Pygame system messages
              if (trimmed.includes('pygame')) return false;
              if (trimmed.includes('SDL')) return false;
              if (trimmed.includes('Hello from the pygame')) return false;
              if (trimmed.includes('community')) return false;
              // Filter out Python warnings
              if (trimmed.includes('warnings.warn')) return false;
              if (trimmed.includes('DeprecationWarning')) return false;
              if (trimmed.includes('UserWarning')) return false;
              if (trimmed.startsWith('warnings.')) return false;
              return true;
            })
            .join('\n')
            .trim();

          console.log(`[Pygame] Captured print output: "${pygamePrintOutput}"`);

          await unlink(hostCodePath).catch(() => {});
          await execAsync(`docker exec ${containerId} rm -f /tmp/${sessionId}_capture.py`).catch(() => {});
        } catch (error) {
          console.log('[Pygame] Failed to capture print output from execution:', error);
          pygamePrintOutput = '';
        }

        // STEP 2: Compile with Pygbag for interactive gameplay
        const bundle = await this.compilePygame(code, sessionId, images);
        if (bundle) {
          pygameBundle = bundle;
          skipDockerExecution = true;
          console.log('[Pygame] Pygbag compilation successful');

          return {
            stdout: pygamePrintOutput,
            stderr: '',
            status: 'Success',
            plots: undefined,
            pygameBundle
          };
        } else {
          console.warn('[Pygame] Pygbag compilation failed, falling back to screenshot mode');
          processedCode = this.injectPygameWrapper(processedCode);
        }
      }

      // Skip Docker execution if Pygbag succeeded
      if (skipDockerExecution) {
        return {
          stdout: '',
          stderr: '',
          status: 'Success',
          plots: undefined,
          pygameBundle
        };
      }

      // Inject GPU verification code if using GPU
      if (isGPU) {
        processedCode = this.injectGPUVerificationCode(processedCode);
      }

      // Create unique working directory for this execution
      const workDir = `/tmp/${sessionId}_work`;
      await execAsync(`docker exec ${containerId} sh -c "mkdir -p ${workDir}"`).catch(() => {});

      // If using persistent directory, copy all existing files from host to container
      if (persistentDir) {
        try {
          const files = await readdir(persistentDir).catch(() => []);
          if (files.length > 0) {
            console.log(`[Persistent] Found ${files.length} existing file(s) to copy to container`);

            // Determine the correct command for piping file content (Windows vs Unix)
            const isWindows = process.platform === 'win32';
            const catCommand = isWindows ? 'type' : 'cat';

            for (const file of files) {
              const hostFile = join(persistentDir, file);
              try {
                // Get file size for logging
                const fileStats = await stat(hostFile);
                console.log(`[Persistent] Copying ${file} (${fileStats.size} bytes) from host to container`);
                console.log(`[Persistent]   Host path: ${hostFile}`);
                console.log(`[Persistent]   Container target: ${workDir}/${file}`);

                // Use stdin piping instead of docker cp (more reliable on Windows)
                // Read file content and pipe it into the container
                await execAsync(`${catCommand} "${hostFile}" | docker exec -i ${containerId} sh -c "cat > ${workDir}/${file}"`);

                // Verify the file exists in the container and check size
                const { stdout: verifyOutput } = await execAsync(
                  `docker exec ${containerId} sh -c "test -f ${workDir}/${file} && wc -c < ${workDir}/${file} || echo '0'"`
                );

                const containerSize = parseInt(verifyOutput.trim());
                if (containerSize > 0 && containerSize === fileStats.size) {
                  console.log(`[Persistent] ✅ Successfully copied ${file} (verified: ${containerSize} bytes in container)`);
                } else if (containerSize > 0) {
                  console.log(`[Persistent] ⚠️ Warning: ${file} size mismatch (host: ${fileStats.size}, container: ${containerSize})`);
                } else {
                  console.log(`[Persistent] ❌ Failed: ${file} was not found in container after copy`);
                }
              } catch (error) {
                console.log(`[Persistent] ❌ Failed to copy ${file}:`, error);
              }
            }
          } else {
            console.log(`[Persistent] No existing files to copy (empty persistent directory)`);
          }
        } catch (error) {
          console.log(`[Persistent] Error during file copy operation:`, error);
        }
      }

      // Create code file in container using stdin piping
      // This avoids Windows "command line too long" error and works with read-only containers
      const hostCodePath = join(tmpdir(), `${sessionId}.py`);
      await writeFile(hostCodePath, processedCode, 'utf8');

      try {
        // Use stdin piping to write file content (works with read-only containers)
        // On Windows, use type instead of cat
        const isWindows = process.platform === 'win32';
        const catCommand = isWindows ? 'type' : 'cat';
        await execAsync(`${catCommand} "${hostCodePath}" | docker exec -i ${containerId} sh -c "cat > ${workDir}/${sessionId}.py"`);

        // Create input file if needed
        if (input) {
          const hostInputPath = join(tmpdir(), `${sessionId}.txt`);
          await writeFile(hostInputPath, input, 'utf8');

          try {
            // Use stdin piping for input file as well
            await execAsync(`${catCommand} "${hostInputPath}" | docker exec -i ${containerId} sh -c "cat > ${workDir}/${sessionId}.txt"`);
          } finally {
            // Clean up host input file
            await unlink(hostInputPath).catch(() => {});
          }
        }
      } finally {
        // Clean up host code file
        await unlink(hostCodePath).catch(() => {});
      }

      // Execute Python code with timeout in the unique working directory
      const timeout = isGPU ? this.EXECUTION_TIMEOUT : 5000; // 5 seconds for simple student code
      const execCommand = input
        ? `docker exec ${containerId} sh -c "cd ${workDir} && cat ${sessionId}.txt | timeout ${timeout / 1000}s python ${sessionId}.py"`
        : `docker exec ${containerId} sh -c "cd ${workDir} && timeout ${timeout / 1000}s python ${sessionId}.py"`;

      let stdout = '';
      let stderr = '';

      try {
        const result = await Promise.race([
          execAsync(execCommand),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Execution timeout')), timeout);
          })
        ]);

        stdout = result.stdout || '';
        stderr = result.stderr || '';
      } catch (error: any) {
        stdout = error.stdout || '';
        stderr = error.stderr || '';

        // Only treat as timeout if we explicitly threw the timeout error (not just stderr from Python)
        // Check if error is from our Promise.race timeout, not from the command containing word "timeout"
        if (error.message === 'Execution timeout' && !stderr) {
          stderr = `Code execution timed out (${timeout / 1000} seconds limit)`;
        }
      }

      // Extract plots if matplotlib was used
      let plots: string[] | undefined;
      if (hasMatplotlib && stdout) {
        plots = this.extractPlotsFromOutput(stdout);
        stdout = stdout.replace(/\[PLOT_B64:[^\]]+\]/g, '').replace(/\[PLOT_DATA_START\][\s\S]*?\[PLOT_DATA_END\]/g, '');
      }

      // Extract pygame frames if pygame was used
      if (hasPygame && stdout) {
        const pygameFrames = this.extractPygameFrames(stdout);
        if (pygameFrames.length > 0) {
          plots = plots ? [...plots, ...pygameFrames] : pygameFrames;
        }
        // Clean up pygame frame markers from stdout
        stdout = stdout.replace(/\[PYGAME_FRAME:\d+\]data:image\/png;base64,[^\[]+\[\/PYGAME_FRAME\]/g, '');
      }

      // Scan for files and handle persistence
      let files: FileInfo[] | undefined;
      let executionDir: string | undefined;
      try {
        // Wait a moment for file operations to complete and buffers to flush
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get file list from the working directory (excluding the session Python script and input file)
        const { stdout: filePathsOutput } = await execAsync(
          `docker exec ${containerId} sh -c "find ${workDir} -maxdepth 1 -type f ! -name '${sessionId}.py' ! -name '${sessionId}.txt' 2>/dev/null || true"`
        ).catch(() => ({ stdout: '' }));

        console.log('[File Scan] Raw find output:', filePathsOutput);

        // If using persistent directory, copy all files from container to persistent host directory
        if (persistentDir && filePathsOutput.trim()) {
          const filePaths = filePathsOutput.trim().split('\n').filter(p => p.length > 0 && p.trim() !== '');
          console.log(`[Persistent] Copying ${filePaths.length} files back to host`);

          for (const containerPath of filePaths) {
            const fileName = containerPath.split('/').pop() || containerPath;
            const hostPath = join(persistentDir, fileName);

            try {
              // Read file content from container
              const { stdout: fileContent } = await execAsync(
                `docker exec ${containerId} sh -c "cat ${containerPath}"`
              ).catch(() => ({ stdout: '' }));

              if (fileContent) {
                // Write to persistent directory
                await writeFile(hostPath, fileContent, 'utf8');
                console.log(`[Persistent] Saved: ${fileName} (${fileContent.length} bytes)`);
              }
            } catch (error) {
              console.log(`[Persistent] Error saving ${fileName}:`, error);
            }
          }
        }

        // List all files from persistent directory (if exists) or working directory
        const hostDir = persistentDir || join(tmpdir(), `files_${sessionId}`);

        if (persistentDir) {
          // List all files from persistent directory
          try {
            const fileNames = await readdir(persistentDir).catch(() => []);
            if (fileNames.length > 0) {
              console.log(`[Persistent] Found ${fileNames.length} total files in persistent directory`);

              const fileInfos: FileInfo[] = [];
              for (const fileName of fileNames) {
                const hostPath = join(persistentDir, fileName);
                try {
                  const fileStats = await stat(hostPath);
                  const size = fileStats.size;

                  if (size <= 5 * 1024 * 1024) {
                    fileInfos.push({ name: fileName, size, path: hostPath });
                  }
                } catch (error) {
                  console.log(`[Persistent] Error reading ${fileName}:`, error);
                }
              }

              if (fileInfos.length > 0) {
                files = fileInfos;
                executionDir = persistentDir;
                console.log(`[Persistent] ✅ ${fileInfos.length} file(s) available`);
              }
            }
          } catch (error) {
            console.log(`[Persistent] Error listing files:`, error);
          }
        }
      } catch (error) {
        console.log('[File Scan] Error during file scan:', error);
      }

      // Cleanup working directory in container
      await execAsync(`docker exec ${containerId} rm -rf ${workDir}`).catch(() => {});

      // Parse and format Python errors for better user experience
      let formattedStderr = stderr.trim();
      if (formattedStderr) {
        const parsedError = parsePythonError(formattedStderr);
        if (parsedError) {
          formattedStderr = formatErrorForDisplay(parsedError);
        }
      }

      return {
        stdout: stdout.trim(),
        stderr: formattedStderr,
        status: formattedStderr ? 'Error' : 'Success',
        plots,
        files,
        executionDir,
        pygameBundle
      };

    } catch (error) {
      console.error('Code execution error:', error);
      await execAsync(`docker exec ${containerId} rm -f /tmp/${sessionId}.*`).catch(() => {});

      const errorMessage = `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      const parsedError = parsePythonError(errorMessage);

      return {
        stdout: '',
        stderr: parsedError ? formatErrorForDisplay(parsedError) : errorMessage,
        status: 'Error'
      };
    }
  }

  private static detectMatplotlibUsage(code: string): boolean {
    return /import\s+matplotlib|from\s+matplotlib|plt\.|pyplot\./i.test(code);
  }

  private static detectPygameUsage(code: string): boolean {
    return /import\s+pygame|from\s+pygame/i.test(code);
  }

  private static injectPygameWrapper(code: string): string {
    const pygameWrapper = `
# Pygame headless wrapper for Code Runner
import pygame
import sys
import os
import time

_HEADLESS_MODE = os.environ.get('SDL_VIDEODRIVER') == 'dummy'
_MAX_FRAMES = 120  # Maximum frames to render in headless mode
_FRAME_COUNT = 0
_START_TIME = time.time()
_MAX_TIME = 8  # Maximum execution time in seconds

# Ensure plots directory exists with proper permissions
_PLOTS_DIR = "/tmp/plots"
if not os.path.exists(_PLOTS_DIR):
    try:
        os.makedirs(_PLOTS_DIR, mode=0o777, exist_ok=True)
        print(f"[Pygame Headless Mode] Created directory: {_PLOTS_DIR}")
    except Exception as e:
        print(f"[Pygame Headless Mode] Warning: Could not create plots directory: {e}")

if _HEADLESS_MODE:
    print("[Pygame Headless Mode] Running pygame code in headless environment")
    print("[Pygame Headless Mode] Will auto-exit after {} frames or {} seconds".format(_MAX_FRAMES, _MAX_TIME))

# Monkey-patch pygame.display.flip and update to track frames
_original_flip = pygame.display.flip
_original_update = pygame.display.update

def _headless_flip():
    global _FRAME_COUNT
    result = _original_flip()

    if _HEADLESS_MODE:
        _FRAME_COUNT += 1

        # Save screenshot at specific intervals
        if _FRAME_COUNT in [1, 30, 60, 90, 120]:
            try:
                screen = pygame.display.get_surface()
                if screen:
                    # Ensure directory exists
                    os.makedirs(_PLOTS_DIR, mode=0o777, exist_ok=True)
                    filename = f"{_PLOTS_DIR}/pygame_frame_{_FRAME_COUNT:04d}.png"
                    pygame.image.save(screen, filename)
                    # Output image path for extraction (similar to matplotlib)
                    import base64
                    with open(filename, 'rb') as f:
                        img_data = base64.b64encode(f.read()).decode('utf-8')
                        print(f"[PYGAME_FRAME:{_FRAME_COUNT}]data:image/png;base64,{img_data}[/PYGAME_FRAME]")
                    print(f"[Pygame Headless Mode] Saved frame {_FRAME_COUNT}")
            except Exception as e:
                print(f"[Pygame Headless Mode] Error saving frame: {e}")

        # Auto-exit conditions
        elapsed_time = time.time() - _START_TIME
        if _FRAME_COUNT >= _MAX_FRAMES or elapsed_time >= _MAX_TIME:
            print(f"[Pygame Headless Mode] Rendered {_FRAME_COUNT} frames in {elapsed_time:.2f}s")
            print("[Pygame Headless Mode] Auto-exiting to prevent timeout")
            pygame.quit()
            sys.exit(0)

    return result

def _headless_update(*args, **kwargs):
    _headless_flip()
    return _original_update(*args, **kwargs)

# Apply monkey patches
pygame.display.flip = _headless_flip
pygame.display.update = _headless_update

# User code starts here
`;
    return pygameWrapper + '\n' + code;
  }

  private static injectPlotSavingCode(code: string): string {
    const plotCapture = `
import os
import base64
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')

_original_show = plt.show
_plot_counter = 0

def _save_plot(*args, **kwargs):
    global _plot_counter
    plot_path = f"/tmp/plot_{_plot_counter}.png"
    plt.savefig(plot_path, dpi=100, bbox_inches='tight')

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

  private static injectGPUVerificationCode(code: string): string {
    const gpuVerification = `
# GPU Verification Code
import sys
try:
    if 'torch' in sys.modules or 'import torch' in '''${code.replace(/'/g, "\\'")}''':
        import torch
        if torch.cuda.is_available():
            print(f"[GPU_INFO: Using {torch.cuda.get_device_name(0)}]")
            print(f"[GPU_MEMORY: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB]")
        else:
            print("[GPU_WARNING: CUDA not available, using CPU]")

    if 'tensorflow' in sys.modules or 'import tensorflow' in '''${code.replace(/'/g, "\\'")}''':
        import tensorflow as tf
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            print(f"[GPU_INFO: TensorFlow using {len(gpus)} GPU(s)]")
        else:
            print("[GPU_WARNING: TensorFlow using CPU]")
except Exception as e:
    pass  # Silent fail for GPU verification
`;
    return gpuVerification + '\n' + code;
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

  private static extractPygameFrames(stdout: string): string[] {
    const frames: string[] = [];
    // Match pygame frame markers: [PYGAME_FRAME:1]data:image/png;base64,...[/PYGAME_FRAME]
    const frameMatches = stdout.match(/\[PYGAME_FRAME:\d+\](data:image\/png;base64,[^\[]+)\[\/PYGAME_FRAME\]/g);

    if (frameMatches) {
      for (const match of frameMatches) {
        const frameData = match.match(/\[PYGAME_FRAME:\d+\](data:image\/png;base64,[^\[]+)\[\/PYGAME_FRAME\]/)?.[1];
        if (frameData) {
          frames.push(frameData);
        }
      }
    }

    return frames;
  }

  /**
   * Compile Pygame code to WebAssembly using Pygbag for interactive browser gameplay
   */
  private static async compilePygame(code: string, sessionId: string, images: Array<{ name: string; data: string }> = []): Promise<{
    html: string;
    wasm: string;
    data: string;
    js: string;
  } | null> {
    try {
      console.log(`[Pygbag] Starting Pygame compilation for session ${sessionId}`);

      const tempDir = join(process.cwd(), 'temp');
      const pygameDir = join(tempDir, `pygame_${sessionId}`);
      const buildDir = join(pygameDir, 'build', 'web');

      await mkdir(pygameDir, { recursive: true });

      // Add stdout interceptor for print capture
      const stdoutInterceptor = `
import sys
_original_init = None
_interceptor_active = False

try:
    import platform
    if platform.system() == 'Emscripten':
        import pygame
        import js

        _orig_stdout = sys.stdout
        _printed_messages = set()

        class Out:
            def write(self, s):
                global _printed_messages
                _orig_stdout.write(s)
                if _interceptor_active and s.strip():
                    text = s.strip()

                    # Filter system/debug messages
                    skip_keywords = ['pygame', 'SDL', '__call__', 'coroutine', 'object at 0x',
                                   '.call', 'fire_event', 'patch_', 'asyncio']
                    if any(kw in text for kw in skip_keywords):
                        return

                    # Filter single characters or just numbers
                    if len(text) <= 2 or text.isdigit():
                        return

                    # Block duplicate messages - only allow each unique message once
                    if text in _printed_messages:
                        return

                    _printed_messages.add(text)
                    try:
                        js.eval(f"window.parent.postMessage({{type:'pygame-console',message:{repr(text)}}}, '*')")
                        _orig_stdout.flush()  # Force flush to ensure message is sent
                    except: pass
            def flush(self):
                _orig_stdout.flush()

        # Activate interceptor after pygame.init()
        _original_init = pygame.init
        def _patched_init():
            global _interceptor_active
            result = _original_init()
            _interceptor_active = True
            sys.stdout = Out()
            return result
        pygame.init = _patched_init
except: pass
`;

      // Pygbag async transformation - NO WRAPPING, just inject await asyncio.sleep(0)
      // Step 1: Remove pygame.quit() and sys.exit()
      let processedCode = code
        .replace(/pygame\.quit\(\)\s*/g, '')
        .replace(/sys\.exit\(\)\s*/g, '');

      // Step 2: Check if asyncio is already imported
      const hasAsyncioImport = /^import\s+asyncio/m.test(processedCode) || /^from\s+asyncio/m.test(processedCode);

      // Step 3: Split into lines and inject await asyncio.sleep(0) after display updates and in while loops
      const lines = processedCode.split('\n');
      const transformedLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        transformedLines.push(line);

        // Inject await asyncio.sleep(0) AFTER pygame.display.flip/update
        if (trimmed.includes('pygame.display.flip()') || trimmed.includes('pygame.display.update()')) {
          const indent = line.match(/^(\s*)/)?.[1] || '';
          transformedLines.push(`${indent}await asyncio.sleep(0)`);
        }

        // Inject await asyncio.sleep(0) at the start of while loops to prevent freezing
        if (trimmed.startsWith('while ') && trimmed.endsWith(':')) {
          // Look ahead to find the first line inside the while loop
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextIndent = nextLine.match(/^(\s*)/)?.[1] || '';
            transformedLines.push(`${nextIndent}await asyncio.sleep(0)`);
          }
        }
      }

      // Step 4: Add asyncio import at the top if not present
      let asyncCode = transformedLines.join('\n');
      if (!hasAsyncioImport) {
        asyncCode = `import asyncio\n${asyncCode}`;
      }

      const instrumentedCode = stdoutInterceptor + asyncCode;

      console.log('[Pygbag] ========== TRANSFORMED CODE ==========');
      console.log(asyncCode);
      console.log('[Pygbag] ========== END ==========');

      const mainPyPath = join(pygameDir, 'main.py');
      await writeFile(mainPyPath, instrumentedCode, 'utf8');

      // Save uploaded images to pygameDir for Pygame to load
      if (images && images.length > 0) {
        console.log(`[Pygbag] Saving ${images.length} uploaded image(s) to Pygame directory...`);
        for (const img of images) {
          try {
            // Remove data:image/png;base64, or data:image/jpeg;base64, prefix
            const base64Data = img.data.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            // Write image to pygameDir so it's available to Python code
            const imagePath = join(pygameDir, img.name);
            await writeFile(imagePath, buffer);
            console.log(`[Pygbag] Saved image: ${img.name} (${buffer.length} bytes)`);
          } catch (imgError) {
            console.error(`[Pygbag] Failed to save image ${img.name}:`, imgError);
          }
        }
      }

      console.log(`[Pygbag] Created temp directory with instrumented code: ${pygameDir}`);

      // Run Pygbag build inside Docker container
      const buildCmd = `docker run --rm -v "${pygameDir}:/app/game:rw" --workdir /app ${this.CPU_IMAGE_NAME} python3 -m pygbag --build /app/game`;
      console.log(`[Pygbag] Running build command: ${buildCmd}`);

      const { stdout, stderr } = await execAsync(buildCmd, { timeout: 30000 });

      console.log(`[Pygbag] Build completed`);
      if (stdout) console.log(`[Pygbag] Stdout:`, stdout);
      if (stderr) console.log(`[Pygbag] Stderr:`, stderr);

      // Read generated files and encode as base64
      // Pygbag 0.9.2 generates: index.html, game.apk, favicon.png
      // The HTML loads Pygbag runtime from CDN
      const htmlContent = await readFile(join(buildDir, 'index.html'), 'utf8');
      const apkContent = await readFile(join(buildDir, 'game.apk'));

      const bundle = {
        html: Buffer.from(htmlContent).toString('base64'),
        wasm: apkContent.toString('base64'), // game.apk (reuse wasm field)
        data: '', // Not used in 0.9.2
        js: ''    // Not used in 0.9.2
      };

      console.log(`[Pygbag] Successfully compiled and encoded bundle (HTML + APK with live console)`);

      // Cleanup temp directory
      await execAsync(`rm -rf "${pygameDir}"`).catch(() => {});

      return bundle;
    } catch (error) {
      console.error(`[Pygbag] Compilation failed:`, error);
      return null;
    }
  }

  private static async returnContainer(containerId: string, type: 'cpu' | 'gpu'): Promise<void> {
    const pool = type === 'gpu' ? this.gpuContainers : this.cpuContainers;
    const container = pool.get(containerId);

    if (container) {
      if (container.temporary) {
        // Delete temporary container immediately after use
        console.log(`Deleting temporary ${type.toUpperCase()} container: ${containerId.substring(0, 12)}`);
        try {
          await execAsync(`docker stop -t 2 ${containerId}`);
          await execAsync(`docker rm -f ${containerId}`);
          pool.delete(containerId);
          console.log(`✅ Temporary container deleted`);
        } catch (error) {
          console.error(`Failed to delete temporary container:`, error);
          pool.delete(containerId); // Remove from tracking anyway
        }
      } else {
        // Return pool container to available state
        container.busy = false;
        container.lastUsed = Date.now();
        console.log(`Returned ${type.toUpperCase()} pool container to idle state: ${containerId.substring(0, 12)}`);
      }
    }
  }

  private static async cleanupIdleContainers(): Promise<void> {
    const now = Date.now();

    await this.cleanupPool(this.cpuContainers, 'CPU', this.CPU_POOL_SIZE);
    await this.cleanupPool(this.gpuContainers, 'GPU', this.GPU_POOL_SIZE);
  }

  private static async cleanupPool(
    pool: Map<string, PoolContainer>,
    poolName: string,
    minSize: number
  ): Promise<void> {
    const now = Date.now();
    const containersToRemove: string[] = [];

    for (const [id, container] of pool) {
      if (!container.busy && (now - container.lastUsed) > this.IDLE_TIMEOUT) {
        containersToRemove.push(id);
      }
    }

    for (const id of containersToRemove) {
      try {
        // Force stop with timeout, then force remove
        await execAsync(`docker stop -t 2 ${id}`).catch(() => {
          // If stop fails, try kill
          return execAsync(`docker kill ${id}`).catch(() => {});
        });
        await execAsync(`docker rm -f ${id}`);
        pool.delete(id);
        console.log(`Cleaned up idle ${poolName} container: ${id.substring(0, 12)}`);
      } catch (error) {
        console.error(`Failed to cleanup ${poolName} container ${id.substring(0, 12)}:`, error);
        // Still remove from pool tracking even if Docker cleanup fails
        pool.delete(id);
      }
    }

    // Ensure minimum pool size
    const currentSize = pool.size;
    const neededContainers = Math.max(0, minSize - currentSize);
    const type = poolName === 'GPU' ? 'gpu' : 'cpu';

    for (let i = 0; i < neededContainers; i++) {
      try {
        await this.createPoolContainer(type);
      } catch (error) {
        console.warn(`Failed to create replacement ${poolName} container:`, error);
      }
    }
  }

  private static async ensureImageExists(imageName: string, dockerfile: string): Promise<void> {
    try {
      await execAsync(`docker inspect ${imageName}`);
      console.log(`Docker image ${imageName} exists`);
    } catch {
      console.log(`Building Docker image ${imageName}...`);
      await execAsync(`docker build -t ${imageName} -f ${dockerfile} .`);
      console.log(`Docker image ${imageName} built successfully`);
    }
  }

  static getPoolStats(): {
    cpu: { total: number; busy: number; idle: number };
    gpu: { total: number; busy: number; idle: number };
    gpuAvailable: boolean;
  } {
    const getCounts = (pool: Map<string, PoolContainer>) => {
      let busy = 0, idle = 0;
      for (const container of pool.values()) {
        if (container.busy) busy++;
        else idle++;
      }
      return { total: pool.size, busy, idle };
    };

    return {
      cpu: getCounts(this.cpuContainers),
      gpu: getCounts(this.gpuContainers),
      gpuAvailable: this.gpuAvailable
    };
  }

  /**
   * Retrieve file contents from host filesystem
   */
  static async getFileContent(filePath: string): Promise<string> {
    try {
      // Read file content from host filesystem
      const content = await readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error('Error retrieving file content:', error);
      throw new Error(`Failed to retrieve file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Graceful shutdown - Clean up all containers when server stops
   */
  static async shutdown(): Promise<void> {
    console.log('Shutting down container pool...');

    try {
      // Get all container IDs
      const allContainerIds = [
        ...Array.from(this.cpuContainers.keys()),
        ...Array.from(this.gpuContainers.keys())
      ];

      console.log(`Stopping and removing ${allContainerIds.length} containers...`);

      // Stop and remove all containers
      for (const id of allContainerIds) {
        try {
          await execAsync(`docker stop -t 2 ${id}`);
          await execAsync(`docker rm -f ${id}`);
        } catch (error) {
          // Ignore errors, container might already be stopped
          await execAsync(`docker rm -f ${id}`).catch(() => {});
        }
      }

      // Clear pools
      this.cpuContainers.clear();
      this.gpuContainers.clear();
      this.initialized = false;

      console.log('✅ Container pool shutdown complete');
    } catch (error) {
      console.error('Error during container pool shutdown:', error);
    }
  }
}
