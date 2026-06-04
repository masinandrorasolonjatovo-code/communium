# Architecture fonctionnelle par module

Ce document relie les modules du cahier des charges aux branches de code.
Objectif: reconnaitre rapidement depuis le code a quel module appartient une page, une route API ou une table.

## Arborescence visible

Les modules sont visibles dans l'explorateur VS Code ici:

```text
modules/
  M1-auth-profils/
    backend/
    frontend/
    database/
    docs/
    module.json
  M2-paiements-tks/
    backend/
    frontend/
    database/
    docs/
    module.json
  M3-networking-matching/
    backend/
    frontend/
    database/
    docs/
    module.json
  PUSH_GUIDE.md
```

Les fichiers actifs restent dans `backend/`, `frontend/`, `database/` et `ai-service/` pour ne pas casser l'application. Chaque `module.json` liste les fichiers a pousser pour le module.

## M1 - Authentification et profils utilisateurs

Sous-modules:
- M1-01 Authentification
- M1-02 Verification KYC / KYB
- M1-03 Profil personnel
- M1-04 Profil business
- M1-05 Adhesion et niveaux

Backend:
- `backend/src/profileModule.js`
- `backend/src/onboardingModule.js`
- `backend/src/settingsModule.js`
- `backend/src/governanceModule.js`
- Routes: `/api/profile`, `/api/profile/status`, `/api/verification`, `/api/admin`, `/api/settings`, `/api/onboarding`

Frontend:
- `frontend/app/[locale]/auth/*`
- `frontend/app/[locale]/profile/*`
- `frontend/app/[locale]/dashboard/profile/page.tsx`
- `frontend/app/[locale]/verification/page.tsx`
- `frontend/app/[locale]/settings/*`
- `frontend/components/profile/*`
- `frontend/components/verification/*`
- `frontend/components/settings/*`

Tables principales:
- `users`
- `profiles`
- `profile_settings`
- `memberships`
- `verifications`
- `verification_documents`
- `verification_notifications`

## M2 - Paiements et economie Tks

Sous-modules:
- M2-01 Stripe
- M2-02 CMI
- M2-03 Wallet Tks
- M2-04 Achat de Tks

Backend:
- `backend/src/routes/payment.ts`
- `backend/src/governanceModule.js`
- Routes: `/api/payment`, `/api/payments`, `/api/billing`, `/api/subscriptions`

Frontend:
- `frontend/app/[locale]/checkout/*`
- `frontend/app/[locale]/billing/*`
- `frontend/app/[locale]/premium/page.tsx`
- `frontend/components/premium/*`

Tables principales:
- `payment_methods`
- `billing_invoices`
- `subscriptions`

## M3 - Networking, connexions et matching

Sous-modules:
- M3-01 Systeme de connexions
- M3-02 Matching intelligent
- M3-03 Recherche avancee membres

Backend:
- `backend/src/homeModule.js`
- `backend/src/routes/matching.ts`
- `ai-service/matching_service.py`
- Routes: `/api/connections`, `/api/profiles/suggestions`, `/api/search`, `/api/matching`

Frontend:
- `frontend/app/[locale]/discover/page.tsx`
- `frontend/app/[locale]/search/page.tsx`
- `frontend/components/network/NetworkCenter.tsx`

Tables principales:
- `connections`
- `connection_match_events`
- `saved_member_searches`
- `app_notifications`

## Convention pour la suite

Quand un nouveau module est implemente:
- ajouter son entree dans `backend/src/moduleRegistry.js`;
- ajouter un bloc dans ce fichier;
- marquer les grands fichiers partages avec un commentaire `MODULE Mx-yy`;
- garder les pages frontend dans un dossier ou composant clairement nomme selon le domaine fonctionnel.
