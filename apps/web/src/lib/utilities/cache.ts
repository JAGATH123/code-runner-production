// Simple in-memory cache implementation for frontend
// Redis is used only on the VPS backend (API + Runner)

interface CacheItem {
  value: any;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Only start cleanup interval on server side
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000); // Clean up every 5 minutes
    }
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

  getStats() {
    return {
      size: this.cache.size,
      type: 'memory',
      usingRedis: false
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Export singleton instance
export const cache = new MemoryCache();

// Helper function for cache keys
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}
