import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry on auth endpoints or initial auth check
    const authEndpoints = ['/auth/refresh', '/auth/me', '/auth/login', '/auth/2fa', '/auth/registration', '/auth/oauth'];
    const shouldSkipRefresh = authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh
    ) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Don't redirect - just let the error propagate
        // The app will handle unauthorized state via AuthContext
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { api }
