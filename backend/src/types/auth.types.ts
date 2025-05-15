// Define our own User interface instead of importing from Prisma
export interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Request types
export interface RegisterRequestBody {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface RefreshTokenRequestBody {
  refreshToken: string;
}

// Response types
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  createdAt?: Date;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

// Token payload for JWT
export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Omit password and other sensitive fields from User
export type SafeUser = Omit<User, 'password'>;

// API Response structure
export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
