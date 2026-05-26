import { request } from './api';
import { Session } from '@/types';

export const authService = {
  async login(username: string, password: string): Promise<Session> {
    return request<Session>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  },

  async register(
    username: string,
    displayName: string,
    email: string,
    password: string,
  ): Promise<Session> {
    return request<Session>('/auth/register', {
      method: 'POST',
      body: { username, displayName, email, password },
    });
  },

  async logout(token: string): Promise<void> {
    return request<void>('/auth/logout', { method: 'POST', token });
  },

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    return request<void>('/users/me/password', {
      method: 'PATCH',
      body: { currentPassword, newPassword },
      token,
    });
  },
};
