import { request } from './api';
import { Notification, PaginatedResponse } from '../types';

export const notificationService = {
  async getNotifications(token: string, cursor?: string): Promise<PaginatedResponse<Notification>> {
    const query = cursor ? `?cursor=${cursor}` : '';
    return request(`/notifications${query}`, { token });
  },

  async getUnreadCount(token: string): Promise<{ count: number }> {
    return request('/notifications/unread-count', { token });
  },

  async markAllRead(token: string): Promise<void> {
    return request<void>('/notifications/read-all', { method: 'POST', token });
  },
};
