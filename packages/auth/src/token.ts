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

/**
 * Edge-safe validation function to verify JWT signatures using Web Crypto APIs.
 * Works inside Next.js edge middleware.
 */
export async function verifyTokenEdge(token: string, secret: string): Promise<AuthPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode and parse payload (extract claims and expiration check)
    let payloadStr = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) {
      payloadStr += '=';
    }
    const claims: AuthPayload & { exp?: number } = JSON.parse(atob(payloadStr));

    // Expiration check
    if (claims.exp && Date.now() >= claims.exp * 1000) {
      return null;
    }

    // Prepare inputs for cryptographic signature validation
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signedData = encoder.encode(`${headerB64}.${payloadB64}`);
    
    // Decode base64url signature string
    let signatureStr = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (signatureStr.length % 4) {
      signatureStr += '=';
    }
    const signatureBinaryStr = atob(signatureStr);
    const signatureBytes = new Uint8Array(signatureBinaryStr.length);
    for (let i = 0; i < signatureBinaryStr.length; i++) {
      signatureBytes[i] = signatureBinaryStr.charCodeAt(i);
    }

    const isSignatureValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      signedData
    );

    return isSignatureValid ? claims : null;
  } catch (error) {
    return null;
  }
}

