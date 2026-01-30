import jwt from 'jsonwebtoken';
import { AuthToken } from '../types';

// Lazy validation - only validate when JWT functions are called
// This allows dotenv to load first in index.ts
let JWT_SECRET: string | null = null;
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

function getJWTSecret(): string {
  if (JWT_SECRET) {
    return JWT_SECRET;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is required');
  }

  if (secret.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters');
  }

  const WEAK_SECRETS = ['secret', 'default', 'password', 'jwt_secret', 'change-in-production'];
  if (WEAK_SECRETS.some(weak => secret.toLowerCase().includes(weak))) {
    throw new Error('FATAL: JWT_SECRET appears to be a weak/default value');
  }

  JWT_SECRET = secret;
  return JWT_SECRET;
}

export function generateToken(payload: Omit<AuthToken, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): AuthToken {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as AuthToken;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function decodeToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.decode(token) as AuthToken;
    return decoded;
  } catch (error) {
    return null;
  }
}
