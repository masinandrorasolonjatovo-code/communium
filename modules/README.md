# Modules Communium

Ce dossier separe visiblement les modules fonctionnels pour l'organisation, le suivi et les pushs par module.

Important: les fichiers applicatifs principaux restent dans `backend/`, `frontend/`, `database/` et `ai-service/` pour ne pas casser les imports existants. Chaque dossier module contient:
- un `module.json` avec les fichiers a pousser pour ce module;
- un `README.md` avec le perimetre;
- des sous-dossiers `backend`, `frontend`, `database`, `docs` pour classer les notes et futurs fichiers dedies.

Modules disponibles:
- `M1-auth-profils`
- `M2-paiements-tks`
- `M3-networking-matching`

Pour pousser un module, consulte son `module.json` et ajoute les chemins indiques au commit.
