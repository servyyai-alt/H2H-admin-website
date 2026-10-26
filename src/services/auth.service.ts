import { apiClient } from './api.service';

export const authService = {
  login: (identifier: string, password: string) => {
    const clean = identifier.trim();
    const payload = clean.includes('@')
      ? { email: clean.toLowerCase(), password }
      : { phone: clean, password };
    return apiClient.post('/auth/login', payload).then(r => r.data);
  },
  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
  me: () => apiClient.get('/auth/me').then(r => r.data),
};
