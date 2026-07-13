import { describe, it, expect } from 'vitest';
import { rateLimiter } from '../lib/rate-limit';

describe('Token Bucket Rate Limiter', () => {
  it('should allow requests under the limit capacity', () => {
    const ip = '192.168.1.1';
    const config = { limit: 5, windowMs: 10000 };

    for (let i = 0; i < 5; i++) {
      const check = rateLimiter.limit(ip, 'test_route', config);
      expect(check.success).toBe(true);
      expect(check.remaining).toBe(4 - i);
    }
  });

  it('should deny requests exceeding limit capacity', () => {
    const ip = '192.168.1.2';
    const config = { limit: 3, windowMs: 10000 };

    // Consume limits
    rateLimiter.limit(ip, 'test_route_2', config);
    rateLimiter.limit(ip, 'test_route_2', config);
    rateLimiter.limit(ip, 'test_route_2', config);

    // 4th request should fail
    const check = rateLimiter.limit(ip, 'test_route_2', config);
    expect(check.success).toBe(false);
    expect(check.remaining).toBe(0);
  });
});
