# Developer Reference & Command Cheat Sheet

Derniere mise a jour: 2026-05-30

## 🚀 Quick Commands

### Get Started
```bash
# Clone and setup
cd communium
cp .env.example .env.local

# Install dependencies
cd frontend && npm install
cd ../backend && npm install
cd ../ai-service && pip install -r requirements.txt

# Start services
docker-compose up -d           # Database + Redis
npm run dev                    # Frontend (port 3000)
npm start                      # Backend (port 5000)
python -m uvicorn matching_service:app --reload  # AI (port 8000)
```

### Testing
```bash
# Frontend
npm run test                   # Jest tests
npm run test:watch            # Watch mode
npm run lint                  # ESLint
npm run format                # Prettier format

# Backend
npm run test:unit             # Unit tests
npm run test:load             # Load testing
npm run test:perf             # Performance benchmarks
npm run seed                  # Database seeding
npm run migrate               # Run migrations

# All
npm run test:all              # Run all tests
```

### Database
```bash
# Frontend
npx prisma migrate dev --name "description"  # Create migration
npx prisma studio            # Open Prisma Studio (UI)
npx prisma generate          # Generate Prisma Client
npx prisma db seed           # Run seed script

# View schemas
cat prisma/schema.prisma
```

### Docker
```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
docker-compose ps             # List running containers
docker exec -it communium-postgres psql -U postgres -d communium  # DB shell
```

---

## 📁 Project Structure Reference

```
communium/
├── frontend/                  # Next.js application
│   ├── app/
│   │   ├── [locale]/         # Dynamic locale routing
│   │   │   ├── auth/         # Sign-in, sign-up pages
│   │   │   ├── dashboard/    # Main dashboard + profile form
│   │   │   └── payment/      # Success/cancel pages
│   │   └── layout.tsx        # Root layout with i18n
│   ├── components/           # Reusable React components
│   ├── messages/             # i18n translation files
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/                   # Node.js + Express API
│   ├── src/
│   │   ├── middleware/       # auth.ts - JWT + MFA
│   │   ├── routes/
│   │   │   ├── payment.ts    # Stripe + CMI
│   │   │   ├── matching.ts   # AI matching
│   │   │   └── profile.ts    # User profiles (create)
│   │   └── matching.ts       # Matching algorithm
│   ├── tests/
│   │   ├── matching.test.ts  # Unit tests
│   │   ├── load.test.ts      # Load testing
│   │   └── performance.test.ts
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── server.ts             # Main Express file (create)
│   ├── package.json
│   └── jest.config.js
│
├── ai-service/                # Python FastAPI
│   ├── matching_service.py   # Matching algorithm
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .gitignore
│
├── database/
│   ├── init.sql              # PostgreSQL initialization
│   └── README.md
│
├── docker-compose.yml        # Orchestration
├── .env.example              # Configuration template
├── .github/workflows/        # CI/CD pipeline
│
└── DOCUMENTATION/
    ├── README.md
    ├── QUICK_START.md
    ├── MVP_IMPLEMENTATION_GUIDE.md
    ├── MVP_PHASE2_SUMMARY.md
    ├── ARCHITECTURE.md
    ├── INTEGRATION_CHECKLIST.md
    ├── CI_CD_SETUP.md
    ├── I18N_SETUP.md
    └── TESTING_GUIDE_FR.md
```

---

## 🔑 Environment Variables (Quick Reference)

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Stripe (International Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# CMI (Morocco Payments - MAD)
CMI_MERCHANT_ID=merchant_xxxxx
CMI_API_KEY=api_xxxxx
CMI_GATEWAY_URL=https://cmigw.asseco.com.tr/...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/communium

# Cache & Sessions
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Service URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
AI_SERVICE_URL=http://localhost:8000

# Security
JWT_SECRET=your_secret_key_here
API_KEY=your_api_key_here

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

---

## 📊 API Response Formats

### Success Response (Matching)
```json
{
  "success": true,
  "count": 5,
  "matches": [
    {
      "userId": 42,
      "name": "Fatima Ben Ahmed",
      "sector": "Technology",
      "matchScore": 82.5,
      "commonSectors": ["SaaS", "AI"],
      "experience": 8,
      "location": "Casablanca",
      "reason": "Shared interest in SaaS - Great mentor opportunity"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Matching service unavailable",
  "statusCode": 503
}
```

### Payment Session
```json
{
  "success": true,
  "sessionId": "cs_live_xxxxx",
  "paymentUrl": "https://checkout.stripe.com/...",
  "tier": "gold",
  "amount": 2499,
  "currency": "usd"
}
```

---

## 🔐 Authentication Headers

All protected endpoints require:
```http
GET /api/matching/recommendations HTTP/1.1
Authorization: Bearer {CLERK_JWT_TOKEN}
Content-Type: application/json
```

### Getting JWT Token (Frontend)
```typescript
import { useAuth } from '@clerk/nextjs';

export default function MyComponent() {
  const { getToken } = useAuth();
  
  const token = await getToken();
  
  const response = await fetch('/api/matching/recommendations', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
```

---

## 🎯 Common Development Tasks

### Add New Route
```typescript
// src/routes/newfeature.ts
import express from 'express';
import authenticateUser from '../middleware/auth';

const router = express.Router();

router.get('/endpoint', authenticateUser, (req, res) => {
  const userId = req.user?.id;
  // ... handle request
});

export default router;
```

Then in `server.ts`:
```typescript
import newFeatureRoutes from './src/routes/newfeature';
app.use('/api/newfeature', newFeatureRoutes);
```

### Add Database Model
```prisma
// In schema.prisma
model NewModel {
  id      Int     @id @default(autoincrement())
  name    String
  userId  Int
  user    User    @relation(fields: [userId], references: [id])
  
  @@map("new_models")
}
```

Then:
```bash
npx prisma migrate dev --name "add_new_model"
```

### Add Translation
```json
// messages/en/common.json
{
  "dashboard": {
    "title": "My Matches",
    "noMatches": "No matches yet"
  }
}
```

```json
// messages/fr/common.json
{
  "dashboard": {
    "title": "Mes Correspondances",
    "noMatches": "Pas encore de correspondances"
  }
}
```

Use in component:
```typescript
import { useTranslations } from 'next-intl';

export default function Dashboard() {
  const t = useTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

---

## 🧪 Testing Examples

### Unit Test
```typescript
// backend/tests/example.test.ts
describe('Matching Algorithm', () => {
  test('should calculate score correctly', () => {
    const score = calculateScore(user1, user2);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

Run: `npm run test:unit`

### API Test (Supertest)
```typescript
import request from 'supertest';
import app from '../server';

describe('GET /api/matching/sectors', () => {
  test('returns available sectors', async () => {
    const response = await request(app)
      .get('/api/matching/sectors');
    
    expect(response.status).toBe(200);
    expect(response.body.sectors).toBeDefined();
  });
});
```

---

## 🔍 Debugging Tips

### View Database
```bash
# Open Prisma Studio
npx prisma studio

# Or use psql directly
docker exec -it communium-postgres psql -U postgres -d communium
```

### Check AI Service
```bash
curl http://localhost:8000/health
```

### View Server Logs
```bash
# Frontend
npm run dev -- --debug

# Backend
npm start

# Docker containers
docker-compose logs -f backend
docker-compose logs -f ai-service
```

### Test API Endpoints
```bash
# Get token
TOKEN=$(curl -s https://your-clerk-api.com/v1/tokens -H "Authorization: Bearer $CLERK_KEY" | jq -r '.token')

# Test endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/matching/recommendations
```

---

## 📈 Performance Optimization

### Frontend
```typescript
// Use React.memo for expensive components
export default React.memo(MatchCard);

// Lazy load components
const Dashboard = dynamic(() => import('./Dashboard'), { 
  loading: () => <Skeleton /> 
});

// Use useCallback for functions
const handleMatch = useCallback((userId) => {
  // ... handler
}, [dependencies]);
```

### Backend
```typescript
// Use pagination
const matches = await prisma.match.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { matchScore: 'desc' }
});

// Use select to fetch only needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, role: true }
});

// Add database indexes in schema
model User {
  id Int @id @default(autoincrement())
  email String @unique
  createdAt DateTime @default(now())
  
  @@index([email])
  @@index([createdAt])
}
```

---

## 🔗 Useful Links

- **Clerk Docs:** https://clerk.com/docs
- **Stripe Docs:** https://stripe.com/docs/api
- **CMI Gateway:** https://www.cmigw.asseco.com.tr
- **Prisma Docs:** https://www.prisma.io/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev

---

## 💡 Quick Tips

**Hot reload during development:**
```bash
# Frontend
npm run dev          # Next.js auto-reloads on file change

# Backend
npm run dev          # ts-node with watch (if configured)

# AI Service
python -m uvicorn matching_service:app --reload
```

**Skip TypeScript errors temporarily:**
```typescript
// @ts-ignore
const someValue = potentiallyUntypedValue;
```

**Use TypeScript strict mode:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

**Format code before commit:**
```bash
npm run format
git add .
npm run commit
```

---

## 📞 Need Help?

1. Check the docs: `INTEGRATION_CHECKLIST.md`
2. Review examples: `/backend/tests/`, `/frontend/app/`
3. Check logs: `docker-compose logs`
4. Read API docs: `API_REFERENCE.md` (create if needed)
5. Ask in team chat or open an issue

---

**Happy coding! 🚀**
