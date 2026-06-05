-- The Communium - Module 2 demo seed
-- Run after database/init.sql and database/m2_payments_tks.sql.

INSERT INTO public.users (username, email)
VALUES
  ('obede_demo', 'obede.demo@communium.test')
ON CONFLICT (email) DO NOTHING;

INSERT INTO module2.payment_providers (
  code,
  display_name,
  provider_type,
  supported_currency_codes,
  supports_cards,
  supports_subscriptions,
  supports_refunds,
  config
)
VALUES
  (
    'STRIPE',
    'Stripe International',
    'STRIPE',
    ARRAY['MAD', 'EUR', 'USD'],
    TRUE,
    TRUE,
    TRUE,
    '{"mode":"test","checkout":"enabled","sca":"enabled"}'::jsonb
  ),
  (
    'CMI',
    'CMI Maroc',
    'CMI',
    ARRAY['MAD'],
    TRUE,
    FALSE,
    TRUE,
    '{"mode":"test","redirect":"enabled","signatureValidation":"required"}'::jsonb
  )
ON CONFLICT (code) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  provider_type = EXCLUDED.provider_type,
  supported_currency_codes = EXCLUDED.supported_currency_codes,
  supports_cards = EXCLUDED.supports_cards,
  supports_subscriptions = EXCLUDED.supports_subscriptions,
  supports_refunds = EXCLUDED.supports_refunds,
  config = EXCLUDED.config,
  is_active = TRUE;

INSERT INTO module2.tks_packages (
  code,
  display_name,
  base_tks,
  bonus_tks,
  price_subtotal,
  vat_rate,
  currency_code,
  sort_order
)
VALUES
  ('TKS_100', 'Pack 100 Tks', 100, 0, 83.33, 0.2000, 'MAD', 1),
  ('TKS_500_BONUS', 'Pack 500 Tks + bonus', 500, 50, 375.00, 0.2000, 'MAD', 2),
  ('TKS_1000_BONUS', 'Pack 1000 Tks + bonus', 1000, 150, 750.00, 0.2000, 'MAD', 3)
ON CONFLICT (code) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  base_tks = EXCLUDED.base_tks,
  bonus_tks = EXCLUDED.bonus_tks,
  price_subtotal = EXCLUDED.price_subtotal,
  vat_rate = EXCLUDED.vat_rate,
  currency_code = EXCLUDED.currency_code,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

INSERT INTO module2.wallets (user_id, wallet_code, balance_tks, metadata)
SELECT
  u.id,
  'WALLET-DEMO-' || u.id,
  0,
  '{"source":"module2_demo_seed"}'::jsonb
FROM public.users u
WHERE u.email = 'obede.demo@communium.test'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO module2.wallet_transactions (
  wallet_id,
  user_id,
  direction,
  transaction_type,
  amount_tks,
  reference_type,
  idempotency_key,
  audit_reason,
  metadata
)
SELECT
  w.id,
  w.user_id,
  'CREDIT',
  'PURCHASE',
  100,
  'SYSTEM',
  'demo-initial-credit-' || w.id,
  'Initial demo Tks credit for Module 2 wallet testing.',
  '{"seed":"seed_m2_payments_tks.sql"}'::jsonb
FROM module2.wallets w
JOIN public.users u ON u.id = w.user_id
WHERE u.email = 'obede.demo@communium.test'
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO module2.payment_subscriptions (
  user_id,
  provider_id,
  membership_subscription_ref,
  provider_customer_ref,
  provider_subscription_ref,
  status,
  amount_recurring,
  currency_code,
  billing_interval,
  current_period_start_at,
  current_period_end_at,
  metadata
)
SELECT
  u.id,
  p.id,
  '00000000-0000-4000-8000-000000000105'::uuid,
  'cus_demo_m2',
  'sub_demo_m2_membership',
  'ACTIVE',
  500.00,
  'MAD',
  'YEARLY',
  NOW(),
  NOW() + INTERVAL '1 year',
  '{"source":"seed_m2_payments_tks.sql","module1Link":"M1-05 membership reference"}'::jsonb
FROM public.users u
JOIN module2.payment_providers p ON p.code = 'STRIPE'
WHERE u.email = 'obede.demo@communium.test'
ON CONFLICT (provider_id, provider_subscription_ref) DO NOTHING;
