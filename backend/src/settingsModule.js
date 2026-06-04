const express = require("express");
const {
  asyncHandler,
  cleanString,
  ensureProfileSchema,
  ensureUser,
  parseJsonObject,
  query,
  sanitizeEmail,
  sanitizePhone,
  toIso,
} = require("./profileModule");

const privacyLevels = new Set(["Public", "Private", "ContactsOnly"]);

const defaultNotifications = {
  emailMessages: true,
  emailNetwork: true,
  emailPublications: false,
  emailOpportunities: true,
  emailSystem: true,
  pushMessages: true,
  pushInvitations: true,
  pushComments: true,
  pushVerification: true,
  weeklyDigest: false,
};

const defaultMessageSettings = {
  theme: "system",
  disappearingMessages: "off",
  archivedMuted: true,
  sound: true,
  enterToSend: true,
  readReceipts: true,
  blockedUsers: [],
};

const defaultSecuritySettings = {
  loginAlerts: true,
  sessionNotifications: true,
  trustedDevicesOnly: false,
};

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function normalizeText(value, maxLength = 180) {
  const text = cleanString(value);
  return text ? text.slice(0, maxLength) : null;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

function normalizePrivacyLevel(value, fallback = "Private") {
  const text = cleanString(value);
  return privacyLevels.has(text) ? text : fallback;
}

function mergeBooleanSettings(defaults, patch = {}) {
  const next = { ...defaults };

  for (const key of Object.keys(defaults)) {
    if (patch[key] !== undefined) {
      next[key] = normalizeBoolean(patch[key]);
    }
  }

  return next;
}

function mergeMessageSettings(current, patch = {}) {
  const next = { ...defaultMessageSettings, ...current };

  if (patch.theme !== undefined) {
    const theme = cleanString(patch.theme).toLowerCase();
    next.theme = ["system", "light", "dark", "blue", "green"].includes(theme) ? theme : next.theme;
  }

  if (patch.disappearingMessages !== undefined) {
    const mode = cleanString(patch.disappearingMessages).toLowerCase();
    next.disappearingMessages = ["off", "24h", "7d", "once"].includes(mode) ? mode : next.disappearingMessages;
  }

  for (const key of ["archivedMuted", "sound", "enterToSend", "readReceipts"]) {
    if (patch[key] !== undefined) {
      next[key] = normalizeBoolean(patch[key]);
    }
  }

  return next;
}

async function ensureSettingsSchema() {
  await ensureProfileSchema();
  await query(`
    CREATE TABLE IF NOT EXISTS user_setting_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      language VARCHAR(12) NOT NULL DEFAULT 'fr',
      region VARCHAR(120) NOT NULL DEFAULT 'Maroc',
      timezone VARCHAR(120) NOT NULL DEFAULT 'Africa/Casablanca',
      notifications JSONB NOT NULL DEFAULT '{"emailMessages":true,"emailNetwork":true,"emailPublications":false,"emailOpportunities":true,"emailSystem":true,"pushMessages":true,"pushInvitations":true,"pushComments":true,"pushVerification":true,"weeklyDigest":false}'::jsonb,
      messages JSONB NOT NULL DEFAULT '{"theme":"system","disappearingMessages":"off","archivedMuted":true,"sound":true,"enterToSend":true,"readReceipts":true,"blockedUsers":[]}'::jsonb,
      security JSONB NOT NULL DEFAULT '{"loginAlerts":true,"sessionNotifications":true,"trustedDevicesOnly":false}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_user_setting_preferences_user ON user_setting_preferences(user_id);
  `);
}

async function getPreferences(userId) {
  await ensureSettingsSchema();
  await query("INSERT INTO user_setting_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
  const result = await query("SELECT * FROM user_setting_preferences WHERE user_id = $1 LIMIT 1", [userId]);
  const row = result.rows[0] || {};

  return {
    language: row.language || "fr",
    region: row.region || "Maroc",
    timezone: row.timezone || "Africa/Casablanca",
    notifications: { ...defaultNotifications, ...parseJsonObject(row.notifications, {}) },
    messages: { ...defaultMessageSettings, ...parseJsonObject(row.messages, {}) },
    security: { ...defaultSecuritySettings, ...parseJsonObject(row.security, {}) },
    updatedAt: toIso(row.updated_at),
  };
}

async function ensureProfileForSettings(user) {
  await ensureSettingsSchema();
  const existing = await query(
    `
      SELECT p.*, u.username, u.email AS user_email, u.role, u.account_type
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
      LIMIT 1
    `,
    [user.id]
  );

  if (existing.rowCount > 0) {
    await query("INSERT INTO profile_settings (profile_id) VALUES ($1) ON CONFLICT (profile_id) DO NOTHING", [
      existing.rows[0].id,
    ]);
    return existing.rows[0];
  }

  const username = user.username || String(user.email || "").split("@")[0] || `user-${user.id}`;
  const publicProfileUrl = `${slugify(username) || "member"}-${user.id}`;
  await query(
    `
      INSERT INTO profiles (user_id, first_name, last_name, email, public_profile_url)
      VALUES ($1, NULL, NULL, $2, $3)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [user.id, user.email, publicProfileUrl]
  );

  const created = await query(
    `
      SELECT p.*, u.username, u.email AS user_email, u.role, u.account_type
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
      LIMIT 1
    `,
    [user.id]
  );
  await query("INSERT INTO profile_settings (profile_id) VALUES ($1) ON CONFLICT (profile_id) DO NOTHING", [
    created.rows[0].id,
  ]);
  return created.rows[0];
}

async function getPrivacyRow(profileId) {
  await query("INSERT INTO profile_settings (profile_id) VALUES ($1) ON CONFLICT (profile_id) DO NOTHING", [profileId]);
  const result = await query("SELECT * FROM profile_settings WHERE profile_id = $1 LIMIT 1", [profileId]);
  return result.rows[0] || {};
}

function mapPrivacy(row = {}) {
  return {
    profileVisibility: row.profile_visibility || "Public",
    emailVisibility: row.email_visibility || "Private",
    phoneVisibility: row.phone_visibility || "Private",
    cvVisibility: row.cv_visibility || "ContactsOnly",
    photoVisibility: row.photo_visibility || "Public",
    bannerVisibility: row.banner_visibility || "Public",
    bioVisibility: row.bio_visibility || "Public",
    professionVisibility: row.profession_visibility || "Public",
    professionalExperienceVisibility: row.professional_experience_visibility || "Public",
    interestsVisibility: row.interests_visibility || "Public",
    cityVisibility: row.city_visibility || "Public",
    countryVisibility: row.country_visibility || "Public",
    allowSearchEngines: row.allow_search_engines !== false,
    allowNetworkingRequests: row.allow_networking_requests !== false,
    updatedAt: toIso(row.updated_at),
  };
}

function mapAccount(user, profile, preferences) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();

  return {
    user: {
      id: Number(user.id),
      username: profile.username || user.username || null,
      email: profile.user_email || user.email || null,
      role: profile.role || user.role || "Regular",
      accountType: profile.account_type || user.accountType || "PERSONAL",
    },
    profile: {
      id: Number(profile.id),
      fullName: fullName || profile.username || user.username || "Membre Communium",
      firstName: profile.first_name || null,
      lastName: profile.last_name || null,
      bio: profile.bio || null,
      phone: profile.phone || null,
      email: profile.email || profile.user_email || user.email || null,
      city: profile.city || null,
      country: profile.country || null,
      profilePictureUrl: profile.profile_picture_url || null,
      bannerUrl: profile.banner_url || null,
      currentJobTitle: profile.current_job_title || profile.profession || null,
      currentCompany: profile.current_company || profile.establishment || null,
      currentIndustry: profile.current_industry || null,
      membershipTier: profile.membership_tier || "Free",
      publicProfileUrl: profile.public_profile_url || null,
      cvUrl: profile.cv_url || null,
      websiteUrl: profile.website_url || null,
      portfolioUrl: profile.portfolio_url || null,
      githubUrl: profile.github_url || null,
      linkedinUrl: profile.linkedin_url || null,
    },
    preferences: {
      language: preferences.language,
      region: preferences.region,
      timezone: preferences.timezone,
    },
  };
}

async function getVerification(userId) {
  const result = await query(
    "SELECT * FROM verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  const row = result.rows[0];

  return {
    status: row?.status || "NON_VERIFIED",
    type: row?.type || "PERSONAL",
    submittedAt: toIso(row?.submitted_at),
    reviewedAt: toIso(row?.reviewed_at),
    rejectionReason: row?.rejection_reason || null,
  };
}

async function getAccount(req, res) {
  const user = await ensureUser(req);
  const profile = await ensureProfileForSettings(user);
  const preferences = await getPreferences(user.id);
  const privacy = mapPrivacy(await getPrivacyRow(profile.id));
  const verification = await getVerification(user.id);

  return res.json({
    success: true,
    data: {
      ...mapAccount(user, profile, preferences),
      privacy,
      verification,
    },
  });
}

async function patchAccount(req, res) {
  const user = await ensureUser(req);
  const profile = await ensureProfileForSettings(user);
  const fields = {
    firstName: "first_name",
    lastName: "last_name",
    bio: "bio",
    city: "city",
    country: "country",
    currentJobTitle: "current_job_title",
    currentCompany: "current_company",
    currentIndustry: "current_industry",
    websiteUrl: "website_url",
    portfolioUrl: "portfolio_url",
    githubUrl: "github_url",
    linkedinUrl: "linkedin_url",
  };
  const values = [];
  const assignments = [];

  for (const [field, column] of Object.entries(fields)) {
    if (req.body[field] === undefined) {
      continue;
    }
    values.push(normalizeText(req.body[field], field === "bio" ? 300 : 180));
    assignments.push(`${column} = $${values.length}`);
  }

  if (req.body.email !== undefined) {
    values.push(sanitizeEmail(req.body.email) || null);
    assignments.push(`email = $${values.length}`);
  }

  if (req.body.phone !== undefined) {
    values.push(sanitizePhone(req.body.phone) || null);
    assignments.push(`phone = $${values.length}`);
  }

  if (assignments.length > 0) {
    values.push(profile.id);
    await query(`UPDATE profiles SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`, values);
  }

  const prefPatch = {};
  for (const key of ["language", "region", "timezone"]) {
    if (req.body[key] !== undefined) {
      prefPatch[key] = normalizeText(req.body[key], 120);
    }
  }

  if (Object.keys(prefPatch).length > 0) {
    const prefValues = [];
    const prefAssignments = [];
    for (const [field, value] of Object.entries(prefPatch)) {
      prefValues.push(value);
      prefAssignments.push(`${field} = $${prefValues.length}`);
    }
    prefValues.push(user.id);
    await query(
      `UPDATE user_setting_preferences SET ${prefAssignments.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${
        prefValues.length
      }`,
      prefValues
    );
  }

  return getAccount(req, res);
}

async function getPrivacy(req, res) {
  const user = await ensureUser(req);
  const profile = await ensureProfileForSettings(user);
  return res.json({ success: true, data: mapPrivacy(await getPrivacyRow(profile.id)) });
}

async function patchPrivacy(req, res) {
  const user = await ensureUser(req);
  const profile = await ensureProfileForSettings(user);
  const visibilityColumns = {
    profileVisibility: "profile_visibility",
    emailVisibility: "email_visibility",
    phoneVisibility: "phone_visibility",
    cvVisibility: "cv_visibility",
    photoVisibility: "photo_visibility",
    bannerVisibility: "banner_visibility",
    bioVisibility: "bio_visibility",
    professionVisibility: "profession_visibility",
    professionalExperienceVisibility: "professional_experience_visibility",
    interestsVisibility: "interests_visibility",
    cityVisibility: "city_visibility",
    countryVisibility: "country_visibility",
  };
  const booleanColumns = {
    allowSearchEngines: "allow_search_engines",
    allowNetworkingRequests: "allow_networking_requests",
  };
  const values = [];
  const assignments = [];

  for (const [field, column] of Object.entries(visibilityColumns)) {
    if (req.body[field] === undefined) {
      continue;
    }
    values.push(normalizePrivacyLevel(req.body[field], field === "cvVisibility" ? "ContactsOnly" : "Private"));
    assignments.push(`${column} = $${values.length}`);
  }

  for (const [field, column] of Object.entries(booleanColumns)) {
    if (req.body[field] === undefined) {
      continue;
    }
    values.push(normalizeBoolean(req.body[field]));
    assignments.push(`${column} = $${values.length}`);
  }

  const legacyVisibility = {
    emailVisibility: "show_email",
    phoneVisibility: "show_phone",
    cvVisibility: "show_cv",
    professionalExperienceVisibility: "show_professional_exp",
    interestsVisibility: "show_interests",
  };
  for (const [field, column] of Object.entries(legacyVisibility)) {
    if (req.body[field] === undefined) {
      continue;
    }
    values.push(normalizePrivacyLevel(req.body[field]) === "Public");
    assignments.push(`${column} = $${values.length}`);
  }

  if (assignments.length > 0) {
    values.push(profile.id);
    await query(
      `UPDATE profile_settings SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE profile_id = $${
        values.length
      }`,
      values
    );
  }

  return getPrivacy(req, res);
}

async function getSecurity(req, res) {
  const user = await ensureUser(req);
  const preferences = await getPreferences(user.id);
  let twoFactorEnabled = false;
  let recentActivity = [];

  try {
    const twoFactor = await query("SELECT totp_enabled FROM user_security_settings WHERE user_id = $1 LIMIT 1", [
      user.id,
    ]);
    twoFactorEnabled = twoFactor.rows[0]?.totp_enabled === true;
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }
  }

  try {
    const logs = await query(
      "SELECT event_type, ip_address, user_agent, created_at FROM security_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8",
      [user.id]
    );
    recentActivity = logs.rows.map((row) => ({
      event: row.event_type,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: toIso(row.created_at),
    }));
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }
  }

  return res.json({
    success: true,
    data: {
      ...preferences.security,
      twoFactorEnabled,
      activeSessions: [
        {
          id: "current",
          label: "Session actuelle",
          userAgent: req.get("user-agent") || "Navigateur actuel",
          ipAddress: req.ip,
          current: true,
        },
      ],
      recentActivity,
    },
  });
}

async function patchSecurity(req, res) {
  const user = await ensureUser(req);
  const preferences = await getPreferences(user.id);
  const security = mergeBooleanSettings(preferences.security, req.body);

  await query(
    "UPDATE user_setting_preferences SET security = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
    [JSON.stringify(security), user.id]
  );

  return getSecurity(req, res);
}

async function getNotifications(req, res) {
  const user = await ensureUser(req);
  const preferences = await getPreferences(user.id);
  return res.json({ success: true, data: preferences.notifications });
}

async function patchNotifications(req, res) {
  const user = await ensureUser(req);
  const preferences = await getPreferences(user.id);
  const notifications = mergeBooleanSettings(preferences.notifications, req.body);

  await query(
    "UPDATE user_setting_preferences SET notifications = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
    [JSON.stringify(notifications), user.id]
  );

  return getNotifications(req, res);
}

async function getMessages(req, res) {
  const user = await ensureUser(req);
  const preferences = await getPreferences(user.id);
  return res.json({ success: true, data: preferences.messages });
}

async function patchMessages(req, res) {
  const user = await ensureUser(req);
  const preferences = await getPreferences(user.id);
  const messages = mergeMessageSettings(preferences.messages, req.body);

  await query(
    "UPDATE user_setting_preferences SET messages = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
    [JSON.stringify(messages), user.id]
  );

  return getMessages(req, res);
}

async function getSubscription(req, res) {
  const user = await ensureUser(req);
  const profile = await ensureProfileForSettings(user);
  let subscription = null;

  try {
    const result = await query("SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [
      user.id,
    ]);
    subscription = result.rows[0] || null;
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }
  }

  return res.json({
    success: true,
    data: {
      plan: subscription?.plan || profile.membership_tier || "Free",
      status: subscription?.status || "FREE",
      startedAt: toIso(subscription?.started_at),
      expiresAt: toIso(subscription?.expires_at),
      renewsAt: toIso(subscription?.renews_at),
      billingUrl: "/billing",
      upgradeUrl: "/premium",
    },
  });
}

async function getPaymentHistory(req, res) {
  const user = await ensureUser(req);
  let payments = [];

  try {
    const result = await query(
      `
        SELECT p.id, p.provider, p.amount_ttc, p.currency, p.status, p.created_at,
          i.invoice_number, i.pdf_url AS invoice_url
        FROM payments p
        LEFT JOIN invoices i ON i.payment_id = p.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT 24
      `,
      [user.id]
    );
    payments = result.rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      amount: Number(row.amount_ttc || 0),
      currency: row.currency || "MAD",
      status: row.status || "INITIATED",
      invoiceNumber: row.invoice_number || null,
      invoiceUrl: row.invoice_url || null,
      createdAt: toIso(row.created_at),
    }));
  } catch (error) {
    if (error.code !== "42P01" && error.code !== "42703") {
      throw error;
    }
  }

  return res.json({ success: true, data: payments });
}

function createSettingsRouter() {
  const router = express.Router();

  router.get("/account", asyncHandler(getAccount));
  router.patch("/account", asyncHandler(patchAccount));
  router.get("/privacy", asyncHandler(getPrivacy));
  router.patch("/privacy", asyncHandler(patchPrivacy));
  router.get("/security", asyncHandler(getSecurity));
  router.patch("/security", asyncHandler(patchSecurity));
  router.get("/notifications", asyncHandler(getNotifications));
  router.patch("/notifications", asyncHandler(patchNotifications));
  router.get("/messages", asyncHandler(getMessages));
  router.patch("/messages", asyncHandler(patchMessages));
  router.get("/subscription", asyncHandler(getSubscription));
  router.get("/payments/history", asyncHandler(getPaymentHistory));

  return router;
}

module.exports = {
  createSettingsRouter,
  ensureSettingsSchema,
};
