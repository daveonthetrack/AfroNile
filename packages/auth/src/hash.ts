import bcrypt from 'bcryptjs';

/**
 * Hashes a plaintext password using bcrypt.
 * @param password Plaintext password string
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * @param password Plaintext password to test
 * @param hash Stored password hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
