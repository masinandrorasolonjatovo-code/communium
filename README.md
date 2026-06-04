# Communium

Derniere mise a jour: 2026-05-30

Communium est une plateforme professionnelle de reseau, profils, publications, messagerie, notifications, verification, abonnements Premium et administration.

Ce README correspond a l'etat actuel du projet. Les anciennes informations sur un MVP limite, plusieurs langues actives ou des fichiers qui n'existent plus ne doivent plus etre utilisees comme reference principale.

## Etat actuel du site

- Frontend Next.js avec routes localisees sous `/fr`, `/en` et `/es`.
- Backend Express avec API REST, uploads et Socket.IO.
- Authentification avec Clerk.
- Base de donnees PostgreSQL.
- Temps reel pour messages et notifications.
- Systeme de theme clair/sombre avec variables CSS.
- Langues visibles actuellement: francais, anglais et espagnol.
- Les routes incompletes comme `/ar`, `/de`, `/zh`, `/ja`, `/pt` et `/ru` redirigent vers `/fr`.
- Premium avec plans Gratuit, Silver, Gold et Platinum.
- Paiement avec workflow de verification par code, CMI/Stripe selon configuration.
- Tableau de bord membre avec statistiques, profil, notifications et abonnement.
- Espace administration et gouvernance avec controle du role admin, verifications, rapports, partenaires, logs securite et supervision paiement.
- Partage temporaire possible avec `powershell -ExecutionPolicy Bypass -File .\scripts\share-wan.ps1`.

## Documentation principale

Lire ces fichiers dans cet ordre:

1. [EXPLICATION.md](./EXPLICATION.md)  
   Explication generale du site: architecture, parcours utilisateur, pages, modules, backend, base de donnees.

2. [EXPLICATION-CODE.md](./EXPLICATION-CODE.md)  
   Explication technique par fichiers et blocs de lignes: theme, langue, messages, notifications, paiement, dashboard, backend.

3. [READ_ME_FIRST.md](./READ_ME_FIRST.md)  
   Point d'entree rapide pour comprendre quoi ouvrir en premier.

4. [TESTING_GUIDE_FR.md](./TESTING_GUIDE_FR.md)  
   Guide de verification et tests.

## Structure du projet

```txt
communium/
  frontend/       Application Next.js
  backend/        API Express, modules metier, uploads, Socket.IO
  ai-service/     Service de matching/recommandation
  database/       Initialisation PostgreSQL
  docker-compose.yml
  .env.example
  EXPLICATION.md
  EXPLICATION-CODE.md
```

## Frontend

Dossier:

```txt
frontend/
```

Fichiers importants:

```txt
frontend/app/[locale]/layout.tsx
frontend/app/[locale]/globals.css
frontend/proxy.ts
frontend/i18n.config.ts
frontend/components/Header.tsx
frontend/components/ThemeProvider.tsx
frontend/components/theme-config.ts
frontend/components/localized-labels.ts
frontend/components/messages/ProfessionalMessagesWorkspace.tsx
frontend/components/settings/SettingsCenter.tsx
frontend/components/premium/PremiumSaasWorkspace.tsx
```

Commandes:

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Backend

Dossier:

```txt
backend/
```

Fichier principal:

```txt
backend/server.js
```

Modules principaux:

```txt
backend/src/profileModule.js
backend/src/homeModule.js
backend/src/messagesModule.js
backend/src/dashboardModule.js
backend/src/settingsModule.js
backend/src/governanceModule.js
backend/src/onboardingModule.js
```

Commandes:

```bash
cd backend
npm install
npm run dev
npm test
```

## Demarrage avec Docker

```bash
docker compose up --build
```

Pour forcer Docker a oublier les anciennes couches et reconstruire les images avec le code actuel:

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

Les Dockerfiles utilisent maintenant les fichiers de verrouillage (`package-lock.json`) et `requirements.txt` pour eviter qu'une image soit reconstruite avec d'anciennes dependances ou un etat local de `node_modules`.

Le compose contient aussi des healthchecks: PostgreSQL et Redis doivent etre prets avant le backend, puis le backend doit etre healthy avant le frontend et le service IA.

Services:

```txt
Frontend:   http://localhost:3000
Backend:    http://localhost:5000
AI service: http://localhost:8000
PostgreSQL: localhost:5432
Redis:      localhost:6379
```

## Variables d'environnement

Copier:

```bash
cp .env.example .env.local
```

Variables importantes:

```txt
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DATABASE_URL
REDIS_URL
FRONTEND_URL
BACKEND_URL
BACKEND_INTERNAL_URL
AI_SERVICE_URL
CLERK_ADMIN_EMAILS
VERIFICATION_ADMIN_EMAILS
STRIPE_SECRET_KEY
CMI_MERCHANT_ID
RESEND_API_KEY
```

## Langue

Les langues actuellement exposees sont:

```txt
fr, en, es
```

Configuration:

```txt
frontend/i18n.config.ts
frontend/proxy.ts
frontend/i18n/request.ts
```

Pourquoi seulement ces trois langues?

Parce que les autres dossiers de traduction existent encore comme base de travail, mais plusieurs pages ne sont pas completement traduites. Pour eviter du texte melange ou illisible, seules les langues verifiees sont exposees dans le selecteur.

## Theme

Le theme est gere par:

```txt
frontend/components/theme-config.ts
frontend/components/ThemeProvider.tsx
frontend/app/[locale]/globals.css
```

Le HTML recoit:

```html
<html data-theme="light">
<html data-theme="dark">
```

Les couleurs doivent passer par les variables CSS du theme. Ne pas forcer des couleurs globales comme `color: white` ou `color: black` partout.

## Fonctionnalites principales

### Profil

- profil public;
- profil prive;
- photo et banniere;
- CV;
- experiences;
- centres d'interet;
- confidentialite par champ;
- verification personnelle ou entreprise.

### Feed

- publications;
- commentaires;
- reactions;
- sauvegardes;
- visibilite public/reseau/prive/premium.

### Messages

- conversations directes;
- groupes;
- fichiers;
- audio;
- statut lu/envoye;
- temps reel Socket.IO;
- notifications liees aux messages.

### Notifications

- centre notifications;
- badges non lus;
- marquer comme lu;
- marquer tout comme lu;
- notifications temps reel.

### Premium

- plans Gratuit, Silver, Gold, Platinum;
- paiement CMI/Stripe selon configuration;
- code de verification;
- renvoi du code;
- historique paiement;
- abonnement affiche dans dashboard et parametres.

### Admin

- page `/admin` avec controle du role admin;
- verifications KYC/KYB;
- moderation des signalements et contenus;
- gestion des partenaires;
- logs securite;
- supervision des abonnements, factures et paiements.

Le compte admin de reference est reconnu par son e-mail dans Clerk et dans la configuration backend:

```txt
masinandrorasolonnjatovo@gmail.com
```

Le mot de passe reste gere par Clerk et ne doit pas etre stocke en clair dans le code.

## API backend principale

Routes branchees dans `backend/server.js`:

```txt
/api/profile
/api/verification
/api/notifications
/api/posts
/api/comments
/api/profiles
/api/connections
/api/search
/api/saved
/api/messages
/api/dashboard
/api/settings
/api/payments
/api/subscriptions
/api/billing
/api/analytics
/api/security
/api/admin
```

## Verification rapide apres modification

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
npm test
```

Routes a verifier manuellement:

```txt
/fr
/fr/dashboard
/fr/messages
/fr/notifications
/fr/settings
/fr/premium
/fr/profile
```

## Regles pour ne pas recasser le site

- Ne pas reactiver une langue tant que toutes les pages ne sont pas traduites.
- Ne pas afficher directement `FREE`, `NON_VERIFIED`, `PERSONAL`, `member`.
- Utiliser `frontend/components/localized-labels.ts` pour les libelles.
- Tester clair et sombre apres modification de CSS.
- Tester messages et notifications en temps reel apres modification backend.
- Ne pas modifier les README dans `node_modules`.
