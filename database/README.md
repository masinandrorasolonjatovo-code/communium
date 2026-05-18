# Database

Ce dossier contient les scripts PostgreSQL du projet The Communium.

## Fichiers

- `init.sql` : base minimale actuelle du projet.
- `m2_payments_tks.sql` : schema professionnel du Module 2, dedie aux paiements, au wallet Tks, aux transactions et aux factures.
- `seed_m2_payments_tks.sql` : donnees de demonstration du Module 2.

## Module 2 - Paiements et economie Tks

Le Module 2 est volontairement isole dans le schema PostgreSQL `module2`.
Cette separation permet de travailler proprement sans melanger les tables de paiement avec les tables existantes ou futures du Module 1.

Le schema couvre :

- Stripe et CMI via une table unifiee `payment_providers`.
- Moyens de paiement utilisateur via `user_payment_methods`.
- Paiements, redirections, SCA/3D Secure et statuts via `payment_intents`.
- Abonnements recurrents Stripe ou autres providers via `payment_subscriptions`.
- Webhooks Stripe/CMI auditables via `payment_webhook_events`.
- Remboursements et retours provider via `payment_refunds`.
- Wallet Tks utilisateur via `wallets`.
- Historique complet et auditable via `wallet_transactions`.
- Packages d'achat de Tks via `tks_packages`.
- Commandes d'achat avec TVA marocaine 20 % via `tks_purchase_orders`.
- Factures conformes au contexte marocain via `invoices` et `invoice_items`.

## Liens avec le Module 1

Le projet actuel ne contient pas encore les vraies tables SQL du Module 1 dans ce dossier.
Pour eviter de casser l'initialisation, le Module 2 garde des references stables :

- `payment_intents.membership_subscription_ref` pour relier un paiement a une adhesion M1-05.
- `payment_intents.business_profile_ref` pour relier un paiement a un profil business M1-04.
- `wallets.user_id` et `payment_intents.user_id` pointent deja vers `public.users(id)`.

Quand les tables SQL finales du Module 1 seront stabilisees, on pourra ajouter des foreign keys explicites vers les tables d'adhesion et de profil business.

## Commandes utiles

Depuis la racine du projet, avec une base PostgreSQL accessible :

```bash
psql "$DATABASE_URL" -f database/init.sql
psql "$DATABASE_URL" -f database/m2_payments_tks.sql
psql "$DATABASE_URL" -f database/seed_m2_payments_tks.sql
```

Le `docker-compose.yml` du backend monte deja le dossier `database/` dans PostgreSQL.
PostgreSQL est expose sur `localhost:5433` cote machine locale pour eviter les conflits avec un PostgreSQL deja installe sur `5432`.
Au premier demarrage du volume Docker, les fichiers seront executes dans l'ordre alphabetique :

1. `init.sql`
2. `m2_payments_tks.sql`
3. `seed_m2_payments_tks.sql`

Si le volume PostgreSQL existe deja, les scripts d'initialisation Docker ne sont pas relances automatiquement.
Dans ce cas, appliquez les fichiers avec `psql` ou recreez le volume de developpement.
