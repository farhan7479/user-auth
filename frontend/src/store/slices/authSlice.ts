import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';  // Use default axios for now

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Axios instance with the correct baseURL
const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, thunkAPI) => {
    try {
      console.log('Registering user with data:', userData);
      const response = await api.post<AuthResponse>('/auth/register', userData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, thunkAPI) => {
    try {
      console.log('Logging in with credentials:', credentials);
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data.data) {
        localStorage.setItem('token', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
});

export const refreshTokens = createAsyncThunk(
  'auth/refreshToken',
  async (_, thunkAPI) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        return thunkAPI.rejectWithValue('No refresh token found');
      }
      
      const response = await api.post('/auth/refresh-token', { refreshToken });
      
      if (response.data.data) {
        localStorage.setItem('token', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Token refresh failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data.user;
        state.token = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })
      // Refresh Token
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.token = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
      })
      .addCase(refreshTokens.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
