-- Module 4 — Messagerie et communication temps réel
-- Schema PostgreSQL pour le module de chat 1-à-1, groupes, threads et appels.

CREATE SCHEMA IF NOT EXISTS module4;

-- Types métiers sécurisés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module4' AND t.typname = 'conversation_type'
  ) THEN
    CREATE TYPE module4.conversation_type AS ENUM ('direct', 'group');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module4' AND t.typname = 'participant_role'
  ) THEN
    CREATE TYPE module4.participant_role AS ENUM ('member', 'moderator', 'admin');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module4' AND t.typname = 'message_type'
  ) THEN
    CREATE TYPE module4.message_type AS ENUM ('text', 'image', 'file', 'audio_call', 'video_call');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module4' AND t.typname = 'call_status'
  ) THEN
    CREATE TYPE module4.call_status AS ENUM ('missed', 'completed', 'rejected', 'ongoing');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION module4.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS module4.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type module4.conversation_type NOT NULL DEFAULT 'direct',
  name VARCHAR(150),
  avatar_url TEXT,
  pinned_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (type = 'group' AND name IS NOT NULL AND name <> '')
    OR type = 'direct'
  )
);

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON module4.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON module4.conversations
FOR EACH ROW EXECUTE FUNCTION module4.set_updated_at();

CREATE TABLE IF NOT EXISTS module4.participants (
  conversation_id UUID NOT NULL REFERENCES module4.conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role module4.participant_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS module4.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES module4.conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  content_type module4.message_type NOT NULL DEFAULT 'text',
  text_content TEXT,
  attachment_meta JSONB,
  parent_id UUID REFERENCES module4.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_pinned_message'
  ) THEN
    ALTER TABLE module4.conversations
    ADD CONSTRAINT fk_pinned_message
    FOREIGN KEY (pinned_message_id) REFERENCES module4.messages(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS module4.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES module4.conversations(id) ON DELETE CASCADE,
  creator_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  type module4.message_type NOT NULL CHECK (type IN ('audio_call', 'video_call')),
  status module4.call_status NOT NULL DEFAULT 'ongoing',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  room_name VARCHAR(255) NOT NULL
);

CREATE INDEX idx_conversations_updated_at
ON module4.conversations (updated_at DESC);

CREATE INDEX idx_participants_user_id
ON module4.participants (user_id);

CREATE INDEX idx_messages_room_date
ON module4.messages (conversation_id, created_at DESC);

CREATE INDEX idx_messages_text_search
ON module4.messages USING gin(to_tsvector('french', coalesce(text_content, '')));

CREATE OR REPLACE FUNCTION module4.refresh_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE module4.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_after_insert ON module4.messages;
CREATE TRIGGER trg_messages_after_insert
AFTER INSERT ON module4.messages
FOR EACH ROW EXECUTE FUNCTION module4.refresh_conversation_timestamp();

DROP TRIGGER IF EXISTS trg_messages_after_update ON module4.messages;
CREATE TRIGGER trg_messages_after_update
AFTER UPDATE ON module4.messages
FOR EACH ROW EXECUTE FUNCTION module4.refresh_conversation_timestamp();
