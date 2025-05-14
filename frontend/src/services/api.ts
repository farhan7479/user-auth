import axios from 'axios';
import { store } from '../store';
import { logout, refreshTokens } from '../store/slices/authSlice';

// Create a custom axios instance with the correct baseURL
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Log configuration for debugging
console.log('API base URL:', apiClient.defaults.baseURL);

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    const originalRequest = error.config;
    
    // If the error is 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        await store.dispatch(refreshTokens());
        
        // Get the new token
        const newToken = store.getState().auth.token;
        
        if (newToken) {
          // Update the header and retry the request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token also fails, logout
        await store.dispatch(logout());
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
