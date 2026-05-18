-- The Communium - Module 2: Payments and Tks economy
-- Professional PostgreSQL schema for M2-01, M2-02, M2-03 and M2-04.
-- This script is intentionally isolated from Module 1 files, while keeping
-- stable references to Module 1 entities through UUID reference columns.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS module2;

CREATE OR REPLACE FUNCTION module2.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS module2.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(30) NOT NULL CHECK (provider_type IN ('STRIPE', 'CMI', 'MANUAL')),
  supported_currency_codes TEXT[] NOT NULL DEFAULT ARRAY['MAD'],
  supports_cards BOOLEAN NOT NULL DEFAULT TRUE,
  supports_subscriptions BOOLEAN NOT NULL DEFAULT FALSE,
  supports_refunds BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_payment_providers_updated_at ON module2.payment_providers;
CREATE TRIGGER trg_payment_providers_updated_at
BEFORE UPDATE ON module2.payment_providers
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES module2.payment_providers(id),
  provider_customer_ref VARCHAR(150),
  provider_payment_method_ref VARCHAR(150),
  method_type VARCHAR(30) NOT NULL CHECK (method_type IN ('CARD', 'BANK_CARD', 'OTHER')),
  brand VARCHAR(50),
  last4 CHAR(4),
  expiry_month SMALLINT CHECK (expiry_month BETWEEN 1 AND 12),
  expiry_year SMALLINT CHECK (expiry_year >= 2024),
  holder_name VARCHAR(160),
  country_code CHAR(2),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'FAILED')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, provider_payment_method_ref)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_payment_methods_one_default_uidx
ON module2.user_payment_methods (user_id)
WHERE is_default = TRUE AND status = 'ACTIVE';

DROP TRIGGER IF EXISTS trg_user_payment_methods_updated_at ON module2.user_payment_methods;
CREATE TRIGGER trg_user_payment_methods_updated_at
BEFORE UPDATE ON module2.user_payment_methods
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES module2.payment_providers(id),
  payment_method_id UUID REFERENCES module2.user_payment_methods(id) ON DELETE SET NULL,
  purpose VARCHAR(40) NOT NULL CHECK (purpose IN ('MEMBERSHIP', 'TKS_PURCHASE', 'EVENT', 'MENTORING', 'MARKETPLACE', 'SERVICE_OFFER')),
  status VARCHAR(40) NOT NULL DEFAULT 'CREATED' CHECK (
    status IN ('CREATED', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED')
  ),
  amount_total NUMERIC(12, 2) NOT NULL CHECK (amount_total >= 0),
  amount_tax NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_tax >= 0),
  amount_subtotal NUMERIC(12, 2) NOT NULL CHECK (amount_subtotal >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'MAD',
  provider_intent_ref VARCHAR(180),
  provider_checkout_url TEXT,
  provider_return_url TEXT,
  provider_cancel_url TEXT,
  idempotency_key VARCHAR(180) NOT NULL,
  sca_required BOOLEAN NOT NULL DEFAULT FALSE,
  three_ds_status VARCHAR(40),
  failure_code VARCHAR(80),
  failure_message TEXT,
  membership_subscription_ref UUID,
  business_profile_ref UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  confirmed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, provider_intent_ref),
  UNIQUE (idempotency_key),
  CHECK (amount_total = amount_subtotal + amount_tax)
);

CREATE INDEX IF NOT EXISTS payment_intents_user_status_idx
ON module2.payment_intents (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_intents_purpose_idx
ON module2.payment_intents (purpose, created_at DESC);

DROP TRIGGER IF EXISTS trg_payment_intents_updated_at ON module2.payment_intents;
CREATE TRIGGER trg_payment_intents_updated_at
BEFORE UPDATE ON module2.payment_intents
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.payment_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES module2.payment_providers(id),
  payment_method_id UUID REFERENCES module2.user_payment_methods(id) ON DELETE SET NULL,
  membership_subscription_ref UUID,
  business_profile_ref UUID,
  provider_customer_ref VARCHAR(180),
  provider_subscription_ref VARCHAR(180),
  status VARCHAR(40) NOT NULL DEFAULT 'INCOMPLETE' CHECK (
    status IN ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'UNPAID', 'PAUSED')
  ),
  amount_recurring NUMERIC(12, 2) NOT NULL CHECK (amount_recurring >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'MAD',
  billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('MONTHLY', 'YEARLY')),
  current_period_start_at TIMESTAMPTZ,
  current_period_end_at TIMESTAMPTZ,
  trial_start_at TIMESTAMPTZ,
  trial_end_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, provider_subscription_ref)
);

CREATE INDEX IF NOT EXISTS payment_subscriptions_user_status_idx
ON module2.payment_subscriptions (user_id, status, created_at DESC);

DROP TRIGGER IF EXISTS trg_payment_subscriptions_updated_at ON module2.payment_subscriptions;
CREATE TRIGGER trg_payment_subscriptions_updated_at
BEFORE UPDATE ON module2.payment_subscriptions
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES module2.payment_providers(id),
  provider_event_ref VARCHAR(180) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  processing_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (processing_status IN ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED')),
  payment_intent_id UUID REFERENCES module2.payment_intents(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE (provider_id, provider_event_ref)
);

CREATE INDEX IF NOT EXISTS payment_webhook_events_status_idx
ON module2.payment_webhook_events (processing_status, received_at);

CREATE TABLE IF NOT EXISTS module2.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id UUID NOT NULL REFERENCES module2.payment_intents(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES module2.payment_providers(id),
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  provider_refund_ref VARCHAR(180),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  amount_refunded NUMERIC(12, 2) NOT NULL CHECK (amount_refunded > 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'MAD',
  reason VARCHAR(80),
  failure_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, provider_refund_ref)
);

CREATE INDEX IF NOT EXISTS payment_refunds_user_created_idx
ON module2.payment_refunds (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_payment_refunds_updated_at ON module2.payment_refunds;
CREATE TRIGGER trg_payment_refunds_updated_at
BEFORE UPDATE ON module2.payment_refunds
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_code VARCHAR(40) NOT NULL UNIQUE,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'TKS',
  balance_tks NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (balance_tks >= 0),
  reserved_tks NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (reserved_tks >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (balance_tks >= reserved_tks)
);

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON module2.wallets;
CREATE TRIGGER trg_wallets_updated_at
BEFORE UPDATE ON module2.wallets
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES module2.wallets(id) ON DELETE RESTRICT,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  transaction_type VARCHAR(30) NOT NULL CHECK (
    transaction_type IN ('PURCHASE', 'EARNING', 'SPEND', 'TRANSFER_IN', 'TRANSFER_OUT', 'REFUND', 'ADJUSTMENT', 'REVERSAL')
  ),
  amount_tks NUMERIC(18, 2) NOT NULL CHECK (amount_tks > 0),
  balance_before NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (balance_before >= 0),
  balance_after NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (balance_after >= 0),
  reference_type VARCHAR(40) NOT NULL CHECK (
    reference_type IN ('PAYMENT_INTENT', 'TKS_PURCHASE', 'EVENT', 'MENTORING', 'MARKETPLACE', 'ADMIN', 'SYSTEM')
  ),
  reference_id UUID,
  counterparty_wallet_id UUID REFERENCES module2.wallets(id) ON DELETE RESTRICT,
  idempotency_key VARCHAR(180) NOT NULL,
  audit_reason TEXT,
  created_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_created_idx
ON module2.wallet_transactions (wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_type_idx
ON module2.wallet_transactions (user_id, transaction_type, created_at DESC);

CREATE OR REPLACE FUNCTION module2.apply_wallet_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance NUMERIC(18, 2);
  next_balance NUMERIC(18, 2);
BEGIN
  IF EXISTS (
    SELECT 1
    FROM module2.wallet_transactions
    WHERE idempotency_key = NEW.idempotency_key
  ) THEN
    RETURN NULL;
  END IF;

  SELECT balance_tks
  INTO current_balance
  FROM module2.wallets
  WHERE id = NEW.wallet_id AND user_id = NEW.user_id AND status = 'ACTIVE'
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Active wallet % for user % was not found', NEW.wallet_id, NEW.user_id;
  END IF;

  IF NEW.direction = 'DEBIT' THEN
    IF current_balance < NEW.amount_tks THEN
      RAISE EXCEPTION 'Insufficient Tks balance for wallet %', NEW.wallet_id;
    END IF;
    next_balance := current_balance - NEW.amount_tks;
  ELSE
    next_balance := current_balance + NEW.amount_tks;
  END IF;

  NEW.balance_before := current_balance;
  NEW.balance_after := next_balance;

  UPDATE module2.wallets
  SET balance_tks = next_balance, updated_at = NOW()
  WHERE id = NEW.wallet_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wallet_transactions_apply ON module2.wallet_transactions;
CREATE TRIGGER trg_wallet_transactions_apply
BEFORE INSERT ON module2.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION module2.apply_wallet_transaction();

CREATE TABLE IF NOT EXISTS module2.tks_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  base_tks NUMERIC(18, 2) NOT NULL CHECK (base_tks > 0),
  bonus_tks NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (bonus_tks >= 0),
  price_subtotal NUMERIC(12, 2) NOT NULL CHECK (price_subtotal >= 0),
  vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.2000 CHECK (vat_rate >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'MAD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_tks_packages_updated_at ON module2.tks_packages;
CREATE TRIGGER trg_tks_packages_updated_at
BEFORE UPDATE ON module2.tks_packages
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.tks_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES module2.wallets(id) ON DELETE RESTRICT,
  package_id UUID NOT NULL REFERENCES module2.tks_packages(id) ON DELETE RESTRICT,
  payment_intent_id UUID REFERENCES module2.payment_intents(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'FAILED', 'REFUNDED')),
  base_tks NUMERIC(18, 2) NOT NULL CHECK (base_tks > 0),
  bonus_tks NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (bonus_tks >= 0),
  total_tks NUMERIC(18, 2) GENERATED ALWAYS AS (base_tks + bonus_tks) STORED,
  price_subtotal NUMERIC(12, 2) NOT NULL CHECK (price_subtotal >= 0),
  vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.2000 CHECK (vat_rate >= 0),
  vat_amount NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND(price_subtotal * vat_rate, 2)) STORED,
  price_total NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND(price_subtotal + (price_subtotal * vat_rate), 2)) STORED,
  currency_code CHAR(3) NOT NULL DEFAULT 'MAD',
  wallet_transaction_id UUID UNIQUE REFERENCES module2.wallet_transactions(id) ON DELETE SET NULL,
  idempotency_key VARCHAR(180) NOT NULL UNIQUE,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tks_purchase_orders_user_status_idx
ON module2.tks_purchase_orders (user_id, status, created_at DESC);

DROP TRIGGER IF EXISTS trg_tks_purchase_orders_updated_at ON module2.tks_purchase_orders;
CREATE TRIGGER trg_tks_purchase_orders_updated_at
BEFORE UPDATE ON module2.tks_purchase_orders
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(60) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  payment_intent_id UUID REFERENCES module2.payment_intents(id) ON DELETE SET NULL,
  tks_purchase_order_id UUID REFERENCES module2.tks_purchase_orders(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'VOID', 'REFUNDED')),
  seller_legal_name VARCHAR(180) NOT NULL DEFAULT 'The Communium',
  seller_ice VARCHAR(20),
  seller_if VARCHAR(20),
  buyer_name VARCHAR(180) NOT NULL,
  buyer_email VARCHAR(180) NOT NULL,
  buyer_ice VARCHAR(20),
  buyer_if VARCHAR(20),
  amount_subtotal NUMERIC(12, 2) NOT NULL CHECK (amount_subtotal >= 0),
  vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.2000 CHECK (vat_rate >= 0),
  vat_amount NUMERIC(12, 2) NOT NULL CHECK (vat_amount >= 0),
  amount_total NUMERIC(12, 2) NOT NULL CHECK (amount_total >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'MAD',
  pdf_url TEXT,
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_total = amount_subtotal + vat_amount)
);

CREATE INDEX IF NOT EXISTS invoices_user_created_idx
ON module2.invoices (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON module2.invoices;
CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON module2.invoices
FOR EACH ROW EXECUTE FUNCTION module2.set_updated_at();

CREATE TABLE IF NOT EXISTS module2.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES module2.invoices(id) ON DELETE CASCADE,
  line_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  amount_subtotal NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND(quantity * unit_price, 2)) STORED,
  vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.2000 CHECK (vat_rate >= 0),
  vat_amount NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND((quantity * unit_price) * vat_rate, 2)) STORED,
  amount_total NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND((quantity * unit_price) + ((quantity * unit_price) * vat_rate), 2)) STORED,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_order_idx
ON module2.invoice_items (invoice_id, line_order);

CREATE OR REPLACE VIEW module2.wallet_ledger_view AS
SELECT
  wt.id,
  wt.wallet_id,
  wt.user_id,
  wt.direction,
  wt.transaction_type,
  wt.amount_tks,
  wt.balance_before,
  wt.balance_after,
  wt.reference_type,
  wt.reference_id,
  wt.created_at
FROM module2.wallet_transactions wt
ORDER BY wt.created_at DESC;
