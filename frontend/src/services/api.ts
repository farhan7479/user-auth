import axios from 'axios';
import { store } from '../store';
import { logout, refreshTokens } from '../store/slices/authSlice';

// Set up axios defaults
// We're not setting a baseURL here because Vite's proxy will handle it
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Add a request interceptor
axios.interceptors.request.use(
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
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
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
          return axios(originalRequest);
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

export default axios;
