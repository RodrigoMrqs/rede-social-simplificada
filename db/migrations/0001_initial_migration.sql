-- =============================================================================
-- Migration: 0001_initial
-- Description: Schema inicial da plataforma de rede social
-- Created at: 2026-05-12
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONS
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE notification_type AS ENUM (
  'follow',
  'like',
  'comment',
  'repost',
  'mention'
);

CREATE TYPE sanction_type AS ENUM (
  'suspension',
  'ban'
);

CREATE TYPE moderation_action AS ENUM (
  'hide',
  'delete',
  'restore'
);

CREATE TYPE admin_permission AS ENUM (
  'moderate_posts',
  'sanction_users',
  'view_metrics',
  'manage_admins'
);


-- -----------------------------------------------------------------------------
-- FUNCTION: updated_at trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- TABLE: users
-- -----------------------------------------------------------------------------

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(30) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(50)  NOT NULL,
  bio           VARCHAR(160),
  avatar_url    TEXT,
  cover_url     TEXT,
  is_private    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  CONSTRAINT chk_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$')
);

-- Índice único parcial: permite reaproveitar username de contas deletadas
CREATE UNIQUE INDEX idx_users_username_active
  ON users (username)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_users_email_active
  ON users (email)
  WHERE deleted_at IS NULL;

-- Índice para busca textual (UC-18)
CREATE INDEX idx_users_search
  ON users USING GIN (
    to_tsvector('portuguese', display_name || ' ' || username)
  )
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- -----------------------------------------------------------------------------
-- TABLE: admins
-- -----------------------------------------------------------------------------

CREATE TABLE admins (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  granted_by  UUID        REFERENCES admins (id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ
);

-- Apenas admins ativos (sem revogação)
CREATE INDEX idx_admins_user_active
  ON admins (user_id)
  WHERE revoked_at IS NULL;


-- -----------------------------------------------------------------------------
-- TABLE: admin_permissions
-- -----------------------------------------------------------------------------

CREATE TABLE admin_permissions (
  admin_id    UUID             NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
  permission  admin_permission NOT NULL,
  PRIMARY KEY (admin_id, permission)
);


-- -----------------------------------------------------------------------------
-- TABLE: sessions
-- -----------------------------------------------------------------------------

CREATE TABLE sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  user_agent  TEXT,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user
  ON sessions (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_sessions_token
  ON sessions (token_hash)
  WHERE revoked_at IS NULL;


-- -----------------------------------------------------------------------------
-- TABLE: user_sanctions
-- -----------------------------------------------------------------------------

CREATE TABLE user_sanctions (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  applied_by    UUID          NOT NULL REFERENCES admins (id),
  sanction_type sanction_type NOT NULL,
  reason        TEXT          NOT NULL,
  starts_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  revoked_by    UUID          REFERENCES admins (id),
  revoke_reason TEXT,

  -- ban nunca tem data de expiração; suspension sempre tem
  CONSTRAINT chk_ban_no_expiry CHECK (
    (sanction_type = 'ban'        AND expires_at IS NULL) OR
    (sanction_type = 'suspension' AND expires_at IS NOT NULL)
  ),

  -- revogação exige responsável e motivo juntos
  CONSTRAINT chk_revoke_consistency CHECK (
    (revoked_at IS NULL AND revoked_by IS NULL AND revoke_reason IS NULL) OR
    (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND revoke_reason IS NOT NULL)
  )
);

CREATE INDEX idx_sanctions_user_active
  ON user_sanctions (user_id)
  WHERE revoked_at IS NULL;


-- -----------------------------------------------------------------------------
-- TABLE: follows
-- -----------------------------------------------------------------------------

CREATE TABLE follows (
  follower_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  followed_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (follower_id, followed_id),

  CONSTRAINT chk_no_self_follow CHECK (follower_id <> followed_id)
);

CREATE INDEX idx_follows_follower ON follows (follower_id);
CREATE INDEX idx_follows_followed ON follows (followed_id);


-- -----------------------------------------------------------------------------
-- TABLE: posts
-- -----------------------------------------------------------------------------

CREATE TABLE posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content         VARCHAR(280) NOT NULL DEFAULT '',
  repost_of_id    UUID        REFERENCES posts (id) ON DELETE SET NULL,
  is_repost_simple BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  hidden_at       TIMESTAMPTZ,
  hidden_by       UUID        REFERENCES admins (id),

  -- Post normal e repost com comentário devem ter conteúdo
  CONSTRAINT chk_content_not_empty CHECK (
    is_repost_simple = TRUE OR length(trim(content)) > 0
  ),

  -- Repost simples exige post de origem
  CONSTRAINT chk_simple_repost_has_origin CHECK (
    is_repost_simple = FALSE OR repost_of_id IS NOT NULL
  ),

  -- hidden_by só faz sentido se hidden_at estiver preenchido
  CONSTRAINT chk_hidden_consistency CHECK (
    (hidden_at IS NULL AND hidden_by IS NULL) OR
    (hidden_at IS NOT NULL AND hidden_by IS NOT NULL)
  )
);

-- Feed principal: posts por data desc (UC-16)
CREATE INDEX idx_posts_feed
  ON posts (created_at DESC)
  WHERE deleted_at IS NULL AND hidden_at IS NULL;

-- Posts de um autor específico (UC-04 — perfil do usuário)
CREATE INDEX idx_posts_author_created
  ON posts (author_id, created_at DESC)
  WHERE deleted_at IS NULL AND hidden_at IS NULL;

-- Reposts de um post (contagem + listagem)
CREATE INDEX idx_posts_repost_of
  ON posts (repost_of_id)
  WHERE repost_of_id IS NOT NULL;

-- Busca textual em posts (UC-18)
CREATE INDEX idx_posts_search
  ON posts USING GIN (to_tsvector('portuguese', content))
  WHERE deleted_at IS NULL AND hidden_at IS NULL;


-- -----------------------------------------------------------------------------
-- TABLE: post_likes
-- -----------------------------------------------------------------------------

CREATE TABLE post_likes (
  user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  post_id     UUID        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_post_likes_post ON post_likes (post_id);


-- -----------------------------------------------------------------------------
-- TABLE: comments
-- -----------------------------------------------------------------------------

CREATE TABLE comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content     VARCHAR(280) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,

  CONSTRAINT chk_comment_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX idx_comments_post_created
  ON comments (post_id, created_at ASC)
  WHERE deleted_at IS NULL;


-- -----------------------------------------------------------------------------
-- TABLE: notifications
-- -----------------------------------------------------------------------------

CREATE TABLE notifications (
  id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID              NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  actor_id      UUID              NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  post_id       UUID              REFERENCES posts (id) ON DELETE CASCADE,
  comment_id    UUID              REFERENCES comments (id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  read_at       TIMESTAMPTZ,

  CONSTRAINT chk_no_self_notification CHECK (recipient_id <> actor_id)
);

CREATE INDEX idx_notifications_recipient
  ON notifications (recipient_id, created_at DESC);

-- Índice parcial para o badge de não-lidas (UC-17)
CREATE INDEX idx_notifications_unread
  ON notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL;


-- -----------------------------------------------------------------------------
-- TABLE: notification_preferences
-- -----------------------------------------------------------------------------

CREATE TABLE notification_preferences (
  user_id        UUID        PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  notify_follow  BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_like    BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_comment BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_repost  BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_mention BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- -----------------------------------------------------------------------------
-- TABLE: moderation_logs
-- -----------------------------------------------------------------------------

CREATE TABLE moderation_logs (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID              NOT NULL REFERENCES admins (id),
  action      moderation_action NOT NULL,
  post_id     UUID              REFERENCES posts (id) ON DELETE SET NULL,
  reason      TEXT              NOT NULL,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_logs_admin
  ON moderation_logs (admin_id, created_at DESC);

CREATE INDEX idx_moderation_logs_post
  ON moderation_logs (post_id)
  WHERE post_id IS NOT NULL;


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
