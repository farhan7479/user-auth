import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenPayload } from '../types/auth.types';

dotenv.config();

// JWT options types
interface JwtOptions {
  expiresIn: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (user: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(
    user,
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as JwtOptions
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(
    user,
    secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as JwtOptions
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  
  return jwt.verify(token, secret) as TokenPayload;
};
