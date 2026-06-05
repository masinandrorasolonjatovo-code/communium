# MVP Integration Checklist

Derniere mise a jour: 2026-05-30

## 📋 Phase 2 Complete - Now Ready for Phase 3 Integration

### ✅ What's Already Done
- [x] Clerk authentication middleware (JWT + MFA)
- [x] Sector-based matching AI service (FastAPI)
- [x] Payment routes (Stripe + CMI)
- [x] Frontend dashboard with matches display
- [x] Auth pages (sign-in, sign-up, layout)
- [x] Environment configuration template
- [x] Docker Compose setup
- [x] Prisma database schema
- [x] CI/CD pipeline with tests

### ⏳ Immediate Next Steps (Phase 3)

#### 1. Backend Server Integration
- [ ] Create `backend/server.ts` main file
  - [ ] Import Express
  - [ ] Import all routes (payment, matching)
  - [ ] Import authentication middleware
  - [ ] Setup Prisma client
  - [ ] Configure CORS
  - [ ] Error handling middleware
  - [ ] Start on port 5000
  - [ ] Test all endpoints with Postman

#### 2. Database Integration with Prisma
- [ ] Replace TODO comments in `src/routes/payment.ts`
  - [ ] `POST /checkout/stripe` → Fetch user, create/update membership
  - [ ] Webhook handler → Update tier on successful payment
  - [ ] Verify session validation

- [ ] Replace TODO comments in `src/routes/matching.ts`
  - [ ] `GET /recommendations` → Fetch user profile from DB
  - [ ] Call AI service with real data
  - [ ] Return formatted results with user details
  - [ ] Filter out self and already-matched users

#### 3. Frontend Payment Flow
- [ ] Create `frontend/app/[locale]/payment/success/page.tsx`
  - [ ] Extract session ID from URL query
  - [ ] Call backend to verify payment status
  - [ ] Display success message or error
  - [ ] Button to return to dashboard

- [ ] Create `frontend/app/[locale]/payment/cancel/page.tsx`
  - [ ] Display cancellation message
  - [ ] Suggest retry
  - [ ] Button to go back to dashboard

#### 4. Frontend Profile Creation
- [ ] Create `frontend/app/[locale]/dashboard/profile/page.tsx`
  - [ ] Form fields:
    - [ ] First name
    - [ ] Last name
    - [ ] Date of birth
    - [ ] Primary sector (dropdown)
    - [ ] Sub-sectors (multi-select)
    - [ ] Years of experience (slider or input)
    - [ ] Location (city/region)
    - [ ] Bio/about (textarea)
  - [ ] Identity document upload (optional for MVP)
  - [ ] Form validation
  - [ ] Submit to `POST /api/profile` (create endpoint)
  - [ ] Success redirect to dashboard

#### 5. Create Missing API Endpoints

**Profile Management:**
```typescript
// src/routes/profile.ts
POST /api/profile                 // Create/update profile
GET /api/profile/:userId          // Get user profile
PUT /api/profile                  // Update own profile
DELETE /api/profile               // Delete profile
GET /api/profile/verify/:userId   // Check if verified
```

**User Management:**
```typescript
// src/routes/user.ts
GET /api/user/me                  // Current user info
GET /api/user/:userId             // User public profile
PUT /api/user/role                // Admin: update user role
```

**Matching History:**
```typescript
// Extend src/routes/matching.ts
POST /api/matching/connect/:userId   // Send connection request
GET /api/matching/connections       // List my connections
PUT /api/matching/accept/:matchId   // Accept match
PUT /api/matching/reject/:matchId   // Reject match
```

#### 6. Environment Variables Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Clerk keys (from Clerk dashboard)
- [ ] Fill in Stripe keys (test or live)
- [ ] Fill in CMI credentials (test account)
- [ ] Set DATABASE_URL (local PostgreSQL)
- [ ] Set REDIS_URL (if using Redis)
- [ ] Test all services can connect

#### 7. Testing & Validation

**Manual Testing:**
- [ ] Sign up new user via Clerk
- [ ] Complete profile form
- [ ] View personalized matches
- [ ] Test Stripe payment (test card: 4242 4242 4242 4242)
- [ ] Verify membership tier updated
- [ ] Test CMI payment (if configured)
- [ ] Test match acceptance/rejection
- [ ] Test message sending to match (if implemented)

**Automated Testing:**
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run load tests: `npm run test:load`
- [ ] Run integration tests (create new suite)
- [ ] Test API endpoints with Jest/Supertest

---

## 🔗 File Dependencies & Integration Points

### Files That Need Integration

```
backend/
├── server.ts ✅ NEEDS CREATION
│   └─> Imports from src/routes/*
│   └─> Imports Prisma client
│   └─> Starts on port 5000
│
├── src/routes/
│   ├── payment.ts ⏳ NEEDS DB INTEGRATION
│   │   └─> Needs: prisma.membership.update()
│   │   └─> Needs: prisma.user.findUnique()
│   │
│   ├── matching.ts ⏳ NEEDS DB INTEGRATION
│   │   └─> Needs: prisma.user.findMany()
│   │   └─> Needs: prisma.profile.findMany()
│   │   └─> Needs: Call AI service ✓ (already implemented)
│   │
│   └── profile.ts 🆕 NEEDS CREATION
│       └─> CRUD operations for Profile model
│       └─> Clerk user sync
│
├── src/middleware/
│   └── auth.ts ✓ COMPLETE
│       └─> authenticateUser()
│       └─> requireMFA()
│
└── prisma/
    └── schema.prisma ✓ COMPLETE
        └─> User, Profile, Membership models
```

### Frontend Files That Need Integration

```
frontend/
├── app/[locale]/auth/ ✓ COMPLETE
│   ├── layout.tsx ✓
│   ├── sign-in/page.tsx ✓
│   └── sign-up/page.tsx ✓
│
├── app/[locale]/dashboard/ ⏳ NEEDS PROFILE FORM
│   ├── page.tsx ✓ (matches display)
│   └── profile/page.tsx 🆕 NEEDS CREATION
│       └─> Profile form
│       └─> POST /api/profile
│
└── app/[locale]/payment/ 🆕 NEEDS CREATION
    ├── success/page.tsx 🆕
    │   └─> Verify payment
    │   └─> Show success message
    │
    └── cancel/page.tsx 🆕
        └─> Show cancellation message
```

---

## 🎯 Priority Order

### Week 1 - Core Backend
1. ✅ Create `backend/server.ts` and test startup
2. ✅ Add database queries to payment routes
3. ✅ Add database queries to matching routes
4. ✅ Create profile CRUD endpoints
5. ✅ Test all endpoints with Postman

### Week 2 - Frontend Integration
1. ✅ Create payment success/cancel pages
2. ✅ Create profile form page
3. ✅ Wire up profile submission
4. ✅ Wire up payment checkout redirect
5. ✅ Manual end-to-end testing

### Week 3 - Polish & Testing
1. ✅ Fix any bugs from manual testing
2. ✅ Add error handling and validation
3. ✅ Improve UI/UX based on feedback
4. ✅ Write integration tests
5. ✅ Performance optimization

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Profile CRUD operations
- [ ] Matching algorithm (already done)
- [ ] Payment validation
- [ ] Auth middleware

### Integration Tests
- [ ] Complete signup → profile → matches flow
- [ ] Stripe payment flow
- [ ] CMI payment flow
- [ ] Match acceptance/rejection

### E2E Tests
- [ ] User can sign up and complete profile
- [ ] User can see personalized matches
- [ ] User can upgrade membership
- [ ] User can send connection request
- [ ] User can chat with match

### Performance Tests
- [ ] Dashboard load < 2 seconds
- [ ] Match calculation < 500ms
- [ ] 100 concurrent users load test
- [ ] Database query optimization

---

## 📊 API Endpoints Summary

### Authentication (via Clerk)
```
POST /auth/sign-in          ← Clerk component
POST /auth/sign-up          ← Clerk component
POST /auth/refresh          ← Clerk token refresh
GET  /auth/callback         ← Clerk redirect
```

### User Profile
```
POST /api/profile           ← Create new profile
GET  /api/profile/me        ← Get my profile
GET  /api/profile/:id       ← Get public profile
PUT  /api/profile           ← Update my profile
DELETE /api/profile         ← Delete my profile
```

### Matching
```
GET  /api/matching/recommendations    ← Get matches for me
GET  /api/matching/sectors            ← Available sectors
POST /api/matching/filter             ← Advanced filtering
POST /api/matching/calculate-score    ← Score breakdown
POST /api/matching/connect/:id        ← Send connection
GET  /api/matching/connections        ← My connections
PUT  /api/matching/accept/:id         ← Accept match
PUT  /api/matching/reject/:id         ← Reject match
```

### Payment
```
GET  /api/payment/tiers               ← Membership pricing
POST /api/payment/checkout/stripe     ← Create Stripe session
POST /api/payment/checkout/cmi        ← Create CMI payment
POST /api/payment/webhook/stripe      ← Stripe webhook
POST /api/payment/callback/cmi        ← CMI callback
GET  /api/payment/status/:id          ← Check payment status
```

---

## 🔐 Secrets & Keys Required

### Clerk
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
Get from: https://dashboard.clerk.com

### Stripe
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
Get from: https://dashboard.stripe.com

### CMI (Morocco)
```env
CMI_MERCHANT_ID=...
CMI_API_KEY=...
CMI_GATEWAY_URL=https://...
```
Contact: CMI support

### Database
```env
DATABASE_URL=postgresql://user:password@localhost:5432/communium
```

### Redis (Optional)
```env
REDIS_URL=redis://localhost:6379
```

---

## 🚀 Deployment Readiness

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Stripe/CMI production keys (not test)
- [ ] Email verification working
- [ ] All endpoints tested
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Security headers set
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Database backups automated
- [ ] Monitoring/alerting set up

---

## 📞 Support & Documentation

- **Main README:** `README.md`
- **MVP Guide:** `MVP_IMPLEMENTATION_GUIDE.md`
- **Architecture:** `ARCHITECTURE.md`
- **Quick Start:** `QUICK_START.md`
- **Phase 2 Summary:** `MVP_PHASE2_SUMMARY.md`
- **CI/CD Setup:** `CI_CD_SETUP.md`
- **Testing Guide:** `TESTING_GUIDE_FR.md`
- **i18n Setup:** `I18N_SETUP.md`

---

**Next Action:** Start Week 1 by creating `backend/server.ts` and integrating Prisma queries into existing routes.

Good luck! 🚀
