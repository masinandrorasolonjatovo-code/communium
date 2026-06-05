# 🧪 GUIDE DE TEST COMPLET - MODULES 4 & 5
## Communium Messaging & Events API Testing Guide

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Vérifier l'État des Serveurs

```bash
# ✅ Backend Health
curl -X GET http://localhost:5000/health

# Expected Response:
# {"status":"ok","service":"communium-backend","health":"http://localhost:5000/health"}

# ✅ Frontend Health  
curl -X GET http://localhost:3001/ -H "User-Agent: curl"

# Expected: HTML page or 200 status
```

---

## 📱 TEST DU MODULE 4: MESSAGING

### Authentification Préalable

Vous aurez besoin d'un **JWT token Clerk** valide. Pour les tests locaux:

```bash
# Option 1: Via Clerk Dashboard
# 1. Créer un utilisateur test
# 2. Copier le token JWT depuis Clerk

# Option 2: Utiliser le header x-user-id (bypass en dev)
# Les examples ci-dessous utilisent cette approche
```

### A. Créer une Conversation Privée

```bash
# Créer une conversation directe avec un autre utilisateur
curl -X POST http://localhost:5000/api/messages/conversations \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -H "x-user-email: user1@example.com" \
  -d '{
    "type": "direct",
    "participantIds": [2],
    "title": null
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "abc-123",
#     "type": "direct",
#     "participants": [...],
#     "createdAt": "2024-12-20T10:00:00Z"
#   }
# }
```

### B. Lister les Conversations

```bash
# Récupérer toutes les conversations de l'utilisateur
curl -X GET http://localhost:5000/api/messages/conversations \
  -H "x-user-id: 1" \
  -H "x-user-email: user1@example.com"

# Query Parameters Optionnels:
# ?limit=20&offset=0&filter=all|unread|favorites|archived|groups

# Example avec filtre:
curl -X GET "http://localhost:5000/api/messages/conversations?filter=unread&limit=10" \
  -H "x-user-id: 1"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "conv-1",
#       "type": "direct",
#       "title": "Jean Dupont",
#       "lastMessage": "Salut, comment ça va?",
#       "lastMessageAt": "2024-12-20T09:45:00Z",
#       "unreadCount": 3,
#       "members": [...]
#     }
#   ]
# }
```

### C. Récupérer Messages d'une Conversation

```bash
# Obtenir l'historique complet des messages
curl -X GET http://localhost:5000/api/messages/conv-123 \
  -H "x-user-id: 1" \
  -H "x-user-email: user1@example.com"

# Query Parameters:
# ?limit=50&offset=0 (pagination)

# Example:
curl -X GET "http://localhost:5000/api/messages/conv-123?limit=50&offset=0" \
  -H "x-user-id: 1"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "msg-1",
#       "conversationId": "conv-123",
#       "senderId": 1,
#       "body": "Hello!",
#       "type": "text",
#       "createdAt": "2024-12-20T10:00:00Z",
#       "reactions": {"😊": 1, "👍": 2},
#       "read": true,
#       "readAt": "2024-12-20T10:05:00Z"
#     }
#   ]
# }
```

### D. Envoyer un Message

```bash
# Message texte simple
curl -X POST http://localhost:5000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -H "x-user-email: user1@example.com" \
  -d '{
    "conversationId": "conv-123",
    "body": "Salut! Comment ça va?",
    "type": "text",
    "ephemeralMode": "off"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "msg-456",
#     "conversationId": "conv-123",
#     "senderId": 1,
#     "body": "Salut! Comment ça va?",
#     "type": "text",
#     "createdAt": "2024-12-20T10:15:00Z",
#     "ephemeralExpiry": null
#   }
# }

# Message avec mode éphémère
curl -X POST http://localhost:5000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "conversationId": "conv-123",
    "body": "Ce message disparaîtra dans 24h",
    "type": "text",
    "ephemeralMode": "24h"
  }'

# Message à lire une seule fois
curl -X POST http://localhost:5000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "conversationId": "conv-123",
    "body": "Message très confidentiel",
    "type": "text",
    "ephemeralMode": "read_once"
  }'
```

### E. Upload de Fichiers

```bash
# Préparer les fichiers à uploader
# Format: multipart/form-data

curl -X POST http://localhost:5000/api/messages/upload \
  -H "x-user-id: 1" \
  -F "files=@/path/to/image.jpg" \
  -F "files=@/path/to/document.pdf" \
  -F "conversationId=conv-123"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "attach-1",
#       "fileName": "image.jpg",
#       "mimeType": "image/jpeg",
#       "size": 245632,
#       "category": "image",
#       "url": "/uploads/messages/attach-1.jpg"
#     },
#     {
#       "id": "attach-2",
#       "fileName": "document.pdf",
#       "mimeType": "application/pdf",
#       "size": 512000,
#       "category": "document",
#       "url": "/uploads/messages/attach-2.pdf"
#     }
#   ]
# }

# Puis envoyer le message avec attachments:
curl -X POST http://localhost:5000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "conversationId": "conv-123",
    "body": "Voici les fichiers",
    "type": "file",
    "attachmentIds": ["attach-1", "attach-2"]
  }'
```

### F. Marquer Messages comme Lus

```bash
# Marquer une conversation comme lue
curl -X POST http://localhost:5000/api/messages/read \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "conversationId": "conv-123",
    "messageIds": ["msg-1", "msg-2", "msg-3"]
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "markedCount": 3,
#     "readAt": "2024-12-20T10:30:00Z"
#   }
# }
```

### G. Réactions Emoji

```bash
# Ajouter une réaction à un message
curl -X POST http://localhost:5000/api/messages/msg-123/react \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "emoji": "😊"
  }'

# Retirer une réaction
curl -X DELETE http://localhost:5000/api/messages/msg-123/react \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "emoji": "😊"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "reactions": {"😊": 2, "👍": 1}
#   }
# }
```

### H. Épingler/Archiver Conversations

```bash
# Épingler une conversation
curl -X POST http://localhost:5000/api/messages/pin \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "conversationId": "conv-123",
    "pinned": true
  }'

# Archiver une conversation
curl -X POST http://localhost:5000/api/messages/archive \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "conversationId": "conv-123",
    "archived": true
  }'

# Sourdine avec durée
curl -X POST http://localhost:5000/api/messages/mute \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "conversationId": "conv-123",
    "mutedUntil": "2024-12-21T10:00:00Z"
  }'
```

### I. Créer un Groupe

```bash
# Créer une conversation de groupe
curl -X POST http://localhost:5000/api/messages/conversations \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "type": "group",
    "title": "Team Marketing",
    "participantIds": [1, 2, 3, 4],
    "themeColor": "#1d4ed8",
    "background": "clean"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "grp-789",
#     "type": "group",
#     "title": "Team Marketing",
#     "owner": 1,
#     "members": [...]
#   }
# }
```

### J. Gestion des Membres du Groupe

```bash
# Ajouter un membre au groupe
curl -X POST http://localhost:5000/api/messages/groups/grp-789/members \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "userIds": [5, 6],
    "roles": "member"
  }'

# Retirer un membre
curl -X DELETE http://localhost:5000/api/messages/groups/grp-789/members/5 \
  -H "x-user-id: 1"

# Response:
# {
#   "success": true,
#   "data": {
#     "membersCount": 5
#   }
# }
```

### K. Recherche de Messages

```bash
# Rechercher des messages
curl -X GET "http://localhost:5000/api/messages/search?q=javascript&scope=text&limit=20" \
  -H "x-user-id: 1"

# Query Parameters:
# q: terme de recherche
# scope: text|files|photos|links|important
# limit: nombre de résultats (max 50)
# conversationId: (optionnel) limiter à une conversation

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "msg-100",
#       "conversationId": "conv-123",
#       "body": "J'aime JavaScript et TypeScript",
#       "relevance": 0.95,
#       "createdAt": "2024-12-20T09:00:00Z"
#     }
#   ]
# }
```

### L. Supprimer des Messages

```bash
# Supprimer un message
curl -X DELETE http://localhost:5000/api/messages/msg-456 \
  -H "x-user-id: 1"

# Response:
# {
#   "success": true,
#   "data": {
#     "deleted": true,
#     "messageId": "msg-456"
#   }
# }
```

---

## 🎉 TEST DU MODULE 5: EVENTS

### A. Lister les Événements

```bash
# Récupérer tous les événements disponibles
curl -X GET http://localhost:5000/api/events \
  -H "x-user-id: 1"

# Query Parameters:
# limit: nombre de résultats (default 20)
# offset: pagination (default 0)
# type: training|job|networking
# sortBy: date|popularity|proximity

# Example avec filtres:
curl -X GET "http://localhost:5000/api/events?limit=10&offset=0&type=training" \
  -H "x-user-id: 1"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1,
#       "title": "Workshop: React Advanced",
#       "subtitle": "Deep dive into React hooks",
#       "type": "training",
#       "startsAt": "2024-12-25T14:00:00Z",
#       "endsAt": "2024-12-25T17:00:00Z",
#       "location": "Paris, France",
#       "capacity": 50,
#       "attendeesCount": 23,
#       "joined": false,
#       "meta": "Paris • 3h • Training"
#     },
#     {
#       "id": 2,
#       "title": "Networking Meetup",
#       "type": "networking",
#       "startsAt": "2024-12-22T18:00:00Z",
#       "location": "Lyon, France",
#       "attendeesCount": 45,
#       "joined": true,
#       "meta": "Lyon • Networking"
#     }
#   ]
# }
```

### B. S'Inscrire à un Événement

```bash
# Inscription simple
curl -X POST http://localhost:5000/api/events/1/join \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{}'

# Response:
# {
#   "success": true,
#   "joined": true,
#   "data": {
#     "eventId": 1,
#     "userId": 1,
#     "registeredAt": "2024-12-20T10:35:00Z",
#     "status": "confirmed"
#   }
# }
```

### C. Se Désinscrire d'un Événement

```bash
# Quitter un événement
curl -X DELETE http://localhost:5000/api/events/1/join \
  -H "x-user-id: 1"

# Response:
# {
#   "success": true,
#   "joined": false,
#   "data": {
#     "eventId": 1,
#     "userId": 1,
#     "unregisteredAt": "2024-12-20T10:40:00Z"
#   }
# }
```

### D. Vérifier le Statut d'Inscription

```bash
# Lister les événements où l'utilisateur est inscrit
curl -X GET "http://localhost:5000/api/events?joined=true" \
  -H "x-user-id: 1"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 2,
#       "title": "Networking Meetup",
#       "joined": true,
#       "status": "confirmed"
#     },
#     {
#       "id": 5,
#       "title": "Job Fair Paris 2024",
#       "joined": true,
#       "status": "confirmed"
#     }
#   ]
# }
```

---

## 🔌 SOCKET.IO - REALTIME EVENTS

### A. Connexion Socket.io

```javascript
// Client-side (Frontend)
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  query: {
    userId: user.id,
    token: await getToken()
  }
});

// Connection
socket.on('connect', () => {
  console.log('Connecté au serveur realtime');
});

socket.on('disconnect', () => {
  console.log('Déconnecté du serveur');
});
```

### B. Rejoindre une Conversation

```javascript
// Rejoindre une conversation pour recevoir updates realtime
socket.emit('conversation:join', 'conv-123');

// Quitter une conversation
socket.emit('conversation:leave', 'conv-123');

// Recevoir les nouveaux messages
socket.on('message:new', (message) => {
  console.log('Nouveau message:', message);
  // Update UI
});
```

### C. Typing Indicators

```javascript
// Indiquer qu'on tape
socket.emit('typing:start', { conversationId: 'conv-123' });

// Timer de 3 secondes avant d'arrêter
setTimeout(() => {
  socket.emit('typing:stop', { conversationId: 'conv-123' });
}, 3000);

// Recevoir les indicateurs de typage
socket.on('typing:indicator', (data) => {
  console.log(`${data.userName} est en train d'écrire...`);
});
```

### D. Read Receipts

```javascript
// Envoyer une notification de lecture
socket.emit('read:receipt', {
  conversationId: 'conv-123',
  messageId: 'msg-456'
});

// Recevoir les notifications de lecture
socket.on('read:updated', (data) => {
  console.log(`Message ${data.messageId} lu par ${data.userId}`);
});
```

---

## 🧪 SCÉNARIOS DE TEST COMPLETS

### Scénario 1: Conversation Privée Complète

```bash
#!/bin/bash
# Test complet d'une conversation privée

USER1=1
USER2=2
USER1_EMAIL="user1@example.com"
USER2_EMAIL="user2@example.com"

# 1. Créer une conversation
CONV=$(curl -s -X POST http://localhost:5000/api/messages/conversations \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER1" \
  -H "x-user-email: $USER1_EMAIL" \
  -d '{"type":"direct","participantIds":['"$USER2"']}' | jq -r '.data.id')

echo "✓ Conversation créée: $CONV"

# 2. User1 envoie un message
MSG=$(curl -s -X POST http://localhost:5000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER1" \
  -d '{"conversationId":"'"$CONV"'","body":"Salut!","type":"text"}' | jq -r '.data.id')

echo "✓ Message envoyé: $MSG"

# 3. User2 récupère les messages
curl -s -X GET http://localhost:5000/api/messages/$CONV \
  -H "x-user-id: $USER2" | jq '.data[] | {id, body, senderId}'

echo "✓ Messages reçus par User2"

# 4. User2 marque comme lu
curl -s -X POST http://localhost:5000/api/messages/read \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER2" \
  -d '{"conversationId":"'"$CONV"'","messageIds":["'"$MSG"'"]}' | jq '.data'

echo "✓ Message marqué comme lu"

# 5. User2 répond
RESPONSE=$(curl -s -X POST http://localhost:5000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER2" \
  -d '{"conversationId":"'"$CONV"'","body":"Salut! Ça va?","type":"text"}' | jq -r '.data.id')

echo "✓ Réponse envoyée: $RESPONSE"

# 6. Ajouter une réaction
curl -s -X POST http://localhost:5000/api/messages/$RESPONSE/react \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER1" \
  -d '{"emoji":"😊"}' | jq '.data.reactions'

echo "✓ Réaction ajoutée"

echo ""
echo "✅ Test de conversation privée complété avec succès!"
```

### Scénario 2: Événement - Inscription et Participation

```bash
#!/bin/bash
# Test complet d'inscription à un événement

USER1=1
USER2=2

# 1. Récupérer les événements disponibles
EVENTS=$(curl -s -X GET "http://localhost:5000/api/events?limit=5" \
  -H "x-user-id: $USER1" | jq '.data')

echo "✓ Événements récupérés:"
echo $EVENTS | jq '.[] | {id, title, attendeesCount}'

# 2. User1 s'inscrit à un événement
EVENT_ID=$(echo $EVENTS | jq -r '.[0].id')

curl -s -X POST http://localhost:5000/api/events/$EVENT_ID/join \
  -H "x-user-id: $USER1" | jq '.data'

echo "✓ User1 inscrit à l'événement $EVENT_ID"

# 3. User2 s'inscrit aussi
curl -s -X POST http://localhost:5000/api/events/$EVENT_ID/join \
  -H "x-user-id: $USER2" | jq '.data'

echo "✓ User2 inscrit à l'événement $EVENT_ID"

# 4. Récupérer le détail de l'événement
curl -s -X GET "http://localhost:5000/api/events?limit=1" \
  -H "x-user-id: $USER1" | jq '.data[0] | {id, title, attendeesCount, joined}'

echo "✓ Statut d'inscription confirmé"

# 5. User1 se désinscrire
curl -s -X DELETE http://localhost:5000/api/events/$EVENT_ID/join \
  -H "x-user-id: $USER1" | jq '.data'

echo "✓ User1 désinscrit"

echo ""
echo "✅ Test d'événement complété avec succès!"
```

---

## 🐛 DEBUGGING & TROUBLESHOOTING

### Problème: 401 Unauthorized

```bash
# Solution: Ajouter les headers d'authentification
curl -X GET http://localhost:5000/api/messages/conversations \
  -H "x-user-id: 1" \
  -H "x-user-email: user@example.com"

# Ou avec Bearer token (Clerk):
curl -X GET http://localhost:5000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN"
```

### Problème: 404 Not Found

```bash
# Vérifier que l'ID existe
curl -X GET http://localhost:5000/api/messages/conv-xyz \
  -H "x-user-id: 1"

# Récupérer les IDs valides
curl -X GET http://localhost:5000/api/messages/conversations \
  -H "x-user-id: 1" | jq '.data[].id'
```

### Problème: 500 Server Error

```bash
# Vérifier les logs du backend
# Terminal du backend affichera l'erreur complète

# Vérifier la connexion DB
curl -X GET http://localhost:5000/health

# Redémarrer le serveur si besoin
# npm run dev dans le dossier backend
```

---

## 📊 PERFORMANCE TESTING

### Load Testing avec Apache Bench

```bash
# Tester 100 requêtes avec 10 concurrentes
ab -n 100 -c 10 http://localhost:5000/api/events

# Résultats attendus:
# Requests per second: ~500-1000
# Time per request: 10-20ms
```

### Stress Testing avec curl

```bash
# Créer 50 messages rapidement
for i in {1..50}; do
  curl -X POST http://localhost:5000/api/messages/send \
    -H "Content-Type: application/json" \
    -H "x-user-id: 1" \
    -d "{\"conversationId\":\"conv-123\",\"body\":\"Message $i\"}" &
done
wait
```

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Backend répond sur port 5000
- [ ] Frontend accessible sur port 3001
- [ ] PostgreSQL connectée et initialisée
- [ ] Clerk JWT tokens générés et valides
- [ ] Créer une conversation privée réussit
- [ ] Envoyer un message réussit
- [ ] Upload de fichiers réussit
- [ ] Recherche de messages fonctionne
- [ ] Créer un groupe réussit
- [ ] Lister les événements réussit
- [ ] S'inscrire à un événement réussit
- [ ] Se désinscrire d'un événement réussit
- [ ] Socket.io connect/disconnect fonctionne
- [ ] Typing indicators fonctionnent
- [ ] Read receipts enregistrés

---

**Test complet Module 4 & 5: ~15 minutes**  
**Performance baseline établie ✅**
