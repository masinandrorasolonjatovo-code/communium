/**
 * Architecture fonctionnelle Communium.
 *
 * Ce registre sert de carte code -> module cahier des charges.
 * Quand une route, une table ou un composant est ajoute, il doit etre rattache
 * a un module ici pour rester identifiable dans l'architecture.
 */

const functionalModules = [
  {
    id: "M1",
    name: "Authentification et profils utilisateurs",
    branches: ["M1-01 Authentification", "M1-02 Verification KYC/KYB", "M1-03 Profil personnel", "M1-04 Profil business", "M1-05 Adhesion"],
    backend: {
      modules: ["src/profileModule.js", "src/onboardingModule.js", "src/settingsModule.js", "src/governanceModule.js"],
      routePrefixes: ["/api/profile", "/api/profile/status", "/api/verification", "/api/admin", "/api/settings", "/api/onboarding"],
      tables: ["users", "profiles", "profile_settings", "verifications", "verification_documents", "memberships"],
    },
    frontend: {
      pages: [
        "app/[locale]/auth/*",
        "app/[locale]/profile/*",
        "app/[locale]/dashboard/profile/page.tsx",
        "app/[locale]/verification/page.tsx",
        "app/[locale]/settings/*",
      ],
      components: ["components/profile/*", "components/verification/*", "components/settings/*"],
    },
  },
  {
    id: "M2",
    name: "Paiements et economie Tks",
    branches: ["M2-01 Stripe", "M2-02 CMI", "M2-03 Wallet Tks", "M2-04 Achat de Tks"],
    backend: {
      modules: ["src/routes/payment.ts", "src/governanceModule.js", "server.js"],
      routePrefixes: ["/api/payment", "/api/payments", "/api/billing", "/api/subscriptions"],
      tables: ["payment_methods", "billing_invoices", "subscriptions"],
    },
    frontend: {
      pages: ["app/[locale]/checkout/*", "app/[locale]/billing/*", "app/[locale]/premium/page.tsx"],
      components: ["components/premium/*"],
    },
  },
  {
    id: "M3",
    name: "Networking, connexions et matching",
    branches: ["M3-01 Systeme de connexions", "M3-02 Matching intelligent", "M3-03 Recherche avancee membres"],
    backend: {
      modules: ["src/homeModule.js", "src/routes/matching.ts", "../ai-service/matching_service.py"],
      routePrefixes: ["/api/connections", "/api/profiles/suggestions", "/api/search", "/api/matching"],
      tables: ["connections", "connection_match_events", "saved_member_searches", "app_notifications"],
    },
    frontend: {
      pages: ["app/[locale]/discover/page.tsx", "app/[locale]/search/page.tsx"],
      components: ["components/network/NetworkCenter.tsx"],
    },
  },
];

function findFunctionalModuleByRoute(routePrefix) {
  return functionalModules.find((moduleItem) =>
    moduleItem.backend.routePrefixes.some((prefix) => routePrefix.startsWith(prefix))
  );
}

module.exports = {
  functionalModules,
  findFunctionalModuleByRoute,
};
