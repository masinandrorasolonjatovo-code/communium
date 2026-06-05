# EXPLICATION COMPLETE DU SITE COMMUNIUM

Derniere mise a jour: 2026-05-30

Ce document explique le site Communium depuis le debut jusqu'a la fin. Il sert de README d'explication pour comprendre le projet, savoir ou chercher dans le code, comment les pages fonctionnent, comment le backend repond, et comment les grandes fonctionnalites sont organisees.

## 1. Idee generale du site

Communium est une plateforme professionnelle de reseau, profil, publications, messagerie, notifications, abonnements premium, verification et administration.

Le but du site est de permettre a un utilisateur de:

- creer un compte;
- choisir un type de compte personnel ou business;
- completer son profil professionnel;
- publier du contenu;
- chercher des profils, secteurs, entreprises et opportunites;
- envoyer et recevoir des messages;
- recevoir des notifications reelles;
- gerer ses parametres, sa confidentialite et sa securite;
- acheter ou gerer un abonnement Premium;
- demander une verification KYC/KYB;
- acceder a un tableau de bord avec statistiques et actions recommandees.

## 2. Structure principale du projet

Le projet est separe en plusieurs dossiers.

```txt
communium/
  frontend/      Application web Next.js
  backend/       API Express, temps reel, fichiers, paiements
  ai-service/    Service de matching/recommandation
  database/      Initialisation PostgreSQL
  docker-compose.yml
  .env.example
```

### Frontend

Le frontend est dans `frontend/`.

Technologies principales:

- Next.js avec App Router;
- React;
- Clerk pour l'authentification;
- next-intl pour les routes localisees;
- lucide-react pour les icones;
- CSS global et styles dans les composants;
- appels API via les routes Next.js et le backend Express.

### Backend

Le backend est dans `backend/`.

Technologies principales:

- Express;
- PostgreSQL;
- Socket.IO pour la messagerie et les notifications en temps reel;
- Multer pour les uploads;
- Stripe et CMI pour le paiement;
- modules separes par domaine fonctionnel.

### AI service

Le dossier `ai-service/` contient le service de matching. Le backend l'appelle pour les recommandations par secteur.

## 3. Demarrage du projet

### Avec Docker

Le fichier `docker-compose.yml` lance:

- PostgreSQL sur le port `5432`;
- Redis sur le port `6379`;
- backend sur le port `5000`;
- frontend sur le port `3000`;
- ai-service sur le port `8000`.

Commande:

```bash
docker compose up --build
```

Si Docker affiche une ancienne version du site, reconstruire sans cache:

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

Les images applicatives construites par Compose sont:

```txt
communium-frontend
communium-backend
communium-ai-service
```

Le frontend et le backend installent les dependances avec `npm ci`, donc ils utilisent exactement le contenu des `package-lock.json`. Le service IA installe les dependances depuis `ai-service/requirements.txt`.

Le demarrage Docker est protege par des healthchecks: PostgreSQL et Redis passent en etat `healthy`, puis le backend initialise les schemas, puis le frontend et le service IA demarrent.

### En local

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Build frontend:

```bash
cd frontend
npm run build
```

## 4. Variables d'environnement

Le fichier `.env.example` montre les variables importantes.

Principales categories:

- Clerk: connexion, inscription, session utilisateur;
- Stripe: paiement international;
- CMI: paiement marocain;
- PostgreSQL: base de donnees;
- Redis: cache et sessions;
- AI service: recommandations;
- URLs frontend/backend;
- securite;
- email et notifications;
- stockage local ou externe.

Exemples importants:

```txt
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
BACKEND_INTERNAL_URL=http://localhost:5000
DATABASE_URL=postgresql://user:password@localhost:5432/communium
AI_SERVICE_URL=http://localhost:8000
```

## 5. Fonctionnement global d'une page

Le parcours typique est:

```txt
Utilisateur
  -> page Next.js dans frontend/app/[locale]
  -> composant React dans frontend/components
  -> appel API frontend ou backend
  -> backend Express dans backend/server.js
  -> module backend dans backend/src
  -> PostgreSQL / fichiers / Socket.IO
  -> retour JSON
  -> affichage dans la page
```

Exemple avec les notifications:

```txt
/fr/notifications
  -> frontend/app/[locale]/notifications/page.tsx
  -> appel /api/notifications
  -> backend/src/homeModule.js et dashboardModule.js
  -> lecture/ecriture notifications
  -> Socket.IO envoie les changements en temps reel
  -> badge et liste se mettent a jour
```

## 6. Routage et langue

Les pages sont sous:

```txt
frontend/app/[locale]/
```

La langue active est geree par:

```txt
frontend/i18n.config.ts
frontend/i18n/request.ts
frontend/proxy.ts
frontend/app/[locale]/layout.tsx
```

Actuellement, les langues exposees et verifiees sont:

```txt
fr, en, es
```

Les anciennes routes incompletes comme `/ar`, `/de`, `/zh`, `/ja`, `/pt` et `/ru` sont redirigees vers `/fr` pour eviter un melange de langues dans l'interface. Les fichiers de messages de ces langues restent dans le projet comme base de traduction future.

Le layout global charge:

- Clerk;
- ThemeProvider;
- NextIntlClientProvider;
- Header;
- ProfileBootstrapSync;
- les styles globaux.

## 6.7 Administration et gouvernance

Un espace d'administration complet existe pour permettre a l'equipe de gerer la plateforme depuis `/fr/admin`, `/en/admin` ou `/es/admin` selon la langue active.

Fonctions couvertes:

- verification des identites: KYC pour les particuliers et KYB pour les entreprises;
- moderation des signalements et des contenus;
- gestion des partenaires de la plateforme;
- consultation des logs de securite;
- supervision des abonnements, factures et paiements.

Le controle d'acces suit ce deroulement:

```txt
Email / compte connecte
        ↓
Verification dans Clerk ou PostgreSQL
        ↓
Le compte a-t-il le role admin ?
        ↓
Oui -> acces a l'espace administrateur
Non -> espace utilisateur normal
```

L'e-mail `masinandrorasolonnjatovo@gmail.com` est declare comme compte admin de reference. Le mot de passe reste gere par Clerk et n'est pas ecrit dans les fichiers du projet.

## 7. Theme clair / sombre

Le theme est gere principalement par:

```txt
frontend/components/ThemeProvider.tsx
frontend/components/theme-config.ts
frontend/app/[locale]/globals.css
```

Le theme est applique via:

```txt
html[data-theme='light']
html[data-theme='dark']
```

Les regles importantes:

- le texte doit toujours utiliser les variables de couleur du theme;
- les cartes utilisent les surfaces du theme;
- les pages ne doivent pas avoir de texte blanc sur fond clair ou texte noir sur fond sombre;
- les corrections doivent se faire via variables et overrides cibles, pas avec des selecteurs trop larges qui cassent d'autres pages.

## 8. Pages principales du frontend

### Accueil

Fichiers importants:

```txt
frontend/app/[locale]/page.tsx
frontend/components/home/HomeExperience.tsx
frontend/components/home/PublicLandingExperience.tsx
```

Role:

- presenter Communium;
- afficher le feed membre si l'utilisateur est connecte;
- montrer les profils, publications, actions rapides et liens vers les espaces importants.

### Authentification

Routes:

```txt
/fr/auth/sign-in
/fr/auth/sign-up
/fr/auth/select-account-type
/fr/auth/forgot-password
/fr/auth/reset-password
/fr/auth/verify-email
```

Role:

- connexion;
- inscription;
- choix personnel/business;
- verification email;
- recuperation de mot de passe.

Clerk gere la session, mais certaines pages ont aussi une logique frontend locale.

### Tableau de bord

Route:

```txt
/fr/dashboard
```

Fichier:

```txt
frontend/app/[locale]/dashboard/page.tsx
```

Role:

- afficher les statistiques principales;
- montrer les publications recentes;
- montrer les notifications importantes;
- afficher l'etat abonnement;
- afficher l'etat verification;
- proposer des actions recommandees;
- creer une publication rapidement.

API backend:

```txt
/api/dashboard
/api/dashboard-posts
/api/dashboard-subscriptions
```

### Profil

Routes:

```txt
/fr/profile
/fr/profile/edit
/fr/profile/cv
/fr/profile/settings/privacy
/fr/profile/settings/verification
/fr/u/[username]
/fr/profile/[profileUrl]
```

Fichiers importants:

```txt
frontend/app/[locale]/dashboard/profile/page.tsx
frontend/components/profile/PublicProfessionalProfile.tsx
frontend/components/member/MemberAccountRoutePage.tsx
```

Role:

- editer l'identite;
- gerer photo et couverture;
- gerer CV;
- gerer experiences et centres d'interet;
- configurer la confidentialite champ par champ;
- afficher le profil public.

Backend:

```txt
backend/src/profileModule.js
```

### Feed et publications

Routes:

```txt
/fr/feed
/fr/dashboard/posts
```

Role:

- voir les publications;
- creer une publication;
- commenter;
- aimer;
- sauvegarder;
- gerer la visibilite.

Backend:

```txt
backend/src/homeModule.js
backend/src/dashboardModule.js
```

APIs:

```txt
/api/posts
/api/comments
/api/saved
/api/dashboard-posts
```

### Messages

Route:

```txt
/fr/messages
```

Fichier:

```txt
frontend/components/messages/ProfessionalMessagesWorkspace.tsx
```

Backend:

```txt
backend/src/messagesModule.js
```

Role:

- conversations directes;
- conversations groupe;
- messages texte;
- pieces jointes;
- messages vocaux;
- messages supprimes;
- etats lu/envoye;
- notifications temps reel;
- selection d'une conversation depuis une notification.

Temps reel:

```txt
Socket.IO
attachMessagesRealtime(server, allowedOrigins)
```

### Notifications

Route:

```txt
/fr/notifications
```

Fichier:

```txt
frontend/app/[locale]/notifications/page.tsx
```

Role:

- lister les notifications;
- filtrer par type;
- marquer comme lu;
- afficher les badges non lus;
- recevoir les notifications messages et activites.

Backend:

```txt
backend/src/homeModule.js
backend/src/dashboardModule.js
```

Temps reel:

```txt
attachNotificationsRealtime(realtime)
```

### Parametres

Route:

```txt
/fr/settings
```

Fichier:

```txt
frontend/components/settings/SettingsCenter.tsx
```

Role:

- informations personnelles;
- photo et couverture;
- bio et profession;
- langue;
- confidentialite;
- securite;
- notifications;
- messages;
- abonnement;
- support.

Backend:

```txt
backend/src/settingsModule.js
```

API:

```txt
/api/settings
```

### Premium et paiement

Routes:

```txt
/fr/premium
/fr/checkout
/fr/checkout/[plan]
/fr/checkout/success
/fr/billing
/fr/billing/invoices
/fr/billing/payment-methods
```

Fichiers importants:

```txt
frontend/components/premium/PremiumSaasWorkspace.tsx
frontend/lib/checkout-flow.ts
backend/src/governanceModule.js
backend/server.js
```

Role:

- choisir un plan;
- voir les offres Gratuit, Silver, Gold, Platinum;
- choisir paiement CMI, Stripe ou autre;
- envoyer et renvoyer le code de verification;
- valider le paiement;
- consulter l'abonnement et l'historique.

APIs:

```txt
/api/payment/tiers
/api/payment/checkout/stripe
/api/payment/checkout/cmi
/api/payment/checkout/paypal
/api/payments
/api/subscriptions
/api/billing
```

### Verification KYC/KYB

Routes:

```txt
/fr/profile/settings/verification
/fr/verification
/fr/admin/verifications
/fr/admin/verifications/[verificationId]
/fr/dashboard/admin/verifications
```

Backend:

```txt
backend/src/profileModule.js
backend/src/governanceModule.js
```

Role:

- verifier un profil personnel;
- verifier une entreprise;
- uploader les documents;
- suivre statut non verifie, en attente, verifie, rejete;
- administrer les demandes de verification.

### Administration

Routes:

```txt
/fr/admin
/fr/admin/partners
/fr/admin/reports
/fr/admin/security-logs
/fr/admin/verifications
```

Role:

- verifier si le compte connecte possede le role admin;
- ouvrir l'espace administrateur si le role est autorise;
- renvoyer vers l'espace utilisateur normal si le compte n'est pas admin;
- gerer les partenaires;
- moderer les signalements et contenus;
- consulter les journaux de securite;
- gerer les verifications KYC/KYB;
- superviser abonnements, factures et paiements.

Deroulement d'acces:

```txt
Email / compte connecte
        ↓
Verification dans Clerk ou PostgreSQL
        ↓
Le compte a-t-il le role admin ?
        ↓
Oui -> acces a l'espace administrateur
Non -> espace utilisateur normal
```

Compte admin de reference:

```txt
masinandrorasolonnjatovo@gmail.com
```

Le mot de passe n'est pas stocke dans le code. Il reste gere par Clerk.

Backend:

```txt
backend/src/governanceModule.js
backend/src/profileModule.js
frontend/app/api/auth/_utils.ts
frontend/components/governance/AdminGovernanceWorkspace.tsx
```

## 9. Backend: organisation des modules

Le fichier central est:

```txt
backend/server.js
```

Il configure:

- Express;
- CORS;
- JSON body;
- headers de securite;
- rate limiting API;
- fichiers statiques uploades;
- schemas de base de donnees;
- routes API;
- Socket.IO;
- lancement serveur.

Modules dans `backend/src/`:

```txt
profileModule.js       profils, uploads, verification, CV
homeModule.js          accueil, feed, posts, commentaires, notifications, recherche
messagesModule.js      messagerie, groupes, pieces jointes, realtime
dashboardModule.js     dashboard, posts dashboard, notifications dashboard
settingsModule.js      parametres compte, confidentialite, securite, notifications
governanceModule.js    paiements, abonnements, admin, rapports, billing, partenaires
onboardingModule.js    onboarding, statut profil
matching.ts            logique de matching
```

## 10. Routes API principales

Dans `backend/server.js`, les routes sont branchees comme ceci:

```txt
/api/profile/status
/api/profile
/api/verification
/api/notifications
/api/posts
/api/comments
/api/profiles
/api/connections
/api/events
/api/search
/api/saved
/api/admin
/api/user
/api/business
/api/billing
/api/payments
/api/subscriptions
/api/analytics
/api/security
/api/settings
/api/onboarding
/api/partners
/api/reports
/api/admin/partners
/api/admin/reports
/api/messages
/api/dashboard
/api/dashboard-posts
/api/dashboard-subscriptions
```

Routes paiement directes:

```txt
/api/payment/tiers
/api/payment/checkout/stripe
/api/payment/checkout/cmi
/api/payment/checkout/paypal
```

Routes matching:

```txt
/api/matching/sectors
/api/matching/recommendations
```

## 11. Base de donnees

Le projet utilise PostgreSQL.

Le fichier:

```txt
database/init.sql
```

initialise la base dans Docker.

Les modules backend appellent des fonctions `ensure...Schema()` au demarrage:

```txt
ensureProfileSchema()
ensureGovernanceSchema()
ensureMessagesSchema()
ensureSettingsSchema()
ensureOnboardingSchema()
ensureHomeSchema()
```

Cela signifie que le backend prepare ou verifie les tables necessaires au demarrage.

## 12. Uploads et fichiers

Les fichiers sont servis par le backend:

```txt
/uploads/profile-pictures
/uploads/banners
/uploads/messages
/uploads/posts
```

Les fichiers physiques sont dans:

```txt
backend/uploads/
```

Types de fichiers geres:

- avatar;
- banniere;
- fichiers messages;
- images de posts;
- CV et documents selon les modules.

## 13. Temps reel

Le temps reel est gere avec Socket.IO.

Dans `backend/server.js`:

```txt
const realtime = attachMessagesRealtime(server, allowedOrigins);
attachNotificationsRealtime(realtime);
```

Cela permet:

- nouveau message sans recharger;
- badges de messages;
- notifications instantanees;
- mise a jour de certains etats conversationnels.

## 14. Securite

Le backend applique:

- CORS limite aux origines autorisees;
- rate limit API;
- headers securite;
- protection de certains fichiers;
- routes protegees cote frontend via Clerk.

Dans `frontend/proxy.ts`, les routes protegees incluent:

```txt
/fr/dashboard
/fr/messages
/fr/notifications
/fr/checkout
/fr/billing
/fr/business
/fr/settings
/fr/profile
/fr/verification
/fr/admin
```

Si l'utilisateur n'est pas connecte, il est redirige vers:

```txt
/fr/auth/sign-in
```

## 15. Parcours utilisateur complet

### Nouveau visiteur

1. Il arrive sur `/fr`.
2. Il voit la presentation de Communium.
3. Il peut se connecter ou creer un compte.
4. Il choisit un type de compte.
5. Il complete son profil.
6. Il arrive dans son espace membre.

### Utilisateur connecte

1. Il arrive sur son accueil/feed.
2. Il peut publier, commenter, sauvegarder.
3. Il peut ouvrir son tableau de bord.
4. Il peut completer son profil.
5. Il peut gerer sa confidentialite.
6. Il peut envoyer des messages.
7. Il recoit des notifications.
8. Il peut choisir un abonnement premium.

### Utilisateur premium

1. Il va sur `/fr/premium`.
2. Il choisit Silver, Gold ou Platinum.
3. Il choisit un moyen de paiement.
4. Il recoit ou renvoie un code de verification.
5. Il valide le paiement.
6. Son abonnement est affiche dans le dashboard et les parametres.

### Admin

1. Il accede aux routes admin.
2. Il gere les verifications.
3. Il consulte rapports et journaux.
4. Il gere partenaires et donnees de gouvernance.

## 16. Fichiers importants a connaitre

Frontend:

```txt
frontend/app/[locale]/layout.tsx
frontend/app/[locale]/globals.css
frontend/proxy.ts
frontend/i18n.config.ts
frontend/components/Header.tsx
frontend/components/ThemeProvider.tsx
frontend/components/theme-config.ts
frontend/components/localized-labels.ts
frontend/components/home/HomeExperience.tsx
frontend/components/messages/ProfessionalMessagesWorkspace.tsx
frontend/components/settings/SettingsCenter.tsx
frontend/components/premium/PremiumSaasWorkspace.tsx
```

Backend:

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

Config:

```txt
docker-compose.yml
.env.example
frontend/package.json
backend/package.json
database/init.sql
```

## 17. Points recemment corriges

### Theme

Le theme clair/sombre devait garantir que les textes restent visibles partout. Les corrections importantes sont:

- utiliser les variables globales du theme;
- eviter les selecteurs CSS trop larges qui changent toutes les cartes du site;
- corriger les surfaces sombres/claires page par page quand necessaire;
- synchroniser le theme initial avec le `data-theme` du document.

### Notifications messages

Les messages entrants doivent creer une notification reelle.

Le systeme doit:

- creer une notification quand un message arrive;
- afficher le badge;
- ouvrir la conversation concernee depuis la notification;
- marquer les notifications comme lues.

### Paiement et renvoi du code

Le bouton de renvoi du code doit appeler une vraie API, puis le code doit etre utilise dans la validation paiement.

### Langues

Pour eviter le melange de langues, seules les pages francaises sont actuellement exposees. Les langues incompletes redirigent vers `/fr`.

## 18. Comment ajouter une nouvelle fonctionnalite proprement

1. Identifier la page frontend.
2. Identifier le composant principal.
3. Ajouter ou modifier l'appel API.
4. Ajouter la route backend dans le module correspondant.
5. Verifier la base de donnees si une table ou colonne est necessaire.
6. Ajouter les libelles dans un helper ou une structure claire.
7. Tester en theme clair et sombre.
8. Tester le parcours utilisateur complet.
9. Lancer:

```bash
cd frontend
npm run build
```

10. Si le backend est touche:

```bash
cd backend
npm test
```

## 19. Regles importantes pour ne pas recasser le site

- Ne jamais afficher directement des valeurs backend comme `FREE`, `NON_VERIFIED`, `PERSONAL`, `member`.
- Passer par des fonctions de formatage comme `formatPlanLabel`, `formatVerificationStatus`, `formatVisibilityLabel`.
- Ne pas reactiver une langue tant que toutes les pages ne sont pas traduites.
- Ne pas mettre de couleur fixe partout; utiliser les variables du theme.
- Tester les pages principales apres chaque changement.
- Ne pas supprimer les uploads ou la base sans sauvegarde.
- Ne pas modifier une route protegee sans verifier `frontend/proxy.ts`.

## 20. Resume simple

Communium est une application professionnelle complete:

- frontend Next.js pour l'interface;
- backend Express pour les API;
- PostgreSQL pour les donnees;
- Socket.IO pour le temps reel;
- Clerk pour l'authentification;
- modules separes pour profil, feed, messages, notifications, dashboard, premium, parametres et admin.

Si tu veux comprendre une fonctionnalite, commence toujours par la route dans `frontend/app/[locale]`, puis suis le composant dans `frontend/components`, puis l'API dans `backend/server.js`, puis le module dans `backend/src`.
