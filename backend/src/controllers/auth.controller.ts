import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../middleware/error.middleware';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Register request:', req.body);
    
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    console.log('User created:', newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser,
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Login request:', req.body);
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    console.log('User logged in:', { id: user.id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore - We're attaching user in the auth middleware
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};
