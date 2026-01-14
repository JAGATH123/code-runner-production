import jwt from 'jsonwebtoken';
import { AuthToken } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export function generateToken(payload: Omit<AuthToken, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): AuthToken {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
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
