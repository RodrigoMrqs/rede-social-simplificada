import { request } from './api';
import { Conversation, DirectMessage, PaginatedResponse } from '@/types';

export const messageService = {
  async getConversations(token: string): Promise<Conversation[]> {
    return request('/messages', { token });
  },

  async startConversation(token: string, userId: string): Promise<Conversation> {
    return request<Conversation>('/messages', { method: 'POST', body: { userId }, token });
  },

  async getMessages(token: string, conversationId: string, cursor?: string): Promise<PaginatedResponse<DirectMessage>> {
    const query = cursor ? `?cursor=${cursor}` : '';
    return request(`/messages/${conversationId}${query}`, { token });
  },

  async sendMessage(token: string, conversationId: string, content: string): Promise<DirectMessage> {
    return request<DirectMessage>(`/messages/${conversationId}`, {
      method: 'POST',
      body: { content },
      token,
    });
  },

  async deleteMessage(token: string, conversationId: string, messageId: string): Promise<void> {
    return request<void>(`/messages/${conversationId}/${messageId}`, {
      method: 'DELETE',
      token,
    });
  },
};
