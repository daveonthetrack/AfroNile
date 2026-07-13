export interface RateLimiterConfig {
  limit: number;      // Max request capacity in window
  windowMs: number;   // Refill window in milliseconds
}

class TokenBucketRateLimiter {
  // Global memory store for bucket states
  private static store = new Map<string, { tokens: number; lastRefill: number }>();

  // Periodically sweep expired entries to prevent memory leaks (runs every 10 mins)
  static {
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of TokenBucketRateLimiter.store.entries()) {
        if (now - val.lastRefill > 600000) { // stale for more than 10 mins
          TokenBucketRateLimiter.store.delete(key);
        }
      }
    }, 600000).unref?.(); // call unref if available to prevent keeping process alive
  }

  /**
   * Evaluates if a request is permitted.
   * Returns true if allowed, false if rate limited.
   */
  public limit(ip: string, routeKey: string, config: RateLimiterConfig): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const key = `${ip}:${routeKey}`;
    const entry = TokenBucketRateLimiter.store.get(key);

    const refillRate = config.limit / config.windowMs; // tokens per ms

    if (!entry) {
      // Initialize full bucket
      const bucket = { tokens: config.limit - 1, lastRefill: now };
      TokenBucketRateLimiter.store.set(key, bucket);
      return {
        success: true,
        remaining: config.limit - 1,
        reset: now + config.windowMs,
      };
    }

    // Refill bucket based on time elapsed
    const elapsed = now - entry.lastRefill;
    const refilledTokens = elapsed * refillRate;
    const currentTokens = Math.min(config.limit, entry.tokens + refilledTokens);

    if (currentTokens < 1) {
      // Rate limited
      return {
        success: false,
        remaining: 0,
        reset: entry.lastRefill + config.windowMs,
      };
    }

    // Deduct one token
    const nextTokens = currentTokens - 1;
    TokenBucketRateLimiter.store.set(key, { tokens: nextTokens, lastRefill: now });

    return {
      success: true,
      remaining: Math.floor(nextTokens),
      reset: now + config.windowMs,
    };
  }
}

export const rateLimiter = new TokenBucketRateLimiter();
