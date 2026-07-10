import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Signs a JSON Web Token with a specified secret and payload.
 * @param payload Object to include inside token claims
 * @param secret Secret verification signature key
 * @param expiresIn Token validity window (default: 7d)
 */
export function signToken(
  payload: AuthPayload, 
  secret: string, 
  expiresIn: string = '7d'
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

/**
 * Verifies a JSON Web Token and returns its payload claims. Returns null on failure.
 * @param token JWT token string
 * @param secret Secret signature key
 */
export function verifyToken(token: string, secret: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as AuthPayload;
  } catch (error) {
    return null;
  }
}
