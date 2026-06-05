const crypto = require("crypto");
const express = require("express");
const {
  asyncHandler,
  cleanString,
  decryptPrivateField,
  encryptPrivateField,
  ensureProfileSchema,
  ensureUser,
  ensureVerificationAdmin,
  httpError,
  normalizeAccountType,
  parseJsonObject,
  query,
  sanitizeEmail,
  toIso,
} = require("./profileModule");

const VAT_RATE = 20;
const PLAN_DEFINITIONS = {
  free: {
    plan: "FREE",
    label: "Base professionnelle",
    amountTTC: 0,
    visibility: "essential",
  },
  silver: {
    plan: "SILVER",
    label: "Visibilité initiale",
    amountTTC: 100,
    visibility: "initial",
  },
  gold: {
    plan: "GOLD",
    label: "Diffusion renforcée",
    amountTTC: 250,
    visibility: "reinforced",
  },
  platinum: {
    plan: "PLATINUM",
    label: "Présence prioritaire",
    amountTTC: 500,
    visibility: "priority",
  },
};
const PAYMENT_PROVIDERS = new Set(["CMI", "STRIPE", "PAYPAL", "APPLE_PAY", "GOOGLE_PAY"]);

const PARTNER_TYPES = ["UNIVERSITY", "SCHOOL", "OFPPT", "BUSINESS_DIRECTORY", "COMPANY", "INCUBATOR"];
const REPORT_TARGETS = ["PROFILE", "PUBLICATION"];
const REPORT_STATUSES = ["OPEN", "REVIEWING", "RESOLVED", "REJECTED"];
const PAYMENT_STATUSES = ["INITIATED", "PENDING", "PAID", "FAILED", "CANCELLED"];
const DEFAULT_RETENTION_POLICIES = [
  {
    dataType: "AUTH_LOGS",
    retentionDays: 365,
    description: "Conservation des journaux de sécurité et de connexion.",
  },
  {
    dataType: "KYC_KYB_DOCUMENTS",
    retentionDays: 1095,
    description: "Conservation des pièces de vérification pour conformité et audit.",
  },
  {
    dataType: "BILLING_INVOICES",
    retentionDays: 3650,
    description: "Conservation des factures et pièces de paiement en MAD.",
  },
  {
    dataType: "CONSENT_LOGS",
    retentionDays: 1825,
    description: "Historique des consentements et versions légales acceptées.",
  },
];
const SAMPLE_PARTNERS = [
  { name: "Al Akhawayn", type: "UNIVERSITY", city: "Ifrane", website: "https://www.aui.ma", description: "Université marocaine partenaire." },
  { name: "UM6P", type: "UNIVERSITY", city: "Benguerir", website: "https://www.um6p.ma", description: "Réseau innovation et recherche." },
  { name: "INSEA", type: "SCHOOL", city: "Rabat", website: "https://www.insea.ac.ma", description: "École d’ingénierie et data." },
  { name: "EMSI", type: "SCHOOL", city: "Casablanca", website: "https://www.emsi.ma", description: "École marocaine d’ingénierie." },
  { name: "ENSA", type: "SCHOOL", city: "Fès", website: "https://www.ensa.usmba.ac.ma", description: "Écoles nationales des sciences appliquées." },
  { name: "ENCG", type: "SCHOOL", city: "Settat", website: "https://www.encg-settat.ma", description: "École nationale de commerce et gestion." },
  { name: "OFPPT", type: "OFPPT", city: "Casablanca", website: "https://www.ofppt.ma", description: "Formation professionnelle et employabilité." },
];

let governanceSchemaPromise;
const rateLimitStore = new Map();

function getClientIp(req) {
  const forwarded = Array.isArray(req.headers["x-forwarded-for"])
    ? req.headers["x-forwarded-for"][0]
    : req.headers["x-forwarded-for"];
  return cleanString(forwarded) || cleanString(req.ip) || "unknown-ip";
}

function getUserAgent(req) {
  return cleanString(req.headers["user-agent"]) || "unknown-agent";
}

function enforceRateLimit(req, scope, { windowMs = 10 * 60 * 1000, maxAttempts = 8 } = {}) {
  const key = `${scope}:${getClientIp(req)}`;
  const now = Date.now();
  const recent = (rateLimitStore.get(key) || []).filter((stamp) => now - stamp < windowMs);

  if (recent.length >= maxAttempts) {
    throw httpError(429, "Trop de tentatives sur cette action. Réessayez plus tard.");
  }

  recent.push(now);
  rateLimitStore.set(key, recent);
}

function toPositiveInt(value, fallback = 0) {
  const raw = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function normalizeEnum(rawValue, allowedValues, fallback = null) {
  const cleaned = cleanString(rawValue);
  if (!cleaned) {
    return fallback;
  }

  const normalized = cleaned.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function enforceLength(label, value, max) {
  if (value && value.length > max) {
    throw httpError(400, `${label}: longueur maximale ${max} caractères`);
  }
}

function sanitizeWebsite(value) {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }

  try {
    const url = new URL(cleaned.startsWith("http") ? cleaned : `https://${cleaned}`);
    return url.toString();
  } catch {
    throw httpError(400, "Site web invalide");
  }
}

function sanitizeDigits(label, value, { exactLength, maxLength = exactLength } = {}) {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.replace(/\s+/g, "");
  if (!/^\d+$/.test(normalized)) {
    throw httpError(400, `${label} invalide`);
  }

  if (exactLength && normalized.length !== exactLength) {
    throw httpError(400, `${label}: ${exactLength} chiffres requis`);
  }

  if (maxLength && normalized.length > maxLength) {
    throw httpError(400, `${label}: longueur maximale ${maxLength} chiffres`);
  }

  return normalized;
}

function sanitizeTextIdentifier(label, value, { min = 2, max = 120, required = false } = {}) {
  const cleaned = cleanString(value);
  if (!cleaned) {
    if (required) {
      throw httpError(400, `${label} obligatoire`);
    }
    return null;
  }

  if (cleaned.length < min) {
    throw httpError(400, `${label}: minimum ${min} caractères`);
  }

  if (cleaned.length > max) {
    throw httpError(400, `${label}: maximum ${max} caractères`);
  }

  return cleaned;
}

function sanitizeBusinessProfilePayload(body = {}) {
  const payload = {
    companyName: sanitizeTextIdentifier("Nom d'entreprise", body.companyName, { min: 2, max: 180, required: true }),
    rc: sanitizeTextIdentifier("RC", body.rc, { min: 2, max: 80, required: true }),
    ice: sanitizeDigits("ICE", body.ice, { exactLength: 15 }),
    ifNumber: sanitizeTextIdentifier("IF", body.ifNumber || body.if, { min: 2, max: 80, required: true }),
    cnss: sanitizeTextIdentifier("CNSS", body.cnss, { min: 2, max: 80, required: false }),
    patente: sanitizeTextIdentifier("Patente", body.patente, { min: 2, max: 80, required: false }),
    legalAddress: sanitizeTextIdentifier("Adresse légale", body.legalAddress, { min: 8, max: 240, required: true }),
    sector: sanitizeTextIdentifier("Secteur", body.sector, { min: 2, max: 120, required: true }),
    companySize: sanitizeTextIdentifier("Taille entreprise", body.companySize, { min: 2, max: 80, required: false }),
    website: sanitizeWebsite(body.website),
  };

  if (!payload.ice) {
    throw httpError(400, "ICE obligatoire");
  }

  return payload;
}

function sanitizePartnerPayload(body = {}) {
  const type = normalizeEnum(body.type, PARTNER_TYPES);
  if (!type) {
    throw httpError(400, "Type de partenaire invalide");
  }

  return {
    name: sanitizeTextIdentifier("Nom", body.name, { min: 2, max: 160, required: true }),
    type,
    city: sanitizeTextIdentifier("Ville", body.city, { min: 2, max: 120, required: true }),
    website: sanitizeWebsite(body.website),
    logoUrl: sanitizeWebsite(body.logoUrl),
    description: sanitizeTextIdentifier("Description", body.description, { min: 8, max: 600, required: true }),
    active: body.active === undefined ? true : Boolean(body.active),
  };
}

function sanitizeReportPayload(body = {}) {
  const targetType = normalizeEnum(body.targetType, REPORT_TARGETS);
  if (!targetType) {
    throw httpError(400, "Type de signalement invalide");
  }

  return {
    targetType,
    targetId: sanitizeTextIdentifier("Cible", body.targetId, { min: 1, max: 140, required: true }),
    reason: sanitizeTextIdentifier("Raison", body.reason, { min: 4, max: 160, required: true }),
    details: sanitizeTextIdentifier("Détail", body.details, { min: 4, max: 800, required: false }),
  };
}

function sanitizeDataRequestPayload(body = {}, requestType) {
  const details = {
    reason: sanitizeTextIdentifier("Raison", body.reason, { min: 4, max: 600, required: false }),
    requestedFields: Array.isArray(body.requestedFields)
      ? body.requestedFields.map((entry) => sanitizeTextIdentifier("Champ", entry, { min: 2, max: 80 })).filter(Boolean)
      : [],
    payload: parseJsonObject(body.payload, body.payload && typeof body.payload === "object" ? body.payload : {}),
  };

  return {
    requestType,
    details,
  };
}

function sanitizePlan(plan) {
  const normalized = cleanString(plan)?.toLowerCase();
  const definition = normalized ? PLAN_DEFINITIONS[normalized] : null;
  if (!definition) {
    throw httpError(400, "Plan d'abonnement invalide");
  }

  return { key: normalized, ...definition };
}

function sanitizePaymentProvider(provider) {
  const normalized = cleanString(provider).toUpperCase();
  if (!PAYMENT_PROVIDERS.has(normalized)) {
    throw httpError(400, "Mode de paiement invalide");
  }
  return normalized;
}

function computePlanAmounts(planDefinition) {
  const amountTTC = Number(planDefinition.amountTTC || 0);
  if (amountTTC === 0) {
    return {
      amountHT: 0,
      vatRate: VAT_RATE,
      vatAmount: 0,
      amountTTC: 0,
    };
  }

  const amountHT = Number((amountTTC / (1 + VAT_RATE / 100)).toFixed(2));
  const vatAmount = Number((amountTTC - amountHT).toFixed(2));
  return {
    amountHT,
    vatRate: VAT_RATE,
    vatAmount,
    amountTTC,
  };
}

function isDemoCheckoutAllowed() {
  return process.env.PAYMENT_DEMO_CHECKOUT === "true" || process.env.NODE_ENV !== "production";
}

function buildCheckoutReturnUrl(req, path, params = {}) {
  const locale = cleanString(req.body?.locale) || cleanString(req.query?.locale) || "fr";
  const configuredFrontendUrl =
    cleanString(process.env.FRONTEND_URL) ||
    cleanString(process.env.NEXT_PUBLIC_APP_URL) ||
    `${req.protocol}://${req.get("host")}`;
  const url = new URL(`/${locale}${path}`, configuredFrontendUrl.endsWith("/") ? configuredFrontendUrl : `${configuredFrontendUrl}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function profileTierFromPlan(plan) {
  return plan === "FREE" ? "Free" : plan.charAt(0) + plan.slice(1).toLowerCase();
}

function buildInvoiceNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `CMN-${stamp}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function hashBackupCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function base32Encode(buffer) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = String(value || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let current = 0;
  const bytes = [];

  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      continue;
    }

    current = (current << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((current >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function hotp(secretBase32, counter) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secretBase32)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

function verifyTotp(secretBase32, code, drift = 1) {
  const normalized = String(code || "").replace(/\D/g, "");
  if (normalized.length !== 6) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 30000);
  for (let offset = -drift; offset <= drift; offset += 1) {
    if (hotp(secretBase32, currentCounter + offset) === normalized) {
      return true;
    }
  }

  return false;
}

function generateBackupCodes() {
  return Array.from({ length: 8 }, () => crypto.randomBytes(3).toString("hex").toUpperCase());
}

async function ensureGovernanceSchema() {
  if (!governanceSchemaPromise) {
    governanceSchemaPromise = (async () => {
      await ensureProfileSchema();

      await query(`
        CREATE TABLE IF NOT EXISTS consent_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          consent_type VARCHAR(80) NOT NULL,
          accepted BOOLEAN NOT NULL DEFAULT FALSE,
          version VARCHAR(40) NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS data_access_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          accessed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
          field_name VARCHAR(120) NOT NULL,
          reason TEXT,
          ip_address TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS data_retention_policies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          data_type VARCHAR(120) NOT NULL UNIQUE,
          retention_days INTEGER NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS data_rights_requests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          request_type VARCHAR(40) NOT NULL,
          status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
          details JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS business_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          company_name TEXT NOT NULL,
          rc TEXT NOT NULL,
          ice TEXT NOT NULL,
          if_number TEXT NOT NULL,
          cnss TEXT,
          patente TEXT,
          legal_address TEXT NOT NULL,
          sector TEXT NOT NULL,
          company_size TEXT,
          website TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          plan VARCHAR(20) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
          started_at TIMESTAMP,
          expires_at TIMESTAMP,
          renews_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
          provider VARCHAR(20) NOT NULL,
          amount_ht NUMERIC(12, 2) NOT NULL DEFAULT 0,
          vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 20,
          vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          amount_ttc NUMERIC(12, 2) NOT NULL DEFAULT 0,
          currency VARCHAR(8) NOT NULL DEFAULT 'MAD',
          status VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
          transaction_id TEXT,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payment_verification_codes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          purpose VARCHAR(40) NOT NULL DEFAULT 'payment_checkout',
          code_hash TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          consumed_at TIMESTAMP,
          attempts INTEGER NOT NULL DEFAULT 0,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
          invoice_number VARCHAR(60) NOT NULL UNIQUE,
          ice TEXT,
          if_number TEXT,
          company_name TEXT,
          amount_ht NUMERIC(12, 2) NOT NULL DEFAULT 0,
          vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          amount_ttc NUMERIC(12, 2) NOT NULL DEFAULT 0,
          legal_mentions TEXT,
          pdf_url TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS security_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
          event_type VARCHAR(120) NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_security_settings (
          user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          totp_secret TEXT,
          totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          backup_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
          last_verified_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS partners (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          type VARCHAR(40) NOT NULL,
          city TEXT NOT NULL,
          website TEXT,
          logo_url TEXT,
          description TEXT NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS moderation_reports (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          reporter_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          target_type VARCHAR(40) NOT NULL,
          target_id VARCHAR(140) NOT NULL,
          reason TEXT NOT NULL,
          details TEXT,
          status VARCHAR(40) NOT NULL DEFAULT 'OPEN',
          resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
          resolved_at TIMESTAMP,
          resolution_note TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON data_access_logs(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_data_rights_requests_user_id ON data_rights_requests(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_payment_verification_codes_user ON payment_verification_codes(user_id, email, purpose, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_invoices_user_created_at ON invoices(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_security_logs_user_event ON security_logs(user_id, event_type, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_partners_active_type ON partners(active, type, created_at DESC);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_identity_unique ON partners(name, type, city);
        CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status, created_at DESC);
      `);

      for (const policy of DEFAULT_RETENTION_POLICIES) {
        await query(
          `
            INSERT INTO data_retention_policies (data_type, retention_days, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (data_type)
            DO UPDATE SET retention_days = EXCLUDED.retention_days, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP
          `,
          [policy.dataType, policy.retentionDays, policy.description]
        );
      }

      for (const partner of SAMPLE_PARTNERS) {
        await query(
          `
            INSERT INTO partners (name, type, city, website, description, active)
            VALUES ($1, $2, $3, $4, $5, TRUE)
            ON CONFLICT (name, type, city) DO NOTHING
          `,
          [partner.name, partner.type, partner.city, partner.website, partner.description]
        );
      }
    })().catch((error) => {
      governanceSchemaPromise = undefined;
      throw error;
    });
  }

  return governanceSchemaPromise;
}

async function governanceQuery(sql, params = []) {
  await ensureGovernanceSchema();
  return query(sql, params);
}

async function logSecurityEvent(userId, eventType, req, metadata = {}) {
  await governanceQuery(
    `
      INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, metadata)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [userId || null, eventType, getClientIp(req), getUserAgent(req), JSON.stringify(metadata || {})]
  );
}

function generatePaymentVerificationCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function normalizePaymentVerificationCode(value) {
  const code = String(value || "").replace(/\D/g, "");
  if (code.length !== 6) {
    throw httpError(400, "Code de verification paiement invalide");
  }
  return code;
}

function hashPaymentVerificationCode(userId, email, code) {
  const secret = process.env.PAYMENT_CODE_SECRET || process.env.JWT_SECRET || "communium-payment-code-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${String(email || "").toLowerCase()}:${code}`)
    .digest("hex");
}

async function sendPaymentVerificationEmail({ email, code, planLabel, amountTTC }) {
  if (!process.env.RESEND_API_KEY || !process.env.VERIFICATION_FROM_EMAIL) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.VERIFICATION_FROM_EMAIL,
      to: [email],
      subject: "Code de verification paiement Communium",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h2>Code de verification paiement</h2>
          <p>Votre code pour confirmer le paiement ${planLabel || "Communium"} est :</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:8px">${code}</p>
          <p>Montant: ${Number(amountTTC || 0).toLocaleString("fr-FR")} MAD. Ce code expire dans 10 minutes.</p>
          <p>Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.</p>
        </div>
      `,
      text: `Votre code de verification paiement Communium est ${code}. Il expire dans 10 minutes.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw httpError(502, body || "Impossible d'envoyer le code de paiement");
  }

  return true;
}

async function sendPaymentVerificationCode(req, res) {
  enforceRateLimit(req, "payment-code-send", { windowMs: 10 * 60 * 1000, maxAttempts: 5 });
  const user = await ensureUser(req);
  const planDefinition = sanitizePlan(req.body?.plan || "gold");
  const provider = req.body?.provider ? sanitizePaymentProvider(req.body.provider) : null;
  const email = sanitizeEmail(req.body?.email || user.email);

  if (!email) {
    throw httpError(400, "Ajoutez une adresse e-mail avant de recevoir le code");
  }

  const code = generatePaymentVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const metadata = {
    plan: planDefinition.plan,
    provider,
    billingCycle: cleanString(req.body?.billingCycle) || "monthly",
    seats: toPositiveInt(req.body?.seats, 1),
  };

  await governanceQuery(
    `
      INSERT INTO payment_verification_codes (user_id, email, purpose, code_hash, expires_at, metadata)
      VALUES ($1, $2, 'payment_checkout', $3, $4, $5::jsonb)
    `,
    [
      user.id,
      email,
      hashPaymentVerificationCode(user.id, email, code),
      expiresAt.toISOString(),
      JSON.stringify(metadata),
    ]
  );

  const emailSent = await sendPaymentVerificationEmail({
    email,
    code,
    planLabel: planDefinition.label,
    amountTTC: planDefinition.amountTTC,
  });

  if (!emailSent && process.env.NODE_ENV === "production") {
    throw httpError(503, "Service d'envoi e-mail indisponible pour le code de paiement");
  }

  await logSecurityEvent(user.id, "payment_verification_code_sent", req, {
    email,
    plan: planDefinition.plan,
    provider,
    emailSent,
  });

  return res.json({
    success: true,
    data: {
      email,
      expiresAt: expiresAt.toISOString(),
      emailSent,
      devCode: emailSent || process.env.NODE_ENV === "production" ? undefined : code,
    },
  });
}

async function verifyPaymentCheckoutCode({ user, email, code }) {
  const billingEmail = sanitizeEmail(email || user.email);
  if (!billingEmail) {
    throw httpError(400, "Adresse e-mail de facturation obligatoire");
  }

  const normalizedCode = normalizePaymentVerificationCode(code);
  const result = await governanceQuery(
    `
      SELECT *
      FROM payment_verification_codes
      WHERE user_id = $1
        AND email = $2
        AND purpose = 'payment_checkout'
        AND consumed_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [user.id, billingEmail]
  );

  const record = result.rows[0];
  if (!record) {
    throw httpError(400, "Aucun code de paiement valide. Renvoyez un code puis reessayez.");
  }

  if (Number(record.attempts || 0) >= 5) {
    throw httpError(429, "Trop de tentatives pour ce code. Renvoyez un nouveau code.");
  }

  await governanceQuery("UPDATE payment_verification_codes SET attempts = attempts + 1 WHERE id = $1", [record.id]);

  const expected = Buffer.from(record.code_hash, "hex");
  const received = Buffer.from(hashPaymentVerificationCode(user.id, billingEmail, normalizedCode), "hex");
  const valid = expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!valid) {
    throw httpError(400, "Code de verification paiement incorrect");
  }

  await governanceQuery("UPDATE payment_verification_codes SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1", [record.id]);
  return billingEmail;
}

async function logSensitiveFieldAccess(userId, accessedBy, fieldName, reason, req) {
  await governanceQuery(
    `
      INSERT INTO data_access_logs (user_id, accessed_by, field_name, reason, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [userId, accessedBy || null, fieldName, reason || null, getClientIp(req)]
  );
}

async function recordConsent(userId, req, consentType, accepted, version = "2026-05") {
  await governanceQuery(
    `
      INSERT INTO consent_logs (user_id, consent_type, accepted, version, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [userId, consentType, Boolean(accepted), version, getClientIp(req), getUserAgent(req)]
  );
}

async function ensureAdmin(req) {
  const user = await ensureVerificationAdmin(req);

  if (String(process.env.ADMIN_2FA_REQUIRED || "").toLowerCase() === "true") {
    const result = await governanceQuery(
      "SELECT totp_enabled FROM user_security_settings WHERE user_id = $1 LIMIT 1",
      [user.id]
    );

    if (!result.rows[0]?.totp_enabled) {
      throw httpError(403, "La double authentification admin doit etre activee.");
    }
  }

  return user;
}

async function getBusinessProfileByUserId(userId) {
  const result = await governanceQuery(
    "SELECT * FROM business_profiles WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return result.rows[0] || null;
}

async function upsertBusinessProfile(user, req, payload) {
  const encryptedRc = encryptPrivateField(payload.rc);
  const encryptedIce = encryptPrivateField(payload.ice);
  const encryptedIf = encryptPrivateField(payload.ifNumber);
  const encryptedCnss = encryptPrivateField(payload.cnss);
  const encryptedPatente = encryptPrivateField(payload.patente);
  const encryptedAddress = encryptPrivateField(payload.legalAddress);

  const result = await governanceQuery(
    `
      INSERT INTO business_profiles (
        user_id, company_name, rc, ice, if_number, cnss, patente, legal_address, sector, company_size, website
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id)
      DO UPDATE SET
        company_name = EXCLUDED.company_name,
        rc = EXCLUDED.rc,
        ice = EXCLUDED.ice,
        if_number = EXCLUDED.if_number,
        cnss = EXCLUDED.cnss,
        patente = EXCLUDED.patente,
        legal_address = EXCLUDED.legal_address,
        sector = EXCLUDED.sector,
        company_size = EXCLUDED.company_size,
        website = EXCLUDED.website,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
    [
      user.id,
      payload.companyName,
      encryptedRc,
      encryptedIce,
      encryptedIf,
      encryptedCnss,
      encryptedPatente,
      encryptedAddress,
      payload.sector,
      payload.companySize,
      payload.website,
    ]
  );

  await governanceQuery(
    "UPDATE users SET account_type = 'BUSINESS'::account_type, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [user.id]
  );
  await recordConsent(user.id, req, "business_profile_v1", true);
  await logSecurityEvent(user.id, "business_profile_updated", req, {
    sector: payload.sector,
    hasWebsite: Boolean(payload.website),
  });

  return result.rows[0];
}

function mapBusinessProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    rc: decryptPrivateField(row.rc),
    ice: decryptPrivateField(row.ice),
    ifNumber: decryptPrivateField(row.if_number),
    cnss: decryptPrivateField(row.cnss),
    patente: decryptPrivateField(row.patente),
    legalAddress: decryptPrivateField(row.legal_address),
    sector: row.sector,
    companySize: row.company_size,
    website: row.website,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function buildInvoiceLegalMentions(user, businessProfile) {
  const subject = businessProfile?.companyName || user.username || user.email;
  return `Facture Communium en MAD. TVA marocaine ${VAT_RATE}%. Entite facturee: ${subject}.`;
}

async function createOrRefreshBillingRecords({ user, req, planDefinition, businessProfile }) {
  const amounts = computePlanAmounts(planDefinition);
  const subscriptionResult = await governanceQuery(
    `
      INSERT INTO subscriptions (user_id, plan, status)
      VALUES ($1, $2, 'PENDING')
      RETURNING *
    `,
    [user.id, planDefinition.plan]
  );
  const subscription = subscriptionResult.rows[0];

  const paymentResult = await governanceQuery(
    `
      INSERT INTO payments (
        user_id, subscription_id, provider, amount_ht, vat_rate, vat_amount, amount_ttc, currency, status, metadata
      )
      VALUES ($1, $2, 'CMI', $3, $4, $5, $6, 'MAD', 'INITIATED', $7::jsonb)
      RETURNING *
    `,
    [
      user.id,
      subscription.id,
      amounts.amountHT,
      amounts.vatRate,
      amounts.vatAmount,
      amounts.amountTTC,
      JSON.stringify({
        plan: planDefinition.plan,
        visibility: planDefinition.visibility,
      }),
    ]
  );
  const payment = paymentResult.rows[0];

  const invoiceResult = await governanceQuery(
    `
      INSERT INTO invoices (
        user_id, payment_id, invoice_number, ice, if_number, company_name, amount_ht, vat_amount, amount_ttc, legal_mentions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      user.id,
      payment.id,
      buildInvoiceNumber(),
      businessProfile ? decryptPrivateField(businessProfile.ice) : null,
      businessProfile ? decryptPrivateField(businessProfile.if_number) : null,
      businessProfile?.company_name || null,
      amounts.amountHT,
      amounts.vatAmount,
      amounts.amountTTC,
      buildInvoiceLegalMentions(user, mapBusinessProfile(businessProfile)),
    ]
  );

  await logSecurityEvent(user.id, "subscription_checkout_initialized", req, {
    plan: planDefinition.plan,
    paymentId: payment.id,
  });

  return {
    subscription: subscriptionResult.rows[0],
    payment: paymentResult.rows[0],
    invoice: invoiceResult.rows[0],
    amounts,
  };
}

function buildCmiSignature(paymentId, transactionId, status) {
  const secret = process.env.CMI_SECRET_KEY || process.env.CMI_API_KEY || "";
  if (!secret) {
    return null;
  }

  return crypto.createHmac("sha256", secret).update(`${paymentId}:${transactionId}:${status}`).digest("hex");
}

function mapSubscription(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    status: row.status,
    startedAt: toIso(row.started_at),
    expiresAt: toIso(row.expires_at),
    renewsAt: toIso(row.renews_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapPayment(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    subscriptionId: row.subscription_id,
    provider: row.provider,
    amountHT: Number(row.amount_ht || 0),
    vatRate: Number(row.vat_rate || 0),
    vatAmount: Number(row.vat_amount || 0),
    amountTTC: Number(row.amount_ttc || 0),
    currency: row.currency,
    status: row.status,
    transactionId: row.transaction_id,
    metadata: parseJsonObject(row.metadata, {}),
    invoiceUrl: row.invoice_url || row.pdf_url || null,
    invoiceNumber: row.invoice_number || null,
    createdAt: toIso(row.created_at),
  };
}

function mapInvoice(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    paymentId: row.payment_id,
    invoiceNumber: row.invoice_number,
    ice: row.ice,
    ifNumber: row.if_number,
    companyName: row.company_name,
    amountHT: Number(row.amount_ht || 0),
    vatAmount: Number(row.vat_amount || 0),
    amountTTC: Number(row.amount_ttc || 0),
    legalMentions: row.legal_mentions,
    pdfUrl: row.pdf_url,
    createdAt: toIso(row.created_at),
  };
}

function mapPartner(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    city: row.city,
    website: row.website,
    logoUrl: row.logo_url,
    description: row.description,
    active: row.active,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapSecurityLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: parseJsonObject(row.metadata, {}),
    createdAt: toIso(row.created_at),
  };
}

function mapModerationReport(row) {
  return {
    id: row.id,
    reporterUserId: row.reporter_user_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    resolvedBy: row.resolved_by,
    resolvedAt: toIso(row.resolved_at),
    resolutionNote: row.resolution_note,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function getDataRightsDashboard(req, res) {
  const user = await ensureUser(req);
  const [profileResult, businessResult, consentsResult, accessLogsResult, requestsResult] = await Promise.all([
    governanceQuery("SELECT email, phone, address, country, city, identity_document_number FROM profiles WHERE user_id = $1 LIMIT 1", [user.id]),
    governanceQuery("SELECT company_name, rc, ice, if_number, legal_address FROM business_profiles WHERE user_id = $1 LIMIT 1", [user.id]),
    governanceQuery("SELECT * FROM consent_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [user.id]),
    governanceQuery("SELECT * FROM data_access_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [user.id]),
    governanceQuery("SELECT * FROM data_rights_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [user.id]),
  ]);

  const profile = profileResult.rows[0] || {};
  const business = businessResult.rows[0] || {};

  return res.json({
    success: true,
    data: {
      sensitiveFields: {
        email: sanitizeEmail(profile.email) || user.email || null,
        phone: decryptPrivateField(profile.phone),
        address: decryptPrivateField(profile.address),
        city: profile.city || null,
        country: profile.country || null,
        identityDocument: decryptPrivateField(profile.identity_document_number),
        companyName: business.company_name || null,
        rc: decryptPrivateField(business.rc),
        ice: decryptPrivateField(business.ice),
        ifNumber: decryptPrivateField(business.if_number),
        legalAddress: decryptPrivateField(business.legal_address),
      },
      consents: consentsResult.rows.map((row) => ({
        id: row.id,
        consentType: row.consent_type,
        accepted: row.accepted,
        version: row.version,
        createdAt: toIso(row.created_at),
      })),
      accessLogs: accessLogsResult.rows.map((row) => ({
        id: row.id,
        fieldName: row.field_name,
        reason: row.reason,
        createdAt: toIso(row.created_at),
      })),
      requests: requestsResult.rows.map((row) => ({
        id: row.id,
        requestType: row.request_type,
        status: row.status,
        details: parseJsonObject(row.details, {}),
        createdAt: toIso(row.created_at),
      })),
    },
  });
}

async function exportUserData(req, res) {
  enforceRateLimit(req, "export-data", { windowMs: 15 * 60 * 1000, maxAttempts: 3 });
  const user = await ensureUser(req);

  const [userResult, profileResult, verificationResult, businessResult, consentResult, requestResult, subscriptionResult, paymentResult, invoiceResult] =
    await Promise.all([
      governanceQuery("SELECT id, username, email, role, account_type, created_at, updated_at FROM users WHERE id = $1", [user.id]),
      governanceQuery("SELECT * FROM profiles WHERE user_id = $1 LIMIT 1", [user.id]),
      governanceQuery("SELECT id, type, status, rejection_reason, submitted_at, reviewed_at FROM verifications WHERE user_id = $1 LIMIT 1", [user.id]),
      governanceQuery("SELECT * FROM business_profiles WHERE user_id = $1 LIMIT 1", [user.id]),
      governanceQuery("SELECT * FROM consent_logs WHERE user_id = $1 ORDER BY created_at DESC", [user.id]),
      governanceQuery("SELECT * FROM data_rights_requests WHERE user_id = $1 ORDER BY created_at DESC", [user.id]),
      governanceQuery("SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC", [user.id]),
      governanceQuery("SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC", [user.id]),
      governanceQuery("SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC", [user.id]),
    ]);

  const profile = profileResult.rows[0] || {};
  const business = businessResult.rows[0] || {};

  await Promise.all([
    logSensitiveFieldAccess(user.id, user.id, "email", "data_export", req),
    logSensitiveFieldAccess(user.id, user.id, "phone", "data_export", req),
    logSensitiveFieldAccess(user.id, user.id, "address", "data_export", req),
    logSensitiveFieldAccess(user.id, user.id, "identity_document_number", "data_export", req),
  ]);
  await logSecurityEvent(user.id, "user_data_exported", req, {});

  return res.json({
    success: true,
    data: {
      exportedAt: new Date().toISOString(),
      user: userResult.rows[0] || null,
      profile: {
        ...profile,
        phone: decryptPrivateField(profile.phone),
        address: decryptPrivateField(profile.address),
        identity_document_number: decryptPrivateField(profile.identity_document_number),
      },
      verification: verificationResult.rows[0] || null,
      businessProfile: mapBusinessProfile(business),
      consents: consentResult.rows,
      rightsRequests: requestResult.rows,
      subscriptions: subscriptionResult.rows.map(mapSubscription),
      payments: paymentResult.rows.map(mapPayment),
      invoices: invoiceResult.rows.map(mapInvoice),
    },
  });
}

async function createDeleteRequest(req, res) {
  enforceRateLimit(req, "delete-request", { windowMs: 60 * 60 * 1000, maxAttempts: 3 });
  const user = await ensureUser(req);
  const payload = sanitizeDataRequestPayload(req.body, "DELETE_ACCOUNT");
  const result = await governanceQuery(
    `
      INSERT INTO data_rights_requests (user_id, request_type, status, details)
      VALUES ($1, $2, 'PENDING', $3::jsonb)
      RETURNING *
    `,
    [user.id, payload.requestType, JSON.stringify(payload.details)]
  );
  await logSecurityEvent(user.id, "delete_account_request_created", req, {});
  return res.status(201).json({ success: true, data: result.rows[0] });
}

async function createRectificationRequest(req, res) {
  enforceRateLimit(req, "rectification-request", { windowMs: 60 * 60 * 1000, maxAttempts: 6 });
  const user = await ensureUser(req);
  const payload = sanitizeDataRequestPayload(req.body, "RECTIFICATION");
  const result = await governanceQuery(
    `
      INSERT INTO data_rights_requests (user_id, request_type, status, details)
      VALUES ($1, $2, 'PENDING', $3::jsonb)
      RETURNING *
    `,
    [user.id, payload.requestType, JSON.stringify(payload.details)]
  );
  await logSecurityEvent(user.id, "rectification_request_created", req, {
    fields: payload.details.requestedFields,
  });
  return res.status(201).json({ success: true, data: result.rows[0] });
}

async function createConsentLog(req, res) {
  const user = await ensureUser(req);
  const consentType = sanitizeTextIdentifier("Consentement", req.body?.consentType, { min: 3, max: 80, required: true });
  const version = sanitizeTextIdentifier("Version", req.body?.version, { min: 1, max: 40, required: true });
  const accepted = Boolean(req.body?.accepted);

  await recordConsent(user.id, req, consentType, accepted, version);
  return res.status(201).json({ success: true });
}

async function getBusinessProfile(req, res) {
  const user = await ensureUser(req);
  const row = await getBusinessProfileByUserId(user.id);
  if (row) {
    await Promise.all([
      logSensitiveFieldAccess(user.id, user.id, "business_profile", "business_profile_view", req),
      logSecurityEvent(user.id, "business_profile_viewed", req, {}),
    ]);
  }
  return res.json({
    success: true,
    data: mapBusinessProfile(row),
  });
}

async function putBusinessProfile(req, res) {
  const user = await ensureUser(req);
  const payload = sanitizeBusinessProfilePayload(req.body);
  const row = await upsertBusinessProfile(user, req, payload);
  return res.json({
    success: true,
    data: mapBusinessProfile(row),
  });
}

async function getBillingSubscription(req, res) {
  const user = await ensureUser(req);
  const [subscriptionResult, paymentResult, businessResult] = await Promise.all([
    governanceQuery("SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [user.id]),
    governanceQuery("SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8", [user.id]),
    governanceQuery("SELECT * FROM business_profiles WHERE user_id = $1 LIMIT 1", [user.id]),
  ]);

  return res.json({
    success: true,
    data: {
      currentSubscription: mapSubscription(subscriptionResult.rows[0]),
      recentPayments: paymentResult.rows.map(mapPayment),
      businessProfile: mapBusinessProfile(businessResult.rows[0]),
      plans: Object.entries(PLAN_DEFINITIONS).map(([key, value]) => ({
        id: key,
        plan: value.plan,
        label: value.label,
        ...computePlanAmounts(value),
      })),
    },
  });
}

async function getBillingInvoices(req, res) {
  const user = await ensureUser(req);
  const result = await governanceQuery(
    "SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    [user.id]
  );
  return res.json({ success: true, data: result.rows.map(mapInvoice) });
}

function listPlanDefinitions() {
  return Object.entries(PLAN_DEFINITIONS).map(([key, value]) => ({
    id: key,
    plan: value.plan,
    label: value.label,
    visibility: value.visibility,
    currency: "MAD",
    ...computePlanAmounts(value),
  }));
}

async function getSubscriptions(req, res) {
  const user = await ensureUser(req);
  const [subscriptionResult, paymentResult] = await Promise.all([
    governanceQuery("SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [user.id]),
    governanceQuery(
      `
        SELECT p.*, i.pdf_url AS invoice_url, i.invoice_number
        FROM payments p
        LEFT JOIN invoices i ON i.payment_id = p.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT 8
      `,
      [user.id]
    ),
  ]);

  return res.json({
    success: true,
    data: {
      currentSubscription: mapSubscription(subscriptionResult.rows[0]),
      recentPayments: paymentResult.rows.map(mapPayment),
      plans: listPlanDefinitions(),
    },
  });
}

async function selectSubscription(req, res) {
  enforceRateLimit(req, "subscription-select", { windowMs: 10 * 60 * 1000, maxAttempts: 20 });
  const user = await ensureUser(req);
  const planDefinition = sanitizePlan(req.body?.plan);
  const now = new Date();
  const renewsAt = planDefinition.key === "free" ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const status = planDefinition.key === "free" ? "ACTIVE" : "PENDING";

  const subscriptionResult = await governanceQuery(
    `
      INSERT INTO subscriptions (user_id, plan, status, started_at, renews_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $5)
      RETURNING *
    `,
    [user.id, planDefinition.plan, status, now.toISOString(), renewsAt ? renewsAt.toISOString() : null]
  );

  await query("UPDATE profiles SET membership_tier = $2::membership_tier, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [
    user.id,
    profileTierFromPlan(planDefinition.plan),
  ]);

  await logSecurityEvent(user.id, "subscription_selected", req, {
    plan: planDefinition.plan,
    subscriptionId: subscriptionResult.rows[0].id,
  });

  return res.json({
    success: true,
    data: {
      currentSubscription: mapSubscription(subscriptionResult.rows[0]),
      plans: listPlanDefinitions(),
    },
  });
}

async function activateCheckoutRecords({ user, req, records, planDefinition, paymentStatus, transactionId, metadata }) {
  const now = new Date();
  const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [subscriptionResult, paymentResult] = await Promise.all([
    governanceQuery(
      `
        UPDATE subscriptions
        SET status = 'ACTIVE',
            started_at = COALESCE(started_at, $2),
            renews_at = $3,
            expires_at = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [records.subscription.id, now.toISOString(), renewsAt.toISOString()]
    ),
    governanceQuery(
      `
        UPDATE payments
        SET status = $2,
            transaction_id = $3,
            metadata = metadata || $4::jsonb
        WHERE id = $1
        RETURNING *
      `,
      [records.payment.id, paymentStatus, transactionId, JSON.stringify(metadata || {})]
    ),
  ]);

  await query("UPDATE profiles SET membership_tier = $2::membership_tier, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [
    user.id,
    profileTierFromPlan(planDefinition.plan),
  ]);

  await logSecurityEvent(user.id, "subscription_checkout_activated", req, {
    plan: planDefinition.plan,
    paymentId: records.payment.id,
    subscriptionId: records.subscription.id,
    transactionId,
    paymentStatus,
  });

  return {
    subscription: subscriptionResult.rows[0],
    payment: paymentResult.rows[0],
  };
}

async function createPayment(req, res) {
  enforceRateLimit(req, "payment-create", { windowMs: 10 * 60 * 1000, maxAttempts: 10 });
  const user = await ensureUser(req);
  const planDefinition = sanitizePlan(req.body?.plan);
  const provider = sanitizePaymentProvider(req.body?.provider);

  if (planDefinition.key === "free") {
    req.body.plan = "free";
    return selectSubscription(req, res);
  }

  const billingEmail = await verifyPaymentCheckoutCode({
    user,
    email: req.body?.billingEmail || req.body?.email,
    code: req.body?.verificationCode,
  });
  const businessProfile = await getBusinessProfileByUserId(user.id);
  const records = await createOrRefreshBillingRecords({ user, req, planDefinition, businessProfile });
  const providerConfig = {
    CMI: Boolean(process.env.CMI_MERCHANT_ID && (process.env.CMI_SECRET_KEY || process.env.CMI_API_KEY)),
    STRIPE: Boolean(process.env.STRIPE_SECRET_KEY),
    PAYPAL: false,
    APPLE_PAY: Boolean(process.env.STRIPE_SECRET_KEY),
    GOOGLE_PAY: Boolean(process.env.STRIPE_SECRET_KEY),
  };
  const configured = Boolean(providerConfig[provider]);
  const currency = "MAD";
  const metadata = {
    plan: planDefinition.plan,
    provider,
    configured,
    billingEmail,
    createdBy: "premium_saas_checkout",
  };

  await governanceQuery(
    `
      UPDATE payments
      SET provider = $2,
          currency = $3,
          metadata = metadata || $4::jsonb
      WHERE id = $1
    `,
    [records.payment.id, provider, currency, JSON.stringify(metadata)]
  );

  await logSecurityEvent(user.id, "payment_created", req, {
    plan: planDefinition.plan,
    provider,
    paymentId: records.payment.id,
    configured,
  });

  if (configured && ["STRIPE", "APPLE_PAY", "GOOGLE_PAY"].includes(provider)) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: billingEmail || sanitizeEmail(user.email) || undefined,
      client_reference_id: String(user.id),
      line_items: [
        {
          price_data: {
            currency: "mad",
            product_data: {
              name: `Communium ${planDefinition.plan}`,
              description: planDefinition.label,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: Math.round(records.amounts.amountTTC * 100),
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: String(user.id),
          plan: planDefinition.plan,
          paymentId: String(records.payment.id),
        },
      },
      success_url: buildCheckoutReturnUrl(req, "/checkout/success", {
        plan: planDefinition.key,
        payment: "success",
        provider,
        paymentId: records.payment.id,
      }),
      cancel_url: buildCheckoutReturnUrl(req, "/checkout", {
        plan: planDefinition.key,
        payment: "cancelled",
      }),
      metadata: {
        userId: String(user.id),
        plan: planDefinition.plan,
        paymentId: String(records.payment.id),
        provider,
      },
    });

    await governanceQuery(
      `
        UPDATE payments
        SET status = 'PENDING',
            transaction_id = $2,
            metadata = metadata || $3::jsonb
        WHERE id = $1
      `,
      [
        records.payment.id,
        session.id,
        JSON.stringify({
          stripeSessionId: session.id,
          stripeMode: "hosted_checkout",
        }),
      ]
    );

    return res.json({
      success: true,
      data: {
        configured: true,
        provider,
        paymentId: records.payment.id,
        subscriptionId: records.subscription.id,
        invoiceId: records.invoice.id,
        redirectUrl: session.url,
        status: "READY",
        message: "Redirection vers Stripe prete.",
        amountTTC: records.amounts.amountTTC,
        currency,
      },
    });
  }

  const cmiRedirectUrl =
    configured && provider === "CMI"
      ? `${process.env.CMI_GATEWAY_URL || "https://cmigw.asseco.com.tr/PaymentGateway/Hosting/Default"}?reference=${records.payment.id}`
      : null;

  if (!configured && isDemoCheckoutAllowed()) {
    const transactionId = `DEMO-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    await activateCheckoutRecords({
      user,
      req,
      records,
      planDefinition,
      paymentStatus: "PAID",
      transactionId,
      metadata: {
        demoCheckout: true,
        reason: "gateway_not_configured_in_development",
      },
    });

    return res.json({
      success: true,
      data: {
        configured: false,
        demoCheckout: true,
        provider,
        paymentId: records.payment.id,
        subscriptionId: records.subscription.id,
        invoiceId: records.invoice.id,
        redirectUrl: buildCheckoutReturnUrl(req, "/checkout/success", {
          plan: planDefinition.key,
          payment: "demo",
          provider,
          paymentId: records.payment.id,
        }),
        status: "DEMO_APPROVED",
        message: "Mode test local active : aucun encaissement reel n'a ete effectue.",
        amountTTC: records.amounts.amountTTC,
        currency,
      },
    });
  }

  return res.status(configured ? 200 : 202).json({
    success: true,
    data: {
      configured,
      provider,
      paymentId: records.payment.id,
      subscriptionId: records.subscription.id,
      invoiceId: records.invoice.id,
      redirectUrl: cmiRedirectUrl,
      status: configured ? "READY" : "PENDING_CONFIGURATION",
      message: configured
        ? "Paiement pret pour redirection securisee."
        : "Ajoutez les cles Stripe ou CMI dans .env.local avant un encaissement reel.",
      amountTTC: records.amounts.amountTTC,
      currency,
    },
  });
}

async function verifyPayment(req, res) {
  enforceRateLimit(req, "payment-verify", { windowMs: 10 * 60 * 1000, maxAttempts: 20 });
  const user = await ensureUser(req);
  const paymentId = sanitizeTextIdentifier("Paiement", req.body?.paymentId || req.query?.paymentId, {
    min: 8,
    max: 80,
    required: true,
  });
  const result = await governanceQuery("SELECT * FROM payments WHERE id::text = $1 AND user_id = $2 LIMIT 1", [paymentId, user.id]);
  if (result.rowCount === 0) {
    throw httpError(404, "Paiement introuvable");
  }

  const payment = result.rows[0];
  await logSecurityEvent(user.id, "payment_verified", req, {
    paymentId: payment.id,
    status: payment.status,
  });

  return res.json({ success: true, data: mapPayment(payment) });
}

async function getPaymentHistory(req, res) {
  const user = await ensureUser(req);
  const result = await governanceQuery(
    `
      SELECT p.*, i.pdf_url AS invoice_url, i.invoice_number
      FROM payments p
      LEFT JOIN invoices i ON i.payment_id = p.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 50
    `,
    [user.id]
  );
  return res.json({ success: true, data: result.rows.map(mapPayment) });
}

function emptyAnalyticsSeries() {
  const labels = ["S1", "S2", "S3", "S4", "S5", "S6"];
  return labels.map((label, index) => ({
    label,
    weekStart: null,
    views: 0,
    reach: 0,
    engagement: 0,
  }));
}

async function buildAnalyticsSeries(userId) {
  const labels = ["S1", "S2", "S3", "S4", "S5", "S6"];
  const currentWeekStart = new Date();
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() - ((currentWeekStart.getDay() + 6) % 7));
  const weeks = labels.map((label, index) => {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - (labels.length - 1 - index) * 7);
    start.setHours(0, 0, 0, 0);
    return {
      label,
      weekStart: start.toISOString().slice(0, 10),
      views: 0,
      reach: 0,
      engagement: 0,
    };
  });
  const byWeek = new Map(weeks.map((item) => [item.weekStart, item]));

  try {
    const result = await query(
      `
        SELECT week_start, COALESCE(SUM(total), 0)::integer AS engagement
        FROM (
          SELECT date_trunc('week', pl.created_at)::date AS week_start, COUNT(*)::integer AS total
          FROM post_likes pl
          JOIN profile_posts pp ON pp.id = pl.post_id
          WHERE pp.user_id = $1
          GROUP BY 1
          UNION ALL
          SELECT date_trunc('week', pc.created_at)::date AS week_start, COUNT(*)::integer AS total
          FROM post_comments pc
          JOIN profile_posts pp ON pp.id = pc.post_id
          WHERE pp.user_id = $1
          GROUP BY 1
          UNION ALL
          SELECT date_trunc('week', ps.created_at)::date AS week_start, COUNT(*)::integer AS total
          FROM post_shares ps
          JOIN profile_posts pp ON pp.id = ps.post_id
          WHERE pp.user_id = $1
          GROUP BY 1
          UNION ALL
          SELECT date_trunc('week', psv.created_at)::date AS week_start, COUNT(*)::integer AS total
          FROM post_saves psv
          JOIN profile_posts pp ON pp.id = psv.post_id
          WHERE pp.user_id = $1
          GROUP BY 1
        ) weekly_interactions
        GROUP BY week_start
      `,
      [userId]
    );

    for (const row of result.rows) {
      const key = new Date(row.week_start).toISOString().slice(0, 10);
      const target = byWeek.get(key);
      if (target) {
        target.engagement = Number(row.engagement || 0);
        target.reach = target.engagement;
      }
    }
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }
  }

  return weeks;
}

async function getProfileAnalytics(req, res) {
  const user = await ensureUser(req);
  const [profileResult, postsResult, connectionResult, series] = await Promise.all([
    query("SELECT profile_views_count, connections_count FROM profiles WHERE user_id = $1 LIMIT 1", [user.id]),
    query(
      `
        SELECT COUNT(*)::integer AS posts,
               COALESCE(SUM(total), 0)::integer AS engagement
        FROM (
          SELECT COUNT(*)::integer AS total FROM post_likes pl JOIN profile_posts pp ON pp.id = pl.post_id WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total FROM post_comments pc JOIN profile_posts pp ON pp.id = pc.post_id WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total FROM post_shares ps JOIN profile_posts pp ON pp.id = ps.post_id WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total FROM post_saves psv JOIN profile_posts pp ON pp.id = psv.post_id WHERE pp.user_id = $1
        ) real_engagement
      `,
      [user.id]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [{ posts: 0, engagement: 0 }] };
      }
      throw error;
    }),
    query(
      `
        SELECT COUNT(*)::integer AS connections
        FROM connections
        WHERE status = 'accepted'
          AND (requester_id = $1 OR receiver_id = $1)
      `,
      [user.id]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [{ connections: 0 }] };
      }
      throw error;
    }),
    buildAnalyticsSeries(user.id),
  ]);
  const profile = profileResult.rows[0] || {};
  const posts = postsResult.rows[0] || {};
  const connections = connectionResult.rows[0] || {};
  const views = Number(profile.profile_views_count || 0);
  const engagement = Number(posts.engagement || 0);

  return res.json({
    success: true,
    data: {
      profile: {
        views,
        reach: views + engagement,
        growth: 0,
        visitors: views,
        connections: Number(connections.connections || 0),
      },
      series,
    },
  });
}

async function getPremiumAnalytics(req, res) {
  const user = await ensureUser(req);
  const [subscriptionResult, profileAnalyticsResult] = await Promise.all([
    governanceQuery("SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [user.id]),
    query(
      `
        SELECT COALESCE(SUM(total), 0)::integer AS engagement
        FROM (
          SELECT COUNT(*)::integer AS total FROM post_likes pl JOIN profile_posts pp ON pp.id = pl.post_id WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total FROM post_comments pc JOIN profile_posts pp ON pp.id = pc.post_id WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total FROM post_shares ps JOIN profile_posts pp ON pp.id = ps.post_id WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total FROM post_saves psv JOIN profile_posts pp ON pp.id = psv.post_id WHERE pp.user_id = $1
        ) real_engagement
      `,
      [user.id]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [{ engagement: 0 }] };
      }
      throw error;
    }),
  ]);
  const plan = String(subscriptionResult.rows[0]?.plan || "FREE").toUpperCase();
  const isPremium = ["SILVER", "GOLD", "PLATINUM"].includes(plan);
  const engagement = Number(profileAnalyticsResult.rows[0]?.engagement || 0);
  const series = await buildAnalyticsSeries(user.id).catch(() => emptyAnalyticsSeries());

  return res.json({
    success: true,
    data: {
      premium: {
        visibilityScore: isPremium ? Math.min(100, engagement) : 0,
        postPerformance: Math.min(100, engagement),
        clickThrough: 0,
        opportunityIndex: 0,
      },
      series,
    },
  });
}

async function initCmiPayment(req, res) {
  enforceRateLimit(req, "cmi-init", { windowMs: 10 * 60 * 1000, maxAttempts: 10 });
  const user = await ensureUser(req);
  const planDefinition = sanitizePlan(req.body?.plan);
  const businessProfile = await getBusinessProfileByUserId(user.id);

  if (normalizeAccountType(user.accountType) === "BUSINESS" && !businessProfile) {
    throw httpError(400, "Le profil business doit etre complete avant la facturation.");
  }

  const records = await createOrRefreshBillingRecords({ user, req, planDefinition, businessProfile });
  const signature = buildCmiSignature(records.payment.id, records.payment.id, "INITIATED");
  const callbackUrl =
    process.env.CMI_CALLBACK_URL ||
    `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/cmi/callback`;
  const gatewayUrl =
    process.env.CMI_GATEWAY_URL || "https://cmigw.asseco.com.tr/PaymentGateway/Hosting/Default";
  const isConfigured = Boolean(process.env.CMI_MERCHANT_ID && (process.env.CMI_SECRET_KEY || process.env.CMI_API_KEY));

  return res.status(isConfigured ? 200 : 202).json({
    success: true,
    data: {
      provider: "CMI",
      configured: isConfigured,
      paymentId: records.payment.id,
      subscriptionId: records.subscription.id,
      invoiceId: records.invoice.id,
      signature,
      callbackUrl,
      gatewayUrl,
      redirectUrl: isConfigured ? `${gatewayUrl}?reference=${records.payment.id}` : null,
      manualActivation: !isConfigured,
      amountHT: records.amounts.amountHT,
      vatRate: records.amounts.vatRate,
      vatAmount: records.amounts.vatAmount,
      amountTTC: records.amounts.amountTTC,
      currency: "MAD",
      invoice: mapInvoice(records.invoice),
      message: isConfigured
        ? "Le paiement CMI est pret a etre redirige vers la passerelle."
        : "Le flux CMI est prepare mais les identifiants bancaires de production restent a connecter.",
    },
  });
}

async function handleCmiCallback(req, res) {
  enforceRateLimit(req, "cmi-callback", { windowMs: 10 * 60 * 1000, maxAttempts: 25 });
  await ensureGovernanceSchema();

  const paymentId = sanitizeTextIdentifier("Paiement", req.body?.paymentId || req.query?.paymentId, {
    min: 8,
    max: 64,
    required: true,
  });
  const transactionId = sanitizeTextIdentifier("Transaction", req.body?.transactionId || req.query?.transactionId, {
    min: 3,
    max: 140,
    required: true,
  });
  const rawStatus = normalizeEnum(req.body?.status || req.query?.status, PAYMENT_STATUSES, "PENDING");
  const signature = cleanString(req.body?.signature || req.query?.signature);
  const expectedSignature = buildCmiSignature(paymentId, transactionId, rawStatus);

  if (expectedSignature && signature !== expectedSignature) {
    throw httpError(400, "Signature CMI invalide");
  }

  const paymentResult = await governanceQuery("SELECT * FROM payments WHERE id::text = $1 LIMIT 1", [paymentId]);
  if (paymentResult.rowCount === 0) {
    throw httpError(404, "Paiement introuvable");
  }

  const payment = paymentResult.rows[0];
  const nextStatus = rawStatus === "PAID" ? "PAID" : rawStatus === "FAILED" ? "FAILED" : rawStatus === "CANCELLED" ? "CANCELLED" : "PENDING";
  await governanceQuery(
    `
      UPDATE payments
      SET status = $2, transaction_id = $3, metadata = metadata || $4::jsonb
      WHERE id = $1
    `,
    [payment.id, nextStatus, transactionId, JSON.stringify({ callbackReceivedAt: new Date().toISOString() })]
  );

  if (payment.subscription_id) {
    if (nextStatus === "PAID") {
      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      await governanceQuery(
        `
          UPDATE subscriptions
          SET status = 'ACTIVE',
              started_at = $2,
              renews_at = $3,
              expires_at = $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [payment.subscription_id, startedAt.toISOString(), expiresAt.toISOString()]
      );
    } else if (["FAILED", "CANCELLED"].includes(nextStatus)) {
      await governanceQuery(
        "UPDATE subscriptions SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [payment.subscription_id, nextStatus === "FAILED" ? "PENDING" : "CANCELLED"]
      );
    }
  }

  await governanceQuery(
    `
      UPDATE invoices
      SET pdf_url = COALESCE(pdf_url, $2)
      WHERE payment_id = $1
    `,
    [payment.id, `/billing/invoices/${payment.id}`]
  );

  await logSecurityEvent(payment.user_id, "cmi_callback_received", req, {
    paymentId: payment.id,
    status: nextStatus,
    transactionId,
  });

  return res.json({ success: true, status: nextStatus });
}

async function getSecurityLogs(req, res) {
  const user = await ensureUser(req);
  const limit = Math.min(100, Math.max(10, toPositiveInt(req.query?.limit, 40)));
  const filterUserId = toPositiveInt(req.query?.userId, 0);
  const eventType = cleanString(req.query?.eventType);

  let viewer = user;
  let logsResult;

  try {
    viewer = await ensureAdmin(req);
  } catch {
    viewer = user;
  }

  if (viewer.id === user.id && filterUserId && filterUserId !== user.id) {
    throw httpError(403, "Acces refuse aux journaux d'un autre compte");
  }

  const canViewAll = viewer.id !== user.id || await (async () => {
    try {
      await ensureAdmin(req);
      return true;
    } catch {
      return false;
    }
  })();

  if (canViewAll) {
    logsResult = await governanceQuery(
      `
        SELECT * FROM security_logs
        WHERE ($1::bigint = 0 OR user_id = $1)
          AND ($2::text IS NULL OR event_type = $2)
        ORDER BY created_at DESC
        LIMIT $3
      `,
      [filterUserId, eventType || null, limit]
    );
  } else {
    logsResult = await governanceQuery(
      `
        SELECT * FROM security_logs
        WHERE user_id = $1
          AND ($2::text IS NULL OR event_type = $2)
        ORDER BY created_at DESC
        LIMIT $3
      `,
      [user.id, eventType || null, limit]
    );
  }

  return res.json({ success: true, data: logsResult.rows.map(mapSecurityLog) });
}

async function setupTwoFactor(req, res) {
  const user = await ensureUser(req);
  const secret = base32Encode(crypto.randomBytes(20));
  const backupCodes = generateBackupCodes();

  await governanceQuery(
    `
      INSERT INTO user_security_settings (user_id, totp_secret, totp_enabled, backup_codes, updated_at)
      VALUES ($1, $2, FALSE, $3::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        totp_secret = EXCLUDED.totp_secret,
        totp_enabled = FALSE,
        backup_codes = EXCLUDED.backup_codes,
        updated_at = CURRENT_TIMESTAMP
    `,
    [user.id, encryptPrivateField(secret), JSON.stringify(backupCodes.map(hashBackupCode))]
  );

  await logSecurityEvent(user.id, "two_factor_setup_started", req, {});

  return res.json({
    success: true,
    data: {
      secret,
      otpauthUrl: `otpauth://totp/Communium:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Communium`,
      backupCodes,
    },
  });
}

async function verifyTwoFactor(req, res) {
  const user = await ensureUser(req);
  const code = sanitizeTextIdentifier("Code 2FA", req.body?.code, { min: 6, max: 20, required: true });
  const result = await governanceQuery(
    "SELECT * FROM user_security_settings WHERE user_id = $1 LIMIT 1",
    [user.id]
  );

  if (result.rowCount === 0) {
    throw httpError(400, "Aucune configuration 2FA en attente");
  }

  const row = result.rows[0];
  const secret = decryptPrivateField(row.totp_secret);
  if (!secret || !verifyTotp(secret, code)) {
    throw httpError(400, "Code de verification invalide");
  }

  await governanceQuery(
    `
      UPDATE user_security_settings
      SET totp_enabled = TRUE, last_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
    [user.id]
  );

  await logSecurityEvent(user.id, "two_factor_enabled", req, {});
  return res.json({ success: true });
}

async function disableTwoFactor(req, res) {
  const user = await ensureUser(req);
  const code = sanitizeTextIdentifier("Code 2FA", req.body?.code, { min: 6, max: 40, required: true });
  const result = await governanceQuery(
    "SELECT * FROM user_security_settings WHERE user_id = $1 LIMIT 1",
    [user.id]
  );

  if (result.rowCount === 0) {
    throw httpError(400, "Aucune double authentification a desactiver");
  }

  const row = result.rows[0];
  const secret = decryptPrivateField(row.totp_secret);
  const codeHash = hashBackupCode(code.toUpperCase());
  const backupCodes = Array.isArray(row.backup_codes) ? row.backup_codes : parseJsonObject(row.backup_codes, []);
  const backupIndex = backupCodes.findIndex((hash) => hash === codeHash);
  const isValidTotp = secret ? verifyTotp(secret, code) : false;

  if (!isValidTotp && backupIndex === -1) {
    throw httpError(400, "Code de desactivation invalide");
  }

  const nextBackupCodes = backupIndex === -1 ? backupCodes : backupCodes.filter((_, index) => index !== backupIndex);
  await governanceQuery(
    `
      UPDATE user_security_settings
      SET totp_enabled = FALSE,
          totp_secret = NULL,
          backup_codes = $2::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
    [user.id, JSON.stringify(nextBackupCodes)]
  );

  await logSecurityEvent(user.id, "two_factor_disabled", req, {
    usedBackupCode: backupIndex !== -1,
  });
  return res.json({ success: true });
}

async function listPartners(req, res) {
  await ensureGovernanceSchema();
  const showAll = String(req.query?.all || "").toLowerCase() === "true";
  if (showAll) {
    await ensureAdmin(req);
  }
  const result = await governanceQuery(
    showAll
      ? "SELECT * FROM partners ORDER BY active DESC, created_at DESC"
      : "SELECT * FROM partners WHERE active = TRUE ORDER BY created_at DESC",
    []
  );
  return res.json({ success: true, data: result.rows.map(mapPartner) });
}

async function createPartner(req, res) {
  const admin = await ensureAdmin(req);
  const payload = sanitizePartnerPayload(req.body);
  const result = await governanceQuery(
    `
      INSERT INTO partners (name, type, city, website, logo_url, description, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [payload.name, payload.type, payload.city, payload.website, payload.logoUrl, payload.description, payload.active]
  );
  await logSecurityEvent(admin.id, "partner_created", req, { partnerId: result.rows[0].id });
  return res.status(201).json({ success: true, data: mapPartner(result.rows[0]) });
}

async function updatePartner(req, res) {
  const admin = await ensureAdmin(req);
  const partnerId = sanitizeTextIdentifier("Partenaire", req.params.id, { min: 8, max: 64, required: true });
  const payload = sanitizePartnerPayload(req.body);
  const result = await governanceQuery(
    `
      UPDATE partners
      SET name = $2,
          type = $3,
          city = $4,
          website = $5,
          logo_url = $6,
          description = $7,
          active = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $1
      RETURNING *
    `,
    [partnerId, payload.name, payload.type, payload.city, payload.website, payload.logoUrl, payload.description, payload.active]
  );
  if (result.rowCount === 0) {
    throw httpError(404, "Partenaire introuvable");
  }
  await logSecurityEvent(admin.id, "partner_updated", req, { partnerId });
  return res.json({ success: true, data: mapPartner(result.rows[0]) });
}

async function deletePartner(req, res) {
  const admin = await ensureAdmin(req);
  const partnerId = sanitizeTextIdentifier("Partenaire", req.params.id, { min: 8, max: 64, required: true });
  const result = await governanceQuery("DELETE FROM partners WHERE id::text = $1 RETURNING id", [partnerId]);
  if (result.rowCount === 0) {
    throw httpError(404, "Partenaire introuvable");
  }
  await logSecurityEvent(admin.id, "partner_deleted", req, { partnerId });
  return res.json({ success: true });
}

async function createModerationReport(req, res) {
  enforceRateLimit(req, "report-content", { windowMs: 20 * 60 * 1000, maxAttempts: 10 });
  const user = await ensureUser(req);
  const payload = sanitizeReportPayload(req.body);
  const result = await governanceQuery(
    `
      INSERT INTO moderation_reports (reporter_user_id, target_type, target_id, reason, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [user.id, payload.targetType, payload.targetId, payload.reason, payload.details]
  );
  await logSecurityEvent(user.id, "moderation_report_created", req, {
    targetType: payload.targetType,
    targetId: payload.targetId,
  });
  return res.status(201).json({ success: true, data: mapModerationReport(result.rows[0]) });
}

async function listModerationReports(req, res) {
  const admin = await ensureAdmin(req);
  const status = normalizeEnum(req.query?.status, REPORT_STATUSES, null);
  const result = await governanceQuery(
    `
      SELECT * FROM moderation_reports
      WHERE ($1::text IS NULL OR status = $1)
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [status]
  );
  await logSecurityEvent(admin.id, "moderation_reports_viewed", req, { status });
  return res.json({ success: true, data: result.rows.map(mapModerationReport) });
}

async function getModerationReport(req, res) {
  const admin = await ensureAdmin(req);
  const reportId = sanitizeTextIdentifier("Signalement", req.params.id, { min: 8, max: 64, required: true });
  const result = await governanceQuery("SELECT * FROM moderation_reports WHERE id::text = $1 LIMIT 1", [reportId]);
  if (result.rowCount === 0) {
    throw httpError(404, "Signalement introuvable");
  }
  await logSecurityEvent(admin.id, "moderation_report_viewed", req, { reportId });
  return res.json({ success: true, data: mapModerationReport(result.rows[0]) });
}

async function resolveModerationReport(req, res) {
  const admin = await ensureAdmin(req);
  const reportId = sanitizeTextIdentifier("Signalement", req.params.id, { min: 8, max: 64, required: true });
  const resolutionStatus = normalizeEnum(req.body?.status, ["RESOLVED", "REJECTED"], "RESOLVED");
  const resolutionNote = sanitizeTextIdentifier("Note", req.body?.resolutionNote, { min: 4, max: 600, required: false });

  const result = await governanceQuery(
    `
      UPDATE moderation_reports
      SET status = $2,
          resolved_by = $3,
          resolved_at = CURRENT_TIMESTAMP,
          resolution_note = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $1
      RETURNING *
    `,
    [reportId, resolutionStatus, admin.id, resolutionNote]
  );
  if (result.rowCount === 0) {
    throw httpError(404, "Signalement introuvable");
  }

  await logSecurityEvent(admin.id, "moderation_report_resolved", req, {
    reportId,
    status: resolutionStatus,
  });
  return res.json({ success: true, data: mapModerationReport(result.rows[0]) });
}

function createUserGovernanceRouter() {
  const router = express.Router();
  router.get("/export-data", asyncHandler(exportUserData));
  router.get("/data-rights", asyncHandler(getDataRightsDashboard));
  router.post("/delete-request", asyncHandler(createDeleteRequest));
  router.post("/rectification-request", asyncHandler(createRectificationRequest));
  router.post("/consents", asyncHandler(createConsentLog));
  return router;
}

function createBusinessRouter() {
  const router = express.Router();
  router.get("/profile", asyncHandler(getBusinessProfile));
  router.put("/profile", asyncHandler(putBusinessProfile));
  return router;
}

function createBillingRouter() {
  const router = express.Router();
  router.get("/subscription", asyncHandler(getBillingSubscription));
  router.get("/invoices", asyncHandler(getBillingInvoices));
  return router;
}

function createPaymentsRouter() {
  const router = express.Router();
  router.post("/verification-code", asyncHandler(sendPaymentVerificationCode));
  router.post("/verification-code/resend", asyncHandler(sendPaymentVerificationCode));
  router.post("/create", asyncHandler(createPayment));
  router.post("/verify", asyncHandler(verifyPayment));
  router.get("/history", asyncHandler(getPaymentHistory));
  router.post("/cmi/init", asyncHandler(initCmiPayment));
  router.post("/cmi/callback", asyncHandler(handleCmiCallback));
  return router;
}

function createSubscriptionsRouter() {
  const router = express.Router();
  router.get("/", asyncHandler(getSubscriptions));
  router.get("/me", asyncHandler(getSubscriptions));
  router.post("/select", asyncHandler(selectSubscription));
  router.post("/checkout", asyncHandler(createPayment));
  return router;
}

function createAnalyticsRouter() {
  const router = express.Router();
  router.get("/profile", asyncHandler(getProfileAnalytics));
  router.get("/premium", asyncHandler(getPremiumAnalytics));
  return router;
}

function createSecurityRouter() {
  const router = express.Router();
  router.get("/logs", asyncHandler(getSecurityLogs));
  router.post("/2fa/setup", asyncHandler(setupTwoFactor));
  router.post("/2fa/verify", asyncHandler(verifyTwoFactor));
  router.post("/2fa/disable", asyncHandler(disableTwoFactor));
  return router;
}

function createPartnerRouter() {
  const router = express.Router();
  router.get("/", asyncHandler(listPartners));
  return router;
}

function createAdminPartnerRouter() {
  const router = express.Router();
  router.post("/", asyncHandler(createPartner));
  router.put("/:id", asyncHandler(updatePartner));
  router.delete("/:id", asyncHandler(deletePartner));
  return router;
}

function createReportRouter() {
  const router = express.Router();
  router.post("/", asyncHandler(createModerationReport));
  return router;
}

function createAdminReportRouter() {
  const router = express.Router();
  router.get("/", asyncHandler(listModerationReports));
  router.get("/:id", asyncHandler(getModerationReport));
  router.post("/:id/resolve", asyncHandler(resolveModerationReport));
  return router;
}

module.exports = {
  createAdminPartnerRouter,
  createAdminReportRouter,
  createBillingRouter,
  createBusinessRouter,
  createAnalyticsRouter,
  createPartnerRouter,
  createPaymentsRouter,
  createReportRouter,
  createSecurityRouter,
  createSubscriptionsRouter,
  createUserGovernanceRouter,
  ensureGovernanceSchema,
};
