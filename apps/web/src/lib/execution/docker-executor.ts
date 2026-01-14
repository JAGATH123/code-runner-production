import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: 'Success' | 'Error' | 'Timeout';
  executionTime: number | null;
  plots?: string[];

  // Pygame interactive bundle (WebAssembly via Pygbag)
  pygameBundle?: {
    html: string;      // base64 encoded index.html
    wasm: string;      // base64 encoded .wasm file
    data: string;      // base64 encoded pygame.data
    js: string;        // base64 encoded pygbag.js
  };
}

export class DockerPythonExecutor {
  private static readonly CONTAINER_NAME = 'python-code-runner';
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly MEMORY_LIMIT = '128m';
  
  private static async ensureContainerExists(): Promise<void> {
    try {
      // Check if image exists
      await execAsync(`docker inspect ${this.CONTAINER_NAME}`);
    } catch {
      // Image doesn't exist, build it
      console.log('Building Python execution container...');
      await execAsync(`docker build -t ${this.CONTAINER_NAME} .`);
    }
  }

  private static async createTempFiles(code: string, input: string): Promise<{
    codeFile: string;
    inputFile: string;
    sessionId: string;
  }> {
    const sessionId = uuidv4();
    const tempDir = join(process.cwd(), 'temp');
    
    try {
      await mkdir(tempDir, { recursive: true });
    } catch {
      // Directory already exists
    }
    
    const codeFile = join(tempDir, `${sessionId}.py`);
    const inputFile = join(tempDir, `${sessionId}.txt`);
    
    await writeFile(codeFile, code, 'utf8');
    await writeFile(inputFile, input, 'utf8');
    
    return { codeFile, inputFile, sessionId };
  }

  private static async cleanupTempFiles(codeFile: string, inputFile: string): Promise<void> {
    try {
      await unlink(codeFile);
      await unlink(inputFile);
    } catch {
      // Files may not exist or already cleaned up
    }
  }

  private static detectMatplotlibUsage(code: string): boolean {
    return /import\s+matplotlib|from\s+matplotlib|plt\.|pyplot\./i.test(code);
  }

  private static detectPygameUsage(code: string): boolean {
    return /import\s+pygame|from\s+pygame/i.test(code);
  }

  private static injectPlotSavingCode(code: string): string {
    // Add matplotlib plot capturing logic
    const plotCapture = `
import os
import base64
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Ensure non-interactive backend

# Monkey patch plt.show() to save plots instead
_original_show = plt.show
_plot_counter = 0

def _save_plot(*args, **kwargs):
    global _plot_counter
    plot_path = f"/tmp/plot_{_plot_counter}.png"
    plt.savefig(plot_path, dpi=100, bbox_inches='tight')
    print(f"[PLOT_SAVED:{plot_path}]")
    _plot_counter += 1
    plt.close()  # Close the figure to free memory

plt.show = _save_plot

# At end of execution, encode and output all plots
import atexit
def _output_plots():
    import glob
    plot_files = glob.glob("/tmp/plot_*.png")
    if plot_files:
        print("[PLOT_DATA_START]")
        for plot_file in sorted(plot_files):
            try:
                with open(plot_file, 'rb') as f:
                    plot_data = f.read()
                    b64_data = base64.b64encode(plot_data).decode('utf-8')
                    print(f"[PLOT_B64:{b64_data}]")
            except Exception as e:
                print(f"[PLOT_ERROR:{e}]")
        print("[PLOT_DATA_END]")
    
atexit.register(_output_plots)
`;

    return plotCapture + '\n' + code;
  }

  private static async compilePygame(code: string, sessionId: string): Promise<{
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

      // Create pygame project directory
      await mkdir(pygameDir, { recursive: true });

      // Write the main.py file
      const mainPyPath = join(pygameDir, 'main.py');
      await writeFile(mainPyPath, code, 'utf8');

      console.log(`[Pygbag] Created main.py at ${mainPyPath}`);

      // Run pygbag build command inside Docker container
      // Using python-code-runner image which should have pygbag installed
      // Use python3 -m pygbag to ensure it's found
      const buildCmd = `docker run --rm -v "${pygameDir}:/app/game:rw" -w /app/game ${this.CONTAINER_NAME} python3 -m pygbag --build main.py`;

      console.log(`[Pygbag] Running build command: ${buildCmd}`);

      const { stdout, stderr } = await execAsync(buildCmd, { timeout: 30000 });

      console.log(`[Pygbag] Build stdout:`, stdout);
      if (stderr) console.log(`[Pygbag] Build stderr:`, stderr);

      // Read the generated files
      const htmlPath = join(buildDir, 'index.html');
      const wasmPath = join(buildDir, 'main.py.wasm');
      const dataPath = join(buildDir, 'pygame.data');
      const jsPath = join(buildDir, 'pygbag.js');

      console.log(`[Pygbag] Reading generated files from ${buildDir}`);

      const htmlContent = await readFile(htmlPath, 'utf8');
      const wasmContent = await readFile(wasmPath);
      const dataContent = await readFile(dataPath);
      const jsContent = await readFile(jsPath, 'utf8');

      console.log(`[Pygbag] Successfully read all bundle files`);

      // Encode to base64
      const bundle = {
        html: Buffer.from(htmlContent).toString('base64'),
        wasm: wasmContent.toString('base64'),
        data: dataContent.toString('base64'),
        js: Buffer.from(jsContent).toString('base64')
      };

      console.log(`[Pygbag] Bundle sizes - HTML: ${bundle.html.length}, WASM: ${bundle.wasm.length}, Data: ${bundle.data.length}, JS: ${bundle.js.length}`);

      // Cleanup pygame directory
      await execAsync(`rm -rf "${pygameDir}"`).catch(() => {});

      return bundle;
    } catch (error) {
      console.error(`[Pygbag] Compilation failed:`, error);
      return null;
    }
  }

  private static async extractPlotsFromOutput(containerId: string, stdout: string): Promise<string[]> {
    const plots: string[] = [];

    try {
      console.log(`Extracting visual outputs from code execution...`);

      // Parse matplotlib plot data from stdout using [PLOT_B64:data] markers
      const plotDataMatches = stdout.match(/\[PLOT_B64:([^\]]+)\]/g);
      console.log(`Matplotlib plot matches found: ${plotDataMatches?.length || 0}`);

      if (plotDataMatches) {
        for (const match of plotDataMatches) {
          try {
            const base64Data = match.match(/\[PLOT_B64:([^\]]+)\]/)?.[1];
            if (base64Data) {
              plots.push(`data:image/png;base64,${base64Data}`);
              console.log(`Successfully extracted matplotlib plot (${base64Data.length} chars)`);
            }
          } catch (error) {
            console.warn(`Failed to extract plot data from match:`, error);
          }
        }
      }

      // Parse Pygame screenshot data from stdout using [PYGAME_B64:data] markers
      const pygameDataMatches = stdout.match(/\[PYGAME_B64:([^\]]+)\]/g);
      console.log(`Pygame screenshot matches found: ${pygameDataMatches?.length || 0}`);

      if (pygameDataMatches) {
        for (const match of pygameDataMatches) {
          try {
            const base64Data = match.match(/\[PYGAME_B64:([^\]]+)\]/)?.[1];
            if (base64Data) {
              plots.push(`data:image/png;base64,${base64Data}`);
              console.log(`Successfully extracted Pygame screenshot (${base64Data.length} chars)`);
            }
          } catch (error) {
            console.warn(`Failed to extract Pygame data from match:`, error);
          }
        }
      }

      if (!plotDataMatches && !pygameDataMatches) {
        console.log('No visual output data found in stdout');
      }
    } catch (error) {
      console.warn('Failed to extract visual outputs:', error);
    }

    console.log(`Total visual outputs extracted: ${plots.length}`);
    return plots;
  }

  public static async executeCode(code: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      await this.ensureContainerExists();

      // Check if code uses matplotlib or pygame
      const hasMatplotlib = this.detectMatplotlibUsage(code);
      const hasPygame = this.detectPygameUsage(code);

      // Prepare code for execution (inject matplotlib plot capture if needed)
      let processedCode = code;
      if (hasMatplotlib) {
        processedCode = this.injectPlotSavingCode(processedCode);
      }

      // Create temp files for reliable execution
      const { codeFile, inputFile, sessionId } = await this.createTempFiles(processedCode, input);

      // If Pygame is detected, compile with Pygbag for interactive mode
      let pygameBundle: { html: string; wasm: string; data: string; js: string } | undefined;

      if (hasPygame) {
        console.log('[Pygame] Detected Pygame code, compiling with Pygbag...');
        const bundle = await this.compilePygame(code, sessionId);
        if (bundle) {
          pygameBundle = bundle;
          console.log('[Pygame] Pygbag compilation successful');

          // Skip normal execution - return bundle only for interactive mode
          await this.cleanupTempFiles(codeFile, inputFile);
          const executionTime = Date.now() - startTime;
          return {
            stdout: '',
            stderr: '',
            status: 'Success',
            executionTime,
            pygameBundle
          };
        } else {
          console.warn('[Pygame] Pygbag compilation failed, will run code for console output only');
        }
      }

      try {
        // Build docker command that allows image saving when matplotlib is detected
        // Note: Pygame uses Pygbag compilation, not screenshot capture
        const needsImageCapture = hasMatplotlib;
        const tmpfsOptions = needsImageCapture ? '/tmp:size=10m' : '/tmp:noexec,nosuid,size=10m';
        const dockerCmd = input
          ? `type "${inputFile}" | docker run --rm --network none --memory ${this.MEMORY_LIMIT} --cpus="0.5" --user 1000:1000 --read-only --tmpfs ${tmpfsOptions} -i -v "${codeFile}:/app/code.py:ro" ${this.CONTAINER_NAME} timeout 20s python /app/code.py`
          : `docker run --rm --network none --memory ${this.MEMORY_LIMIT} --cpus="0.5" --user 1000:1000 --read-only --tmpfs ${tmpfsOptions} -v "${codeFile}:/app/code.py:ro" ${this.CONTAINER_NAME} timeout 20s python /app/code.py`;

        let stdout = '';
        let stderr = '';
        let containerId = '';
        let plots: string[] | undefined;

        try {
          // For matplotlib code, we need a persistent container to extract images
          if (needsImageCapture) {
            // Create a named container that we can extract files from
            const containerName = `python-exec-${sessionId}`;
            const createCmd = input
              ? `type "${inputFile}" | docker run --name ${containerName} --network none --memory ${this.MEMORY_LIMIT} --cpus="0.5" --user 1000:1000 --read-only --tmpfs /tmp:size=10m -i -v "${codeFile}:/app/code.py:ro" ${this.CONTAINER_NAME} timeout 20s python /app/code.py`
              : `docker run --name ${containerName} --network none --memory ${this.MEMORY_LIMIT} --cpus="0.5" --user 1000:1000 --read-only --tmpfs /tmp:size=10m -v "${codeFile}:/app/code.py:ro" ${this.CONTAINER_NAME} timeout 20s python /app/code.py`;
            
            try {
              const result = await Promise.race([
                execAsync(createCmd),
                new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error('Execution timeout')), this.TIMEOUT_MS * 2);
                })
              ]);
              stdout = result.stdout;
              stderr = result.stderr;
              containerId = containerName;
            } catch (error: any) {
              stdout = error.stdout || '';
              stderr = error.stderr || '';
              containerId = containerName;
            }
            
            // Extract plots IMMEDIATELY after execution while container still exists
            if (containerId) {
              try {
                plots = await this.extractPlotsFromOutput(containerId, stdout);
              } catch (error) {
                console.warn('Failed to extract plots:', error);
              } finally {
                // Clean up the named container
                await execAsync(`docker rm -f ${containerId}`).catch(() => {});
              }
            }
          } else {
            // Regular execution without plot extraction
            const result = await Promise.race([
              execAsync(dockerCmd),
              new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Execution timeout')), this.TIMEOUT_MS * 2);
              })
            ]);
            stdout = result.stdout;
            stderr = result.stderr;
          }
        } catch (error: any) {
          stdout = error.stdout || '';
          stderr = error.stderr || '';
          
          if (!stderr && error.message && !error.message.includes('timeout')) {
            stderr = error.message;
          }
        }

        const executionTime = Date.now() - startTime;

        return {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          status: stderr.trim() ? 'Error' : 'Success',
          executionTime,
          plots,
          pygameBundle
        };
      } finally {
        // Always cleanup temp files
        await this.cleanupTempFiles(codeFile, inputFile);
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || executionTime >= this.TIMEOUT_MS) {
          return {
            stdout: '',
            stderr: 'Execution timeout: Code took too long to execute',
            status: 'Timeout',
            executionTime
          };
        }
        
        return {
          stdout: '',
          stderr: `Execution error: ${error.message}`,
          status: 'Error',
          executionTime
        };
      }
      
      return {
        stdout: '',
        stderr: 'Unknown execution error',
        status: 'Error',
        executionTime
      };
    }
  }
}