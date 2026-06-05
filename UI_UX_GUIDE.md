# UI/UX Flow & Visual Guide

Derniere mise a jour: 2026-05-30

## 🎨 Complete User Interface Flow

### 1. Authentication Pages

#### Sign-Up Page (`/auth/sign-up`)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│             🌟 COMMUNIUM 🌟                    │
│     Connectez-vous. Apprenez. Grandissez.      │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ 📧 Email Address                         │  │
│  │ ┌─────────────────────────────────────┐  │  │
│  │ │ your@email.com                      │  │  │
│  │ └─────────────────────────────────────┘  │  │
│  │                                          │  │
│  │ 🔑 Password                             │  │
│  │ ┌─────────────────────────────────────┐  │  │
│  │ │ ••••••••••                          │  │  │
│  │ └─────────────────────────────────────┘  │  │
│  │                                          │  │
│  │ ☐ I agree to Terms of Service          │  │
│  │                                          │  │
│  │ ┌─────────────────────────────────────┐  │  │
│  │ │    CREATE ACCOUNT                   │  │  │
│  │ │    (Blue Button - Primary CTA)      │  │  │
│  │ └─────────────────────────────────────┘  │  │
│  │                                          │  │
│  │ ──────── OR ────────                    │  │
│  │                                          │  │
│  │ [ Google ] [ LinkedIn ]                 │  │
│  │                                          │  │
│  │ Already have account? Sign In           │  │
│  │ (Blue Link)                             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Language: EN | FR | AR | ES | DE             │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Sign-In Page (`/auth/sign-in`)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         WELCOME BACK TO COMMUNIUM               │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ 📧 Email                                 │  │
│  │ ┌─────────────────────────────────────┐  │  │
│  │ │ your@email.com                      │  │  │
│  │ └─────────────────────────────────────┘  │  │
│  │                                          │  │
│  │ 🔑 Password                             │  │
│  │ ┌─────────────────────────────────────┐  │  │
│  │ │ ••••••••••                          │  │  │
│  │ └─────────────────────────────────────┘  │  │
│  │                                          │  │
│  │ ☐ Remember Me    [Forgot Password?]     │  │
│  │                                          │  │
│  │ ┌─────────────────────────────────────┐  │  │
│  │ │    SIGN IN                          │  │  │
│  │ └─────────────────────────────────────┘  │  │
│  │                                          │  │
│  │ ──────── OR ────────                    │  │
│  │                                          │  │
│  │ [ Google ] [ LinkedIn ]                 │  │
│  │                                          │  │
│  │ Don't have account? Sign Up             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 2. Profile Creation Page

#### First Login - Complete Profile (`/dashboard/profile`)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ STEP 1: COMPLETE YOUR PROFILE                              │
│ Progress: ████████░░░░░ 60%                               │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ PERSONAL INFORMATION                                  │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ First Name          │ Last Name                       │  │
│ │ ┌─────────────────┬─┴─────────────────────────────┐   │  │
│ │ │ Fatima          │ Ben Ahmed                    │   │  │
│ │ └────────────────┬─┘─────────────────────────────┘   │  │
│ │                                                       │  │
│ │ Date of Birth         Location                       │  │
│ │ ┌─────────────────┬─────────────────────────────┐   │  │
│ │ │ 1990-05-15  ▼   │ Casablanca▼                │   │  │
│ │ └─────────────────┴─────────────────────────────┘   │  │
│ │                                                       │  │
│ │ PROFESSIONAL INFORMATION                              │  │
│ │ Primary Sector                                        │  │
│ │ ┌───────────────────────────────────────────────┐   │  │
│ │ │ Technology  ▼                                 │   │  │
│ │ └───────────────────────────────────────────────┘   │  │
│ │                                                       │  │
│ │ Sub-sectors (Select all that apply)                 │  │
│ │ ☑ SaaS    ☑ AI    ☐ Blockchain   ☐ Mobile         │  │
│ │ ☐ Backend ☐ Frontend ☑ DevOps     ☐ Fintech        │  │
│ │                                                       │  │
│ │ Years of Experience                                  │  │
│ │ ┌───────────────────────────────────────────────┐   │  │
│ │ │ ●─────────────────── 8 years                 │   │  │
│ │ └───────────────────────────────────────────────┘   │  │
│ │ (Range: 1-50 years)                                 │  │
│ │                                                       │  │
│ │ IDENTITY VERIFICATION (Optional for MVP)              │  │
│ │ Upload ID Document                                   │  │
│ │ ┌───────────────────────────────────────────────┐   │  │
│ │ │ 📄 Choose File         [Upload]               │   │  │
│ │ └───────────────────────────────────────────────┘   │  │
│ │                                                       │  │
│ │ ┌──────────────────┐        ┌──────────────────┐   │  │
│ │ │ BACK             │        │ SAVE & CONTINUE  │   │  │
│ │ │ (Gray)           │        │ (Blue)           │   │  │
│ │ └──────────────────┘        └──────────────────┘   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Dashboard - Matches Page

#### Main Dashboard (`/dashboard`)
```
┌──────────────────────────────────────────────────────────────────┐
│ COMMUNIUM                    🔍 Search  👤 Profile  🌐 EN ▼      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ WELCOME, FATIMA! 👋                                             │
│                                                                  │
│ Your Personal Matches (Based on Technology + SaaS)             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [1]                                                        │ │
│ │ ┌──────────────────────┐        ┌────────────────────────┐ │ │
│ │ │ 📷 Profile Photo     │        │ 82% MATCH ⭐          │ │ │
│ │ │                      │        │ (Great Mentor Opp.)   │ │ │
│ │ │                      │        │                        │ │ │
│ │ │                      │        │ Mohamed El Idrissi     │ │ │
│ │ │                      │        │ 10 years exp          │ │ │
│ │ │                      │        │ Technology, Fintech   │ │ │
│ │ │                      │        │ 🏙️  Casablanca        │ │ │
│ │ │                      │        │                        │ │ │
│ │ │                      │        │ ✓ SaaS                │ │ │
│ │ │                      │        │ ✓ AI                  │ │ │
│ │ └──────────────────────┘        │                        │ │ │
│ │                                 │ "Shared interest in    │ │ │
│ │                                 │  SaaS - You could be  │ │ │
│ │                                 │  a great mentor"      │ │ │
│ │                                 │                        │ │ │
│ │                                 │ [View Profile] [Connect] │ │
│ │                                 └────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [2] 76% MATCH - Leila Benzaid (8 yrs, AI & Backend)         │ │
│ │     [View Profile] [Connect]                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [3] 71% MATCH - Karim Bennani (5 yrs, SaaS & DevOps)       │ │
│ │     [View Profile] [Connect]                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ [Advanced Filters ▼]                     [Load More...]      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│ UPGRADE YOUR MEMBERSHIP                                        │
│ Unlock advanced features and connect with more elite members  │
│                                                                  │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌────────┐ │
│ │ SILVER (Current)     │  │ GOLD (Recommended)   │  │PLATINUM│ │
│ │ $9.99/mo             │  │ $24.99/mo ⭐         │  │$49.99  │ │
│ │ ✓ Unlimited msgs     │  │ ✓ Advanced matching  │  │✓ Personal│
│ │ ✓ Export contacts    │  │ ✓ Export contacts    │  │ matchmaker
│ │ ✓ 1:1 support        │  │ ✓ Analytics          │  │✓ 1:1 mentoring
│ │                      │  │ ✓ VIP badge          │  │         │
│ │ [Already Active]     │  │ [UPGRADE NOW] ➔ $$  │  │[UPGRADE]│
│ └──────────────────────┘  └──────────────────────┘  └────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4. Payment Checkout Pages

#### Stripe Checkout (International)
```
┌────────────────────────────────────────────────────────────┐
│                      STRIPE CHECKOUT                      │
│                                                            │
│ Communium - Gold Membership                               │
│                                                            │
│ Price:           $24.99 USD                               │
│ Duration:        1 Month (Auto-renews)                    │
│ ─────────────────────────────────────────────────        │
│ TOTAL:           $24.99 USD                               │
│                                                            │
│ BILLING INFORMATION                                        │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Email: your@email.com                                │ │
│ │                                                      │ │
│ │ PAYMENT DETAILS                                      │ │
│ │ Card Number                                          │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ 4242 4242 4242 4242                             │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │ Expiry Date         CVC                             │ │
│ │ ┌────────────┐     ┌──────┐                        │ │
│ │ │ 12 / 25    │     │ 123  │                        │ │
│ │ └────────────┘     └──────┘                        │ │
│ │                                                      │ │
│ │ Cardholder Name                                      │ │
│ │ ┌──────────────────────────────────────────────────┐ │ │
│ │ │ Fatima Ben Ahmed                                │ │ │
│ │ └──────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │ Country/Region                                      │ │
│ │ ┌──────────────────┐                                │ │
│ │ │ Morocco ▼        │                                │ │
│ │ └──────────────────┘                                │ │
│ │                                                      │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │       COMPLETE PURCHASE                         │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │ By confirming, you authorize recurring charges     │ │
│ │ You can cancel anytime in account settings         │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ Secured with Stripe  🔒 HTTPS                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### Payment Success Page (`/payment/success`)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      ✅ PAYMENT SUCCESS!                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │            🎉 Welcome to Gold Member!                │ │
│  │                                                       │ │
│  │  Your subscription has been activated.               │ │
│  │  You can now enjoy all Gold features!                │ │
│  │                                                       │ │
│  │  Order ID: #STR-1234567890                           │ │
│  │  Amount: $24.99                                      │ │
│  │  Currency: USD                                       │ │
│  │  Date: 2024-01-15 14:32 UTC                         │ │
│  │                                                       │ │
│  │  ───────────────────────────────────────           │ │
│  │                                                       │ │
│  │  YOUR NEW FEATURES:                                 │ │
│  │  ✓ Advanced matching filters                        │ │
│  │  ✓ Unlimited messaging                              │ │
│  │  ✓ Export contacts list                             │ │
│  │  ✓ Priority support                                 │ │
│  │  ✓ VIP badge on your profile                        │ │
│  │  ✓ Analytics dashboard                              │ │
│  │                                                       │ │
│  │  NEXT STEPS:                                         │ │
│  │  1. Review your profile with new features            │ │
│  │  2. Try the advanced filters                         │ │
│  │  3. Connect with more matches!                       │ │
│  │                                                       │ │
│  │  ┌──────────────────┐    ┌──────────────────────┐  │ │
│  │  │ VIEW INVOICE     │    │ GO TO DASHBOARD      │  │ │
│  │  │ (PDF Download)   │    │ (Continue)           │  │ │
│  │  └──────────────────┘    └──────────────────────┘  │ │
│  │                                                       │ │
│  │  A confirmation email has been sent to:             │ │
│  │  your@email.com                                      │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                             │
│  Questions? Contact support@communium.ma                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Payment Cancelled Page (`/payment/cancel`)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ❌ PAYMENT CANCELLED                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │      You cancelled the payment process.               │ │
│  │      Your Gold upgrade was not completed.            │ │
│  │                                                       │ │
│  │      You are still on your current plan.             │ │
│  │                                                       │ │
│  │  WHAT HAPPENED?                                       │ │
│  │  ────────────────────────────────────────────       │ │
│  │  Payment was not processed. No charges were made.    │ │
│  │                                                       │ │
│  │  WHY UPGRADE TO GOLD?                                │ │
│  │  ────────────────────────────────────────────       │ │
│  │  • Advanced matching filters                         │ │
│  │  • Unlimited messaging                               │ │
│  │  • Export contacts                                   │ │
│  │  • Priority support                                  │ │
│  │  • Only $24.99/month                                 │ │
│  │                                                       │ │
│  │  TROUBLESHOOTING:                                     │ │
│  │  If you experienced an error:                        │ │
│  │  1. Try again with a different payment method        │ │
│  │  2. Check your card details                          │ │
│  │  3. Contact Stripe support                           │ │
│  │  4. Email support@communium.ma for help              │ │
│  │                                                       │ │
│  │  ┌──────────────────┐    ┌──────────────────────┐  │ │
│  │  │ TRY AGAIN        │    │ GO BACK DASHBOARD    │  │ │
│  │  │ (Retry Checkout) │    │ (Continue Browsing)  │  │ │
│  │  └──────────────────┘    └──────────────────────┘  │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                             │
│  Need help? Email support@communium.ma                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. User Profile Page

#### View Full Profile (`/dashboard/[userId]`)
```
┌─────────────────────────────────────────────────────────────┐
│ COMMUNIUM                              🔍 📝 💬 ⭐ 🌐 EN  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐                                       │
│  │ 📷 Profile Photo │  Fatima Ben Ahmed                    │
│  │                  │  🏆 Gold Member • 👥 Connected        │
│  │                  │                                       │
│  │                  │  📍 Casablanca, Morocco               │
│  │                  │  🏢 Technology • SaaS • AI            │
│  │                  │  💼 8 Years Experience                │
│  └──────────────────┘                                       │
│                                                              │
│  ABOUT                                                      │
│  Passionate about building SaaS solutions for African      │
│  markets. CEO of TechCorp Morocco. Mentor to early-stage   │
│  founders. Looking to connect with AI experts.             │
│                                                              │
│  SECTORS & SKILLS                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ SaaS (Expert)│ │ AI (Advanced) │ │ DevOps (Good)│       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                              │
│  CONNECTIONS                                               │
│  43 Active Connections                                      │
│  📊 Growth: +12 this month                                 │
│                                                              │
│  VERIFICATION                                              │
│  ✅ Email verified                                         │
│  ✅ Phone verified                                         │
│  ✅ Identity verified                                      │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐             │
│  │ 📧 SEND MESSAGE  │    │ ⭐ ADD TO FAVORITES │             │
│  └──────────────────┘    └──────────────────┘             │
│                                                              │
│  ┌──────────────────────────────────────────┐             │
│  │ 📊 View Match Details      (Score: 82%)  │             │
│  └──────────────────────────────────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Color Scheme & Design System

```
PRIMARY COLORS:
  Blue:       #3B82F6  (Main actions, links)
  Blue Dark:  #1E40AF  (Hover states)
  
ACCENT:
  Gold:       #F59E0B  (Premium tier, VIP)
  Green:      #10B981  (Success, verified)
  Red:        #EF4444  (Delete, cancel)
  
NEUTRALS:
  Dark:       #111827  (Text)
  Gray:       #6B7280  (Secondary text)
  Light:      #F3F4F6  (Backgrounds)
  White:      #FFFFFF  (Surfaces)
```

## 📱 Responsive Breakpoints

```
Mobile:     < 640px   (Full width layout)
Tablet:     640-1024px (2-column layout)
Desktop:    > 1024px  (3+ column layout)
```

## ♿ Accessibility Features

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ High contrast text (WCAG AA compliant)
- ✅ RTL support for Arabic
- ✅ Screen reader friendly
- ✅ Focus indicators on all buttons
- ✅ Alt text on all images

---

## 🎬 User Interactions

### Matching Card Hover States
```
NORMAL:
┌─────────────────────────────────────┐
│ 82% Match - Mohamed (Tech, SaaS)   │
│                                     │
│ [View Profile] [Connect]            │
└─────────────────────────────────────┘

HOVER:
┌─────────────────────────────────────┐
│ 82% Match - Mohamed (Tech, SaaS)   │
│ ────────────────────────────────────│
│ "Great mentor opportunity"          │
│                                     │
│ [View Profile] [Connect] [Save ★]  │
└─────────────────────────────────────┘
(Shadow deepens, expand shows more details)
```

### Button States
```
DEFAULT:     [UPGRADE TO GOLD]  (Blue background)
HOVER:       [UPGRADE TO GOLD]  (Darker blue, shadow)
ACTIVE:      [UPGRADE TO GOLD]  (Pressed effect)
DISABLED:    [UPGRADE TO GOLD]  (Gray, no cursor)
LOADING:     [⏳ Processing...]  (Spinner visible)
SUCCESS:     [✅ Upgraded!]      (Green, 2 seconds)
```

---

## 🌐 Multi-Language Support

### Dashboard Variations

**English (EN):**
```
Welcome, Fatima!
Your Personal Matches
```

**Français (FR):**
```
Bienvenue, Fatima!
Vos Correspondances Personnalisées
```

**العربية (AR) - RTL:**
```
مرحباً بك، فاطمة!
تطابقاتك الشخصية
```

---

**Complete UI/UX flow ready for development! 🎨**
