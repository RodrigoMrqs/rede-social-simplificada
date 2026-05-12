export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Feed: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: { userId?: string };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  PostDetail: { postId: string };
  NewPost: undefined;
  Settings: undefined;
  Admin: undefined;
  Moderation: undefined;
};
