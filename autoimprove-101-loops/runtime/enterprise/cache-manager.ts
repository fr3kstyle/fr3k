/**
 * Cache Manager - Redis-like caching with TTL and LRU eviction
 * Enterprise-grade in-memory caching with persistence support
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
  hitRate: number;
}

interface CacheOptions {
  ttl?: number; // milliseconds
  maxSize?: number;
  persist?: boolean;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private persistEnabled: boolean;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 10000, persistEnabled: boolean = false) {
    this.maxSize = maxSize;
    this.persistEnabled = persistEnabled;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
      hitRate: 0
    };

    if (persistEnabled) {
      this.loadFromDisk();
    }

    this.startCleanup();
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): boolean {
    const now = Date.now();
    const ttl = options.ttl || null;

    // Enforce max size with LRU eviction
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttl ? now + ttl : null,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0
    };

    this.cache.set(key, entry);
    this.updateStats();

    if (this.persistEnabled) {
      this.saveToDisk();
    }

    return true;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      this.updateStats();
      return null;
    }

    // Update access tracking
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.stats.hits++;
    this.updateHitRate();

    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.updateStats();

    if (deleted && this.persistEnabled) {
      this.saveToDisk();
    }

    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.updateStats();

    if (this.persistEnabled) {
      this.saveToDisk();
    }
  }

  // Get multiple keys at once (mget-like)
  getMany<T>(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();

    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    }

    return result;
  }

  // Set multiple keys at once (mset-like)
  setMany<T>(entries: Map<string, T>, options: CacheOptions = {}): void {
    for (const [key, value] of entries.entries()) {
      this.set(key, value, options);
    }
  }

  // Atomic increment
  incr(key: string, by: number = 1): number {
    const value = this.get<number>(key);
    const newValue = value !== null ? value + by : by;
    this.set(key, newValue);
    return newValue;
  }

  // Atomic decrement
  decr(key: string, by: number = 1): number {
    return this.incr(key, -by);
  }

  // Get or set pattern
  getOrSet<T>(key: string, factory: () => T, options: CacheOptions = {}): T {
    const value = this.get<T>(key);

    if (value !== null) {
      return value;
    }

    const newValue = factory();
    this.set(key, newValue, options);
    return newValue;
  }

  // Get with refresh (extends TTL)
  getAndRefresh<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    if (ttl) {
      entry.expiresAt = Date.now() + ttl;
    }

    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.stats.hits++;
    this.updateHitRate();

    return entry.value as T;
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt && now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }

      this.updateStats();
    }, 60000); // Cleanup every minute
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get entries (for debugging/monitoring)
  entries(): Array<{ key: string; value: any; ttl: number | null }> {
    const now = Date.now();
    const result: Array<{ key: string; value: any; ttl: number | null }> = [];

    for (const [key, entry] of this.cache.entries()) {
      const ttl = entry.expiresAt ? entry.expiresAt - now : null;
      result.push({
        key,
        value: entry.value,
        ttl: ttl !== null && ttl > 0 ? ttl : null
      });
    }

    return result;
  }

  // Persistence (optional)
  private saveToDisk(): void {
    // In a real implementation, this would save to disk
    // For now, it's a placeholder
  }

  private loadFromDisk(): void {
    // In a real implementation, this would load from disk
    // For now, it's a placeholder
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  // Cache warming
  warm<T>(entries: Map<string, T>, ttl?: number): void {
    for (const [key, value] of entries.entries()) {
      this.set(key, value, { ttl });
    }
  }

  // Pattern-based deletion
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    this.updateStats();
    return deleted;
  }
}

export type { CacheEntry, CacheStats, CacheOptions };
