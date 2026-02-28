/**
 * Rate Limiter - Token bucket and sliding window rate limiting
 * Enterprise-grade rate limiting with multiple strategies
 */

interface RateLimitConfig {
  limit: number;
  window: number; // milliseconds
}

interface TokenBucketConfig {
  capacity: number;
  refillRate: number; // tokens per millisecond
}

interface SlidingWindowConfig {
  limit: number;
  window: number; // milliseconds
}

export class RateLimiter {
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private slidingWindows: Map<string, SlidingWindow> = new Map();
  private fixedWindows: Map<string, FixedWindow> = new Map();

  // Token Bucket Algorithm
  checkTokenBucket(
    identifier: string,
    tokens: number,
    config: TokenBucketConfig
  ): { allowed: boolean; remaining: number; resetTime: number } {
    let bucket = this.tokenBuckets.get(identifier);

    if (!bucket) {
      bucket = new TokenBucket(config.capacity, config.refillRate);
      this.tokenBuckets.set(identifier, bucket);
    }

    return bucket.consume(tokens);
  }

  // Sliding Window Algorithm
  checkSlidingWindow(
    identifier: string,
    config: SlidingWindowConfig
  ): { allowed: boolean; remaining: number; resetTime: number } {
    let window = this.slidingWindows.get(identifier);

    if (!window) {
      window = new SlidingWindow(config.limit, config.window);
      this.slidingWindows.set(identifier, window);
    }

    return window.check();
  }

  // Fixed Window Algorithm (simpler, but can have edge effects)
  checkFixedWindow(
    identifier: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetTime: number } {
    let window = this.fixedWindows.get(identifier);

    if (!window) {
      window = new FixedWindow(config.limit, config.window);
      this.fixedWindows.set(identifier, window);
    }

    return window.check();
  }

  // Generic rate limiter with auto-selection
  check(
    identifier: string,
    strategy: 'token-bucket' | 'sliding-window' | 'fixed-window',
    config: RateLimitConfig | TokenBucketConfig
  ): { allowed: boolean; remaining: number; resetTime: number } {
    switch (strategy) {
      case 'token-bucket':
        return this.checkTokenBucket(identifier, 1, config as TokenBucketConfig);
      case 'sliding-window':
        return this.checkSlidingWindow(identifier, config as SlidingWindowConfig);
      case 'fixed-window':
        return this.checkFixedWindow(identifier, config as RateLimitConfig);
      default:
        return { allowed: false, remaining: 0, resetTime: 0 };
    }
  }

  // Get current state for monitoring
  getState(identifier: string): {
    tokenBucket?: { tokens: number; capacity: number };
    slidingWindow?: { count: number; limit: number };
    fixedWindow?: { count: number; limit: number; windowStart: number };
  } {
    const state: any = {};

    const bucket = this.tokenBuckets.get(identifier);
    if (bucket) {
      state.tokenBucket = bucket.getState();
    }

    const sliding = this.slidingWindows.get(identifier);
    if (sliding) {
      state.slidingWindow = sliding.getState();
    }

    const fixed = this.fixedWindows.get(identifier);
    if (fixed) {
      state.fixedWindow = fixed.getState();
    }

    return state;
  }

  // Reset specific identifier
  reset(identifier: string): void {
    this.tokenBuckets.delete(identifier);
    this.slidingWindows.delete(identifier);
    this.fixedWindows.delete(identifier);
  }

  // Clear all state
  clear(): void {
    this.tokenBuckets.clear();
    this.slidingWindows.clear();
    this.fixedWindows.clear();
  }

  // Cleanup old entries
  cleanup(maxAge: number = 3600000): void {
    const now = Date.now();

    for (const [id, window] of this.fixedWindows.entries()) {
      if (now - window.windowStart > maxAge) {
        this.fixedWindows.delete(id);
      }
    }
  }
}

// Token Bucket Implementation
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume(tokens: number): { allowed: boolean; remaining: number; resetTime: number } {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return {
        allowed: true,
        remaining: Math.floor(this.tokens),
        resetTime: this.lastRefill + ((this.capacity - this.tokens) / this.refillRate)
      };
    }

    return {
      allowed: false,
      remaining: Math.floor(this.tokens),
      resetTime: this.lastRefill + ((tokens - this.tokens) / this.refillRate)
    };
  }

  getState(): { tokens: number; capacity: number } {
    this.refill();
    return {
      tokens: Math.floor(this.tokens),
      capacity: this.capacity
    };
  }
}

// Sliding Window Implementation
class SlidingWindow {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly window: number;

  constructor(limit: number, window: number) {
    this.limit = limit;
    this.window = window;
  }

  private cleanup(): void {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);
  }

  check(): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup();

    if (this.requests.length < this.limit) {
      this.requests.push(Date.now());
      return {
        allowed: true,
        remaining: this.limit - this.requests.length,
        resetTime: Date.now() + this.window
      };
    }

    const oldestRequest = this.requests[0];
    return {
      allowed: false,
      remaining: 0,
      resetTime: oldestRequest + this.window
    };
  }

  getState(): { count: number; limit: number } {
    this.cleanup();
    return {
      count: this.requests.length,
      limit: this.limit
    };
  }
}

// Fixed Window Implementation
class FixedWindow {
  public windowStart: number;
  private count: number;
  private readonly limit: number;
  private readonly window: number;

  constructor(limit: number, window: number) {
    this.limit = limit;
    this.window = window;
    this.windowStart = Date.now();
    this.count = 0;
  }

  check(): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();

    if (now - this.windowStart >= this.window) {
      this.windowStart = now;
      this.count = 0;
    }

    if (this.count < this.limit) {
      this.count++;
      return {
        allowed: true,
        remaining: this.limit - this.count,
        resetTime: this.windowStart + this.window
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: this.windowStart + this.window
    };
  }

  getState(): { count: number; limit: number; windowStart: number } {
    return {
      count: this.count,
      limit: this.limit,
      windowStart: this.windowStart
    };
  }
}

export type { RateLimitConfig, TokenBucketConfig, SlidingWindowConfig };
