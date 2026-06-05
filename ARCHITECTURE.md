# Communium Architecture & System Design

Derniere mise a jour: 2026-05-30

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER'S DEVICE (Browser/Mobile)                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Communium Frontend (Next.js)                  │  │
│  │                                                                  │  │
│  │  ┌────────────────────┐  ┌────────────────────┐              │  │
│  │  │  Sign In/Sign Up   │  │     Dashboard      │              │  │
│  │  │   (via Clerk)      │  │  - View Matches    │              │  │
│  │  │                    │  │  - Upgrade Tier    │              │  │
│  │  │  ✓ MFA for VIP     │  │  - Manage Profile  │              │  │
│  │  └────────────────────┘  └────────────────────┘              │  │
│  │                                                                  │  │
│  │  Languages: EN, FR, AR (RTL), ES, DE, ZH, JA, PT, RU          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────────────────────────────┘
               │
               │ HTTPS/GraphQL
               │
┌──────────────▼──────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                                   │
│                     (Node.js + Express + TypeScript)                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    API Gateway / Routes                          │ │
│  │                                                                  │ │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐ │ │
│  │  │  Authentication │  │   Matching   │  │     Payment        │ │ │
│  │  │  Routes         │  │   Routes     │  │     Routes         │ │ │
│  │  │                 │  │              │  │                    │ │ │
│  │  │ /auth/clerk     │  │ /matching/   │  │ /payment/          │ │ │
│  │  │ /auth/mfa       │  │ recomm.      │  │ stripe             │ │ │
│  │  │ /auth/profile   │  │ /sectors     │  │ /cmi               │ │ │
│  │  │                 │  │ /filter      │  │ /tiers             │ │ │
│  │  └─────────────────┘  └──────────────┘  └────────────────────┘ │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                           │         │           │                      │
│                           │         │           │                      │
└───────────────────────────┼─────────┼───────────┼──────────────────────┘
                            │         │           │
                ┌───────────┼─────────┼───────────┼──────────┐
                │           │         │           │          │
                ▼           ▼         ▼           ▼          ▼
        ┌──────────────┐ ┌────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐
        │   Clerk      │ │ AI     │ │ Stripe   │ │ CMI  │ │ Database │
        │              │ │Service │ │          │ │      │ │          │
        │ • Auth       │ │        │ │• Checkout│ │• MAD │ │PostgreSQL│
        │ • JWT        │ │FastAPI │ │• Webhook │ │Payment│ │          │
        │ • MFA        │ │        │ │• USD/EUR │ │Form  │ │ Users    │
        │              │ │Python  │ │          │ │      │ │ Profiles │
        │              │ │        │ │ Matching │ │      │ │ Membr.   │
        │              │ │Sector- │ │  Score   │ │      │ │ Matches  │
        │              │ │based   │ │Validator │ │      │ │          │
        └──────────────┘ └────────┘ └──────────┘ └──────┘ └──────────┘
              ▲            ▲            ▲           ▲         ▲
              │            │            │           │         │
              └─────┬──────┘            │           │         │
                    │                   │           │         │
            ┌───────▼─────────────────┬─┴───────────┴─────────┴────┐
            │                         │                            │
            ▼                         ▼                            ▼
    ┌──────────────────┐     ┌──────────────────┐      ┌──────────────────┐
    │     Redis        │     │  Queue Service   │      │  Message Broker  │
    │  (Caching &      │     │  (Background     │      │  (Notifications) │
    │   Sessions)      │     │   Jobs)          │      │                  │
    │                  │     │                  │      │  • Email         │
    │ • User sessions  │     │ • Match scoring  │      │  • SMS           │
    │ • Match cache    │     │ • Payment proc.  │      │  • Push          │
    │ • Auth tokens    │     │ • KYC verify     │      │  • Real-time     │
    └──────────────────┘     └──────────────────┘      └──────────────────┘
```

---

## 🔄 Data Flow: User Matching

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. User Views Dashboard                                          │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. Frontend Requests Matches                                     │
│    GET /api/matching/recommendations (with JWT token)            │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. Backend Authenticates Request                                 │
│    - Verify Clerk JWT token                                     │
│    - Check MFA if VIP                                           │
│    - Load user profile from database                            │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. Backend Calls AI Service                                      │
│    POST /api/matching/sector-based                              │
│    - User profile (sector, experience, location)                │
│    - List of candidate users                                    │
│    - Limit: 10 results                                          │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. AI Service Calculates Scores                                  │
│                                                                  │
│ For each candidate:                                             │
│  • Sector match (40%)  = common sectors / total                │
│  • Experience (30%)    = compatibility bonus                   │
│  • Location (20%)      = same city/region bonus               │
│  • Total (10%)         = average availability                  │
│                                                                  │
│ Score = min(100, weighted_sum + bonus)                        │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. AI Service Returns Matches                                    │
│    [                                                             │
│      {                                                           │
│        userId: 42,                                              │
│        name: "Fatima",                                          │
│        sector: "Technology",                                    │
│        matchScore: 82.5,                                        │
│        commonSectors: ["SaaS", "AI"],                          │
│        reason: "Shared SaaS interest - Great mentor"           │
│      }                                                           │
│    ]                                                             │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. Backend Caches Results (Redis)                                │
│    - Key: "matches:user123"                                     │
│    - TTL: 1 hour                                                │
│    - Reduces AI service calls                                   │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. Frontend Displays Recommendations                             │
│    - Show match cards with scores                               │
│    - Display common interests                                   │
│    - Button to view full profile                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💳 Payment Flow

### International (Stripe)

```
┌─────────────────────────────┐
│ User Clicks "Upgrade"       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Frontend Detects Country    │
│ (from locale: en, fr, ar)   │
└──────────────┬──────────────┘
               │
           Stripe│
           (Int'l)
               │
               ▼
┌─────────────────────────────┐
│ Backend Creates Session     │
│ POST /payment/checkout/stripe
│ {                           │
│   userId, tier, currency    │
│ }                           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Stripe Checkout Session     │
│ - Line items: membership    │
│ - Payment method: card      │
│ - Success URL: /success     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ User Pays                   │
│ Card: 4242 4242 4242 4242  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Stripe Webhook              │
│ checkout.session.completed  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Backend Updates DB          │
│ UPDATE memberships          │
│ SET tier = 'gold'           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Frontend Shows Success      │
│ Redirect to /dashboard      │
└─────────────────────────────┘
```

### Morocco (CMI)

```
┌─────────────────────────────┐
│ User Clicks "Upgrade"       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Frontend Detects Morocco    │
│ (locale: ar, location: MA)  │
└──────────────┬──────────────┘
               │
              CMI│
            (MAD)
               │
               ▼
┌─────────────────────────────┐
│ Backend Creates CMI Payment │
│ POST /payment/checkout/cmi  │
│ {                           │
│   userId, tier              │
│ }                           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ CMI Payment Form            │
│ Amount: 250 MAD             │
│ Currency: MAD               │
│ Merchant: communium         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ User Pays via CMI           │
│ (Bank card, transfer, etc)  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ CMI Callback                │
│ POST /payment/callback/cmi  │
│ {                           │
│   OrderId, Status: "0"      │
│ }                           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Backend Verifies Signature  │
│ Updates membership tier     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Success!                    │
│ User now Gold member        │
└─────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────────┐
│ User Accesses /dashboard             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Check Clerk Session                  │
│ (Client-side via useAuth hook)       │
└──────────────┬───────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   No  │                │ Yes
   Auth│                │ Auth
       │                │
       ▼                ▼
  Redirect to    ┌──────────────────┐
  /auth/sign-in  │ Session Valid?   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Get JWT Token    │
                 │ (from Clerk)     │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Attach to Auth   │
                 │ Bearer {token}   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Send API Request │
                 │ GET /api/matches │
                 │ with JWT         │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Backend:         │
                 │ Verify Token     │
                 │ Extract userId   │
                 │ Check MFA (VIP)  │
                 └────────┬─────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
            Valid│                   │Invalid
                │                    │
                ▼                    ▼
           ┌─────────┐          ┌──────────┐
           │ Allow   │          │ 401      │
           │ Request │          │ Unauthorized
           └─────────┘          └──────────┘
                │
                ▼
           Return Data
```

---

## 📊 Matching Algorithm Breakdown

```
SCORE CALCULATION FOR 2 USERS
═══════════════════════════════════════════════════════════════

User A (VIP, 8 yrs exp, Casablanca)        User B (Regular, 3 yrs exp, Casablanca)
├─ Sector: Technology                       ├─ Sector: Technology
├─ Sub-sectors: [SaaS, AI]                  ├─ Sub-sectors: [SaaS, Web]
├─ Interests: [innovation, startups]        ├─ Interests: [learning, startups]
└─ Location: Casablanca                     └─ Location: Casablanca

STEP 1: SECTOR MATCHING (40% weight)
────────────────────────────────────
Common: {SaaS}                              → 1 common out of 3 unique
Score: 1/3 = 33.33%
Contribution: 33.33% × 0.4 = 13.33

STEP 2: EXPERIENCE COMPATIBILITY (30% weight)
──────────────────────────────────────────────
Gap: |8 - 3| = 5 years
Category: "Great learning opportunity"
Bonus: 20 points
Contribution: 20 × 0.5 = 10 (double-weighted)

STEP 3: LOCATION BONUS (20% weight)
────────────────────────────────────
Same City (Casablanca)
Bonus: 15 points
Contribution: 15 × 0.2 = 3

STEP 4: AVAILABILITY (10% weight)
──────────────────────────────────
Average: (user1_availability + user2_availability) / 2
Assume: 85 + 75 / 2 = 80%
Contribution: 80 × 0.1 = 8

STEP 5: ROLE BONUS
──────────────────
VIP + Regular = Cross-role = +5 points

TOTAL SCORE
───────────
13.33 + 10 + 3 + 8 + 5 = 39.33 → 40/100

REASON
──────
"Shared interest in SaaS - You could be a mentor (5-year gap)"
```

---

## 🌐 Multi-Language & RTL Support

```
SUPPORTED LANGUAGES
═══════════════════════════════════════════

┌─────────────────────────────────────┐
│ English (en)        LTR              │
│ Français (fr)       LTR              │
│ العربية (ar)        RTL              │
│ Español (es)        LTR              │
│ Deutsch (de)        LTR              │
│ 中文 (zh)            LTR              │
│ 日本語 (ja)         LTR              │
│ Português (pt)      LTR              │
│ Русский (ru)        LTR              │
└─────────────────────────────────────┘

ROUTING:
────────
/en/dashboard       → English
/fr/dashboard       → Français
/ar/dashboard       → العربية (with dir="rtl")
/es/dashboard       → Español
...

LOCALE DETECTION:
─────────────────
1. URL: /ar/dashboard → ar
2. Browser preference fallback
3. User setting in database
```

---

## 🔒 Security Layers

```
SECURITY ARCHITECTURE
═════════════════════════════════════════════════════════════

CLIENT SIDE
┌─────────────────────────────┐
│ • Clerk Session validation  │
│ • HTTPS only                │
│ • CSRF tokens               │
│ • Secure cookies            │
└─────────────────────────────┘

SERVER SIDE
┌─────────────────────────────┐
│ • JWT verification (Clerk)  │
│ • MFA enforcement (VIP)     │
│ • Rate limiting             │
│ • Input validation          │
│ • SQL injection prevention  │
│ • CORS configuration        │
└─────────────────────────────┘

PAYMENT SECURITY
┌─────────────────────────────┐
│ • Stripe: PCI-DSS L1        │
│ • CMI: Encrypted + signed   │
│ • No card storage           │
│ • Webhook verification      │
│ • TLS 1.2+ encryption       │
└─────────────────────────────┘

DATABASE SECURITY
┌─────────────────────────────┐
│ • PostgreSQL password auth  │
│ • Encrypted connections     │
│ • Sensitive data encrypted  │
│ • Access control via roles  │
│ • Regular backups           │
└─────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
PRODUCTION SETUP
════════════════════════════════════════════════════════════

                    ┌──────────────┐
                    │ Cloudflare   │
                    │ CDN / WAF    │
                    └───────┬──────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │Frontend  │  │Backend   │  │AI Service│
        │(Vercel)  │  │(Railway) │  │(Railway) │
        └──────────┘  └──────────┘  └──────────┘
                │           │           │
                └───────────┼───────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────┐        ┌─────────┐       ┌──────────┐
    │PostgreSQL│       │  Redis  │       │S3 Backup │
    │ (Cloud)  │       │ (Cloud) │       │(Archive) │
    └─────────┘        └─────────┘       └──────────┘
         │
    ┌────┴────┐
    │Automated│ Backups every 4 hours
    │Backups  │ Retention: 30 days
    └─────────┘

EXTERNAL SERVICES
═════════════════
├─ Clerk (Auth)
├─ Stripe (Payments - USD)
├─ CMI (Payments - MAD)
├─ SendGrid (Email)
├─ Sentry (Error tracking)
└─ Mixpanel (Analytics)
```

This architecture ensures:
- **High availability** (Load balanced)
- **Performance** (CDN, caching)
- **Security** (WAF, TLS)
- **Scalability** (Auto-scaling)
- **Reliability** (Backups, monitoring)
