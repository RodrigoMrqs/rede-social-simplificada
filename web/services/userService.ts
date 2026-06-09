import { request } from './api';
import { User } from '@/types';

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

  async getFollowers(token: string, userId: string): Promise<User[]> {
    return request(`/users/${userId}/followers`, { token });
  },

  async getFollowing(token: string, userId: string): Promise<User[]> {
    return request(`/users/${userId}/following`, { token });
  },

  async getUserPosts(token: string, userId: string, cursor?: string): Promise<{ items: import('@/types').Post[]; nextCursor: string | null }> {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return request(`/users/${userId}/posts${query}`, { token });
  },

  async search(token: string, q: string, page = 1): Promise<{ users: User[]; posts: { id: string; authorId: string; content: string; createdAt: string }[] }> {
    const params = new URLSearchParams({ q, page: String(page) });
    return request(`/search?${params}`, { token });
  },

  async getNotificationPreferences(token: string): Promise<{
    notifyFollow: boolean;
    notifyLike: boolean;
    notifyComment: boolean;
    notifyRepost: boolean;
  }> {
    return request('/users/me/preferences', { token });
  },

  async updateNotificationPreferences(
    token: string,
    prefs: Partial<{ notifyFollow: boolean; notifyLike: boolean; notifyComment: boolean; notifyRepost: boolean }>,
  ): Promise<{ notifyFollow: boolean; notifyLike: boolean; notifyComment: boolean; notifyRepost: boolean }> {
    return request('/users/me/preferences', { method: 'PATCH', body: prefs, token });
  },
};
