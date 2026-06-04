# READ ME FIRST - Communium

Derniere mise a jour: 2026-05-30

Lis ce fichier en premier si tu veux comprendre rapidement l'etat actuel du projet.

Communium n'est plus seulement un ancien MVP de matching. Le site contient maintenant plusieurs espaces reels:

- accueil et feed;
- profil public et profil membre;
- tableau de bord;
- messagerie;
- notifications;
- parametres;
- premium et paiement;
- verification KYC/KYB;
- administration;
- backend API Express;
- temps reel avec Socket.IO.

## 1. Les deux documents les plus importants

### Explication generale

[EXPLICATION.md](./EXPLICATION.md)

Ce fichier explique tout le site comme produit:

- objectif;
- architecture;
- frontend;
- backend;
- pages;
- API;
- base de donnees;
- parcours utilisateur.

### Explication du code

[EXPLICATION-CODE.md](./EXPLICATION-CODE.md)

Ce fichier explique le code par fichiers et blocs de lignes:

- theme;
- langue;
- header;
- dashboard;
- messages;
- notifications;
- parametres;
- premium;
- backend;
- API;
- base de donnees.

## 2. Etat actuel a retenir

```txt
Langue active: francais uniquement
Frontend: Next.js
Backend: Express
Auth: Clerk
Base: PostgreSQL
Temps reel: Socket.IO
Paiements: CMI / Stripe selon configuration
Theme: clair / sombre
```

Les routes `/en`, `/ar`, `/es` redirigent vers `/fr`, parce que les autres langues ne sont pas encore completement traduites.

## 3. Ou demarrer

### Pour lancer le projet

Lire:

[README.md](./README.md)

Puis utiliser:

```bash
docker compose up --build
```

ou en local:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

### Pour comprendre le code

Lire:

[EXPLICATION-CODE.md](./EXPLICATION-CODE.md)

### Pour comprendre les pages et le produit

Lire:

[EXPLICATION.md](./EXPLICATION.md)

## 4. Structure rapide

```txt
communium/
  frontend/       Site Next.js
  backend/        API Express
  ai-service/     Matching/recommandation
  database/       Base PostgreSQL
  EXPLICATION.md
  EXPLICATION-CODE.md
  README.md
```

## 5. Fichiers a connaitre

### Frontend

```txt
frontend/app/[locale]/layout.tsx
frontend/app/[locale]/globals.css
frontend/proxy.ts
frontend/i18n.config.ts
frontend/components/Header.tsx
frontend/components/ThemeProvider.tsx
frontend/components/localized-labels.ts
```

### Pages importantes

```txt
frontend/app/[locale]/page.tsx
frontend/app/[locale]/dashboard/page.tsx
frontend/app/[locale]/notifications/page.tsx
frontend/app/[locale]/messages/page.tsx
frontend/app/[locale]/settings/page.tsx
frontend/app/[locale]/premium/page.tsx
frontend/app/[locale]/dashboard/profile/page.tsx
```

### Backend

```txt
backend/server.js
backend/src/profileModule.js
backend/src/homeModule.js
backend/src/messagesModule.js
backend/src/dashboardModule.js
backend/src/settingsModule.js
backend/src/governanceModule.js
backend/src/onboardingModule.js
```

## 6. Fonctionnalites actuelles

### Authentification

- Clerk;
- routes protegees dans `frontend/proxy.ts`;
- redirection vers `/fr/auth/sign-in` si l'utilisateur n'est pas connecte.

### Theme

- clair/sombre;
- stockage dans `localStorage` avec la cle `communium-theme`;
- application via `html[data-theme]`.

### Langue

- francais seul en production actuelle;
- les autres langues doivent rester desactivees tant que toutes les pages ne sont pas traduites.

### Messages

- conversations directes;
- groupes;
- upload fichiers;
- messages audio;
- temps reel;
- notifications reelles quand un message arrive.

### Notifications

- liste;
- filtre;
- badge;
- marquer comme lu;
- tout marquer comme lu;
- temps reel.

### Premium

- plans Gratuit, Silver, Gold, Platinum;
- verification par code;
- renvoi du code;
- historique paiement;
- abonnement affiche dans dashboard et parametres.

## 7. Commandes utiles

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
```

Backend:

```bash
cd backend
npm install
npm run dev
npm test
```

Docker:

```bash
docker compose up --build
```

## 8. Verification minimum apres changement

Toujours tester:

```txt
/fr
/fr/dashboard
/fr/messages
/fr/notifications
/fr/settings
/fr/premium
```

Puis lancer:

```bash
cd frontend
npm run build
```

## 9. Attention aux anciennes docs

Certains anciens fichiers de documentation peuvent encore parler de:

- plusieurs langues annoncees comme actives;
- ancienne phase MVP;
- ancien nom de middleware;
- Tailwind comme systeme principal;
- Prisma comme source unique;
- fonctionnalites encore theoriques.

La reference actuelle doit etre:

```txt
README.md
READ_ME_FIRST.md
EXPLICATION.md
EXPLICATION-CODE.md
```

## 10. Regle simple

Si tu veux savoir comment une fonctionnalite marche:

1. cherche la page dans `frontend/app/[locale]`;
2. cherche le composant dans `frontend/components`;
3. cherche l'appel API;
4. va dans `backend/server.js`;
5. suis la route vers `backend/src/...`;
6. lis `EXPLICATION-CODE.md` pour les lignes importantes.
