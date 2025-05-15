import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApiResponse } from '../types/auth.types';
import jwt from 'jsonwebtoken';

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error | ApiError | PrismaClientKnownRequestError | jwt.JsonWebTokenError | jwt.TokenExpiredError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Create a typed error response
  const createErrorResponse = (statusCode: number, message: string, error?: string): ApiResponse<null> => ({
    success: false,
    message,
    ...(error && { error })
  });

  // If it's our custom API error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(createErrorResponse(err.statusCode, err.message));
  }

  // For Prisma specific errors
  if (err instanceof PrismaClientKnownRequestError) {
    return res.status(400).json(createErrorResponse(400, 'Database error occurred', err.message));
  }

  // For JWT errors
  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json(createErrorResponse(401, 'Invalid token'));
  }

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json(createErrorResponse(401, 'Token expired'));
  }

  // Default to 500 server error
  const errorMessage = process.env.NODE_ENV === 'development' ? err.message : undefined;
  return res.status(500).json(createErrorResponse(500, 'Internal Server Error', errorMessage));
};
