const fs = require("fs");
const http = require("http");
const path = require("path");

const cors = require("cors");
const express = require("express");
const { Pool } = require("pg");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 5000);
const CORS_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map((origin) => origin.trim()).filter(Boolean);
const isAllowedCorsOrigin = (origin) => {
  if (!origin || CORS_ORIGINS.includes(origin)) {
    return true;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://communium:communium_dev_password@localhost:5433/communium";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin denied: ${origin}`));
      }
    },
  },
});

const pool = new Pool({
  connectionString: DATABASE_URL,
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin denied: ${origin}`));
      }
    },
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
    try {
      const result = await pool.query(
        `SELECT id, code, display_name, provider_type, supported_currency_codes,
                supports_cards, supports_subscriptions, supports_refunds, is_active
         FROM module2.payment_providers
         ORDER BY display_name ASC`
      );

      res.json(result.rows);
    } catch (error) {
      if (error?.code === "42P01") {
        // Missing payment provider table: return empty list until the module2 schema is initialized.
        return res.json([]);
      }
      throw error;
    }
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

        const paymentIntent = result.rows[0];

        if (paymentIntent.purpose?.startsWith("module5:event:") && ["SUCCEEDED", "FAILED", "CANCELLED"].includes(status)) {
          const paymentStatus = status === "SUCCEEDED" ? "paid" : "failed";
          const paymentReference = providerIntentRef || paymentIntent.id;

          await pool.query(
            `UPDATE module5.event_tickets
             SET payment_status = $1,
                 payment_reference = $2,
                 amount_paid = CASE WHEN $3 = 'paid' THEN pi.amount_total ELSE module5.event_tickets.amount_paid END
             FROM module2.payment_intents pi
             WHERE module5.event_tickets.metadata->>'paymentIntentId' = pi.id
               AND pi.id = $4`,
            [paymentStatus, paymentReference, paymentStatus, paymentIntent.id]
          );
          // If payment succeeded, send tickets by email for associated tickets
          if (paymentStatus === "paid") {
            try {
              const ticketsResult = await pool.query(
                `SELECT t.id FROM module5.event_tickets t WHERE t.metadata->>'paymentIntentId' = $1`,
                [paymentIntent.id]
              );

              for (const r of ticketsResult.rows) {
                (async (ticketId) => {
                  try {
                    const fullTicket = await getTicket(ticketId);
                    await sendTicketEmailByTicket(fullTicket, fullTicket.attendee_email);
                  } catch (e) {
                    console.error('Error sending ticket after payment for ticket', ticketId, e);
                  }
                })(r.id);
              }
            } catch (e) {
              console.error('Failed to fetch/send tickets after payment:', e);
            }
          }
        }

        io.emit("payment-intent:updated", paymentIntent);
        res.json(paymentIntent);
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

    // Module5 - Events API
    app.get(
      "/api/module5/events",
      asyncHandler(async (req, res) => {
        const q = (req.query.q || "").toString();
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const params = [];
        let where = `WHERE e.status = 'published'`;

        if (q) {
          params.push(`%${q}%`);
          where += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length} OR e.location_city ILIKE $${params.length})`;
        }

        const sql = `SELECT e.*, c.remaining_capacity, c.confirmed_tickets, c.waitlist_count
                     FROM module5.public_events e
                     JOIN module5.event_capacity_summary c ON c.event_id = e.id
                     ${where}
                     ORDER BY e.starts_at ASC
                     LIMIT $${params.length + 1}`;

        params.push(limit);

        const result = await pool.query(sql, params);
        res.json(result.rows);
      })
    );

    app.get(
      "/api/module5/events/:eventId",
      asyncHandler(async (req, res) => {
        const eventId = req.params.eventId;
        const result = await pool.query(
          `SELECT e.*, c.remaining_capacity, c.confirmed_tickets, c.waitlist_count
           FROM module5.events e
           JOIN module5.event_capacity_summary c ON c.event_id = e.id
           WHERE e.id = $1`,
          [eventId]
        );

        if (!result.rows[0]) {
          return res.status(404).json({ error: "event not found" });
        }

        res.json(result.rows[0]);
      })
    );

    app.post(
      "/api/module5/events",
      asyncHandler(async (req, res) => {
        const body = req.body;
        requireFields({ title: body.title, starts_at: body.starts_at, ends_at: body.ends_at });

        const result = await pool.query(
          `INSERT INTO module5.events (
             organizer_user_id, organizer_business_ref, title, slug, description, banner_url,
             type, format, privacy, status, starts_at, ends_at, timezone, location_name,
             location_address, location_city, location_country, latitude, longitude, virtual_link,
             capacity, waitlist_enabled, registration_opens_at, registration_closes_at,
             is_free, price_amount, currency, refund_policy, metadata, published_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
           RETURNING *`,
          [
            body.organizer_user_id || null,
            normalizeUuid(body.organizer_business_ref),
            body.title,
            body.slug || null,
            body.description || "",
            body.banner_url || null,
            body.type || "networking",
            body.format || "physical",
            normalizeEventPrivacy(body.privacy),
            body.status || "draft",
            body.starts_at,
            body.ends_at,
            body.timezone || "Africa/Casablanca",
            body.location_name || null,
            body.location_address || null,
            body.location_city || null,
            body.location_country || "Maroc",
            body.latitude || null,
            body.longitude || null,
            body.virtual_link || null,
            body.capacity || 50,
            body.waitlist_enabled === undefined ? true : Boolean(body.waitlist_enabled),
            body.registration_opens_at || null,
            body.registration_closes_at || null,
            body.is_free === undefined ? true : Boolean(body.is_free),
            body.price_amount || 0.0,
            normalizeEventCurrency(body.currency),
            body.refund_policy || null,
            {
              ...(body.metadata || {}),
              organizer_business_name:
                body.organizer_business_name ||
                (!isUuid(body.organizer_business_ref) ? body.organizer_business_ref : undefined),
            },
            body.published_at || null,
          ]
        );

        io.emit("module5:event:created", result.rows[0]);
        res.status(201).json(result.rows[0]);
      })
    );

    app.patch(
      "/api/module5/events/:eventId",
      asyncHandler(async (req, res) => {
        const eventId = req.params.eventId;
        const body = req.body;

        // Build update dynamically (simple and safe approach)
        const allowed = [
          "title",
          "slug",
          "description",
          "banner_url",
          "type",
          "format",
          "privacy",
          "status",
          "starts_at",
          "ends_at",
          "timezone",
          "location_name",
          "location_address",
          "location_city",
          "location_country",
          "latitude",
          "longitude",
          "virtual_link",
          "capacity",
          "waitlist_enabled",
          "registration_opens_at",
          "registration_closes_at",
          "is_free",
          "price_amount",
          "currency",
          "refund_policy",
          "metadata",
          "published_at",
          "cancelled_at",
        ];

        const sets = [];
        const params = [];
        let idx = 1;

        for (const key of allowed) {
          if (Object.prototype.hasOwnProperty.call(body, key)) {
            sets.push(`${key} = $${idx}`);
            params.push(body[key]);
            idx++;
          }
        }

        if (sets.length === 0) {
          return res.status(400).json({ error: "no updatable fields provided" });
        }

        params.push(eventId);

        const sql = `UPDATE module5.events SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
        const result = await pool.query(sql, params);

        if (!result.rows[0]) {
          return res.status(404).json({ error: "event not found" });
        }

        io.emit("module5:event:updated", result.rows[0]);
        res.json(result.rows[0]);
      })
    );

    // Register (create ticket) with free, paid and waitlist workflows.
    app.post(
      "/api/module5/events/:eventId/register",
      asyncHandler(async (req, res) => {
        const eventId = req.params.eventId;
        const { attendeeUserId, attendeeName, attendeeEmail, paymentProviderCode, paymentMethodId, providerReturnUrl, providerCancelUrl } = req.body;

        requireFields({ attendeeName, attendeeEmail });

        const client = await pool.connect();

        try {
          await client.query("BEGIN");

          // Lock the event row; capacity summary may be a view with GROUP BY so avoid FOR UPDATE on it
          const evRow = await client.query(
            `SELECT id, is_free, price_amount, currency, waitlist_enabled, capacity
             FROM module5.events
             WHERE id = $1
             FOR UPDATE`,
            [eventId]
          );

          if (!evRow.rows[0]) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "event not found" });
          }

          // compute confirmed tickets count and remaining capacity without using the aggregated view
          const confirmedRes = await client.query(
            `SELECT COUNT(1) AS confirmed
             FROM module5.event_tickets
             WHERE event_id = $1 AND status IN ('valid', 'checked_in')`,
            [eventId]
          );

          const confirmedTickets = Number(confirmedRes.rows[0]?.confirmed || 0);
          const capacity = Number(evRow.rows[0].capacity || 0);
          const remaining_capacity = Math.max(capacity - confirmedTickets, 0);

          const event = {
            ...evRow.rows[0],
            remaining_capacity,
            confirmed_tickets: confirmedTickets,
          };

          if (event.remaining_capacity <= 0) {
            if (!event.waitlist_enabled) {
              await client.query("ROLLBACK");
              return res.status(409).json({ error: "event capacity reached" });
            }

            const positionResult = await client.query(
              `SELECT COALESCE(MAX(position), 0) + 1 AS next_position
               FROM module5.event_waitlist
               WHERE event_id = $1 AND promoted_at IS NULL`,
              [eventId]
            );

            const waitlistResult = await client.query(
              `INSERT INTO module5.event_waitlist (
                 event_id, user_id, email, full_name, position
               ) VALUES ($1, $2, $3, $4, $5)
               RETURNING *`,
              [
                eventId,
                attendeeUserId || null,
                attendeeEmail,
                attendeeName,
                positionResult.rows[0].next_position,
              ]
            );

            await client.query("COMMIT");

            res.status(201).json({
              status: "waitlisted",
              waitlist: waitlistResult.rows[0],
            });
            return;
          }

          if (event.is_free) {
            const ticketResult = await client.query(
              `INSERT INTO module5.event_tickets (
                 event_id, attendee_user_id, attendee_name, attendee_email, status,
                 payment_status, amount_paid, currency, metadata
               ) VALUES ($1,$2,$3,$4,'valid','not_required',0.00,$5,$6)
               RETURNING *`,
              [eventId, attendeeUserId || null, attendeeName, attendeeEmail, event.currency || "MAD", { source: "api" }]
            );

            await client.query("COMMIT");

            io.emit("module5:ticket:created", ticketResult.rows[0]);
            // enqueue ticket email send (async)
            try {
              const fullTicket = await getTicket(ticketResult.rows[0].id);
              setImmediate(async () => {
                try {
                  await sendTicketEmailByTicket(fullTicket, fullTicket.attendee_email);
                } catch (e) {
                  console.error("Failed to send ticket email:", e);
                }
              });
            } catch (e) {
              console.error("Failed to queue ticket email:", e);
            }

            res.status(201).json({ status: "registered", ticket: ticketResult.rows[0] });
            return;
          }

          requireFields({ paymentProviderCode });

          const provider = await findProviderByCode(paymentProviderCode, client);

          if (!provider) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "payment provider not found" });
          }

          const subtotal = toMoney(event.price_amount);
          const tax = 0;
          const total = toMoney(subtotal + tax);
          const idempotencyKey = `module5-ticket-${eventId}-${attendeeEmail}-${Date.now()}`;
          const providerCheckoutUrl =
            provider.provider_type === "CMI"
              ? `https://cmi.communium.test/checkout?amount=${total}&currency=${event.currency}&returnUrl=${encodeURIComponent(providerReturnUrl || "")}`
              : `https://stripe.com/pay/${idempotencyKey}`;

          const paymentIntentResult = await client.query(
            `INSERT INTO module2.payment_intents (
               user_id, provider_id, payment_method_id, purpose, amount_subtotal,
               amount_tax, amount_total, currency_code, provider_checkout_url,
               provider_return_url, provider_cancel_url, idempotency_key,
               membership_subscription_ref, business_profile_ref, metadata
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             RETURNING id, user_id, provider_id, payment_method_id, purpose, status,
                       amount_subtotal, amount_tax, amount_total, currency_code,
                       provider_checkout_url, provider_return_url, provider_cancel_url,
                       idempotency_key, created_at, updated_at`,
            [
              attendeeUserId || null,
              provider.id,
              paymentMethodId || null,
              `module5:event:${eventId}:ticket`,
              subtotal,
              tax,
              total,
              event.currency || "MAD",
              providerCheckoutUrl,
              providerReturnUrl || null,
              providerCancelUrl || null,
              idempotencyKey,
              null,
              null,
              { source: "module5_event_registration", attendee_email: attendeeEmail },
            ]
          );

          const ticketResult = await client.query(
            `INSERT INTO module5.event_tickets (
               event_id, attendee_user_id, attendee_name, attendee_email, status,
               payment_status, amount_paid, currency, payment_reference,
               payment_provider, metadata
             ) VALUES ($1,$2,$3,$4,'valid','pending',0.00,$5,$6,$7,$8,$9)
             RETURNING *`,
            [
              eventId,
              attendeeUserId || null,
              attendeeName,
              attendeeEmail,
              event.currency || "MAD",
              paymentIntentResult.rows[0].id,
              provider.code,
              { paymentIntentId: paymentIntentResult.rows[0].id, source: "module5_event_registration" },
            ]
          );

          await client.query("COMMIT");

          io.emit("module5:ticket:created", ticketResult.rows[0]);
          res.status(201).json({
            status: "pending_payment",
            ticket: ticketResult.rows[0],
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

    // Check-in endpoint: mark ticket as checked_in by ticket_code or ticket id
    app.post(
      "/api/module5/tickets/checkin",
      asyncHandler(async (req, res) => {
        const { ticketCode, ticketId, checkedInByUserId } = req.body;

        if (!ticketCode && !ticketId) {
          return res.status(400).json({ error: "ticketCode or ticketId is required" });
        }

        const client = await pool.connect();

        try {
          await client.query("BEGIN");

          const lookup = ticketId
            ? await client.query(`SELECT * FROM module5.event_tickets WHERE id = $1 FOR UPDATE`, [ticketId])
            : await client.query(`SELECT * FROM module5.event_tickets WHERE ticket_code = $1 FOR UPDATE`, [ticketCode]);

          const ticket = lookup.rows[0];

          if (!ticket) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "ticket not found" });
          }

          if (ticket.status === 'checked_in') {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "ticket already checked in" });
          }

          const result = await client.query(
            `UPDATE module5.event_tickets
             SET status = 'checked_in', checked_in_at = NOW(), checked_in_by_user_id = $1
             WHERE id = $2
             RETURNING *`,
            [checkedInByUserId || null, ticket.id]
          );

          await client.query("COMMIT");

          io.emit("module5:ticket:checked_in", result.rows[0]);
          res.json(result.rows[0]);
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

// Module 4: messagerie, conversations, participants, messages et appels.
app.get(
  "/api/module4/users/:userId/conversations",
  asyncHandler(async (req, res) => {
    const userId = parseIntegerParam(req.params.userId, "userId");

    const result = await pool.query(
      `SELECT
         c.id,
         c.type,
         c.name,
         c.avatar_url,
         c.pinned_message_id,
         c.created_at,
         c.updated_at,
         p.role,
         p.last_read_at,
         m.id AS last_message_id,
         m.sender_id AS last_message_sender_id,
         u.username AS last_message_sender_username,
         m.text_content AS last_message_text,
         m.content_type AS last_message_type,
         m.created_at AS last_message_created_at,
         COALESCE(
           (SELECT COUNT(1)
            FROM module4.messages
            WHERE conversation_id = c.id
              AND created_at > p.last_read_at),
           0
         ) AS unread_count
       FROM module4.conversations c
       JOIN module4.participants p ON p.conversation_id = c.id
       LEFT JOIN LATERAL (
         SELECT id, sender_id, text_content, content_type, created_at
         FROM module4.messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
       ) m ON TRUE
       LEFT JOIN public.users u ON u.id = m.sender_id
       WHERE p.user_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
  })
);

app.get(
  "/api/module4/conversations/:conversationId",
  asyncHandler(async (req, res) => {
    const conversationId = req.params.conversationId;

    const conversationResult = await pool.query(
      `SELECT id, type, name, avatar_url, pinned_message_id, created_at, updated_at
       FROM module4.conversations
       WHERE id = $1`,
      [conversationId]
    );

    const conversation = conversationResult.rows[0];

    if (!conversation) {
      return res.status(404).json({ error: "conversation not found" });
    }

    const participantsResult = await pool.query(
      `SELECT p.user_id, p.role, p.joined_at, p.last_read_at,
              u.username, u.email
       FROM module4.participants p
       JOIN public.users u ON u.id = p.user_id
       WHERE p.conversation_id = $1
       ORDER BY p.joined_at ASC`,
      [conversationId]
    );

    const pinnedMessage = conversation.pinned_message_id
      ? (
          await pool.query(
            `SELECT m.id, m.conversation_id, m.sender_id, u.username AS sender_username,
                    m.content_type, m.text_content, m.attachment_meta, m.parent_id,
                    m.created_at
             FROM module4.messages m
             LEFT JOIN public.users u ON u.id = m.sender_id
             WHERE m.id = $1`,
            [conversation.pinned_message_id]
          )
        ).rows[0]
      : null;

    res.json({
      ...conversation,
      participants: participantsResult.rows,
      pinned_message: pinnedMessage,
    });
  })
);

app.post(
  "/api/module4/conversations",
  asyncHandler(async (req, res) => {
    const { type, name, participantIds, createdByUserId, avatarUrl } = req.body;

    requireFields({ type, participantIds, createdByUserId });

    if (!Array.isArray(participantIds) || participantIds.length < 2) {
      return res.status(400).json({
        error: "participantIds must be an array with at least two users",
      });
    }

    if (type === "group" && (!name || !name.trim())) {
      return res.status(400).json({
        error: "group conversations require a name",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const conversationResult = await client.query(
        `INSERT INTO module4.conversations (type, name, avatar_url)
         VALUES ($1, $2, $3)
         RETURNING id, type, name, avatar_url, pinned_message_id, created_at, updated_at`,
        [type, name || null, avatarUrl || null]
      );

      const conversation = conversationResult.rows[0];
      const participantRows = [];

      for (const participantId of participantIds) {
        const role = participantId === createdByUserId ? "admin" : "member";
        const participantResult = await client.query(
          `INSERT INTO module4.participants (conversation_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (conversation_id, user_id) DO NOTHING
           RETURNING conversation_id, user_id, role, joined_at, last_read_at`,
          [conversation.id, participantId, role]
        );

        participantRows.push(
          participantResult.rows[0] || {
            conversation_id: conversation.id,
            user_id: participantId,
            role,
          }
        );
      }

      await client.query("COMMIT");

      const payload = {
        ...conversation,
        participants: participantRows,
      };

      for (const participantId of participantIds) {
        io.to(`user:${participantId}`).emit(
          "module4:conversation:created",
          payload
        );
      }

      res.status(201).json(payload);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })
);

// Get attendees for an event (organizer view)
app.get(
  "/api/module5/events/:eventId/attendees",
  asyncHandler(async (req, res) => {
    const eventId = req.params.eventId;

    const result = await pool.query(
      `SELECT t.id, t.ticket_code, t.attendee_user_id, t.attendee_name, t.attendee_email, t.status, t.payment_status, t.amount_paid, t.currency, t.checked_in_at, t.created_at
       FROM module5.event_tickets t
       WHERE t.event_id = $1
       ORDER BY t.created_at ASC`,
      [eventId]
    );

    res.json(result.rows);
  })
);

// Helper: fetch ticket by id
async function getTicket(ticketId) {
  const result = await pool.query(
    `SELECT t.*, e.title AS event_title, e.starts_at, e.ends_at
     FROM module5.event_tickets t
     LEFT JOIN module5.events e ON e.id = t.event_id
     WHERE t.id = $1`,
    [ticketId]
  );

  return result.rows[0];
}

// Generate PDF buffer for a ticket object
async function generateTicketPdfBuffer(ticket) {
  const payload = {
    ticketId: ticket.id,
    ticketCode: ticket.ticket_code || `TICKET-${ticket.id}`,
    eventId: ticket.event_id,
    attendeeName: ticket.attendee_name,
    attendeeEmail: ticket.attendee_email,
  };

  const dataString = JSON.stringify(payload);
  const dataUrl = await QRCode.toDataURL(dataString, { errorCorrectionLevel: "M" });
  const base64 = dataUrl.split(",")[1];
  const imgBuffer = Buffer.from(base64, "base64");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const pdfEnd = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(20).text(ticket.event_title || "Event Ticket", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${ticket.attendee_name || "-"}`);
  doc.text(`Email: ${ticket.attendee_email || "-"}`);
  doc.text(`Ticket: ${ticket.ticket_code || `TICKET-${ticket.id}`}`);
  doc.text(`Event starts: ${ticket.starts_at ? new Date(ticket.starts_at).toLocaleString() : "-"}`);
  doc.moveDown();
  try {
    doc.image(imgBuffer, { fit: [150, 150], align: "center" });
  } catch (e) {
    // ignore
  }
  doc.moveDown();
  doc.fontSize(10).text("Please present this ticket at the event entrance.");
  doc.end();

  return await pdfEnd;
}

// Send ticket by email (helper)
async function sendTicketEmailByTicket(ticket, recipient, subject, message) {
  const pdfBuffer = await generateTicketPdfBuffer(ticket);

  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@communium.test",
    to: recipient,
    subject: subject || `Your ticket for ${ticket.event_title || "Event"}`,
    text: message || `Attached is your ticket for ${ticket.event_title || "Event"}`,
    attachments: [
      {
        filename: `ticket-${ticket.id}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return nodemailer.getTestMessageUrl(info) || info.messageId;
}

// Generate QR code PNG for a ticket
app.get(
  "/api/module5/tickets/:ticketId/qr",
  asyncHandler(async (req, res) => {
    const ticketId = req.params.ticketId;
    const ticket = await getTicket(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "ticket not found" });
    }

    const payload = {
      ticketId: ticket.id,
      ticketCode: ticket.ticket_code || `TICKET-${ticket.id}`,
      eventId: ticket.event_id,
      attendeeName: ticket.attendee_name,
      attendeeEmail: ticket.attendee_email,
    };

    const dataString = JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(dataString, { errorCorrectionLevel: "M" });
    const base64 = dataUrl.split(",")[1];
    const img = Buffer.from(base64, "base64");

    res.setHeader("Content-Type", "image/png");
    res.send(img);
  })
);

// Generate PDF ticket (includes QR)
app.get(
  "/api/module5/tickets/:ticketId/pdf",
  asyncHandler(async (req, res) => {
    const ticketId = req.params.ticketId;
    const ticket = await getTicket(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "ticket not found" });
    }

    const payload = {
      ticketId: ticket.id,
      ticketCode: ticket.ticket_code || `TICKET-${ticket.id}`,
      eventId: ticket.event_id,
      attendeeName: ticket.attendee_name,
      attendeeEmail: ticket.attendee_email,
    };

    const dataString = JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(dataString, { errorCorrectionLevel: "M" });
    const base64 = dataUrl.split(",")[1];
    const imgBuffer = Buffer.from(base64, "base64");

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const result = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="ticket-${ticket.id}.pdf"`
      );
      res.send(result);
    });

    doc.fontSize(20).text(ticket.event_title || "Event Ticket", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${ticket.attendee_name || "-"}`);
    doc.text(`Email: ${ticket.attendee_email || "-"}`);
    doc.text(`Ticket: ${ticket.ticket_code || `TICKET-${ticket.id}`}`);
    doc.text(
      `Event starts: ${ticket.starts_at ? new Date(ticket.starts_at).toLocaleString() : "-"}`
    );
    doc.moveDown();

    // add QR
    try {
      doc.image(imgBuffer, { fit: [150, 150], align: "center" });
    } catch (e) {
      // ignore image errors
    }

    doc.moveDown();
    doc.fontSize(10).text("Please present this ticket at the event entrance.");
    doc.end();
  })
);

// Send ticket by email (will use SMTP config if provided, otherwise ethereal)
app.post(
  "/api/module5/tickets/:ticketId/email",
  asyncHandler(async (req, res) => {
    const ticketId = req.params.ticketId;
    const { to, subject, message } = req.body;

    const ticket = await getTicket(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "ticket not found" });
    }

    const recipient = to || ticket.attendee_email;

    if (!recipient) {
      return res.status(400).json({ error: "recipient email required" });
    }

    const previewUrl = await sendTicketEmailByTicket(ticket, recipient, subject, message);
    res.json({ ok: true, previewUrl });
  })
);

app.patch(
  "/api/module4/conversations/:conversationId",
  asyncHandler(async (req, res) => {
    const conversationId = req.params.conversationId;
    const { name, avatarUrl, pinnedMessageId } = req.body;

    if (name === undefined && avatarUrl === undefined && pinnedMessageId === undefined) {
      return res.status(400).json({
        error: "At least one field to update is required",
      });
    }

    const values = [conversationId];
    const updates = [];

    if (name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(name || null);
    }

    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${values.length + 1}`);
      values.push(avatarUrl || null);
    }

    if (pinnedMessageId !== undefined) {
      updates.push(`pinned_message_id = $${values.length + 1}`);
      values.push(pinnedMessageId || null);
    }

    const result = await pool.query(
      `UPDATE module4.conversations
       SET ${updates.join(", ")}
       WHERE id = $1
       RETURNING id, type, name, avatar_url, pinned_message_id, created_at, updated_at`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "conversation not found" });
    }

    io.to(`conversation:${conversationId}`).emit(
      "module4:conversation:updated",
      result.rows[0]
    );

    res.json(result.rows[0]);
  })
);

app.get(
  "/api/module4/conversations/:conversationId/participants",
  asyncHandler(async (req, res) => {
    const conversationId = req.params.conversationId;

    const result = await pool.query(
      `SELECT p.user_id, p.role, p.joined_at, p.last_read_at,
              u.username, u.email
       FROM module4.participants p
       JOIN public.users u ON u.id = p.user_id
       WHERE p.conversation_id = $1
       ORDER BY p.joined_at ASC`,
      [conversationId]
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/module4/conversations/:conversationId/participants",
  asyncHandler(async (req, res) => {
    const conversationId = req.params.conversationId;
    const { userId, role } = req.body;

    requireFields({ userId });

    if (role && !["member", "moderator", "admin"].includes(role)) {
      return res.status(400).json({
        error: "Invalid participant role",
      });
    }

    const conversationExists = await pool.query(
      `SELECT id FROM module4.conversations WHERE id = $1`,
      [conversationId]
    );

    if (!conversationExists.rows[0]) {
      return res.status(404).json({ error: "conversation not found" });
    }

    const result = await pool.query(
      `INSERT INTO module4.participants (conversation_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (conversation_id, user_id) DO UPDATE
       SET role = EXCLUDED.role
       RETURNING conversation_id, user_id, role, joined_at, last_read_at`,
      [conversationId, userId, role || "member"]
    );

    io.to(`conversation:${conversationId}`).emit(
      "module4:participant:added",
      result.rows[0]
    );

    res.status(201).json(result.rows[0]);
  })
);

app.get(
  "/api/module4/conversations/:conversationId/messages",
  asyncHandler(async (req, res) => {
    const conversationId = req.params.conversationId;

    const result = await pool.query(
      `SELECT m.id, m.conversation_id, m.sender_id, u.username AS sender_username,
              m.content_type, m.text_content, m.attachment_meta, m.parent_id,
              m.created_at
       FROM module4.messages m
       LEFT JOIN public.users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT 500`,
      [conversationId]
    );

    res.json(result.rows);
  })
);

app.post(
  "/api/module4/conversations/:conversationId/messages",
  asyncHandler(async (req, res) => {
    const conversationId = req.params.conversationId;
    const {
      senderId,
      contentType = "text",
      textContent,
      attachmentMeta,
      parentId,
    } = req.body;

    requireFields({ senderId, contentType });

    if (contentType === "text" && !textContent) {
      return res.status(400).json({
        error: "textContent is required for text messages",
      });
    }

    if (contentType !== "text" && !attachmentMeta) {
      return res.status(400).json({
        error: "attachmentMeta is required for non-text messages",
      });
    }

    const participantResult = await pool.query(
      `SELECT 1
       FROM module4.participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, senderId]
    );

    if (!participantResult.rows[0]) {
      return res.status(403).json({
        error: "sender is not a participant of this conversation",
      });
    }

    const result = await pool.query(
      `INSERT INTO module4.messages (
         conversation_id, sender_id, content_type, text_content,
         attachment_meta, parent_id
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, conversation_id, sender_id, content_type,
                 text_content, attachment_meta, parent_id, created_at`,
      [
        conversationId,
        senderId,
        contentType,
        textContent || null,
        attachmentMeta || null,
        parentId || null,
      ]
    );

    const message = result.rows[0];

    const senderResult = await pool.query(
      `SELECT id, username, email FROM public.users WHERE id = $1`,
      [senderId]
    );

    const payload = {
      ...message,
      sender: senderResult.rows[0] || null,
    };

    io.to(`conversation:${conversationId}`).emit(
      "module4:message:created",
      payload
    );
    io.to(`conversation:${conversationId}`).emit("module4:notification", {
      conversationId,
      title: senderResult.rows[0]?.username || "Nouveau message",
      body: message.text_content || "Pièce jointe reçue",
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(payload);
  })
);

app.post(
  "/api/module4/conversations/:conversationId/calls",
  asyncHandler(async (req, res) => {
    const conversationId = req.params.conversationId;
    const { creatorId, type, roomName, status = "ongoing", endedAt } = req.body;

    requireFields({ creatorId, type, roomName });

    if (!["audio_call", "video_call"].includes(type)) {
      return res.status(400).json({
        error: "type must be audio_call or video_call",
      });
    }

    if (!["missed", "completed", "rejected", "ongoing"].includes(status)) {
      return res.status(400).json({
        error: "Invalid call status",
      });
    }

    const result = await pool.query(
      `INSERT INTO module4.call_logs (
         conversation_id, creator_id, type, status, room_name, ended_at
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, conversation_id, creator_id, type, status, started_at,
                 ended_at`,
      [conversationId, creatorId, type, status, roomName, endedAt || null]
    );

    const call = result.rows[0];

    io.to(`conversation:${conversationId}`).emit("module4:call:created", call);

    res.status(201).json(call);
  })
);

app.patch(
  "/api/module4/calls/:callId/status",
  asyncHandler(async (req, res) => {
    const { status, endedAt } = req.body;

    requireFields({ status });

    if (!["missed", "completed", "rejected", "ongoing"].includes(status)) {
      return res.status(400).json({
        error: "Invalid call status",
      });
    }

    const values = [status, req.params.callId];
    let endedAtUpdate = "";

    if (endedAt !== undefined) {
      endedAtUpdate = ", ended_at = $2";
      values.splice(1, 0, endedAt);
    }

    const result = await pool.query(
      `UPDATE module4.call_logs
       SET status = $1${endedAtUpdate}
       WHERE id = $${values.length}
       RETURNING id, conversation_id, creator_id, type, status, started_at, ended_at`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "call log not found" });
    }

    const call = result.rows[0];
    io.to(`conversation:${call.conversation_id}`).emit("module4:call:updated", call);

    res.json(call);
  })
);

io.on("connection", (socket) => {
  socket.emit("connected", {
    message: "Connected to Communium realtime API",
  });

  socket.on("join:user", ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  socket.on("leave:user", ({ userId }) => {
    if (userId) {
      socket.leave(`user:${userId}`);
    }
  });

  socket.on("join:conversation", ({ conversationId }) => {
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on("leave:conversation", ({ conversationId }) => {
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
    }
  });

  socket.on("module4:typing:start", ({ conversationId, userId, username }) => {
    if (conversationId && userId) {
      socket.to(`conversation:${conversationId}`).emit("module4:typing:start", {
        conversationId,
        userId,
        username,
      });
    }
  });

  socket.on("module4:typing:stop", ({ conversationId, userId }) => {
    if (conversationId && userId) {
      socket.to(`conversation:${conversationId}`).emit("module4:typing:stop", {
        conversationId,
        userId,
      });
    }
  });

  socket.on("module4:message:read", ({ conversationId, userId, messageId }) => {
    if (conversationId && userId) {
      socket.to(`conversation:${conversationId}`).emit("module4:message:read", {
        conversationId,
        userId,
        messageId,
        readAt: new Date().toISOString(),
      });
    }
  });

  socket.on("module4:notification", ({ conversationId, title, body }) => {
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit("module4:notification", {
        conversationId,
        title,
        body,
        createdAt: new Date().toISOString(),
      });
    }
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
  try {
    const result = await client.query(
      `SELECT id, code, display_name, provider_type, is_active
       FROM module2.payment_providers
       WHERE UPPER(code) = UPPER($1) AND is_active = TRUE`,
      [code]
    );

    return result.rows[0];
  } catch (error) {
    if (error?.code === "42P01") {
      return null;
    }
    throw error;
  }
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

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeUuid(value) {
  return isUuid(value) ? value : null;
}

function normalizeEventPrivacy(value) {
  if (value === "private") {
    return "members_only";
  }

  return ["public", "members_only", "invite_only"].includes(value) ? value : "public";
}

function normalizeEventCurrency(value) {
  return ["MAD", "TKS"].includes(value) ? value : "MAD";
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
