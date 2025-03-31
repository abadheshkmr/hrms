/**
 * Cache manager interface for the application
 * Provides standard caching operations with type safety
 *
 * TODO: [REDIS] HRMS-CACHE-001 - Implement with Redis when infrastructure is ready
 * - Consider using NestJS CacheModule with Redis store
 * - Add proper connection pooling and error handling
 * - Implement cluster support for high availability
 */
export interface ICacheManager {
  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Promise with value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   * @returns Promise void
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Invalidate a specific cache key
   * @param key - Cache key to invalidate
   * @returns Promise void
   */
  invalidate(key: string): Promise<void>;

  /**
   * Invalidate all cache keys with a specific prefix
   * @param prefix - Cache key prefix
   * @returns Promise void
   */
  invalidatePrefix(prefix: string): Promise<void>;
}

/**
 * Memory-based implementation of ICacheManager
 * For development use only - not for production
 *
 * TODO: [REDIS] HRMS-CACHE-002 - Replace with Redis implementation in production
 */
export class MemoryCacheManager implements ICacheManager {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    // Use Promise.resolve to make this truly async
    const item = await Promise.resolve(this.cache.get(key));
    if (!item || item.expiresAt < Date.now()) {
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000;
    // Use Promise.resolve to make this truly async
    await Promise.resolve(this.cache.set(key, { value, expiresAt }));
  }

  async invalidate(key: string): Promise<void> {
    // Use Promise.resolve to make this truly async
    await Promise.resolve(this.cache.delete(key));
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    // Use Promise.resolve to collect keys safely
    const keys = await Promise.resolve([...this.cache.keys()]);
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        await Promise.resolve(this.cache.delete(key));
      }
    }
  }
}
