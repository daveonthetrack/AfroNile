import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '@repo/auth';

describe('Auth Utilities', () => {
  const secret = 'supersecretkey_test_1234567890';

  it('should cryptographically hash and verify passwords', async () => {
    const password = 'mypassword123';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isFail = await verifyPassword('wrongpassword', hash);
    expect(isFail).toBe(false);
  });

  it('should sign and verify JWT tokens securely', () => {
    const payload = {
      userId: 'test-user-id-uuid',
      email: 'test@afronile.com',
      role: 'USER',
    };

    const token = signToken(payload, secret, '1h');
    expect(token).toBeDefined();

    const decoded = verifyToken(token, secret);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });
});
