import { request } from './api';
import { Post, Comment, PaginatedResponse } from '@/types';

export const postService = {
  async getFeed(token: string, cursor?: string): Promise<PaginatedResponse<Post>> {
    const query = cursor ? `?cursor=${cursor}` : '';
    return request(`/feed${query}`, { token });
  },

  async getPost(token: string, postId: string): Promise<Post & { comments: Comment[] }> {
    return request(`/posts/${postId}`, { token });
  },

  async createPost(token: string, content: string): Promise<Post> {
    return request<Post>('/posts', { method: 'POST', body: { content }, token });
  },

  async deletePost(token: string, postId: string): Promise<void> {
    return request<void>(`/posts/${postId}`, { method: 'DELETE', token });
  },

  async likePost(token: string, postId: string): Promise<void> {
    return request<void>(`/posts/${postId}/like`, { method: 'POST', token });
  },

  async unlikePost(token: string, postId: string): Promise<void> {
    return request<void>(`/posts/${postId}/like`, { method: 'DELETE', token });
  },

  async repost(token: string, postId: string, comment?: string): Promise<Post> {
    return request<Post>(`/posts/${postId}/repost`, {
      method: 'POST',
      body: { comment },
      token,
    });
  },

  async addComment(token: string, postId: string, content: string): Promise<Comment> {
    return request<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content },
      token,
    });
  },
};
