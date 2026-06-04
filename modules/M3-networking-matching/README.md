# M3 - Networking, connexions et matching

Sous-modules:
- M3-01 Systeme de connexions
- M3-02 Moteur de matching intelligent
- M3-03 Recherche avancee de membres

Code principal:
- `backend/homeModule.js`
- `backend/matching.ts`
- `frontend/NetworkCenter.tsx`
- `frontend/SearchPage.tsx`
- `frontend/DiscoverPage.tsx`
- `../../frontend/modules/M3-networking-matching/NetworkCenter.tsx`
- `../../frontend/modules/M3-networking-matching/SearchPage.tsx`
- `../../frontend/modules/M3-networking-matching/DiscoverPage.tsx`
- wrappers compatibles:
  - `../../backend/src/homeModule.js`
  - `../../backend/src/routes/matching.ts`
  - `../../frontend/components/network/NetworkCenter.tsx`
  - `../../frontend/app/[locale]/discover/page.tsx`
  - `../../frontend/app/[locale]/search/page.tsx`
- `../../ai-service/matching_service.py`

Routes:
- `/api/connections`
- `/api/profiles/suggestions`
- `/api/search`
- `/api/matching`

Tables:
- `connections`
- `connection_match_events`
- `saved_member_searches`
- `app_notifications`
