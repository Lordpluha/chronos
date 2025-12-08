import { api } from '@shared/api/axios'

class AuthApiClass {
  async register(data) {
    const response = await api.post('/auth/registration', data);
    return response.data;
  }

  async login(data) {
    const response = await api.post('/auth/login', data);
    return response.data;
  }

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  }

  async refresh() {
    const response = await api.post('/auth/refresh');
    return response.data;
  }

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  async requestPasswordReset(email) {
    const response = await api.post('/auth/password-reset', { email });
    return response.data;
  }

  async resetPassword(code, password) {
    const response = await api.post(`/auth/password-reset/${code}`, { password });
    return response.data;
  }

  getGoogleAuthUrl() {
    return `${import.meta.env.VITE_API_URL}/auth/google`;
  }
};

export const AuthApi = new AuthApiClass()
