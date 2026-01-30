import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Platform detection for Windows-specific handling
const isWindows = process.platform === 'win32';
const ENABLE_POOLING = process.env.ENABLE_CONTAINER_POOL !== 'false';

if (isWindows) {
  console.log('🪟 Running on Windows - Enhanced health checks enabled');
}

if (!ENABLE_POOLING) {
  console.log('⏸️  Container pooling disabled via ENABLE_CONTAINER_POOL=false');
}

export interface PoolConfig {
  minContainers: number;
  maxContainers: number;
  imageName: string;
  containerLifetimeMs: number; // Maximum lifetime for a container before recreation
}

interface PooledContainer {
  id: string;
  name: string;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
  executions: number; // Track number of executions for this container
}

export class ContainerPool {
  private containers: Map<string, PooledContainer> = new Map();
  private config: PoolConfig;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private healthCheckFailures = 0; // Track consecutive health check failures

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      minContainers: config.minContainers || parseInt(process.env.POOL_MIN_SIZE || '2'),
      maxContainers: config.maxContainers || parseInt(process.env.POOL_MAX_SIZE || '5'),
      imageName: config.imageName || process.env.SANDBOX_IMAGE || 'python-code-runner',
      containerLifetimeMs: config.containerLifetimeMs || parseInt(process.env.POOL_MAX_CONTAINER_AGE_MS || String(30 * 60 * 1000)),
    };
  }

  /**
   * Check if container pooling is enabled
   */
  static isEnabled(): boolean {
    return ENABLE_POOLING;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._initialize();
    await this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    console.log(`🔧 Initializing container pool (min: ${this.config.minContainers}, max: ${this.config.maxContainers})`);

    // Create minimum number of containers
    const createPromises = [];
    for (let i = 0; i < this.config.minContainers; i++) {
      createPromises.push(this.createContainer());
    }

    await Promise.all(createPromises);

    console.log(`✅ Container pool initialized with ${this.containers.size} containers`);
    this.isInitialized = true;

    // Start background maintenance
    this.startMaintenanceLoop();
  }

  /**
   * Acquire a container from the pool
   * Enhanced with health check tracking and fallback strategy
   */
  async acquire(): Promise<PooledContainer> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let healthyContainerFound = false;

    // Try to find an available container
    for (const container of this.containers.values()) {
      if (!container.inUse) {
        // Check if container is too old and needs replacement
        const age = Date.now() - container.createdAt;
        if (age > this.config.containerLifetimeMs) {
          console.log(`♻️  Container ${container.name} is old (${Math.round(age / 1000)}s), replacing...`);
          await this.removeContainer(container.id);
          this.healthCheckFailures++;
          continue;
        }

        // Check container health with robust Python execution test
        const isHealthy = await this.checkContainerHealth(container.id);
        if (!isHealthy) {
          console.log(`🏥 Container ${container.name} is unhealthy, replacing...`);
          await this.removeContainer(container.id);
          this.healthCheckFailures++;
          continue;
        }

        // Healthy container found!
        healthyContainerFound = true;
        this.healthCheckFailures = 0; // Reset failure counter

        // Mark as in use
        container.inUse = true;
        container.lastUsedAt = Date.now();

        const acquireTime = Date.now() - startTime;
        if (acquireTime > 100) {
          console.log(`⚡ Container acquired in ${acquireTime}ms (${container.executions} previous executions)`);
        }

        return container;
      }
    }

    // No available containers, create a new one if under max limit
    if (this.containers.size < this.config.maxContainers) {
      const poolInfo = `${this.containers.size + 1}/${this.config.maxContainers}`;
      console.log(`📦 Pool exhausted, creating new container (${poolInfo})`);

      const container = await this.createContainer();
      container.inUse = true;
      this.healthCheckFailures = 0; // Reset on successful creation

      return container;
    }

    // Wait for a container to become available
    console.log(`⏳ Pool at capacity (${this.containers.size}), waiting for available container...`);

    // If we've had too many health check failures, warn about possible Windows issues
    if (this.healthCheckFailures > 5 && isWindows) {
      console.warn(`⚠️  Multiple health check failures detected on Windows. Consider checking Docker Desktop status.`);
    }

    return this.waitForAvailableContainer();
  }

  /**
   * Release a container back to the pool
   */
  async release(containerId: string, cleanupNeeded: boolean = true): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) {
      console.warn(`⚠️  Attempted to release unknown container: ${containerId}`);
      return;
    }

    try {
      if (cleanupNeeded) {
        // Clean up container (remove temporary files, etc.)
        await this.cleanupContainer(containerId);
      }

      container.inUse = false;
      container.executions++;
      container.lastUsedAt = Date.now();
    } catch (error) {
      console.error(`❌ Error releasing container ${container.name}:`, error);
      // If cleanup failed, remove the container
      await this.removeContainer(containerId);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const stats = {
      total: this.containers.size,
      inUse: 0,
      available: 0,
      totalExecutions: 0,
      containers: [] as Array<{
        name: string;
        inUse: boolean;
        executions: number;
        ageSeconds: number;
      }>,
    };

    for (const container of this.containers.values()) {
      if (container.inUse) stats.inUse++;
      else stats.available++;
      stats.totalExecutions += container.executions;

      stats.containers.push({
        name: container.name,
        inUse: container.inUse,
        executions: container.executions,
        ageSeconds: Math.round((Date.now() - container.createdAt) / 1000),
      });
    }

    return stats;
  }

  /**
   * Shutdown the pool and clean up all containers
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down container pool...');

    const removePromises = Array.from(this.containers.keys()).map(id =>
      this.removeContainer(id).catch(err =>
        console.error(`Failed to remove container ${id}:`, err)
      )
    );

    await Promise.all(removePromises);

    this.isInitialized = false;
    console.log('✅ Container pool shutdown complete');
  }

  // Private methods

  private async createContainer(): Promise<PooledContainer> {
    const name = `pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Use entrypoint override to keep container alive with Python
      const dockerCmd = `docker run -d --name ${name} --network none --memory 128m --cpus="0.5" --read-only --tmpfs /tmp:size=50m --user 1000:1000 --entrypoint python ${this.config.imageName} -c "import time; time.sleep(99999999)"`;

      const { stdout } = await execAsync(dockerCmd);
      const containerId = stdout.trim();

      // Wait a moment for container to fully start
      await new Promise(resolve => setTimeout(resolve, 1000));

      const container: PooledContainer = {
        id: containerId,
        name,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        inUse: false,
        executions: 0,
      };

      this.containers.set(containerId, container);
      console.log(`✨ Created container: ${name} (${containerId.substring(0, 12)})`);

      return container;
    } catch (error) {
      console.error(`Failed to create container ${name}:`, error);
      throw new Error(`Container creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async removeContainer(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) return;

    try {
      await execAsync(`docker stop -t 2 ${containerId}`).catch(() => {});
      await execAsync(`docker rm -f ${containerId}`);
      this.containers.delete(containerId);
      console.log(`🗑️  Removed container: ${container.name}`);
    } catch (error) {
      console.warn(`Failed to remove container ${container.name}:`, error);
    }
  }

  /**
   * Cleanup container state between executions
   * Enhanced for Windows reliability
   */
  private async cleanupContainer(containerId: string): Promise<void> {
    try {
      // Remove all files from /tmp (with retries for Windows)
      let retries = isWindows ? 3 : 1;
      let lastError: Error | null = null;

      for (let i = 0; i < retries; i++) {
        try {
          await execAsync(`docker exec ${containerId} sh -c "rm -rf /tmp/* 2>/dev/null || true"`, {
            timeout: 2000,
          });
          return; // Success
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (i < retries - 1 && isWindows) {
            // Wait a bit for Windows file locks to clear
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }

      // If we got here, all retries failed
      if (lastError) {
        console.warn(`⚠️  Cleanup failed after ${retries} attempts:`, lastError.message);
        throw lastError;
      }

    } catch (error) {
      console.warn(`❌ Failed to cleanup container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Robust health check - Actually tests Python execution
   * Critical for Windows/Docker Desktop reliability
   */
  private async checkContainerHealth(containerId: string): Promise<boolean> {
    try {
      // Step 1: Check if container is running
      const { stdout: runningStatus } = await execAsync(
        `docker inspect -f '{{.State.Running}}' ${containerId}`
      );

      if (runningStatus.trim() !== 'true') {
        console.log(`🏥 Health check failed: Container not running`);
        return false;
      }

      // Step 2: Test Python execution (CRITICAL for Windows)
      // This verifies the Python interpreter is actually responsive
      const healthCheckCmd = `docker exec ${containerId} timeout 2 python -c "print('HEALTH_OK')"`;

      const { stdout: pythonOutput } = await execAsync(healthCheckCmd, {
        timeout: 3000, // 3 second timeout
      });

      const isHealthy = pythonOutput.trim().includes('HEALTH_OK');

      if (!isHealthy) {
        console.log(`🏥 Health check failed: Python execution test failed`);
      }

      return isHealthy;

    } catch (error) {
      // Any error means unhealthy
      console.log(`🏥 Health check failed:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  private async waitForAvailableContainer(): Promise<PooledContainer> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const container of this.containers.values()) {
          if (!container.inUse) {
            clearInterval(checkInterval);
            container.inUse = true;
            container.lastUsedAt = Date.now();
            resolve(container);
            return;
          }
        }
      }, 100); // Check every 100ms
    });
  }

  private startMaintenanceLoop(): void {
    // Run maintenance every 5 minutes
    setInterval(() => {
      this.runMaintenance().catch(err =>
        console.error('Maintenance loop error:', err)
      );
    }, 5 * 60 * 1000);
  }

  private async runMaintenance(): Promise<void> {
    const stats = this.getStats();
    console.log(`🔧 Pool maintenance: ${stats.available} available, ${stats.inUse} in use, ${stats.totalExecutions} total executions`);

    // Remove unhealthy or old containers
    const now = Date.now();
    for (const container of this.containers.values()) {
      if (container.inUse) continue; // Don't remove containers in use

      const age = now - container.createdAt;
      const idle = now - container.lastUsedAt;

      // Remove if too old
      if (age > this.config.containerLifetimeMs) {
        console.log(`♻️  Removing old container ${container.name} (age: ${Math.round(age / 1000)}s)`);
        await this.removeContainer(container.id);
        continue;
      }

      // Remove if idle for too long and we have more than minimum
      if (idle > 10 * 60 * 1000 && this.containers.size > this.config.minContainers) {
        console.log(`🧹 Removing idle container ${container.name} (idle: ${Math.round(idle / 1000)}s)`);
        await this.removeContainer(container.id);
        continue;
      }

      // Check health
      const isHealthy = await this.checkContainerHealth(container.id);
      if (!isHealthy) {
        console.log(`🏥 Removing unhealthy container ${container.name}`);
        await this.removeContainer(container.id);
      }
    }

    // Ensure we have minimum containers
    while (this.containers.size < this.config.minContainers) {
      console.log(`📦 Pool below minimum, creating new container...`);
      await this.createContainer();
    }
  }
}
