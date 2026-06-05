# Module 5 - Evenements

Ce dossier contient le schema PostgreSQL du Module 5 de The Communium.

Fichier principal :

```text
database/m5_events.sql
```

## Perimetre couvert

- **M5-01 Creation et gestion d'evenements**
  - Evenements physiques, virtuels ou hybrides
  - Types : conference, networking, workshop, roundtable
  - Publication publique, membres uniquement ou sur invitation
  - Image de banniere et assets
  - Prix en MAD ou TKS

- **M5-02 Inscriptions et billets**
  - Billets uniques avec `ticket_code` et `qr_payload`
  - Paiement gratuit, MAD ou TKS
  - Prevention du surbooking par trigger
  - Liste d'attente automatique
  - Invitations privees

- **M5-03 Check-in et interactions**
  - Check-in avec timestamp et validateur
  - Fil de discussion evenementiel
  - Networking entre participants
  - Sondages live
  - Replays video post-evenement
  - Notifications evenementielles

## Schema

Toutes les tables sont isolees dans le schema PostgreSQL :

```sql
module5
```

## Tables principales

| Table | Role |
| --- | --- |
| `module5.events` | Table centrale des evenements |
| `module5.event_assets` | Images et documents lies a un evenement |
| `module5.event_invitations` | Invitations pour evenements prives |
| `module5.event_tickets` | Inscriptions, billets et QR codes |
| `module5.event_waitlist` | Liste d'attente |
| `module5.event_feed_messages` | Fil de discussion de l'evenement |
| `module5.event_networking_requests` | Demandes de networking entre participants |
| `module5.event_polls` | Sondages live |
| `module5.event_poll_options` | Options des sondages |
| `module5.event_poll_votes` | Votes |
| `module5.event_replays` | Replays video |
| `module5.event_notifications` | Notifications liees aux evenements |

## Vues utiles

| Vue | Role |
| --- | --- |
| `module5.event_capacity_summary` | Capacite, billets confirmes, check-ins et waitlist |
| `module5.public_events` | Liste publique des evenements publies |

## Regles importantes

- Un evenement publie doit avoir une logistique coherente :
  - physique : adresse obligatoire
  - virtuel : lien virtuel obligatoire
  - hybride : adresse et lien virtuel obligatoires
- Un billet actif est unique par utilisateur ou email pour un evenement.
- Le trigger `module5.prevent_event_overbooking()` empeche de depasser la capacite.
- Le trigger `module5.ensure_ticket_identity()` genere automatiquement `ticket_code` et `qr_payload` si besoin.

## Installation locale

Depuis la racine du projet :

```bash
psql -U communium -d communium -f database/m5_events.sql
```

Ou via Docker Compose si la base est lancee avec les scripts du dossier `database`.
