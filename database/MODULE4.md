# Module 4 - Messagerie & Communication Temps Réel

## Vue d'ensemble

Le Module 4 de Communium fournit une plateforme complète de messagerie, de conversations de groupe, de threads et d'appels audio/vidéo. L'architecture est basée sur :

- **Backend** : Express.js + PostgreSQL + Socket.IO
- **Frontend** : Next.js + React + Tailwind CSS + TypeScript
- **Base de données** : Schéma PostgreSQL isolé `module4`
- **Communication temps réel** : WebSockets via Socket.IO

---

## Architecture Base de Données

### Schéma : `module4`

#### 1. **Conversations** (`module4.conversations`)
Représente les conversations 1-à-1 et groupes.

```sql
CREATE TABLE module4.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type module4.conversation_type NOT NULL DEFAULT 'direct',  -- 'direct' | 'group'
  name VARCHAR(150),                                          -- Obligatoire si type='group'
  avatar_url TEXT,                                            -- Avatar groupe
  pinned_message_id UUID,                                     -- Dernier message épinglé
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Cas d'usage** :
- Conversations 1-à-1 : `type = 'direct'`, `name = NULL`
- Groupes : `type = 'group'`, `name` required, `avatar_url` optional

---

#### 2. **Participants** (`module4.participants`)
Rôles et adhésion aux conversations.

```sql
CREATE TABLE module4.participants (
  conversation_id UUID NOT NULL REFERENCES module4.conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role module4.participant_role NOT NULL DEFAULT 'member',   -- 'member' | 'moderator' | 'admin'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),            -- Accusé de lecture
  PRIMARY KEY (conversation_id, user_id)
);
```

**Rôles** :
- `member` : Participant standard
- `moderator` : Peut épingler/supprimer messages
- `admin` : Créateur/gestionnaire du groupe

---

#### 3. **Messages** (`module4.messages`)
Contenu textuel, fichiers, images, appels manqués, etc.

```sql
CREATE TABLE module4.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES module4.conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  content_type module4.message_type NOT NULL DEFAULT 'text',  -- 'text' | 'image' | 'file' | 'audio_call' | 'video_call'
  text_content TEXT,
  attachment_meta JSONB,                                       -- { "name": "...", "url": "...", "size": ... }
  parent_id UUID REFERENCES module4.messages(id) ON DELETE SET NULL,  -- Pour threads/réponses
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Types de contenu** :
- `text` : Message texte simple
- `image` : Image inline
- `file` : Fichier (PDF, doc, etc.)
- `audio_call` : Historique appel audio
- `video_call` : Historique appel vidéo

---

#### 4. **Call Logs** (`module4.call_logs`)
Historique des appels audio/vidéo.

```sql
CREATE TABLE module4.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES module4.conversations(id) ON DELETE CASCADE,
  creator_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  type module4.message_type NOT NULL CHECK (type IN ('audio_call', 'video_call')),
  status module4.call_status NOT NULL DEFAULT 'ongoing',     -- 'missed' | 'completed' | 'rejected' | 'ongoing'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  room_name VARCHAR(255) NOT NULL                             -- Identifiant WebRTC
);
```

---

### Indexation

| Index | Utilité |
|-------|---------|
| `idx_conversations_updated_at` | Tri des conversations par dernier message |
| `idx_participants_user_id` | Requêtes "toutes mes conversations" |
| `idx_messages_room_date` | Chargement des messages par conversation |
| `idx_messages_text_search` | Recherche full-text français |

---

### Triggers

1. **`trg_conversations_updated_at`**
   - Met à jour `updated_at` lors de modifications conversation

2. **`trg_messages_after_insert`** & **`trg_messages_after_update`**
   - Refresh `conversations.updated_at` quand un message arrive
   - Permet le tri chronologique des conversations

---

## API Backend

### Base URL
```
http://localhost:5000/api/module4
```

### Authentification
Pour le MVP, l'authentification se fait par `userId` dans l'URL ou le body.
**TODO** : Intégrer JWT avec Clerk/Entra ID.

---

### Endpoints

#### Conversations

**GET** `/users/:userId/conversations`
```json
// Response
[
  {
    "id": "uuid-1",
    "type": "direct",
    "name": null,
    "avatar_url": null,
    "last_message_text": "Bonjour...",
    "last_message_sender_username": "youssef",
    "last_message_created_at": "2026-05-20T14:32:00Z",
    "unread_count": 3
  }
]
```

**GET** `/conversations/:conversationId`
```json
// Response
{
  "id": "uuid-1",
  "type": "direct",
  "name": null,
  "avatar_url": null,
  "pinned_message_id": null,
  "created_at": "2026-05-01T10:00:00Z",
  "updated_at": "2026-05-20T14:32:00Z",
  "participants": [
    { "user_id": 1, "role": "admin", "username": "youssef", "last_read_at": "..." },
    { "user_id": 2, "role": "member", "username": "amine", "last_read_at": "..." }
  ],
  "pinned_message": null
}
```

**POST** `/conversations`
```json
// Request
{
  "type": "group",
  "name": "Tech Morocco",
  "participantIds": [1, 2, 3],
  "createdByUserId": 1,
  "avatarUrl": "https://..."
}

// Response
{
  "id": "uuid-1",
  "type": "group",
  "name": "Tech Morocco",
  "avatar_url": "https://...",
  "participants": [
    { "conversation_id": "uuid-1", "user_id": 1, "role": "admin" },
    { "conversation_id": "uuid-1", "user_id": 2, "role": "member" },
    { "conversation_id": "uuid-1", "user_id": 3, "role": "member" }
  ]
}
```

**PATCH** `/conversations/:conversationId`
```json
// Request
{
  "name": "Tech Morocco - Updated",
  "avatarUrl": "https://...",
  "pinnedMessageId": "uuid-msg-1"
}

// Response - Updated conversation
```

---

#### Messages

**GET** `/conversations/:conversationId/messages`
```json
// Response
[
  {
    "id": "uuid-1",
    "conversation_id": "uuid-conv-1",
    "sender_id": 1,
    "sender_username": "youssef",
    "content_type": "text",
    "text_content": "Bonjour!",
    "attachment_meta": null,
    "parent_id": null,
    "created_at": "2026-05-20T14:15:00Z"
  }
]
```

**POST** `/conversations/:conversationId/messages`
```json
// Request
{
  "senderId": 1,
  "contentType": "text",
  "textContent": "Bonjour, ça va?"
}

// Response - Message créé
```

---

#### Appels

**POST** `/conversations/:conversationId/calls`
```json
// Request
{
  "creatorId": 1,
  "type": "video_call",
  "roomName": "room-uuid-123",
  "status": "ongoing"
}

// Response
{
  "id": "uuid-1",
  "conversation_id": "uuid-conv-1",
  "creator_id": 1,
  "type": "video_call",
  "status": "ongoing",
  "started_at": "2026-05-20T14:35:00Z",
  "ended_at": null
}
```

**PATCH** `/calls/:callId/status`
```json
// Request
{
  "status": "completed",
  "endedAt": "2026-05-20T14:39:00Z"
}

// Response - Call log updated
```

---

## WebSocket Events (Socket.IO)

### Client → Server

```javascript
// Rejoindre la room utilisateur
socket.emit("join:user", { userId: 1 });

// Quitter la room utilisateur
socket.emit("leave:user", { userId: 1 });

// Rejoindre une conversation
socket.emit("join:conversation", { conversationId: "uuid-1" });

// Quitter une conversation
socket.emit("leave:conversation", { conversationId: "uuid-1" });
```

### Server → Client

```javascript
// Connection établie
socket.on("connected", (data) => {
  console.log("Connected to Communium");
});

// Nouvelle conversation créée
socket.on("module4:conversation:created", (payload) => {
  // { id, type, name, participants, ... }
});

// Conversation mise à jour
socket.on("module4:conversation:updated", (payload) => {
  // { id, type, name, ... }
});

// Participant ajouté
socket.on("module4:participant:added", (payload) => {
  // { conversation_id, user_id, role, ... }
});

// Nouveau message
socket.on("module4:message:created", (payload) => {
  // { id, conversation_id, sender_id, text_content, ... }
});

// Appel créé
socket.on("module4:call:created", (payload) => {
  // { id, conversation_id, type, status, ... }
});

// Statut appel mis à jour
socket.on("module4:call:updated", (payload) => {
  // { id, status, ended_at, ... }
});
```

---

## Frontend

### Structure des fichiers

```
frontend/
├── app/
│   └── module4/
│       ├── page.tsx          # Liste des conversations + chat
│       └── call.tsx          # Interface appel vidéo/audio
├── lib/
│   └── module4-api.ts        # Client API REST + helpers
```

### Pages

#### 1. `/module4` (page.tsx)

**Écran 1 : Liste des conversations**
- Barre de recherche
- Filtres (Toutes, Groupes, Appels)
- Liste des conversations avec :
  - Avatar
  - Nom
  - Dernier message
  - Timestamp
  - Nombre de messages non lus

**Écran 2 : Conversation active**
- Header avec actions (appel vocal, vidéo, info)
- Messages avec séparateur de date
- Accusé de lecture (✔️✔️)
- Pièces jointes
- Zone de saisie + emoji, fichiers, micro

#### 2. `/module4/call` (call.tsx)

**Écran 3 : Appel vidéo/audio**
- Flux vidéo du correspondant (full screen)
- Flux vidéo personnel (Picture-in-Picture)
- Durée de l'appel
- Boutons : Muté, Caméra On/Off, Partage d'écran
- Bouton Quitter (rouge)

---

### Client API (`module4-api.ts`)

```typescript
// Conversations
await module4API.getUserConversations(userId);
await module4API.getConversation(conversationId);
await module4API.createConversation({ type, name, participantIds, ... });
await module4API.updateConversation(conversationId, { name, avatarUrl, ... });

// Participants
await module4API.getParticipants(conversationId);
await module4API.addParticipant(conversationId, userId, role);

// Messages
await module4API.getMessages(conversationId);
await module4API.sendMessage(conversationId, { senderId, textContent, ... });

// Appels
await module4API.createCall(conversationId, { creatorId, type, roomName, ... });
await module4API.updateCallStatus(callId, { status, endedAt, ... });
```

---

## Roadmap

### Phase 1 (MVP - Actuellement)
- ✅ Conversations 1-à-1 et groupes
- ✅ Messages texte
- ✅ Pièces jointes (structure JSON)
- ✅ Appels audio/vidéo (structure, pas WebRTC)
- ✅ Socket.IO temps réel
- ✅ Frontend UI

### Phase 2 (À faire)
- [ ] Intégration WebRTC (peer-to-peer ou SFU)
- [ ] Upload fichiers (S3/Azure Blob)
- [ ] Recherche full-text optimisée
- [ ] Threads/réponses (messages imbriqués)
- [ ] Typage/indicateurs de frappe
- [ ] Notifications push
- [ ] Notifications in-app
- [ ] Archivage conversations
- [ ] End-to-End Encryption

### Phase 3 (Long terme)
- [ ] Intégration notifications multi-canal (email, SMS)
- [ ] Modération et filtres
- [ ] Analytics (usage, latency)
- [ ] Bot intégration
- [ ] Webhooks sortants

---

## Variables d'environnement

### Backend (`.env`)
```env
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5433/communium
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Commandes utiles

### Backend
```bash
cd backend
npm start              # Démarrer le serveur
npm test              # Vérifier la syntaxe
```

### Frontend
```bash
cd frontend
npm run dev           # Démarrer Next.js (http://localhost:3000)
npm run typecheck     # Vérifier TypeScript
npm run build         # Production build
```

### Database
```bash
# Initialiser/migrer le schéma Module 4
psql -U communium -d communium -a -f database/m4_messaging.sql

# Charger seed data (si disponible)
psql -U communium -d communium -a -f database/seed_m4.sql
```

---

## Notes

1. **Scalabilité** : Utiliser Redis pour adapter Socket.IO en cluster
2. **WebRTC** : Implémenter Janus, SFU Mediasoup ou tiers (Twilio, Vonage)
3. **Stockage fichiers** : Intégrer Azure Blob Storage ou S3
4. **Sécurité** : Ajouter E2E crypto avec libsodium (future)

---

Generated: May 20, 2026
