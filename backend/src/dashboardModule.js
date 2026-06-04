const express = require("express");
const {
  asyncHandler,
  ensureProfileSchema,
  ensureUser,
  parseJsonObject,
  query,
  toIso,
} = require("./profileModule");

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    username: row.username || null,
    firstName: row.first_name || null,
    lastName: row.last_name || null,
    fullName: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.username || null,
    bio: row.bio || null,
    city: row.city || null,
    country: row.country || null,
    profilePictureUrl: row.profile_picture_url || null,
    bannerUrl: row.banner_url || null,
    currentJobTitle: row.current_job_title || null,
    currentCompany: row.current_company || null,
    currentIndustry: row.current_industry || null,
    profession: row.profession || null,
    currentPosition: row.current_position || null,
    membershipTier: row.membership_tier || "Free",
    profileViewsCount: toNumber(row.profile_views_count),
    connectionsCount: toNumber(row.connections_count),
    cvDownloadCount: toNumber(row.cv_download_count),
    cvUrl: row.cv_url || null,
    publicProfileUrl: row.public_profile_url || null,
    privacySettings: {
      profileVisibility: row.profile_visibility || "Public",
      cvVisibility: row.cv_visibility || "ContactsOnly",
      emailVisibility: row.email_visibility || "Private",
      phoneVisibility: row.phone_visibility || "Private",
      allowNetworkingRequests: row.allow_networking_requests !== false,
      allowSearchEngines: row.allow_search_engines !== false,
    },
    updatedAt: toIso(row.updated_at),
  };
}

function mapPost(row) {
  const stats = parseJsonObject(row.stats, { likes: 0, comments: 0, shares: 0, saves: 0 });

  return {
    id: Number(row.id),
    type: row.post_type || "text",
    body: row.body || "",
    visibility: row.visibility || "public",
    showOnProfile: Boolean(row.show_on_profile),
    pinned: Boolean(row.pinned),
    stats: {
      likes: toNumber(stats.likes),
      comments: toNumber(stats.comments),
      shares: toNumber(stats.shares),
      saves: toNumber(stats.saves),
    },
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapNotification(row) {
  return {
    id: String(row.id),
    title: row.title || "Notification",
    message: row.message || "",
    status: row.status || "NON_VERIFIED",
    category: row.category || "profile",
    href: row.href || null,
    createdAt: toIso(row.created_at),
    readAt: toIso(row.read_at),
  };
}

function mapVerification(row) {
  if (!row) {
    return {
      status: "NON_VERIFIED",
      type: "PERSONAL",
      submittedAt: null,
      reviewedAt: null,
      rejectionReason: null,
    };
  }

  return {
    id: row.id,
    status: row.status || "NON_VERIFIED",
    type: row.type || "PERSONAL",
    submittedAt: toIso(row.submitted_at),
    reviewedAt: toIso(row.reviewed_at),
    rejectionReason: row.rejection_reason || null,
  };
}

function mapSubscription(row, profile) {
  if (!row) {
    return {
      id: null,
      plan: profile?.membershipTier || "Free",
      status: "FREE",
      startedAt: null,
      expiresAt: null,
      renewsAt: null,
    };
  }

  return {
    id: row.id,
    plan: row.plan || profile?.membershipTier || "Free",
    status: row.status || "DRAFT",
    startedAt: toIso(row.started_at),
    expiresAt: toIso(row.expires_at),
    renewsAt: toIso(row.renews_at),
  };
}

async function getProfileForUser(userId) {
  await ensureProfileSchema();
  const result = await query(
    `
      SELECT p.*, u.username, u.email AS user_email, u.role, u.account_type,
        ps.profile_visibility,
        ps.cv_visibility,
        ps.email_visibility,
        ps.phone_visibility,
        ps.allow_networking_requests,
        ps.allow_search_engines
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN profile_settings ps ON ps.profile_id = p.id
      WHERE p.user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function getVerificationForUser(userId) {
  const result = await query(
    "SELECT * FROM verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  return mapVerification(result.rows[0]);
}

async function getSubscriptionForUser(userId, profile) {
  try {
    const result = await query(
      "SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    return mapSubscription(result.rows[0], profile);
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }

    return mapSubscription(null, profile);
  }
}

async function getRecentPostsForUser(userId, limit = 5) {
  await ensureProfileSchema();
  const result = await query(
    `
      SELECT *
      FROM profile_posts
      WHERE user_id = $1
      ORDER BY pinned DESC, created_at DESC
      LIMIT $2
    `,
    [userId, limit]
  );

  return result.rows.map(mapPost);
}

async function getStatsForUser(userId, profile) {
  await ensureProfileSchema();
  const [postResult, interactionResult, connectionResult] = await Promise.all([
    query(
      `
        SELECT COUNT(*)::integer AS active_posts
        FROM profile_posts
        WHERE user_id = $1
      `,
      [userId]
    ),
    query(
      `
        SELECT COALESCE(SUM(total), 0)::integer AS interactions
        FROM (
          SELECT COUNT(*)::integer AS total
          FROM post_likes pl
          JOIN profile_posts pp ON pp.id = pl.post_id
          WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total
          FROM post_comments pc
          JOIN profile_posts pp ON pp.id = pc.post_id
          WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total
          FROM post_shares ps
          JOIN profile_posts pp ON pp.id = ps.post_id
          WHERE pp.user_id = $1
          UNION ALL
          SELECT COUNT(*)::integer AS total
          FROM post_saves psv
          JOIN profile_posts pp ON pp.id = psv.post_id
          WHERE pp.user_id = $1
        ) interaction_totals
      `,
      [userId]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [{ interactions: 0 }] };
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
      [userId]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [{ connections: 0 }] };
      }
      throw error;
    }),
  ]);
  const postRow = postResult.rows[0] || {};
  const interactionRow = interactionResult.rows[0] || {};
  const connectionRow = connectionResult.rows[0] || {};

  return {
    profileViews: toNumber(profile?.profileViewsCount),
    interactions: toNumber(interactionRow.interactions),
    connections: toNumber(connectionRow.connections),
    activePosts: toNumber(postRow.active_posts),
  };
}

async function getUnreadNotificationsForUser(userId) {
  const [appResult, verificationResult] = await Promise.all([
    query(
      `
        SELECT id, type AS status, category, title, message, href, created_at, read_at
        FROM app_notifications
        WHERE user_id = $1
          AND read_at IS NULL
          AND archived_at IS NULL
        ORDER BY created_at DESC
        LIMIT 80
      `,
      [userId]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [] };
      }
      throw error;
    }),
    query(
      `
        SELECT id, status, 'profile' AS category, title, message, NULL AS href, created_at, read_at
        FROM verification_notifications
        WHERE user_id = $1 AND read_at IS NULL
        ORDER BY created_at DESC
        LIMIT 40
      `,
      [userId]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [] };
      }
      throw error;
    }),
  ]);

  return [...appResult.rows, ...verificationResult.rows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(mapNotification);
}

async function getExperienceCount(profileId) {
  if (!profileId) {
    return 0;
  }

  const result = await query(
    "SELECT COUNT(*)::integer AS total FROM professional_experiences WHERE profile_id = $1",
    [profileId]
  );
  return toNumber(result.rows[0]?.total);
}

function buildCompletion(profile, verification, experienceCount) {
  const privacyReady = Boolean(
    profile?.privacySettings?.profileVisibility &&
      profile?.privacySettings?.cvVisibility &&
      profile?.privacySettings?.emailVisibility &&
      profile?.privacySettings?.phoneVisibility
  );
  const items = [
    {
      id: "photo",
      label: "Photo ajoutée",
      done: Boolean(profile?.profilePictureUrl),
      href: "/profile/edit",
    },
    {
      id: "profession",
      label: "Profession remplie",
      done: Boolean(profile?.currentJobTitle || profile?.profession || profile?.currentPosition),
      href: "/profile/edit",
    },
    {
      id: "location",
      label: "Localisation remplie",
      done: Boolean(profile?.city && profile?.country),
      href: "/profile/edit",
    },
    {
      id: "cv",
      label: "CV ajouté",
      done: Boolean(profile?.cvUrl),
      href: "/profile/cv",
    },
    {
      id: "experience",
      label: "Expérience ajoutée",
      done: experienceCount > 0,
      href: "/profile/edit",
    },
    {
      id: "privacy",
      label: "Confidentialité configurée",
      done: privacyReady,
      href: "/profile/settings/privacy",
    },
    {
      id: "verification",
      label: "Vérification KYC/KYB",
      done: verification.status === "VERIFIED",
      href: "/profile/settings/verification",
    },
  ];
  const completed = items.filter((item) => item.done).length;

  return {
    percent: items.length ? Math.round((completed / items.length) * 100) : 0,
    completed,
    total: items.length,
    items,
  };
}

async function getActivityForUser(userId, days) {
  const safeDays = days === 28 ? 28 : 7;
  const today = new Date();
  const emptySeries = Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (safeDays - 1 - index));

    return {
      date: date.toISOString().slice(0, 10),
      profileViews: 0,
      interactions: 0,
      connections: 0,
    };
  });
  const byDate = new Map(emptySeries.map((item) => [item.date, item]));
  const since = emptySeries[0].date;

  const [interactionResult, connectionResult] = await Promise.all([
    query(
      `
        SELECT day, COALESCE(SUM(total), 0)::integer AS interactions
        FROM (
          SELECT date_trunc('day', pl.created_at)::date AS day, COUNT(*)::integer AS total
          FROM post_likes pl
          JOIN profile_posts pp ON pp.id = pl.post_id
          WHERE pp.user_id = $1 AND pl.created_at::date >= $2::date
          GROUP BY 1
          UNION ALL
          SELECT date_trunc('day', pc.created_at)::date AS day, COUNT(*)::integer AS total
          FROM post_comments pc
          JOIN profile_posts pp ON pp.id = pc.post_id
          WHERE pp.user_id = $1 AND pc.created_at::date >= $2::date
          GROUP BY 1
          UNION ALL
          SELECT date_trunc('day', ps.created_at)::date AS day, COUNT(*)::integer AS total
          FROM post_shares ps
          JOIN profile_posts pp ON pp.id = ps.post_id
          WHERE pp.user_id = $1 AND ps.created_at::date >= $2::date
          GROUP BY 1
          UNION ALL
          SELECT date_trunc('day', psv.created_at)::date AS day, COUNT(*)::integer AS total
          FROM post_saves psv
          JOIN profile_posts pp ON pp.id = psv.post_id
          WHERE pp.user_id = $1 AND psv.created_at::date >= $2::date
          GROUP BY 1
        ) daily_interactions
        GROUP BY day
      `,
      [userId, since]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [] };
      }
      throw error;
    }),
    query(
      `
        SELECT date_trunc('day', updated_at)::date AS day, COUNT(*)::integer AS connections
        FROM connections
        WHERE status = 'accepted'
          AND (requester_id = $1 OR receiver_id = $1)
          AND updated_at::date >= $2::date
        GROUP BY 1
      `,
      [userId, since]
    ).catch((error) => {
      if (error.code === "42P01") {
        return { rows: [] };
      }
      throw error;
    }),
  ]);

  for (const row of interactionResult.rows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    const target = byDate.get(key);
    if (target) {
      target.interactions = toNumber(row.interactions);
    }
  }

  for (const row of connectionResult.rows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    const target = byDate.get(key);
    if (target) {
      target.connections = toNumber(row.connections);
    }
  }

  return emptySeries;
}

function hasActivityData(activity) {
  return activity.some((item) => item.profileViews || item.interactions || item.connections);
}

function buildRecommendedActions(profile, completion, verification, subscription, notifications) {
  const actions = [];
  const missing = completion.items.find((item) => !item.done);

  if (missing) {
    actions.push({
      id: missing.id,
      title: missing.label,
      description: "Améliorez la lisibilité et la crédibilité du profil.",
      href: missing.href,
      priority: "high",
    });
  }

  if (!profile?.cvUrl) {
    actions.push({
      id: "cv",
      title: "Ajouter votre CV",
      description: "Rendez vos documents accessibles selon vos règles de confidentialité.",
      href: "/profile/cv",
      priority: "medium",
    });
  }

  if (verification.status !== "VERIFIED") {
    actions.push({
      id: "verification",
      title: verification.status === "PENDING" ? "Vérification en attente" : "Lancer la vérification",
      description: "Renforcez la confiance du profil avec KYC/KYB.",
      href: "/profile/settings/verification",
      priority: "medium",
    });
  }

  if (String(subscription?.plan || "Free").toLowerCase() === "free") {
    actions.push({
      id: "premium",
      title: "Passer Gold",
      description: "Augmentez la visibilité lorsque le profil est prêt.",
      href: "/premium",
      priority: "low",
    });
  }

  if (notifications.length) {
    actions.push({
      id: "notifications",
      title: "Lire les notifications",
      description: `${notifications.length} notification(s) importante(s).`,
      href: "/notifications",
      priority: "medium",
    });
  }

  return actions.slice(0, 6);
}

async function buildDashboardOverview(req) {
  const user = await ensureUser(req);
  const profileRow = await getProfileForUser(user.id);
  const profile = mapProfile(profileRow);
  const [verification, recentPosts, notifications, subscription, experienceCount] = await Promise.all([
    getVerificationForUser(user.id),
    getRecentPostsForUser(user.id, 5),
    getUnreadNotificationsForUser(user.id),
    getSubscriptionForUser(user.id, profile),
    getExperienceCount(profile?.id),
  ]);
  const [stats] = await Promise.all([getStatsForUser(user.id, profile)]);
  const profileCompletion = buildCompletion(profile, verification, experienceCount);
  const activity = await getActivityForUser(user.id, 7);

  return {
    user: {
      id: Number(user.id),
      username: user.username || null,
      email: user.email || null,
      role: user.role || "Regular",
      accountType: user.accountType || user.account_type || "PERSONAL",
    },
    profile,
    subscription,
    verificationStatus: verification,
    profileCompletion,
    stats,
    activity,
    hasActivityData: hasActivityData(activity),
    recentPosts,
    unreadNotificationCount: notifications.length,
    unreadNotifications: notifications.slice(0, 10),
    recommendedActions: buildRecommendedActions(profile, profileCompletion, verification, subscription, notifications),
  };
}

function createDashboardRouter() {
  const router = express.Router();

  router.get(
    "/overview",
    asyncHandler(async (req, res) => {
      const data = await buildDashboardOverview(req);
      return res.json({ success: true, data });
    })
  );

  router.get(
    "/stats",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      const profile = mapProfile(await getProfileForUser(user.id));
      const data = await getStatsForUser(user.id, profile);
      return res.json({ success: true, data });
    })
  );

  router.get(
    "/activity",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      const days = Number(req.query.days) === 28 ? 28 : 7;
      const data = await getActivityForUser(user.id, days);
      return res.json({ success: true, hasData: hasActivityData(data), days, data });
    })
  );

  router.get(
    "/profile-completion",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      const profile = mapProfile(await getProfileForUser(user.id));
      const [verification, experienceCount] = await Promise.all([
        getVerificationForUser(user.id),
        getExperienceCount(profile?.id),
      ]);
      const data = buildCompletion(profile, verification, experienceCount);
      return res.json({ success: true, data });
    })
  );

  return router;
}

function createDashboardPostsRouter() {
  const router = express.Router();

  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      const data = await getRecentPostsForUser(user.id, 20);
      return res.json({ success: true, data });
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      await ensureProfileSchema();

      const existingProfile = await query("SELECT id FROM profiles WHERE user_id = $1 LIMIT 1", [user.id]);
      let profileId = existingProfile.rows[0]?.id;

      if (!profileId) {
        const publicProfileUrl = user.username || `member-${user.id}`;
        const createdProfile = await query(
          `
            INSERT INTO profiles (user_id, email, public_profile_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE
            SET email = COALESCE(profiles.email, EXCLUDED.email)
            RETURNING id
          `,
          [user.id, user.email, publicProfileUrl]
        );
        profileId = createdProfile.rows[0]?.id;
      }

      const body = String(req.body?.body || "").trim();

      if (!body || body.length > 4000) {
        return res.status(400).json({ success: false, error: "La publication doit contenir un texte valide." });
      }

      const type = normalizeDashboardPostType(req.body?.type || req.body?.postType);
      const visibility = normalizeDashboardPostVisibility(req.body?.visibility);
      const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];

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
          type,
          body,
          visibility,
          req.body?.showOnProfile !== false,
          JSON.stringify(attachments),
          JSON.stringify({ likes: 0, comments: 0, shares: 0, saves: 0 }),
        ]
      );

      return res.status(201).json({ success: true, data: mapPost(result.rows[0]) });
    })
  );

  return router;
}

function normalizeDashboardPostVisibility(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["private", "network"].includes(normalized) ? normalized : "public";
}

function normalizeDashboardPostType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["text", "image", "video", "project", "article", "event", "cv"].includes(normalized) ? normalized : "text";
}

function createDashboardNotificationsRouter() {
  const router = express.Router();

  router.get(
    "/unread",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      const data = await getUnreadNotificationsForUser(user.id);
      return res.json({ success: true, count: data.length, data: data.slice(0, 20) });
    })
  );

  return router;
}

function createDashboardSubscriptionsRouter() {
  const router = express.Router();

  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      const profile = mapProfile(await getProfileForUser(user.id));
      const data = await getSubscriptionForUser(user.id, profile);
      return res.json({ success: true, data });
    })
  );

  return router;
}

module.exports = {
  createDashboardNotificationsRouter,
  createDashboardPostsRouter,
  createDashboardRouter,
  createDashboardSubscriptionsRouter,
};
