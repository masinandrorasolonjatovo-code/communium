# Guide de push par module

Ces commandes permettent de preparer un commit par module.

## Pousser M1

```bash
git add modules/M1-auth-profils \
  backend/src/profileModule.js \
  backend/src/onboardingModule.js \
  backend/src/settingsModule.js \
  backend/src/governanceModule.js \
  frontend/app/[locale]/auth \
  frontend/app/[locale]/profile \
  frontend/components/profile \
  frontend/components/verification \
  frontend/components/settings \
  backend/prisma/schema.prisma \
  database/init.sql
git commit -m "feat(M1): auth profiles and verification"
git push
```

## Pousser M2

```bash
git add modules/M2-paiements-tks \
  backend/src/routes/payment.ts \
  backend/src/governanceModule.js \
  frontend/app/[locale]/checkout \
  frontend/app/[locale]/billing \
  frontend/app/[locale]/premium \
  frontend/components/premium \
  backend/prisma/schema.prisma \
  database/init.sql
git commit -m "feat(M2): payments and subscriptions"
git push
```

## Pousser M3

```bash
git add modules/M3-networking-matching \
  frontend/modules/M3-networking-matching \
  backend/src/homeModule.js \
  backend/src/routes/matching.ts \
  ai-service/matching_service.py \
  frontend/components/network/NetworkCenter.tsx \
  frontend/app/[locale]/discover/page.tsx \
  frontend/app/[locale]/search/page.tsx \
  frontend/tsconfig.json \
  frontend/next.config.mjs \
  backend/prisma/schema.prisma \
  database/init.sql
git commit -m "feat(M3): networking matching and member search"
git push
```

## Pousser seulement l'architecture des modules

```bash
git add modules MODULE_ARCHITECTURE.md backend/src/moduleRegistry.js
git commit -m "chore: add functional module architecture"
git push
```
