-- =============================================================================
-- Migration: 0002_add_direct_messages
-- Description: Adiciona tabelas de conversas e mensagens diretas (DMs)
-- Created at: 2026-05-18
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: conversations
-- -----------------------------------------------------------------------------
-- user_a_id é sempre o menor UUID dos dois participantes (CHECK garante isso),
-- o que permite o índice único simples em (user_a_id, user_b_id) sem duplicatas.

CREATE TABLE conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id  UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_b_id  UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_no_self_conversation CHECK (user_a_id <> user_b_id),

  -- Força user_a_id < user_b_id para garantir unicidade do par sem duplicata invertida
  CONSTRAINT chk_ordered_participants CHECK (user_a_id < user_b_id)
);

-- Par de participantes único
CREATE UNIQUE INDEX uq_conversations_participants
  ON conversations (user_a_id, user_b_id);

-- Busca de conversas de um usuário
CREATE INDEX idx_conversations_user_a ON conversations (user_a_id);
CREATE INDEX idx_conversations_user_b ON conversations (user_b_id);


-- -----------------------------------------------------------------------------
-- TABLE: direct_messages
-- -----------------------------------------------------------------------------

CREATE TABLE direct_messages (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID         NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id       UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content         VARCHAR(1000) NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  read_at         TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT chk_dm_not_empty CHECK (length(trim(content)) > 0)
);

-- Mensagens de uma conversa ordenadas por data
CREATE INDEX idx_direct_messages_conversation
  ON direct_messages (conversation_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- Mensagens não lidas de um destinatário
CREATE INDEX idx_direct_messages_unread
  ON direct_messages (conversation_id, created_at ASC)
  WHERE read_at IS NULL AND deleted_at IS NULL;


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
