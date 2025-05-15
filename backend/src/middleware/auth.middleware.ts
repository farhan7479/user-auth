import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.middleware';
import { TokenPayload } from '../types/auth.types';

// Extended Request interface to include user property
export interface AuthRequest<P = {}, ResBody = {}, ReqBody = {}, ReqQuery = {}> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = <P = {}, ResBody = {}, ReqBody = {}, ReqQuery = {}>
  (req: AuthRequest<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'Authentication token missing');
    }

    // Get JWT secret
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ApiError(500, 'Server configuration error');
    }
    
    // Verify token
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};
