import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { 
  RegisterRequestBody, 
  LoginRequestBody, 
  RefreshTokenRequestBody,
  UserResponse, 
  AuthResponse, 
  TokenResponse,
  ApiSuccessResponse
} from '../types/auth.types';

/**
 * Register a new user
 */
export const register = async (req: Request<{}, {}, RegisterRequestBody>, res: Response, next: NextFunction) => {
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

    const response: ApiSuccessResponse<UserResponse> = {
      success: true,
      message: 'User registered successfully',
      data: newUser
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req: Request<{}, {}, LoginRequestBody>, res: Response, next: NextFunction) => {
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

    const userData: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    
    const authData: AuthResponse = {
      user: userData,
      accessToken,
      refreshToken
    };
    
    const response: ApiSuccessResponse<AuthResponse> = {
      success: true,
      message: 'User logged in successfully',
      data: authData
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (req: Request<{}, {}, RefreshTokenRequestBody>, res: Response, next: NextFunction) => {
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

    const tokenData: TokenResponse = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
    
    const response: ApiSuccessResponse<TokenResponse> = {
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokenData
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Token refresh error:', error);
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthRequest<{}, {}, {}>, res: Response, next: NextFunction) => {
  try {
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

    const response: ApiSuccessResponse<UserResponse> = {
      success: true,
      data: user
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};
