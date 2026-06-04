# MVP Implementation Guide - Phase 2

Derniere mise a jour: 2026-05-30

## Overview

This guide covers the implementation of the MVP (Phase 2) with three critical features:

1. **Authentication with Clerk** - Secure access with MFA for VIP users
2. **Sector-Based Matching** - AI-powered recommendations
3. **Payment Integration** - Stripe (International) + CMI (Morocco)

---

## 🔐 1. Authentication Setup (Clerk)

### Installation

The necessary Clerk packages are already in `package.json`:
```json
"@clerk/nextjs": "^7.2.3"
```

### Configuration

#### Frontend Setup

1. **Environment Variables**
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
   CLERK_SECRET_KEY=your_secret_here
   CLERK_FRONTEND_API=https://your-domain.clerk.accounts.com
   ```

2. **Root Layout** (already configured)
   - Create `app/layout.tsx` with ClerkProvider
   - Wrap application with authentication context

3. **Auth Routes** (already created)
   - `/auth/sign-in` - Login page
   - `/auth/sign-up` - Registration page
   - `/dashboard` - Protected dashboard

#### Backend Setup

1. **Middleware** (`src/middleware/auth.ts`)
   - `authenticateUser` - Verifies JWT tokens
   - `requireMFA` - Enforces MFA for VIP accounts

2. **Usage in Routes**
   ```typescript
   import authenticateUser from '../middleware/auth';
   
   router.get('/protected', authenticateUser, (req, res) => {
     console.log(req.user); // { id, email, role, mfaEnabled }
   });
   ```

### MFA for VIP Users

Enforce MFA on Clerk's dashboard:

1. Go to Clerk Dashboard → Settings → Security
2. Enable "Multi-factor authentication"
3. Require MFA for VIP role users

In code:
```typescript
if (req.user?.role === 'VIP' && !req.user?.mfaEnabled) {
  return res.status(403).json({ error: 'MFA is required for VIP accounts' });
}
```

### User Metadata

Set user roles in Clerk (optional):

```typescript
// During signup or user update
await clerk.users.updateUser(userId, {
  publicMetadata: {
    role: 'VIP' // or 'Regular', 'Youth'
  }
});
```

---

## 🎯 2. Sector-Based Matching

### AI Service Implementation

**File:** `ai-service/matching_service.py`

Features:
- Match users by industry sector
- Consider experience level (mentor/mentee)
- Bonus for same location (Maroc-specific)
- Score calculation: 0-100

### How It Works

1. **Sector Matching** (40% weight)
   - Compares primary and sub-sectors
   - Example: "Technology + SaaS" vs "Technology + AI"

2. **Experience Compatibility** (30% weight)
   - Mentor/mentee pairing
   - 5-10 years difference = great learning

3. **Location Bonus** (20% weight)
   - Same city in Morocco = +15 points
   - Same region = +10 points

4. **Final Score** (10% weight)
   - Weighted average of all factors
   - Minimum threshold: 30/100

### Endpoints

#### Get Recommendations
```
GET /api/matching/recommendations
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "count": 5,
  "matches": [
    {
      "userId": 42,
      "name": "Fatima",
      "sector": "Technology",
      "matchScore": 85.5,
      "commonSectors": ["SaaS", "AI"],
      "reason": "Shared interest in SaaS - Great learning opportunity"
    }
  ]
}
```

#### Get Available Sectors
```
GET /api/matching/sectors
```

#### Filter Matches
```
POST /api/matching/filter-by-sector
Content-Type: application/json

{
  "sectors": ["Technology", "Fintech"],
  "location": "Casablanca",
  "minExperience": 2,
  "maxExperience": 10,
  "limit": 20
}
```

### Integration with Frontend

**Dashboard:** `app/[locale]/dashboard/page.tsx`

- Displays personalized match recommendations
- Shows match score and reason
- Lists common sectors/interests
- "View Profile" button for detailed info

---

## 💳 3. Payment Integration

### Stripe Setup (International)

#### Installation
```bash
npm install stripe
```

#### Environment Variables
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Pricing Tiers

| Tier | Price (USD) | Price (MAD) | Features |
|------|------------|------------|----------|
| Free | $0 | 0 | Basic profile, View matches |
| Silver | $9.99 | 100 | Unlimited messaging |
| Gold | $24.99 | 250 | Advanced matching ⭐ |
| Platinum | $49.99 | 500 | Personal matchmaker, VIP support |

#### Endpoints

**Create Checkout Session**
```
POST /api/payment/checkout/stripe
Content-Type: application/json

{
  "userId": "user_123",
  "tier": "gold",
  "currency": "usd" // or "mad"
}
```

Response:
```json
{
  "success": true,
  "sessionId": "cs_live_...",
  "paymentUrl": "https://checkout.stripe.com/..."
}
```

**Webhook Handler**
```
POST /api/payment/webhook/stripe
```

Handles:
- `checkout.session.completed` - Update user tier to Gold/Platinum

### CMI Setup (Morocco)

#### Configuration
```env
CMI_MERCHANT_ID=your_merchant_id
CMI_API_KEY=your_api_key
CMI_GATEWAY_URL=https://cmigw.asseco.com.tr/PaymentGateway/Hosting/Default
```

#### Why CMI?
- **Most popular in Morocco** for online payments
- **Supports MAD currency** natively
- **Local payment methods** (bank transfers, cards)
- **PCI DSS compliant**

#### Implementation

**Create CMI Payment**
```
POST /api/payment/checkout/cmi
Content-Type: application/json

{
  "userId": "user_123",
  "tier": "gold"
}
```

Response:
```json
{
  "success": true,
  "paymentUrl": "https://cmigw.asseco.com.tr/PaymentGateway/Hosting/Default",
  "reference": "CMI-user_123-1713607200000",
  "metadata": {
    "tier": "Gold",
    "amount": 250,
    "currency": "MAD"
  }
}
```

**Payment Callback**
```
POST /api/payment/callback/cmi
```

Handles CMI payment confirmation and updates user tier.

#### Integration Steps

1. **Frontend Selection**
   ```typescript
   const handlePayment = (tier: string) => {
     // Detect country/language
     if (locale === 'ar' || userLocation === 'Morocco') {
       // Use CMI
       window.location.href = `/checkout/cmi?tier=${tier}`;
     } else {
       // Use Stripe
       window.location.href = `/checkout/stripe?tier=${tier}`;
     }
   };
   ```

2. **Database Update**
   ```typescript
   // After successful payment
   await prisma.membership.update({
     where: { userId: parseInt(userId) },
     data: { tier: 'Gold' }
   });
   ```

---

## 📊 Matching Algorithm Details

### Score Calculation Example

**User A (VIP, Casablanca)**
- Sector: Technology
- Sub-sectors: [SaaS, AI]
- Experience: 8 years
- Interests: [innovation, startups]

**User B (Regular, Casablanca)**
- Sector: Technology  
- Sub-sectors: [SaaS, Web]
- Experience: 3 years
- Interests: [learning, startups]

**Score Breakdown:**
1. Sector match: 66% (2 common / 3 unique) × 0.4 = 26.4
2. Experience bonus: 5-year gap = 20 × 0.5 = 10
3. Location bonus: Same city = 15 × 0.2 = 3
4. **Total: 39.4 → 40/100** ✓

**Reason:** "Shared interest in SaaS - Great mentor/mentee opportunity"

---

## 🚀 Testing the MVP

### Test Clerk Authentication
```bash
# 1. Navigate to sign-up
http://localhost:3000/en/auth/sign-up

# 2. Create account with email/password
# 3. Should redirect to /dashboard

# 4. Test logout via UserButton
```

### Test Matching
```bash
# 1. Create multiple users with different sectors
# 2. Call matching endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/matching/recommendations

# 3. Should return personalized matches
```

### Test Stripe Payment
```bash
# 1. Click "Upgrade to Gold"
# 2. Should redirect to Stripe Checkout
# 3. Use test card: 4242 4242 4242 4242
# 4. Payment should succeed
```

### Test CMI Payment
```bash
# 1. Switch to Arabic locale (/ar)
# 2. Click upgrade
# 3. Should show CMI payment form
# 4. Test with CMI test credentials
```

---

## 📋 Deployment Checklist

### Before Production

- [ ] **Clerk**
  - [ ] Production API keys configured
  - [ ] MFA enforced for VIP tier
  - [ ] Custom domain configured

- [ ] **Stripe**
  - [ ] Live API keys (not test keys)
  - [ ] Webhook endpoint configured
  - [ ] Tax/VAT calculation (if applicable)

- [ ] **CMI**
  - [ ] Merchant account activated
  - [ ] PCI DSS compliance verified
  - [ ] Test payments successful

- [ ] **Database**
  - [ ] Membership table initialized
  - [ ] User role field populated
  - [ ] Indexes on frequently searched columns

- [ ] **Security**
  - [ ] JWT secret changed
  - [ ] API keys in secure vault
  - [ ] CORS properly configured
  - [ ] Rate limiting enabled

---

## 🔧 Troubleshooting

### Clerk Not Loading
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Check ClerkProvider wraps application
- Clear browser cache and cookies

### Stripe Checkout Not Redirecting
- Verify `STRIPE_SECRET_KEY` is correct
- Check `FRONTEND_URL` and `BACKEND_URL` environment variables
- Ensure webhook endpoint is publicly accessible

### CMI Payment Failing
- Verify merchant credentials are correct
- Check if Maroc locale is properly detected
- Review CMI API response for error code

### Matching Returns Empty Results
- Ensure user profiles are complete (sector, experience, location)
- Check AI service is running (`http://localhost:8000/health`)
- Verify database has sufficient candidate users

---

## 📚 Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [CMI Payment Gateway](https://www.cmigw.asseco.com.tr)
- [Prisma ORM](https://www.prisma.io/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
