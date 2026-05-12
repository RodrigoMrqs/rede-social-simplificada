import { request } from './api';
import { User, PaginatedResponse } from '@/types';

export const userService = {
  async getProfile(token: string, userId: string): Promise<User> {
    return request<User>(`/users/${userId}`, { token });
  },

  async updateProfile(
    token: string,
    data: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl' | 'coverUrl'>>,
  ): Promise<User> {
    return request<User>('/users/me', { method: 'PATCH', body: data, token });
  },

  async deleteAccount(token: string): Promise<void> {
    return request<void>('/users/me', { method: 'DELETE', token });
  },

  async follow(token: string, userId: string): Promise<void> {
    return request<void>(`/users/${userId}/follow`, { method: 'POST', token });
  },

  async unfollow(token: string, userId: string): Promise<void> {
    return request<void>(`/users/${userId}/follow`, { method: 'DELETE', token });
  },

  async getFollowers(token: string, userId: string, cursor?: string): Promise<PaginatedResponse<User>> {
    const query = cursor ? `?cursor=${cursor}` : '';
    return request(`/users/${userId}/followers${query}`, { token });
  },

  async getFollowing(token: string, userId: string, cursor?: string): Promise<PaginatedResponse<User>> {
    const query = cursor ? `?cursor=${cursor}` : '';
    return request(`/users/${userId}/following${query}`, { token });
  },

  async search(token: string, q: string, cursor?: string): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({ q });
    if (cursor) params.set('cursor', cursor);
    return request(`/search/users?${params}`, { token });
  },
};
