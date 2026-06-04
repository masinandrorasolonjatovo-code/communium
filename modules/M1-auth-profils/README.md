# M1 - Authentification et profils utilisateurs

Sous-modules:
- M1-01 Inscription et connexion
- M1-02 Verification KYC / KYB
- M1-03 Profil personnel
- M1-04 Profil business
- M1-05 Systeme d'adhesion et niveaux

Code principal:
- `../../backend/src/profileModule.js`
- `../../backend/src/onboardingModule.js`
- `../../backend/src/settingsModule.js`
- `../../backend/src/governanceModule.js`
- `../../frontend/app/[locale]/auth`
- `../../frontend/app/[locale]/profile`
- `../../frontend/components/profile`
- `../../frontend/components/verification`
- `../../frontend/components/settings`

Routes:
- `/api/profile`
- `/api/profile/status`
- `/api/verification`
- `/api/settings`
- `/api/onboarding`

Tables:
- `users`
- `profiles`
- `profile_settings`
- `memberships`
- `verifications`
- `verification_documents`
- `verification_notifications`
