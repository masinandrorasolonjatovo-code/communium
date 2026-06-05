const express = require("express");
<<<<<<< HEAD
const app = express();

app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
=======
const cors = require("cors");
const http = require("http");
const path = require("path");
const {
  createProfileRouter,
  createVerificationRouter,
  createVerificationAdminRouter,
  ensureProfileSchema,
  uploadsRoot,
} = require("./src/profileModule");
const {
  createAdminPartnerRouter,
  createAdminReportRouter,
  createAnalyticsRouter,
  createBillingRouter,
  createBusinessRouter,
  createPartnerRouter,
  createPaymentsRouter,
  createReportRouter,
  createSecurityRouter,
  createSubscriptionsRouter,
  createUserGovernanceRouter,
  ensureGovernanceSchema,
} = require("./src/governanceModule");
const {
  attachMessagesRealtime,
  createMessagesRouter,
  ensureMessagesSchema,
  messagesUploadsRoot,
} = require("./src/messagesModule");
const {
  createDashboardNotificationsRouter,
  createDashboardPostsRouter,
  createDashboardRouter,
  createDashboardSubscriptionsRouter,
} = require("./src/dashboardModule");
const {
  attachNotificationsRealtime,
  createHomeCommentsRouter,
  createHomeConnectionsRouter,
  createHomeEventsRouter,
  createHomeNotificationsRouter,
  createHomePostsRouter,
  createHomeProfilesRouter,
  createHomeSearchRouter,
  createSavedPostsRouter,
  ensureHomeSchema,
  postsUploadsRoot,
} = require("./src/homeModule");
const { createSettingsRouter, ensureSettingsSchema } = require("./src/settingsModule");
const {
  createOnboardingRouter,
  createProfileStatusRouter,
  ensureOnboardingSchema,
} = require("./src/onboardingModule");
require("dotenv").config({ quiet: true });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const allowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || `${FRONTEND_URL},http://127.0.0.1:3000,http://localhost:3000`)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const apiRateLimitStore = new Map();

app.disable("x-powered-by");

function apiRateLimit(req, res, next) {
  if (!req.path.startsWith("/api/")) {
    return next();
  }

  const windowMs = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000);
  const defaultMax = Number(process.env.API_RATE_LIMIT_MAX || 300);
  const strictMax = Number(process.env.API_RATE_LIMIT_STRICT_MAX || 60);
  const authMax = Number(process.env.API_RATE_LIMIT_AUTH_MAX || 30);
  const routeGroup = req.path.split("/").slice(0, 4).join("/");
  const key = `${req.ip}:${routeGroup}`;
  const now = Date.now();
  const maxRequests = req.path.startsWith("/api/payment") || req.path.startsWith("/api/payments")
    ? strictMax
    : req.path.startsWith("/api/auth")
      ? authMax
      : defaultMax;
  const recent = (apiRateLimitStore.get(key) || []).filter((stamp) => now - stamp < windowMs);

  if (recent.length >= maxRequests) {
    res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please try again shortly.",
    });
  }

  recent.push(now);
  apiRateLimitStore.set(key, recent);

  if (apiRateLimitStore.size > 5000) {
    for (const [storedKey, stamps] of apiRateLimitStore.entries()) {
      const active = stamps.filter((stamp) => now - stamp < windowMs);
      if (active.length) {
        apiRateLimitStore.set(storedKey, active);
      } else {
        apiRateLimitStore.delete(storedKey);
      }
    }
  }

  res.setHeader("X-RateLimit-Limit", maxRequests);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - recent.length));
  return next();
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin non autorisee par CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
});
app.use(apiRateLimit);

const staticUploadOptions = {
  dotfiles: "deny",
  etag: true,
  fallthrough: true,
  immutable: true,
  maxAge: "7d",
  setHeaders(res) {
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  },
};

app.use("/uploads/profile-pictures", express.static(path.join(uploadsRoot, "profile-pictures"), staticUploadOptions));
app.use("/uploads/banners", express.static(path.join(uploadsRoot, "banners"), staticUploadOptions));
app.use("/uploads/messages", express.static(messagesUploadsRoot, staticUploadOptions));
app.use("/uploads/posts", express.static(postsUploadsRoot, staticUploadOptions));
app.use("/uploads/:bucket/:filename", (req, res) => {
  res.status(404).type("html").send(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fichier indisponible</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
          main { max-width: 520px; margin: 24px; padding: 24px; border: 1px solid #dbe4ef; border-radius: 18px; background: #fff; box-shadow: 0 20px 50px rgba(15, 23, 42, .08); }
          h1 { margin: 0 0 10px; font-size: 1.35rem; }
          p { margin: 0; line-height: 1.5; color: #475569; }
        </style>
      </head>
      <body>
        <main>
          <h1>Fichier indisponible</h1>
          <p>Ce fichier n'est plus present sur le serveur. Republiez ou remplacez le fichier pour regenerer un lien valide.</p>
        </main>
      </body>
    </html>
  `);
});

ensureProfileSchema()
  .then(() => {
    console.log("Profile database schema ready");
  })
  .catch((error) => {
    console.warn("Profile database schema not ready yet:", error.message);
  });

ensureGovernanceSchema()
  .then(() => {
    console.log("Governance database schema ready");
  })
  .catch((error) => {
    console.warn("Governance database schema not ready yet:", error.message);
  });

ensureMessagesSchema()
  .then(() => {
    console.log("Messages database schema ready");
  })
  .catch((error) => {
    console.warn("Messages database schema not ready yet:", error.message);
  });

ensureSettingsSchema()
  .then(() => {
    console.log("Settings database schema ready");
  })
  .catch((error) => {
    console.warn("Settings database schema not ready yet:", error.message);
  });

ensureOnboardingSchema()
  .then(() => {
    console.log("Onboarding database schema ready");
  })
  .catch((error) => {
    console.warn("Onboarding database schema not ready yet:", error.message);
  });

ensureHomeSchema()
  .then(() => {
    console.log("Home database schema ready");
  })
  .catch((error) => {
    console.warn("Home database schema not ready yet:", error.message);
  });

const tiers = [
  {
    id: "free",
    name: "Free",
    priceUSD: 0,
    priceMAD: 0,
    features: ["Profil public", "Acces aux recommandations", "Messagerie limitee"],
  },
  {
    id: "silver",
    name: "Silver",
    priceUSD: 9.99,
    priceMAD: 100,
    trialDays: 30,
    features: ["Tout le plan Free", "Messagerie illimitee", "Support prioritaire"],
  },
  {
    id: "gold",
    name: "Gold",
    priceUSD: 24.99,
    priceMAD: 250,
    features: ["Tout le plan Silver", "Matching avance", "Export des contacts"],
    popular: true,
  },
  {
    id: "platinum",
    name: "Platinum",
    priceUSD: 49.99,
    priceMAD: 500,
    features: ["Tout le plan Gold", "Accompagnement personnalise", "Mentorat 1-a-1", "Support VIP"],
  },
];

function safeLocale(locale) {
  return typeof locale === "string" && locale.trim() ? locale.trim() : "fr";
}

function dashboardReturnUrl(locale, paymentState, tier) {
  return `${FRONTEND_URL}/${safeLocale(locale)}/dashboard?payment=${paymentState}&plan=${tier}`;
}

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "communium-backend",
    health: `http://localhost:${PORT}/health`,
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "communium-backend",
    aiServiceUrl: AI_SERVICE_URL,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/payment/tiers", (req, res) => {
  res.json({ tiers });
});

// MODULE M1 - Authentification, profils utilisateurs, KYC/KYB et reglages compte.
app.use("/api/profile/status", createProfileStatusRouter());
app.use("/api/profile", createProfileRouter());
app.use("/api/verification", createVerificationRouter());
app.use("/api/notifications", createHomeNotificationsRouter());
app.use("/api/posts", createHomePostsRouter());
app.use("/api/comments", createHomeCommentsRouter());
// MODULE M3 - Networking, connexions, matching et recherche avancee membres.
app.use("/api/profiles", createHomeProfilesRouter());
app.use("/api/connections", createHomeConnectionsRouter());
app.use("/api/events", createHomeEventsRouter());
app.use("/api/search", createHomeSearchRouter());
app.use("/api/saved", createSavedPostsRouter());
app.use("/api/admin", createVerificationAdminRouter());
app.use("/api/user", createUserGovernanceRouter());
app.use("/api/business", createBusinessRouter());
// MODULE M2 - Paiements, facturation, abonnements et economie Tks.
app.use("/api/billing", createBillingRouter());
app.use("/api/payments", createPaymentsRouter());
app.use("/api/subscriptions", createSubscriptionsRouter());
app.use("/api/analytics", createAnalyticsRouter());
app.use("/api/security", createSecurityRouter());
app.use("/api/settings", createSettingsRouter());
app.use("/api/onboarding", createOnboardingRouter());
app.use("/api/partners", createPartnerRouter());
app.use("/api/reports", createReportRouter());
app.use("/api/admin/partners", createAdminPartnerRouter());
app.use("/api/admin/reports", createAdminReportRouter());
app.use("/api/messages", createMessagesRouter());
app.use("/api/dashboard", createDashboardRouter());
app.use("/api/dashboard-posts", createDashboardPostsRouter());
app.use("/api/notifications", createDashboardNotificationsRouter());
app.use("/api/dashboard-subscriptions", createDashboardSubscriptionsRouter());

app.post("/api/payment/checkout/stripe", async (req, res) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const { userId, email, tier, currency = "usd", locale = "fr" } = req.body;
    const tierData = tiers.find((item) => item.id === tier);

    if (!tierData) {
      return res.status(400).json({ success: false, error: "Invalid tier" });
    }

    if (tierData.id === "free") {
      return res.status(400).json({
        success: false,
        error: "Free tier does not require checkout",
      });
    }

    if (!stripeSecretKey) {
      return res.status(202).json({
        success: true,
        manualActivation: true,
        message:
          "La demande de mise a niveau est prete. Connectez les cles Stripe pour activer le paiement en ligne.",
        tier: tierData.id,
      });
    }

    const stripe = require("stripe")(stripeSecretKey);
    const price = currency === "mad" ? tierData.priceMAD : tierData.priceUSD;
    const subscriptionData = {
      metadata: {
        userId: userId || "",
        tier: tierData.id,
      },
    };

    if (tierData.trialDays) {
      subscriptionData.trial_period_days = tierData.trialDays;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Communium ${tierData.name} Membership`,
              description: tierData.features.join(", "),
            },
            recurring: {
              interval: "month",
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      success_url: dashboardReturnUrl(locale, "success", tierData.id),
      cancel_url: dashboardReturnUrl(locale, "cancelled", tierData.id),
      metadata: {
        userId: userId || "",
        tier: tierData.id,
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      paymentUrl: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create Stripe checkout session",
      details: error.message,
    });
  }
});

app.post("/api/payment/checkout/cmi", async (req, res) => {
  try {
    const { tier } = req.body;
    const tierData = tiers.find((item) => item.id === tier);

    if (!tierData) {
      return res.status(400).json({ success: false, error: "Invalid tier" });
    }

    if (tierData.id === "free") {
      return res.status(400).json({
        success: false,
        error: "Free tier does not require checkout",
      });
    }

    if (!process.env.CMI_MERCHANT_ID) {
      return res.status(202).json({
        success: true,
        manualActivation: true,
        message:
          "Le paiement par carte marocaine est bien prevu dans le parcours, mais la connexion CMI n est pas encore configuree dans cet environnement.",
        tier: tierData.id,
      });
    }

    return res.status(202).json({
      success: true,
      manualActivation: true,
      message:
        "Le tunnel CMI est prepare, mais le connecteur bancaire final doit encore etre branche avant la redirection reelle vers la passerelle marocaine.",
      tier: tierData.id,
    });
  } catch (error) {
    console.error("CMI checkout error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to prepare CMI checkout",
      details: error.message,
    });
  }
});

app.post("/api/payment/checkout/paypal", async (req, res) => {
  try {
    const { tier } = req.body;
    const tierData = tiers.find((item) => item.id === tier);

    if (!tierData) {
      return res.status(400).json({ success: false, error: "Invalid tier" });
    }

    if (tierData.id === "free") {
      return res.status(400).json({
        success: false,
        error: "Free tier does not require checkout",
      });
    }

    return res.status(202).json({
      success: true,
      manualActivation: true,
      message:
        "PayPal est bien integre dans le workflow du site, mais il reste a connecter les identifiants marchands pour activer le paiement en ligne.",
      tier: tierData.id,
    });
  } catch (error) {
    console.error("PayPal checkout error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to prepare PayPal checkout",
      details: error.message,
    });
  }
});

app.get("/api/matching/sectors", async (req, res) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/matching/sectors-available`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const data = await response.json();
    res.json({
      success: true,
      sectors: data.sectors,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: "AI service unavailable",
      details: error.message,
    });
  }
});

app.get("/api/matching/recommendations", async (req, res) => {
  const mockUser = {
    id: 1,
    name: "Vous",
    email: "member@communium.local",
    sector: "Technology",
    sub_sectors: ["SaaS", "AI"],
    years_experience: 5,
    location: "Casablanca",
    interests: ["innovation", "startups"],
  };

  const mockCandidates = [
    {
      id: 2,
      name: "Amal Bennani",
      email: "amal@example.com",
      sector: "Technology",
      sub_sectors: ["AI", "Fintech"],
      years_experience: 9,
      location: "Casablanca",
      interests: ["investment", "mentoring"],
    },
    {
      id: 3,
      name: "Youssef El Idrissi",
      email: "youssef@example.com",
      sector: "Finance",
      sub_sectors: ["Fintech", "SaaS"],
      years_experience: 12,
      location: "Rabat",
      interests: ["growth", "networking"],
    },
  ];

  return fetchRecommendations(res, mockUser, mockCandidates, req.query.limit || 10);
});

app.post("/api/matching/recommendations", async (req, res) => {
  try {
    const { user, candidates = [], limit = 10 } = req.body;

    return fetchRecommendations(res, user, candidates, limit);
  } catch (error) {
    res.status(503).json({
      success: false,
      error: "Failed to get recommendations",
      details: error.message,
    });
  }
});

async function fetchRecommendations(res, user, candidates, limit) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/matching/sector-based?limit=${limit}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, candidates }),
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const matches = await response.json();
    const formattedMatches = matches.map((match) => ({
      userId: match.user_id,
      name: match.name,
      sector: match.sector,
      matchScore: match.match_score,
      commonSectors: match.common_sectors,
      reason: match.reason,
    }));

    res.json({
      success: true,
      count: formattedMatches.length,
      matches: formattedMatches,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: "Failed to get recommendations",
      details: error.message,
    });
  }
}

const realtime = attachMessagesRealtime(server, allowedOrigins);
attachNotificationsRealtime(realtime);

server.listen(PORT, () => {
  console.log(`Communium backend running on http://localhost:${PORT}`);
});
>>>>>>> 12f16f5bfd58ead24e306b997f29204f1a9543d8
