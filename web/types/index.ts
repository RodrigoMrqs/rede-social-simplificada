export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
  deletedAt: string | null;
  followersCount: number;
  followingCount: number;
};

export type Post = {
  id: string;
  authorId: string;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  content: string;
  isRepostSimple: boolean;
  repostOfId: string | null;
  repostOf: Post | null;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  likedByMe: boolean;
  createdAt: string;
  deletedAt: string | null;
  hiddenAt: string | null;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  content: string;
  createdAt: string;
  deletedAt: string | null;
};

export type Notification = {
  id: string;
  recipientId: string;
  actorId: string;
  actor: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  type: 'follow' | 'like' | 'comment' | 'repost' | 'mention';
  postId: string | null;
  commentId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type Session = {
  token: string;
  user: User;
};

export type PaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
};

export type Conversation = {
  id: string;
  participant: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  lastMessage: DirectMessage | null;
  unreadCount: number;
  createdAt: string;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  sender: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  content: string;
  createdAt: string;
  readAt: string | null;
  deletedAt: string | null;
};
