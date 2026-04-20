# Communium

Plateforme de communication avec IA intégrée.

## Structure

- `frontend/` : Interface utilisateur Next.js
- `backend/` : API serveur Node.js avec Express
- `ai-service/` : Service IA en Python avec FastAPI
- `database/` : Scripts et configurations base de données

## Démarrage

1. Backend : `cd backend && docker-compose up`
2. Frontend : `cd frontend && npm run dev`
3. AI Service : `cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload`