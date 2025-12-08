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

  async loginWith2FA(login, password, token) {
    const response = await api.post('/auth/2fa', { login, password, token });
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

  // 2FA methods
  async setup2FA(password) {
    const body = password ? { password } : {};
    const response = await api.post('/auth/2fa/setup', body);
    return response.data;
  }

  async enable2FA(token, password) {
    const body = { token };
    if (password) body.password = password;
    const response = await api.post('/auth/2fa/enable', body);
    return response.data;
  }

  async disable2FA(password) {
    const body = password ? { password } : {};
    const response = await api.post('/auth/2fa/disable', body);
    return response.data;
  }

  async verify2FA(token) {
    const response = await api.post('/auth/2fa/verify', { token });
    return response.data;
  }

  async get2FAStatus() {
    const response = await api.get('/auth/2fa/status');
    return response.data;
  }

  async verifyOAuth2FA(token) {
    const response = await api.post('/auth/oauth/verify-2fa', { token });
    return response.data;
  }
};

export const AuthApi = new AuthApiClass()
