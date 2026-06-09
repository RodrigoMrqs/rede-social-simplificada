import { request } from './api';
import { Notification } from '@/types';

export const notificationService = {
  async getNotifications(token: string, page = 1): Promise<Notification[]> {
    return request(`/notifications?page=${page}`, { token });
  },

  async getUnreadCount(token: string): Promise<{ count: number }> {
    return request('/notifications/unread-count', { token });
  },

  async markAllRead(token: string): Promise<void> {
    return request<void>('/notifications/read-all', { method: 'POST', token });
  },
};
