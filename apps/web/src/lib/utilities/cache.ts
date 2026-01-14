// Simple in-memory cache implementation
// For production, replace with Redis when available

interface CacheItem {
  value: any;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: any, expireSeconds = 3600): Promise<void> {
    const expiry = Date.now() + (expireSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Simple pattern matching for wildcards
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      type: 'memory'
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Redis cache implementation (when Redis is available)
class RedisCache {
  private client: any = null;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      // Try to import Redis client - this will fail if redis is not installed
      const redis = await import('redis');
      const { createClient } = redis;

      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
        database: 0,
      });

      this.client.on('error', (err: any) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.connected = true;
      });

      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.log('Redis not available, falling back to memory cache');
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, expireSeconds = 3600): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.setEx(key, expireSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  getStats() {
    return {
      connected: this.connected,
      type: 'redis'
    };
  }
}

// Cache manager that tries Redis first, falls back to memory
class CacheManager {
  private redisCache: RedisCache;
  private memoryCache: MemoryCache;
  private usingRedis = false;

  constructor() {
    this.redisCache = new RedisCache();
    this.memoryCache = new MemoryCache();
    this.initialize();
  }

  private async initialize() {
    // Skip Redis if REDIS_URL is not set
    if (!process.env.REDIS_URL) {
      this.usingRedis = false;
      console.log('Using memory cache (Redis not configured)');
      return;
    }

    try {
      await this.redisCache.connect();
      this.usingRedis = true;
      console.log('Using Redis for caching');
    } catch (error) {
      this.usingRedis = false;
      console.log('Using memory cache (Redis not available)');
    }
  }

  private getCache() {
    return this.usingRedis ? this.redisCache : this.memoryCache;
  }

  async get<T>(key: string): Promise<T | null> {
    return await this.getCache().get<T>(key);
  }

  async set(key: string, value: any, expireSeconds = 3600): Promise<void> {
    await this.getCache().set(key, value, expireSeconds);
  }

  async del(key: string): Promise<void> {
    await this.getCache().del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this.getCache().invalidatePattern(pattern);
  }

  getStats() {
    const baseStats = this.getCache().getStats();
    return {
      ...baseStats,
      usingRedis: this.usingRedis
    };
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Helper function for cache keys
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}