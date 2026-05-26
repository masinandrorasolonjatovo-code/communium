"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  Archive,
  Bell,
  Camera,
  CheckCheck,
  ChevronLeft,
  FileText,
  Home,
  Image as ImageIcon,
  Mic,
  MicOff,
  Monitor,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Square,
  Trash2,
  User,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const CURRENT_USER_ID = 1;

type TabKey = "all" | "groups" | "calls";
type ConversationType = "direct" | "group";
type MessageType = "text" | "image" | "file" | "audio_call" | "video_call";
type CallMode = "audio" | "video";
type AttachmentKind = "pdf" | "image" | "file" | "audio";

interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  subtitle: string;
  avatarLabel: string;
  avatarTone: string;
  status: "online" | "offline" | "group";
  members?: number;
  last_message_text?: string;
  last_message_sender_username?: string;
  last_message_created_at?: string;
  unread_count: number;
  archived?: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_username?: string;
  content_type: MessageType;
  text_content?: string;
  attachment_meta?: {
    name?: string;
    size?: string;
    kind?: AttachmentKind;
    mime?: string;
    url?: string;
  };
  parent_id?: string;
  created_at: string;
  status?: "sent" | "read";
}

const fallbackConversations: Conversation[] = [
  {
    id: "demo-direct-obede",
    type: "direct",
    name: "Obède Nizi",
    subtitle: "Badge vérifié CNDP",
    avatarLabel: "ON",
    avatarTone: "bg-blue-600",
    status: "online",
    last_message_text: "Tu comptes, j’ai envoyé les devs pour valider le module.",
    last_message_sender_username: "Obède",
    last_message_created_at: new Date("2026-05-25T14:32:00").toISOString(),
    unread_count: 1,
  },
  {
    id: "demo-group-tech",
    type: "group",
    name: "Tech Maroc MA",
    subtitle: "Groupe business et innovation",
    avatarLabel: "TM",
    avatarTone: "bg-sky-500",
    status: "group",
    members: 28,
    last_message_text: "Est-ce que quelqu’un peut valider l’intégration CMI ?",
    last_message_sender_username: "Amine",
    last_message_created_at: new Date("2026-05-25T14:05:00").toISOString(),
    unread_count: 3,
  },
  {
    id: "demo-group-startup",
    type: "group",
    name: "Univers Startup",
    subtitle: "Salon investisseurs et fondateurs",
    avatarLabel: "US",
    avatarTone: "bg-indigo-500",
    status: "group",
    members: 14,
    last_message_text: "Vous avez rejoint le groupe.",
    last_message_sender_username: "Système",
    last_message_created_at: new Date("2026-05-24T18:20:00").toISOString(),
    unread_count: 0,
  },
  {
    id: "demo-direct-sara",
    type: "direct",
    name: "Sara Bensouda",
    subtitle: "Mentor certifiée",
    avatarLabel: "SB",
    avatarTone: "bg-cyan-600",
    status: "offline",
    last_message_text: "Appel vidéo manqué",
    last_message_sender_username: "Sara",
    last_message_created_at: new Date("2026-05-23T10:09:00").toISOString(),
    unread_count: 0,
  },
];

const fallbackMessages: Record<string, Message[]> = {
  "demo-direct-obede": [
    {
      id: "m1",
      conversation_id: "demo-direct-obede",
      sender_id: 2,
      sender_username: "Obède Nizi",
      content_type: "text",
      text_content:
        "Bonjour. Est-ce que le wallet Tks fonctionne avec la session de mentorat ?",
      created_at: new Date("2026-05-25T14:15:00").toISOString(),
    },
    {
      id: "m2",
      conversation_id: "demo-direct-obede",
      sender_id: CURRENT_USER_ID,
      sender_username: "Vous",
      content_type: "text",
      text_content:
        "Oui parfaitement, tu peux utiliser les Tks directement depuis la réservation.",
      created_at: new Date("2026-05-25T14:20:00").toISOString(),
      status: "read",
    },
    {
      id: "m3",
      conversation_id: "demo-direct-obede",
      sender_id: 2,
      sender_username: "Obède Nizi",
      content_type: "file",
      text_content: "Super, regarde notre document de cadrage.",
      attachment_meta: {
        name: "Cadrage - The Communium.pdf",
        size: "1.2 MB",
        kind: "pdf",
      },
      created_at: new Date("2026-05-25T14:24:00").toISOString(),
    },
  ],
  "demo-group-tech": [
    {
      id: "g1",
      conversation_id: "demo-group-tech",
      sender_id: 3,
      sender_username: "Amine",
      content_type: "text",
      text_content:
        "Est-ce que quelqu’un peut valider l’intégration CMI avant la démo ?",
      created_at: new Date("2026-05-25T14:05:00").toISOString(),
    },
    {
      id: "g2",
      conversation_id: "demo-group-tech",
      sender_id: CURRENT_USER_ID,
      sender_username: "Vous",
      content_type: "text",
      text_content: "Je prends le point et je partage un retour dans le canal.",
      created_at: new Date("2026-05-25T14:08:00").toISOString(),
      status: "read",
    },
  ],
  "demo-group-startup": [],
  "demo-direct-sara": [
    {
      id: "s1",
      conversation_id: "demo-direct-sara",
      sender_id: 4,
      sender_username: "Sara Bensouda",
      content_type: "video_call",
      text_content: "Appel vidéo manqué",
      created_at: new Date("2026-05-23T10:09:00").toISOString(),
    },
  ],
};

export default function Module4Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(fallbackConversations);
  const [activeConversationId, setActiveConversationId] = useState(fallbackConversations[0].id);
  const [messagesByConversation, setMessagesByConversation] =
    useState<Record<string, Message[]>>(fallbackMessages);
  const [messageDraft, setMessageDraft] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [callMode, setCallMode] = useState<CallMode | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [remoteTypingName, setRemoteTypingName] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const remoteTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConversationIdRef = useRef(activeConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );
  const activeMessages = activeConversationId
    ? messagesByConversation[activeConversationId] || []
    : [];

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      timeout: 2500,
    });

    newSocket.on("connected", () => {
      newSocket.emit("join:user", { userId: CURRENT_USER_ID });
      setBackendNotice(null);
    });

    newSocket.on("connect_error", () => {
      setBackendNotice("Mode démo actif : l’API temps réel n’est pas joignable.");
    });

    newSocket.on("module4:conversation:created", (payload: any) => {
      setConversations((previous) => [normalizeConversation(payload), ...previous]);
    });

    newSocket.on("module4:message:created", (payload: any) => {
      const normalized = normalizeMessage(payload);
      setMessagesByConversation((previous) => ({
        ...previous,
        [normalized.conversation_id]: mergeMessage(
          previous[normalized.conversation_id] || [],
          normalized
        ),
      }));
      bumpConversation(normalized.conversation_id, normalized.text_content || "Nouveau message");
      if (normalized.sender_id !== CURRENT_USER_ID) {
        showBrowserNotification(
          normalized.sender_username || "Nouveau message",
          normalized.text_content || "Pièce jointe reçue"
        );
      }
    });

    newSocket.on("module4:typing:start", (payload: any) => {
      if (
        payload?.conversationId === activeConversationIdRef.current &&
        Number(payload?.userId) !== CURRENT_USER_ID
      ) {
        setRemoteTypingName(payload.username || "Un membre");
        if (remoteTypingTimerRef.current) clearTimeout(remoteTypingTimerRef.current);
        remoteTypingTimerRef.current = setTimeout(() => setRemoteTypingName(null), 2500);
      }
    });

    newSocket.on("module4:typing:stop", (payload: any) => {
      if (payload?.conversationId === activeConversationIdRef.current) {
        setRemoteTypingName(null);
      }
    });

    newSocket.on("module4:message:read", (payload: any) => {
      if (!payload?.conversationId) return;
      setMessagesByConversation((previous) => ({
        ...previous,
        [payload.conversationId]: (previous[payload.conversationId] || []).map(
          (message) =>
            message.sender_id === CURRENT_USER_ID
              ? { ...message, status: "read" }
              : message
        ),
      }));
    });

    newSocket.on("module4:notification", (payload: any) => {
      showBrowserNotification(payload?.title || "Communium", payload?.body || "");
    });

    setSocket(newSocket);
    fetchConversations();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeConversationId || !socket) return;
    socket.emit("join:conversation", { conversationId: activeConversationId });
    fetchMessages(activeConversationId);
    return () => {
      socket.emit("leave:conversation", { conversationId: activeConversationId });
    };
  }, [activeConversationId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeMessages.length, activeConversationId]);

  useEffect(() => {
    const lastMessage = activeMessages[activeMessages.length - 1];
    if (!socket || !activeConversationId || !lastMessage) return;

    socket.emit("module4:message:read", {
      conversationId: activeConversationId,
      userId: CURRENT_USER_ID,
      messageId: lastMessage.id,
    });
  }, [activeConversationId, activeMessages, socket]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return conversations
      .filter((conversation) => !conversation.archived)
      .filter((conversation) => {
        if (activeTab === "groups") return conversation.type === "group";
        if (activeTab === "calls") {
          const messages = messagesByConversation[conversation.id] || [];
          return messages.some((message) =>
            ["audio_call", "video_call"].includes(message.content_type)
          );
        }
        return true;
      })
      .filter((conversation) => {
        if (!normalizedQuery) return true;
        const content = [
          conversation.name,
          conversation.subtitle,
          conversation.last_message_text,
          conversation.last_message_sender_username,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return content.includes(normalizedQuery);
      });
  }, [activeTab, conversations, messagesByConversation, query]);

  async function fetchConversations() {
    try {
      const response = await fetch(
        `${API_URL}/api/module4/users/${CURRENT_USER_ID}/conversations`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeConversation);
        setConversations(normalized);
        setActiveConversationId((current) => current || normalized[0].id);
      }
    } catch {
      setBackendNotice("Mode démo actif : les données locales sont affichées.");
    }
  }

  async function fetchMessages(conversationId: string) {
    if (conversationId.startsWith("demo-")) return;

    try {
      const response = await fetch(
        `${API_URL}/api/module4/conversations/${conversationId}/messages`
      );
      if (!response.ok) return;
      const data = await response.json();
      setMessagesByConversation((previous) => ({
        ...previous,
        [conversationId]: Array.isArray(data) ? data.map(normalizeMessage) : [],
      }));
    } catch {
      setBackendNotice("Mode démo actif : impossible de charger l’historique API.");
    }
  }

  async function sendMessage() {
    if (!messageDraft.trim() || !activeConversationId) return;

    const optimisticMessage: Message = {
      id: `local-${Date.now()}`,
      conversation_id: activeConversationId,
      sender_id: CURRENT_USER_ID,
      sender_username: "Vous",
      content_type: "text",
      text_content: messageDraft.trim(),
      created_at: new Date().toISOString(),
      status: "sent",
    };

    setMessageDraft("");
    appendMessage(optimisticMessage);

    if (activeConversationId.startsWith("demo-")) return;

    try {
      const response = await fetch(
        `${API_URL}/api/module4/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: CURRENT_USER_ID,
            contentType: "text",
            textContent: optimisticMessage.text_content,
          }),
        }
      );
      if (!response.ok) throw new Error("send failed");
    } catch {
      setBackendNotice("Message gardé localement : l’envoi API a échoué.");
    }
  }

  async function sendAttachment(file: File, kind: AttachmentKind) {
    if (!activeConversationId) return;

    const objectUrl = URL.createObjectURL(file);
    const contentType: MessageType = kind === "image" ? "image" : "file";
    const textContent =
      kind === "audio"
        ? "Message audio"
        : kind === "image"
          ? "Image partagée"
          : "Document partagé";
    const message: Message = {
      id: `attachment-${Date.now()}-${file.name}`,
      conversation_id: activeConversationId,
      sender_id: CURRENT_USER_ID,
      sender_username: "Vous",
      content_type: contentType,
      text_content: textContent,
      attachment_meta: {
        name: file.name,
        size: formatBytes(file.size),
        kind,
        mime: file.type || "application/octet-stream",
        url: objectUrl,
      },
      created_at: new Date().toISOString(),
      status: "sent",
    };

    appendMessage(message);

    if (activeConversationId.startsWith("demo-")) return;

    try {
      const response = await fetch(
        `${API_URL}/api/module4/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: CURRENT_USER_ID,
            contentType,
            textContent,
            attachmentMeta: {
              name: file.name,
              size: file.size,
              formattedSize: formatBytes(file.size),
              kind,
              mime: file.type || "application/octet-stream",
            },
          }),
        }
      );
      if (!response.ok) throw new Error("attachment send failed");
    } catch {
      setBackendNotice(
        "Pièce jointe gardée localement : ajoutez un stockage fichier serveur pour la persistance."
      );
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setBackendNotice("Ce navigateur ne supporte pas les notifications système.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    setBackendNotice(
      permission === "granted"
        ? "Notifications temps réel activées."
        : "Notifications non activées par le navigateur."
    );
  }

  function appendMessage(message: Message) {
    setMessagesByConversation((previous) => ({
      ...previous,
      [message.conversation_id]: mergeMessage(
        previous[message.conversation_id] || [],
        message
      ),
    }));
    bumpConversation(message.conversation_id, message.text_content || "Pièce jointe");
  }

  function bumpConversation(conversationId: string, preview: string) {
    setConversations((previous) =>
      previous
        .map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                last_message_text: preview,
                last_message_sender_username: "Vous",
                last_message_created_at: new Date().toISOString(),
                unread_count: 0,
              }
            : conversation
        )
        .sort(
          (a, b) =>
            new Date(b.last_message_created_at || 0).getTime() -
            new Date(a.last_message_created_at || 0).getTime()
        )
    );
  }

  function handleDraftChange(value: string) {
    setMessageDraft(value);
    setIsTyping(true);
    socket?.emit("module4:typing:start", {
      conversationId: activeConversationId,
      userId: CURRENT_USER_ID,
      username: "Vous",
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit("module4:typing:stop", {
        conversationId: activeConversationId,
        userId: CURRENT_USER_ID,
      });
    }, 1400);
  }

  function addDemoAttachment(kind: "file" | "image") {
    if (!activeConversationId) return;

    appendMessage({
      id: `attachment-${Date.now()}`,
      conversation_id: activeConversationId,
      sender_id: CURRENT_USER_ID,
      sender_username: "Vous",
      content_type: kind,
      text_content: kind === "image" ? "Image partagée" : "Document partagé",
      attachment_meta:
        kind === "image"
          ? { name: "maquette-module4.png", size: "640 KB", kind: "image" }
          : { name: "note-de-cadrage.pdf", size: "850 KB", kind: "pdf" },
      created_at: new Date().toISOString(),
      status: "sent",
    });
  }

  function archiveConversation() {
    if (!activeConversationId) return;
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === activeConversationId
          ? { ...conversation, archived: true }
          : conversation
      )
    );
    setActiveConversationId(filteredConversations[0]?.id || "");
    setShowConversationMenu(false);
  }

  function deleteConversationLocally() {
    if (!activeConversationId) return;
    setConversations((previous) =>
      previous.filter((conversation) => conversation.id !== activeConversationId)
    );
    setMessagesByConversation((previous) => {
      const next = { ...previous };
      delete next[activeConversationId];
      return next;
    });
    setActiveConversationId(filteredConversations[0]?.id || "");
    setShowConversationMenu(false);
  }

  function createDemoGroup(name: string) {
    const id = `demo-group-${Date.now()}`;
    const group: Conversation = {
      id,
      type: "group",
      name,
      subtitle: "Nouveau salon collaboratif",
      avatarLabel: initials(name),
      avatarTone: "bg-blue-500",
      status: "group",
      members: 3,
      last_message_text: "Groupe créé. Invitez vos membres pour démarrer.",
      last_message_sender_username: "Vous",
      last_message_created_at: new Date().toISOString(),
      unread_count: 0,
    };
    setConversations((previous) => [group, ...previous]);
    setMessagesByConversation((previous) => ({ ...previous, [id]: [] }));
    setActiveConversationId(id);
    setShowGroupDialog(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl bg-white shadow-sm lg:my-6 lg:min-h-[calc(100vh-48px)] lg:overflow-hidden lg:rounded-[8px] lg:border lg:border-slate-200">
        <aside
          className={`flex w-full flex-col border-slate-200 bg-white lg:w-[410px] lg:border-r ${
            activeConversation ? "hidden lg:flex" : "flex"
          }`}
        >
          <InboxHeader
            query={query}
            activeTab={activeTab}
            notificationsEnabled={notificationsEnabled}
            onQueryChange={setQuery}
            onTabChange={setActiveTab}
            onRequestNotifications={requestNotifications}
            onOpenGroupDialog={() => setShowGroupDialog(true)}
          />

          {backendNotice && (
            <div className="mx-4 mb-3 rounded-[8px] border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              {backendNotice}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 pb-24 lg:pb-4">
            {filteredConversations.length === 0 ? (
              <EmptyInbox activeTab={activeTab} />
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeConversationId}
                  onClick={() => setActiveConversationId(conversation.id)}
                />
              ))
            )}
          </div>

          <BottomNavigation />
        </aside>

        <section
          className={`min-w-0 flex-1 bg-slate-50 ${
            activeConversation ? "flex" : "hidden lg:flex"
          }`}
        >
          {activeConversation ? (
            <div className="flex h-screen w-full flex-col lg:h-auto">
              <ConversationHeader
                conversation={activeConversation}
                onBack={() => setActiveConversationId("")}
                onAudioCall={() => setCallMode("audio")}
                onVideoCall={() => setCallMode("video")}
                showMenu={showConversationMenu}
                onToggleMenu={() => setShowConversationMenu((value) => !value)}
                onArchive={archiveConversation}
                onDelete={deleteConversationLocally}
              />

              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                <DateDivider label="Mercredi 25 Mai" />
                <div className="space-y-4">
                  {activeMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      own={message.sender_id === CURRENT_USER_ID}
                    />
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {activeConversation.name} est en train d’écrire
                    </div>
                  )}
                  {remoteTypingName && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      {remoteTypingName} écrit en temps réel
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <Composer
                value={messageDraft}
                onChange={handleDraftChange}
                onSend={sendMessage}
                onAttachFile={(file) => sendAttachment(file, detectAttachmentKind(file))}
                onAttachImage={(file) => sendAttachment(file, "image")}
                onAttachCamera={(file) => sendAttachment(file, "image")}
                onAttachAudio={(file) => sendAttachment(file, "audio")}
              />
            </div>
          ) : (
            <div className="grid h-full w-full place-items-center p-10 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[8px] bg-blue-600 text-white">
                  <Users size={28} />
                </div>
                <h2 className="text-xl font-bold">Sélectionnez une conversation</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Vos discussions, salons et appels restent synchronisés depuis ce module.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {showGroupDialog && (
        <GroupDialog
          onCancel={() => setShowGroupDialog(false)}
          onCreate={createDemoGroup}
        />
      )}

      {callMode && activeConversation && (
        <CallOverlay
          mode={callMode}
          conversation={activeConversation}
          onClose={() => setCallMode(null)}
        />
      )}
    </main>
  );
}

function InboxHeader({
  query,
  activeTab,
  notificationsEnabled,
  onQueryChange,
  onTabChange,
  onRequestNotifications,
  onOpenGroupDialog,
}: {
  query: string;
  activeTab: TabKey;
  notificationsEnabled: boolean;
  onQueryChange: (value: string) => void;
  onTabChange: (value: TabKey) => void;
  onRequestNotifications: () => void;
  onOpenGroupDialog: () => void;
}) {
  const tabs: Array<{ id: TabKey; label: string; count?: string }> = [
    { id: "all", label: "Toutes", count: "4" },
    { id: "groups", label: "Groupes", count: "2" },
    { id: "calls", label: "Appels" },
  ];

  return (
    <div className="border-b border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-blue-600">Module 4</p>
          <h1 className="text-2xl font-black tracking-normal text-slate-950">
            Messages
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRequestNotifications}
            className="grid h-10 w-10 place-items-center rounded-[8px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title={notificationsEnabled ? "Notifications activées" : "Activer les notifications"}
          >
            <Bell size={19} className={notificationsEnabled ? "text-blue-600" : ""} />
          </button>
          <button
            onClick={onOpenGroupDialog}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Groupe
          </button>
        </div>
      </div>

      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-11 w-full rounded-[8px] border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          placeholder="Chercher un membre, un groupe..."
        />
      </label>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-[8px] bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`min-h-10 rounded-[7px] px-2 text-sm font-bold transition ${
              activeTab === tab.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
            {tab.count && <span className="ml-1 text-xs text-slate-400">{tab.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-2 w-full rounded-[8px] border p-3 text-left transition ${
        active
          ? "border-blue-200 bg-blue-50"
          : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex gap-3">
        <Avatar conversation={conversation} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-extrabold text-slate-950">
                  {conversation.name}
                </h2>
                {conversation.status === "online" && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                {conversation.subtitle}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-slate-400">
              {formatConversationTime(conversation.last_message_created_at)}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {conversation.last_message_sender_username && (
              <span className="font-bold text-slate-800">
                {conversation.last_message_sender_username}:{" "}
              </span>
            )}
            {conversation.last_message_text || "Aucun message pour le moment."}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
              {conversation.type === "group" ? <Users size={13} /> : <User size={13} />}
              {conversation.type === "group"
                ? `${conversation.members || 0} membres`
                : conversation.status === "online"
                  ? "En ligne"
                  : "Hors ligne"}
            </span>
            {conversation.unread_count > 0 && (
              <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1.5 text-xs font-black text-white">
                {conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function ConversationHeader({
  conversation,
  onBack,
  onAudioCall,
  onVideoCall,
  showMenu,
  onToggleMenu,
  onArchive,
  onDelete,
}: {
  conversation: Conversation;
  onBack: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
  showMenu: boolean;
  onToggleMenu: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <header className="relative flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-[8px] text-slate-500 hover:bg-slate-100 lg:hidden"
          title="Retour"
        >
          <ChevronLeft size={22} />
        </button>
        <Avatar conversation={conversation} compact />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-black text-slate-950">
              {conversation.name}
            </h2>
            <ShieldCheck className="text-blue-600" size={17} />
          </div>
          <p className="truncate text-xs font-semibold text-slate-500">
            {conversation.type === "group"
              ? `${conversation.members || 0} membres dans le salon`
              : conversation.status === "online"
                ? "En ligne maintenant"
                : "Vu récemment"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <IconButton label="Appel audio" onClick={onAudioCall}>
          <Phone size={19} />
        </IconButton>
        <IconButton label="Appel vidéo" onClick={onVideoCall}>
          <Video size={19} />
        </IconButton>
        <IconButton label="Paramètres" onClick={onToggleMenu}>
          <MoreVertical size={19} />
        </IconButton>
      </div>

      {showMenu && (
        <div className="absolute right-4 top-16 z-20 w-56 rounded-[8px] border border-slate-200 bg-white p-2 shadow-xl">
          <button className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <UserPlus size={16} />
            Inviter un membre
          </button>
          <button
            onClick={onArchive}
            className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Archive size={16} />
            Archiver
          </button>
          <button
            onClick={onDelete}
            className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Supprimer localement
          </button>
        </div>
      )}
    </header>
  );
}

function MessageBubble({ message, own }: { message: Message; own: boolean }) {
  const hasAttachment = message.attachment_meta || message.content_type !== "text";

  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] sm:max-w-[68%] ${own ? "items-end" : "items-start"}`}>
        {!own && (
          <p className="mb-1 ml-1 text-xs font-bold text-slate-500">
            {message.sender_username || "Membre"}
          </p>
        )}
        <div
          className={`rounded-[8px] px-4 py-3 shadow-sm ${
            own
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {message.text_content && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.text_content}
            </p>
          )}

          {hasAttachment && (
            <div
              className={`mt-3 flex items-center gap-3 rounded-[8px] border p-3 ${
                own
                  ? "border-blue-400 bg-blue-500"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`grid h-10 w-10 place-items-center rounded-[8px] ${
                  own ? "bg-white/15" : "bg-white"
                }`}
              >
                {message.attachment_meta?.kind === "image" ? (
                  <ImageIcon size={20} />
                ) : message.attachment_meta?.kind === "audio" ? (
                  <Mic size={20} />
                ) : (
                  <FileText size={20} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {message.attachment_meta?.name ||
                    (message.content_type === "video_call"
                      ? "Appel vidéo"
                      : "Pièce jointe")}
                </p>
                <p className={`text-xs ${own ? "text-blue-100" : "text-slate-500"}`}>
                  {message.attachment_meta?.size || "Historique d’appel"}
                </p>
              </div>
            </div>
          )}

          {message.attachment_meta?.kind === "image" && message.attachment_meta.url && (
            <img
              src={message.attachment_meta.url}
              alt={message.attachment_meta.name || "Image partagée"}
              className="mt-3 max-h-64 w-full rounded-[8px] object-cover"
            />
          )}

          {message.attachment_meta?.kind === "audio" && message.attachment_meta.url && (
            <audio controls src={message.attachment_meta.url} className="mt-3 w-full" />
          )}

          {message.attachment_meta?.url && message.attachment_meta.kind !== "image" && message.attachment_meta.kind !== "audio" && (
            <a
              href={message.attachment_meta.url}
              download={message.attachment_meta.name}
              className={`mt-3 inline-flex text-xs font-bold underline ${
                own ? "text-white" : "text-blue-700"
              }`}
            >
              Télécharger / ouvrir
            </a>
          )}

          <div
            className={`mt-2 flex items-center justify-end gap-1 text-[11px] font-semibold ${
              own ? "text-blue-100" : "text-slate-400"
            }`}
          >
            {formatMessageTime(message.created_at)}
            {own && <CheckCheck size={14} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  onAttachFile,
  onAttachImage,
  onAttachCamera,
  onAttachAudio,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttachFile: (file: File) => void;
  onAttachImage: (file: File) => void;
  onAttachCamera: (file: File) => void;
  onAttachAudio: (file: File) => void;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `audio-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        onAttachAudio(file);
      };

      recorder.start();
      setRecording(true);
    } catch {
      alert("Impossible d’accéder au micro. Vérifiez les permissions du navigateur.");
    }
  }

  function handleInputFile(
    event: React.ChangeEvent<HTMLInputElement>,
    callback: (file: File) => void
  ) {
    const file = event.target.files?.[0];
    if (file) callback(file);
    event.target.value = "";
  }

  return (
    <div className="relative border-t border-slate-200 bg-white px-3 py-3 sm:px-5">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => handleInputFile(event, onAttachFile)}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleInputFile(event, onAttachImage)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleInputFile(event, onAttachCamera)}
      />

      {emojiOpen && (
        <div className="absolute bottom-20 right-16 z-20 grid grid-cols-8 gap-1 rounded-[8px] border border-slate-200 bg-white p-2 shadow-xl">
          {["🙂", "😂", "😍", "👏", "🔥", "✅", "🙏", "💙", "👍", "🎯", "🚀", "📌", "💡", "📄", "🎤", "📷"].map(
            (emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChange(`${value}${emoji}`);
                  setEmojiOpen(false);
                }}
                className="grid h-8 w-8 place-items-center rounded-[7px] text-lg hover:bg-slate-100"
                title={`Ajouter ${emoji}`}
              >
                {emoji}
              </button>
            )
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <IconButton label="Joindre un fichier" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={20} />
        </IconButton>
        <IconButton label="Joindre une image" onClick={() => imageInputRef.current?.click()}>
          <ImageIcon size={20} />
        </IconButton>
        <IconButton label="Prendre une photo" onClick={() => cameraInputRef.current?.click()}>
          <Camera size={20} />
        </IconButton>
        <div className="flex min-h-12 flex-1 items-center gap-2 rounded-[8px] border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="Écrivez votre message..."
          />
          <button
            onClick={() => setEmojiOpen((open) => !open)}
            className="grid h-8 w-8 place-items-center rounded-[7px] text-slate-400 hover:bg-white hover:text-blue-600"
            title="Ajouter un émoji"
          >
            <Smile size={20} />
          </button>
          <button
            onClick={toggleRecording}
            className={`grid h-8 w-8 place-items-center rounded-[7px] ${
              recording ? "bg-red-100 text-red-600" : "text-slate-400 hover:bg-white hover:text-blue-600"
            }`}
            title={recording ? "Arrêter l’enregistrement" : "Enregistrer un audio"}
          >
            {recording ? <Square size={18} /> : <Mic size={20} />}
          </button>
        </div>
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-slate-300"
          title="Envoyer"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

function CallOverlay({
  mode,
  conversation,
  onClose,
}: {
  mode: CallMode;
  conversation: Conversation;
  onClose: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(mode === "audio");
  const [sharing, setSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startMedia() {
      stopMediaStream(mediaStreamRef);
      if (videoOff && muted) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: !videoOff,
          audio: !muted,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (localVideoRef.current && !videoOff) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {
        // Les permissions caméra/micro peuvent être refusées sans bloquer l’UI d’appel.
      }
    }

    startMedia();

    return () => {
      cancelled = true;
    };
  }, [muted, videoOff]);

  function closeCall() {
    stopMediaStream(mediaStreamRef);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[8px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase text-blue-600">
              {mode === "video" ? "Appel vidéo en cours" : "Appel audio en cours"}
            </p>
            <h2 className="font-black text-slate-950">{conversation.name}</h2>
          </div>
          <button
            onClick={closeCall}
            className="grid h-10 w-10 place-items-center rounded-[8px] text-slate-500 hover:bg-slate-100"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 bg-slate-100">
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-28 w-28 place-items-center rounded-full bg-blue-600 text-3xl font-black text-white">
                {conversation.avatarLabel}
              </div>
              <h3 className="text-2xl font-black text-slate-950">{conversation.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Durée : {formatDuration(seconds)}
              </p>
            </div>
          </div>

          {!videoOff && (
            <div className="absolute bottom-5 right-5 h-40 w-28 overflow-hidden rounded-[8px] border border-white bg-slate-900 shadow-xl sm:h-48 sm:w-36">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-2 left-2 rounded bg-slate-950/70 px-2 py-1 text-xs font-bold text-white">
                Ma caméra
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setMuted((value) => !value)}
              className={`grid h-12 w-12 place-items-center rounded-[8px] ${
                muted ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
              title={muted ? "Activer le micro" : "Désactiver le micro"}
            >
              {muted ? <MicOff size={21} /> : <Mic size={21} />}
            </button>
            <button
              onClick={() => setVideoOff((value) => !value)}
              className={`grid h-12 w-12 place-items-center rounded-[8px] ${
                videoOff ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
              title={videoOff ? "Activer la caméra" : "Désactiver la caméra"}
            >
              {videoOff ? <VideoOff size={21} /> : <Video size={21} />}
            </button>
            <button
              onClick={() => setSharing((value) => !value)}
              className={`grid h-12 w-12 place-items-center rounded-[8px] ${
                sharing ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
              title="Partager l’écran"
            >
              <Monitor size={21} />
            </button>
            <button
              onClick={closeCall}
              className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-red-600 px-5 font-black text-white hover:bg-red-700"
            >
              <Phone size={20} />
              Quitter l’appel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupDialog({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("Nouveau groupe Communium");

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-[8px] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-blue-600">Salon</p>
            <h2 className="text-lg font-black">Créer un groupe</h2>
          </div>
          <button
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-[8px] text-slate-500 hover:bg-slate-100"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        <label className="text-sm font-bold text-slate-700">Nom du groupe</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 h-11 w-full rounded-[8px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-10 rounded-[8px] border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={() => name.trim() && onCreate(name.trim())}
            className="h-10 rounded-[8px] bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-4 border-t border-slate-200 bg-white lg:hidden">
      {[
        { label: "Accueil", icon: Home, active: false },
        { label: "Matching", icon: Users, active: false },
        { label: "Messages", icon: Bell, active: true },
        { label: "Profil", icon: Settings, active: false },
      ].map((item) => (
        <button
          key={item.label}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-bold ${
            item.active ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <item.icon size={21} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function EmptyInbox({ activeTab }: { activeTab: TabKey }) {
  return (
    <div className="grid min-h-80 place-items-center rounded-[8px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-[8px] bg-white text-blue-600">
          <Search size={23} />
        </div>
        <h2 className="font-black text-slate-900">Aucun résultat</h2>
        <p className="mt-1 text-sm text-slate-500">
          {activeTab === "calls"
            ? "Aucun historique d’appel ne correspond à votre recherche."
            : "Essayez un autre nom, groupe ou mot-clé."}
        </p>
      </div>
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      title={label}
    >
      {children}
    </button>
  );
}

function Avatar({
  conversation,
  compact = false,
}: {
  conversation: Conversation;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-[8px] font-black text-white ${
        conversation.avatarTone
      } ${compact ? "h-11 w-11 text-sm" : "h-12 w-12 text-sm"}`}
    >
      {conversation.avatarLabel}
    </div>
  );
}

function normalizeConversation(payload: any): Conversation {
  const name =
    payload.name ||
    payload.display_name ||
    (payload.type === "group" ? "Groupe Communium" : "Conversation directe");
  return {
    id: String(payload.id),
    type: payload.type === "group" ? "group" : "direct",
    name,
    subtitle:
      payload.type === "group"
        ? "Salon de discussion"
        : payload.subtitle || "Membre Communium",
    avatarLabel: initials(name),
    avatarTone: payload.type === "group" ? "bg-sky-500" : "bg-blue-600",
    status: payload.type === "group" ? "group" : "online",
    members: payload.participants?.length,
    last_message_text: payload.last_message_text || "",
    last_message_sender_username: payload.last_message_sender_username || "",
    last_message_created_at: payload.last_message_created_at || payload.updated_at,
    unread_count: Number(payload.unread_count || 0),
  };
}

function normalizeMessage(payload: any): Message {
  return {
    id: String(payload.id),
    conversation_id: String(payload.conversation_id),
    sender_id: Number(payload.sender_id),
    sender_username:
      payload.sender_username || payload.sender?.username || payload.username || "Membre",
    content_type: payload.content_type || "text",
    text_content: payload.text_content || payload.content || "",
    attachment_meta: payload.attachment_meta || undefined,
    parent_id: payload.parent_id || undefined,
    created_at: payload.created_at || new Date().toISOString(),
    status: payload.status || "read",
  };
}

function mergeMessage(messages: Message[], nextMessage: Message) {
  if (messages.some((message) => message.id === nextMessage.id)) {
    return messages;
  }

  return [...messages, nextMessage];
}

function detectAttachmentKind(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  return "file";
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** sizeIndex;
  return `${value.toFixed(value >= 10 || sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}

function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  new Notification(title, {
    body,
    icon: "/favicon.ico",
  });
}

function stopMediaStream(streamRef: MutableRefObject<MediaStream | null>) {
  if (!streamRef.current) return;
  streamRef.current.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatConversationTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
