import { request } from './api';
import { Session } from '@/types';

export const authService = {
  async login(username: string, password: string): Promise<Session> {
    return request<Session>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  },

  async register(username: string, displayName: string, password: string): Promise<Session> {
    return request<Session>('/auth/register', {
      method: 'POST',
      body: { username, displayName, password },
    });
  },

  async logout(token: string): Promise<void> {
    return request<void>('/auth/logout', { method: 'POST', token });
  },
};
