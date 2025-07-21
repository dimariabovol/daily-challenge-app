import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';

// Secret key for JWT signing - in production, this should be in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

/**
 * Hash a password using SHA-256
 * Note: In a production app, you should use bcrypt or Argon2 instead
 * We're using a simple hash here to avoid external dependencies
 * 
 * @param password Plain text password
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify a password against a hash
 * 
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if the password matches the hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const hashedPassword = hashPassword(password);
  return hashedPassword === hash;
}

/**
 * Generate a JWT token for a user
 * 
 * @param userId User ID
 * @param email User email
 * @returns JWT token
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    {
      sub: userId,
      email,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify a JWT token
 * 
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): { sub: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as { sub: string; email: string };
  } catch (_error) {
    // Error is ignored as we just return null for invalid tokens
    return null;
  }
}

/**
 * Extract token from Authorization header
 * 
 * @param authHeader Authorization header value
 * @returns Token or null if not found
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}