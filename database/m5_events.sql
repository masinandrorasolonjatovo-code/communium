-- Module 5 - Evenements
-- Schema PostgreSQL professionnel pour M5-01, M5-02 et M5-03.
-- Objectifs couverts :
-- - Creation et gestion d'evenements
-- - Inscriptions, billets QR, paiements MAD/Tks, liste d'attente
-- - Check-in, fil de discussion, networking, sondages live et replay

CREATE SCHEMA IF NOT EXISTS module5;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'event_type'
  ) THEN
    CREATE TYPE module5.event_type AS ENUM (
      'conference',
      'networking',
      'workshop',
      'roundtable'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'event_format'
  ) THEN
    CREATE TYPE module5.event_format AS ENUM (
      'physical',
      'virtual',
      'hybrid'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'event_privacy'
  ) THEN
    CREATE TYPE module5.event_privacy AS ENUM (
      'public',
      'members_only',
      'invite_only'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'event_status'
  ) THEN
    CREATE TYPE module5.event_status AS ENUM (
      'draft',
      'published',
      'cancelled',
      'completed',
      'archived'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'event_currency'
  ) THEN
    CREATE TYPE module5.event_currency AS ENUM (
      'MAD',
      'TKS'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'ticket_status'
  ) THEN
    CREATE TYPE module5.ticket_status AS ENUM (
      'valid',
      'checked_in',
      'cancelled',
      'refunded',
      'expired'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'payment_status'
  ) THEN
    CREATE TYPE module5.payment_status AS ENUM (
      'not_required',
      'pending',
      'paid',
      'failed',
      'refunded'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'invite_status'
  ) THEN
    CREATE TYPE module5.invite_status AS ENUM (
      'pending',
      'accepted',
      'declined',
      'expired'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'module5' AND t.typname = 'feed_message_type'
  ) THEN
    CREATE TYPE module5.feed_message_type AS ENUM (
      'message',
      'announcement',
      'question'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION module5.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- unaccent peut ne pas etre active selon l'environnement. Cette extension est standard PostgreSQL.
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION module5.slugify(value TEXT)
RETURNS TEXT AS $$
  SELECT trim(both '-' from regexp_replace(lower(unaccent(value)), '[^a-z0-9]+', '-', 'g'));
$$ LANGUAGE SQL IMMUTABLE;

CREATE TABLE IF NOT EXISTS module5.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  organizer_business_ref UUID,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  banner_url TEXT,
  type module5.event_type NOT NULL DEFAULT 'networking',
  format module5.event_format NOT NULL DEFAULT 'physical',
  privacy module5.event_privacy NOT NULL DEFAULT 'public',
  status module5.event_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(80) NOT NULL DEFAULT 'Africa/Casablanca',
  location_name VARCHAR(180),
  location_address TEXT,
  location_city VARCHAR(100),
  location_country VARCHAR(100) NOT NULL DEFAULT 'Maroc',
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  virtual_link TEXT,
  capacity INTEGER NOT NULL DEFAULT 50,
  waitlist_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,
  is_free BOOLEAN NOT NULL DEFAULT TRUE,
  price_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency module5.event_currency NOT NULL DEFAULT 'MAD',
  refund_policy TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at),
  CHECK (capacity > 0),
  CHECK (price_amount >= 0),
  CHECK (
    (is_free = TRUE AND price_amount = 0)
    OR (is_free = FALSE AND price_amount > 0)
  ),
  CHECK (
    status <> 'published'
    OR (format = 'physical' AND location_address IS NOT NULL)
    OR (format = 'virtual' AND virtual_link IS NOT NULL)
    OR (format = 'hybrid' AND location_address IS NOT NULL AND virtual_link IS NOT NULL)
  ),
  CHECK (
    registration_closes_at IS NULL
    OR registration_opens_at IS NULL
    OR registration_closes_at > registration_opens_at
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS events_slug_uidx
ON module5.events (LOWER(slug));

CREATE INDEX IF NOT EXISTS idx_events_status_starts_at
ON module5.events (status, starts_at);

CREATE INDEX IF NOT EXISTS idx_events_city_type_starts_at
ON module5.events (location_city, type, starts_at);

CREATE INDEX IF NOT EXISTS idx_events_organizer_user_id
ON module5.events (organizer_user_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_privacy
ON module5.events (privacy);

CREATE INDEX IF NOT EXISTS idx_events_search
ON module5.events USING gin(
  to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location_city, ''))
);

DROP TRIGGER IF EXISTS trg_events_updated_at ON module5.events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON module5.events
FOR EACH ROW EXECUTE FUNCTION module5.set_updated_at();

CREATE OR REPLACE FUNCTION module5.ensure_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    NEW.slug = module5.slugify(NEW.title);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_slug ON module5.events;
CREATE TRIGGER trg_events_slug
BEFORE INSERT OR UPDATE OF title, slug ON module5.events
FOR EACH ROW EXECUTE FUNCTION module5.ensure_event_slug();

CREATE TABLE IF NOT EXISTS module5.event_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  uploaded_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  asset_type VARCHAR(40) NOT NULL DEFAULT 'image',
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  mime_type VARCHAR(120),
  file_size_bytes BIGINT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_event_assets_event_id
ON module5.event_assets (event_id, sort_order ASC);

CREATE TABLE IF NOT EXISTS module5.event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  invited_user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  invited_email VARCHAR(255),
  invited_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  status module5.invite_status NOT NULL DEFAULT 'pending',
  invite_token VARCHAR(120) NOT NULL,
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_invitations_token_uidx
ON module5.event_invitations (invite_token);

CREATE UNIQUE INDEX IF NOT EXISTS event_invitations_user_uidx
ON module5.event_invitations (event_id, invited_user_id)
WHERE invited_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS event_invitations_email_uidx
ON module5.event_invitations (event_id, LOWER(invited_email))
WHERE invited_email IS NOT NULL;

CREATE TABLE IF NOT EXISTS module5.event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  attendee_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  attendee_name VARCHAR(180),
  attendee_email VARCHAR(255),
  ticket_code VARCHAR(80) NOT NULL,
  qr_payload TEXT NOT NULL,
  status module5.ticket_status NOT NULL DEFAULT 'valid',
  payment_status module5.payment_status NOT NULL DEFAULT 'not_required',
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency module5.event_currency NOT NULL DEFAULT 'MAD',
  payment_reference TEXT,
  payment_provider VARCHAR(60),
  checked_in_at TIMESTAMPTZ,
  checked_in_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (attendee_user_id IS NOT NULL OR attendee_email IS NOT NULL),
  CHECK (amount_paid >= 0),
  CHECK (
    (status = 'checked_in' AND checked_in_at IS NOT NULL)
    OR status <> 'checked_in'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS event_tickets_code_uidx
ON module5.event_tickets (ticket_code);

CREATE UNIQUE INDEX IF NOT EXISTS event_tickets_qr_payload_uidx
ON module5.event_tickets (qr_payload);

CREATE UNIQUE INDEX IF NOT EXISTS event_tickets_user_event_uidx
ON module5.event_tickets (event_id, attendee_user_id)
WHERE attendee_user_id IS NOT NULL AND status IN ('valid', 'checked_in');

CREATE UNIQUE INDEX IF NOT EXISTS event_tickets_email_event_uidx
ON module5.event_tickets (event_id, LOWER(attendee_email))
WHERE attendee_email IS NOT NULL AND status IN ('valid', 'checked_in');

CREATE INDEX IF NOT EXISTS idx_event_tickets_event_status
ON module5.event_tickets (event_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_tickets_attendee_user_id
ON module5.event_tickets (attendee_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION module5.ensure_ticket_identity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_code IS NULL OR trim(NEW.ticket_code) = '' THEN
    NEW.ticket_code = upper(replace(gen_random_uuid()::text, '-', ''));
  END IF;

  IF NEW.qr_payload IS NULL OR trim(NEW.qr_payload) = '' THEN
    NEW.qr_payload = 'COMMUNIUM:M5:TICKET:' || NEW.ticket_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION module5.prevent_event_overbooking()
RETURNS TRIGGER AS $$
DECLARE
  event_capacity INTEGER;
  confirmed_count INTEGER;
BEGIN
  IF NEW.status NOT IN ('valid', 'checked_in') THEN
    RETURN NEW;
  END IF;

  SELECT capacity
  INTO event_capacity
  FROM module5.events
  WHERE id = NEW.event_id
  FOR UPDATE;

  IF event_capacity IS NULL THEN
    RAISE EXCEPTION 'Event % not found', NEW.event_id;
  END IF;

  SELECT COUNT(1)
  INTO confirmed_count
  FROM module5.event_tickets
  WHERE event_id = NEW.event_id
    AND status IN ('valid', 'checked_in')
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF confirmed_count >= event_capacity THEN
    RAISE EXCEPTION 'Event capacity reached for event %', NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_tickets_identity ON module5.event_tickets;
CREATE TRIGGER trg_event_tickets_identity
BEFORE INSERT OR UPDATE OF ticket_code, qr_payload ON module5.event_tickets
FOR EACH ROW EXECUTE FUNCTION module5.ensure_ticket_identity();

DROP TRIGGER IF EXISTS trg_event_tickets_capacity ON module5.event_tickets;
CREATE TRIGGER trg_event_tickets_capacity
BEFORE INSERT OR UPDATE OF status ON module5.event_tickets
FOR EACH ROW EXECUTE FUNCTION module5.prevent_event_overbooking();

DROP TRIGGER IF EXISTS trg_event_tickets_updated_at ON module5.event_tickets;
CREATE TRIGGER trg_event_tickets_updated_at
BEFORE UPDATE ON module5.event_tickets
FOR EACH ROW EXECUTE FUNCTION module5.set_updated_at();

CREATE TABLE IF NOT EXISTS module5.event_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(180),
  position INTEGER,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_waitlist_user_uidx
ON module5.event_waitlist (event_id, user_id)
WHERE user_id IS NOT NULL AND promoted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS event_waitlist_email_uidx
ON module5.event_waitlist (event_id, LOWER(email))
WHERE email IS NOT NULL AND promoted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_waitlist_order
ON module5.event_waitlist (event_id, created_at ASC);

CREATE TABLE IF NOT EXISTS module5.event_feed_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  author_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  message_type module5.feed_message_type NOT NULL DEFAULT 'message',
  body TEXT NOT NULL,
  attachment_meta JSONB,
  parent_id UUID REFERENCES module5.event_feed_messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_feed_event_created
ON module5.event_feed_messages (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_feed_pinned
ON module5.event_feed_messages (event_id, is_pinned, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_feed_search
ON module5.event_feed_messages USING gin(to_tsvector('french', coalesce(body, '')));

DROP TRIGGER IF EXISTS trg_event_feed_updated_at ON module5.event_feed_messages;
CREATE TRIGGER trg_event_feed_updated_at
BEFORE UPDATE ON module5.event_feed_messages
FOR EACH ROW EXECUTE FUNCTION module5.set_updated_at();

CREATE TABLE IF NOT EXISTS module5.event_networking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  requester_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status module5.invite_status NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (requester_user_id <> target_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_networking_unique_uidx
ON module5.event_networking_requests (event_id, requester_user_id, target_user_id);

CREATE TABLE IF NOT EXISTS module5.event_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  created_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  allows_multiple_answers BOOLEAN NOT NULL DEFAULT FALSE,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_polls_event_active
ON module5.event_polls (event_id, is_active, created_at DESC);

DROP TRIGGER IF EXISTS trg_event_polls_updated_at ON module5.event_polls;
CREATE TRIGGER trg_event_polls_updated_at
BEFORE UPDATE ON module5.event_polls
FOR EACH ROW EXECUTE FUNCTION module5.set_updated_at();

CREATE TABLE IF NOT EXISTS module5.event_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES module5.event_polls(id) ON DELETE CASCADE,
  option_text VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_poll_options_poll
ON module5.event_poll_options (poll_id, sort_order ASC);

CREATE TABLE IF NOT EXISTS module5.event_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES module5.event_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES module5.event_poll_options(id) ON DELETE CASCADE,
  voter_user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  voter_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (voter_user_id IS NOT NULL OR voter_email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_poll_votes_user_option_uidx
ON module5.event_poll_votes (poll_id, option_id, voter_user_id)
WHERE voter_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS event_poll_votes_email_option_uidx
ON module5.event_poll_votes (poll_id, option_id, LOWER(voter_email))
WHERE voter_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_poll_votes_option
ON module5.event_poll_votes (option_id);

CREATE OR REPLACE FUNCTION module5.prevent_multiple_poll_votes_when_disabled()
RETURNS TRIGGER AS $$
DECLARE
  multiple_allowed BOOLEAN;
  existing_votes INTEGER;
BEGIN
  SELECT allows_multiple_answers
  INTO multiple_allowed
  FROM module5.event_polls
  WHERE id = NEW.poll_id;

  IF COALESCE(multiple_allowed, FALSE) = TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(1)
  INTO existing_votes
  FROM module5.event_poll_votes
  WHERE poll_id = NEW.poll_id
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (NEW.voter_user_id IS NOT NULL AND voter_user_id = NEW.voter_user_id)
      OR (
        NEW.voter_email IS NOT NULL
        AND voter_email IS NOT NULL
        AND LOWER(voter_email) = LOWER(NEW.voter_email)
      )
    );

  IF existing_votes > 0 THEN
    RAISE EXCEPTION 'Only one vote is allowed for poll %', NEW.poll_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_poll_votes_single_choice ON module5.event_poll_votes;
CREATE TRIGGER trg_event_poll_votes_single_choice
BEFORE INSERT OR UPDATE ON module5.event_poll_votes
FOR EACH ROW EXECUTE FUNCTION module5.prevent_multiple_poll_votes_when_disabled();

CREATE TABLE IF NOT EXISTS module5.event_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER,
  visibility module5.event_privacy NOT NULL DEFAULT 'members_only',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS idx_event_replays_event
ON module5.event_replays (event_id, published_at DESC);

DROP TRIGGER IF EXISTS trg_event_replays_updated_at ON module5.event_replays;
CREATE TRIGGER trg_event_replays_updated_at
BEFORE UPDATE ON module5.event_replays
FOR EACH ROW EXECUTE FUNCTION module5.set_updated_at();

CREATE TABLE IF NOT EXISTS module5.event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES module5.events(id) ON DELETE CASCADE,
  recipient_user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255),
  channel VARCHAR(30) NOT NULL DEFAULT 'in_app',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  delivery_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (recipient_user_id IS NOT NULL OR recipient_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_event_notifications_recipient_user
ON module5.event_notifications (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_notifications_event
ON module5.event_notifications (event_id, created_at DESC);

CREATE OR REPLACE VIEW module5.event_capacity_summary AS
SELECT
  e.id AS event_id,
  e.capacity,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('valid', 'checked_in')) AS confirmed_tickets,
  COUNT(DISTINCT w.id) FILTER (WHERE w.promoted_at IS NULL) AS waitlist_count,
  GREATEST(
    e.capacity - COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('valid', 'checked_in')),
    0
  ) AS remaining_capacity,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'checked_in') AS checked_in_count
FROM module5.events e
LEFT JOIN module5.event_tickets t ON t.event_id = e.id
LEFT JOIN module5.event_waitlist w ON w.event_id = e.id
GROUP BY e.id, e.capacity;

CREATE OR REPLACE VIEW module5.public_events AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.description,
  e.banner_url,
  e.type,
  e.format,
  e.privacy,
  e.status,
  e.starts_at,
  e.ends_at,
  e.timezone,
  e.location_name,
  e.location_city,
  e.location_country,
  e.is_free,
  e.price_amount,
  e.currency,
  c.remaining_capacity,
  c.confirmed_tickets,
  c.waitlist_count
FROM module5.events e
JOIN module5.event_capacity_summary c ON c.event_id = e.id
WHERE e.status = 'published';
