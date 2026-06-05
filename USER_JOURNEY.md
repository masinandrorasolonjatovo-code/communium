# User Journey & Feature Flow Diagrams

Derniere mise a jour: 2026-05-30

## 👤 Complete User Journey

### 1. Signup & Onboarding Flow

```
┌─────────────────────────────────────────────────────────┐
│ User Lands on Communium Homepage                        │
│ (/)                                                     │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
     ┌─────────────────┐
     │ Click "Sign Up" │
     └────────┬────────┘
              │
              ▼
     ┌─────────────────────────────────────┐
     │ /auth/sign-up                       │
     │ ✓ Email input                       │
     │ ✓ Password input                    │
     │ ✓ Accept Terms                      │
     └────────┬────────────────────────────┘
              │
              ▼
     ┌─────────────────────────────────────┐
     │ Clerk Verification                  │
     │ • Send verification email           │
     │ • User clicks link                  │
     │ • Account created                   │
     └────────┬────────────────────────────┘
              │
              ▼
     ┌─────────────────────────────────────┐
     │ FIRST-TIME: /dashboard/profile      │
     │ ✓ Create Professional Profile       │
     │ ✓ Sector selection                  │
     │ ✓ Experience level                  │
     │ ✓ Location                          │
     │ ✓ Upload identity doc               │
     └────────┬────────────────────────────┘
              │
              ▼
     ┌─────────────────────────────────────┐
     │ Profile Saved                       │
     │ Email verification sent             │
     │ Ready to browse matches!            │
     └────────┬────────────────────────────┘
              │
              ▼
     ┌─────────────────────────────────────┐
     │ Redirect to /dashboard              │
     │ 🎉 Welcome! Here are your matches   │
     └─────────────────────────────────────┘
```

### 2. Matching Discovery Flow

```
┌──────────────────────────────────────────────────────┐
│ User on /dashboard                                   │
│ • View recommended matches                          │
│ • Sorted by match score (highest first)             │
│ • Shows common sectors & interests                  │
└──────────────┬───────────────────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        │             │          │
        ▼             ▼          ▼
    View      View        Send
   Details   Profile    Connection
      │         │          │
      ▼         ▼          ▼
  ┌─────┐  ┌─────┐    ┌────────┐
  │ See │  │ See │    │Request │
  │Full │  │ All │    │  Sent  │
  │Info │  │Info │    │ (Wait) │
  └─────┘  └─────┘    └────────┘
      │         │          │
      └─────────┼──────────┘
                │
                ▼
      ┌──────────────────────┐
      │ More Matches?        │
      │ Click "See More"     │
      │ or                   │
      │ Scroll Down          │
      └──────────────────────┘
                │
        ┌───────┴───────┐
        │ Yes           │ No
        ▼               ▼
   Load More      Continue
   Matches      Browsing
                   │
                   ▼
          ┌──────────────────┐
          │ Refine Search    │
          │ • By sector      │
          │ • By location    │
          │ • By experience  │
          └──────────────────┘
```

### 3. Premium Upgrade Flow

```
┌────────────────────────────────────────────────────┐
│ User Clicks "Upgrade to Gold" Button               │
└──────────────┬─────────────────────────────────────┘
               │
               ▼
     ┌──────────────────────────┐
     │ Detect Country/Locale    │
     │ Arabic (ar) or in Morocco?
     └────────┬─────────────────┘
              │
      ┌───────┴────────┐
      │                │
    Stripe         CMI (MAD)
   (International)
      │                │
      ▼                ▼
   ┌─────────┐    ┌──────────┐
   │ Create  │    │ Create   │
   │ Stripe  │    │  CMI     │
   │Session  │    │ Payment  │
   │(USD)    │    │ (MAD)    │
   └────┬────┘    └────┬─────┘
        │              │
        ▼              ▼
   ┌──────────┐   ┌──────────┐
   │Checkout  │   │Payment   │
   │Page      │   │Form      │
   │(Hosted)  │   │(Modal)   │
   └────┬─────┘   └────┬─────┘
        │              │
    ┌───┴───┐      ┌───┴───┐
    │ Yes   │No    │ Yes   │No
    ▼       ▼      ▼       ▼
  Pay   Cancel  Pay   Cancel
    │       │      │       │
    ├───────┴──────┴───────┤
    │                      │
    ▼                      ▼
┌────────┐            ┌─────────┐
│Success │            │ Canceled│
│Page    │            │ Page    │
└────┬───┘            └────┬────┘
     │                     │
     ▼                     ▼
 Update DB          Stay on
 Webhook            Dashboard
     │                     │
     ▼                     ▼
 Membership ←────→ Option to
 Granted       Retry Payment
 
 New Features:
 ✓ Advanced filters
 ✓ Unlimited messages
 ✓ Export contacts
 ✓ VIP badge
```

### 4. Connection & Messaging Flow

```
┌─────────────────────────────────────────────────────┐
│ User Sends Connection Request                       │
│ (Assuming Premium Membership)                       │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
     ┌──────────────────────────┐
     │ POST /api/matching/      │
     │ connect/:targetUserId    │
     └────────┬─────────────────┘
              │
              ▼
     ┌──────────────────────────┐
     │ Store in Database        │
     │ Status: "pending"        │
     └────────┬─────────────────┘
              │
    ┌─────────┴─────────────┐
    │                       │
    ▼                       ▼
┌──────────┐           ┌──────────┐
│Send Email│           │Send Push │
│to Target │           │Notif     │
└──────────┘           └──────────┘
    │                       │
    └─────────┬─────────────┘
              │
              ▼
     ┌──────────────────────────┐
     │ Target User Views        │
     │ Connection Request       │
     └────────┬─────────────────┘
              │
      ┌───────┴────────┐
      │                │
    Accept          Decline
      │                │
      ▼                ▼
┌──────────┐       ┌─────────┐
│Connection│       │Request  │
│Confirmed │       │Archived │
└────┬─────┘       └────┬────┘
     │                  │
     ▼                  ▼
 ┌─────────────┐
 │Chat Room    │
 │Created      │
 │             │
 │ Messages:   │
 │ • View      │
 │ • Send      │
 │ • Block     │
 │ • Report    │
 └─────────────┘
     │
     ▼
 ┌─────────────┐
 │Real-time    │
 │Updates via  │
 │Socket.io    │
 └─────────────┘
```

---

## 🎯 Feature Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMMUNIUM PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ AUTHENTICATION LAYER (Clerk)                            │  │
│  │ • Sign in/up                                            │  │
│  │ • JWT tokens                                            │  │
│  │ • MFA for VIP                                           │  │
│  │ • Session management                                    │  │
│  └────┬────────────────────────────────────────────────────┘  │
│       │                                                         │
│  ┌────┴──────────────────────────────────────────────────────┐ │
│  │ USER MANAGEMENT                                          │ │
│  │ • Profile creation/editing                              │ │
│  │ • KYC verification                                       │ │
│  │ • Preferences & settings                                │ │
│  │ • Privacy controls                                       │ │
│  └────┬──────────────────────────────────────────────────────┘ │
│       │                                                         │
│  ┌────┴──────────────────────────────────────────────────────┐ │
│  │ MATCHING ENGINE (AI Service)                            │ │
│  │ • Sector-based matching                                 │ │
│  │ • Experience compatibility                              │ │
│  │ • Location proximity                                    │ │
│  │ • Scoring algorithm                                     │ │
│  │ • Caching (Redis)                                       │ │
│  └────┬──────────────────────────────────────────────────────┘ │
│       │                                                         │
│       ├──────────────────┬──────────────────┬─────────────────┐ │
│       │                  │                  │                 │ │
│       ▼                  ▼                  ▼                 ▼ │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────┐  ┌────────────┐ │
│  │CONNECTIONS  │  │MESSAGING │  │MEMBERSHIP   │  │ANALYTICS   │ │
│  │             │  │          │  │             │  │            │ │
│  │• Send req   │  │• Chat    │  │• Free       │  │• Matches   │ │
│  │• Accept/    │  │• Groups  │  │• Silver $10 │  │• Activity  │ │
│  │  Decline    │  │• Notif   │  │• Gold $25   │  │• Trends    │ │
│  │• Unmatched  │  │• Block   │  │• Plat $50   │  │• Revenue   │ │
│  │• Stats      │  │• Archive │  │• Trial 7d   │  │• Churn     │ │
│  └─────────────┘  └──────────┘  └─────────────┘  └────────────┘ │
│       │                                                         │
│  ┌────┴──────────────────────────────────────────────────────┐ │
│  │ PAYMENT LAYER                                            │ │
│  │ • Stripe Checkout (USD)                                  │ │
│  │ • CMI Gateway (MAD)                                      │ │
│  │ • Webhook handlers                                       │ │
│  │ • Subscription management                                │ │
│  │ • Invoice generation                                     │ │
│  └────┬──────────────────────────────────────────────────────┘ │
│       │                                                         │
│  ┌────┴──────────────────────────────────────────────────────┐ │
│  │ DATA LAYER (PostgreSQL)                                  │ │
│  │ • Users (roles, metadata)                                │ │
│  │ • Profiles (KYC data)                                    │ │
│  │ • Memberships (tier, subscription)                       │ │
│  │ • Matches (history, scores)                              │ │
│  │ • Messages (chat history)                                │ │
│  │ • Transactions (payments)                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Matching Algorithm Decision Tree

```
USER REQUESTS MATCHES
│
├─ Get User Profile from DB
│  ├─ Sector: Technology
│  ├─ Sub-sectors: [SaaS, AI]
│  ├─ Experience: 8 years
│  └─ Location: Casablanca
│
├─ Get All Candidates from DB
│  └─ Exclude: Self, already matched, blocked
│
├─ For Each Candidate:
│  │
│  ├─ SECTOR MATCH (40% weight)
│  │  ├─ Common sectors? → Jaccard similarity
│  │  └─ Score: 0-100
│  │
│  ├─ EXPERIENCE COMPATIBILITY (30% weight)
│  │  ├─ Experience gap > 2 years?
│  │  ├─ Can mentor/be mentored?
│  │  └─ Bonus: 0-25 points
│  │
│  ├─ LOCATION MATCH (20% weight)
│  │  ├─ Same city? → +15 points
│  │  ├─ Same region? → +10 points
│  │  └─ Different region → +0 points
│  │
│  ├─ AVAILABILITY (10% weight)
│  │  ├─ Check if available now
│  │  └─ Score: 0-100
│  │
│  └─ FINAL CALCULATION
│     ├─ weighted_score = (sector*0.4) + (experience*0.3) + 
│     │                   (location*0.2) + (availability*0.1)
│     ├─ Add bonuses
│     └─ Cap at 100
│
├─ Filter by Threshold (30+ score)
│
├─ Sort by Score (Descending)
│
├─ Cache Results (Redis)
│
└─ Return Top 10 Matches to User
   └─ Include score + reason explanation
```

---

## 💰 Revenue Model & Tiers

```
FREE TIER
┌────────────────────────┐
│ Basic Profile          │ → $0/month
│ • View matches         │
│ • Limited messages     │ Conversions:
│ • See sector basics    │ → 5% to Silver
│                        │ → 1% to Gold
└────────────────────────┘

SILVER TIER
┌────────────────────────┐
│ Professional          │ → $9.99 USD
│ • Unlimited messaging │ → 100 MAD
│ • Export contacts    │
│ • Priority support   │ Conversions:
│                      │ → 20% to Gold
└────────────────────────┘

GOLD TIER (Recommended)
┌────────────────────────┐
│ Elite Access          │ → $24.99 USD
│ • Advanced filters    │ → 250 MAD
│ • Premium matching    │
│ • Analytics           │ Most Popular!
│ • Team collaboration  │
│                       │ Conversions:
│                       │ → 10% to Platinum
└────────────────────────┘

PLATINUM TIER
┌────────────────────────┐
│ VIP Treatment        │ → $49.99 USD
│ • Personal matchmaker│ → 500 MAD
│ • Concierge service  │
│ • 1-on-1 mentoring   │ Conversions:
│ • Exclusive events   │ → Retains 95%
│ • Priority webhook   │   (highest value)
└────────────────────────┘

MONETIZATION BREAKDOWN
═════════════════════════════════════════
Year 1 Projections (Moroccan Elite Market):
  • Free users: 1,000 (5% conversion)
  • Silver users: 50 (avg $10/mo)
  • Gold users: 40 (avg $25/mo) ← PRIMARY
  • Platinum users: 10 (avg $50/mo) ← HIGH-VALUE

MRR = (50 × $10) + (40 × $25) + (10 × $50)
    = $500 + $1,000 + $500
    = $2,000/month

ARR = $2,000 × 12 = $24,000 (Conservative)

Growth Path:
Year 2: 3x → $72,000 ARR
Year 3: 5x → $120,000 ARR
```

---

## 🛣️ Product Roadmap

```
MVP (NOW) ✓
├─ Authentication (Clerk)
├─ Basic matching (Sector-based)
├─ Payment (Stripe + CMI)
└─ Dashboard + Profile

PHASE 1 (Month 2-3)
├─ Real-time messaging (Socket.io)
├─ Advanced filtering
├─ KYC verification
├─ Admin dashboard
└─ Email notifications

PHASE 2 (Month 4-5)
├─ Networking events
├─ Group matching
├─ Mentorship programs
├─ Skills marketplace
└─ Community features

PHASE 3 (Month 6-12)
├─ Mobile app (iOS/Android)
├─ Video calls
├─ AI-powered recommendations
├─ Reputation system
├─ Partnership features
└─ Analytics dashboard

LONG-TERM (Year 2+)
├─ International expansion
├─ Enterprise features
├─ Marketplace
├─ Education platform
├─ Investment syndication
└─ Brand partnerships
```

---

**Total Estimated User Journey: Signup → First Match → Payment = 15-30 minutes**

*Goal: Reduce to <5 minutes through onboarding optimization*
