const fs = require("fs");
const http = require("http");
const path = require("path");

const cors = require("cors");
const express = require("express");
const { Pool } = require("pg");
const { Server } = require("socket.io");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 5000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://communium:communium_dev_password@localhost:5433/communium";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
  },
});

const pool = new Pool({
  connectionString: DATABASE_URL,
});

app.use(
  cors({
    origin: CORS_ORIGIN,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Communium API",
    status: "ok",
  });
});

app.get(
  "/health",
  asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      status: "ok",
      database: "connected",
      databaseTime: result.rows[0].database_time,
    });
  })
);

app.get(
  "/api/users",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, username, email, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/users",
  asyncHandler(async (req, res) => {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        error: "username and email are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO users (username, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
       SET username = EXCLUDED.username
       RETURNING id, username, email, created_at`,
      [username, email]
    );

    res.status(201).json(result.rows[0]);
  })
);

app.get(
  "/api/messages",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT
         messages.id,
         messages.user_id,
         users.username,
         messages.content,
         messages.created_at
       FROM messages
       LEFT JOIN users ON users.id = messages.user_id
       ORDER BY messages.created_at DESC
       LIMIT 100`
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/messages",
  asyncHandler(async (req, res) => {
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        error: "userId and content are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO messages (user_id, content)
       VALUES ($1, $2)
       RETURNING id, user_id, content, created_at`,
      [userId, content]
    );

    io.emit("message:created", result.rows[0]);
    res.status(201).json(result.rows[0]);
  })
);

app.get(
  "/api/module2/providers",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, code, display_name, provider_type, supported_currency_codes,
              supports_cards, supports_subscriptions, supports_refunds, is_active
       FROM module2.payment_providers
       ORDER BY display_name ASC`
    );

    res.json(result.rows);
  })
);

app.get(
  "/api/module2/users/:userId/payment-methods",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const result = await pool.query(
      `SELECT
         upm.id,
         upm.user_id,
         upm.provider_id,
         pp.code AS provider_code,
         pp.display_name AS provider_name,
         upm.method_type,
         upm.brand,
         upm.last4,
         upm.expiry_month,
         upm.expiry_year,
         upm.holder_name,
         upm.country_code,
         upm.is_default,
         upm.status,
         upm.created_at,
         upm.updated_at
       FROM module2.user_payment_methods upm
       JOIN module2.payment_providers pp ON pp.id = upm.provider_id
       WHERE upm.user_id = $1
       ORDER BY upm.is_default DESC, upm.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/module2/users/:userId/payment-methods",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const {
      providerCode,
      providerCustomerRef,
      providerPaymentMethodRef,
      methodType,
      brand,
      last4,
      expiryMonth,
      expiryYear,
      holderName,
      countryCode,
      isDefault,
    } = req.body;

    requireFields({ providerCode, methodType });

    const provider = await findProviderByCode(providerCode);

    if (!provider) {
      return res.status(404).json({ error: "payment provider not found" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      if (Boolean(isDefault)) {
        await client.query(
          `UPDATE module2.user_payment_methods
           SET is_default = FALSE
           WHERE user_id = $1 AND is_default = TRUE AND status = 'ACTIVE'`,
          [userId]
        );
      }

      const result = await client.query(
        `INSERT INTO module2.user_payment_methods (
           user_id, provider_id, provider_customer_ref, provider_payment_method_ref,
           method_type, brand, last4, expiry_month, expiry_year, holder_name,
           country_code, is_default, metadata
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, user_id, provider_id, method_type, brand, last4,
                   expiry_month, expiry_year, holder_name, country_code,
                   is_default, status, created_at, updated_at`,
        [
          userId,
          provider.id,
          providerCustomerRef || null,
          providerPaymentMethodRef || null,
          methodType,
          brand || null,
          last4 || null,
          expiryMonth || null,
          expiryYear || null,
          holderName || null,
          countryCode || null,
          Boolean(isDefault),
          { source: "api" },
        ]
      );

      const paymentMethod = await client.query(
        `SELECT
           upm.id,
           upm.user_id,
           upm.provider_id,
           pp.code AS provider_code,
           pp.display_name AS provider_name,
           upm.method_type,
           upm.brand,
           upm.last4,
           upm.expiry_month,
           upm.expiry_year,
           upm.holder_name,
           upm.country_code,
           upm.is_default,
           upm.status,
           upm.created_at,
           upm.updated_at
         FROM module2.user_payment_methods upm
         JOIN module2.payment_providers pp ON pp.id = upm.provider_id
         WHERE upm.id = $1`,
        [result.rows[0].id]
      );

      await client.query("COMMIT");
      res.status(201).json(paymentMethod.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })
);

app.get(
  "/api/module2/users/:userId/payment-intents",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const result = await pool.query(
      `SELECT
         pi.id,
         pi.user_id,
         pp.code AS provider_code,
         pi.payment_method_id,
         pi.purpose,
         pi.status,
         pi.amount_subtotal,
         pi.amount_tax,
         pi.amount_total,
         pi.currency_code,
         pi.provider_intent_ref,
         pi.provider_checkout_url,
         pi.sca_required,
         pi.three_ds_status,
         pi.failure_code,
         pi.failure_message,
         pi.membership_subscription_ref,
         pi.business_profile_ref,
         pi.confirmed_at,
         pi.failed_at,
         pi.cancelled_at,
         pi.created_at,
         pi.updated_at
       FROM module2.payment_intents pi
       JOIN module2.payment_providers pp ON pp.id = pi.provider_id
       WHERE pi.user_id = $1
       ORDER BY pi.created_at DESC
       LIMIT 100`,
      [userId]
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/module2/users/:userId/payment-intents",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const {
      providerCode,
      paymentMethodId,
      purpose,
      amountSubtotal,
      amountTax,
      currencyCode,
      providerCheckoutUrl,
      providerReturnUrl,
      providerCancelUrl,
      membershipSubscriptionRef,
      businessProfileRef,
    } = req.body;

    requireFields({ providerCode, purpose, amountSubtotal });

    const provider = await findProviderByCode(providerCode);

    if (!provider) {
      return res.status(404).json({ error: "payment provider not found" });
    }

    const subtotal = toMoney(amountSubtotal);
    const tax = toMoney(amountTax || 0);
    const total = toMoney(subtotal + tax);
    const idempotencyKey =
      req.body.idempotencyKey || `payment-intent-${userId}-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO module2.payment_intents (
         user_id, provider_id, payment_method_id, purpose, amount_subtotal,
         amount_tax, amount_total, currency_code, provider_checkout_url,
         provider_return_url, provider_cancel_url, idempotency_key,
         membership_subscription_ref, business_profile_ref, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, user_id, provider_id, payment_method_id, purpose, status,
                 amount_subtotal, amount_tax, amount_total, currency_code,
                 provider_checkout_url, created_at, updated_at`,
      [
        userId,
        provider.id,
        paymentMethodId || null,
        purpose,
        subtotal,
        tax,
        total,
        currencyCode || "MAD",
        providerCheckoutUrl || null,
        providerReturnUrl || null,
        providerCancelUrl || null,
        idempotencyKey,
        membershipSubscriptionRef || null,
        businessProfileRef || null,
        { source: "api" },
      ]
    );

    res.status(201).json(result.rows[0]);
  })
);

app.patch(
  "/api/module2/payment-intents/:paymentIntentId/status",
  asyncHandler(async (req, res) => {
    const { status, providerIntentRef, failureCode, failureMessage } = req.body;

    requireFields({ status });

    const statusDates = {
      SUCCEEDED: "confirmed_at",
      FAILED: "failed_at",
      CANCELLED: "cancelled_at",
    };
    const dateColumn = statusDates[status];
    const dateUpdate = dateColumn ? `, ${dateColumn} = NOW()` : "";

    const result = await pool.query(
      `UPDATE module2.payment_intents
       SET status = $1,
           provider_intent_ref = COALESCE($2, provider_intent_ref),
           failure_code = $3,
           failure_message = $4
           ${dateUpdate}
       WHERE id = $5
       RETURNING id, user_id, provider_id, purpose, status, amount_total,
                 currency_code, confirmed_at, failed_at, cancelled_at, updated_at`,
      [
        status,
        providerIntentRef || null,
        failureCode || null,
        failureMessage || null,
        req.params.paymentIntentId,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "payment intent not found" });
    }

    io.emit("payment-intent:updated", result.rows[0]);
    res.json(result.rows[0]);
  })
);

app.get(
  "/api/module2/users/:userId/subscriptions",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const result = await pool.query(
      `SELECT
         ps.id,
         ps.user_id,
         pp.code AS provider_code,
         ps.payment_method_id,
         ps.membership_subscription_ref,
         ps.business_profile_ref,
         ps.provider_customer_ref,
         ps.provider_subscription_ref,
         ps.status,
         ps.amount_recurring,
         ps.currency_code,
         ps.billing_interval,
         ps.current_period_start_at,
         ps.current_period_end_at,
         ps.cancel_at_period_end,
         ps.cancelled_at,
         ps.created_at,
         ps.updated_at
       FROM module2.payment_subscriptions ps
       JOIN module2.payment_providers pp ON pp.id = ps.provider_id
       WHERE ps.user_id = $1
       ORDER BY ps.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/module2/users/:userId/subscriptions",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const {
      providerCode,
      paymentMethodId,
      membershipSubscriptionRef,
      businessProfileRef,
      providerCustomerRef,
      providerSubscriptionRef,
      amountRecurring,
      currencyCode,
      billingInterval,
    } = req.body;

    requireFields({ providerCode, amountRecurring, billingInterval });

    const provider = await findProviderByCode(providerCode);

    if (!provider) {
      return res.status(404).json({ error: "payment provider not found" });
    }

    const result = await pool.query(
      `INSERT INTO module2.payment_subscriptions (
         user_id, provider_id, payment_method_id, membership_subscription_ref,
         business_profile_ref, provider_customer_ref, provider_subscription_ref,
         status, amount_recurring, currency_code, billing_interval,
         current_period_start_at, current_period_end_at, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, $9, $10, NOW(), NOW() + INTERVAL '1 month', $11)
       RETURNING id, user_id, provider_id, payment_method_id, status,
                 amount_recurring, currency_code, billing_interval,
                 current_period_start_at, current_period_end_at, created_at, updated_at`,
      [
        userId,
        provider.id,
        paymentMethodId || null,
        membershipSubscriptionRef || null,
        businessProfileRef || null,
        providerCustomerRef || null,
        providerSubscriptionRef || null,
        toMoney(amountRecurring),
        currencyCode || "MAD",
        billingInterval,
        { source: "api" },
      ]
    );

    res.status(201).json(result.rows[0]);
  })
);

app.get(
  "/api/module2/tks-packages",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, code, display_name, base_tks, bonus_tks,
              price_subtotal,
              ROUND(price_subtotal * vat_rate, 2) AS vat_amount,
              ROUND(price_subtotal + (price_subtotal * vat_rate), 2) AS price_total,
              vat_rate, currency_code, is_active
       FROM module2.tks_packages
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, price_subtotal ASC`
    );

    res.json(result.rows);
  })
);

app.get(
  "/api/module2/users/:userId/tks-purchase-orders",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const result = await pool.query(
      `SELECT
         tpo.id,
         tpo.user_id,
         tpo.wallet_id,
         tpo.package_id,
         tp.code AS package_code,
         tp.display_name AS package_name,
         tpo.payment_intent_id,
         tpo.status,
         tpo.base_tks,
         tpo.bonus_tks,
         tpo.total_tks,
         tpo.price_subtotal,
         tpo.vat_rate,
         tpo.vat_amount,
         tpo.price_total,
         tpo.currency_code,
         tpo.wallet_transaction_id,
         tpo.paid_at,
         tpo.cancelled_at,
         tpo.created_at,
         tpo.updated_at
       FROM module2.tks_purchase_orders tpo
       JOIN module2.tks_packages tp ON tp.id = tpo.package_id
       WHERE tpo.user_id = $1
       ORDER BY tpo.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/module2/users/:userId/tks-purchase-orders",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const { packageId, providerCode } = req.body;

    requireFields({ packageId, providerCode });

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const wallet = await findOrCreateWallet(client, userId);
      const provider = await findProviderByCode(providerCode, client);

      if (!provider) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "payment provider not found" });
      }

      const packageResult = await client.query(
        `SELECT id, base_tks, bonus_tks, price_subtotal, vat_rate, currency_code
         FROM module2.tks_packages
         WHERE id = $1 AND is_active = TRUE`,
        [packageId]
      );
      const tksPackage = packageResult.rows[0];

      if (!tksPackage) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Tks package not found" });
      }

      const subtotal = toMoney(tksPackage.price_subtotal);
      const tax = toMoney(subtotal * Number(tksPackage.vat_rate));
      const total = toMoney(subtotal + tax);
      const idempotencyKey =
        req.body.idempotencyKey || `tks-order-${userId}-${packageId}-${Date.now()}`;

      const paymentIntentResult = await client.query(
        `INSERT INTO module2.payment_intents (
           user_id, provider_id, purpose, status, amount_subtotal, amount_tax,
           amount_total, currency_code, idempotency_key, metadata
         )
         VALUES ($1, $2, 'TKS_PURCHASE', 'CREATED', $3, $4, $5, $6, $7, $8)
         RETURNING id, status, amount_subtotal, amount_tax, amount_total, currency_code`,
        [
          userId,
          provider.id,
          subtotal,
          tax,
          total,
          tksPackage.currency_code,
          `${idempotencyKey}-payment`,
          { source: "api", packageId },
        ]
      );

      const orderResult = await client.query(
        `INSERT INTO module2.tks_purchase_orders (
           user_id, wallet_id, package_id, payment_intent_id, status, base_tks,
           bonus_tks, price_subtotal, vat_rate, currency_code, idempotency_key
         )
         VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8, $9, $10)
         RETURNING id, user_id, wallet_id, package_id, payment_intent_id, status,
                   base_tks, bonus_tks, total_tks, price_subtotal, vat_rate,
                   vat_amount, price_total, currency_code, created_at, updated_at`,
        [
          userId,
          wallet.id,
          tksPackage.id,
          paymentIntentResult.rows[0].id,
          tksPackage.base_tks,
          tksPackage.bonus_tks,
          subtotal,
          tksPackage.vat_rate,
          tksPackage.currency_code,
          idempotencyKey,
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        order: orderResult.rows[0],
        paymentIntent: paymentIntentResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })
);

app.post(
  "/api/module2/tks-purchase-orders/:orderId/mark-paid",
  asyncHandler(async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `SELECT tpo.*, u.username, u.email
         FROM module2.tks_purchase_orders tpo
         JOIN public.users u ON u.id = tpo.user_id
         WHERE tpo.id = $1
         FOR UPDATE`,
        [req.params.orderId]
      );
      const order = orderResult.rows[0];

      if (!order) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Tks purchase order not found" });
      }

      if (order.status === "PAID") {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "order already paid" });
      }

      await client.query(
        `UPDATE module2.payment_intents
         SET status = 'SUCCEEDED', confirmed_at = NOW()
         WHERE id = $1`,
        [order.payment_intent_id]
      );

      const transactionResult = await client.query(
        `INSERT INTO module2.wallet_transactions (
           wallet_id, user_id, direction, transaction_type, amount_tks,
           reference_type, reference_id, idempotency_key, audit_reason, metadata
         )
         VALUES ($1, $2, 'CREDIT', 'PURCHASE', $3, 'TKS_PURCHASE', $4, $5, $6, $7)
         RETURNING id, wallet_id, user_id, direction, transaction_type, amount_tks,
                   balance_before, balance_after, reference_type, reference_id, created_at`,
        [
          order.wallet_id,
          order.user_id,
          order.total_tks,
          order.id,
          `tks-purchase-paid-${order.id}`,
          "Tks purchase order marked as paid.",
          { source: "api" },
        ]
      );

      const updatedOrderResult = await client.query(
        `UPDATE module2.tks_purchase_orders
         SET status = 'PAID',
             wallet_transaction_id = $1,
             paid_at = NOW()
         WHERE id = $2
         RETURNING id, user_id, wallet_id, package_id, payment_intent_id, status,
                   base_tks, bonus_tks, total_tks, price_subtotal, vat_rate,
                   vat_amount, price_total, currency_code, wallet_transaction_id,
                   paid_at, created_at, updated_at`,
        [transactionResult.rows[0].id, order.id]
      );

      const invoiceResult = await client.query(
        `INSERT INTO module2.invoices (
           invoice_number, user_id, payment_intent_id, tks_purchase_order_id,
           status, buyer_name, buyer_email, amount_subtotal, vat_rate,
           vat_amount, amount_total, currency_code, issued_at, paid_at, metadata
         )
         VALUES ($1, $2, $3, $4, 'PAID', $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), $12)
         RETURNING id, invoice_number, user_id, payment_intent_id,
                   tks_purchase_order_id, status, amount_subtotal, vat_amount,
                   amount_total, currency_code, issued_at, paid_at, created_at`,
        [
          `COMM-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`,
          order.user_id,
          order.payment_intent_id,
          order.id,
          order.username,
          order.email,
          order.price_subtotal,
          order.vat_rate,
          order.vat_amount,
          order.price_total,
          order.currency_code,
          { source: "api" },
        ]
      );

      await client.query(
        `INSERT INTO module2.invoice_items (
           invoice_id, line_order, description, quantity, unit_price, vat_rate, metadata
         )
         VALUES ($1, 1, $2, 1, $3, $4, $5)`,
        [
          invoiceResult.rows[0].id,
          `Purchase of ${order.total_tks} Tks`,
          order.price_subtotal,
          order.vat_rate,
          { source: "api" },
        ]
      );

      await client.query("COMMIT");

      const payload = {
        order: updatedOrderResult.rows[0],
        walletTransaction: transactionResult.rows[0],
        invoice: invoiceResult.rows[0],
      };

      io.emit("tks-purchase-order:paid", payload);
      res.json(payload);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })
);

app.get(
  "/api/module2/users/:userId/wallet",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const wallet = await findOrCreateWallet(pool, userId);

    res.json(wallet);
  })
);

app.post(
  "/api/module2/users/:userId/wallet",
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        error: "userId must be an integer",
      });
    }

    const result = await pool.query(
      `INSERT INTO module2.wallets (user_id, wallet_code, metadata)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET updated_at = NOW()
       RETURNING id, user_id, wallet_code, currency_code, balance_tks,
                 reserved_tks, status, opened_at, created_at, updated_at`,
      [userId, `WALLET-${userId}`, { source: "api" }]
    );

    res.status(201).json(result.rows[0]);
  })
);

app.get(
  "/api/module2/users/:userId/wallet/transactions",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, wallet_id, user_id, direction, transaction_type, amount_tks,
              balance_before, balance_after, reference_type, reference_id, created_at
       FROM module2.wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.params.userId]
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/module2/users/:userId/wallet/transactions",
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.userId);
    const { direction, transactionType, amountTks, referenceType, auditReason } =
      req.body;

    if (!Number.isInteger(userId) || !direction || !transactionType || !amountTks) {
      return res.status(400).json({
        error: "userId, direction, transactionType and amountTks are required",
      });
    }

    const wallet = await findWalletByUserId(userId);

    if (!wallet) {
      return res.status(404).json({
        error: "wallet not found",
      });
    }

    const idempotencyKey =
      req.body.idempotencyKey ||
      `wallet-${wallet.id}-${direction}-${transactionType}-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO module2.wallet_transactions (
         wallet_id, user_id, direction, transaction_type, amount_tks,
         reference_type, idempotency_key, audit_reason, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, wallet_id, user_id, direction, transaction_type, amount_tks,
                 balance_before, balance_after, reference_type, reference_id, created_at`,
      [
        wallet.id,
        userId,
        direction,
        transactionType,
        amountTks,
        referenceType || "ADMIN",
        idempotencyKey,
        auditReason || null,
        { source: "api" },
      ]
    );

    io.emit("wallet:transaction-created", result.rows[0]);
    res.status(201).json(result.rows[0]);
  })
);

app.get(
  "/api/module2/users/:userId/invoices",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");
    const result = await pool.query(
      `SELECT id, invoice_number, user_id, payment_intent_id,
              tks_purchase_order_id, status, seller_legal_name, buyer_name,
              buyer_email, amount_subtotal, vat_rate, vat_amount, amount_total,
              currency_code, pdf_url, issued_at, paid_at, created_at, updated_at
       FROM module2.invoices
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  })
);

app.get(
  "/api/module2/invoices/:invoiceId",
  asyncHandler(async (req, res) => {
    const invoiceResult = await pool.query(
      `SELECT id, invoice_number, user_id, payment_intent_id,
              tks_purchase_order_id, status, seller_legal_name, seller_ice,
              seller_if, buyer_name, buyer_email, buyer_ice, buyer_if,
              amount_subtotal, vat_rate, vat_amount, amount_total,
              currency_code, pdf_url, issued_at, paid_at, created_at, updated_at
       FROM module2.invoices
       WHERE id = $1`,
      [req.params.invoiceId]
    );
    const invoice = invoiceResult.rows[0];

    if (!invoice) {
      return res.status(404).json({ error: "invoice not found" });
    }

    const itemsResult = await pool.query(
      `SELECT id, invoice_id, line_order, description, quantity, unit_price,
              amount_subtotal, vat_rate, vat_amount, amount_total, created_at
       FROM module2.invoice_items
       WHERE invoice_id = $1
       ORDER BY line_order ASC`,
      [invoice.id]
    );

    res.json({
      ...invoice,
      items: itemsResult.rows,
    });
  })
);

app.get(
  "/api/module2/refunds",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, payment_intent_id, provider_id, user_id, provider_refund_ref,
              status, amount_refunded, currency_code, reason, failure_message,
              requested_at, processed_at, created_at, updated_at
       FROM module2.payment_refunds
       ORDER BY created_at DESC
       LIMIT 100`
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/module2/refunds",
  asyncHandler(async (req, res) => {
    const { paymentIntentId, amountRefunded, reason, providerRefundRef } = req.body;

    requireFields({ paymentIntentId, amountRefunded });

    const paymentIntentResult = await pool.query(
      `SELECT id, provider_id, user_id, currency_code
       FROM module2.payment_intents
       WHERE id = $1`,
      [paymentIntentId]
    );
    const paymentIntent = paymentIntentResult.rows[0];

    if (!paymentIntent) {
      return res.status(404).json({ error: "payment intent not found" });
    }

    const result = await pool.query(
      `INSERT INTO module2.payment_refunds (
         payment_intent_id, provider_id, user_id, provider_refund_ref,
         status, amount_refunded, currency_code, reason, metadata
       )
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8)
       RETURNING id, payment_intent_id, provider_id, user_id, provider_refund_ref,
                 status, amount_refunded, currency_code, reason, requested_at,
                 created_at, updated_at`,
      [
        paymentIntent.id,
        paymentIntent.provider_id,
        paymentIntent.user_id,
        providerRefundRef || null,
        toMoney(amountRefunded),
        paymentIntent.currency_code,
        reason || null,
        { source: "api" },
      ]
    );

    res.status(201).json(result.rows[0]);
  })
);

app.post(
  "/api/module2/webhooks/:providerCode",
  asyncHandler(async (req, res) => {
    const provider = await findProviderByCode(req.params.providerCode);

    if (!provider) {
      return res.status(404).json({ error: "payment provider not found" });
    }

    const providerEventRef =
      req.body.providerEventRef || req.body.id || `event-${Date.now()}`;
    const eventType = req.body.eventType || req.body.type || "unknown";

    const result = await pool.query(
      `INSERT INTO module2.payment_webhook_events (
         provider_id, provider_event_ref, event_type, signature_valid,
         processing_status, payload
       )
       VALUES ($1, $2, $3, $4, 'PENDING', $5)
       ON CONFLICT (provider_id, provider_event_ref) DO UPDATE
       SET payload = EXCLUDED.payload
       RETURNING id, provider_id, provider_event_ref, event_type,
                 signature_valid, processing_status, received_at`,
      [
        provider.id,
        providerEventRef,
        eventType,
        Boolean(req.body.signatureValid),
        req.body,
      ]
    );

    res.status(202).json(result.rows[0]);
  })
);

io.on("connection", (socket) => {
  socket.emit("connected", {
    message: "Connected to Communium realtime API",
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "route not found",
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    error: error.message || "internal server error",
  });
});

server.listen(PORT, () => {
  console.log(`Communium API running on port ${PORT}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function findWalletByUserId(userId) {
  const result = await pool.query(
    `SELECT id, user_id, wallet_code, currency_code, balance_tks,
            reserved_tks, status, opened_at, created_at, updated_at
     FROM module2.wallets
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0];
}

async function findOrCreateWallet(client, userId) {
  const result = await client.query(
    `INSERT INTO module2.wallets (user_id, wallet_code, metadata)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
     SET updated_at = NOW()
     RETURNING id, user_id, wallet_code, currency_code, balance_tks,
               reserved_tks, status, opened_at, created_at, updated_at`,
    [userId, `WALLET-${userId}`, { source: "api" }]
  );

  return result.rows[0];
}

async function findProviderByCode(code, client = pool) {
  const result = await client.query(
    `SELECT id, code, display_name, provider_type, is_active
     FROM module2.payment_providers
     WHERE UPPER(code) = UPPER($1) AND is_active = TRUE`,
    [code]
  );

  return result.rows[0];
}

function parseIntegerParam(value, name) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    const error = new Error(`${name} must be an integer`);
    error.status = 400;
    throw error;
  }

  return parsed;
}

function requireFields(fields) {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || value === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

function toMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function shutdown() {
  console.log("Shutting down Communium API...");
  await pool.end();
  server.close(() => {
    process.exit(0);
  });
}
