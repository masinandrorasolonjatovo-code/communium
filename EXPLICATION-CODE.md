# EXPLICATION-CODE DU PROJET COMMUNIUM

Derniere mise a jour: 2026-05-30

Ce document explique le code du site Communium. Il sert a comprendre ou se trouvent les lignes importantes et quel bloc de code fait quelle fonctionnalite.

Important: le projet contient beaucoup de fichiers et plusieurs dizaines de milliers de lignes. Pour rester lisible, cette documentation explique les lignes par fichiers et par blocs de lignes. Quand une fonctionnalite est citee, le document indique le fichier exact et les lignes a regarder.

## 1. Comment lire ce document

Chaque section suit ce format:

```txt
Fichier
Lignes importantes
Role du code
Comment le modifier sans casser le site
```

Exemple:

```txt
frontend/components/ThemeProvider.tsx
lignes 18-57
```

Cela veut dire: ouvrir ce fichier et regarder les lignes autour de 18 a 57.

## 2. Architecture generale du code

Le projet est organise comme ceci:

```txt
communium/
  frontend/
    app/[locale]/        Routes Next.js
    components/          Composants React reutilisables
    i18n/                Configuration messages/langue
    lib/                 Helpers frontend
    messages/            Fichiers de traduction
  backend/
    server.js            Entree principale API Express
    src/                 Modules backend par domaine
    uploads/             Fichiers envoyes par les utilisateurs
  ai-service/
    matching_service.py  Service de matching
  database/
    init.sql             Initialisation PostgreSQL
```

Le trajet normal du code est:

```txt
Page frontend
  -> composant React
  -> fetch vers une API
  -> backend/server.js
  -> module backend/src/*
  -> base de donnees ou fichier
  -> retour JSON
  -> React met a jour l'ecran
```

## 2.1 Code Docker et images

Fichiers:

```txt
docker-compose.yml
frontend/Dockerfile
backend/Dockerfile
ai-service/Dockerfile
frontend/.dockerignore
backend/.dockerignore
ai-service/.dockerignore
```

Role:

```txt
docker-compose.yml
```

Ce fichier lance PostgreSQL, Redis, le backend, le frontend et le service IA ensemble. Les images applicatives sont reconstruites depuis les dossiers `frontend/`, `backend/` et `ai-service/`.

Les blocs `healthcheck` et `depends_on.condition` imposent l'ordre de demarrage: PostgreSQL et Redis doivent etre prets, ensuite le backend demarre et devient healthy, ensuite le frontend et le service IA se lancent.

```txt
frontend/Dockerfile
backend/Dockerfile
```

Ces fichiers installent npm 11, copient `package.json` et `package-lock.json`, puis lancent `npm ci`. Cette commande evite qu'une image Docker prenne des dependances differentes de celles verifiees dans le projet.

```txt
ai-service/Dockerfile
```

Ce fichier installe Python puis lit `requirements.txt`. Quand une dependance IA change, il faut modifier `requirements.txt`, pas copier les versions a deux endroits.

Commande de verification:

```bash
docker compose config --quiet
docker compose build --no-cache
docker compose up -d --force-recreate
```

## 3. Code qui gere les langues

### 3.1 Configuration des langues

Fichier:

```txt
frontend/i18n.config.ts
```

Lignes importantes:

```txt
5   supportedLocales
9   defaultLocale
11  rtlLocales
13  localeNames
29  isSupportedLocale()
```

Explication:

- ligne 5: dit quelles langues sont vraiment disponibles dans le site.
- ligne 9: indique la langue par defaut. Ici c'est `fr`.
- ligne 11: indique les langues RTL, par exemple arabe.
- ligne 13: donne les noms affichables des langues.
- lignes 29-30: fonction qui verifie si une langue est supportee.

Code important:

```ts
export const supportedLocales = ['fr', 'en', 'es'] as const;
export const defaultLocale: Locale = 'fr';
```

Cela veut dire que le site expose maintenant francais, anglais et espagnol.

Si tu veux reactiver une autre langue un jour, il ne suffit pas d'ajouter son code. Il faut d'abord verifier les textes de pages et composants, puis seulement ajouter la langue:

```ts
export const supportedLocales = ['fr', 'en', 'es', 'ar'] as const;
```

### 3.2 Redirection des mauvaises langues

Fichier:

```txt
frontend/proxy.ts
```

Lignes importantes:

```txt
6-10    creation du middleware next-intl
12-31   liste des routes protegees
45-56   redirection des langues non supportees
59-62   protection Clerk
69-73   matcher du middleware
```

Explication:

- lignes 6-10: Next.js sait que les URLs ont une langue: `/fr/...`.
- lignes 12-31: liste des routes ou il faut etre connecte.
- lignes 45-56: si l'utilisateur arrive sur une langue connue mais non supportee comme `/ar` ou `/de`, il est renvoye vers `/fr`.
- lignes 59-62: si une route est protegee, Clerk force la connexion.
- lignes 69-73: dit a Next.js sur quelles URLs le proxy doit agir.

Code important:

```ts
if (isLocale(locale) && !isSupportedLocale(locale)) {
  redirectUrl.pathname = `/${defaultLocale}`;
  return NextResponse.redirect(redirectUrl);
}
```

C'est ce code qui evite les pages melangees entre langues verifiees et langues incompletes.

### 3.3 Layout global avec langue

Fichier:

```txt
frontend/app/[locale]/layout.tsx
```

Lignes importantes:

```txt
24-26   generateStaticParams()
55-57   verification de la langue
73      script initial du theme
85-99   providers globaux
91-98   ThemeProvider + NextIntlClientProvider
95      Header
```

Explication:

- lignes 24-26: genere les routes statiques pour les langues supportees.
- lignes 55-57: bloque une langue invalide.
- ligne 73: injecte le theme avant affichage pour eviter un flash mauvais theme.
- lignes 85-99: enveloppe toute l'application avec Clerk, theme, traduction et header.

Code important:

```tsx
<ThemeProvider>
  <NextIntlClientProvider messages={messages} locale={locale}>
    <Header locale={locale} />
    {children}
  </NextIntlClientProvider>
</ThemeProvider>
```

Cela veut dire que toutes les pages recoivent:

- l'utilisateur Clerk;
- le theme;
- la langue;
- le header.

### 3.4 Libelles traduits pour les valeurs backend

Fichier:

```txt
frontend/components/localized-labels.ts
```

Lignes importantes:

```txt
9    tr()
34   formatPlanLabel()
57   formatSubscriptionStatus()
72   formatVerificationStatus()
89   formatVisibilityLabel()
99   formatPostTypeLabel()
113  formatCompletionLabel()
```

Explication:

Ce fichier evite d'afficher directement les valeurs techniques envoyees par le backend.

Exemples de mauvaises valeurs si on les affiche directement:

```txt
FREE
NON_VERIFIED
PERSONAL
Private
member
```

Ces fonctions les transforment en textes propres:

```txt
Gratuit
Non verifie
Personnel
Prive
Membre
```

Exemple:

```ts
formatPlanLabel(locale, subscription?.plan)
```

Si le backend envoie `free`, l'utilisateur voit `Gratuit`.

Regle importante:

Ne jamais afficher directement une valeur backend dans le JSX si c'est un statut, un plan, une visibilite ou un type de compte. Utiliser ce fichier.

## 4. Code qui gere le theme

### 4.1 Cle de stockage du theme

Fichier:

```txt
frontend/components/theme-config.ts
```

Lignes importantes:

```txt
3     THEME_STORAGE_KEY
9     lecture localStorage
16    acces document.documentElement
20-21 fallback theme light
```

Explication:

- ligne 3: nom de la cle dans `localStorage`.
- lignes 9-16: lit le theme sauvegarde.
- lignes 20-21: si aucun theme correct n'est trouve, applique le theme clair.

Code important:

```ts
export const THEME_STORAGE_KEY = 'communium-theme';
```

Le navigateur stocke le choix theme ici:

```txt
localStorage.communium-theme
```

### 4.2 Provider React du theme

Fichier:

```txt
frontend/components/ThemeProvider.tsx
```

Lignes importantes:

```txt
18    debut ThemeProvider
19-26 etat initial du theme
31-45 synchronisation avec document et localStorage
51-54 application du theme dans html[data-theme]
57-60 setTheme()
69    valeur fournie au contexte React
78-83 useTheme()
```

Explication:

- ligne 19: initialise le theme React.
- ligne 21: lit `document.documentElement.dataset.theme`.
- lignes 31-45: synchronise le theme si le script initial l'a deja applique.
- lignes 51-54: applique le theme dans le HTML.
- ligne 54: sauvegarde le theme dans le navigateur.
- lignes 78-83: hook `useTheme()` pour les composants.

Code important:

```ts
document.documentElement.dataset.theme = nextTheme;
window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
```

Ce code change visuellement tout le site car le CSS utilise:

```css
html[data-theme='dark']
html[data-theme='light']
```

### 4.3 CSS global du theme

Fichier:

```txt
frontend/app/[locale]/globals.css
```

Lignes importantes:

```txt
71      variables du theme sombre
134-192 corrections sombres generales
262-331 corrections theme clair/sombre
588-603 fond des pages en sombre
611-675 surfaces/cartes sombres ciblees
682-730 textes en sombre
734-744 champs input/select/textarea
748-760 boutons
778-783 cartes de posts
790-820 header et menu profil
897-991 corrections de composants divers
1028-1274 corrections pages publiques et surfaces avancees
```

Explication:

Ce fichier est le coeur visuel du site.

Important:

- `html[data-theme='dark']` applique les couleurs sombres.
- `html[data-theme='light']` applique les couleurs claires.
- Les regles doivent etre ciblees.
- Il ne faut pas faire un selecteur trop large qui force toutes les cartes du site sans distinction.

Exemple:

```css
html[data-theme='dark'] .dashboardPage h1 {
  color: var(--text-primary);
}
```

Cela veut dire:

- seulement en theme sombre;
- seulement dans dashboard;
- seulement les titres;
- couleur issue du systeme de theme.

Regle importante:

Si un texte est invisible, ne mets pas simplement `color: white` partout. Il faut corriger la variable ou la surface concernee.

## 5. Code du header et de la navigation

Fichier:

```txt
frontend/components/Header.tsx
```

Lignes importantes:

```txt
277    copyByLocale
310    copy active
317-331 liens importants
358    recuperation nombre notifications non lues
427-445 detection page active
```

Explication:

- `copyByLocale` contient les textes du header.
- `dashboardHref`, `messagesHref`, `notificationsHref`, `premiumHref` construisent les liens avec la langue.
- la ligne 358 va chercher le nombre de notifications non lues.
- les lignes 427-445 savent quel bouton du header doit etre actif.

Exemple:

```ts
const dashboardHref = localizeHref(locale, '/dashboard');
```

Si `locale = fr`, le lien devient:

```txt
/fr/dashboard
```

## 6. Code du tableau de bord

Fichier:

```txt
frontend/app/[locale]/dashboard/page.tsx
```

Lignes importantes:

```txt
31-36    imports des formatters de libelles
170      formatDate()
238      navigationItems
280      loadOverview()
317      createPost()
423-424  affichage visibilite et plan formates
441-444  cartes statistiques
459      graphique activite
490      ligne publication recente
589      plan abonnement formate
599      statut verification formate
621      formulaire creation publication
646      visibilite publication formatee
682      date notification formatee
702      composant StatCard
712      composant ActivityChart
730      styles dashboard
```

Explication:

### Charger les donnees dashboard

Autour de la ligne 280:

```ts
async function loadOverview() {
  const response = await fetch(`${backendOrigin}/api/dashboard/overview`)
}
```

Ce code demande au backend toutes les donnees du dashboard.

### Creer une publication

Autour de la ligne 317:

```ts
async function createPost(event: FormEvent) {
  await fetch(`${backendOrigin}/api/profile/posts`, { method: 'POST' })
}
```

Ce code envoie une nouvelle publication au backend.

### Afficher le plan correctement

Autour de la ligne 424:

```tsx
<span>{formatPlanLabel(locale, profile?.membershipTier || overview?.subscription?.plan)}</span>
```

Sans cette ligne, on pourrait voir `Free`. Avec elle, on voit `Gratuit`.

### Afficher la verification correctement

Autour de la ligne 599:

```tsx
<h2>{formatVerificationStatus(locale, overview?.verificationStatus?.status)}</h2>
```

Cela transforme `NON_VERIFIED` en `Non verifie`.

## 7. Code des notifications

Fichier:

```txt
frontend/app/[locale]/notifications/page.tsx
```

Lignes importantes:

```txt
202     notificationHref()
258     loadNotifications()
302     socket notification:new
327     markRead()
334     markAllRead()
360     saveSettings()
388     rendu principal
430     bouton tout marquer comme lu
437-446 panneau parametres
457-519 liste notifications
1022    composant Toggle
```

Explication:

### Charger les notifications

Autour de la ligne 258:

```ts
const response = await fetch(`/api/notifications?category=${category}&limit=30&offset=${nextOffset}`)
```

Cette ligne recupere les notifications depuis le backend.

### Recevoir une notification temps reel

Autour de la ligne 302:

```ts
socket.on('notification:new', (payload) => { ... })
```

Quand le backend envoie une notification, cette ligne met a jour l'ecran sans recharger.

### Marquer comme lu

Autour de la ligne 327:

```ts
await mutate('/api/notifications/read', { ids: [id] }, ...)
```

Cette ligne envoie au backend que la notification a ete lue.

### Tout marquer comme lu

Autour de la ligne 334:

```ts
await mutate('/api/notifications/read-all', {}, ...)
```

Cela remet le compteur non lu a zero.

## 8. Code des messages

Fichier:

```txt
frontend/components/messages/ProfessionalMessagesWorkspace.tsx
```

Lignes importantes:

```txt
348     t() traduction locale du composant
356     formatTime()
469     loadSocketScript()
492     composant principal
543     selectedConversation
591     unreadTotal
611     authHeaders()
638     apiFetch()
662     loadConversations()
683     loadConversation()
696     marquer conversation lue
727     rejoindre conversation socket
761-768 connexion Socket.IO
770     evenement message:new
787     evenement message:updated
793     evenement message:deleted
805     evenement message:read
809     presence:update
820     message:typing
866     notification navigateur
877     demande permission notifications navigateur
887     ajout fichiers
907     upload fichiers
965     sendMessage()
```

Explication:

### Charger les conversations

Autour de la ligne 662:

```ts
async function loadConversations(nextFilter = filter) {
  const body = await apiFetch(`/conversations?${params.toString()}`);
}
```

Cette fonction recupere les conversations depuis `/api/messages/conversations`.

### Charger une conversation

Autour de la ligne 683:

```ts
async function loadConversation(conversationId: string) {
  const body = await apiFetch(`/${conversationId}`);
}
```

Cette fonction recupere les messages d'une conversation precise.

### Marquer comme lu

Autour de la ligne 696:

```ts
await apiFetch('/read', {
  body: JSON.stringify({ conversationId })
})
```

Cela informe le backend que les messages de cette conversation sont lus.

### Temps reel messages

Autour des lignes 761-770:

```ts
const socket = window.io(socketOrigin, {
  path: '/socket.io',
  transports: ['polling', 'websocket'],
});

socket.on('message:new', ...)
```

Cela connecte la page messages au backend Socket.IO.

### Envoyer un message

Autour de la ligne 965:

```ts
async function sendMessage() {
  const body = await apiFetch('/send', {
    method: 'POST',
  });
}
```

Cette fonction:

1. verifie la conversation selectionnee;
2. upload les fichiers si necessaire;
3. envoie le message;
4. met a jour l'interface;
5. laisse Socket.IO notifier les autres membres.

## 9. Code des parametres

Fichier:

```txt
frontend/components/settings/SettingsCenter.tsx
```

Lignes importantes:

```txt
38-39    imports formatPlanLabel / formatSubscriptionStatus
424      loadSettings()
465      saveAccount()
485      patchPrivacy()
503      patchSecurity()
521      patchNotifications()
539      patchMessages()
557      uploadProfileAsset()
606      affichage plan formate
692-715  panneau informations personnelles
719-753  panneau photo/couverture
757-788  panneau bio/profession
792-814  panneau langue
818-835  panneau confidentialite
839-860  panneau securite
864-876  panneau notifications
880-914  panneau messages
918-951  panneau abonnement
985      composant SettingsPanel
1052     composant ToggleRow
1082     composant SelectRow
```

Explication:

### Charger tous les parametres

Autour de la ligne 424:

```ts
const [accountData, privacyData, securityData, notificationsData, messagesData, subscriptionData, paymentRows] =
  await Promise.all([...])
```

Le composant charge en parallele:

- compte;
- confidentialite;
- securite;
- notifications;
- messages;
- abonnement;
- historique paiement.

### Sauvegarder le compte

Autour de la ligne 465:

```ts
async function saveAccount() {
  await requestSettings<AccountData>('settings/account', { method: 'PATCH' })
}
```

### Modifier la confidentialite

Autour de la ligne 485:

```ts
async function patchPrivacy(patch: Partial<PrivacyData>, key: string) {
  await requestSettings<PrivacyData>('settings/privacy', { method: 'PATCH' })
}
```

### Upload avatar/couverture

Autour de la ligne 557:

```ts
async function uploadProfileAsset(kind: 'avatar' | 'cover', file?: File | null)
```

Cette fonction envoie l'image au backend avec `FormData`.

## 10. Code Premium et paiement

Fichier:

```txt
frontend/components/premium/PremiumSaasWorkspace.tsx
```

Lignes importantes a connaitre:

```txt
plans                 definition des offres
selectPlan()          selection Gratuit/Silver/Gold/Platinum
resendVerificationCode() renvoi du code paiement
createPayment()       creation paiement
renderPlans()         affichage cartes abonnement
renderPayment()       choix moyen de paiement
renderSummary()       resume paiement
renderAnalytics()     dashboard premium
renderHistory()       historique paiement
renderSuccess()       page succes
```

Backend lie:

```txt
backend/src/governanceModule.js
backend/server.js
```

APIs utilisees:

```txt
/api/payments/verification-code
/api/payments/verification-code/resend
/api/payments/create
/api/payments/verify
/api/subscriptions/select
/api/billing/subscription
/api/billing/invoices
```

Code important cote backend:

```txt
backend/src/governanceModule.js
1445 createPayment()
2322 /payments/verification-code
2323 /payments/verification-code/resend
2324 /payments/create
2325 /payments/verify
2334 /subscriptions
2336 /subscriptions/select
```

Explication:

- le frontend affiche les plans;
- l'utilisateur choisit un plan;
- le code de verification est envoye;
- le bouton renvoyer appelle `/api/payments/verification-code/resend`;
- la validation paiement appelle `/api/payments/create`;
- l'abonnement est sauvegarde et affiche dans le dashboard.

## 11. Code backend principal

Fichier:

```txt
backend/server.js
```

Lignes importantes:

```txt
1-55     imports des modules backend
68       stockage rate limit
72-116   apiRateLimit()
118-128  CORS
130      limite JSON
131-142  headers de securite
143      activation rate limit
156-159  fichiers statiques uploads
185-225  ensure schemas
274      route racine /
282      route /health
291      /api/payment/tiers
295-324  branchement de toutes les routes API
326-409  Stripe checkout
411-452  CMI checkout
454-485  PayPal checkout
487-508  matching sectors
511-597  matching recommendations
599-600  Socket.IO messages + notifications
602      server.listen()
```

Explication par bloc:

### Imports

Les lignes 1-55 importent les fonctions depuis `backend/src/*`.

Exemple:

```js
const { createProfileRouter } = require("./src/profileModule");
```

Cela veut dire que les routes profil sont codees dans `profileModule.js`.

### Rate limit

Lignes 72-116:

```js
function apiRateLimit(req, res, next) { ... }
```

Role:

- limiter le nombre de requetes API;
- limiter plus fort les routes paiement;
- limiter les routes auth;
- eviter les abus.

### CORS

Lignes 118-128:

```js
app.use(cors({ origin(origin, callback) { ... } }))
```

Role:

- autoriser seulement les origines frontend connues;
- bloquer les appels venant d'un domaine non autorise.

### Headers securite

Lignes 131-142:

```js
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Permissions-Policy
Strict-Transport-Security
```

Role:

- proteger contre certains abus navigateur;
- empecher l'iframe externe;
- limiter les permissions sensibles.

### Uploads

Lignes 156-159:

```js
app.use("/uploads/profile-pictures", express.static(...))
app.use("/uploads/banners", express.static(...))
app.use("/uploads/messages", express.static(...))
app.use("/uploads/posts", express.static(...))
```

Role:

- rendre accessibles les images profil;
- rendre accessibles les bannieres;
- rendre accessibles les fichiers messages;
- rendre accessibles les fichiers de posts.

### Schemas

Lignes 185-225:

```js
ensureProfileSchema()
ensureGovernanceSchema()
ensureMessagesSchema()
ensureSettingsSchema()
ensureOnboardingSchema()
ensureHomeSchema()
```

Role:

- preparer ou verifier les tables de base de donnees au demarrage.

### Branchement des routes

Lignes 295-324:

```js
app.use("/api/profile", createProfileRouter());
app.use("/api/messages", createMessagesRouter());
app.use("/api/dashboard", createDashboardRouter());
```

Role:

- associer une URL API a un module backend.

Exemple:

```txt
/api/messages/send
```

va vers:

```txt
backend/src/messagesModule.js
createMessagesRouter()
router.post("/send", sendMessage)
```

## 12. Backend profil

Fichier:

```txt
backend/src/profileModule.js
frontend/app/api/auth/_utils.ts
frontend/components/governance/AdminGovernanceWorkspace.tsx
```

Lignes importantes:

```txt
1138    ensureProfileSchema()
1745    ensureUser()
1894    ensureProfileForUser()
1925    ensureDefaultPrivacy()
1989    isVerificationAdmin()
2001    ensureVerificationAdmin()
2134    createVerificationNotification()
2247    ensureVerificationRecord()
3630    createOrUpdateExperience()
3969    createProfilePost()
4506    createProfileRouter()
4597    createVerificationRouter()
4643    createVerificationAdminRouter()
4668    module.exports
```

Routes importantes:

```txt
4510 /public
4511 /public/:profileUrl/cv
4512 /public/:profileUrl
4530 POST /
4535 GET /posts
4536 POST /posts
4559 POST /avatar
4565 POST /cover
4569 POST /cv
4574 POST /experiences
4585 GET /interests/available
4588 PUT /privacy
4590 PATCH /privacy
```

Explication:

- ce module gere le profil public et prive;
- il gere les fichiers de profil;
- il gere le CV;
- il gere les experiences;
- il gere la confidentialite;
- il gere la verification profil.
- `isVerificationAdmin()` compare l'utilisateur connecte avec les e-mails admin configures.
- `ensureVerificationAdmin()` bloque les routes admin backend si le compte n'est pas autorise.

Code admin important:

```js
const DEFAULT_ADMIN_EMAILS = ["masinandrorasolonnjatovo@gmail.com"];
```

Ce code donne le role admin a ce compte par e-mail. Le mot de passe n'est jamais ecrit ici: il reste gere par Clerk.

## 13. Backend accueil/feed/notifications

Fichier:

```txt
backend/src/homeModule.js
```

Lignes importantes:

```txt
136     ensureHomeSchema()
271     ensureHomeProfile()
342     createNotification()
486     createPost()
759     createComment()
1649    attachNotificationsRealtime()
1675    createHomePostsRouter()
1698    createHomeCommentsRouter()
1707    createHomeProfilesRouter()
1733    createHomeConnectionsRouter()
1754    createHomeNotificationsRouter()
1769    createHomeSearchRouter()
1777    createSavedPostsRouter()
```

Routes importantes:

```txt
/api/posts/feed
/api/posts
/api/posts/:id/like
/api/posts/:id/save
/api/posts/:id/comments
/api/notifications
/api/notifications/unread
/api/notifications/read
/api/notifications/read-all
/api/search
/api/saved
```

Explication:

- ce module gere le feed;
- il cree les notifications;
- il gere commentaires, likes, sauvegardes;
- il gere les connexions reseau;
- il envoie les notifications temps reel.

## 14. Backend messages

Fichier:

```txt
backend/src/messagesModule.js
```

Lignes importantes:

```txt
168     ensureMessagesSchema()
401     createMessageNotifications()
843     createConversation()
1017    emission message:new
1096    emission message:updated
1146    emission message:deleted
1234    emission message:read
1553    emitToUsers()
1561    emitConversationUpdate()
1566    createMessagesRouter()
1602    attachMessagesRealtime()
1616    io.on("connection")
1672    module.exports
```

Routes importantes:

```txt
1569 GET /
1570 GET /conversations
1571 POST /conversations
1574 POST /send
1575 POST /upload
1576 POST /read
1577 POST /pin
1578 POST /archive
1589 POST /block
1590 POST /report
1592 POST /groups/:conversationId/members
1595 PATCH /:id
1596 DELETE /:id
1597 GET /:conversationId
```

Explication:

- `createMessageNotifications()` cree les notifications quand un message arrive;
- `emitConversationUpdate()` envoie les evenements temps reel aux bons utilisateurs;
- `attachMessagesRealtime()` connecte Socket.IO au serveur HTTP;
- les routes `/send`, `/upload`, `/read` sont les plus importantes pour l'usage normal.

## 15. Backend dashboard

Fichier:

```txt
backend/src/dashboardModule.js
```

Lignes importantes:

```txt
570   createDashboardRouter()
618   createDashboardPostsRouter()
700   createDashboardNotificationsRouter()
715   createDashboardSubscriptionsRouter()
731   module.exports
```

Role:

- fournir les donnees du tableau de bord;
- fournir les statistiques;
- fournir les publications recentes;
- fournir les notifications du dashboard;
- fournir l'etat abonnement.

Frontend lie:

```txt
frontend/app/[locale]/dashboard/page.tsx
```

## 16. Backend settings

Fichier:

```txt
backend/src/settingsModule.js
```

Lignes importantes:

```txt
115   ensureSettingsSchema()
152   ensureProfileForSettings()
613   createSettingsRouter()
616   GET /account
617   PATCH /account
618   GET /privacy
619   PATCH /privacy
620   GET /security
621   PATCH /security
622   GET /notifications
623   PATCH /notifications
624   GET /messages
625   PATCH /messages
626   GET /subscription
627   GET /payments/history
```

Role:

- fournir et modifier les parametres utilisateur;
- centraliser privacy, securite, notifications, messages, abonnement;
- alimenter `SettingsCenter.tsx`.

## 17. Backend gouvernance, paiement, admin

Fichier:

```txt
backend/src/governanceModule.js
```

Lignes importantes:

```txt
408     ensureGovernanceSchema()
820     ensureAdmin()
930     createOrRefreshBillingRecords()
1220    createDeleteRequest()
1236    createRectificationRequest()
1254    createConsentLog()
1445    createPayment()
2167    createPartner()
2220    createModerationReport()
2296    createUserGovernanceRouter()
2306    createBusinessRouter()
2313    createBillingRouter()
2320    createPaymentsRouter()
2332    createSubscriptionsRouter()
2341    createAnalyticsRouter()
2348    createSecurityRouter()
2357    createPartnerRouter()
2363    createAdminPartnerRouter()
2371    createReportRouter()
2377    createAdminReportRouter()
```

Routes paiement importantes:

```txt
2322 POST /payments/verification-code
2323 POST /payments/verification-code/resend
2324 POST /payments/create
2325 POST /payments/verify
2326 GET /payments/history
2327 POST /payments/cmi/init
2328 POST /payments/cmi/callback
```

Role:

- paiement;
- abonnement;
- factures;
- analytics premium;
- logs securite;
- partenaires;
- signalements;
- droits utilisateur;
- administration.

### 17.1 Page administration et gouvernance

Fichier:

```txt
frontend/app/[locale]/admin/page.tsx
frontend/components/governance/AdminGovernanceWorkspace.tsx
```

Bloc important:

```txt
AdminOverviewWorkspace
```

Role du code:

- lit le compte connecte via Clerk;
- appelle `/api/auth/me`;
- recupere `isAdmin`;
- affiche l'espace administrateur si `isAdmin = true`;
- affiche un acces utilisateur normal si `isAdmin = false`;
- donne les liens vers verifications, signalements, partenaires, logs securite et facturation.

Deroulement exact:

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

### 17.2 APIs admin

Routes:

```txt
/api/admin
/api/admin/partners
/api/admin/reports
/api/security/logs
/api/billing
/api/payments
/api/subscriptions
```

Role:

- `/api/admin`: verifications KYC/KYB;
- `/api/admin/partners`: creation, modification et suppression de partenaires;
- `/api/admin/reports`: moderation des signalements;
- `/api/security/logs`: consultation des evenements sensibles;
- `/api/billing`, `/api/payments`, `/api/subscriptions`: supervision des abonnements et paiements.

## 18. Code qui protege les routes

Fichier:

```txt
frontend/proxy.ts
```

Lignes importantes:

```txt
12-31   isProtectedRoute
59-62   auth.protect()
```

Exemple:

```ts
const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
  '/:locale/messages(.*)',
  '/:locale/settings(.*)',
]);
```

Cela veut dire:

- `/fr/dashboard` est protege;
- `/fr/messages` est protege;
- `/fr/settings` est protege;
- un visiteur non connecte va vers `/fr/auth/sign-in`.

## 19. Code des appels API frontend

Le frontend utilise souvent deux formes.

### Appel direct backend

Exemple dashboard:

```ts
fetch(`${backendOrigin}/api/dashboard/overview`)
```

Utilise quand la page appelle directement le backend Express.

### Appel via route relative

Exemple messages:

```ts
apiFetch('/send', ...)
```

Dans ce cas `apiFetch()` ajoute deja le prefixe utile.

Regle:

- chercher `fetch(` pour comprendre les appels API directs;
- chercher `apiFetch(` pour comprendre les appels centralises;
- chercher `requestSettings(` pour les parametres.

## 20. Code des uploads

Frontend:

```txt
SettingsCenter.tsx
557 uploadProfileAsset()
ProfessionalMessagesWorkspace.tsx
907 uploadFiles()
```

Backend:

```txt
server.js
156-159 routes fichiers statiques
profileModule.js
4559 avatar
4565 cover
4569 cv
messagesModule.js
1575 upload messages
```

Explication:

- le frontend met le fichier dans `FormData`;
- le backend recoit le fichier avec Multer;
- le backend sauvegarde dans `backend/uploads`;
- le serveur expose le fichier via `/uploads/...`.

## 21. Code temps reel

Frontend messages:

```txt
ProfessionalMessagesWorkspace.tsx
761-768 connexion Socket.IO
770 message:new
787 message:updated
793 message:deleted
805 message:read
809 presence:update
820 message:typing
```

Frontend notifications:

```txt
notifications/page.tsx
302 notification:new
315 notification:updated
316 notification:deleted
```

Backend:

```txt
messagesModule.js
1602 attachMessagesRealtime()
1616 io.on("connection")
1661 io.to(user).emit()
homeModule.js
1649 attachNotificationsRealtime()
server.js
599-600 branchement Socket.IO
```

Explication:

Socket.IO permet de recevoir un message ou une notification sans recharger la page.

## 22. Code de la base de donnees

Initialisation:

```txt
database/init.sql
```

Preparation au demarrage:

```txt
profileModule.js       ensureProfileSchema()
homeModule.js          ensureHomeSchema()
messagesModule.js      ensureMessagesSchema()
settingsModule.js      ensureSettingsSchema()
governanceModule.js    ensureGovernanceSchema()
onboardingModule.js    ensureOnboardingSchema()
```

Role:

- creer/verifier les tables;
- eviter que le backend demarre sans structure minimale;
- separer les tables par domaine.

## 23. Ou modifier quoi

### Modifier le theme

Fichiers:

```txt
frontend/components/theme-config.ts
frontend/components/ThemeProvider.tsx
frontend/app/[locale]/globals.css
```

A regarder:

```txt
ThemeProvider.tsx lignes 18-57
globals.css lignes 71, 588-760
```

### Modifier les langues

Fichiers:

```txt
frontend/i18n.config.ts
frontend/proxy.ts
frontend/i18n/request.ts
frontend/components/localized-labels.ts
```

A regarder:

```txt
i18n.config.ts lignes 5-30
proxy.ts lignes 45-56
localized-labels.ts lignes 9-113
```

### Modifier les messages

Fichiers:

```txt
frontend/components/messages/ProfessionalMessagesWorkspace.tsx
backend/src/messagesModule.js
```

A regarder:

```txt
ProfessionalMessagesWorkspace.tsx lignes 662-996
messagesModule.js lignes 401, 1017, 1566-1602
```

### Modifier les notifications

Fichiers:

```txt
frontend/app/[locale]/notifications/page.tsx
backend/src/homeModule.js
backend/src/dashboardModule.js
```

A regarder:

```txt
notifications/page.tsx lignes 258-360
homeModule.js lignes 342, 1649, 1754
```

### Modifier le paiement

Fichiers:

```txt
frontend/components/premium/PremiumSaasWorkspace.tsx
backend/src/governanceModule.js
backend/server.js
```

A regarder:

```txt
governanceModule.js lignes 1445, 2320-2337
server.js lignes 291, 326-485
```

### Modifier le dashboard

Fichiers:

```txt
frontend/app/[locale]/dashboard/page.tsx
backend/src/dashboardModule.js
```

A regarder:

```txt
dashboard/page.tsx lignes 280-347 et 417-599
dashboardModule.js lignes 570-731
```

### Modifier les parametres

Fichiers:

```txt
frontend/components/settings/SettingsCenter.tsx
backend/src/settingsModule.js
```

A regarder:

```txt
SettingsCenter.tsx lignes 424-557 et 692-951
settingsModule.js lignes 613-627
```

## 24. Regles de modification pour ne pas casser

### Ne pas afficher de valeurs backend brutes

Mauvais:

```tsx
<span>{subscription.status}</span>
```

Bon:

```tsx
<span>{formatSubscriptionStatus(locale, subscription.status)}</span>
```

### Ne pas reactiver une langue incomplète

Mauvais:

```ts
export const supportedLocales = ['fr', 'en', 'ar', 'es'] as const;
```

Bon tant que tout n'est pas traduit:

```ts
export const supportedLocales = ['fr'] as const;
```

### Ne pas forcer les couleurs partout

Mauvais:

```css
* {
  color: white;
}
```

Bon:

```css
html[data-theme='dark'] .dashboardPage h1 {
  color: var(--text-primary);
}
```

### Tester apres chaque changement important

Commande frontend:

```bash
cd frontend
npm run build
```

Commande backend:

```bash
cd backend
npm test
```

## 25. Lecture rapide par fonctionnalite

```txt
Theme:
  theme-config.ts
  ThemeProvider.tsx
  globals.css

Langue:
  i18n.config.ts
  proxy.ts
  i18n/request.ts
  localized-labels.ts

Header:
  Header.tsx

Dashboard:
  app/[locale]/dashboard/page.tsx
  backend/src/dashboardModule.js

Profil:
  app/[locale]/dashboard/profile/page.tsx
  components/profile/PublicProfessionalProfile.tsx
  backend/src/profileModule.js

Messages:
  components/messages/ProfessionalMessagesWorkspace.tsx
  backend/src/messagesModule.js

Notifications:
  app/[locale]/notifications/page.tsx
  backend/src/homeModule.js
  backend/src/dashboardModule.js

Parametres:
  components/settings/SettingsCenter.tsx
  backend/src/settingsModule.js

Premium:
  components/premium/PremiumSaasWorkspace.tsx
  backend/src/governanceModule.js

Admin:
  app/[locale]/admin/*
  backend/src/governanceModule.js
  backend/src/profileModule.js
```

## 26. Exemple complet: un message envoye cree une notification

1. L'utilisateur ecrit un message.
2. Frontend:

```txt
ProfessionalMessagesWorkspace.tsx ligne 965 sendMessage()
```

3. Le frontend appelle:

```txt
/api/messages/send
```

4. Backend:

```txt
messagesModule.js ligne 1574 router.post("/send", sendMessage)
```

5. Le backend cree le message.
6. Le backend cree les notifications:

```txt
messagesModule.js ligne 401 createMessageNotifications()
```

7. Le backend emet l'evenement temps reel:

```txt
messagesModule.js ligne 1017 message:new
```

8. Frontend messages recoit:

```txt
ProfessionalMessagesWorkspace.tsx ligne 770 socket.on('message:new')
```

9. Frontend notifications recoit:

```txt
notifications/page.tsx ligne 302 socket.on('notification:new')
```

10. Le badge et la liste changent sans recharger.

## 27. Exemple complet: changer le theme

1. L'utilisateur clique sur le bouton theme.
2. Le composant appelle:

```txt
ThemeProvider.tsx ligne 57 setTheme()
```

3. Le code applique:

```txt
ThemeProvider.tsx lignes 51-54
```

4. Le HTML devient:

```html
<html data-theme="dark">
```

5. Le CSS reagit:

```txt
globals.css lignes 71, 588-760
```

6. Les couleurs changent sur tout le site.

## 28. Exemple complet: changer la langue

Actuellement, seule la langue francaise est active.

1. Le visiteur arrive sur `/en`.
2. Le proxy lit la premiere partie de l'URL.
3. Le proxy voit que `en` n'est pas supporte.
4. Le proxy redirige vers `/fr`.

Code:

```txt
frontend/proxy.ts lignes 45-56
```

Si tu veux ajouter une vraie langue plus tard:

1. traduire les pages;
2. corriger `Header.tsx`;
3. corriger `localized-labels.ts`;
4. ajouter les messages JSON;
5. ajouter la langue dans `supportedLocales`;
6. tester toutes les pages.

## 29. Exemple complet: paiement avec code

1. L'utilisateur choisit un plan dans Premium.
2. Le frontend affiche le resume.
3. L'utilisateur demande ou renvoie le code.
4. Frontend appelle:

```txt
/api/payments/verification-code/resend
```

5. Backend:

```txt
governanceModule.js ligne 2323
```

6. L'utilisateur saisit le code.
7. Frontend cree le paiement.
8. Backend:

```txt
governanceModule.js ligne 1445 createPayment()
```

9. L'abonnement est mis a jour.
10. Le dashboard affiche le plan via:

```txt
dashboard/page.tsx ligne 589 formatPlanLabel()
```

## 30. Conclusion

Ce document est la carte technique du code.

Pour comprendre une fonctionnalite:

1. trouver la page dans `frontend/app/[locale]`;
2. trouver le composant dans `frontend/components`;
3. chercher `fetch`, `apiFetch` ou `requestSettings`;
4. aller dans `backend/server.js`;
5. suivre la route vers `backend/src/...`;
6. verifier les schemas et les emissions Socket.IO si necessaire.

Le document `EXPLICATION.md` explique le site comme produit.  
Le document `EXPLICATION-CODE.md` explique le site comme code.
