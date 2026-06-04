# MVP Quick Start Guide

Derniere mise a jour: 2026-05-30

## 🚀 Start the MVP in 5 Minutes

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis (optional but recommended)
- Clerk account (free)
- Stripe account (free)

### Step 1: Clone & Setup

```bash
cd communium
cp .env.example .env.local
```

### Step 2: Configure Environment

Edit `.env.local` with your credentials:

```env
# Clerk - Get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe - Get from https://dashboard.stripe.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/communium

# Redis (optional)
REDIS_URL=redis://localhost:6379

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
AI_SERVICE_URL=http://localhost:8000
```

### Step 3: Start Services with Docker

```bash
# Start database and cache
docker-compose up -d

# Initialize database
cd backend
npx prisma migrate dev --name init
npm run seed
```

### Step 4: Start Frontend

```bash
cd frontend
npm install
npm run dev

# Open http://localhost:3000
```

### Step 5: Start Backend

In a new terminal:

```bash
cd backend
npm install
npm start

# API running on http://localhost:5000
```

### Step 6: Start AI Service

In another terminal:

```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn matching_service:app --reload

# AI Service running on http://localhost:8000
```

---

## ✅ Test the MVP

### 1. Create Account
1. Navigate to `http://localhost:3000/en/auth/sign-up`
2. Sign up with email/password
3. Verify email (check Clerk dashboard)
4. Redirected to `/dashboard`

### 2. View Matches
- Dashboard shows recommended matches
- Matches calculated by sector, experience, location
- Score: 0-100

### 3. Test Payment

#### With Stripe (International)
1. Click "Upgrade to Gold"
2. Redirects to Stripe Checkout
3. Use test card: **4242 4242 4242 4242**
4. Any future date, any CVC

#### With CMI (Morocco)
1. Switch to Arabic: http://localhost:3000/ar
2. Click upgrade
3. Shows CMI payment form

### 4. Check Endpoints

```bash
# Test authentication
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/matching/recommendations

# Get available sectors
curl http://localhost:5000/api/matching/sectors

# Get membership tiers
curl http://localhost:5000/api/payment/tiers
```

---

## 📊 Database Schema

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_id VARCHAR(100) UNIQUE,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  role VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  sector VARCHAR(100),
  sub_sectors TEXT[],
  years_experience INTEGER,
  location VARCHAR(100),
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_document VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Memberships
CREATE TABLE memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  tier VARCHAR(20),
  stripe_subscription_id VARCHAR(255),
  cmi_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  matched_user_id INTEGER REFERENCES users(id),
  match_score FLOAT,
  status VARCHAR(20), -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔑 Key Endpoints

### Authentication
- `POST /auth/sign-in` - Login
- `POST /auth/sign-up` - Register
- `GET /api/user` - Current user (authenticated)

### Matching
- `GET /api/matching/recommendations` - Get personalized matches (authenticated)
- `GET /api/matching/sectors` - Available sectors
- `POST /api/matching/filter-by-sector` - Filter matches (authenticated)

### Payment
- `GET /api/payment/tiers` - Membership pricing
- `POST /api/payment/checkout/stripe` - Stripe checkout (authenticated)
- `POST /api/payment/checkout/cmi` - CMI checkout (authenticated)
- `POST /api/payment/webhook/stripe` - Stripe webhook

---

## 🐛 Troubleshooting

### "Cannot find module 'express'"
```bash
cd backend
npm install
```

### "Database connection refused"
```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Or check connection string in .env.local
```

### "Clerk authentication not working"
1. Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
2. Verify in Clerk dashboard → Applications → your-domain
3. Clear browser cache: Ctrl+Shift+Delete

### "Stripe checkout redirects to error page"
1. Check `STRIPE_SECRET_KEY` starts with `sk_test_`
2. Verify `FRONTEND_URL` is exactly `http://localhost:3000`
3. Check browser console for error details

### "Matches returning empty"
1. Ensure user profile has sector and location
2. Check database has candidate users (run `npm run seed`)
3. Verify AI service is running on port 8000

---

## 📈 Next Steps

1. ✅ Basic MVP working
2. ⬜ Add profile completion form
3. ⬜ Implement messaging between matches
4. ⬜ Add profile verification (KYC)
5. ⬜ Create admin dashboard
6. ⬜ Mobile app
7. ⬜ Advanced analytics

---

## 🤝 Support

- Check documentation: `/MVP_IMPLEMENTATION_GUIDE.md`
- Review test files: `/backend/tests/`
- View CI/CD setup: `/CI_CD_SETUP.md`

---

**Happy building! 🚀**
