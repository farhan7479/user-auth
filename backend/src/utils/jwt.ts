import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Interface for token payload
interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (user: TokenPayload): string => {
  return jwt.sign(
    user,
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user: TokenPayload): string => {
  return jwt.sign(
    user,
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
};
