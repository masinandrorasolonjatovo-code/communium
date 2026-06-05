const express = require("express");
const {
  asyncHandler,
  cleanString,
  ensureProfileSchema,
  ensureUser,
  parseJsonObject,
  query,
  toIso,
} = require("./profileModule");
const { ensureSettingsSchema } = require("./settingsModule");

const taskKeys = new Set([
  "avatar",
  "cover",
  "profession",
  "location",
  "privacy",
  "cv",
  "publicProfile",
  "firstPost",
  "skills",
  "email",
  "notifications",
]);

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hasText(value) {
  return Boolean(cleanString(value));
}

function normalizePercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function ensureOnboardingSchema() {
  await ensureSettingsSchema();
  await query(`
    CREATE TABLE IF NOT EXISTS onboarding_task_overrides (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_key VARCHAR(80) NOT NULL,
      dismissed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, task_key)
    );

    CREATE INDEX IF NOT EXISTS idx_onboarding_task_overrides_user ON onboarding_task_overrides(user_id, task_key);
  `);
}

async function ensureProfileForOnboarding(user) {
  await ensureProfileSchema();
  const existing = await query(
    `
      SELECT p.*, u.username, u.email AS user_email, u.role, u.account_type,
        ps.profile_visibility,
        ps.email_visibility,
        ps.phone_visibility,
        ps.cv_visibility,
        ps.photo_visibility,
        ps.banner_visibility,
        ps.bio_visibility,
        ps.profession_visibility,
        ps.professional_experience_visibility,
        ps.interests_visibility,
        ps.allow_search_engines,
        ps.allow_networking_requests
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN profile_settings ps ON ps.profile_id = p.id
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
      SELECT p.*, u.username, u.email AS user_email, u.role, u.account_type,
        ps.profile_visibility,
        ps.email_visibility,
        ps.phone_visibility,
        ps.cv_visibility,
        ps.photo_visibility,
        ps.banner_visibility,
        ps.bio_visibility,
        ps.profession_visibility,
        ps.professional_experience_visibility,
        ps.interests_visibility,
        ps.allow_search_engines,
        ps.allow_networking_requests
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN profile_settings ps ON ps.profile_id = p.id
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

async function countRows(sql, params) {
  try {
    const result = await query(sql, params);
    return toNumber(result.rows[0]?.count);
  } catch (error) {
    if (["42P01", "42703"].includes(error.code)) {
      return 0;
    }
    throw error;
  }
}

async function getPreferences(userId) {
  await ensureSettingsSchema();
  await query("INSERT INTO user_setting_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [
    userId,
  ]);
  const result = await query("SELECT notifications, security FROM user_setting_preferences WHERE user_id = $1 LIMIT 1", [
    userId,
  ]);
  const row = result.rows[0] || {};
  return {
    notifications: parseJsonObject(row.notifications, {}),
    security: parseJsonObject(row.security, {}),
  };
}

async function buildOnboardingState(req) {
  await ensureOnboardingSchema();
  const user = await ensureUser(req);
  const profile = await ensureProfileForOnboarding(user);
  const preferences = await getPreferences(user.id);
  const primarySkills = parseJsonObject(profile.primary_skills, []);
  const education = parseJsonObject(profile.education, []);
  const languages = parseJsonObject(profile.languages, []);
  const postCount = await countRows("SELECT COUNT(*)::integer AS count FROM profile_posts WHERE user_id = $1", [user.id]);
  const visiblePostCount = await countRows(
    "SELECT COUNT(*)::integer AS count FROM profile_posts WHERE user_id = $1 AND show_on_profile = TRUE",
    [user.id]
  );
  const interestCount = await countRows(
    "SELECT COUNT(*)::integer AS count FROM profile_interests WHERE profile_id = $1",
    [profile.id]
  );
  const unreadNotifications = await countRows(
    "SELECT COUNT(*)::integer AS count FROM verification_notifications WHERE user_id = $1 AND read_at IS NULL",
    [user.id]
  );
  const verificationResult = await query(
    "SELECT status, type, submitted_at, reviewed_at FROM verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    [user.id]
  );
  const verification = verificationResult.rows[0] || null;
  let twoFactorEnabled = false;

  try {
    const securityResult = await query("SELECT totp_enabled FROM user_security_settings WHERE user_id = $1 LIMIT 1", [
      user.id,
    ]);
    twoFactorEnabled = securityResult.rows[0]?.totp_enabled === true;
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }
  }

  const dismissedResult = await query("SELECT task_key, dismissed FROM onboarding_task_overrides WHERE user_id = $1", [
    user.id,
  ]);
  const dismissed = new Set(
    dismissedResult.rows.filter((row) => row.dismissed === true).map((row) => String(row.task_key))
  );

  const notificationsConfigured = Object.values(preferences.notifications || {}).some(Boolean);
  const hasProfession = [profile.current_job_title, profile.profession, profile.current_position].some(hasText);
  const hasLocation = hasText(profile.city) && hasText(profile.country);
  const locationProgress = hasText(profile.city) || hasText(profile.country) ? (hasLocation ? 100 : 50) : 0;
  const profileVisibility = profile.profile_visibility || "Public";
  const emailVisibility = profile.email_visibility || "Private";
  const phoneVisibility = profile.phone_visibility || "Private";
  const cvVisibility = profile.cv_visibility || "ContactsOnly";
  const allowNetworkingRequests = profile.allow_networking_requests !== false;
  const allowSearchEngines = profile.allow_search_engines !== false;
  const privacyConfigured = Boolean(
    profileVisibility && emailVisibility && phoneVisibility && cvVisibility && allowNetworkingRequests !== null
  );
  const publicProfileActive =
    profileVisibility !== "Private" && hasText(profile.public_profile_url) && allowSearchEngines;
  const emailVerified = hasText(user.email) && !String(user.email).endsWith("@communium.local");
  const skillsCount = Array.isArray(primarySkills) ? primarySkills.length : 0;
  const skillProgress = skillsCount > 0 || interestCount > 0 ? 100 : 0;
  const documentsCount = profile.cv_url ? 1 : 0;
  const currentRole =
    profile.current_job_title ||
    profile.profession ||
    profile.current_position ||
    "Profil professionnel en cours";
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.username ||
    user.username ||
    "Membre Communium";

  function task({
    key,
    category,
    title,
    description,
    href,
    actionLabel,
    icon,
    priority,
    progress,
  }) {
    const completed = progress >= 100;
    return {
      key,
      category,
      title,
      description,
      icon,
      href,
      actionLabel: completed && actionLabel === "Ajouter" ? "Modifier" : actionLabel,
      priority,
      progress: normalizePercent(progress),
      completed,
      dismissed: dismissed.has(key),
      status: completed ? "completed" : progress > 0 ? "in_progress" : "pending",
    };
  }

  const tasks = [
    task({
      key: "avatar",
      category: "profile",
      title: "Photo de profil",
      description: profile.profile_picture_url ? "Ajoutee et visible." : "Ajoutez une photo nette pour renforcer la confiance.",
      href: "/profile/edit",
      actionLabel: profile.profile_picture_url ? "Modifier" : "Ajouter",
      icon: "camera",
      priority: 1,
      progress: profile.profile_picture_url ? 100 : 0,
    }),
    task({
      key: "cover",
      category: "profile",
      title: "Photo de couverture",
      description: profile.banner_url ? "Couverture active sur le profil." : "Ajoutez une couverture professionnelle.",
      href: "/profile/edit",
      actionLabel: profile.banner_url ? "Modifier" : "Ajouter",
      icon: "image",
      priority: 3,
      progress: profile.banner_url ? 100 : 0,
    }),
    task({
      key: "profession",
      category: "profile",
      title: "Profession",
      description: hasProfession ? currentRole : "Definissez votre titre ou votre role actuel.",
      href: "/profile/edit",
      actionLabel: hasProfession ? "Modifier" : "Definir",
      icon: "briefcase",
      priority: 2,
      progress: hasProfession ? 100 : 0,
    }),
    task({
      key: "location",
      category: "profile",
      title: "Ville et pays",
      description: hasLocation ? `${profile.city}, ${profile.country}` : "Ajoutez une localisation lisible.",
      href: "/profile/edit",
      actionLabel: hasLocation ? "Modifier" : "Ajouter",
      icon: "map",
      priority: 4,
      progress: locationProgress,
    }),
    task({
      key: "privacy",
      category: "privacy",
      title: "Confidentialite",
      description: privacyConfigured ? "Regles principales configurees." : "Choisissez ce qui reste public, reseau ou prive.",
      href: "/settings/privacy",
      actionLabel: privacyConfigured ? "Verifier" : "Configurer",
      icon: "shield",
      priority: 5,
      progress: privacyConfigured ? 100 : 0,
    }),
    task({
      key: "cv",
      category: "profile",
      title: "CV",
      description: profile.cv_url ? "Document ajoute au profil." : "Aucun CV ajoute.",
      href: "/profile/cv",
      actionLabel: profile.cv_url ? "Gerer" : "Ajouter",
      icon: "file",
      priority: 6,
      progress: profile.cv_url ? 100 : 0,
    }),
    task({
      key: "publicProfile",
      category: "privacy",
      title: "Profil public",
      description: publicProfileActive ? "Profil public actif." : "Activez une page publique controlable.",
      href: "/profile/public",
      actionLabel: publicProfileActive ? "Voir" : "Activer",
      icon: "globe",
      priority: 7,
      progress: publicProfileActive ? 100 : hasText(profile.public_profile_url) ? 70 : 0,
    }),
    task({
      key: "firstPost",
      category: "publishing",
      title: "Premiere publication",
      description: postCount > 0 ? `${postCount} publication(s) creee(s).` : "Publiez un projet, article ou evenement.",
      href: "/dashboard/posts",
      actionLabel: postCount > 0 ? "Voir" : "Publier",
      icon: "post",
      priority: 8,
      progress: postCount > 0 ? 100 : 0,
    }),
    task({
      key: "skills",
      category: "network",
      title: "Competences",
      description: skillProgress ? `${skillsCount + interestCount} signal(aux) ajoute(s).` : "Ajoutez vos technologies, domaines ou centres d interet.",
      href: "/profile/edit",
      actionLabel: skillProgress ? "Modifier" : "Ajouter",
      icon: "sparkles",
      priority: 9,
      progress: skillProgress,
    }),
    task({
      key: "email",
      category: "security",
      title: "Email",
      description: emailVerified ? "Email actif sur le compte." : "Verifiez l email du compte.",
      href: "/settings/security",
      actionLabel: emailVerified ? "Verifier" : "Ouvrir",
      icon: "mail",
      priority: 10,
      progress: emailVerified ? 100 : 0,
    }),
    task({
      key: "notifications",
      category: "security",
      title: "Notifications",
      description: notificationsConfigured ? "Alertes essentielles activees." : "Activez les alertes utiles.",
      href: "/settings",
      actionLabel: notificationsConfigured ? "Regler" : "Activer",
      icon: "bell",
      priority: 11,
      progress: notificationsConfigured ? 100 : 0,
    }),
  ];

  const progress = normalizePercent(tasks.reduce((sum, item) => sum + item.progress, 0) / tasks.length);
  const completedTasks = tasks.filter((item) => item.completed).length;
  const recommendedAction =
    tasks
      .filter((item) => !item.completed && !item.dismissed)
      .sort((a, b) => a.priority - b.priority)[0] || tasks.find((item) => !item.dismissed) || tasks[0];
  const sections = ["profile", "privacy", "publishing", "network", "security"].map((category) => {
    const items = tasks.filter((item) => item.category === category);
    return {
      key: category,
      title:
        category === "profile"
          ? "Configuration profil"
          : category === "privacy"
            ? "Confidentialite"
            : category === "publishing"
              ? "Publication"
              : category === "network"
                ? "Reseau"
                : "Securite",
      progress: items.length ? normalizePercent(items.reduce((sum, item) => sum + item.progress, 0) / items.length) : 0,
      completed: items.filter((item) => item.completed).length,
      total: items.length,
    };
  });

  return {
    user: {
      id: Number(user.id),
      username: profile.username || user.username || null,
      email: user.email || profile.user_email || null,
    },
    profile: {
      id: Number(profile.id),
      fullName,
      currentRole,
      city: profile.city || null,
      country: profile.country || null,
      avatarUrl: profile.profile_picture_url || null,
      bannerUrl: profile.banner_url || null,
      publicProfileUrl: profile.public_profile_url || null,
      membershipTier: profile.membership_tier || "Free",
      visibility: profileVisibility,
      cvUrl: profile.cv_url || null,
      verificationStatus: verification?.status || "NON_VERIFIED",
    },
    progress,
    progressScale: [0, 15, 40, 65, 85, 100],
    completedTasks,
    totalTasks: tasks.length,
    recommendedAction,
    tasks,
    sections,
    workspace: {
      profileProgress: progress,
      visibility: profileVisibility,
      publicProfileActive,
      posts: postCount,
      visiblePosts: visiblePostCount,
      connections: toNumber(profile.connections_count),
      unreadNotifications,
      documents: documentsCount,
      security: {
        twoFactorEnabled,
        loginAlerts: preferences.security?.loginAlerts !== false,
      },
      education: Array.isArray(education) ? education.length : 0,
      languages: Array.isArray(languages) ? languages.length : 0,
    },
    updatedAt: toIso(new Date()),
  };
}

async function getOnboardingProgress(req, res) {
  const data = await buildOnboardingState(req);
  return res.json({ success: true, data });
}

async function getOnboardingTasks(req, res) {
  const data = await buildOnboardingState(req);
  return res.json({ success: true, data: data.tasks });
}

async function patchOnboardingTask(req, res) {
  await ensureOnboardingSchema();
  const user = await ensureUser(req);
  const taskKey = cleanString(req.body?.taskKey || req.body?.key);

  if (!taskKeys.has(taskKey)) {
    return res.status(400).json({ success: false, error: "Tache onboarding inconnue" });
  }

  const dismissed = req.body?.dismissed === true;
  await query(
    `
      INSERT INTO onboarding_task_overrides (user_id, task_key, dismissed, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, task_key)
      DO UPDATE SET dismissed = EXCLUDED.dismissed, updated_at = CURRENT_TIMESTAMP
    `,
    [user.id, taskKey, dismissed]
  );

  const data = await buildOnboardingState(req);
  return res.json({ success: true, data });
}

async function getProfileStatus(req, res) {
  const data = await buildOnboardingState(req);
  return res.json({
    success: true,
    data: {
      progress: data.progress,
      completedTasks: data.completedTasks,
      totalTasks: data.totalTasks,
      visibility: data.profile.visibility,
      publicProfileActive: data.workspace.publicProfileActive,
      documents: data.workspace.documents,
      posts: data.workspace.posts,
      connections: data.workspace.connections,
      notifications: data.workspace.unreadNotifications,
      security: data.workspace.security,
      verificationStatus: data.profile.verificationStatus,
    },
  });
}

function createOnboardingRouter() {
  const router = express.Router();

  router.get("/progress", asyncHandler(getOnboardingProgress));
  router.get("/tasks", asyncHandler(getOnboardingTasks));
  router.patch("/task", asyncHandler(patchOnboardingTask));

  return router;
}

function createProfileStatusRouter() {
  const router = express.Router();

  router.get("/", asyncHandler(getProfileStatus));

  return router;
}

module.exports = {
  createOnboardingRouter,
  createProfileStatusRouter,
  ensureOnboardingSchema,
};
