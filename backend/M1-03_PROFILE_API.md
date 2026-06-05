# M1-03 Profil Personnel

Derniere mise a jour: 2026-05-30

Module Express monte sur `server.js` via `/api/profile`.

## Lancement rapide

En local ou Docker:

```bash
npm run dev
```

Frontend du module:

```text
http://localhost:3000/fr/dashboard/profile
```

Les routes privees du profil exigent une identite utilisateur. Le frontend envoie l'identite Clerk dans les en-tetes:

```text
x-user-id: <clerk-user-id>
x-user-email: <email-utilisateur>
x-user-name: <nom-utilisateur>
```

Sans identite utilisateur, les routes privees renvoient `401` en JSON. Les routes publiques (`/public/:profileUrl`, recherche, CV public autorise) restent accessibles selon les parametres de confidentialite.

## Routes principales

- `GET /api/profile/my-profile`
- `PUT /api/profile/my-profile`
- `GET /api/profile/my-profile/export`
- `DELETE /api/profile/my-profile`
- `POST /api/profile/profile-picture`
- `DELETE /api/profile/profile-picture`
- `PUT /api/profile/profile-picture/crop`
- `POST /api/profile/cv`
- `GET /api/profile/cv/download`
- `DELETE /api/profile/cv`
- `POST /api/profile/identity-document`
- `DELETE /api/profile/identity-document`
- `POST /api/profile/professional-experience`
- `PUT /api/profile/professional-experience/:experienceId`
- `DELETE /api/profile/professional-experience/:experienceId`
- `GET /api/profile/interests/available?search=tech`
- `POST /api/profile/interests`
- `DELETE /api/profile/interests/:interestId`
- `PUT /api/profile/privacy-settings`
- `GET /api/profile/public/:profileUrl`
- `GET /api/profile/public/:profileUrl/cv`
- `GET /api/profile/check-url/:url`
- `GET /api/profile/search?q=casablanca`

## Couverture M1-03

- Profil public/prive avec URL publique unique.
- Photo de profil uploadee, recadree/redimensionnee cote frontend canvas, puis stockee.
- Infos personnelles: nom, naissance, CIN/Passeport, telephone, email, pays, ville, adresse.
- Profession et poste actuel.
- Parcours professionnel multi-entrees avec ajout, modification et suppression.
- Centres d'interet sous forme de tags.
- CV PDF uploadable et telechargeable selon confidentialite.
- Parametres de confidentialite par champ.
- Les coordonnees publiques sont masquees si les demandes reseau sont fermees.
- Recherche de profils publics.
