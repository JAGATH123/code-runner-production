import { exec } from 'child_process';
import { promisify } from 'util';
import { getLogger } from '@code-runner/shared';

const execAsync = promisify(exec);
const logger = getLogger('container-pool');

// Platform detection for Windows-specific handling
const isWindows = process.platform === 'win32';
const ENABLE_POOLING = process.env.ENABLE_CONTAINER_POOL !== 'false';

// =============================================================================
// Types
// =============================================================================

export interface PoolConfig {
  minContainers: number;
  softMaxContainers: number;  // Normal operations limit
  hardMaxContainers: number;  // Emergency capacity limit
  imageName: string;
  containerLifetimeMs: number;
}

interface PooledContainer {
  id: string;
  name: string;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
  executions: number;
  healthy: boolean;
}

// =============================================================================
// Container Pool Class
// =============================================================================

export class ContainerPool {
  private containers: Map<string, PooledContainer> = new Map();
  private config: PoolConfig;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private maintenanceInterval: NodeJS.Timeout | null = null;

  // Issue #2, #24: Track containers being removed to prevent race conditions
  private containersBeingRemoved = new Set<string>();

  // Issue #3: Track consecutive health check failures
  private healthCheckFailures = 0;
  private static readonly MAX_HEALTH_FAILURES = 10;

  // Issue #23: Configuration for timeouts
  private static readonly CONTAINER_CREATION_TIMEOUT = 30000; // 30 seconds
  private static readonly HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
  private static readonly MAX_WAIT_TIME = 30000; // 30 seconds max wait for container
  private static readonly POLL_INTERVAL = 100; // 100ms between polls

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      minContainers: config.minContainers || parseInt(process.env.POOL_MIN_SIZE || '2'),
      softMaxContainers: config.softMaxContainers || parseInt(process.env.POOL_SOFT_MAX || '5'),
      hardMaxContainers: config.hardMaxContainers || parseInt(process.env.POOL_HARD_MAX || '10'),
      imageName: config.imageName || process.env.SANDBOX_IMAGE || 'python-code-runner',
      containerLifetimeMs: config.containerLifetimeMs || parseInt(process.env.POOL_MAX_CONTAINER_AGE_MS || String(30 * 60 * 1000)),
    };

    if (isWindows) {
      logger.info('Running on Windows - Enhanced health checks enabled');
    }

    if (!ENABLE_POOLING) {
      logger.info('Container pooling disabled via ENABLE_CONTAINER_POOL=false');
    }

    logger.info(`Pool config: min=${this.config.minContainers}, soft=${this.config.softMaxContainers}, hard=${this.config.hardMaxContainers}`);
  }

  /**
   * Check if container pooling is enabled
   */
  static isEnabled(): boolean {
    return ENABLE_POOLING;
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    await this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    logger.info(`Initializing container pool (min: ${this.config.minContainers}, soft: ${this.config.softMaxContainers}, hard: ${this.config.hardMaxContainers})`);

    // Clean up any orphaned containers from previous runs
    await this.cleanupOrphanedContainers();

    // Create minimum number of containers
    const createPromises: Promise<PooledContainer | null>[] = [];
    for (let i = 0; i < this.config.minContainers; i++) {
      createPromises.push(
        this.createContainer().catch(err => {
          logger.error(`Failed to create initial container: ${err}`);
          return null;
        })
      );
    }

    const results = await Promise.all(createPromises);
    const successCount = results.filter(r => r !== null).length;

    if (successCount === 0) {
      throw new Error('Failed to create any containers for the pool');
    }

    logger.info(`Container pool initialized with ${successCount} containers`);
    this.isInitialized = true;

    // Start background maintenance
    this.startMaintenanceLoop();
  }

  /**
   * Clean up orphaned containers from previous runs
   */
  private async cleanupOrphanedContainers(): Promise<void> {
    try {
      const { stdout } = await execAsync(
        'docker ps -a --filter "name=pool-" --format "{{.ID}}"',
        { timeout: 10000 }
      );

      const containerIds = stdout.trim().split('\n').filter(Boolean);

      if (containerIds.length > 0) {
        logger.info(`Cleaning up ${containerIds.length} orphaned pool containers`);

        for (const id of containerIds) {
          try {
            await execAsync(`docker rm -f ${id}`, { timeout: 5000 });
          } catch {
            // Ignore errors
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup orphaned containers', { error: String(error) });
    }
  }

  // ===========================================================================
  // Container Acquisition (Issues #3, #7, #26)
  // ===========================================================================

  /**
   * Acquire a container from the pool
   */
  async acquire(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    // Try to find an available healthy container
    for (const [containerId, container] of this.containers) {
      // Skip containers in use or being removed
      if (container.inUse || this.containersBeingRemoved.has(containerId)) {
        continue;
      }

      // Check if container is too old
      const ageMs = Date.now() - container.createdAt;
      if (ageMs > this.config.containerLifetimeMs) {
        logger.info(`Container ${container.name} expired (age: ${Math.round(ageMs / 1000)}s)`);
        this.scheduleContainerRemoval(containerId);
        continue;
      }

      // Issue #7: Grace period for newly created containers
      const containerAge = Date.now() - container.createdAt;
      const skipDetailedHealthCheck = containerAge < 3000; // 3 seconds grace period

      // Check container health
      const isHealthy = skipDetailedHealthCheck || await this.checkContainerHealth(containerId);

      if (!isHealthy) {
        logger.warn(`Container ${container.name} is unhealthy, replacing...`);
        this.scheduleContainerRemoval(containerId);
        this.healthCheckFailures++;

        // Issue #3: Warn if too many failures
        if (this.healthCheckFailures > ContainerPool.MAX_HEALTH_FAILURES) {
          logger.error(`Too many consecutive health check failures (${this.healthCheckFailures}). Docker may be unresponsive.`);
        }
        continue;
      }

      // Reset failure counter on success
      this.healthCheckFailures = 0;

      // Issue #26: Double-check container is still running before marking as in use
      const stillRunning = await this.isContainerRunning(containerId);
      if (!stillRunning) {
        logger.warn(`Container ${container.name} died during acquisition`);
        this.scheduleContainerRemoval(containerId);
        continue;
      }

      // Container is available and healthy
      container.inUse = true;
      container.lastUsedAt = Date.now();

      const acquireTime = Date.now() - startTime;
      if (acquireTime > 100) {
        logger.debug(`Container acquired in ${acquireTime}ms: ${container.name}`);
      }

      return containerId;
    }

    // TIERED SCALING LOGIC
    const currentSize = this.containers.size;
    const utilization = this.getUtilization();

    // Tier 1: Under soft limit - scale freely
    if (currentSize < this.config.softMaxContainers) {
      const poolInfo = `${currentSize + 1}/${this.config.softMaxContainers} (soft)`;
      logger.info(`📦 Scaling UP: ${poolInfo}`);

      try {
        const container = await this.createContainer();
        container.inUse = true;
        return container.id;
      } catch (error) {
        logger.error(`Failed to create new container: ${error}`);
      }
    }

    // Tier 2: Between soft and hard limit - check pressure before scaling
    if (currentSize < this.config.hardMaxContainers) {
      // Scale up if high utilization (>70% containers in use)
      if (utilization > 0.7) {
        const poolInfo = `${currentSize + 1}/${this.config.hardMaxContainers} (hard)`;
        logger.warn(`🚨 High pressure (${Math.round(utilization * 100)}%), emergency scaling: ${poolInfo}`);

        try {
          const container = await this.createContainer();
          container.inUse = true;
          return container.id;
        } catch (error) {
          logger.error(`Failed to create emergency container: ${error}`);
        }
      } else {
        logger.info(`Pool at soft limit (${currentSize}/${this.config.softMaxContainers}), utilization ${Math.round(utilization * 100)}% - waiting...`);
      }
    }

    // Tier 3: At hard limit - must wait
    if (currentSize >= this.config.hardMaxContainers) {
      logger.warn(`⚠️ At HARD limit (${this.config.hardMaxContainers}), waiting for container...`);
    }

    return this.waitForAvailableContainer();
  }

  /**
   * Get current pool utilization (0-1)
   */
  private getUtilization(): number {
    if (this.containers.size === 0) return 0;
    let inUseCount = 0;
    for (const container of this.containers.values()) {
      if (container.inUse) inUseCount++;
    }
    return inUseCount / this.containers.size;
  }

  /**
   * Wait for an available container with timeout (Issue #23)
   */
  private async waitForAvailableContainer(): Promise<string> {
    const startTime = Date.now();

    while (Date.now() - startTime < ContainerPool.MAX_WAIT_TIME) {
      // Check for available container
      for (const [containerId, container] of this.containers) {
        if (!container.inUse && !this.containersBeingRemoved.has(containerId)) {
          // Quick health check
          const isHealthy = await this.isContainerRunning(containerId);
          if (isHealthy) {
            container.inUse = true;
            container.lastUsedAt = Date.now();
            logger.info(`Container acquired after waiting: ${container.name}`);
            return containerId;
          } else {
            this.scheduleContainerRemoval(containerId);
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, ContainerPool.POLL_INTERVAL));
    }

    // Timeout - try one more time to create a container (emergency override)
    if (this.containers.size < this.config.hardMaxContainers + 2) {
      logger.warn('⏰ Wait timeout, forcing emergency container creation');
      const container = await this.createContainer();
      container.inUse = true;
      return container.id;
    }

    throw new Error(`Timeout waiting for available container (${ContainerPool.MAX_WAIT_TIME}ms). Pool at hard limit.`);
  }

  // ===========================================================================
  // Container Release (Issue #8)
  // ===========================================================================

  /**
   * Release a container back to the pool
   */
  async release(containerId: string, cleanupNeeded: boolean = true): Promise<void> {
    const container = this.containers.get(containerId);

    if (!container) {
      logger.warn(`Attempted to release unknown container: ${containerId.substring(0, 12)}`);
      return;
    }

    try {
      if (cleanupNeeded) {
        // Issue #8: Enhanced cleanup with retries
        await this.cleanupContainer(containerId);
      }

      container.inUse = false;
      container.executions++;
      container.lastUsedAt = Date.now();

      logger.debug(`Released container: ${container.name} (executions: ${container.executions})`);

    } catch (error) {
      logger.error(`Error releasing container ${container.name}: ${error}`);
      // If cleanup failed, mark container for removal
      this.scheduleContainerRemoval(containerId);
    }
  }

  /**
   * Cleanup container state between executions (Issue #8)
   */
  private async cleanupContainer(containerId: string): Promise<void> {
    const maxRetries = isWindows ? 3 : 1;
    const retryDelay = isWindows ? 300 : 100;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await execAsync(
          `docker exec ${containerId} sh -c "rm -rf /tmp/* 2>/dev/null || true"`,
          { timeout: 5000 }
        );
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          logger.debug(`Cleanup attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    if (lastError) {
      logger.warn(`Cleanup failed after ${maxRetries} attempts: ${lastError.message}`);
      throw lastError;
    }
  }

  // ===========================================================================
  // Container Creation (Issues #10, #15)
  // ===========================================================================

  /**
   * Create a new container for the pool
   */
  private async createContainer(): Promise<PooledContainer> {
    const name = `pool-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    try {
      // Create container with keep-alive command
      const dockerCmd = [
        'docker run -d',
        `--name ${name}`,
        '--network none',
        '--memory 128m',
        '--cpus=0.5',
        '--read-only',
        '--tmpfs /tmp:size=50m,mode=1777',
        '--user 1000:1000',
        this.config.imageName,
        // Keep container alive with shell sleep loop
        'sh', '-c', '"while true; do sleep 3600; done"'
      ].join(' ');

      const { stdout } = await execAsync(dockerCmd, {
        timeout: ContainerPool.CONTAINER_CREATION_TIMEOUT
      });

      const containerId = stdout.trim();

      // Issue #15: Wait for container to be fully ready
      await this.waitForContainerReady(containerId);

      const container: PooledContainer = {
        id: containerId,
        name,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        inUse: false,
        executions: 0,
        healthy: true
      };

      this.containers.set(containerId, container);
      logger.info(`Created container: ${name} (${containerId.substring(0, 12)})`);

      return container;

    } catch (error) {
      logger.error(`Failed to create container ${name}: ${error}`);
      throw new Error(`Container creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for container to be ready (Issue #15)
   */
  private async waitForContainerReady(containerId: string): Promise<void> {
    const maxAttempts = 15; // 3 seconds total
    const delayMs = 200;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const isRunning = await this.isContainerRunning(containerId);
      if (isRunning) {
        // Give Python a moment to start
        await new Promise(resolve => setTimeout(resolve, 100));
        return;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Container failed to start within timeout');
  }

  // ===========================================================================
  // Container Removal (Issues #2, #24)
  // ===========================================================================

  /**
   * Schedule container for removal (prevents race conditions)
   */
  private scheduleContainerRemoval(containerId: string): void {
    // Don't schedule if already being removed
    if (this.containersBeingRemoved.has(containerId)) {
      return;
    }

    // Mark as being removed and remove asynchronously
    this.containersBeingRemoved.add(containerId);
    this.removeContainer(containerId).finally(() => {
      this.containersBeingRemoved.delete(containerId);
    });
  }

  /**
   * Remove a container from the pool (Issues #2, #24)
   */
  private async removeContainer(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);

    // Remove from map first to prevent re-use
    this.containers.delete(containerId);

    if (!container) {
      return;
    }

    try {
      // Force remove (no need to stop first)
      await execAsync(`docker rm -f ${containerId}`, { timeout: 10000 });
      logger.info(`Removed container: ${container.name}`);
    } catch (error: any) {
      // Ignore "already being removed" or "no such container" errors
      const errorMsg = error.message || '';
      if (!errorMsg.includes('already in progress') &&
          !errorMsg.includes('No such container') &&
          !errorMsg.includes('is not running')) {
        logger.warn(`Failed to remove container ${container.name}: ${error}`);
      }
    }
  }

  // ===========================================================================
  // Health Checks (Issues #7, #19)
  // ===========================================================================

  /**
   * Quick check if container is running (Issue #19 - Windows compatible)
   */
  private async isContainerRunning(containerId: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `docker inspect -f "{{.State.Running}}" ${containerId}`,
        { timeout: 3000 }
      );

      // Issue #19 FIX: Handle Windows quote differences
      // Windows may return 'true' or "true" instead of just true
      const cleanOutput = stdout.trim().replace(/['"]/g, '');
      return cleanOutput === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Full health check - verify Python execution works
   */
  private async checkContainerHealth(containerId: string): Promise<boolean> {
    try {
      // First check if container is running
      const isRunning = await this.isContainerRunning(containerId);
      if (!isRunning) {
        logger.debug('Health check failed: Container not running');
        return false;
      }

      // Test Python execution
      const { stdout } = await execAsync(
        `docker exec ${containerId} python -c "print('HEALTH_OK')"`,
        { timeout: ContainerPool.HEALTH_CHECK_TIMEOUT }
      );

      const isHealthy = stdout.trim().includes('HEALTH_OK');

      if (!isHealthy) {
        logger.debug(`Health check failed: Unexpected output: ${stdout.trim()}`);
      }

      return isHealthy;

    } catch (error) {
      logger.debug(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  // ===========================================================================
  // Maintenance
  // ===========================================================================

  /**
   * Start background maintenance loop
   */
  private startMaintenanceLoop(): void {
    // Run maintenance every 5 minutes
    this.maintenanceInterval = setInterval(() => {
      this.runMaintenance().catch(err => {
        logger.error('Maintenance loop error:', err);
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Run maintenance tasks with adaptive scaling
   */
  private async runMaintenance(): Promise<void> {
    const stats = this.getStats();
    const utilization = this.getUtilization();
    const isOverSoftLimit = this.containers.size > this.config.softMaxContainers;

    logger.info(`📊 Pool maintenance: ${stats.total} containers (${stats.inUse} in use, ${stats.available} available), ${Math.round(utilization * 100)}% utilization`);

    const now = Date.now();
    const containersToRemove: string[] = [];

    // Find containers to remove
    for (const [containerId, container] of this.containers) {
      if (container.inUse || this.containersBeingRemoved.has(containerId)) {
        continue;
      }

      const age = now - container.createdAt;
      const idle = now - container.lastUsedAt;

      // Remove if too old
      if (age > this.config.containerLifetimeMs) {
        logger.info(`🗑️ Removing old container ${container.name} (age: ${Math.round(age / 1000)}s)`);
        containersToRemove.push(containerId);
        continue;
      }

      // AGGRESSIVE scale-down if over soft limit and low utilization
      if (isOverSoftLimit && utilization < 0.3) {
        if (idle > 2 * 60 * 1000) {  // 2 min idle when over soft limit
          logger.info(`📉 Scaling down (over soft limit, low utilization): ${container.name}`);
          containersToRemove.push(containerId);
          continue;
        }
      }

      // Normal scale-down if above minimum and idle
      if (this.containers.size > this.config.minContainers) {
        if (idle > 10 * 60 * 1000) {  // 10 min idle for normal operation
          logger.info(`📉 Removing idle container ${container.name} (idle: ${Math.round(idle / 1000)}s)`);
          containersToRemove.push(containerId);
          continue;
        }
      }

      // Remove if unhealthy
      const isHealthy = await this.checkContainerHealth(containerId);
      if (!isHealthy) {
        logger.info(`🏥 Removing unhealthy container ${container.name}`);
        containersToRemove.push(containerId);
      }
    }

    // Remove containers
    for (const containerId of containersToRemove) {
      this.scheduleContainerRemoval(containerId);
    }

    // Wait a bit for removals to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ensure we have minimum containers
    while (this.containers.size < this.config.minContainers) {
      logger.info('➕ Pool below minimum, creating new container...');
      try {
        await this.createContainer();
      } catch (error) {
        logger.error(`Failed to create container during maintenance: ${error}`);
        break; // Don't infinite loop on failures
      }
    }

    // Log scaling status
    if (isOverSoftLimit) {
      logger.info(`⚠️ Pool over soft limit: ${this.containers.size}/${this.config.softMaxContainers}`);
    }
  }

  // ===========================================================================
  // Statistics & Shutdown
  // ===========================================================================

  /**
   * Get pool statistics
   */
  getStats() {
    let inUse = 0;
    let available = 0;
    let totalExecutions = 0;

    const containerDetails: Array<{
      name: string;
      inUse: boolean;
      executions: number;
      ageSeconds: number;
    }> = [];

    for (const container of this.containers.values()) {
      if (container.inUse) {
        inUse++;
      } else {
        available++;
      }
      totalExecutions += container.executions;

      containerDetails.push({
        name: container.name,
        inUse: container.inUse,
        executions: container.executions,
        ageSeconds: Math.round((Date.now() - container.createdAt) / 1000),
      });
    }

    const total = this.containers.size;

    return {
      total,
      inUse,
      available,
      totalExecutions,
      utilization: total > 0 ? Math.round((inUse / total) * 100) : 0,
      healthCheckFailures: this.healthCheckFailures,
      limits: {
        min: this.config.minContainers,
        soft: this.config.softMaxContainers,
        hard: this.config.hardMaxContainers,
      },
      scaling: {
        atSoftLimit: total >= this.config.softMaxContainers,
        atHardLimit: total >= this.config.hardMaxContainers,
        canScaleUp: total < this.config.hardMaxContainers,
      },
      containers: containerDetails,
    };
  }

  /**
   * Shutdown the pool and clean up all containers
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down container pool...');

    // Stop maintenance loop
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }

    // Remove all containers
    const removePromises = Array.from(this.containers.keys()).map(id =>
      this.removeContainer(id).catch(err => {
        logger.error(`Failed to remove container during shutdown: ${err}`);
      })
    );

    await Promise.all(removePromises);

    this.containers.clear();
    this.containersBeingRemoved.clear();
    this.isInitialized = false;

    logger.info('Container pool shutdown complete');
  }
}
