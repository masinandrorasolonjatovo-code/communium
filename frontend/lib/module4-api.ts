const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface CreateConversationPayload {
  type: "direct" | "group";
  name?: string;
  participantIds: number[];
  createdByUserId: number;
  avatarUrl?: string;
}

interface SendMessagePayload {
  senderId: number;
  contentType: "text" | "image" | "file" | "audio_call" | "video_call";
  textContent?: string;
  attachmentMeta?: any;
  parentId?: string;
}

interface CreateCallPayload {
  creatorId: number;
  type: "audio_call" | "video_call";
  roomName: string;
  status?: "missed" | "completed" | "rejected" | "ongoing";
}

interface UpdateCallStatusPayload {
  status: "missed" | "completed" | "rejected" | "ongoing";
  endedAt?: string;
}

export const module4API = {
  // Conversations
  getUserConversations: async (userId: number) => {
    const response = await fetch(`${BASE_URL}/api/module4/users/${userId}/conversations`);
    if (!response.ok) throw new Error("Erreur lors du chargement des conversations");
    return response.json();
  },

  getConversation: async (conversationId: string) => {
    const response = await fetch(`${BASE_URL}/api/module4/conversations/${conversationId}`);
    if (!response.ok) throw new Error("Conversation non trouvée");
    return response.json();
  },

  createConversation: async (payload: CreateConversationPayload) => {
    const response = await fetch(`${BASE_URL}/api/module4/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Erreur lors de la création de la conversation");
    return response.json();
  },

  updateConversation: async (
    conversationId: string,
    updates: { name?: string; avatarUrl?: string; pinnedMessageId?: string }
  ) => {
    const response = await fetch(`${BASE_URL}/api/module4/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Erreur lors de la mise à jour de la conversation");
    return response.json();
  },

  // Participants
  getParticipants: async (conversationId: string) => {
    const response = await fetch(
      `${BASE_URL}/api/module4/conversations/${conversationId}/participants`
    );
    if (!response.ok) throw new Error("Erreur lors du chargement des participants");
    return response.json();
  },

  addParticipant: async (conversationId: string, userId: number, role = "member") => {
    const response = await fetch(
      `${BASE_URL}/api/module4/conversations/${conversationId}/participants`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      }
    );
    if (!response.ok) throw new Error("Erreur lors de l'ajout du participant");
    return response.json();
  },

  // Messages
  getMessages: async (conversationId: string) => {
    const response = await fetch(
      `${BASE_URL}/api/module4/conversations/${conversationId}/messages`
    );
    if (!response.ok) throw new Error("Erreur lors du chargement des messages");
    return response.json();
  },

  sendMessage: async (conversationId: string, payload: SendMessagePayload) => {
    const response = await fetch(
      `${BASE_URL}/api/module4/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) throw new Error("Erreur lors de l'envoi du message");
    return response.json();
  },

  // Calls
  createCall: async (conversationId: string, payload: CreateCallPayload) => {
    const response = await fetch(
      `${BASE_URL}/api/module4/conversations/${conversationId}/calls`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) throw new Error("Erreur lors de la création de l'appel");
    return response.json();
  },

  updateCallStatus: async (callId: string, payload: UpdateCallStatusPayload) => {
    const response = await fetch(`${BASE_URL}/api/module4/calls/${callId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Erreur lors de la mise à jour de l'appel");
    return response.json();
  },
};
