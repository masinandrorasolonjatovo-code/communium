const EventEmitter = require("events");
const crypto = require("crypto");
const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");
const { Server } = require("socket.io");
const {
  asyncHandler,
  cleanString,
  ensureUser,
  httpError,
  query,
  toIso,
  toPositiveInt,
} = require("./profileModule");
const { createNotification, markMessageNotificationsRead } = require("./homeModule");

const messagesUploadsRoot = path.resolve(__dirname, "..", "uploads", "messages");
const messagesEvents = new EventEmitter();
const activePresence = new Map();
const messageRateLimits = new Map();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 8,
  },
});

let schemaReadyPromise;

function normalizeConversationType(value) {
  return value === "group" ? "group" : "direct";
}

function normalizeEphemeralMode(value) {
  if (["24h", "7d", "read_once"].includes(value)) {
    return value;
  }

  return "off";
}

function normalizeMessageType(value) {
  if (["text", "file", "image", "video", "audio", "voice", "system"].includes(value)) {
    return value;
  }

  return "text";
}

function normalizeGroupRole(value) {
  return ["owner", "admin", "member"].includes(value) ? value : "member";
}

function permissionsForRole(role) {
  const normalized = normalizeGroupRole(role);

  return {
    send: true,
    invite: normalized === "owner" || normalized === "admin",
    manage: normalized === "owner" || normalized === "admin",
  };
}

function normalizeThemeColor(value) {
  const cleaned = cleanString(value);
  return /^#[0-9a-f]{6}$/iu.test(cleaned || "") ? cleaned : "#1d4ed8";
}

function normalizeBackground(value) {
  if (["clean", "soft", "focus", "dark"].includes(value)) {
    return value;
  }

  return "clean";
}

function sanitizeMessageBody(value) {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return "";
  }

  if (cleaned.length > 5000) {
    throw httpError(400, "Message trop long");
  }

  return cleaned;
}

function attachmentCategory(mimeType, fileName = "") {
  const lowerName = String(fileName).toLowerCase();
  const mime = String(mimeType || "").toLowerCase();

  if (mime.startsWith("image/")) {
    return lowerName.endsWith(".gif") ? "gif" : "image";
  }

  if (mime.startsWith("video/")) {
    return "video";
  }

  if (mime.startsWith("audio/")) {
    return "audio";
  }

  if (lowerName.endsWith(".pdf") || lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) {
    return lowerName.includes("cv") || lowerName.includes("resume") ? "cv" : "document";
  }

  return "document";
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function createId() {
  return crypto.randomUUID();
}

function messageExpiry(mode) {
  const now = Date.now();

  if (mode === "24h") {
    return new Date(now + 24 * 60 * 60 * 1000);
  }

  if (mode === "7d") {
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }

  return null;
}

function enforceMessageRateLimit(req, userId, action, max = 80, windowMs = 60 * 1000) {
  const forwarded = Array.isArray(req.headers["x-forwarded-for"])
    ? req.headers["x-forwarded-for"][0]
    : req.headers["x-forwarded-for"];
  const ip = cleanString(forwarded) || cleanString(req.ip) || "unknown-ip";
  const key = `${action}:${userId}:${ip}`;
  const now = Date.now();
  const recent = (messageRateLimits.get(key) || []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= max) {
    throw httpError(429, "Trop d'actions de messagerie. Reessayez dans un instant.");
  }

  recent.push(now);
  messageRateLimits.set(key, recent);
}

async function ensureMessagesSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS message_conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(16) NOT NULL DEFAULT 'direct',
        title VARCHAR(160),
        theme_color VARCHAR(32) NOT NULL DEFAULT '#1d4ed8',
        background VARCHAR(32) NOT NULL DEFAULT 'clean',
        ephemeral_mode VARCHAR(24) NOT NULL DEFAULT 'off',
        is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS message_members (
        conversation_id UUID NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(24) NOT NULL DEFAULT 'member',
        permissions JSONB NOT NULL DEFAULT '{"send":true,"invite":false,"manage":false}'::jsonb,
        notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        pinned BOOLEAN NOT NULL DEFAULT FALSE,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        muted_until TIMESTAMP,
        blocked BOOLEAN NOT NULL DEFAULT FALSE,
        unread_count INTEGER NOT NULL DEFAULT 0,
        last_read_at TIMESTAMP,
        last_read_message_id UUID,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (conversation_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS message_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT,
        message_type VARCHAR(24) NOT NULL DEFAULT 'text',
        status VARCHAR(24) NOT NULL DEFAULT 'sent',
        reply_to UUID REFERENCES message_messages(id) ON DELETE SET NULL,
        edited_at TIMESTAMP,
        deleted_for_everyone_at TIMESTAMP,
        ephemeral_mode VARCHAR(24) NOT NULL DEFAULT 'off',
        expires_at TIMESTAMP,
        read_once BOOLEAN NOT NULL DEFAULT FALSE,
        reactions JSONB NOT NULL DEFAULT '[]'::jsonb,
        saved_by JSONB NOT NULL DEFAULT '[]'::jsonb,
        pinned_by JSONB NOT NULL DEFAULT '[]'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE message_messages
        ADD COLUMN IF NOT EXISTS pinned_by JSONB NOT NULL DEFAULT '[]'::jsonb;

      CREATE TABLE IF NOT EXISTS message_hidden_messages (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_id UUID NOT NULL REFERENCES message_messages(id) ON DELETE CASCADE,
        hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, message_id)
      );

      CREATE TABLE IF NOT EXISTS message_attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id UUID REFERENCES message_messages(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES message_conversations(id) ON DELETE CASCADE,
        uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        file_name VARCHAR(240) NOT NULL,
        mime_type VARCHAR(120),
        file_size INTEGER NOT NULL DEFAULT 0,
        category VARCHAR(24) NOT NULL DEFAULT 'document',
        upload_progress INTEGER NOT NULL DEFAULT 100,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS message_blocks (
        blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blocker_id, blocked_user_id)
      );

      CREATE TABLE IF NOT EXISTS message_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES message_conversations(id) ON DELETE SET NULL,
        message_id UUID REFERENCES message_messages(id) ON DELETE SET NULL,
        reason TEXT,
        status VARCHAR(24) NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS message_security_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(80) NOT NULL,
        conversation_id UUID,
        message_id UUID,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_message_members_user ON message_members(user_id, archived, pinned);
      CREATE INDEX IF NOT EXISTS idx_message_messages_conversation ON message_messages(conversation_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_message_attachments_conversation ON message_attachments(conversation_id, category);
      CREATE INDEX IF NOT EXISTS idx_message_blocks_blocker ON message_blocks(blocker_id, blocked_user_id);
    `);
  }

  return schemaReadyPromise;
}

async function logMessageSecurity(userId, action, { conversationId = null, messageId = null, metadata = {} } = {}) {
  await ensureMessagesSchema();
  await query(
    `
      INSERT INTO message_security_logs (user_id, action, conversation_id, message_id, metadata)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [userId || null, action, conversationId, messageId, JSON.stringify(metadata || {})]
  );
}

async function getMember(conversationId, userId) {
  await ensureMessagesSchema();
  const result = await query(
    "SELECT * FROM message_members WHERE conversation_id = $1 AND user_id = $2",
    [conversationId, userId]
  );

  return result.rows[0] || null;
}

async function assertConversationMember(conversationId, userId) {
  const member = await getMember(conversationId, userId);

  if (!member) {
    throw httpError(404, "Conversation introuvable");
  }

  if (member.blocked) {
    throw httpError(403, "Conversation bloquee");
  }

  return member;
}

async function assertGroupManager(conversationId, userId) {
  const member = await assertConversationMember(conversationId, userId);
  const conversation = await query("SELECT type FROM message_conversations WHERE id = $1", [conversationId]);

  if (!conversation.rowCount || conversation.rows[0].type !== "group") {
    throw httpError(400, "Cette action concerne uniquement les groupes");
  }

  const permissions = parseJson(member.permissions, {});
  const role = normalizeGroupRole(member.role);

  if (role !== "owner" && role !== "admin" && !permissions.manage) {
    throw httpError(403, "Permission groupe insuffisante");
  }

  return member;
}

async function conversationUserIds(conversationId) {
  await ensureMessagesSchema();
  const result = await query(
    "SELECT user_id FROM message_members WHERE conversation_id = $1",
    [conversationId]
  );

  return result.rows.map((row) => Number(row.user_id));
}

async function conversationNotificationRecipients(conversationId, senderId) {
  await ensureMessagesSchema();
  const result = await query(
    `
      SELECT user_id
      FROM message_members
      WHERE conversation_id = $1
        AND user_id <> $2
        AND blocked = FALSE
        AND notifications_enabled = TRUE
        AND (muted_until IS NULL OR muted_until < CURRENT_TIMESTAMP)
    `,
    [conversationId, senderId]
  );

  return result.rows.map((row) => Number(row.user_id)).filter(Boolean);
}

async function senderDisplayName(userId, fallback = "Un membre") {
  const result = await query(
    `
      SELECT u.username, p.first_name, p.last_name
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );
  const row = result.rows[0] || {};
  return [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.username || fallback;
}

function messageNotificationPreview(message) {
  if (message.body) {
    return message.body.slice(0, 180);
  }

  if (message.attachments?.length) {
    const attachment = message.attachments[0];
    if (attachment.category === "image") return "Image envoyee";
    if (attachment.category === "video") return "Video envoyee";
    if (attachment.category === "audio" || attachment.category === "voice") return "Message vocal envoye";
    return attachment.fileName || "Piece jointe envoyee";
  }

  return "Nouveau message";
}

async function createMessageNotifications(conversationId, senderId, message) {
  const recipients = await conversationNotificationRecipients(conversationId, senderId);
  if (!recipients.length) {
    return;
  }

  const actorName = await senderDisplayName(senderId);
  const preview = messageNotificationPreview(message);
  const href = `/messages?conversation=${conversationId}`;

  await Promise.all(
    recipients.map((recipientId) =>
      createNotification(recipientId, {
        actorUserId: senderId,
        type: "message",
        category: "messages",
        priority: "message",
        title: `Nouveau message de ${actorName}`,
        message: preview,
        preview,
        href,
        actorName,
        metadata: {
          conversationId,
          messageId: message.id,
        },
      })
    )
  );
}

async function mapUser(row) {
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return {
    id: Number(row.id || row.user_id),
    username: row.username,
    email: row.email || row.user_email,
    fullName: fullName || row.username || row.email || `Membre ${row.id || row.user_id}`,
    firstName: row.first_name || null,
    lastName: row.last_name || null,
    company: row.current_company || null,
    role: row.current_job_title || row.profession || row.role || null,
    accountType: row.account_type || "PERSONAL",
    profilePictureUrl: row.profile_picture_url || null,
    publicProfileUrl: row.public_profile_url || null,
    online: activePresence.has(Number(row.id || row.user_id)),
  };
}

async function loadConversationMembers(conversationId) {
  const result = await query(
    `
      SELECT
        mm.*,
        u.username,
        u.email,
        u.role AS user_role,
        u.account_type,
        p.first_name,
        p.last_name,
        p.current_company,
        p.current_job_title,
        p.profession,
        p.profile_picture_url,
        p.public_profile_url,
        COALESCE(p.updated_at, u.updated_at, u.created_at) AS sort_updated_at
      FROM message_members mm
      JOIN users u ON u.id = mm.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE mm.conversation_id = $1
      ORDER BY
        CASE mm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
        COALESCE(p.first_name, u.username)
    `,
    [conversationId]
  );

  return Promise.all(
    result.rows.map(async (row) => ({
      ...(await mapUser(row)),
      membership: {
        role: row.role,
        permissions: parseJson(row.permissions, {}),
        notificationsEnabled: row.notifications_enabled,
        pinned: row.pinned,
        archived: row.archived,
        mutedUntil: toIso(row.muted_until),
        blocked: row.blocked,
        unreadCount: Number(row.unread_count || 0),
        lastReadAt: toIso(row.last_read_at),
      },
    }))
  );
}

function mapAttachment(row) {
  return {
    id: row.id,
    messageId: row.message_id,
    conversationId: row.conversation_id,
    uploaderId: Number(row.uploader_id),
    fileUrl: row.file_url,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size || 0),
    category: row.category,
    uploadProgress: Number(row.upload_progress || 100),
    metadata: parseJson(row.metadata, {}),
    createdAt: toIso(row.created_at),
  };
}

function mapMessage(row, attachments = []) {
  const deleted = Boolean(row.deleted_for_everyone_at);

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: Number(row.sender_id),
    body: deleted ? "" : row.body || "",
    messageType: row.message_type,
    status: row.status,
    replyTo: row.reply_to,
    editedAt: toIso(row.edited_at),
    deletedForEveryoneAt: toIso(row.deleted_for_everyone_at),
    ephemeralMode: row.ephemeral_mode,
    expiresAt: toIso(row.expires_at),
    readOnce: row.read_once,
    reactions: parseJson(row.reactions, []),
    savedBy: parseJson(row.saved_by, []),
    pinnedBy: parseJson(row.pinned_by, []),
    metadata: parseJson(row.metadata, {}),
    attachments,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function loadAttachmentsForMessages(messageIds) {
  if (!messageIds.length) {
    return new Map();
  }

  const result = await query(
    `
      SELECT *
      FROM message_attachments
      WHERE message_id = ANY($1::uuid[])
      ORDER BY created_at ASC
    `,
    [messageIds]
  );
  const grouped = new Map();

  for (const row of result.rows) {
    const item = mapAttachment(row);
    grouped.set(item.messageId, [...(grouped.get(item.messageId) || []), item]);
  }

  return grouped;
}

async function loadMessages(conversationId, userId, { limit = 80, search = "" } = {}) {
  const params = [conversationId, userId, Math.min(toPositiveInt(limit, 80), 200)];
  const where = [
    "m.conversation_id = $1",
    "hm.message_id IS NULL",
    "(m.expires_at IS NULL OR m.expires_at > CURRENT_TIMESTAMP)",
  ];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(m.body ILIKE $${params.length} OR EXISTS (
      SELECT 1 FROM message_attachments ma
      WHERE ma.message_id = m.id AND ma.file_name ILIKE $${params.length}
    ))`);
  }

  const result = await query(
    `
      SELECT m.*
      FROM message_messages m
      LEFT JOIN message_hidden_messages hm ON hm.message_id = m.id AND hm.user_id = $2
      WHERE ${where.join(" AND ")}
      ORDER BY m.created_at DESC
      LIMIT $3
    `,
    params
  );
  const rows = [...result.rows].reverse();
  const attachmentsByMessage = await loadAttachmentsForMessages(rows.map((row) => row.id));

  return rows.map((row) => mapMessage(row, attachmentsByMessage.get(row.id) || []));
}

async function loadMedia(conversationId) {
  const result = await query(
    `
      SELECT *
      FROM message_attachments
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT 80
    `,
    [conversationId]
  );
  const media = {
    photos: [],
    videos: [],
    documents: [],
    links: [],
    audio: [],
  };

  for (const row of result.rows) {
    const item = mapAttachment(row);
    if (item.category === "image" || item.category === "gif") {
      media.photos.push(item);
    } else if (item.category === "video") {
      media.videos.push(item);
    } else if (item.category === "audio" || item.category === "voice") {
      media.audio.push(item);
    } else {
      media.documents.push(item);
    }
  }

  const linksResult = await query(
    `
      SELECT id, body, created_at
      FROM message_messages
      WHERE conversation_id = $1
        AND deleted_for_everyone_at IS NULL
        AND body ~* 'https?://'
      ORDER BY created_at DESC
      LIMIT 40
    `,
    [conversationId]
  );

  media.links = linksResult.rows.flatMap((row) => {
    const urls = String(row.body || "").match(/https?:\/\/[^\s]+/giu) || [];
    return urls.map((url) => ({
      id: `${row.id}:${url}`,
      messageId: row.id,
      url,
      createdAt: toIso(row.created_at),
    }));
  });

  return media;
}

async function conversationSummary(conversationId, userId) {
  const result = await query(
    `
      SELECT c.*, mm.pinned, mm.archived, mm.muted_until, mm.notifications_enabled,
             mm.unread_count, mm.last_read_at, mm.role AS my_role
      FROM message_conversations c
      JOIN message_members mm ON mm.conversation_id = c.id
      WHERE c.id = $1 AND mm.user_id = $2
    `,
    [conversationId, userId]
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];
  const [members, lastMessages] = await Promise.all([
    loadConversationMembers(conversationId),
    loadMessages(conversationId, userId, { limit: 1 }),
  ]);
  const lastMessage = lastMessages[0] || null;
  const otherMembers = members.filter((member) => member.id !== Number(userId));
  const directMember = otherMembers[0] || members[0];
  const title = row.type === "group" ? row.title || "Groupe Communium" : directMember?.fullName || "Conversation";

  return {
    id: row.id,
    type: row.type,
    title,
    subtitle:
      row.type === "group"
        ? `${members.length} membres`
        : [directMember?.role, directMember?.company].filter(Boolean).join(" - "),
    avatarUrl: row.type === "direct" ? directMember?.profilePictureUrl || null : null,
    themeColor: row.theme_color,
    background: row.background,
    ephemeralMode: row.ephemeral_mode,
    isEncrypted: row.is_encrypted,
    pinned: row.pinned,
    archived: row.archived,
    mutedUntil: toIso(row.muted_until),
    notificationsEnabled: row.notifications_enabled,
    unreadCount: Number(row.unread_count || 0),
    myRole: row.my_role,
    members,
    lastMessage,
    lastMessageAt: toIso(row.last_message_at || row.updated_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function listSuggestions(userId) {
  await ensureMessagesSchema();
  const result = await query(
    `
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.account_type,
        p.first_name,
        p.last_name,
        p.current_company,
        p.current_job_title,
        p.profession,
        p.profile_picture_url,
        p.public_profile_url
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id <> $1
        AND NOT EXISTS (
          SELECT 1 FROM message_blocks b
          WHERE b.blocker_id = $1 AND b.blocked_user_id = u.id
        )
      ORDER BY COALESCE(p.updated_at, u.updated_at, u.created_at) DESC
      LIMIT 16
    `,
    [userId]
  );

  return Promise.all(result.rows.map(mapUser));
}

async function listConversations(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const filter = cleanString(req.query.filter) || "all";
  const search = cleanString(req.query.q) || "";
  const params = [user.id];
  const where = ["mm.user_id = $1", "mm.blocked = FALSE"];

  if (filter === "unread") {
    where.push("mm.unread_count > 0");
  } else if (filter === "favorites") {
    where.push("mm.pinned = TRUE");
  } else if (filter === "archived") {
    where.push("mm.archived = TRUE");
  } else if (filter === "groups") {
    where.push("c.type = 'group'");
    where.push("mm.archived = FALSE");
  } else if (filter === "network") {
    where.push("c.type = 'direct'");
    where.push("mm.archived = FALSE");
  } else if (filter === "companies") {
    where.push(`EXISTS (
      SELECT 1 FROM message_members m2
      JOIN users u2 ON u2.id = m2.user_id
      WHERE m2.conversation_id = c.id AND u2.account_type = 'BUSINESS'
    )`);
    where.push("mm.archived = FALSE");
  } else {
    where.push("mm.archived = FALSE");
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(
      c.title ILIKE $${params.length}
      OR EXISTS (
        SELECT 1
        FROM message_members sm
        JOIN users su ON su.id = sm.user_id
        LEFT JOIN profiles sp ON sp.user_id = su.id
        WHERE sm.conversation_id = c.id
          AND (
            su.username ILIKE $${params.length}
            OR su.email ILIKE $${params.length}
            OR sp.first_name ILIKE $${params.length}
            OR sp.last_name ILIKE $${params.length}
            OR sp.current_company ILIKE $${params.length}
          )
      )
    )`);
  }

  const result = await query(
    `
      SELECT c.id
      FROM message_conversations c
      JOIN message_members mm ON mm.conversation_id = c.id
      WHERE ${where.join(" AND ")}
      ORDER BY mm.pinned DESC, c.last_message_at DESC, c.updated_at DESC
      LIMIT 80
    `,
    params
  );

  const conversations = (
    await Promise.all(result.rows.map((row) => conversationSummary(row.id, user.id)))
  ).filter(Boolean);

  return res.json({
    success: true,
    currentUser: {
      id: Number(user.id),
      username: user.username,
      email: user.email,
      accountType: user.accountType || user.account_type || "PERSONAL",
    },
    conversations,
    suggestions: await listSuggestions(user.id),
    filters: {
      all: conversations.length,
      unread: conversations.filter((item) => item.unreadCount > 0).length,
      favorites: conversations.filter((item) => item.pinned).length,
      archived: conversations.filter((item) => item.archived).length,
      groups: conversations.filter((item) => item.type === "group").length,
    },
  });
}

async function findExistingDirectConversation(userId, participantId) {
  const result = await query(
    `
      SELECT c.id
      FROM message_conversations c
      JOIN message_members mine ON mine.conversation_id = c.id AND mine.user_id = $1
      JOIN message_members other ON other.conversation_id = c.id AND other.user_id = $2
      WHERE c.type = 'direct'
      LIMIT 1
    `,
    [userId, participantId]
  );

  return result.rows[0]?.id || null;
}

async function createConversation(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  enforceMessageRateLimit(req, user.id, "conversation:create", 20);

  const type = normalizeConversationType(req.body.type);
  const participantIds = [...new Set((req.body.participantIds || []).map((id) => toPositiveInt(id, 0)).filter(Boolean))].filter(
    (id) => id !== Number(user.id)
  );

  if (participantIds.length === 0) {
    return res.status(400).json({ success: false, error: "Selectionnez au moins un membre" });
  }

  if (type === "direct" && participantIds.length === 1) {
    const existingId = await findExistingDirectConversation(user.id, participantIds[0]);
    if (existingId) {
      return res.json({ success: true, conversation: await conversationSummary(existingId, user.id) });
    }
  }

  const conversationResult = await query(
    `
      INSERT INTO message_conversations (type, title, theme_color, background, ephemeral_mode, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      type,
      type === "group" ? cleanString(req.body.title) || "Groupe Communium" : null,
      normalizeThemeColor(req.body.themeColor),
      normalizeBackground(req.body.background),
      normalizeEphemeralMode(req.body.ephemeralMode),
      user.id,
    ]
  );
  const conversationId = conversationResult.rows[0].id;
  const memberIds = [Number(user.id), ...participantIds];

  for (const memberId of memberIds) {
    const isOwner = memberId === Number(user.id);
    await query(
      `
        INSERT INTO message_members (conversation_id, user_id, role, permissions)
        VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT (conversation_id, user_id) DO NOTHING
      `,
      [
        conversationId,
        memberId,
        isOwner ? "owner" : "member",
        JSON.stringify({
          send: true,
          invite: isOwner || type === "group",
          manage: isOwner,
        }),
      ]
    );
  }

  await logMessageSecurity(user.id, "conversation.create", { conversationId, metadata: { type, participantIds } });
  const conversation = await conversationSummary(conversationId, user.id);
  emitConversationUpdate(conversationId, "conversation:created", { conversationId });

  return res.status(201).json({ success: true, conversation });
}

async function getConversation(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.params.conversationId);
  await assertConversationMember(conversationId, user.id);
  const conversation = await conversationSummary(conversationId, user.id);
  const messages = await loadMessages(conversationId, user.id, { limit: req.query.limit || 120 });
  const media = await loadMedia(conversationId);

  return res.json({ success: true, conversation, messages, media });
}

async function sendMessage(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  enforceMessageRateLimit(req, user.id, "message:send", 90);
  const conversationId = cleanString(req.body.conversationId);
  const member = await assertConversationMember(conversationId, user.id);

  const blockedResult = await query(
    `
      SELECT 1
      FROM message_members mine
      JOIN message_members other ON other.conversation_id = mine.conversation_id AND other.user_id <> mine.user_id
      JOIN message_blocks b ON b.blocker_id = other.user_id AND b.blocked_user_id = mine.user_id
      WHERE mine.conversation_id = $1 AND mine.user_id = $2
      LIMIT 1
    `,
    [conversationId, user.id]
  );

  if (blockedResult.rowCount) {
    throw httpError(403, "Ce membre n'accepte pas de nouveaux messages");
  }

  const body = sanitizeMessageBody(req.body.body);
  const attachmentIds = Array.isArray(req.body.attachmentIds) ? req.body.attachmentIds.filter(Boolean) : [];

  if (!body && attachmentIds.length === 0) {
    return res.status(400).json({ success: false, error: "Message vide" });
  }

  const conversationResult = await query("SELECT ephemeral_mode FROM message_conversations WHERE id = $1", [
    conversationId,
  ]);
  const mode = normalizeEphemeralMode(req.body.ephemeralMode || conversationResult.rows[0]?.ephemeral_mode);
  const type = normalizeMessageType(req.body.messageType || (attachmentIds.length ? "file" : "text"));
  const expiresAt = messageExpiry(mode);
  const metadata = {
    encryption: "transport-and-storage-metadata",
    clientId: cleanString(req.body.clientId) || null,
  };
  const result = await query(
    `
      INSERT INTO message_messages
        (conversation_id, sender_id, body, message_type, reply_to, ephemeral_mode, expires_at, read_once, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      RETURNING *
    `,
    [
      conversationId,
      user.id,
      body,
      type,
      cleanString(req.body.replyTo) || null,
      mode,
      expiresAt,
      mode === "read_once",
      JSON.stringify(metadata),
    ]
  );
  let message = mapMessage(result.rows[0]);

  if (attachmentIds.length) {
    await query(
      `
        UPDATE message_attachments
        SET message_id = $1
        WHERE id = ANY($2::uuid[]) AND uploader_id = $3 AND conversation_id = $4
      `,
      [message.id, attachmentIds, user.id, conversationId]
    );
  }

  await query(
    `
      UPDATE message_conversations
      SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [conversationId]
  );
  await query(
    `
      UPDATE message_members
      SET unread_count = CASE WHEN user_id = $2 THEN 0 ELSE unread_count + 1 END,
          last_read_at = CASE WHEN user_id = $2 THEN CURRENT_TIMESTAMP ELSE last_read_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1
    `,
    [conversationId, user.id]
  );

  const attachments = await loadAttachmentsForMessages([message.id]);
  message = { ...message, attachments: attachments.get(message.id) || [] };
  await logMessageSecurity(user.id, "message.send", { conversationId, messageId: message.id });
  await createMessageNotifications(conversationId, user.id, message);
  emitConversationUpdate(conversationId, "message:new", { conversationId, message });

  return res.status(201).json({ success: true, message });
}

async function patchMessage(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const messageId = cleanString(req.params.id);
  const messageResult = await query("SELECT * FROM message_messages WHERE id = $1", [messageId]);

  if (!messageResult.rowCount) {
    throw httpError(404, "Message introuvable");
  }

  const messageRow = messageResult.rows[0];
  await assertConversationMember(messageRow.conversation_id, user.id);
  const action = cleanString(req.body.action) || "edit";

  if (action === "edit") {
    if (Number(messageRow.sender_id) !== Number(user.id)) {
      throw httpError(403, "Modification non autorisee");
    }

    const body = sanitizeMessageBody(req.body.body);
    await query(
      `
        UPDATE message_messages
        SET body = $1, edited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [body, messageId]
    );
    await logMessageSecurity(user.id, "message.edit", {
      conversationId: messageRow.conversation_id,
      messageId,
    });
  } else if (action === "react") {
    const emoji = cleanString(req.body.emoji) || "👍";
    const reactions = parseJson(messageRow.reactions, []).filter(
      (item) => !(Number(item.userId) === Number(user.id) && item.emoji === emoji)
    );
    const existed = reactions.length !== parseJson(messageRow.reactions, []).length;
    const next = existed ? reactions : [...reactions, { userId: Number(user.id), emoji, at: new Date().toISOString() }];
    await query("UPDATE message_messages SET reactions = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      JSON.stringify(next),
      messageId,
    ]);
  } else if (action === "save") {
    const savedBy = parseJson(messageRow.saved_by, []);
    const exists = savedBy.includes(Number(user.id));
    const next = exists ? savedBy.filter((id) => id !== Number(user.id)) : [...savedBy, Number(user.id)];
    await query("UPDATE message_messages SET saved_by = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      JSON.stringify(next),
      messageId,
    ]);
  } else if (action === "pin") {
    const pinnedBy = parseJson(messageRow.pinned_by, []);
    const exists = pinnedBy.includes(Number(user.id));
    const next = exists ? pinnedBy.filter((id) => id !== Number(user.id)) : [...pinnedBy, Number(user.id)];
    await query("UPDATE message_messages SET pinned_by = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      JSON.stringify(next),
      messageId,
    ]);
  } else if (action === "forward") {
    req.body = {
      conversationId: cleanString(req.body.toConversationId),
      body: messageRow.body,
      replyTo: null,
      metadata: { forwardedFrom: messageId },
    };
    return sendMessage(req, res);
  } else {
    throw httpError(400, "Action message inconnue");
  }

  const updated = await query("SELECT * FROM message_messages WHERE id = $1", [messageId]);
  const attachments = await loadAttachmentsForMessages([messageId]);
  const message = mapMessage(updated.rows[0], attachments.get(messageId) || []);
  emitConversationUpdate(messageRow.conversation_id, "message:updated", {
    conversationId: messageRow.conversation_id,
    message,
  });

  return res.json({ success: true, message });
}

async function deleteMessage(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const messageId = cleanString(req.params.id);
  const scope = cleanString(req.query.scope || req.body.scope) || "me";
  const messageResult = await query("SELECT * FROM message_messages WHERE id = $1", [messageId]);

  if (!messageResult.rowCount) {
    throw httpError(404, "Message introuvable");
  }

  const message = messageResult.rows[0];
  await assertConversationMember(message.conversation_id, user.id);

  if (scope === "everyone") {
    if (Number(message.sender_id) !== Number(user.id)) {
      throw httpError(403, "Suppression globale non autorisee");
    }

    await query(
      `
        UPDATE message_messages
        SET body = NULL, deleted_for_everyone_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [messageId]
    );
  } else {
    await query(
      `
        INSERT INTO message_hidden_messages (user_id, message_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, message_id) DO NOTHING
      `,
      [user.id, messageId]
    );
  }

  await logMessageSecurity(user.id, scope === "everyone" ? "message.delete_everyone" : "message.delete_me", {
    conversationId: message.conversation_id,
    messageId,
  });
  emitConversationUpdate(message.conversation_id, "message:deleted", {
    conversationId: message.conversation_id,
    messageId,
    scope,
    userId: user.id,
  });

  return res.json({ success: true });
}

async function uploadMessages(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  enforceMessageRateLimit(req, user.id, "message:upload", 30);
  const conversationId = cleanString(req.body.conversationId);

  if (conversationId) {
    await assertConversationMember(conversationId, user.id);
  }

  await fs.mkdir(messagesUploadsRoot, { recursive: true });
  const files = req.files || [];
  const uploaded = [];

  for (const file of files) {
    const extension = path.extname(file.originalname || "upload");
    const safeName = `${createId()}${extension}`;
    const diskPath = path.join(messagesUploadsRoot, safeName);
    await fs.writeFile(diskPath, file.buffer);
    const fileUrl = `/uploads/messages/${safeName}`;
    const result = await query(
      `
        INSERT INTO message_attachments
          (conversation_id, uploader_id, file_url, file_name, mime_type, file_size, category, upload_progress)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 100)
        RETURNING *
      `,
      [
        conversationId || null,
        user.id,
        fileUrl,
        cleanString(file.originalname) || safeName,
        file.mimetype,
        file.size,
        attachmentCategory(file.mimetype, file.originalname),
      ]
    );
    uploaded.push(mapAttachment(result.rows[0]));
  }

  await logMessageSecurity(user.id, "message.upload", {
    conversationId,
    metadata: { count: uploaded.length },
  });

  return res.status(201).json({ success: true, attachments: uploaded });
}

async function markRead(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.body.conversationId);
  await assertConversationMember(conversationId, user.id);
  await query(
    `
      UPDATE message_members
      SET unread_count = 0,
          last_read_at = CURRENT_TIMESTAMP,
          last_read_message_id = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND user_id = $2
    `,
    [conversationId, user.id, cleanString(req.body.messageId) || null]
  );
  await query(
    `
      INSERT INTO message_hidden_messages (user_id, message_id)
      SELECT $2, id
      FROM message_messages
      WHERE conversation_id = $1
        AND sender_id <> $2
        AND read_once = TRUE
        AND deleted_for_everyone_at IS NULL
      ON CONFLICT (user_id, message_id) DO NOTHING
    `,
    [conversationId, user.id]
  );
  await markMessageNotificationsRead(user.id, conversationId);
  emitConversationUpdate(conversationId, "message:read", {
    conversationId,
    userId: user.id,
    messageId: cleanString(req.body.messageId) || null,
  });

  return res.json({ success: true });
}

async function updateMemberFlag(req, res, field, valueBuilder) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.body.conversationId);
  await assertConversationMember(conversationId, user.id);
  const value = valueBuilder(req.body);
  await query(
    `
      UPDATE message_members
      SET ${field} = $3, updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND user_id = $2
    `,
    [conversationId, user.id, value]
  );
  await logMessageSecurity(user.id, `conversation.${field}`, { conversationId, metadata: { value } });
  emitConversationUpdate(conversationId, "conversation:updated", { conversationId });
  return res.json({ success: true, conversation: await conversationSummary(conversationId, user.id) });
}

async function blockConversation(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.body.conversationId);
  await assertConversationMember(conversationId, user.id);
  const members = await loadConversationMembers(conversationId);
  const targetId = toPositiveInt(req.body.userId, 0) || members.find((member) => member.id !== Number(user.id))?.id;

  if (!targetId || targetId === Number(user.id)) {
    throw httpError(400, "Membre a bloquer introuvable");
  }

  await query(
    `
      INSERT INTO message_blocks (blocker_id, blocked_user_id, reason)
      VALUES ($1, $2, $3)
      ON CONFLICT (blocker_id, blocked_user_id)
      DO UPDATE SET reason = EXCLUDED.reason, created_at = CURRENT_TIMESTAMP
    `,
    [user.id, targetId, cleanString(req.body.reason) || null]
  );
  await logMessageSecurity(user.id, "member.block", {
    conversationId,
    metadata: { targetId },
  });
  emitConversationUpdate(conversationId, "conversation:blocked", { conversationId, userId: user.id, targetId });

  return res.json({ success: true });
}

async function addGroupMembers(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  enforceMessageRateLimit(req, user.id, "group:members:add", 30);
  const conversationId = cleanString(req.params.conversationId || req.body.conversationId);
  await assertGroupManager(conversationId, user.id);
  const requestedIds = [...new Set((req.body.userIds || req.body.participantIds || [])
    .map((id) => toPositiveInt(id, 0))
    .filter((id) => id && id !== Number(user.id)))];

  if (!requestedIds.length) {
    throw httpError(400, "Selectionnez au moins un membre");
  }

  const existingUsers = await query("SELECT id FROM users WHERE id = ANY($1::integer[])", [requestedIds]);
  const userIds = existingUsers.rows.map((row) => Number(row.id));

  if (!userIds.length) {
    throw httpError(404, "Membres introuvables");
  }

  for (const memberId of userIds) {
    await query(
      `
        INSERT INTO message_members (conversation_id, user_id, role, permissions)
        VALUES ($1, $2, 'member', $3::jsonb)
        ON CONFLICT (conversation_id, user_id)
        DO UPDATE SET blocked = FALSE, archived = FALSE, updated_at = CURRENT_TIMESTAMP
      `,
      [conversationId, memberId, JSON.stringify(permissionsForRole("member"))]
    );
  }

  await logMessageSecurity(user.id, "group.members.add", {
    conversationId,
    metadata: { userIds },
  });
  emitConversationUpdate(conversationId, "conversation:updated", { conversationId });

  return res.status(201).json({ success: true, conversation: await conversationSummary(conversationId, user.id) });
}

async function updateGroupMemberRole(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.params.conversationId || req.body.conversationId);
  await assertGroupManager(conversationId, user.id);
  const targetId = toPositiveInt(req.params.userId || req.body.userId, 0);
  const nextRole = normalizeGroupRole(req.body.role);

  if (!targetId || targetId === Number(user.id)) {
    throw httpError(400, "Membre invalide");
  }

  if (nextRole === "owner") {
    throw httpError(403, "Le transfert proprietaire doit etre traite separement");
  }

  const targetMember = await getMember(conversationId, targetId);

  if (!targetMember) {
    throw httpError(404, "Membre introuvable");
  }

  if (normalizeGroupRole(targetMember.role) === "owner") {
    throw httpError(403, "Le proprietaire du groupe ne peut pas etre modifie ici");
  }

  await query(
    `
      UPDATE message_members
      SET role = $3,
          permissions = $4::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND user_id = $2
    `,
    [conversationId, targetId, nextRole, JSON.stringify(permissionsForRole(nextRole))]
  );
  await logMessageSecurity(user.id, "group.member.role", {
    conversationId,
    metadata: { targetId, role: nextRole },
  });
  emitConversationUpdate(conversationId, "conversation:updated", { conversationId });

  return res.json({ success: true, conversation: await conversationSummary(conversationId, user.id) });
}

async function removeGroupMember(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.params.conversationId || req.body.conversationId);
  await assertGroupManager(conversationId, user.id);
  const targetId = toPositiveInt(req.params.userId || req.body.userId, 0);

  if (!targetId || targetId === Number(user.id)) {
    throw httpError(400, "Membre invalide");
  }

  const targetMember = await getMember(conversationId, targetId);

  if (!targetMember) {
    throw httpError(404, "Membre introuvable");
  }

  if (normalizeGroupRole(targetMember.role) === "owner") {
    throw httpError(403, "Le proprietaire du groupe ne peut pas etre retire");
  }

  await query("DELETE FROM message_members WHERE conversation_id = $1 AND user_id = $2", [conversationId, targetId]);
  await logMessageSecurity(user.id, "group.member.remove", {
    conversationId,
    metadata: { targetId },
  });
  emitConversationUpdate(conversationId, "conversation:updated", { conversationId });

  return res.json({ success: true, conversation: await conversationSummary(conversationId, user.id) });
}

async function reportConversation(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.body.conversationId);
  await assertConversationMember(conversationId, user.id);
  const result = await query(
    `
      INSERT INTO message_reports (reporter_id, conversation_id, message_id, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [user.id, conversationId, cleanString(req.body.messageId) || null, cleanString(req.body.reason) || "Signalement"]
  );
  await logMessageSecurity(user.id, "conversation.report", {
    conversationId,
    messageId: cleanString(req.body.messageId) || null,
    metadata: { reportId: result.rows[0].id },
  });

  return res.status(201).json({ success: true, reportId: result.rows[0].id });
}

async function searchMessages(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const search = cleanString(req.query.q || req.query.search) || "";
  const conversationId = cleanString(req.query.conversationId);
  const type = cleanString(req.query.type) || "text";

  if (!search && type === "text") {
    return res.json({ success: true, results: [] });
  }

  if (conversationId) {
    await assertConversationMember(conversationId, user.id);
  }

  const params = [user.id];
  const where = [
    "mm.user_id = $1",
    "hm.message_id IS NULL",
    "m.deleted_for_everyone_at IS NULL",
    "(m.expires_at IS NULL OR m.expires_at > CURRENT_TIMESTAMP)",
  ];

  if (conversationId) {
    params.push(conversationId);
    where.push(`m.conversation_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(m.body ILIKE $${params.length} OR ma.file_name ILIKE $${params.length})`);
  }

  if (type === "files") {
    where.push("ma.id IS NOT NULL");
  } else if (type === "photos") {
    where.push("ma.category IN ('image', 'gif')");
  } else if (type === "links") {
    where.push("m.body ~* 'https?://'");
  } else if (type === "important") {
    where.push(`m.saved_by @> '[${Number(user.id)}]'::jsonb`);
  }

  const result = await query(
    `
      SELECT DISTINCT m.*, c.title AS conversation_title
      FROM message_messages m
      JOIN message_members mm ON mm.conversation_id = m.conversation_id
      JOIN message_conversations c ON c.id = m.conversation_id
      LEFT JOIN message_hidden_messages hm ON hm.message_id = m.id AND hm.user_id = $1
      LEFT JOIN message_attachments ma ON ma.message_id = m.id
      WHERE ${where.join(" AND ")}
      ORDER BY m.created_at DESC
      LIMIT 80
    `,
    params
  );
  const attachmentsByMessage = await loadAttachmentsForMessages(result.rows.map((row) => row.id));

  return res.json({
    success: true,
    results: result.rows.map((row) => ({
      conversationTitle: row.conversation_title,
      message: mapMessage(row, attachmentsByMessage.get(row.id) || []),
    })),
  });
}

async function updateConversationTheme(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.params.conversationId || req.body.conversationId);
  await assertConversationMember(conversationId, user.id);
  await query(
    `
      UPDATE message_conversations
      SET theme_color = $2,
          background = $3,
          ephemeral_mode = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [
      conversationId,
      normalizeThemeColor(req.body.themeColor),
      normalizeBackground(req.body.background),
      normalizeEphemeralMode(req.body.ephemeralMode),
    ]
  );
  await logMessageSecurity(user.id, "conversation.theme", {
    conversationId,
    metadata: {
      themeColor: req.body.themeColor,
      background: req.body.background,
      ephemeralMode: req.body.ephemeralMode,
    },
  });
  emitConversationUpdate(conversationId, "conversation:updated", { conversationId });

  return res.json({ success: true, conversation: await conversationSummary(conversationId, user.id) });
}

async function deleteConversationForMe(req, res) {
  const user = await ensureUser(req);
  await ensureMessagesSchema();
  const conversationId = cleanString(req.body.conversationId);
  await assertConversationMember(conversationId, user.id);
  await query(
    `
      UPDATE message_members
      SET archived = TRUE, muted_until = CURRENT_TIMESTAMP + INTERVAL '100 years', updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND user_id = $2
    `,
    [conversationId, user.id]
  );
  await logMessageSecurity(user.id, "conversation.delete_for_me", { conversationId });
  emitConversationUpdate(conversationId, "conversation:updated", { conversationId });

  return res.json({ success: true });
}

function emitToUsers(userIds, event, payload) {
  messagesEvents.emit("messages:event", {
    userIds: [...new Set(userIds.map(Number).filter(Boolean))],
    event,
    payload,
  });
}

async function emitConversationUpdate(conversationId, event, payload) {
  const userIds = await conversationUserIds(conversationId);
  emitToUsers(userIds, event, payload);
}

function createMessagesRouter() {
  const router = express.Router();

  router.get("/", asyncHandler(listConversations));
  router.get("/conversations", asyncHandler(listConversations));
  router.post("/conversations", asyncHandler(createConversation));
  router.post("/conversations/:conversationId/theme", asyncHandler(updateConversationTheme));
  router.get("/search", asyncHandler(searchMessages));
  router.post("/send", asyncHandler(sendMessage));
  router.post("/upload", upload.array("files", 8), asyncHandler(uploadMessages));
  router.post("/read", asyncHandler(markRead));
  router.post("/pin", asyncHandler((req, res) => updateMemberFlag(req, res, "pinned", (body) => Boolean(body.pinned))));
  router.post("/archive", asyncHandler((req, res) => updateMemberFlag(req, res, "archived", (body) => Boolean(body.archived))));
  router.post("/mute", asyncHandler((req, res) =>
    updateMemberFlag(req, res, "muted_until", (body) => {
      if (!body.muted) {
        return null;
      }

      const hours = Math.min(toPositiveInt(body.hours, 8), 24 * 365);
      return new Date(Date.now() + hours * 60 * 60 * 1000);
    })
  ));
  router.post("/block", asyncHandler(blockConversation));
  router.post("/report", asyncHandler(reportConversation));
  router.post("/delete-conversation", asyncHandler(deleteConversationForMe));
  router.post("/groups/:conversationId/members", asyncHandler(addGroupMembers));
  router.patch("/groups/:conversationId/members/:userId", asyncHandler(updateGroupMemberRole));
  router.delete("/groups/:conversationId/members/:userId", asyncHandler(removeGroupMember));
  router.patch("/:id", asyncHandler(patchMessage));
  router.delete("/:id", asyncHandler(deleteMessage));
  router.get("/:conversationId", asyncHandler(getConversation));

  return router;
}

function attachMessagesRealtime(server, allowedOrigins = []) {
  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = toPositiveInt(socket.handshake.auth?.userId || socket.handshake.query?.userId, 0);

    if (userId) {
      activePresence.set(userId, {
        socketId: socket.id,
        lastSeenAt: new Date().toISOString(),
      });
      socket.join(`user:${userId}`);
      socket.emit("presence:ready", { userId });
      socket.broadcast.emit("presence:update", { userId, online: true });
    }

    socket.on("conversation:join", (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on("message:typing", (payload = {}) => {
      if (payload.conversationId) {
        socket.to(`conversation:${payload.conversationId}`).emit("message:typing", {
          conversationId: payload.conversationId,
          userId,
          typing: Boolean(payload.typing),
        });
      }
    });

    socket.on("disconnect", () => {
      if (userId) {
        activePresence.delete(userId);
        socket.broadcast.emit("presence:update", { userId, online: false, lastSeenAt: new Date().toISOString() });
      }
    });
  });

  messagesEvents.on("messages:event", ({ userIds, event, payload }) => {
    for (const userId of userIds || []) {
      io.to(`user:${userId}`).emit(event, payload);
    }

    if (payload?.conversationId) {
      io.to(`conversation:${payload.conversationId}`).emit(event, payload);
    }
  });

  return io;
}

module.exports = {
  attachMessagesRealtime,
  createMessagesRouter,
  ensureMessagesSchema,
  messagesUploadsRoot,
};
