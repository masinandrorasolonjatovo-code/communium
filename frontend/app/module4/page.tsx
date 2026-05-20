"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Phone,
  Video,
  Search,
  Plus,
  Home,
  Users,
  User,
  ChevronLeft,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Mic,
} from "lucide-react";
import { io } from "socket.io-client";

interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  avatar_url?: string;
  last_message_text?: string;
  last_message_sender_username?: string;
  last_message_created_at?: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_username?: string;
  content_type: "text" | "image" | "file" | "audio_call" | "video_call";
  text_content?: string;
  attachment_meta?: any;
  parent_id?: string;
  created_at: string;
}

export default function Module4Page() {
  const [activeTab, setActiveTab] = useState<"discussions" | "groups" | "calls">(
    "discussions"
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userId = 1; // À remplacer par le contexte utilisateur réel

  useEffect(() => {
    // Connexion Socket.IO
    const newSocket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connected", (data: any) => {
      console.log("✅ Connecté au serveur Communium:", data);
      newSocket.emit("join:user", { userId });
    });

    newSocket.on("module4:message:created", (payload: Message) => {
      setMessages((prev) => [...prev, payload]);
    });

    newSocket.on("module4:conversation:created", (payload: Conversation) => {
      setConversations((prev) => [payload, ...prev]);
    });

    setSocket(newSocket);

    // Charger les conversations initiales
    fetchConversations();

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/module4/users/${userId}/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/module4/conversations/${conversationId}/messages`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        if (socket) {
          socket.emit("join:conversation", { conversationId });
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeConversationId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/module4/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: userId,
            contentType: "text",
            textContent: inputMessage,
          }),
        }
      );

      if (response.ok) {
        setInputMessage("");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    // Indicateur de frappe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === "groups") return conv.type === "group";
    if (activeTab === "calls") return false; // TODO: Implémenter historique appels
    return true;
  });

  if (activeConversationId) {
    return <ConversationView conversation={conversations.find(c => c.id === activeConversationId)} messages={messages} onBack={() => setActiveConversationId(null)} onSendMessage={sendMessage} inputMessage={inputMessage} onInputChange={handleInputChange} userId={userId} />;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <button className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full">
            <Plus size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Chercher un membre, un groupe..."
            className="w-full bg-gray-900 border border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 px-4 bg-gray-950">
        {[
          { id: "discussions", label: "Toutes les discussions" },
          { id: "groups", label: "Groupes" },
          { id: "calls", label: "Appels" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-4 text-center text-sm font-medium border-b-2 transition ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle size={48} className="mb-4 opacity-50" />
            <p>Aucune conversation</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id);
                fetchMessages(conv.id);
              }}
              className="w-full border-b border-gray-800 p-4 hover:bg-gray-900 transition text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {conv.type === "group" ? (
                    <Users size={24} />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">
                      {conv.name || "Conversation directe"}
                    </h3>
                    <span className="text-xs text-gray-400 ml-2">
                      {conv.last_message_created_at
                        ? new Date(conv.last_message_created_at).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {conv.last_message_sender_username}:{" "}
                    {conv.last_message_text || "[Message...]"}
                  </p>
                  {conv.unread_count > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-400">
                        {conv.unread_count} nouveau(x) message(s)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-700 bg-gray-950 flex justify-around py-3">
        <button className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-white">
          <Home size={24} />
          <span className="text-xs">Accueil</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-white">
          <Users size={24} />
          <span className="text-xs">Matching</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-blue-400">
          <MessageCircle size={24} />
          <span className="text-xs">Message (3)</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-white">
          <User size={24} />
          <span className="text-xs">Profil</span>
        </button>
      </div>
    </div>
  );
}

interface ConversationViewProps {
  conversation?: Conversation;
  messages: Message[];
  onBack: () => void;
  onSendMessage: () => void;
  inputMessage: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  userId: number;
}

function ConversationView({
  conversation,
  messages,
  onBack,
  onSendMessage,
  inputMessage,
  onInputChange,
  userId,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700 p-4 flex items-center justify-between bg-gray-950">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:bg-gray-800 p-2 rounded">
            <ChevronLeft size={24} />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
          <div>
            <h2 className="font-semibold">{conversation.name || "Chat"}</h2>
            <p className="text-xs text-green-400">🟢 En ligne</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hover:bg-gray-800 p-2 rounded">
            <Phone size={20} />
          </button>
          <button className="hover:bg-gray-800 p-2 rounded">
            <Video size={20} />
          </button>
          <button className="hover:bg-gray-800 p-2 rounded">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isOwnMessage = msg.sender_id === userId;
          const showDateSeparator =
            idx === 0 ||
            new Date(messages[idx - 1].created_at).toDateString() !==
              new Date(msg.created_at).toDateString();

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex justify-center py-4">
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}

              <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs ${
                    isOwnMessage
                      ? "bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                      : "bg-gray-800 text-white rounded-tl-lg rounded-tr-lg rounded-br-lg"
                  } p-3`}
                >
                  {msg.content_type === "text" && (
                    <>
                      <p className="text-sm">{msg.text_content}</p>
                      <div
                        className={`text-xs mt-1 ${
                          isOwnMessage ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isOwnMessage && " ✔️✔️"}
                      </div>
                    </>
                  )}
                  {msg.content_type === "file" && msg.attachment_meta && (
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} />
                      <span className="text-sm">{msg.attachment_meta.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 bg-gray-950 p-4">
        <div className="flex items-center gap-2">
          <button className="hover:bg-gray-800 p-2 rounded">
            <Plus size={24} />
          </button>
          <input
            type="text"
            placeholder="Écrivez votre message... 😉"
            value={inputMessage}
            onChange={onInputChange}
            onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button className="hover:bg-gray-800 p-2 rounded">
            <Smile size={24} />
          </button>
          <button className="hover:bg-gray-800 p-2 rounded">
            <Mic size={24} />
          </button>
          <button
            onClick={onSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 p-2 rounded"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
