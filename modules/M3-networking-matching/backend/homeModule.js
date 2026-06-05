const fs = require("fs/promises");
const path = require("path");
const { createRequire } = require("module");
const crypto = require("crypto");
const EventEmitter = require("events");
const backendRequire = createRequire(path.join(__dirname, "..", "..", "..", "backend", "package.json"));
const express = backendRequire("express");
const multer = backendRequire("multer");
const {
  asyncHandler,
  cleanString,
  ensureProfileSchema,
  ensureUser,
  parseJsonObject,
  query,
  toIso,
  toPositiveInt,
} = require("../../../backend/src/profileModule");

const uploadsRoot = path.join(__dirname, "..", "..", "..", "backend", "uploads");
const postsUploadsRoot = path.join(uploadsRoot, "posts");
const postUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

let homeSchemaPromise;
const notificationEvents = new EventEmitter();

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOffsetInt(value, fallback = 0) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function safeSlug(value, fallback = "item") {
  const slug = cleanString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || `${fallback}-${crypto.randomUUID().slice(0, 8)}`;
}

function normalizeVisibility(value) {
  const normalized = cleanString(value).toLowerCase();

  if (["public", "connections", "private"].includes(normalized)) {
    return normalized;
  }

  return "public";
}

function normalizePostType(value) {
  const normalized = cleanString(value).toLowerCase();

  if (["photo", "image", "video", "cv", "project", "article", "event", "offer", "text"].includes(normalized)) {
    return normalized === "image" ? "photo" : normalized;
  }

  return "text";
}

function normalizeNotificationType(value) {
  const normalized = cleanString(value).toLowerCase();

  if (
    [
      "message",
      "like",
      "comment",
      "connection",
      "verification",
      "subscription",
      "cv",
      "post",
      "security",
      "profile",
      "recommendation",
      "system",
      "application",
    ].includes(normalized)
  ) {
    return normalized;
  }

  return "post";
}

function normalizeNotificationCategory(value, type = "post") {
  const normalized = cleanString(value || type).toLowerCase();
  const direct = {
    all: "all",
    unread: "unread",
    network: "network",
    messages: "messages",
    profile: "profile",
    security: "security",
    publications: "publications",
    recommendations: "recommendations",
    system: "system",
    archived: "archived",
  };

  if (direct[normalized]) {
    return direct[normalized];
  }

  if (["message"].includes(type)) return "messages";
  if (["connection"].includes(type)) return "network";
  if (["like", "comment", "post"].includes(type)) return "publications";
  if (["verification", "cv"].includes(type)) return "profile";
  if (["security"].includes(type)) return "security";
  if (["recommendation"].includes(type)) return "recommendations";
  if (["subscription", "system"].includes(type)) return "system";
  return "system";
}

function normalizeNotificationPriority(value, type = "post") {
  const normalized = String(cleanString(value || "") || "").toLowerCase();
  if (["info", "message", "important", "security", "validation", "recommendation"].includes(normalized)) {
    return normalized;
  }

  if (type === "message") return "message";
  if (type === "security") return "security";
  if (type === "verification" || type === "cv") return "validation";
  if (type === "recommendation" || type === "connection") return "recommendation";
  if (type === "subscription") return "important";
  return "info";
}

async function ensureHomeSchema() {
  if (!homeSchemaPromise) {
    homeSchemaPromise = (async () => {
      await ensureProfileSchema();
      await query(`
        CREATE TABLE IF NOT EXISTS post_likes (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES profile_posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS post_saves (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES profile_posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS post_shares (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES profile_posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          share_target VARCHAR(40) NOT NULL DEFAULT 'link',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS post_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES profile_posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS saved_posts (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES profile_posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS connections (
          id SERIAL PRIMARY KEY,
          requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(24) NOT NULL DEFAULT 'pending',
          message TEXT,
          blocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          responded_at TIMESTAMP,
          source VARCHAR(40) NOT NULL DEFAULT 'manual',
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(requester_id, receiver_id)
        );

        ALTER TABLE connections ADD COLUMN IF NOT EXISTS message TEXT;
        ALTER TABLE connections ADD COLUMN IF NOT EXISTS blocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE connections ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP;
        ALTER TABLE connections ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'manual';
        ALTER TABLE connections ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

        CREATE TABLE IF NOT EXISTS connection_match_events (
          id SERIAL PRIMARY KEY,
          viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event_type VARCHAR(40) NOT NULL,
          score INTEGER DEFAULT 0,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS saved_member_searches (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(140) NOT NULL,
          query_text VARCHAR(120),
          filters JSONB NOT NULL DEFAULT '{}'::jsonb,
          sort_order VARCHAR(40) NOT NULL DEFAULT 'relevance',
          alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          last_checked_at TIMESTAMP,
          last_notified_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS app_notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          type VARCHAR(40) NOT NULL DEFAULT 'post',
          category VARCHAR(40) NOT NULL DEFAULT 'system',
          priority VARCHAR(40) NOT NULL DEFAULT 'info',
          title VARCHAR(180) NOT NULL,
          message TEXT NOT NULL,
          href TEXT,
          actor_name TEXT,
          actor_avatar_url TEXT,
          preview TEXT,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP,
          archived_at TIMESTAMP
        );

        ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS category VARCHAR(40) NOT NULL DEFAULT 'system';
        ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(40) NOT NULL DEFAULT 'info';
        ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS actor_name TEXT;
        ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS actor_avatar_url TEXT;
        ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS preview TEXT;
        ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
        ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

        CREATE TABLE IF NOT EXISTS notification_settings (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          sounds_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          network_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          messages_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          security_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          profile_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          premium_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          muted_types JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          title VARCHAR(180) NOT NULL,
          subtitle VARCHAR(180),
          meta VARCHAR(180),
          event_type VARCHAR(40) NOT NULL DEFAULT 'training',
          starts_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS event_attendees (
          id SERIAL PRIMARY KEY,
          event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(event_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_profile_posts_created ON profile_posts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at ASC);
        CREATE INDEX IF NOT EXISTS idx_app_notifications_user ON app_notifications(user_id, archived_at, read_at, created_at DESC);
        DELETE FROM app_notifications a
        USING app_notifications b
        WHERE a.id > b.id
          AND a.type = 'recommendation'
          AND b.type = 'recommendation'
          AND a.user_id = b.user_id
          AND COALESCE(a.metadata->>'suggestedUserId', '') <> ''
          AND COALESCE(a.metadata->>'suggestedUserId', '') = COALESCE(b.metadata->>'suggestedUserId', '');
        CREATE UNIQUE INDEX IF NOT EXISTS idx_app_notifications_recommendation_once
          ON app_notifications(user_id, ((metadata->>'suggestedUserId')))
          WHERE type = 'recommendation' AND COALESCE(metadata->>'suggestedUserId', '') <> '';
        CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id, status);
        CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_id, status);
        CREATE INDEX IF NOT EXISTS idx_connection_match_events_viewer ON connection_match_events(viewer_id, candidate_id, event_type, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_saved_member_searches_user ON saved_member_searches(user_id, updated_at DESC);

        INSERT INTO events (title, subtitle, meta, event_type, starts_at)
        SELECT 'Formation profil public', 'Atelier express', '45 min - En ligne', 'training', CURRENT_TIMESTAMP + INTERVAL '7 days'
        WHERE NOT EXISTS (SELECT 1 FROM events WHERE event_type = 'training' AND title = 'Formation profil public');
      `);
    })().catch((error) => {
      homeSchemaPromise = undefined;
      throw error;
    });
  }

  return homeSchemaPromise;
}

async function ensureHomeProfile(user) {
  const existing = await query("SELECT id FROM profiles WHERE user_id = $1", [user.id]);

  if (existing.rowCount) {
    return Number(existing.rows[0].id);
  }

  const result = await query(
    `
      INSERT INTO profiles (user_id, first_name, last_name, email, public_profile_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [
      user.id,
      cleanString(user.username || "Membre"),
      null,
      cleanString(user.email),
      safeSlug(user.username || user.email || `member-${user.id}`, "member"),
    ]
  );

  return Number(result.rows[0].id);
}

async function savePostUpload(file) {
  if (!file) {
    return null;
  }

  await fs.mkdir(postsUploadsRoot, { recursive: true });
  const extension = path.extname(file.originalname || "").toLowerCase();
  const filename = `${safeSlug(path.basename(file.originalname || "upload", extension), "upload")}-${crypto.randomUUID()}${extension}`;
  const destination = path.join(postsUploadsRoot, filename);
  await fs.writeFile(destination, file.buffer);

  return {
    fileName: file.originalname || filename,
    fileUrl: `/uploads/posts/${filename}`,
    mimeType: file.mimetype || "application/octet-stream",
    fileSize: Number(file.size || 0),
  };
}

async function refreshPostStats(postId) {
  const result = await query(
    `
      SELECT
        (SELECT COUNT(*)::integer FROM post_likes WHERE post_id = $1) AS likes,
        (SELECT COUNT(*)::integer FROM post_comments WHERE post_id = $1) AS comments,
        (SELECT COUNT(*)::integer FROM post_shares WHERE post_id = $1) AS shares,
        (SELECT COUNT(*)::integer FROM post_saves WHERE post_id = $1) AS saves
    `,
    [postId]
  );
  const row = result.rows[0] || {};
  const stats = {
    likes: toNumber(row.likes),
    comments: toNumber(row.comments),
    shares: toNumber(row.shares),
    saves: toNumber(row.saves),
  };

  await query("UPDATE profile_posts SET stats = $2::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [
    postId,
    JSON.stringify(stats),
  ]);

  return stats;
}

async function createNotification(userId, payload) {
  await ensureHomeSchema();

  if (!userId || Number(userId) === Number(payload.actorUserId)) {
    return;
  }

  const type = normalizeNotificationType(payload.type);
  const category = normalizeNotificationCategory(payload.category, type);
  const priority = normalizeNotificationPriority(payload.priority, type);
  const result = await query(
    `
      INSERT INTO app_notifications (
        user_id, actor_user_id, type, category, priority, title, message, href, actor_name, actor_avatar_url, preview, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
      ON CONFLICT DO NOTHING
      RETURNING *
    `,
    [
      userId,
      payload.actorUserId || null,
      type,
      category,
      priority,
      String(cleanString(payload.title || "") || "").slice(0, 180) || "Notification",
      String(cleanString(payload.message || "") || "").slice(0, 1000),
      cleanString(payload.href || "") || null,
      String(cleanString(payload.actorName || "") || "").slice(0, 120) || null,
      cleanString(payload.actorAvatarUrl || "") || null,
      String(cleanString(payload.preview || "") || "").slice(0, 500) || null,
      JSON.stringify(payload.metadata || {}),
    ]
  );

  if (!result.rowCount) {
    return;
  }

  notificationEvents.emit("notifications:event", {
    userIds: [Number(userId)],
    event: "notification:new",
    payload: mapAppNotification(result.rows[0]),
  });
}

async function getPostOwner(postId) {
  const result = await query(
    `
      SELECT pp.*, p.public_profile_url, p.first_name, p.last_name, u.username
      FROM profile_posts pp
      JOIN profiles p ON p.id = pp.profile_id
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = $1
      LIMIT 1
    `,
    [postId]
  );

  return result.rows[0] || null;
}

function mapPostRow(row, viewerId) {
  const stats = parseJsonObject(row.stats, { likes: 0, comments: 0, shares: 0, saves: 0 });
  const attachments = parseJsonObject(row.attachments, []);
  const fullName =
    [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
    row.username ||
    "Communium Member";
  const headline =
    [row.current_job_title, row.current_company].filter(Boolean).join(" @ ") ||
    row.current_industry ||
    "Profil professionnel";
  const username = row.public_profile_url || row.username;

  return {
    id: Number(row.id),
    type: row.post_type || "text",
    body: row.body || "",
    visibility: row.visibility || "public",
    showOnProfile: Boolean(row.show_on_profile),
    pinned: Boolean(row.pinned),
    attachments,
    stats: {
      likes: toNumber(stats.likes),
      comments: toNumber(stats.comments),
      shares: toNumber(stats.shares),
      saves: toNumber(stats.saves),
    },
    author: {
      id: Number(row.user_id),
      username,
      fullName,
      headline,
      profilePictureUrl: row.profile_picture_url || null,
      membershipTier: row.membership_tier || "Free",
      verified: Boolean(row.identity_verified),
    },
    viewerState: {
      liked: Boolean(row.viewer_liked),
      saved: Boolean(row.viewer_saved),
      canEdit: Number(row.user_id) === Number(viewerId),
    },
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function listFeedPosts(req, res) {
  await ensureHomeSchema();
  let viewer = null;

  try {
    viewer = await ensureUser(req);
  } catch {
    viewer = null;
  }

  const limit = Math.min(toPositiveInt(req.query.limit, 30), 80);
  const result = await query(
    `
      SELECT
        pp.*,
        p.first_name,
        p.last_name,
        p.profile_picture_url,
        p.current_job_title,
        p.current_company,
        p.current_industry,
        p.public_profile_url,
        p.identity_verified,
        p.membership_tier,
        u.username,
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = pp.id AND pl.user_id = $1) AS viewer_liked,
        EXISTS(SELECT 1 FROM post_saves ps WHERE ps.post_id = pp.id AND ps.user_id = $1) AS viewer_saved
      FROM profile_posts pp
      JOIN profiles p ON p.id = pp.profile_id
      JOIN users u ON u.id = pp.user_id
      WHERE pp.visibility = 'public'
         OR pp.user_id = $1
      ORDER BY pp.pinned DESC, pp.created_at DESC
      LIMIT $2
    `,
    [viewer?.id || 0, limit]
  );

  return res.json({ success: true, data: result.rows.map((row) => mapPostRow(row, viewer?.id || 0)) });
}

async function createPost(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const profileId = await ensureHomeProfile(user);
  const body = cleanString(req.body.body || req.body.text);

  if (!body || body.length > 4000) {
    return res.status(400).json({ success: false, error: "Publication invalide" });
  }

  const upload = await savePostUpload(req.file);
  const attachments = [];
  const attachmentTitle = cleanString(req.body.attachmentTitle);

  if (upload) {
    attachments.push({
      ...upload,
      title: attachmentTitle || upload.fileName,
    });
  } else if (attachmentTitle) {
    attachments.push({
      title: attachmentTitle,
      detail: cleanString(req.body.attachmentDetail) || "Piece jointe referencee",
    });
  }

  const result = await query(
    `
      INSERT INTO profile_posts
        (user_id, profile_id, post_type, body, visibility, show_on_profile, pinned, attachments, stats)
      VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7::jsonb, $8::jsonb)
      RETURNING *
    `,
    [
      user.id,
      profileId,
      normalizePostType(req.body.type || req.body.postType),
      body,
      normalizeVisibility(req.body.visibility),
      req.body.showOnProfile !== "false",
      JSON.stringify(attachments),
      JSON.stringify({ likes: 0, comments: 0, shares: 0, saves: 0 }),
    ]
  );

  const ownerProfile = await query(
    `
      SELECT pp.*, p.first_name, p.last_name, p.profile_picture_url, p.current_job_title,
             p.current_company, p.current_industry, p.public_profile_url, p.identity_verified,
             p.membership_tier, u.username, FALSE AS viewer_liked, FALSE AS viewer_saved
      FROM profile_posts pp
      JOIN profiles p ON p.id = pp.profile_id
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = $1
    `,
    [result.rows[0].id]
  );

  return res.status(201).json({ success: true, data: mapPostRow(ownerProfile.rows[0], user.id) });
}

async function updatePost(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const postId = toPositiveInt(req.params.id, 0);
  const existing = await query("SELECT * FROM profile_posts WHERE id = $1 AND user_id = $2", [postId, user.id]);

  if (!existing.rowCount) {
    return res.status(404).json({ success: false, error: "Publication introuvable" });
  }

  const body = req.body.body !== undefined ? cleanString(req.body.body) : existing.rows[0].body;

  if (!body || body.length > 4000) {
    return res.status(400).json({ success: false, error: "Publication invalide" });
  }

  await query(
    `
      UPDATE profile_posts
      SET post_type = $2,
          body = $3,
          visibility = $4,
          show_on_profile = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $6
    `,
    [
      postId,
      normalizePostType(req.body.type || req.body.postType || existing.rows[0].post_type),
      body,
      normalizeVisibility(req.body.visibility || existing.rows[0].visibility),
      req.body.showOnProfile === undefined ? existing.rows[0].show_on_profile : Boolean(req.body.showOnProfile),
      user.id,
    ]
  );

  req.params.id = String(postId);
  return listFeedPosts(req, res);
}

async function deletePost(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const postId = toPositiveInt(req.params.id, 0);
  const result = await query("DELETE FROM profile_posts WHERE id = $1 AND user_id = $2", [postId, user.id]);

  return res.json({ success: true, deleted: result.rowCount > 0 });
}

async function togglePostLike(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const postId = toPositiveInt(req.params.id, 0);
  const owner = await getPostOwner(postId);

  if (!owner) {
    return res.status(404).json({ success: false, error: "Publication introuvable" });
  }

  const existing = await query("SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2", [postId, user.id]);
  let liked = false;

  if (existing.rowCount) {
    await query("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2", [postId, user.id]);
  } else {
    await query("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [postId, user.id]);
    liked = true;
    await createNotification(owner.user_id, {
      actorUserId: user.id,
      type: "like",
      title: "Nouvelle reaction",
      message: `${user.username || "Un membre"} aime votre publication.`,
      href: "/feed",
    });
  }

  const stats = await refreshPostStats(postId);
  return res.json({ success: true, liked, stats });
}

async function togglePostSave(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const postId = toPositiveInt(req.params.id, 0);
  const owner = await getPostOwner(postId);

  if (!owner) {
    return res.status(404).json({ success: false, error: "Publication introuvable" });
  }

  const existing = await query("SELECT id FROM post_saves WHERE post_id = $1 AND user_id = $2", [postId, user.id]);
  let saved = false;

  if (existing.rowCount) {
    await query("DELETE FROM post_saves WHERE post_id = $1 AND user_id = $2", [postId, user.id]);
    await query("DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2", [postId, user.id]);
  } else {
    await query("INSERT INTO post_saves (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [postId, user.id]);
    await query("INSERT INTO saved_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [postId, user.id]);
    saved = true;
  }

  const stats = await refreshPostStats(postId);
  return res.json({ success: true, saved, stats });
}

async function sharePost(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const postId = toPositiveInt(req.params.id, 0);
  const owner = await getPostOwner(postId);

  if (!owner) {
    return res.status(404).json({ success: false, error: "Publication introuvable" });
  }

  await query("INSERT INTO post_shares (post_id, user_id, share_target) VALUES ($1, $2, $3)", [
    postId,
    user.id,
    cleanString(req.body.target) || "link",
  ]);

  let repost = null;
  if (cleanString(req.body.target) === "repost") {
    const profileId = await ensureHomeProfile(user);
    const repostBody = cleanString(req.body.body) || owner.body || "Publication repartagee";
    const originalAttachments = parseJsonObject(owner.attachments, []);
    const repostResult = await query(
      `
        INSERT INTO profile_posts
          (user_id, profile_id, post_type, body, visibility, show_on_profile, pinned, attachments, stats)
        VALUES ($1, $2, $3, $4, $5, TRUE, FALSE, $6::jsonb, $7::jsonb)
        RETURNING *
      `,
      [
        user.id,
        profileId,
        normalizePostType(owner.post_type),
        repostBody,
        normalizeVisibility(req.body.visibility || "public"),
        JSON.stringify(originalAttachments),
        JSON.stringify({ likes: 0, comments: 0, shares: 0, saves: 0 }),
      ]
    );

    const repostRow = await query(
      `
        SELECT pp.*, p.first_name, p.last_name, p.profile_picture_url, p.current_job_title,
               p.current_company, p.current_industry, p.public_profile_url, p.identity_verified,
               p.membership_tier, u.username, FALSE AS viewer_liked, FALSE AS viewer_saved
        FROM profile_posts pp
        JOIN profiles p ON p.id = pp.profile_id
        JOIN users u ON u.id = pp.user_id
        WHERE pp.id = $1
      `,
      [repostResult.rows[0].id]
    );
    repost = mapPostRow(repostRow.rows[0], user.id);
  }

  await createNotification(owner.user_id, {
    actorUserId: user.id,
    type: "post",
    title: "Publication partagee",
    message: `${user.username || "Un membre"} a partage votre publication.`,
    href: "/feed",
  });

  const stats = await refreshPostStats(postId);
  return res.json({ success: true, stats, data: repost });
}

function mapComment(row) {
  const fullName =
    [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
    row.username ||
    "Communium Member";

  return {
    id: Number(row.id),
    postId: Number(row.post_id),
    body: row.body,
    author: {
      id: Number(row.user_id),
      fullName,
      username: row.public_profile_url || row.username,
      profilePictureUrl: row.profile_picture_url || null,
    },
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function listComments(req, res) {
  await ensureHomeSchema();
  const postId = toPositiveInt(req.params.id, 0);
  const result = await query(
    `
      SELECT pc.*, p.first_name, p.last_name, p.profile_picture_url, p.public_profile_url, u.username
      FROM post_comments pc
      JOIN users u ON u.id = pc.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
      LIMIT 80
    `,
    [postId]
  );

  return res.json({ success: true, data: result.rows.map(mapComment) });
}

async function createComment(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const postId = toPositiveInt(req.params.id, 0);
  const body = cleanString(req.body.body || req.body.comment);
  const owner = await getPostOwner(postId);

  if (!owner) {
    return res.status(404).json({ success: false, error: "Publication introuvable" });
  }

  if (!body || body.length > 1200) {
    return res.status(400).json({ success: false, error: "Commentaire invalide" });
  }

  const result = await query(
    `
      INSERT INTO post_comments (post_id, user_id, body)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [postId, user.id, body]
  );

  await createNotification(owner.user_id, {
    actorUserId: user.id,
    type: "comment",
    title: "Nouveau commentaire",
    message: `${user.username || "Un membre"} a commente votre publication.`,
    href: "/feed",
  });

  await refreshPostStats(postId);

  const mappedResult = await query(
    `
      SELECT pc.*, p.first_name, p.last_name, p.profile_picture_url, p.public_profile_url, u.username
      FROM post_comments pc
      JOIN users u ON u.id = pc.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE pc.id = $1
    `,
    [result.rows[0].id]
  );

  return res.status(201).json({ success: true, data: mapComment(mappedResult.rows[0]) });
}

async function updateComment(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const commentId = toPositiveInt(req.params.id, 0);
  const body = cleanString(req.body.body);

  if (!body || body.length > 1200) {
    return res.status(400).json({ success: false, error: "Commentaire invalide" });
  }

  const result = await query(
    "UPDATE post_comments SET body = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *",
    [body, commentId, user.id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ success: false, error: "Commentaire introuvable" });
  }

  return res.json({ success: true, data: result.rows[0] });
}

async function deleteComment(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const commentId = toPositiveInt(req.params.id, 0);
  const existing = await query("SELECT post_id FROM post_comments WHERE id = $1 AND user_id = $2", [commentId, user.id]);

  if (!existing.rowCount) {
    return res.status(404).json({ success: false, error: "Commentaire introuvable" });
  }

  await query("DELETE FROM post_comments WHERE id = $1 AND user_id = $2", [commentId, user.id]);
  await refreshPostStats(existing.rows[0].post_id);

  return res.json({ success: true });
}

async function listSavedPosts(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const result = await query(
    `
      SELECT pp.*, p.first_name, p.last_name, p.profile_picture_url, p.current_job_title,
             p.current_company, p.current_industry, p.public_profile_url, p.identity_verified,
             p.membership_tier, u.username, TRUE AS viewer_saved,
             EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = pp.id AND pl.user_id = $1) AS viewer_liked
      FROM saved_posts sp
      JOIN profile_posts pp ON pp.id = sp.post_id
      JOIN profiles p ON p.id = pp.profile_id
      JOIN users u ON u.id = pp.user_id
      WHERE sp.user_id = $1
      ORDER BY sp.created_at DESC
    `,
    [user.id]
  );

  return res.json({ success: true, data: result.rows.map((row) => mapPostRow(row, user.id)) });
}

// MODULE M3-02 - Matching intelligent: format commun des profils recommandes.
function mapSuggestion(row, viewerId) {
  const matchReasons = Array.isArray(row.match_reasons)
    ? row.match_reasons
    : parseJsonObject(row.match_reasons, []);

  return {
    id: Number(row.user_id),
    userId: Number(row.user_id),
    firstName: row.first_name || null,
    lastName: row.last_name || null,
    fullName: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.username,
    city: row.city || null,
    country: row.country || null,
    currentJobTitle: row.current_job_title || null,
    currentCompany: row.current_company || null,
    currentIndustry: row.current_industry || null,
    profilePictureUrl: row.profile_picture_url || null,
    publicProfileUrl: row.public_profile_url || row.username,
    membershipTier: row.membership_tier || "Free",
    verified: Boolean(row.identity_verified),
    connectionStatus: row.connection_status || null,
    mutualCount: toNumber(row.mutual_count),
    commonInterests: toNumber(row.common_interests),
    matchScore: toNumber(row.match_score),
    matchReasons,
    requestMessage: row.connection_message || null,
    canRequest:
      Number(row.user_id) !== Number(viewerId) &&
      !["accepted", "blocked"].includes(String(row.connection_status || "")),
  };
}

function normalizeMembershipTier(value) {
  const cleaned = cleanString(value);
  const allowed = ["Free", "Silver", "Gold", "Platinum"];
  return allowed.find((tier) => tier.toLowerCase() === cleaned.toLowerCase()) || "";
}

function normalizeSearchSort(value) {
  const cleaned = cleanString(value).toLowerCase();
  if (["newest", "popular", "relevance"].includes(cleaned)) {
    return cleaned;
  }
  return "relevance";
}

function buildProfileSearchFilters(source = {}) {
  return {
    q: cleanString(source.q || source.search || "").slice(0, 120),
    city: cleanString(source.city || "").slice(0, 80),
    sector: cleanString(source.sector || source.industry || "").slice(0, 100),
    role: cleanString(source.role || "").slice(0, 100),
    level: normalizeMembershipTier(source.level || source.tier || source.membershipTier || ""),
    interest: cleanString(source.interest || "").slice(0, 100),
    lookingFor: cleanString(source.lookingFor || source.looking_for || "").slice(0, 100),
  };
}

function addProfileFilterWhere(where, params, filters, { alias = "p", userAlias = "u" } = {}) {
  if (filters.q) {
    params.push(`%${filters.q}%`);
    const idx = params.length;
    where.push(`
      (
        ${alias}.first_name ILIKE $${idx}
        OR ${alias}.last_name ILIKE $${idx}
        OR ${userAlias}.username ILIKE $${idx}
        OR ${alias}.bio ILIKE $${idx}
        OR ${alias}.current_job_title ILIKE $${idx}
        OR ${alias}.profession ILIKE $${idx}
        OR ${alias}.current_position ILIKE $${idx}
        OR ${alias}.current_company ILIKE $${idx}
        OR ${alias}.current_industry ILIKE $${idx}
        OR ${alias}.city ILIKE $${idx}
        OR ${alias}.country ILIKE $${idx}
        OR ${alias}.primary_skills::text ILIKE $${idx}
        OR EXISTS (
          SELECT 1
          FROM profile_interests filter_pi
          JOIN interests filter_i ON filter_i.id = filter_pi.interest_id
          WHERE filter_pi.profile_id = ${alias}.id AND filter_i.name ILIKE $${idx}
        )
      )
    `);
  }

  if (filters.city) {
    params.push(`%${filters.city}%`);
    where.push(`${alias}.city ILIKE $${params.length}`);
  }

  if (filters.sector) {
    params.push(`%${filters.sector}%`);
    const idx = params.length;
    where.push(`(${alias}.current_industry ILIKE $${idx} OR ${alias}.current_company ILIKE $${idx})`);
  }

  if (filters.role) {
    params.push(`%${filters.role}%`);
    const idx = params.length;
    where.push(`(${alias}.current_job_title ILIKE $${idx} OR ${alias}.profession ILIKE $${idx} OR ${alias}.current_position ILIKE $${idx})`);
  }

  if (filters.level) {
    params.push(filters.level);
    where.push(`${alias}.membership_tier = $${params.length}::membership_tier`);
  }

  if (filters.interest) {
    params.push(`%${filters.interest}%`);
    where.push(`
      EXISTS (
        SELECT 1
        FROM profile_interests filter_pi
        JOIN interests filter_i ON filter_i.id = filter_pi.interest_id
        WHERE filter_pi.profile_id = ${alias}.id AND filter_i.name ILIKE $${params.length}
      )
    `);
  }

  if (filters.lookingFor) {
    params.push(`%${filters.lookingFor}%`);
    const idx = params.length;
    where.push(`(${alias}.bio ILIKE $${idx} OR ${alias}.availability ILIKE $${idx} OR ${alias}.primary_skills::text ILIKE $${idx})`);
  }
}

function profileSearchOrder(sort) {
  if (sort === "newest") {
    return "p.created_at DESC, p.updated_at DESC";
  }
  if (sort === "popular") {
    return "COALESCE(p.connections_count, 0) DESC, COALESCE(p.profile_views_count, 0) DESC, p.updated_at DESC";
  }
  return "match_score DESC, p.updated_at DESC";
}

async function trackMatchEvent(viewerId, candidateId, eventType, metadata = {}) {
  if (!viewerId || !candidateId || Number(viewerId) === Number(candidateId)) {
    return;
  }

  await query(
    `
      INSERT INTO connection_match_events (viewer_id, candidate_id, event_type, score, metadata)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [
      viewerId,
      candidateId,
      cleanString(eventType).slice(0, 40) || "viewed",
      toNumber(metadata.score),
      JSON.stringify(metadata),
    ]
  );
}

async function refreshConnectionCounts(userIds) {
  const ids = [...new Set((userIds || []).map((id) => Number(id)).filter(Boolean))];
  for (const id of ids) {
    await query(
      `
        UPDATE profiles
        SET connections_count = (
          SELECT COUNT(*)::integer
          FROM connections
          WHERE status = 'accepted'
            AND (requester_id = $1 OR receiver_id = $1)
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `,
      [id]
    );
  }
}

// MODULE M3-02 - Matching intelligent: scoring pondere et filtres manuels.
async function listSuggestions(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const filters = buildProfileSearchFilters(req.query);
  const limit = Math.min(toPositiveInt(req.query.limit, 12), 50);
  const sort = normalizeSearchSort(req.query.sort);
  const params = [user.id];
  const where = [
    "p.user_id <> $1",
    "p.public_profile_url IS NOT NULL",
    "COALESCE(ps.profile_visibility::text, 'Public') = 'Public'",
    "COALESCE(ps.allow_networking_requests, TRUE) = TRUE",
    "(c.id IS NULL OR c.status NOT IN ('accepted', 'blocked'))",
  ];

  addProfileFilterWhere(where, params, filters);
  params.push(limit);

  const result = await query(
    `
      WITH viewer AS (
        SELECT *
        FROM profiles
        WHERE user_id = $1
        LIMIT 1
      ),
      viewer_interests AS (
        SELECT pi.interest_id
        FROM profile_interests pi
        JOIN viewer v ON v.id = pi.profile_id
      )
      SELECT p.*, u.username,
        c.status AS connection_status,
        c.message AS connection_message,
        COALESCE(ci.count, 0)::integer AS common_interests,
        COALESCE(mutual.count, 0)::integer AS mutual_count,
        (
          CASE WHEN p.current_industry IS NOT NULL AND v.current_industry IS NOT NULL AND LOWER(p.current_industry) = LOWER(v.current_industry) THEN 30 ELSE 0 END +
          CASE WHEN p.city IS NOT NULL AND v.city IS NOT NULL AND LOWER(p.city) = LOWER(v.city) THEN 20 ELSE 0 END +
          CASE WHEN p.country IS NOT NULL AND v.country IS NOT NULL AND LOWER(p.country) = LOWER(v.country) THEN 8 ELSE 0 END +
          CASE WHEN p.membership_tier = v.membership_tier THEN 8 ELSE 0 END +
          CASE WHEN p.membership_tier IN ('Gold', 'Platinum') THEN 6 ELSE 0 END +
          LEAST(COALESCE(ci.count, 0) * 12, 24) +
          CASE WHEN p.identity_verified = TRUE THEN 4 ELSE 0 END
        )::integer AS match_score,
        ARRAY_REMOVE(ARRAY[
          CASE WHEN p.current_industry IS NOT NULL AND v.current_industry IS NOT NULL AND LOWER(p.current_industry) = LOWER(v.current_industry) THEN 'Meme secteur' END,
          CASE WHEN p.city IS NOT NULL AND v.city IS NOT NULL AND LOWER(p.city) = LOWER(v.city) THEN 'Meme ville' END,
          CASE WHEN COALESCE(ci.count, 0) > 0 THEN CONCAT(ci.count, ' interet(s) commun(s)') END,
          CASE WHEN p.membership_tier IN ('Gold', 'Platinum') THEN 'Profil premium' END,
          CASE WHEN p.identity_verified = TRUE THEN 'Profil verifie' END
        ], NULL) AS match_reasons
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN viewer v ON TRUE
      LEFT JOIN profile_settings ps ON ps.profile_id = p.id
      LEFT JOIN connections c
        ON (
          (c.requester_id = $1 AND c.receiver_id = p.user_id)
          OR (c.requester_id = p.user_id AND c.receiver_id = $1)
        )
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS count
        FROM profile_interests pi
        WHERE pi.profile_id = p.id
          AND pi.interest_id IN (SELECT interest_id FROM viewer_interests)
      ) ci ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS count
        FROM connections mine
        JOIN connections theirs
          ON (
            CASE WHEN mine.requester_id = $1 THEN mine.receiver_id ELSE mine.requester_id END
          ) = (
            CASE WHEN theirs.requester_id = p.user_id THEN theirs.receiver_id ELSE theirs.requester_id END
          )
        WHERE mine.status = 'accepted'
          AND theirs.status = 'accepted'
          AND (mine.requester_id = $1 OR mine.receiver_id = $1)
          AND (theirs.requester_id = p.user_id OR theirs.receiver_id = p.user_id)
      ) mutual ON TRUE
      WHERE ${where.join(" AND ")}
      ORDER BY ${profileSearchOrder(sort)}
      LIMIT $${params.length}
    `,
    params
  );

  await Promise.all(
    result.rows.map((row) =>
      trackMatchEvent(user.id, row.user_id, "suggested", {
        score: row.match_score,
        reasons: row.match_reasons || [],
        filters,
      })
    )
  );

  return res.json({ success: true, filters, sort, data: result.rows.map((row) => mapSuggestion(row, user.id)) });
}

// MODULE M3-01 - Systeme de connexions: demande avec message personnalise et anti-spam.
async function requestConnection(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const targetUserId = toPositiveInt(req.body.userId || req.body.profileId || req.params.userId, 0);
  const message = cleanString(req.body.message || "").slice(0, 500);
  const source = cleanString(req.body.source || "manual").slice(0, 40) || "manual";

  if (!targetUserId || targetUserId === Number(user.id)) {
    return res.status(400).json({ success: false, error: "Destinataire invalide" });
  }

  const target = await query(
    `
      SELECT u.id, u.username, COALESCE(ps.allow_networking_requests, TRUE) AS allow_networking_requests
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN profile_settings ps ON ps.profile_id = p.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [targetUserId]
  );
  if (!target.rowCount) {
    return res.status(404).json({ success: false, error: "Profil introuvable" });
  }

  if (target.rows[0].allow_networking_requests === false) {
    return res.status(403).json({ success: false, error: "Ce membre n accepte pas les demandes de connexion." });
  }

  const pendingLimit = Number(process.env.CONNECTION_PENDING_LIMIT || 25);
  const pendingCount = await query(
    "SELECT COUNT(*)::integer AS count FROM connections WHERE requester_id = $1 AND status = 'pending'",
    [user.id]
  );
  if (Number(pendingCount.rows[0]?.count || 0) >= pendingLimit) {
    return res.status(429).json({
      success: false,
      error: `Limite atteinte: ${pendingLimit} demandes en attente maximum.`,
    });
  }

  const existing = await query(
    `
      SELECT *
      FROM connections
      WHERE (requester_id = $1 AND receiver_id = $2)
         OR (requester_id = $2 AND receiver_id = $1)
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [user.id, targetUserId]
  );

  if (existing.rowCount) {
    const row = existing.rows[0];
    if (row.status === "blocked") {
      return res.status(403).json({ success: false, error: "Connexion bloquee." });
    }
    if (row.status === "accepted") {
      return res.json({ success: true, status: "accepted" });
    }
    if (row.status === "pending" && Number(row.requester_id) !== Number(user.id)) {
      return res.status(409).json({ success: false, status: "pendingIncoming", error: "Ce membre vous a deja envoye une invitation." });
    }
    if (row.status === "pending") {
      return res.json({ success: true, status: "pending" });
    }
  }

  await query(
    `
      INSERT INTO connections (requester_id, receiver_id, status, message, source, metadata)
      VALUES ($1, $2, 'pending', $3, $4, $5::jsonb)
      ON CONFLICT (requester_id, receiver_id)
      DO UPDATE SET status = 'pending',
                    message = EXCLUDED.message,
                    source = EXCLUDED.source,
                    blocked_by = NULL,
                    responded_at = NULL,
                    metadata = EXCLUDED.metadata,
                    updated_at = CURRENT_TIMESTAMP
    `,
    [user.id, targetUserId, message || null, source, JSON.stringify({ source, resentAt: existing.rowCount ? new Date().toISOString() : null })]
  );

  await trackMatchEvent(user.id, targetUserId, "requested", { source });
  await createNotification(targetUserId, {
    actorUserId: user.id,
    type: "connection",
    title: "Nouvelle demande reseau",
    message: message
      ? `${user.username || "Un membre"} souhaite se connecter avec vous: ${message}`
      : `${user.username || "Un membre"} souhaite se connecter avec vous.`,
    preview: message || null,
    href: "/discover?tab=invitations",
    metadata: { requesterId: user.id, message },
  });

  return res.status(201).json({ success: true, status: "pending" });
}

function mapConnectionProfile(row, viewerId) {
  return {
    id: Number(row.user_id),
    userId: Number(row.user_id),
    connectionId: Number(row.connection_id),
    firstName: row.first_name || null,
    lastName: row.last_name || null,
    fullName: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.username,
    city: row.city || null,
    country: row.country || null,
    currentJobTitle: row.current_job_title || null,
    currentCompany: row.current_company || null,
    currentIndustry: row.current_industry || null,
    profilePictureUrl: row.profile_picture_url || null,
    publicProfileUrl: row.public_profile_url || row.username,
    membershipTier: row.membership_tier || "Free",
    verified: Boolean(row.identity_verified),
    mutualCount: toNumber(row.mutual_count),
    connectionStatus: row.connection_status || null,
    requestMessage: row.connection_message || null,
    canRequest: Number(row.user_id) !== Number(viewerId) && row.connection_status !== "accepted",
    createdAt: toIso(row.connection_created_at),
  };
}

async function listConnections(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const baseSelect = `
    SELECT c.id AS connection_id, c.status AS connection_status, c.message AS connection_message, c.created_at AS connection_created_at,
           p.*, u.username,
           (
             SELECT COUNT(*)::integer
             FROM connections mine
             JOIN connections theirs
               ON (
                 CASE WHEN mine.requester_id = $1 THEN mine.receiver_id ELSE mine.requester_id END
               ) = (
                 CASE WHEN theirs.requester_id = p.user_id THEN theirs.receiver_id ELSE theirs.requester_id END
               )
             WHERE mine.status = 'accepted'
               AND theirs.status = 'accepted'
               AND (mine.requester_id = $1 OR mine.receiver_id = $1)
               AND (theirs.requester_id = p.user_id OR theirs.receiver_id = p.user_id)
           ) AS mutual_count
    FROM connections c
    JOIN users u ON u.id = CASE WHEN c.requester_id = $1 THEN c.receiver_id ELSE c.requester_id END
    LEFT JOIN profiles p ON p.user_id = u.id
  `;

  const [invitations, sent, friends] = await Promise.all([
    query(
      `${baseSelect}
       WHERE c.receiver_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC
       LIMIT 30`,
      [user.id]
    ),
    query(
      `${baseSelect}
       WHERE c.requester_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC
       LIMIT 30`,
      [user.id]
    ),
    query(
      `${baseSelect}
       WHERE (c.requester_id = $1 OR c.receiver_id = $1) AND c.status = 'accepted'
       ORDER BY c.updated_at DESC
       LIMIT 80`,
      [user.id]
    ),
  ]);

  return res.json({
    success: true,
    data: {
      invitations: invitations.rows.map((row) => mapConnectionProfile(row, user.id)),
      sent: sent.rows.map((row) => mapConnectionProfile(row, user.id)),
      friends: friends.rows.map((row) => mapConnectionProfile(row, user.id)),
    },
  });
}

// MODULE M3-01 - Systeme de connexions: acceptation de demande.
async function acceptConnection(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const requesterId = toPositiveInt(req.params.userId || req.body.userId, 0);

  const result = await query(
    `
      UPDATE connections
      SET status = 'accepted', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'
      RETURNING *
    `,
    [requesterId, user.id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ success: false, error: "Invitation introuvable" });
  }

  await refreshConnectionCounts([requesterId, user.id]);
  await trackMatchEvent(user.id, requesterId, "accepted", { connectionId: result.rows[0].id });
  await createNotification(requesterId, {
    actorUserId: user.id,
    type: "connection",
    title: "Invitation acceptee",
    message: `${user.username || "Un membre"} a accepte votre invitation reseau.`,
    href: "/discover",
  });

  return res.json({ success: true, status: "accepted" });
}

// MODULE M3-01 - Systeme de connexions: refus de demande.
async function refuseConnection(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const requesterId = toPositiveInt(req.params.userId || req.body.userId, 0);

  const result = await query(
    `
      UPDATE connections
      SET status = 'refused', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'
      RETURNING *
    `,
    [requesterId, user.id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ success: false, error: "Invitation introuvable" });
  }

  await trackMatchEvent(user.id, requesterId, "refused", { connectionId: result.rows[0].id });
  return res.json({ success: true, status: "refused" });
}

// MODULE M3-01 - Systeme de connexions: blocage d'un membre.
async function blockConnection(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const otherUserId = toPositiveInt(req.params.userId || req.body.userId, 0);
  const reason = cleanString(req.body.reason || "").slice(0, 240);

  if (!otherUserId || otherUserId === Number(user.id)) {
    return res.status(400).json({ success: false, error: "Membre invalide" });
  }

  const target = await query("SELECT id FROM users WHERE id = $1", [otherUserId]);
  if (!target.rowCount) {
    return res.status(404).json({ success: false, error: "Profil introuvable" });
  }

  let result = await query(
    `
      UPDATE connections
      SET status = 'blocked',
          blocked_by = $1,
          message = COALESCE($3::text, message),
          responded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE (requester_id = $1 AND receiver_id = $2)
         OR (requester_id = $2 AND receiver_id = $1)
      RETURNING *
    `,
    [user.id, otherUserId, reason || null]
  );

  if (!result.rowCount) {
    result = await query(
      `
        INSERT INTO connections (requester_id, receiver_id, status, blocked_by, message, responded_at)
        VALUES ($1, $2, 'blocked', $1, $3, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      [user.id, otherUserId, reason || null]
    );
  }

  await refreshConnectionCounts([user.id, otherUserId]);
  await trackMatchEvent(user.id, otherUserId, "blocked", { connectionId: result.rows[0].id });

  return res.json({ success: true, status: "blocked" });
}

async function removeConnection(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const otherUserId = toPositiveInt(req.params.userId || req.body.userId, 0);

  await query(
    `
      DELETE FROM connections
      WHERE (requester_id = $1 AND receiver_id = $2)
         OR (requester_id = $2 AND receiver_id = $1)
    `,
    [user.id, otherUserId]
  );

  await refreshConnectionCounts([user.id, otherUserId]);
  return res.json({ success: true });
}

async function runMemberSearch({ filters, sort = "relevance", limit = 12, since = null, viewerId = 0 }) {
  const params = [];
  const where = [
    "p.public_profile_url IS NOT NULL",
    "COALESCE(ps.profile_visibility::text, 'Public') = 'Public'",
  ];

  addProfileFilterWhere(where, params, filters);

  if (since) {
    params.push(since);
    where.push(`p.created_at > $${params.length}`);
  }

  params.push(limit);
  const result = await query(
    `
      SELECT p.*, u.username,
        COALESCE(p.connections_count, 0)::integer AS mutual_count,
        0::integer AS common_interests,
        (
          CASE WHEN p.identity_verified = TRUE THEN 4 ELSE 0 END +
          CASE WHEN p.membership_tier IN ('Gold', 'Platinum') THEN 6 ELSE 0 END +
          COALESCE(p.connections_count, 0)
        )::integer AS match_score,
        ARRAY_REMOVE(ARRAY[
          CASE WHEN p.identity_verified = TRUE THEN 'Profil verifie' END,
          CASE WHEN p.membership_tier IN ('Gold', 'Platinum') THEN 'Profil premium' END
        ], NULL) AS match_reasons
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN profile_settings ps ON ps.profile_id = p.id
      WHERE ${where.join(" AND ")}
      ORDER BY ${profileSearchOrder(sort)}
      LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map((row) => mapSuggestion(row, viewerId));
}

// MODULE M3-03 - Recherche avancee membres: recherche globale et filtres.
async function searchAll(req, res) {
  await ensureHomeSchema();
  const filters = buildProfileSearchFilters(req.query);
  const term = filters.q.slice(0, 80);
  const sort = normalizeSearchSort(req.query.sort);
  const limit = Math.min(toPositiveInt(req.query.limit, 12), 50);

  if (!term && !filters.city && !filters.sector && !filters.role && !filters.level && !filters.interest && !filters.lookingFor) {
    return res.json({
      success: true,
      query: "",
      filters,
      sort,
      profiles: [],
      posts: [],
      companies: [],
      opportunities: [],
    });
  }

  const like = `%${term}%`;
  const [profiles, posts, companies, opportunities] = await Promise.all([
    runMemberSearch({ filters, sort, limit }),
    query(
      `
        SELECT pp.*, p.first_name, p.last_name, p.profile_picture_url, p.current_job_title,
               p.current_company, p.current_industry, p.public_profile_url, p.identity_verified,
               p.membership_tier, u.username, FALSE AS viewer_liked, FALSE AS viewer_saved
        FROM profile_posts pp
        JOIN profiles p ON p.id = pp.profile_id
        JOIN users u ON u.id = pp.user_id
        WHERE pp.visibility = 'public' AND ($2::boolean = FALSE OR pp.body ILIKE $1)
        ORDER BY pp.created_at DESC
        LIMIT 12
      `,
      [like, Boolean(term)]
    ),
    query(
      `
        SELECT current_company AS name, COUNT(*)::integer AS members
        FROM profiles
        WHERE current_company IS NOT NULL AND ($2::boolean = FALSE OR current_company ILIKE $1)
        GROUP BY current_company
        ORDER BY members DESC
        LIMIT 8
      `,
      [like, Boolean(term)]
    ),
    query(
      `
        SELECT *
        FROM events
        WHERE $2::boolean = TRUE AND (title ILIKE $1 OR subtitle ILIKE $1 OR meta ILIKE $1)
        ORDER BY starts_at ASC NULLS LAST
        LIMIT 8
      `,
      [like, Boolean(term)]
    ),
  ]);

  return res.json({
    success: true,
    query: term,
    filters,
    sort,
    profiles,
    posts: posts.rows.map((row) => mapPostRow(row, 0)),
    companies: companies.rows.filter((row) => row.name).map((row) => ({ name: row.name, members: toNumber(row.members) })),
    opportunities: opportunities.rows.map(mapEvent),
  });
}

function mapSavedMemberSearch(row, newMatches = 0) {
  return {
    id: Number(row.id),
    name: row.name,
    query: row.query_text || "",
    filters: parseJsonObject(row.filters, {}),
    sort: row.sort_order || "relevance",
    alertEnabled: row.alert_enabled !== false,
    newMatches: toNumber(newMatches),
    lastCheckedAt: toIso(row.last_checked_at),
    lastNotifiedAt: toIso(row.last_notified_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

// MODULE M3-03 - Recherche avancee membres: recherches sauvegardees.
async function listSavedMemberSearches(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const result = await query(
    "SELECT * FROM saved_member_searches WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 30",
    [user.id]
  );

  const data = [];
  for (const row of result.rows) {
    const filters = { ...parseJsonObject(row.filters, {}), q: row.query_text || "" };
    const matches = row.alert_enabled
      ? await runMemberSearch({
          filters: buildProfileSearchFilters(filters),
          sort: row.sort_order,
          limit: 10,
          since: row.last_checked_at || row.created_at,
          viewerId: user.id,
        })
      : [];
    data.push(mapSavedMemberSearch(row, matches.length));
  }

  return res.json({ success: true, data });
}

async function createSavedMemberSearch(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const filters = buildProfileSearchFilters({ ...(req.body?.filters || {}), ...req.body });
  const sort = normalizeSearchSort(req.body?.sort);
  const name =
    cleanString(req.body?.name || "") ||
    filters.q ||
    [filters.city, filters.sector, filters.role, filters.level, filters.interest].filter(Boolean).join(" / ") ||
    "Recherche membres";

  const result = await query(
    `
      INSERT INTO saved_member_searches (user_id, name, query_text, filters, sort_order, alert_enabled, last_checked_at)
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `,
    [
      user.id,
      name.slice(0, 140),
      filters.q || null,
      JSON.stringify({
        city: filters.city,
        sector: filters.sector,
        role: filters.role,
        level: filters.level,
        interest: filters.interest,
        lookingFor: filters.lookingFor,
      }),
      sort,
      req.body?.alertEnabled !== false,
    ]
  );

  return res.status(201).json({ success: true, data: mapSavedMemberSearch(result.rows[0]) });
}

async function deleteSavedMemberSearch(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const id = toPositiveInt(req.params.id, 0);

  await query("DELETE FROM saved_member_searches WHERE id = $1 AND user_id = $2", [id, user.id]);
  return res.json({ success: true });
}

function mapEvent(row, joined = false) {
  return {
    id: Number(row.id),
    title: row.title,
    subtitle: row.subtitle || null,
    meta: row.meta || null,
    type: row.event_type || "training",
    startsAt: toIso(row.starts_at),
    joined,
  };
}

async function listEvents(req, res) {
  await ensureHomeSchema();
  let user = null;

  try {
    user = await ensureUser(req);
  } catch {
    user = null;
  }

  const result = await query(
    `
      SELECT e.*, EXISTS(SELECT 1 FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = $1) AS joined
      FROM events e
      ORDER BY e.starts_at ASC NULLS LAST, e.created_at DESC
      LIMIT 20
    `,
    [user?.id || 0]
  );

  return res.json({ success: true, data: result.rows.map((row) => mapEvent(row, Boolean(row.joined))) });
}

async function joinEvent(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const eventId = toPositiveInt(req.params.id, 0);
  const exists = await query("SELECT id FROM events WHERE id = $1", [eventId]);

  if (!exists.rowCount) {
    return res.status(404).json({ success: false, error: "Evenement introuvable" });
  }

  await query("INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
    eventId,
    user.id,
  ]);

  await createNotification(user.id, {
    actorUserId: null,
    type: "post",
    title: "Participation confirmee",
    message: "Votre participation a l evenement est enregistree.",
    href: "/feed",
  });

  return res.json({ success: true, joined: true });
}

async function leaveEvent(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const eventId = toPositiveInt(req.params.id, 0);
  await query("DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2", [eventId, user.id]);
  return res.json({ success: true, joined: false });
}

function mapAppNotification(row) {
  const type = normalizeNotificationType(row.type || row.status);
  const category = normalizeNotificationCategory(row.category, type);
  const priority = normalizeNotificationPriority(row.priority, type);
  const actorName = row.actor_name || row.actor_username || null;

  return {
    id: String(row.id),
    type,
    category,
    priority,
    title: row.title || "Notification",
    message: row.message || "",
    preview: row.preview || row.message || "",
    href: row.href || null,
    actor: {
      id: row.actor_user_id ? String(row.actor_user_id) : null,
      name: actorName,
      username: row.actor_username || null,
      avatarUrl: row.actor_avatar_url || row.actor_avatar || null,
    },
    groupKey: row.group_key || `${type}:${row.href || row.title || row.id}`,
    groupCount: Number(row.group_count || 1),
    createdAt: toIso(row.created_at),
    readAt: toIso(row.read_at),
    archivedAt: toIso(row.archived_at),
    read: Boolean(row.read_at),
  };
}

function defaultNotificationSettings() {
  return {
    soundsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    networkEnabled: true,
    messagesEnabled: true,
    securityEnabled: true,
    profileEnabled: true,
    premiumEnabled: true,
    mutedTypes: [],
  };
}

function mapNotificationSettings(row) {
  return {
    soundsEnabled: row ? Boolean(row.sounds_enabled) : true,
    emailEnabled: row ? Boolean(row.email_enabled) : true,
    pushEnabled: row ? Boolean(row.push_enabled) : true,
    networkEnabled: row ? Boolean(row.network_enabled) : true,
    messagesEnabled: row ? Boolean(row.messages_enabled) : true,
    securityEnabled: row ? Boolean(row.security_enabled) : true,
    profileEnabled: row ? Boolean(row.profile_enabled) : true,
    premiumEnabled: row ? Boolean(row.premium_enabled) : true,
    mutedTypes: Array.isArray(row?.muted_types) ? row.muted_types : [],
  };
}

async function getNotificationSettings(userId) {
  await query("INSERT INTO notification_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
  const result = await query("SELECT * FROM notification_settings WHERE user_id = $1 LIMIT 1", [userId]);
  return mapNotificationSettings(result.rows[0]);
}

async function syncUnreadMessageNotifications(userId) {
  const tables = await query(
    `
      SELECT
        to_regclass('public.message_members') AS members_table,
        to_regclass('public.message_messages') AS messages_table
    `
  );

  if (!tables.rows[0]?.members_table || !tables.rows[0]?.messages_table) {
    return;
  }

  const result = await query(
    `
      WITH latest_unread AS (
        SELECT DISTINCT ON (mm.conversation_id)
          mm.conversation_id,
          m.id AS message_id,
          m.sender_id,
          m.body,
          m.message_type,
          m.created_at,
          u.username AS actor_username,
          p.first_name,
          p.last_name,
          p.profile_picture_url
        FROM message_members mm
        JOIN message_messages m ON m.conversation_id = mm.conversation_id
        JOIN users u ON u.id = m.sender_id
        LEFT JOIN profiles p ON p.user_id = m.sender_id
        WHERE mm.user_id = $1
          AND mm.unread_count > 0
          AND m.sender_id <> $1
          AND m.deleted_for_everyone_at IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM app_notifications n
            WHERE n.user_id = $1
              AND n.category = 'messages'
              AND COALESCE(n.metadata->>'messageId', '') = m.id::text
          )
        ORDER BY mm.conversation_id, m.created_at DESC
      )
      SELECT *
      FROM latest_unread
      ORDER BY created_at DESC
      LIMIT 20
    `,
    [userId]
  );

  for (const row of result.rows) {
    const actorName =
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
      row.actor_username ||
      "Un membre";
    const preview = cleanString(row.body) || (row.message_type === "voice" ? "Message vocal envoye" : "Nouveau message");

    await createNotification(userId, {
      actorUserId: Number(row.sender_id),
      type: "message",
      category: "messages",
      priority: "message",
      title: `Nouveau message de ${actorName}`,
      message: preview,
      preview,
      href: `/messages?conversation=${row.conversation_id}`,
      actorName,
      actorAvatarUrl: row.profile_picture_url || null,
      metadata: {
        conversationId: row.conversation_id,
        messageId: row.message_id,
        reconciled: true,
      },
    });
  }
}

async function syncRecommendationNotifications(userId) {
  const activeRecommendations = await query(
    `
      SELECT COUNT(*)::integer AS count
      FROM app_notifications
      WHERE user_id = $1
        AND type = 'recommendation'
        AND archived_at IS NULL
    `,
    [userId]
  );
  const remainingSlots = Math.max(0, 2 - Number(activeRecommendations.rows[0]?.count || 0));
  if (!remainingSlots) {
    return;
  }

  const profile = await query("SELECT city, country, current_industry FROM profiles WHERE user_id = $1 LIMIT 1", [userId]);
  const p = profile.rows[0] || {};
  const result = await query(
    `
      SELECT p.user_id, p.first_name, p.last_name,
        COALESCE(p.current_job_title, p.profession, p.current_position) AS role,
        COALESCE(p.current_company, p.establishment) AS company_name,
        p.public_profile_url,
        CASE
          WHEN p.city IS NOT NULL AND p.city = $2 THEN 4
          WHEN p.current_industry IS NOT NULL AND p.current_industry = $3 THEN 3
          WHEN p.membership_tier IN ('Gold', 'Platinum') THEN 2
          WHEN p.identity_verified = TRUE THEN 1
          ELSE 0
        END AS score
      FROM profiles p
      LEFT JOIN connections c
        ON (
          (c.requester_id = $1 AND c.receiver_id = p.user_id)
          OR (c.requester_id = p.user_id AND c.receiver_id = $1)
        )
      WHERE p.user_id <> $1
        AND p.public_profile_url IS NOT NULL
        AND c.id IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM app_notifications n
          WHERE n.user_id = $1
            AND n.type = 'recommendation'
            AND COALESCE(n.metadata->>'suggestedUserId', '') = p.user_id::text
        )
      ORDER BY score DESC, p.updated_at DESC
      LIMIT $4
    `,
    [userId, p.city || null, p.current_industry || null, remainingSlots]
  );

  for (const row of result.rows) {
    const actorName =
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
      row.company_name ||
      "Profil recommande";
    const detail = [row.role, row.company_name].filter(Boolean).join(" - ");

    await createNotification(userId, {
      actorUserId: Number(row.user_id),
      type: "recommendation",
      category: "recommendations",
      priority: "recommendation",
      title: "Suggestion de profil",
      message: detail ? `${actorName} peut correspondre a votre reseau : ${detail}.` : `${actorName} peut correspondre a votre reseau.`,
      preview: detail || actorName,
      href: `/profile/${row.public_profile_url}`,
      actorName,
      metadata: {
        suggestedUserId: row.user_id,
        source: "profile_suggestions",
      },
    });
  }
}

// MODULE M3-03 - Recherche avancee membres: alertes sur nouveaux profils.
async function syncSavedSearchNotifications(userId) {
  const searches = await query(
    `
      SELECT *
      FROM saved_member_searches
      WHERE user_id = $1
        AND alert_enabled = TRUE
        AND (last_checked_at IS NULL OR last_checked_at < CURRENT_TIMESTAMP - INTERVAL '6 hours')
      ORDER BY updated_at DESC
      LIMIT 10
    `,
    [userId]
  );

  for (const row of searches.rows) {
    const filters = buildProfileSearchFilters({ ...parseJsonObject(row.filters, {}), q: row.query_text || "" });
    const matches = await runMemberSearch({
      filters,
      sort: row.sort_order,
      limit: 5,
      since: row.last_checked_at || row.created_at,
      viewerId: userId,
    });

    if (matches.length) {
      await createNotification(userId, {
        actorUserId: matches[0].userId,
        type: "recommendation",
        category: "recommendations",
        priority: "recommendation",
        title: "Nouveaux profils pour votre recherche",
        message: `${matches.length} nouveau(x) profil(s) correspondent a "${row.name}".`,
        preview: matches.map((item) => item.fullName).filter(Boolean).slice(0, 3).join(", "),
        href: `/search?q=${encodeURIComponent(row.query_text || "")}`,
        metadata: {
          savedSearchId: row.id,
          matchCount: matches.length,
          source: "saved_member_search",
        },
      });

      await query(
        "UPDATE saved_member_searches SET last_notified_at = CURRENT_TIMESTAMP, last_checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [row.id]
      );
    } else {
      await query("UPDATE saved_member_searches SET last_checked_at = CURRENT_TIMESTAMP WHERE id = $1", [row.id]);
    }
  }
}

function extractNotificationIds(req) {
  const ids = req.body?.ids || req.body?.notificationIds || req.body?.id || req.params.id;
  const list = Array.isArray(ids) ? ids : [ids];
  return list.map((item) => cleanString(item)).filter(Boolean).slice(0, 100);
}

function countsForNotifications(items) {
  const counts = {
    all: 0,
    unread: 0,
    network: 0,
    messages: 0,
    profile: 0,
    security: 0,
    publications: 0,
    recommendations: 0,
    system: 0,
    archived: 0,
  };

  for (const item of items) {
    if (item.archivedAt) {
      counts.archived += 1;
      continue;
    }

    counts.all += 1;
    if (!item.read) counts.unread += 1;
    if (counts[item.category] !== undefined) counts[item.category] += 1;
  }

  return counts;
}

async function listNotifications(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  await syncUnreadMessageNotifications(user.id);
  await syncRecommendationNotifications(user.id);
  await syncSavedSearchNotifications(user.id);
  const selectedCategory = normalizeNotificationCategory(
    req.path && req.path.includes("unread") ? "unread" : req.query.category || req.query.filter || "all"
  );
  const limit = Math.min(Math.max(toPositiveInt(req.query.limit, 30), 1), 60);
  const offset = toOffsetInt(req.query.offset, 0);

  await query(
    "DELETE FROM app_notifications WHERE user_id = $1 AND archived_at IS NOT NULL AND archived_at < CURRENT_TIMESTAMP - INTERVAL '120 days'",
    [user.id]
  );

  const appItems = await query(
    `
      SELECT n.*, u.username AS actor_username, p.profile_picture_url AS actor_avatar,
        COUNT(*) OVER (PARTITION BY n.user_id, n.type, COALESCE(n.href, n.title), date_trunc('day', n.created_at)) AS group_count,
        CONCAT(n.type, ':', COALESCE(n.href, n.title), ':', date_trunc('day', n.created_at)::text) AS group_key
      FROM app_notifications n
      LEFT JOIN users u ON u.id = n.actor_user_id
      LEFT JOIN profiles p ON p.user_id = n.actor_user_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 160
    `,
    [user.id]
  );
  const verificationItems = await query(
    `
      SELECT id, 'verification' AS type, 'profile' AS category, 'validation' AS priority,
        title, message, NULL AS href, NULL AS actor_user_id, NULL AS actor_name, NULL AS actor_avatar_url,
        message AS preview, created_at, read_at, NULL AS archived_at
      FROM verification_notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `,
    [user.id]
  );
  const data = [...appItems.rows, ...verificationItems.rows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(mapAppNotification);
  const counts = countsForNotifications(data);
  const filtered = data.filter((item) => {
    if (selectedCategory === "archived") return Boolean(item.archivedAt);
    if (item.archivedAt) return false;
    if (selectedCategory === "unread") return !item.read;
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });
  const paged = filtered.slice(offset, offset + limit);

  return res.json({
    success: true,
    count: counts.unread,
    counts,
    page: { limit, offset, hasMore: offset + limit < filtered.length },
    settings: await getNotificationSettings(user.id),
    data: paged,
  });
}

async function markNotificationRead(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const ids = extractNotificationIds(req);
  if (!ids.length) {
    return res.status(400).json({ success: false, error: "Notification introuvable." });
  }

  const appResult = await query(
    "UPDATE app_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id::text = ANY($1::text[]) AND user_id = $2 RETURNING id",
    [ids, user.id]
  );

  await query(
    "UPDATE verification_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id::text = ANY($1::text[]) AND user_id = $2",
    [ids, user.id]
  );

  notificationEvents.emit("notifications:event", {
    userIds: [Number(user.id)],
    event: "notification:updated",
    payload: { ids, read: true },
  });

  return res.json({ success: true, updated: appResult.rowCount });
}

async function markMessageNotificationsRead(userId, conversationId) {
  await ensureHomeSchema();
  const result = await query(
    `
      UPDATE app_notifications
      SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE user_id = $1
        AND category = 'messages'
        AND COALESCE(metadata->>'conversationId', '') = $2
        AND read_at IS NULL
      RETURNING id
    `,
    [userId, conversationId]
  );

  if (result.rowCount) {
    notificationEvents.emit("notifications:event", {
      userIds: [Number(userId)],
      event: "notification:updated",
      payload: {
        ids: result.rows.map((row) => String(row.id)),
        read: true,
        conversationId,
      },
    });
  }

  return result.rowCount;
}

async function deleteNotification(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const id = cleanString(req.params.id || req.params.notificationId);
  const ids = id ? [id] : extractNotificationIds(req);
  if (!ids.length) {
    return res.status(400).json({ success: false, error: "Notification introuvable." });
  }

  const appResult = await query("DELETE FROM app_notifications WHERE id::text = ANY($1::text[]) AND user_id = $2", [
    ids,
    user.id,
  ]);

  if (!appResult.rowCount) {
    await query("DELETE FROM verification_notifications WHERE id::text = ANY($1::text[]) AND user_id = $2", [
      ids,
      user.id,
    ]);
  }

  notificationEvents.emit("notifications:event", {
    userIds: [Number(user.id)],
    event: "notification:deleted",
    payload: { ids },
  });

  return res.json({ success: true, deleted: appResult.rowCount });
}

async function markAllNotificationsRead(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  await query("UPDATE app_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = $1", [user.id]);
  await query("UPDATE verification_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = $1", [
    user.id,
  ]);
  notificationEvents.emit("notifications:event", {
    userIds: [Number(user.id)],
    event: "notification:updated",
    payload: { allRead: true },
  });
  return res.json({ success: true });
}

async function archiveNotifications(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const ids = extractNotificationIds(req);
  if (!ids.length) {
    return res.status(400).json({ success: false, error: "Notification introuvable." });
  }

  const result = await query(
    "UPDATE app_notifications SET archived_at = COALESCE(archived_at, CURRENT_TIMESTAMP), read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id::text = ANY($1::text[]) AND user_id = $2 RETURNING id",
    [ids, user.id]
  );

  notificationEvents.emit("notifications:event", {
    userIds: [Number(user.id)],
    event: "notification:updated",
    payload: { ids, archived: true },
  });

  return res.json({ success: true, archived: result.rowCount });
}

async function saveNotificationSettings(req, res) {
  await ensureHomeSchema();
  const user = await ensureUser(req);
  const current = await getNotificationSettings(user.id);
  const next = { ...current };
  const boolKeys = [
    "soundsEnabled",
    "emailEnabled",
    "pushEnabled",
    "networkEnabled",
    "messagesEnabled",
    "securityEnabled",
    "profileEnabled",
    "premiumEnabled",
  ];

  for (const key of boolKeys) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
      next[key] = Boolean(req.body[key]);
    }
  }

  if (Array.isArray(req.body?.mutedTypes)) {
    next.mutedTypes = req.body.mutedTypes.map((item) => normalizeNotificationType(item)).slice(0, 40);
  }

  const result = await query(
    `
      UPDATE notification_settings
      SET sounds_enabled = $2,
          email_enabled = $3,
          push_enabled = $4,
          network_enabled = $5,
          messages_enabled = $6,
          security_enabled = $7,
          profile_enabled = $8,
          premium_enabled = $9,
          muted_types = $10::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `,
    [
      user.id,
      next.soundsEnabled,
      next.emailEnabled,
      next.pushEnabled,
      next.networkEnabled,
      next.messagesEnabled,
      next.securityEnabled,
      next.profileEnabled,
      next.premiumEnabled,
      JSON.stringify(next.mutedTypes || []),
    ]
  );

  return res.json({ success: true, data: mapNotificationSettings(result.rows[0]) });
}

function attachNotificationsRealtime(io) {
  notificationEvents.on("notifications:event", ({ userIds, event, payload }) => {
    for (const userId of userIds || []) {
      io.to(`user:${userId}`).emit(event, payload);
    }
  });
}

async function checkoutSubscription(req, res) {
  await ensureHomeSchema();
  await ensureUser(req);
  const plan = cleanString(req.body.plan || req.query.plan || "gold").toLowerCase();

  if (!["silver", "gold", "platinum"].includes(plan)) {
    return res.status(400).json({ success: false, error: "Plan invalide" });
  }

  return res.status(202).json({
    success: true,
    manualActivation: true,
    plan,
    checkoutUrl: `/checkout?plan=${plan}`,
    message: "Le checkout est pret. Connectez le processeur de paiement pour activer le paiement direct.",
  });
}

function createHomePostsRouter() {
  const router = express.Router();

  router.get("/feed", asyncHandler(listFeedPosts));
  router.get("/me", asyncHandler(async (req, res) => {
    req.query.limit = req.query.limit || "80";
    return listFeedPosts(req, res);
  }));
  router.post("/", postUpload.single("file"), asyncHandler(createPost));
  router.put("/:id", asyncHandler(updatePost));
  router.patch("/:id", asyncHandler(updatePost));
  router.delete("/:id", asyncHandler(deletePost));
  router.post("/:id/like", asyncHandler(togglePostLike));
  router.post("/:id/save", asyncHandler(togglePostSave));
  router.delete("/:id/save", asyncHandler(togglePostSave));
  router.post("/:id/share", asyncHandler(sharePost));
  router.get("/:id/comments", asyncHandler(listComments));
  router.post("/:id/comments", asyncHandler(createComment));
  router.post("/:id/comment", asyncHandler(createComment));

  return router;
}

function createHomeCommentsRouter() {
  const router = express.Router();

  router.put("/:id", asyncHandler(updateComment));
  router.delete("/:id", asyncHandler(deleteComment));

  return router;
}

// MODULE M3-02 - Routes de suggestions/matching exposees sous /api/profiles.
function createHomeProfilesRouter() {
  const router = express.Router();

  router.get("/suggestions", asyncHandler(listSuggestions));
  router.get("/:username", asyncHandler(async (req, res) => {
    const username = safeSlug(req.params.username);
    const result = await query(
      `
        SELECT p.*, u.username
        FROM profiles p
        JOIN users u ON u.id = p.user_id
        WHERE p.public_profile_url = $1 OR u.username = $1
        LIMIT 1
      `,
      [username]
    );

    return res.status(result.rowCount ? 200 : 404).json({
      success: result.rowCount > 0,
      data: result.rowCount ? mapSuggestion(result.rows[0], 0) : null,
    });
  }));

  return router;
}

// MODULE M3-01 - Routes de connexions exposees sous /api/connections.
function createHomeConnectionsRouter() {
  const router = express.Router();

  router.get("/", asyncHandler(listConnections));
  router.post("/request", asyncHandler(requestConnection));
  router.post("/:userId/accept", asyncHandler(acceptConnection));
  router.post("/:userId/refuse", asyncHandler(refuseConnection));
  router.post("/:userId/reject", asyncHandler(refuseConnection));
  router.post("/:userId/block", asyncHandler(blockConnection));
  router.delete("/:userId", asyncHandler(removeConnection));

  return router;
}

function createHomeEventsRouter() {
  const router = express.Router();

  router.get("/", asyncHandler(listEvents));
  router.post("/:id/join", asyncHandler(joinEvent));
  router.delete("/:id/join", asyncHandler(leaveEvent));

  return router;
}

function createHomeNotificationsRouter() {
  const router = express.Router();

  router.get("/", asyncHandler(listNotifications));
  router.get("/unread", asyncHandler(listNotifications));
  router.post("/read", asyncHandler(markNotificationRead));
  router.post("/read-all", asyncHandler(markAllNotificationsRead));
  router.post("/archive", asyncHandler(archiveNotifications));
  router.post("/settings", asyncHandler(saveNotificationSettings));
  router.post("/:id/read", asyncHandler(markNotificationRead));
  router.delete("/:id", asyncHandler(deleteNotification));

  return router;
}

// MODULE M3-03 - Routes de recherche membres exposees sous /api/search.
function createHomeSearchRouter() {
  const router = express.Router();

  router.get("/saved", asyncHandler(listSavedMemberSearches));
  router.post("/saved", asyncHandler(createSavedMemberSearch));
  router.delete("/saved/:id", asyncHandler(deleteSavedMemberSearch));
  router.get("/", asyncHandler(searchAll));

  return router;
}

function createSavedPostsRouter() {
  const router = express.Router();

  router.get("/", asyncHandler(listSavedPosts));

  return router;
}

function createHomeSubscriptionsRouter() {
  const router = express.Router();

  router.post("/checkout", asyncHandler(checkoutSubscription));

  return router;
}

module.exports = {
  attachNotificationsRealtime,
  createNotification,
  createHomeCommentsRouter,
  createHomeConnectionsRouter,
  createHomeEventsRouter,
  createHomeNotificationsRouter,
  createHomePostsRouter,
  createHomeProfilesRouter,
  createHomeSearchRouter,
  createHomeSubscriptionsRouter,
  createSavedPostsRouter,
  ensureHomeSchema,
  markMessageNotificationsRead,
  postsUploadsRoot,
};
