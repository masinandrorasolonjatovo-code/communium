'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  Archive,
  Bell,
  BellOff,
  Building2,
  Bookmark,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  Copy,
  Crown,
  Download,
  Edit3,
  FileAudio,
  FileText,
  FolderOpen,
  Forward,
  ImagePlus,
  Link as LinkIcon,
  MessageCircle,
  Mic,
  MoreVertical,
  Paperclip,
  Pause,
  Phone,
  Pin,
  Play,
  Plus,
  Reply,
  Search,
  Send,
  Shield,
  Smile,
  Square,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/i18n.config';

type ConversationFilter = 'all' | 'unread' | 'favorites' | 'archived' | 'groups' | 'network' | 'companies';
type PanelTab = 'details' | 'photos' | 'videos' | 'documents' | 'links' | 'audio' | 'search' | 'settings';
type SearchScope = 'text' | 'files' | 'photos' | 'links' | 'important';

interface SocketLike {
  on(event: string, callback: (payload: any) => void): void;
  off(event: string, callback?: (payload: any) => void): void;
  emit(event: string, payload?: any): void;
  disconnect(): void;
}

declare global {
  interface Window {
    io?: (url?: string, options?: Record<string, unknown>) => SocketLike;
  }
}

interface CurrentUser {
  id: number;
  username?: string;
  email?: string;
  accountType?: string;
}

interface Member {
  id: number;
  username?: string;
  email?: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  role?: string | null;
  accountType?: string;
  profilePictureUrl?: string | null;
  publicProfileUrl?: string | null;
  online?: boolean;
  membership?: {
    role?: string;
    permissions?: Record<string, boolean>;
    notificationsEnabled?: boolean;
    pinned?: boolean;
    archived?: boolean;
    mutedUntil?: string | null;
    unreadCount?: number;
  };
}

interface Attachment {
  id: string;
  messageId?: string | null;
  conversationId?: string | null;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
  fileSize: number;
  category: string;
  uploadProgress: number;
  createdAt?: string | null;
}

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: number;
  body: string;
  messageType: string;
  status: string;
  replyTo?: string | null;
  editedAt?: string | null;
  deletedForEveryoneAt?: string | null;
  ephemeralMode?: string;
  expiresAt?: string | null;
  readOnce?: boolean;
  reactions: Array<{ userId: number; emoji: string; at?: string }>;
  savedBy: number[];
  pinnedBy?: number[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt?: string | null;
}

interface SharedMedia {
  photos: Attachment[];
  videos: Attachment[];
  documents: Attachment[];
  links: Array<{ id: string; messageId: string; url: string; createdAt?: string | null }>;
  audio: Attachment[];
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  themeColor: string;
  background: string;
  ephemeralMode: string;
  isEncrypted: boolean;
  pinned: boolean;
  archived: boolean;
  mutedUntil?: string | null;
  notificationsEnabled: boolean;
  unreadCount: number;
  myRole?: string;
  members: Member[];
  lastMessage?: MessageItem | null;
  lastMessageAt?: string | null;
}

interface SearchResult {
  conversationTitle: string;
  message: MessageItem;
}

interface PendingFile {
  id: string;
  file: File;
  progress: number;
  previewUrl?: string;
}

const filterLabels: Record<Locale, Record<ConversationFilter, string>> = {
  fr: {
    all: 'Tous',
    unread: 'Non lus',
    favorites: 'Favoris',
    archived: 'Archives',
    groups: 'Groupes',
    network: 'Reseau',
    companies: 'Entreprises',
  },
  en: {
    all: 'All',
    unread: 'Unread',
    favorites: 'Favorites',
    archived: 'Archived',
    groups: 'Groups',
    network: 'Network',
    companies: 'Companies',
  },
  ar: {
    all: 'All',
    unread: 'Unread',
    favorites: 'Favorites',
    archived: 'Archived',
    groups: 'Groups',
    network: 'Network',
    companies: 'Companies',
  },
  es: {} as Record<ConversationFilter, string>,
  de: {} as Record<ConversationFilter, string>,
  zh: {} as Record<ConversationFilter, string>,
  ja: {} as Record<ConversationFilter, string>,
  pt: {} as Record<ConversationFilter, string>,
  ru: {} as Record<ConversationFilter, string>,
};

const reactionChoices = [
  '\u{1F44D}',
  '\u{1F44E}',
  '\u{2764}\u{FE0F}',
  '\u{1F499}',
  '\u{1F525}',
  '\u{1F602}',
  '\u{1F605}',
  '\u{1F60A}',
  '\u{1F60D}',
  '\u{1F62E}',
  '\u{1F622}',
  '\u{1F621}',
  '\u{1F973}',
  '\u{1F44F}',
  '\u{1F64C}',
  '\u{1F64F}',
  '\u{1F44C}',
  '\u{2705}',
  '\u{274C}',
  '\u{2B50}',
  '\u{1F4AF}',
  '\u{2728}',
  '\u{1F680}',
  '\u{1F4AA}',
  '\u{1F91D}',
  '\u{1F440}',
  '\u{1F9E0}',
  '\u{1F4A1}',
  '\u{1F4CC}',
  '\u{1F4CE}',
  '\u{1F4C4}',
  '\u{1F4F7}',
  '\u{1F3A5}',
  '\u{1F3A7}',
  '\u{1F4DE}',
  '\u{1F4AC}',
  '\u{23F3}',
  '\u{26A1}',
  '\u{1F3AF}',
  '\u{1F3C6}',
  '\u{1F4BC}',
  '\u{1F4C5}',
  '\u{1F4CD}',
  '\u{1F512}',
  '\u{1F514}',
  '\u{1F30D}',
  '\u{2615}',
  '\u{1F381}',
];
const richReactionChoices = [
  ...reactionChoices,
  '\u{1F4DD}',
  '\u{1F4CA}',
  '\u{1F517}',
  '\u{1F4B0}',
  '\u{1F6E0}\u{FE0F}',
  '\u{1F393}',
  '\u{1F4DA}',
  '\u{1F9E9}',
  '\u{1F5C2}\u{FE0F}',
  '\u{1F929}',
  '\u{1F60E}',
  '\u{1F914}',
  '\u{1F60C}',
  '\u{1F609}',
  '\u{1F31F}',
];
const quickMessageChoices = [
  '\u{1F44D} Merci, je regarde.',
  '\u{2705} Parfait pour moi.',
  '\u{1F4C4} Je vous envoie le document.',
  '\u{1F4AC} Disponible pour en discuter.',
  '\u{1F680} Je m en occupe.',
  '\u{23F0} Je reviens vite vers vous.',
];
const searchScopes: Array<{ value: SearchScope; label: string }> = [
  { value: 'text', label: 'Texte' },
  { value: 'files', label: 'Fichiers' },
  { value: 'photos', label: 'Photos' },
  { value: 'links', label: 'Liens' },
  { value: 'important', label: 'Importants' },
];
const themeChoices = ['#1d4ed8', '#0f8b8d', '#7c3aed', '#be123c', '#166534', '#0f172a'];
const backgroundChoices = ['clean', 'soft', 'focus', 'dark'];
const voicePlaybackHeights = [18, 24, 13, 30, 22, 16, 28, 12, 20, 26, 15, 32, 18, 24, 14, 27, 20, 12, 30, 22, 16, 25];
const voiceRecordingFallbackHeights = Array.from({ length: 28 }, (_, index) => 10 + ((index * 7) % 22));
const ephemeralChoices = [
  { value: 'off', label: 'Desactive' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 jours' },
  { value: 'read_once', label: 'Lecture unique' },
];

function t(locale: Locale, fr: string, en: string) {
  return locale === 'fr' ? fr : en;
}

function labelForFilter(locale: Locale, filter: ConversationFilter) {
  return (filterLabels[locale]?.[filter] || filterLabels.en[filter]) as string;
}

function formatTime(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatVoiceDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function absoluteAssetUrl(fileUrl?: string | null) {
  if (!fileUrl) {
    return '';
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
}

function formatBytes(bytes: number) {
  if (!bytes) {
    return '0 Ko';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function VoiceAttachment({ src, fileName, own }: { src: string; fileName: string; own: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const visibleTime = playing ? currentTime : duration || currentTime;

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    await audio.play();
    setPlaying(true);
  };

  return (
    <div className={own ? 'voiceBubble own' : 'voiceBubble'}>
      <button type="button" className="voicePlayButton" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Lecture'}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="voiceWave playback" style={{ ['--voice-progress' as string]: `${progress}%` }} aria-hidden="true">
        {voicePlaybackHeights.map((height, index) => (
          <span key={index} style={{ height: `${height}px` }} />
        ))}
      </div>
      <span className="voiceDuration">{formatVoiceDuration(visibleTime)}</span>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        aria-label={fileName}
        onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
      />
    </div>
  );
}

function friendlyNetworkError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Connexion au serveur impossible. Reessayez dans un instant.';
  }
  return message || fallback;
}

function loadSocketScript() {
  if (typeof window === 'undefined' || window.io) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-communium-socket]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Socket.IO client unavailable')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.async = true;
    script.dataset.communiumSocket = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Socket.IO client unavailable'));
    document.head.appendChild(script);
  });
}

export default function ProfessionalMessagesWorkspace({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();
  const socketRef = useRef<SocketLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messageStreamRef = useRef<HTMLDivElement | null>(null);
  const streamEndRef = useRef<HTMLDivElement | null>(null);
  const composerDockRef = useRef<HTMLElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const recordingAudioContextRef = useRef<AudioContext | null>(null);
  const recordingAnalyserFrameRef = useRef<number | null>(null);
  const recordingStopModeRef = useRef<'attach' | 'send' | 'discard'>('attach');
  const localCallStreamRef = useRef<MediaStream | null>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [media, setMedia] = useState<SharedMedia>({ photos: [], videos: [], documents: [], links: [], audio: [] });
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [conversationQuery, setConversationQuery] = useState('');
  const [discussionQuery, setDiscussionQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('text');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [panelTab, setPanelTab] = useState<PanelTab>('details');
  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageItem | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [openMessageMenuId, setOpenMessageMenuId] = useState('');
  const [openReactionPickerId, setOpenReactionPickerId] = useState('');
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMembers, setGroupMembers] = useState<number[]>([]);
  const [groupManageQuery, setGroupManageQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingLevels, setRecordingLevels] = useState<number[]>(voiceRecordingFallbackHeights);
  const [callMode, setCallMode] = useState<'audio' | 'video' | ''>('');
  const [mobilePanel, setMobilePanel] = useState<'list' | 'chat'>('list');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) || null;
  const requestedConversationId = searchParams.get('conversation') || searchParams.get('conversationId') || '';
  const otherMembers = selectedConversation?.members.filter((member) => member.id !== currentUser?.id) || [];
  const activeContact = otherMembers[0] || selectedConversation?.members[0] || null;
  const filters: ConversationFilter[] = ['all', 'unread', 'favorites', 'archived', 'groups', 'network', 'companies'];
  const currentMembership = selectedConversation?.members.find((member) => member.id === currentUser?.id)?.membership;
  const canManageGroup = Boolean(
    selectedConversation?.type === 'group' &&
      (selectedConversation.myRole === 'owner' ||
        selectedConversation.myRole === 'admin' ||
        currentMembership?.permissions?.manage),
  );

  const visibleConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesFilter =
        filter === 'all'
          ? !conversation.archived
          : filter === 'unread'
            ? conversation.unreadCount > 0 && !conversation.archived
            : filter === 'favorites'
              ? conversation.pinned && !conversation.archived
              : filter === 'archived'
                ? conversation.archived
                : filter === 'groups'
                  ? conversation.type === 'group' && !conversation.archived
                  : filter === 'companies'
                    ? conversation.members.some((member) => member.accountType === 'BUSINESS') && !conversation.archived
                    : conversation.type === 'direct' && !conversation.archived;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [conversation.title, conversation.subtitle, conversation.lastMessage?.body]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [conversationQuery, conversations, filter]);

  const unreadTotal = conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);
  const recentConversations = conversations.filter((conversation) => !conversation.archived).slice(0, 4);
  const availableGroupMembers = useMemo(() => {
    if (!selectedConversation) {
      return [];
    }

    const existingIds = new Set(selectedConversation.members.map((member) => member.id));
    const query = groupManageQuery.trim().toLowerCase();

    return suggestions
      .filter((member) => !existingIds.has(member.id))
      .filter((member) =>
        query
          ? [member.fullName, member.role, member.company, member.email].filter(Boolean).join(' ').toLowerCase().includes(query)
          : true,
      )
      .slice(0, 8);
  }, [groupManageQuery, selectedConversation, suggestions]);

  async function authHeaders(json = true) {
    const token = await getToken();
    const headers = new Headers();

    if (json) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (user?.fullName) {
      headers.set('x-user-name', user.fullName);
    }

    if (user?.primaryEmailAddress?.emailAddress) {
      headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
    }

    if (user?.username) {
      headers.set('x-user-username', user.username);
    }

    return headers;
  }

  async function apiFetch(path: string, init: RequestInit = {}) {
    const headers = await authHeaders(!(init.body instanceof FormData));
    const requestHeaders = new Headers(init.headers || {});

    headers.forEach((value, key) => {
      if (!requestHeaders.has(key)) {
        requestHeaders.set(key, value);
      }
    });

    const response = await fetch(`/api/messages${path}`, {
      ...init,
      headers: requestHeaders,
      cache: 'no-store',
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok || body?.success === false) {
      throw new Error(body?.error || t(locale, 'Action impossible', 'Action failed'));
    }

    return body;
  }

  async function loadConversations(nextFilter = filter) {
    const params = new URLSearchParams({ filter: nextFilter });
    if (conversationQuery.trim()) {
      params.set('q', conversationQuery.trim());
    }

    const body = await apiFetch(`/conversations?${params.toString()}`);
    const nextConversations = body.conversations || [];
    setCurrentUser(body.currentUser);
    setConversations(nextConversations);
    setSuggestions(body.suggestions || []);

    if (requestedConversationId && nextConversations.some((conversation: Conversation) => conversation.id === requestedConversationId)) {
      setSelectedId(requestedConversationId);
      setMobilePanel('chat');
    } else if (selectedId && !nextConversations.some((conversation: Conversation) => conversation.id === selectedId)) {
      setSelectedId('');
      setMobilePanel('list');
    }
  }

  async function loadConversation(conversationId: string) {
    if (!conversationId) {
      return;
    }

    const body = await apiFetch(`/${conversationId}`);
    setMessages(body.messages || []);
    setMedia(body.media || { photos: [], videos: [], documents: [], links: [], audio: [] });
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, ...body.conversation } : conversation,
      ),
    );
    await apiFetch('/read', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        messageId: body.messages?.at?.(-1)?.id || null,
      }),
    }).catch(() => undefined);
  }

  useEffect(() => {
    if (!authLoaded) {
      return;
    }

    setLoading(true);
    loadConversations()
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    setShowOptions(false);
    setOpenMessageMenuId('');
    setOpenReactionPickerId('');
    setPanelTab('details');
    loadConversation(selectedId).catch((error) => setNotice(error.message));
    socketRef.current?.emit('conversation:join', selectedId);

    return () => {
      socketRef.current?.emit('conversation:leave', selectedId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const stream = messageStreamRef.current;
    if (!stream) return;
    window.requestAnimationFrame(() => {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [messages.length, selectedId]);

  useEffect(() => {
    const stream = messageStreamRef.current;
    const dock = composerDockRef.current;
    const surface = dock?.closest('.chatSurface') as HTMLElement | null;

    if (!stream || !dock || !surface) {
      return;
    }

    const updateComposerClearance = () => {
      const nearBottom = stream.scrollHeight - stream.scrollTop - stream.clientHeight < 180;
      const nextClearance = Math.ceil(dock.getBoundingClientRect().height) + 32;
      surface.style.setProperty('--composer-clearance', `${nextClearance}px`);

      if (nearBottom) {
        window.requestAnimationFrame(() => {
          streamEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        });
      }
    };

    updateComposerClearance();
    window.addEventListener('resize', updateComposerClearance);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', updateComposerClearance);
    }

    const observer = new ResizeObserver(updateComposerClearance);
    observer.observe(dock);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateComposerClearance);
    };
  }, [selectedId, replyTo, editingMessage, forwardingMessage, pendingFiles.length, showEmojiBar, recording]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recordingAnalyserFrameRef.current) {
        window.cancelAnimationFrame(recordingAnalyserFrameRef.current);
      }
      void recordingAudioContextRef.current?.close();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    let disposed = false;

    loadSocketScript()
      .then(() => {
        if (disposed || !window.io) {
          return;
        }

        const socketOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin;
        const socket = window.io(socketOrigin, {
          path: '/socket.io',
          transports: ['polling', 'websocket'],
          auth: { userId: currentUser.id },
        });

        socketRef.current = socket;

        socket.on('message:new', (payload) => {
          if (payload?.message?.conversationId === selectedId) {
            setMessages((current) =>
              current.some((message) => message.id === payload.message.id) ? current : [...current, payload.message],
            );
          }

          loadConversations().catch(() => undefined);
          if (soundEnabled) {
            playNotificationSound();
          }

          if (notificationsEnabled && payload?.message?.body) {
            showBrowserNotification(payload.message.body);
          }
        });

        socket.on('message:updated', (payload) => {
          setMessages((current) =>
            current.map((message) => (message.id === payload?.message?.id ? payload.message : message)),
          );
        });

        socket.on('message:deleted', (payload) => {
          if (payload?.scope === 'everyone') {
            setMessages((current) =>
              current.map((message) =>
                message.id === payload.messageId ? { ...message, body: '', deletedForEveryoneAt: new Date().toISOString() } : message,
              ),
            );
          } else if (payload?.userId === currentUser.id) {
            setMessages((current) => current.filter((message) => message.id !== payload.messageId));
          }
        });

        socket.on('message:read', () => {
          setMessages((current) => current.map((message) => ({ ...message, status: 'read' })));
        });

        socket.on('presence:update', (payload) => {
          setConversations((current) =>
            current.map((conversation) => ({
              ...conversation,
              members: conversation.members.map((member) =>
                Number(member.id) === Number(payload?.userId) ? { ...member, online: Boolean(payload?.online) } : member,
              ),
            })),
          );
        });

        socket.on('message:typing', (payload) => {
          if (payload?.conversationId !== selectedId || payload.userId === currentUser.id) {
            return;
          }

          setTypingUsers((current) =>
            payload.typing ? [...new Set([...current, Number(payload.userId)])] : current.filter((id) => id !== Number(payload.userId)),
          );
        });

        socket.on('conversation:created', () => loadConversations().catch(() => undefined));
        socket.on('conversation:updated', () => {
          loadConversations().catch(() => undefined);
          if (selectedId) {
            loadConversation(selectedId).catch(() => undefined);
          }
        });
      })
      .catch(() => setNotice(t(locale, 'Temps reel indisponible pour le moment.', 'Realtime is unavailable right now.')));

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, selectedId, soundEnabled, notificationsEnabled]);

  function playNotificationSound() {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 740;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
  }

  function showBrowserNotification(message: string) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    new Notification('Communium Messages', {
      body: message,
      icon: '/communium_logo.svg',
    });
  }

  async function requestNotifications() {
    if (typeof Notification === 'undefined') {
      setNotice(t(locale, 'Notifications navigateur non disponibles.', 'Browser notifications are unavailable.'));
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  }

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      previewUrl: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined,
    }));
    setPendingFiles((current) => [...current, ...incoming].slice(0, 8));
  }

  function removePendingFile(id: string) {
    setPendingFiles((current) => {
      const item = current.find((file) => file.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return current.filter((file) => file.id !== id);
    });
  }

  async function uploadFiles(conversationId: string, files: File[]) {
    if (!files.length) {
      return [];
    }

    const token = await getToken();
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    files.forEach((file) => formData.append('files', file));

    return new Promise<Attachment[]>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/messages/upload', true);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (user?.fullName) {
        xhr.setRequestHeader('x-user-name', user.fullName);
      }

      if (user?.primaryEmailAddress?.emailAddress) {
        xhr.setRequestHeader('x-user-email', user.primaryEmailAddress.emailAddress);
      }

      if (files.length === pendingFiles.length) {
        xhr.upload.onprogress = (event) => {
          const progress = event.lengthComputable ? Math.round((event.loaded / event.total) * 100) : 65;
          setPendingFiles((current) => current.map((item) => ({ ...item, progress })));
        };
      }

      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300 && body.success) {
            resolve(body.attachments || []);
          } else {
            reject(new Error(body.error || t(locale, 'Upload impossible', 'Upload failed')));
          }
        } catch (error) {
          reject(error);
        }
      };

      xhr.onerror = () => reject(new Error(t(locale, 'Upload impossible', 'Upload failed')));
      xhr.send(formData);
    });
  }

  async function uploadPendingFiles(conversationId: string) {
    return uploadFiles(
      conversationId,
      pendingFiles.map((item) => item.file),
    );
  }

  async function sendMessage() {
    if (!selectedConversation || sending) {
      return;
    }

    const value = draft.trim();
    if (!value && pendingFiles.length === 0) {
      return;
    }

    setSending(true);
    try {
      if (editingMessage) {
        const body = await apiFetch(`/${editingMessage.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'edit', body: value }),
        });
        setMessages((current) => current.map((message) => (message.id === editingMessage.id ? body.message : message)));
        setEditingMessage(null);
        setDraft('');
        return;
      }

      const uploaded = await uploadPendingFiles(selectedConversation.id);
      const body = await apiFetch('/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          body: value,
          attachmentIds: uploaded.map((item) => item.id),
          replyTo: replyTo?.id || null,
          ephemeralMode: selectedConversation.ephemeralMode,
          messageType: uploaded.some((item) => item.category === 'voice' || item.mimeType?.startsWith('audio/')) ? 'voice' : undefined,
        }),
      });
      setMessages((current) => (current.some((message) => message.id === body.message.id) ? current : [...current, body.message]));
      setDraft('');
      setPendingFiles([]);
      setReplyTo(null);
      await loadConversations();
    } catch (error) {
      setNotice(friendlyNetworkError(error, t(locale, 'Envoi impossible', 'Send failed')));
    } finally {
      setSending(false);
    }
  }

  async function selectConversation(conversationId: string) {
    setSelectedId(conversationId);
    setMobilePanel('chat');
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    );
  }

  async function createDirectConversation(memberId: number) {
    try {
      const body = await apiFetch('/conversations', {
        method: 'POST',
        body: JSON.stringify({ type: 'direct', participantIds: [memberId] }),
      });
      await loadConversations();
      setSelectedId(body.conversation.id);
      setMobilePanel('chat');
    } catch (error) {
      setNotice(friendlyNetworkError(error, t(locale, 'Conversation impossible', 'Conversation failed')));
    }
  }

  async function createGroupConversation() {
    if (groupMembers.length < 2) {
      setNotice(t(locale, 'Selectionnez au moins deux membres.', 'Select at least two members.'));
      return;
    }

    try {
      const body = await apiFetch('/conversations', {
        method: 'POST',
        body: JSON.stringify({
          type: 'group',
          title: groupTitle.trim() || t(locale, 'Groupe Communium', 'Communium group'),
          participantIds: groupMembers,
        }),
      });
      setShowGroupDialog(false);
      setGroupMembers([]);
      setGroupTitle('');
      await loadConversations();
      setSelectedId(body.conversation.id);
      setMobilePanel('chat');
    } catch (error) {
      setNotice(friendlyNetworkError(error, t(locale, 'Creation impossible', 'Creation failed')));
    }
  }

  async function togglePin(conversation = selectedConversation) {
    if (!conversation) {
      return;
    }

    const body = await apiFetch('/pin', {
      method: 'POST',
      body: JSON.stringify({ conversationId: conversation.id, pinned: !conversation.pinned }),
    });
    setConversations((current) => current.map((item) => (item.id === conversation.id ? body.conversation : item)));
  }

  async function toggleArchive(conversation = selectedConversation) {
    if (!conversation) {
      return;
    }

    const body = await apiFetch('/archive', {
      method: 'POST',
      body: JSON.stringify({ conversationId: conversation.id, archived: !conversation.archived }),
    });
    setConversations((current) => current.map((item) => (item.id === conversation.id ? body.conversation : item)));
    if (!conversation.archived && selectedId === conversation.id) {
      setSelectedId('');
      setMobilePanel('list');
    }
  }

  async function toggleMute() {
    if (!selectedConversation) {
      return;
    }

    const muted = !selectedConversation.mutedUntil;
    const body = await apiFetch('/mute', {
      method: 'POST',
      body: JSON.stringify({ conversationId: selectedConversation.id, muted, hours: 24 * 365 }),
    });
    setConversations((current) => current.map((item) => (item.id === selectedConversation.id ? body.conversation : item)));
  }

  async function updateTheme(themeColor = selectedConversation?.themeColor, background = selectedConversation?.background, ephemeralMode = selectedConversation?.ephemeralMode) {
    if (!selectedConversation) {
      return;
    }

    const body = await apiFetch(`/conversations/${selectedConversation.id}/theme`, {
      method: 'POST',
      body: JSON.stringify({ themeColor, background, ephemeralMode }),
    });
    setConversations((current) => current.map((item) => (item.id === selectedConversation.id ? body.conversation : item)));
  }

  async function deleteConversation() {
    if (!selectedConversation) {
      return;
    }

    await apiFetch('/delete-conversation', {
      method: 'POST',
      body: JSON.stringify({ conversationId: selectedConversation.id }),
    });
    setSelectedId('');
    setMobilePanel('list');
    await loadConversations('all');
  }

  async function blockActiveUser() {
    if (!selectedConversation || !activeContact) {
      return;
    }

    await apiFetch('/block', {
      method: 'POST',
      body: JSON.stringify({ conversationId: selectedConversation.id, userId: activeContact.id }),
    });
    setNotice(t(locale, 'Utilisateur bloque.', 'User blocked.'));
    await loadConversations();
  }

  async function reportConversation() {
    if (!selectedConversation) {
      return;
    }

    await apiFetch('/report', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: selectedConversation.id,
        reason: t(locale, 'Signalement depuis la messagerie', 'Report from messages'),
      }),
    });
    setNotice(t(locale, 'Signalement envoye.', 'Report sent.'));
  }

  function profileHref(member?: Member | null) {
    if (!member) {
      return '';
    }

    if (member.username) {
      return `/${locale}/u/${member.username}`;
    }

    if (member.publicProfileUrl) {
      return `/${locale}/profile/${member.publicProfileUrl}`;
    }

    return '';
  }

  function openActiveProfile() {
    const href = profileHref(activeContact);

    if (!href) {
      setNotice(t(locale, 'Profil indisponible pour ce contact.', 'Profile unavailable for this contact.'));
      return;
    }

    window.location.href = href;
  }

  function applyConversationUpdate(conversation: Conversation) {
    setConversations((current) => current.map((item) => (item.id === conversation.id ? conversation : item)));
  }

  async function addGroupMember(memberId: number) {
    if (!selectedConversation) {
      return;
    }

    try {
      const body = await apiFetch(`/groups/${selectedConversation.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userIds: [memberId] }),
      });
      applyConversationUpdate(body.conversation);
      await loadConversation(selectedConversation.id);
    } catch (error) {
      setNotice(friendlyNetworkError(error, t(locale, 'Ajout impossible', 'Cannot add member')));
    }
  }

  async function updateGroupMemberRole(member: Member, role: 'admin' | 'member') {
    if (!selectedConversation) {
      return;
    }

    try {
      const body = await apiFetch(`/groups/${selectedConversation.id}/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      applyConversationUpdate(body.conversation);
      await loadConversation(selectedConversation.id);
    } catch (error) {
      setNotice(friendlyNetworkError(error, t(locale, 'Role impossible', 'Cannot update role')));
    }
  }

  async function removeGroupMember(member: Member) {
    if (!selectedConversation) {
      return;
    }

    try {
      const body = await apiFetch(`/groups/${selectedConversation.id}/members/${member.id}`, {
        method: 'DELETE',
      });
      applyConversationUpdate(body.conversation);
      await loadConversation(selectedConversation.id);
    } catch (error) {
      setNotice(friendlyNetworkError(error, t(locale, 'Retrait impossible', 'Cannot remove member')));
    }
  }

  async function patchMessage(message: MessageItem, action: string, extra: Record<string, unknown> = {}) {
    const body = await apiFetch(`/${message.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, ...extra }),
    });
    setMessages((current) => current.map((item) => (item.id === message.id ? body.message : item)));
  }

  async function deleteMessage(message: MessageItem, scope: 'me' | 'everyone') {
    await apiFetch(`/${message.id}`, {
      method: 'DELETE',
      body: JSON.stringify({ scope }),
    });

    if (scope === 'me') {
      setMessages((current) => current.filter((item) => item.id !== message.id));
    } else {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, body: '', deletedForEveryoneAt: new Date().toISOString() } : item,
        ),
      );
    }
  }

  async function forwardMessage(toConversationId: string) {
    if (!forwardingMessage) {
      return;
    }

    await patchMessage(forwardingMessage, 'forward', { toConversationId });
    setForwardingMessage(null);
    setNotice(t(locale, 'Message transfere.', 'Message forwarded.'));
  }

  async function searchDiscussion() {
    if (!selectedConversation) {
      return;
    }

    const params = new URLSearchParams({ conversationId: selectedConversation.id, q: discussionQuery, type: searchScope });
    const body = await apiFetch(`/search?${params.toString()}`);
    setSearchResults(body.results || []);
  }

  function resetVoiceRecorder() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recordingAnalyserFrameRef.current) {
      window.cancelAnimationFrame(recordingAnalyserFrameRef.current);
      recordingAnalyserFrameRef.current = null;
    }
    void recordingAudioContextRef.current?.close();
    recordingAudioContextRef.current = null;
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    mediaRecorderRef.current = null;
    recordingChunksRef.current = [];
    setRecording(false);
    setRecordingSeconds(0);
    setRecordingLevels(voiceRecordingFallbackHeights);
  }

  function startRecordingMeter(stream: MediaStream) {
    const AudioContextCtor =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      setRecordingLevels(voiceRecordingFallbackHeights);
      return;
    }

    const audioContext = new AudioContextCtor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    recordingAudioContextRef.current = audioContext;

    const samples = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(samples);
      const bucketSize = Math.max(1, Math.floor(samples.length / voiceRecordingFallbackHeights.length));
      const nextLevels = voiceRecordingFallbackHeights.map((_, index) => {
        const start = index * bucketSize;
        const end = Math.min(samples.length, start + bucketSize);
        let peak = 0;
        for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
          peak = Math.max(peak, Math.abs(samples[sampleIndex] - 128));
        }
        return Math.round(8 + Math.min(1, peak / 42) * 30);
      });
      setRecordingLevels(nextLevels);
      recordingAnalyserFrameRef.current = window.requestAnimationFrame(tick);
    };

    tick();
  }

  async function sendVoiceFile(file: File) {
    if (!selectedConversation || sending) {
      addFiles([file]);
      return;
    }

    setSending(true);
    try {
      const uploaded = await uploadFiles(selectedConversation.id, [file]);
      const body = await apiFetch('/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          body: '',
          attachmentIds: uploaded.map((item) => item.id),
          replyTo: replyTo?.id || null,
          ephemeralMode: selectedConversation.ephemeralMode,
          messageType: 'voice',
        }),
      });
      setMessages((current) => (current.some((message) => message.id === body.message.id) ? current : [...current, body.message]));
      setReplyTo(null);
      await loadConversations();
    } catch (error) {
      setNotice(friendlyNetworkError(error, t(locale, 'Vocal impossible a envoyer', 'Voice message failed')));
      addFiles([file]);
    } finally {
      setSending(false);
    }
  }

  function stopVoiceRecording(mode: 'attach' | 'send' | 'discard' = 'attach') {
    if (!recording || !mediaRecorderRef.current) {
      return;
    }

    recordingStopModeRef.current = mode;
    mediaRecorderRef.current.stop();
  }

  async function startVoiceRecording() {
    if (recording) {
      stopVoiceRecording('attach');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recordingStreamRef.current = stream;
      recordingStopModeRef.current = 'attach';
      startRecordingMeter(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size) {
          recordingChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const mode = recordingStopModeRef.current;
        const chunks = recordingChunksRef.current;
        resetVoiceRecorder();

        if (mode === 'discard' || !chunks.length) {
          return;
        }

        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

        if (mode === 'send') {
          void sendVoiceFile(file);
          return;
        }

        addFiles([file]);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch {
      setNotice(t(locale, 'Micro indisponible.', 'Microphone unavailable.'));
    }
  }

  async function startCall(mode: 'audio' | 'video') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });
      localCallStreamRef.current = stream;
      setCallMode(mode);
    } catch {
      setNotice(t(locale, 'Appel impossible sans permission micro/camera.', 'Call requires microphone/camera permission.'));
    }
  }

  function endCall() {
    localCallStreamRef.current?.getTracks().forEach((track) => track.stop());
    localCallStreamRef.current = null;
    setCallMode('');
  }

  function handleTyping(value: string) {
    setDraft(value);
    socketRef.current?.emit('message:typing', { conversationId: selectedId, typing: true });
    window.setTimeout(() => socketRef.current?.emit('message:typing', { conversationId: selectedId, typing: false }), 1200);
  }

  function renderAvatar(name: string, url?: string | null, large = false) {
    return (
      <span className={large ? 'msgAvatar large' : 'msgAvatar'}>
        {url ? <img src={absoluteAssetUrl(url)} alt={name} /> : <span>{initials(name)}</span>}
      </span>
    );
  }

  function renderAttachment(attachment: Attachment, own = false) {
    const url = absoluteAssetUrl(attachment.fileUrl);

    if (attachment.category === 'image' || attachment.category === 'gif') {
      return <img src={url} alt={attachment.fileName} className="messageImage" />;
    }

    if (attachment.category === 'video') {
      return <video src={url} controls className="messageVideo" />;
    }

    if (attachment.category === 'audio' || attachment.mimeType?.startsWith('audio/')) {
      return <VoiceAttachment src={url} fileName={attachment.fileName} own={own} />;
    }

    return (
      <a href={url} target="_blank" rel="noreferrer" className="fileAttachment">
        <FileText size={18} />
        <span>
          <strong>{attachment.fileName}</strong>
          <small>{formatBytes(attachment.fileSize)}</small>
        </span>
        <Download size={16} />
      </a>
    );
  }

  const pageClass = `professionalMessagesPage bg-${selectedConversation?.background || 'clean'} ${mobilePanel === 'chat' ? 'chatOpen' : ''}`;

  return (
    <div className={pageClass}>
      {notice ? (
        <div className="messagesNotice">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
      ) : null}

      <main className="messagesApp" style={{ ['--chat-accent' as string]: selectedConversation?.themeColor || '#1d4ed8' }}>
        <aside className="conversationSidebar">
          <div className="messagesTopbar">
            <div>
              <h1>Messages</h1>
              <p>{unreadTotal ? `${unreadTotal} ${t(locale, 'non lus', 'unread')}` : t(locale, 'Boite a jour', 'Inbox clear')}</p>
            </div>
            <button type="button" className="iconButton primaryIcon" onClick={() => setShowGroupDialog(true)} title="Nouveau groupe">
              <Plus size={18} />
            </button>
          </div>

          <label className="conversationSearch">
            <Search size={17} />
            <input
              value={conversationQuery}
              onChange={(event) => setConversationQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  loadConversations().catch((error) => setNotice(error.message));
                }
              }}
              placeholder={t(locale, 'Rechercher une conversation', 'Search conversations')}
            />
          </label>

          <div className="filterRail" role="tablist" aria-label="Filtres conversations">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? 'filterChip active' : 'filterChip'}
                onClick={() => {
                  setFilter(item);
                  loadConversations(item).catch((error) => setNotice(error.message));
                }}
              >
                {labelForFilter(locale, item)}
              </button>
            ))}
          </div>

          <div className="conversationList">
            {loading ? (
              <div className="listState">{t(locale, 'Chargement...', 'Loading...')}</div>
            ) : visibleConversations.length ? (
              visibleConversations.map((conversation) => {
                const contact = conversation.members.find((member) => member.id !== currentUser?.id) || conversation.members[0];
                const muted = Boolean(conversation.mutedUntil);
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={selectedId === conversation.id ? 'conversationItem active' : 'conversationItem'}
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <span className="avatarWrap">
                      {renderAvatar(conversation.title, conversation.avatarUrl)}
                      {contact?.online ? <span className="presenceDot" /> : null}
                    </span>
                    <span className="conversationPreview">
                      <span className="conversationLine">
                        <strong>{conversation.title}</strong>
                        <small>{formatTime(conversation.lastMessageAt)}</small>
                      </span>
                      <span className="conversationMeta">
                        {conversation.type === 'group' ? (
                          <Users size={13} />
                        ) : conversation.members.some((member) => member.accountType === 'BUSINESS') ? (
                          <Building2 size={13} />
                        ) : (
                          <BriefcaseBusiness size={13} />
                        )}
                        {conversation.subtitle || t(locale, 'Conversation professionnelle', 'Professional conversation')}
                      </span>
                      <span className="lastMessage">
                        {conversation.lastMessage?.deletedForEveryoneAt
                          ? t(locale, 'Message supprime', 'Deleted message')
                          : conversation.lastMessage?.body || t(locale, 'Aucun message pour le moment', 'No messages yet')}
                      </span>
                    </span>
                    <span className="conversationBadges">
                      {conversation.pinned ? <Pin size={14} /> : null}
                      {muted ? <BellOff size={14} /> : null}
                      {conversation.archived ? <Archive size={14} /> : null}
                      {conversation.unreadCount ? <strong>{conversation.unreadCount}</strong> : null}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="listState">
                <FolderOpen size={22} />
                <span>{t(locale, 'Aucune conversation dans ce filtre.', 'No conversations in this filter.')}</span>
              </div>
            )}
          </div>
        </aside>

        <section
          className="chatSurface"
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (event.dataTransfer.files.length) {
              addFiles(event.dataTransfer.files);
            }
          }}
        >
          {selectedConversation ? (
            <>
              <header className="chatHeader">
                <button type="button" className="mobileBack" onClick={() => setMobilePanel('list')}>
                  <X size={16} />
                </button>
                <div className="chatIdentity">
                  {renderAvatar(selectedConversation.title, selectedConversation.avatarUrl, true)}
                  <div>
                    <strong>{selectedConversation.title}</strong>
                    <span>
                      {activeContact?.online
                        ? t(locale, 'En ligne', 'Online')
                        : selectedConversation.subtitle || t(locale, 'Reseau professionnel', 'Professional network')}
                    </span>
                    {activeContact?.company || activeContact?.role ? (
                      <small>{[activeContact.role, activeContact.company].filter(Boolean).join(' - ')}</small>
                    ) : null}
                  </div>
                </div>

                <div className="chatHeaderActions">
                  <button type="button" className="iconButton" onClick={() => startCall('audio')} title="Appel">
                    <Phone size={18} />
                  </button>
                  <button type="button" className="iconButton" onClick={() => startCall('video')} title="Video">
                    <Video size={18} />
                  </button>
                  <button type="button" className="iconButton" onClick={() => setPanelTab('search')} title="Rechercher">
                    <Search size={18} />
                  </button>
                  <div className="optionsWrap">
                    <button type="button" className="iconButton" onClick={() => setShowOptions((open) => !open)} title="Options">
                      <MoreVertical size={18} />
                    </button>
                    {showOptions ? (
                      <div className="optionsMenu">
                        <button type="button" onClick={openActiveProfile}>{t(locale, 'Voir profil', 'View profile')}</button>
                        <button type="button" onClick={() => setPanelTab('search')}>{t(locale, 'Rechercher dans la conversation', 'Search in conversation')}</button>
                        <button type="button" onClick={() => setPanelTab('photos')}>{t(locale, 'Voir medias', 'View media')}</button>
                        <button type="button" onClick={() => setPanelTab('documents')}>{t(locale, 'Voir fichiers', 'View files')}</button>
                        <button type="button" onClick={() => setPanelTab('links')}>{t(locale, 'Voir liens', 'View links')}</button>
                        <button type="button" onClick={toggleMute}>
                          {selectedConversation.mutedUntil ? t(locale, 'Notifications ON', 'Notifications ON') : t(locale, 'Notifications OFF', 'Notifications OFF')}
                        </button>
                        <button type="button" onClick={() => togglePin()}>{selectedConversation.pinned ? t(locale, 'Desepingler', 'Unpin') : t(locale, 'Epingler conversation', 'Pin conversation')}</button>
                        <button type="button" onClick={() => toggleArchive()}>{t(locale, 'Archiver', 'Archive')}</button>
                        <button type="button" onClick={() => setPanelTab('settings')}>{t(locale, 'Messages ephemeres', 'Disappearing messages')}</button>
                        <button type="button" onClick={blockActiveUser}>{t(locale, 'Bloquer utilisateur', 'Block user')}</button>
                        <button type="button" onClick={reportConversation}>{t(locale, 'Signaler', 'Report')}</button>
                        <button type="button" className="dangerOption" onClick={deleteConversation}>{t(locale, 'Supprimer conversation', 'Delete conversation')}</button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </header>

              {callMode ? (
                <div className="callBar">
                  <span>{callMode === 'video' ? t(locale, 'Video active', 'Video active') : t(locale, 'Appel audio actif', 'Audio call active')}</span>
                  <button type="button" onClick={endCall}>Terminer</button>
                </div>
              ) : null}

              <div ref={messageStreamRef} className={dragActive ? 'messageStream dragActive' : 'messageStream'}>
                {!messages.length ? (
                  <div className="threadStart">
                    {renderAvatar(selectedConversation.title, selectedConversation.avatarUrl, true)}
                    <strong>{selectedConversation.title}</strong>
                    <p>{t(locale, 'Demarrez la conversation avec un message clair et professionnel.', 'Start the conversation with a clear professional message.')}</p>
                  </div>
                ) : null}
                {messages.map((message) => {
                  const own = message.senderId === currentUser?.id;
                  const sender = selectedConversation.members.find((member) => member.id === message.senderId);
                  return (
                    <article key={message.id} className={own ? 'messageRow own' : 'messageRow'}>
                      {!own ? renderAvatar(sender?.fullName || selectedConversation.title, sender?.profilePictureUrl) : null}
                      <div className={own ? 'messageBubble own' : 'messageBubble'}>
                        <div className="messageMeta">
                          <strong>{own ? t(locale, 'Vous', 'You') : sender?.fullName || selectedConversation.title}</strong>
                          <small>{formatTime(message.createdAt)}</small>
                          {message.editedAt ? <small>{t(locale, 'modifie', 'edited')}</small> : null}
                          {own ? message.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} /> : null}
                        </div>

                        {message.deletedForEveryoneAt ? (
                          <p className="deletedMessage">{t(locale, 'Message supprime', 'Deleted message')}</p>
                        ) : (
                          <>
                            {message.replyTo ? <span className="replyMarker">{t(locale, 'Reponse', 'Reply')}</span> : null}
                            {message.body ? <p>{message.body}</p> : null}
                            {message.attachments.length ? (
                              <div className="attachmentStack">{message.attachments.map((item) => <div key={item.id}>{renderAttachment(item, own)}</div>)}</div>
                            ) : null}
                          </>
                        )}

                        {message.reactions.length ? (
                          <div className="reactionRow">
                            {message.reactions.map((reaction, index) => (
                              <span key={`${reaction.userId}-${reaction.emoji}-${index}`}>{reaction.emoji}</span>
                            ))}
                          </div>
                        ) : null}

                        <div className="messageActions">
                          <span className="reactionPickerWrap">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenReactionPickerId((id) => (id === message.id ? '' : message.id));
                                setOpenMessageMenuId('');
                              }}
                              title="Reaction"
                            >
                              <Smile size={14} />
                            </button>
                            {openReactionPickerId === message.id ? (
                              <span className="reactionPicker" role="menu" aria-label="Reactions">
                                {richReactionChoices.slice(0, 18).map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      patchMessage(message, 'react', { emoji });
                                      setOpenReactionPickerId('');
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </span>
                            ) : null}
                          </span>
                          <button type="button" onClick={() => setReplyTo(message)} title="Repondre"><Reply size={14} /></button>
                          <span className="messageMenuWrap">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMessageMenuId((id) => (id === message.id ? '' : message.id));
                                setOpenReactionPickerId('');
                              }}
                              title="Plus"
                            >
                              <MoreVertical size={14} />
                            </button>
                            {openMessageMenuId === message.id ? (
                              <span className="messageMenu">
                                <button type="button" onClick={() => { navigator.clipboard.writeText(message.body); setOpenMessageMenuId(''); }}><Copy size={14} />Copier</button>
                                <button type="button" onClick={() => { patchMessage(message, 'save'); setOpenMessageMenuId(''); }}><Bookmark size={14} />Enregistrer</button>
                                <button type="button" onClick={() => { setForwardingMessage(message); setOpenMessageMenuId(''); }}><Forward size={14} />Transferer</button>
                                <button type="button" onClick={() => { patchMessage(message, 'pin'); setOpenMessageMenuId(''); }}><Pin size={14} />Epingler</button>
                                {own && !message.deletedForEveryoneAt ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessage(message);
                                      setDraft(message.body);
                                      setOpenMessageMenuId('');
                                    }}
                                  >
                                    <Edit3 size={14} />Modifier
                                  </button>
                                ) : null}
                                <button type="button" onClick={() => { deleteMessage(message, 'me'); setOpenMessageMenuId(''); }}><Trash2 size={14} />Supprimer pour moi</button>
                                {own ? <button type="button" className="dangerMenuItem" onClick={() => { deleteMessage(message, 'everyone'); setOpenMessageMenuId(''); }}><X size={14} />Supprimer pour tous</button> : null}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {typingUsers.length ? <div className="typingLine">{t(locale, 'En train d ecrire...', 'Typing...')}</div> : null}
                <div ref={streamEndRef} className="messageStreamEnd" aria-hidden="true" />
              </div>

              <footer ref={composerDockRef} className="messageComposerDock">
                {replyTo || editingMessage || forwardingMessage ? (
                  <div className="composerContext">
                    <span>
                      {editingMessage
                        ? t(locale, 'Modification du message', 'Editing message')
                        : forwardingMessage
                          ? t(locale, 'Transferer vers', 'Forward to')
                          : `${t(locale, 'Reponse a', 'Reply to')} ${replyTo?.body?.slice(0, 80) || ''}`}
                    </span>
                    {forwardingMessage ? (
                      <select defaultValue="" onChange={(event) => event.target.value && forwardMessage(event.target.value)}>
                        <option value="">{t(locale, 'Choisir une conversation', 'Choose conversation')}</option>
                        {conversations
                          .filter((conversation) => conversation.id !== selectedConversation.id)
                          .map((conversation) => (
                            <option key={conversation.id} value={conversation.id}>
                              {conversation.title}
                            </option>
                          ))}
                      </select>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setEditingMessage(null);
                        setForwardingMessage(null);
                        setDraft('');
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}

                {pendingFiles.length ? (
                  <div className="pendingFiles">
                    {pendingFiles.map((item) => (
                      <div key={item.id} className="pendingFile">
                        {item.previewUrl ? <img src={item.previewUrl} alt={item.file.name} /> : <FileText size={16} />}
                        <span>
                          <strong>{item.file.name}</strong>
                          <small>{item.progress ? `${item.progress}%` : formatBytes(item.file.size)}</small>
                        </span>
                        <button type="button" onClick={() => removePendingFile(item.id)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {showEmojiBar ? (
                  <div className="emojiBar">
                    <div>
                      {richReactionChoices.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setDraft((current) => `${current}${emoji}`);
                            setShowEmojiBar(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="quickReplies">
                      {quickMessageChoices.map((message) => (
                        <button
                          key={message}
                          type="button"
                          onClick={() => {
                            setDraft(message);
                            setShowEmojiBar(false);
                          }}
                        >
                          {message}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {recording ? (
                  <div className="voiceRecordingBar" aria-live="polite">
                    <button type="button" className="voiceCancelButton" onClick={() => stopVoiceRecording('discard')} title="Annuler">
                      <X size={16} />
                    </button>
                    <button type="button" className="voiceStopButton" onClick={() => stopVoiceRecording('attach')} title="Stop">
                      <Square size={13} fill="currentColor" />
                    </button>
                    <div className="voiceRecordingTrack">
                      <div className="voiceWave recording" aria-hidden="true">
                        {recordingLevels.map((height, index) => (
                          <span key={index} style={{ height: `${height}px` }} />
                        ))}
                      </div>
                      <strong>{formatVoiceDuration(recordingSeconds)}</strong>
                    </div>
                    <button type="button" className="voiceSendNowButton" onClick={() => stopVoiceRecording('send')} title="Envoyer">
                      <Send size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="messageComposerBar">
                    <div className="messageComposerTools">
                      <button type="button" onClick={() => imageInputRef.current?.click()} title="Image"><ImagePlus size={18} /></button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} title="Fichier"><Paperclip size={18} /></button>
                      <button type="button" onClick={() => setShowEmojiBar((open) => !open)} title="Emoji"><Smile size={18} /></button>
                      <button type="button" className="recordingButton" onClick={startVoiceRecording} title="Audio"><Mic size={18} /></button>
                    </div>

                    <textarea
                      className="messageComposerInput"
                      value={draft}
                      onChange={(event) => handleTyping(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={t(locale, 'Ecrire un message...', 'Write a message...')}
                      rows={1}
                    />

                    <button type="button" className="messageSendButton" onClick={sendMessage} disabled={sending}>
                      <Send size={18} />
                    </button>
                  </div>
                )}

                <input ref={fileInputRef} hidden multiple type="file" onChange={(event) => event.target.files && addFiles(event.target.files)} />
                <input ref={imageInputRef} hidden multiple type="file" accept="image/*,.pdf" onChange={(event) => event.target.files && addFiles(event.target.files)} />
              </footer>
            </>
          ) : (
            <div className="emptyChat">
              <div className="emptyChatIntro">
                <MessageCircle size={34} />
                <h2>{t(locale, 'Selectionnez une conversation', 'Select a conversation')}</h2>
                <p>{t(locale, 'Ouvrez un echange recent ou contactez directement une personne de votre reseau.', 'Open a recent exchange or contact someone from your network.')}</p>
              </div>

              {recentConversations.length ? (
                <section className="emptyChatSection">
                  <header>
                    <MessageCircle size={17} />
                    <strong>{t(locale, 'Derniers echanges', 'Recent exchanges')}</strong>
                  </header>
                  <div className="quickSuggestions compact">
                    {recentConversations.map((conversation) => (
                      <button key={conversation.id} type="button" onClick={() => selectConversation(conversation.id)}>
                        {renderAvatar(conversation.title, conversation.avatarUrl)}
                        <span>
                          <strong>{conversation.title}</strong>
                          <small>{conversation.lastMessage?.body || conversation.subtitle}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="emptyChatSection">
                <header>
                  <UserPlus size={17} />
                  <strong>{t(locale, 'Personnes recommandees', 'Recommended people')}</strong>
                </header>
                {suggestions.length ? (
                  <div className="quickSuggestions">
                    {suggestions.slice(0, 6).map((member) => (
                      <button key={member.id} type="button" onClick={() => createDirectConversation(member.id)}>
                        {renderAvatar(member.fullName, member.profilePictureUrl)}
                        <span>
                          <strong>{member.fullName}</strong>
                          <small>{[member.role, member.company].filter(Boolean).join(' - ') || member.email}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mutedParagraph">{t(locale, 'Aucun contact disponible pour le moment.', 'No available contacts right now.')}</p>
                )}
              </section>
            </div>
          )}
        </section>

        <aside className="conversationInfoPanel">
          {selectedConversation ? (
            <>
              <div className="infoTabs">
                {([
                  ['details', t(locale, 'Profil', 'Profile')],
                  ['photos', 'Photos'],
                  ['videos', t(locale, 'Videos', 'Videos')],
                  ['documents', t(locale, 'Documents', 'Documents')],
                ] as Array<[PanelTab, string]>).map(([key, label]) => (
                  <button key={key} type="button" className={panelTab === key ? 'active' : ''} onClick={() => setPanelTab(key)}>
                    {label}
                  </button>
                ))}
              </div>

              {panelTab === 'details' ? (
                <div className="infoSection">
                  {renderAvatar(selectedConversation.title, selectedConversation.avatarUrl, true)}
                  <h2>{selectedConversation.title}</h2>
                  <p>{selectedConversation.subtitle}</p>
                  <div className="securityLine">
                    <Shield size={16} />
                    <span>{selectedConversation.isEncrypted ? t(locale, 'Protection active', 'Protection active') : t(locale, 'Protection standard', 'Standard protection')}</span>
                  </div>
                  <div className="conversationStats">
                    <span><strong>{media.photos.length}</strong>Photos</span>
                    <span><strong>{media.videos.length}</strong>Videos</span>
                    <span><strong>{media.documents.length}</strong>Fichiers</span>
                  </div>
                  {activeContact?.company || activeContact?.role ? (
                    <p className="contactBio">
                      {[activeContact.role, activeContact.company].filter(Boolean).join(' - ')}
                    </p>
                  ) : null}
                  <div className="memberList">
                    {selectedConversation.members.map((member) => (
                      <div key={member.id} className="memberRow">
                        {renderAvatar(member.fullName, member.profilePictureUrl)}
                        <span>
                          <strong>{member.fullName}</strong>
                          <small>
                            {member.membership?.role || member.role || 'member'}
                            {member.company ? ` - ${member.company}` : ''}
                          </small>
                        </span>
                        {selectedConversation.type === 'group' && (member.membership?.role === 'owner' || member.membership?.role === 'admin') ? (
                          <Crown size={15} />
                        ) : null}
                        {canManageGroup && member.id !== currentUser?.id && member.membership?.role !== 'owner' ? (
                          <span className="memberActions">
                            <button
                              type="button"
                              onClick={() => updateGroupMemberRole(member, member.membership?.role === 'admin' ? 'member' : 'admin')}
                              title={member.membership?.role === 'admin' ? 'Retirer admin' : 'Nommer admin'}
                            >
                              <Crown size={14} />
                            </button>
                            <button type="button" onClick={() => removeGroupMember(member)} title="Retirer du groupe">
                              <UserMinus size={14} />
                            </button>
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {selectedConversation.type === 'group' && canManageGroup ? (
                    <div className="groupManagement">
                      <label className="conversationSearch inPanel">
                        <UserPlus size={17} />
                        <input
                          value={groupManageQuery}
                          onChange={(event) => setGroupManageQuery(event.target.value)}
                          placeholder={t(locale, 'Ajouter un membre', 'Add a member')}
                        />
                      </label>
                      <div className="memberList">
                        {availableGroupMembers.map((member) => (
                          <button key={member.id} type="button" className="memberRow memberRowButton" onClick={() => addGroupMember(member.id)}>
                            {renderAvatar(member.fullName, member.profilePictureUrl)}
                            <span>
                              <strong>{member.fullName}</strong>
                              <small>{[member.role, member.company].filter(Boolean).join(' - ') || member.email}</small>
                            </span>
                            <UserPlus size={15} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {panelTab === 'photos' ? (
                <div className="mediaGrid">
                  {media.photos.map((item) => (
                    <a key={item.id} href={absoluteAssetUrl(item.fileUrl)} target="_blank" rel="noreferrer">
                      <img src={absoluteAssetUrl(item.fileUrl)} alt={item.fileName} />
                    </a>
                  ))}
                </div>
              ) : null}

              {panelTab === 'videos' ? (
                <div className="mediaGrid">
                  {media.videos.map((item) => (
                    <a key={item.id} href={absoluteAssetUrl(item.fileUrl)} target="_blank" rel="noreferrer">
                      <video src={absoluteAssetUrl(item.fileUrl)} />
                    </a>
                  ))}
                </div>
              ) : null}

              {panelTab === 'documents' ? (
                <div className="fileList">
                  {media.documents.map((item) => (
                    <a key={item.id} href={absoluteAssetUrl(item.fileUrl)} target="_blank" rel="noreferrer">
                      <FileText size={18} />
                      <span>
                        <strong>{item.fileName}</strong>
                        <small>{formatBytes(item.fileSize)}</small>
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}

              {panelTab === 'audio' ? (
                <div className="fileList">
                  {media.audio.map((item) => (
                    <a key={item.id} href={absoluteAssetUrl(item.fileUrl)} target="_blank" rel="noreferrer">
                      <FileAudio size={18} />
                      <span>
                        <strong>{item.fileName}</strong>
                        <small>{formatBytes(item.fileSize)}</small>
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}

              {panelTab === 'links' ? (
                <div className="fileList">
                  {media.links.map((item) => (
                    <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
                      <LinkIcon size={18} />
                      <span>
                        <strong>{item.url.replace(/^https?:\/\//iu, '').slice(0, 34)}</strong>
                        <small>{formatTime(item.createdAt)}</small>
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}

              {panelTab === 'search' ? (
                <div className="infoSection">
                  <label className="conversationSearch inPanel">
                    <Search size={17} />
                    <input
                      value={discussionQuery}
                      onChange={(event) => setDiscussionQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          searchDiscussion();
                        }
                      }}
                      placeholder={t(locale, 'Texte, fichier, lien...', 'Text, file, link...')}
                    />
                  </label>
                  <div className="segmentedList">
                    {searchScopes.map((scope) => (
                      <button
                        key={scope.value}
                        type="button"
                        className={searchScope === scope.value ? 'active' : ''}
                        onClick={() => setSearchScope(scope.value)}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="panelAction" onClick={searchDiscussion}>
                    {t(locale, 'Rechercher', 'Search')}
                  </button>
                  <div className="searchResultList">
                    {searchResults.map((result) => (
                      <button key={result.message.id} type="button" onClick={() => setPanelTab('details')}>
                        <strong>{result.conversationTitle}</strong>
                        <span>{result.message.body || result.message.attachments[0]?.fileName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {panelTab === 'settings' ? (
                <div className="infoSection">
                  <strong>{t(locale, 'Theme discussion', 'Chat theme')}</strong>
                  <div className="themeGrid">
                    {themeChoices.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={selectedConversation.themeColor === color ? 'active' : ''}
                        style={{ background: color }}
                        onClick={() => updateTheme(color)}
                        aria-label={color}
                      />
                    ))}
                  </div>
                  <strong>{t(locale, 'Fond conversation', 'Conversation background')}</strong>
                  <div className="segmentedList">
                    {backgroundChoices.map((item) => (
                      <button key={item} type="button" className={selectedConversation.background === item ? 'active' : ''} onClick={() => updateTheme(undefined, item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                  <strong>{t(locale, 'Messages ephemeres', 'Disappearing messages')}</strong>
                  <div className="segmentedList">
                    {ephemeralChoices.map((item) => (
                      <button key={item.value} type="button" className={selectedConversation.ephemeralMode === item.value ? 'active' : ''} onClick={() => updateTheme(undefined, undefined, item.value)}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="panelAction" onClick={requestNotifications}>
                    {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                    {notificationsEnabled ? t(locale, 'Notifications actives', 'Notifications active') : t(locale, 'Activer notifications', 'Enable notifications')}
                  </button>
                  <button type="button" className="panelAction" onClick={() => setSoundEnabled((value) => !value)}>
                    <Volume2 size={16} />
                    {soundEnabled ? t(locale, 'Son active', 'Sound active') : t(locale, 'Son coupe', 'Sound muted')}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="infoSection mutedInfo">
              <Shield size={22} />
              <strong>{t(locale, 'Messagerie securisee', 'Secure messaging')}</strong>
              <p>{t(locale, 'Presence, lecture, fichiers, recherche et notifications sont connectes au backend.', 'Presence, reads, files, search and notifications are connected to the backend.')}</p>
            </div>
          )}
        </aside>
      </main>

      {showGroupDialog ? (
        <div className="dialogBackdrop" role="dialog" aria-modal="true">
          <div className="groupDialog">
            <header>
              <strong>{t(locale, 'Nouveau groupe', 'New group')}</strong>
              <button type="button" onClick={() => setShowGroupDialog(false)}><X size={16} /></button>
            </header>
            <input value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} placeholder={t(locale, 'Nom du groupe', 'Group name')} />
            <div className="groupMemberPicker">
              {suggestions.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={groupMembers.includes(member.id) ? 'selected' : ''}
                  onClick={() =>
                    setGroupMembers((current) =>
                      current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id],
                    )
                  }
                >
                  {renderAvatar(member.fullName, member.profilePictureUrl)}
                  <span>{member.fullName}</span>
                </button>
              ))}
            </div>
            <button type="button" className="panelAction primaryPanelAction" onClick={createGroupConversation}>
              {t(locale, 'Creer le groupe', 'Create group')}
            </button>
          </div>
        </div>
      ) : null}

      <style>{`
        .professionalMessagesPage {
          height: calc(100dvh - 128px);
          min-height: 0;
          padding: 8px;
          color: #0f172a;
          overflow: hidden;
          background: #f1f5f9;
        }

        .messagesApp {
          width: min(1360px, 100%);
          height: 100%;
          min-height: 0;
          max-height: 100%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 330px minmax(0, 1fr);
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 18px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 22px 64px rgba(15, 23, 42, 0.1);
        }

        html[data-theme='light'] .professionalMessagesPage .messagesApp,
        html[data-theme='light'] .professionalMessagesPage .conversationSidebar,
        html[data-theme='light'] .professionalMessagesPage .chatSurface,
        html[data-theme='light'] .professionalMessagesPage .messageStream,
        html[data-theme='light'] .professionalMessagesPage .messagesTopbar {
          background: #ffffff !important;
          color: #0f172a !important;
        }

        html[data-theme='light'] .professionalMessagesPage .conversationSidebar {
          background: #f8fafc !important;
        }

        html[data-theme='light'] .professionalMessagesPage .conversationSearch,
        html[data-theme='light'] .professionalMessagesPage .conversationItem,
        html[data-theme='light'] .professionalMessagesPage .quickSuggestions button,
        html[data-theme='light'] .professionalMessagesPage .groupMemberPicker button,
        html[data-theme='light'] .professionalMessagesPage .emptyChatSection,
        html[data-theme='light'] .professionalMessagesPage .infoSection,
        html[data-theme='light'] .professionalMessagesPage .composerContext,
        html[data-theme='light'] .professionalMessagesPage .pendingFiles,
        html[data-theme='light'] .professionalMessagesPage .emojiBar {
          background: #ffffff !important;
          border-color: rgba(148, 163, 184, 0.22) !important;
          color: #0f172a !important;
        }

        html[data-theme='light'] .professionalMessagesPage :is(h1, h2, h3, strong, label, .conversationLine strong, .emptyChatSection header) {
          color: #0f172a !important;
        }

        html[data-theme='light'] .professionalMessagesPage :is(p, small, .messagesTopbar p, .conversationMeta, .lastMessage, .emptyChat p, .quickSuggestions small) {
          color: #475569 !important;
        }

        html[data-theme='light'] .professionalMessagesPage .filterChip {
          background: #ffffff !important;
          color: #0f172a !important;
          border-color: rgba(148, 163, 184, 0.24) !important;
        }

        html[data-theme='light'] .professionalMessagesPage .filterChip.active,
        html[data-theme='light'] .professionalMessagesPage .conversationItem.active {
          background: #dbeafe !important;
          color: #0f172a !important;
          border-color: rgba(37, 99, 235, 0.26) !important;
        }

        html[data-theme='dark'] .professionalMessagesPage .messagesApp,
        html[data-theme='dark'] .professionalMessagesPage .messageStream,
        html[data-theme='dark'] .professionalMessagesPage .conversationSidebar,
        html[data-theme='dark'] .professionalMessagesPage .conversationInfoPanel,
        html[data-theme='dark'] .professionalMessagesPage .chatSurface,
        html[data-theme='dark'] .professionalMessagesPage .messagesTopbar,
        html[data-theme='dark'] .professionalMessagesPage .conversationSearch,
        html[data-theme='dark'] .professionalMessagesPage .conversationItem,
        html[data-theme='dark'] .professionalMessagesPage .quickSuggestions button,
        html[data-theme='dark'] .professionalMessagesPage .groupMemberPicker button,
        html[data-theme='dark'] .professionalMessagesPage .emptyChatSection,
        html[data-theme='dark'] .professionalMessagesPage .infoSection {
          background: #111827 !important;
          border-color: rgba(148, 163, 184, 0.22) !important;
          color: #f8fafc !important;
        }

        html[data-theme='dark'] .professionalMessagesPage :is(h1, h2, h3, strong, label, .conversationLine strong, .emptyChatSection header) {
          color: #f8fafc !important;
        }

        html[data-theme='dark'] .professionalMessagesPage :is(p, small, .messagesTopbar p, .conversationMeta, .lastMessage, .emptyChat p, .quickSuggestions small) {
          color: #cbd5e1 !important;
        }

        .conversationSidebar,
        .conversationInfoPanel {
          min-width: 0;
          display: grid;
          grid-template-rows: auto auto auto minmax(0, 1fr);
          background: #f8fafc;
          border-right: 1px solid rgba(148, 163, 184, 0.22);
          overflow: hidden;
        }

        .conversationInfoPanel {
          grid-template-rows: auto minmax(0, 1fr);
          border-right: 0;
          border-left: 1px solid rgba(148, 163, 184, 0.22);
          overflow: auto;
          display: none;
        }

        .messagesTopbar,
        .chatHeader {
          min-height: 66px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(14px);
        }

        .messagesTopbar h1,
        .messagesTopbar p,
        .emptyChat h2,
        .emptyChat p,
        .messageBubble p,
        .infoSection h2,
        .infoSection p {
          margin: 0;
        }

        .messagesTopbar h1 {
          font-size: 1.18rem;
          letter-spacing: -0.03em;
        }

        .messagesTopbar p,
        .lastMessage,
        .conversationMeta,
        .chatIdentity span,
        .chatIdentity small,
        .messageMeta small,
        .infoSection p,
        .fileList small,
        .memberRow small,
        .pendingFile small,
        .mutedParagraph {
          color: #64748b;
        }

        .iconButton {
          width: 38px;
          height: 38px;
          display: inline-grid;
          place-items: center;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 13px;
          background: #ffffff;
          color: #0f172a;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .iconButton:hover,
        .filterChip:hover,
        .conversationItem:hover,
        .composerTools button:hover,
        .sendMessageButton:hover,
        .messageComposerTools button:hover,
        .messageSendButton:hover,
        .panelAction:hover {
          transform: translateY(-1px);
        }

        .primaryIcon,
        .sendMessageButton,
        .primaryPanelAction,
        .messageSendButton {
          background: var(--chat-accent);
          color: #ffffff;
          border-color: transparent;
        }

        .conversationSearch {
          margin: 10px 12px;
          min-height: 40px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 13px;
          background: #ffffff;
        }

        .conversationSearch.inPanel {
          margin: 0;
        }

        .conversationSearch input,
        .composer textarea,
        .groupDialog input,
        .composerContext select {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: inherit;
          font: inherit;
        }

        .filterRail {
          display: flex;
          gap: 8px;
          padding: 0 12px 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .filterRail::-webkit-scrollbar,
        .infoTabs::-webkit-scrollbar {
          display: none;
        }

        .filterChip,
        .infoTabs button,
        .segmentedList button {
          min-height: 32px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 999px;
          padding: 0 11px;
          background: #ffffff;
          color: #334155;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
        }

        .filterChip.active,
        .infoTabs button.active,
        .segmentedList button.active {
          background: rgba(29, 78, 216, 0.1);
          color: var(--chat-accent);
          border-color: rgba(29, 78, 216, 0.2);
        }

        .conversationList {
          min-height: 0;
          display: grid;
          align-content: start;
          gap: 6px;
          padding: 8px;
          overflow: auto;
        }

        .conversationItem {
          width: 100%;
          position: relative;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 11px;
          padding: 10px;
          border: 1px solid transparent;
          border-radius: 14px;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .conversationItem.active {
          background: #ffffff;
          border-color: rgba(29, 78, 216, 0.18);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
        }

        .avatarWrap,
        .optionsWrap {
          position: relative;
        }

        .msgAvatar {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          overflow: hidden;
          background: linear-gradient(135deg, #0f172a, var(--chat-accent));
          color: #ffffff;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .msgAvatar.large {
          width: 50px;
          height: 50px;
          border-radius: 16px;
        }

        .msgAvatar img,
        .pendingFile img,
        .mediaGrid img,
        .mediaGrid video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .presenceDot {
          position: absolute;
          right: -1px;
          bottom: 1px;
          width: 11px;
          height: 11px;
          border-radius: 999px;
          background: #22c55e;
          border: 2px solid #ffffff;
        }

        .conversationPreview {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .conversationLine,
        .conversationMeta,
        .messageMeta,
        .chatHeaderActions,
        .composerTools,
        .composerRow,
        .memberRow,
        .fileList a,
        .pendingFile,
        .composerContext,
        .securityLine,
        .callBar {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .conversationLine {
          justify-content: space-between;
        }

        .conversationLine strong,
        .lastMessage {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .conversationMeta,
        .lastMessage {
          font-size: 0.82rem;
        }

        .conversationBadges {
          display: grid;
          justify-items: end;
          align-content: start;
          gap: 5px;
          color: #64748b;
        }

        .conversationBadges strong {
          min-width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: var(--chat-accent);
          color: #ffffff;
          font-size: 0.75rem;
        }

        .listState,
        .emptyChat,
        .mutedInfo {
          display: grid;
          place-items: center;
          align-content: center;
          gap: 12px;
          color: #64748b;
          text-align: center;
          padding: 24px;
        }

        .chatSurface {
          --composer-clearance: 100px;
          min-width: 0;
          min-height: 0;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          background: #ffffff;
          overflow: hidden;
          overflow-x: hidden;
        }

        .mobileBack {
          display: none;
        }

        .chatIdentity {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chatIdentity div {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .chatIdentity strong {
          font-size: 1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .optionsMenu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          z-index: 20;
          width: 260px;
          display: grid;
          gap: 4px;
          padding: 8px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 24px 52px rgba(15, 23, 42, 0.16);
        }

        .optionsMenu button {
          width: 100%;
          min-height: 38px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: #0f172a;
          text-align: left;
          font-weight: 750;
          cursor: pointer;
          padding: 0 10px;
        }

        .optionsMenu button:hover {
          background: #f1f5f9;
        }

        .optionsMenu .dangerOption {
          color: #be123c;
        }

        .callBar {
          justify-content: space-between;
          padding: 10px 16px;
          background: rgba(29, 78, 216, 0.08);
          color: #1e3a8a;
          font-weight: 800;
        }

        .callBar button {
          border: 0;
          border-radius: 999px;
          padding: 7px 12px;
          background: #be123c;
          color: #ffffff;
          font-weight: 800;
          cursor: pointer;
        }

        .messageStream {
          min-height: 0;
          min-width: 0;
          height: 100%;
          max-height: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 16px clamp(14px, 3vw, 42px) 0;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          background: #ffffff;
          scrollbar-gutter: stable;
          scroll-padding-bottom: var(--composer-clearance);
        }

        .messageStreamEnd {
          width: 100%;
          height: var(--composer-clearance);
          min-height: var(--composer-clearance);
          flex: 0 0 var(--composer-clearance);
          pointer-events: none;
        }

        .professionalMessagesPage.bg-soft .messageStream {
          background: #ffffff;
        }

        .professionalMessagesPage.bg-focus .messageStream {
          background: #ffffff;
        }

        .professionalMessagesPage.bg-dark .messageStream {
          background: #111827 !important;
          color: #f8fafc !important;
        }

        .professionalMessagesPage.bg-dark .messageStream :is(.threadStart strong, .messageMeta strong) {
          color: #f8fafc !important;
        }

        .professionalMessagesPage.bg-dark .messageStream :is(.threadStart p, .messageMeta small, .typingLine) {
          color: #cbd5e1 !important;
        }

        .messageStream.dragActive {
          outline: 3px dashed rgba(29, 78, 216, 0.28);
          outline-offset: -10px;
        }

        .messageRow {
          min-width: 0;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          justify-content: flex-start;
        }

        .messageRow.own {
          justify-content: flex-end;
        }

        .messageBubble {
          position: relative;
          min-width: 0;
          max-width: min(520px, calc(100% - 86px));
          display: grid;
          gap: 6px;
          padding: 9px 12px 10px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 18px 18px 18px 6px;
          background: #f8fafc;
          box-shadow: none;
          transition: transform 0.16s ease, box-shadow 0.16s ease;
        }

        .messageBubble:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
        }

        .messageBubble.own {
          border-color: transparent;
          border-radius: 18px 18px 6px 18px;
          background: var(--chat-accent);
          color: #ffffff;
        }

        .messageBubble p {
          line-height: 1.42;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .messageBubble.own .messageMeta small,
        .messageBubble.own .messageMeta,
        .messageBubble.own p {
          color: rgba(255, 255, 255, 0.9);
        }

        .messageMeta {
          font-size: 0.72rem;
          flex-wrap: wrap;
        }

        .replyMarker,
        .deletedMessage {
          color: #64748b;
          font-style: italic;
        }

        .attachmentStack {
          display: grid;
          gap: 8px;
        }

        .messageImage,
        .messageVideo {
          max-width: min(420px, 100%);
          max-height: 300px;
          border-radius: 14px;
          object-fit: cover;
        }

        .messageAudio {
          width: min(320px, 100%);
        }

        .voiceBubble {
          width: min(310px, 78vw);
          min-height: 54px;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 18px;
          background: #f1f5f9;
          color: #0f172a;
        }

        .voiceBubble.own {
          background: linear-gradient(135deg, #2563eb, #0f6bff);
          color: #ffffff;
        }

        .voiceBubble audio {
          display: none;
        }

        .voicePlayButton {
          width: 32px;
          height: 32px;
          display: inline-grid;
          place-items: center;
          border: 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.22);
          color: currentColor;
          cursor: pointer;
        }

        .voiceBubble:not(.own) .voicePlayButton {
          background: #ffffff;
        }

        .voiceWave {
          position: relative;
          height: 34px;
          display: flex;
          align-items: center;
          gap: 3px;
          overflow: hidden;
        }

        .voiceWave span {
          position: relative;
          z-index: 1;
          width: 3px;
          min-height: 8px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0.36;
          transition: height 0.08s linear, opacity 0.14s ease;
        }

        .voiceWave.playback::before {
          content: '';
          position: absolute;
          inset: 0;
          width: var(--voice-progress, 0%);
          border-radius: inherit;
          background: currentColor;
          opacity: 0.26;
          pointer-events: none;
          transition: width 0.12s linear;
        }

        .voiceBubble.own .voiceWave.playback::before {
          opacity: 0.32;
        }

        .voiceWave.recording span {
          opacity: 0.86;
        }

        .voiceDuration {
          font-size: 0.82rem;
          font-weight: 900;
          white-space: nowrap;
        }

        @keyframes voicePulse {
          0%,
          100% {
            transform: scaleY(0.62);
            opacity: 0.42;
          }

          50% {
            transform: scaleY(1);
            opacity: 0.92;
          }
        }

        .fileAttachment {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          min-width: min(320px, 100%);
          padding: 10px;
          border-radius: 13px;
          background: rgba(241, 245, 249, 0.8);
          color: #0f172a;
          text-decoration: none;
        }

        .fileAttachment span,
        .pendingFile span,
        .fileList span,
        .memberRow span {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .fileAttachment strong,
        .pendingFile strong,
        .fileList strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .reactionRow {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .reactionRow span {
          min-height: 22px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 8px;
          background: rgba(255, 255, 255, 0.86);
          color: #0f172a;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .messageActions {
          position: absolute;
          top: 50%;
          left: calc(100% + 8px);
          display: inline-flex;
          gap: 4px;
          flex-wrap: nowrap;
          opacity: 0;
          transform: translateY(-50%) scale(0.98);
          transition: opacity 0.16s ease, transform 0.16s ease;
          z-index: 5;
        }

        .messageBubble.own .messageActions {
          left: auto;
          right: calc(100% + 8px);
        }

        .messageBubble:hover .messageActions {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }

        .reactionPickerWrap {
          position: relative;
          display: inline-grid;
        }

        .reactionPicker {
          position: absolute;
          right: 0;
          bottom: calc(100% + 8px);
          z-index: 24;
          width: min(260px, 78vw);
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
          padding: 7px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
        }

        .reactionPicker button {
          width: 34px !important;
          height: 34px !important;
          border-radius: 999px !important;
          border: 0 !important;
          background: transparent !important;
          font-size: 1.05rem !important;
          line-height: 1 !important;
        }

        .reactionPicker button:hover {
          background: #f1f5f9 !important;
          transform: translateY(-1px) scale(1.08);
        }

        .messageActions button,
        .composerTools button,
        .composerContext button,
        .pendingFile button,
        .groupDialog header button,
        .mobileBack {
          width: 30px;
          height: 30px;
          display: inline-grid;
          place-items: center;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
          cursor: pointer;
        }

        .messageMenuWrap {
          position: relative;
          display: inline-grid;
        }

        .messageMenu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 20;
          width: 210px;
          display: grid;
          gap: 4px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 14px;
          background: #ffffff;
          padding: 7px;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
        }

        .messageMenu button {
          width: 100%;
          min-height: 34px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #0f172a;
          font: inherit;
          font-size: 0.86rem;
          font-weight: 780;
          padding: 0 9px;
        }

        .messageMenu button:hover {
          background: #f8fafc;
        }

        .messageMenu .dangerMenuItem {
          color: #be123c;
        }

        .threadStart {
          width: min(360px, 100%);
          display: grid;
          justify-items: center;
          gap: 8px;
          justify-self: center;
          margin: auto 0;
          color: #64748b;
          text-align: center;
        }

        .threadStart strong {
          color: #0f172a;
        }

        .typingLine {
          color: #64748b;
          font-weight: 800;
          padding-left: 52px;
        }

        .composer {
          display: grid;
          gap: 8px;
          padding: 10px 14px 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.96);
          overflow: hidden;
        }

        .composerContext,
        .pendingFiles,
        .emojiBar {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 14px;
          background: #f8fafc;
          padding: 8px;
        }

        .composerContext {
          justify-content: space-between;
        }

        .pendingFiles {
          display: flex;
          gap: 8px;
          overflow-x: hidden;
          flex-wrap: wrap;
        }

        .pendingFile {
          min-width: 210px;
          max-width: 260px;
          padding: 8px;
          border-radius: 12px;
          background: #ffffff;
        }

        .pendingFile img {
          width: 44px;
          height: 44px;
          border-radius: 10px;
        }

        .emojiBar {
          display: grid;
          gap: 8px;
          max-height: 190px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .emojiBar div,
        .quickReplies {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .emojiBar button {
          min-width: 34px;
          min-height: 32px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 999px;
          background: #ffffff;
          color: #0f172a;
          font-weight: 800;
          cursor: pointer;
          padding: 0 10px;
        }

        .composerRow {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          min-height: 46px;
          max-width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 999px;
          padding: 4px 5px;
          background: #ffffff;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        .composerTools {
          display: inline-flex;
          flex-wrap: nowrap;
          gap: 4px;
          padding-left: 2px;
        }

        .composer textarea {
          height: 36px;
          min-height: 36px;
          max-height: 92px;
          resize: none;
          padding: 8px 10px 0;
          line-height: 1.35;
          min-width: 0;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .composer textarea::-webkit-scrollbar {
          display: none;
        }

        .sendMessageButton {
          width: 38px;
          height: 38px;
          display: inline-grid;
          place-items: center;
          border: 0;
          border-radius: 999px;
          cursor: pointer;
        }

        .recordingButton.active {
          color: #be123c;
          border-color: rgba(190, 18, 60, 0.3);
          background: rgba(244, 63, 94, 0.08);
        }

        .messageComposerDock {
          min-height: 68px !important;
          max-height: min(180px, 32dvh) !important;
          width: 100% !important;
          align-self: end !important;
          display: grid !important;
          justify-items: stretch !important;
          align-content: end !important;
          gap: 8px !important;
          padding: 8px 14px 12px !important;
          border-top: 1px solid rgba(148, 163, 184, 0.2) !important;
          background: #ffffff !important;
          overflow: hidden !important;
          position: relative !important;
          z-index: 2 !important;
        }

        .messageComposerBar {
          width: 100% !important;
          height: 52px !important;
          min-height: 52px !important;
          max-height: 52px !important;
          justify-self: stretch !important;
          display: grid !important;
          grid-template-columns: auto minmax(0, 1fr) auto !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 5px 6px 5px 8px !important;
          border: 1px solid rgba(148, 163, 184, 0.32) !important;
          border-radius: 28px !important;
          background: #ffffff !important;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.1) !important;
          overflow: hidden !important;
        }

        .voiceRecordingBar {
          width: min(620px, 100%) !important;
          height: 52px !important;
          justify-self: center !important;
          display: grid !important;
          grid-template-columns: auto auto minmax(0, 1fr) auto !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 5px 6px !important;
          border-radius: 999px !important;
          background: #ffffff !important;
          border: 1px solid rgba(37, 99, 235, 0.18) !important;
          box-shadow: 0 14px 34px rgba(37, 99, 235, 0.14) !important;
        }

        .voiceCancelButton,
        .voiceStopButton,
        .voiceSendNowButton {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          display: inline-grid !important;
          place-items: center !important;
          border: 0 !important;
          border-radius: 999px !important;
          cursor: pointer !important;
        }

        .voiceCancelButton {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
        }

        .voiceStopButton {
          background: #ffffff !important;
          color: #2563eb !important;
          box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
        }

        .voiceSendNowButton {
          background: #2563eb !important;
          color: #ffffff !important;
        }

        .voiceRecordingTrack {
          min-width: 0 !important;
          height: 42px !important;
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) auto !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 0 12px !important;
          border-radius: 999px !important;
          background: linear-gradient(135deg, #1672ff, #085df4) !important;
          color: #ffffff !important;
          overflow: hidden !important;
        }

        .voiceRecordingTrack strong {
          font-size: 0.86rem !important;
          white-space: nowrap !important;
        }

        .messageComposerTools {
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          flex: 0 0 auto !important;
        }

        .messageComposerTools button {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          display: inline-grid !important;
          place-items: center !important;
          border: 0 !important;
          border-radius: 999px !important;
          background: transparent !important;
          color: #0f172a !important;
          cursor: pointer !important;
        }

        .messageComposerTools button:hover {
          background: #f1f5f9 !important;
        }

        .messageComposerInput {
          width: 100% !important;
          height: 38px !important;
          min-height: 38px !important;
          max-height: 38px !important;
          border: 0 !important;
          outline: none !important;
          resize: none !important;
          background: transparent !important;
          color: #0f172a !important;
          font: inherit !important;
          line-height: 1.4 !important;
          padding: 9px 0 0 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          overscroll-behavior: contain !important;
          scrollbar-width: none !important;
          overflow-wrap: anywhere !important;
        }

        .messageComposerInput::-webkit-scrollbar {
          display: none !important;
        }

        .messageSendButton {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          display: inline-grid !important;
          place-items: center !important;
          border: 0 !important;
          border-radius: 999px !important;
          cursor: pointer !important;
          box-shadow: none !important;
        }

        .messageSendButton:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .emptyChat {
          height: 100%;
          align-content: center;
          justify-items: center;
          gap: 18px;
          padding: 24px;
          text-align: center;
        }

        .emptyChatIntro {
          display: grid;
          justify-items: center;
          gap: 10px;
        }

        .emptyChatIntro svg {
          color: var(--chat-accent);
        }

        .emptyChat h2 {
          font-size: clamp(1.45rem, 2vw, 2rem);
          letter-spacing: -0.03em;
        }

        .emptyChat p {
          max-width: 580px;
          line-height: 1.7;
          color: #475569;
        }

        .emptyChatSection {
          width: min(720px, 100%);
          display: grid;
          gap: 10px;
          text-align: left;
        }

        .emptyChatSection header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
        }

        .quickSuggestions {
          width: min(680px, 100%);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
        }

        .quickSuggestions.compact {
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }

        .quickSuggestions button,
        .groupMemberPicker button {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 16px;
          background: #ffffff;
          padding: 10px;
          text-align: left;
          cursor: pointer;
        }

        .quickSuggestions span {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .quickSuggestions strong,
        .quickSuggestions small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .infoTabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
          padding: 10px;
          overflow-x: auto;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .infoTabs button {
          min-width: 0;
          font-size: 0.78rem;
          padding: 0 8px;
        }

        .infoSection {
          display: grid;
          gap: 12px;
          padding: 14px;
        }

        .infoSection h2 {
          letter-spacing: -0.04em;
        }

        .securityLine {
          border-radius: 13px;
          background: rgba(34, 197, 94, 0.08);
          color: #166534;
          padding: 9px 11px;
          font-weight: 800;
        }

        .conversationStats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }

        .conversationStats span {
          display: grid;
          gap: 2px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 12px;
          background: #ffffff;
          color: #64748b;
          padding: 8px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .conversationStats strong {
          color: #0f172a;
          font-size: 1rem;
        }

        .contactBio {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 13px;
          background: #ffffff;
          padding: 10px;
          line-height: 1.45;
        }

        .memberList,
        .fileList,
        .searchResultList {
          display: grid;
          gap: 7px;
        }

        .memberRow,
        .fileList a,
        .searchResultList button {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 13px;
          background: #ffffff;
          padding: 9px;
          color: inherit;
          text-decoration: none;
          text-align: left;
        }

        .memberRow {
          min-width: 0;
        }

        .memberRowButton {
          width: 100%;
          cursor: pointer;
        }

        .memberActions {
          margin-left: auto;
          display: inline-flex;
          gap: 5px;
        }

        .memberActions button {
          width: 30px;
          height: 30px;
          display: inline-grid;
          place-items: center;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 10px;
          background: #ffffff;
          color: #0f172a;
          cursor: pointer;
        }

        .groupManagement {
          display: grid;
          gap: 10px;
          padding-top: 4px;
        }

        .mediaGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 12px;
        }

        .mediaGrid a {
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 14px;
          background: #e2e8f0;
        }

        .panelAction {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 14px;
          background: #ffffff;
          color: #0f172a;
          font-weight: 850;
          cursor: pointer;
        }

        .themeGrid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }

        .themeGrid button {
          aspect-ratio: 1;
          border: 2px solid transparent;
          border-radius: 999px;
          cursor: pointer;
        }

        .themeGrid button.active {
          border-color: #0f172a;
        }

        .segmentedList {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .messagesNotice {
          position: fixed;
          left: 50%;
          top: 104px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 10px;
          transform: translateX(-50%);
          padding: 10px 12px;
          border-radius: 14px;
          background: #0f172a;
          color: #ffffff;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
        }

        .messagesNotice button {
          border: 0;
          background: transparent;
          color: #ffffff;
          cursor: pointer;
        }

        .dialogBackdrop {
          position: fixed;
          inset: 0;
          z-index: 120;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.42);
        }

        .groupDialog {
          width: min(560px, 100%);
          max-height: 82vh;
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 28px 70px rgba(15, 23, 42, 0.24);
        }

        .groupDialog header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .groupDialog input {
          min-height: 44px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 14px;
          padding: 0 12px;
        }

        .groupMemberPicker {
          max-height: 360px;
          display: grid;
          gap: 8px;
          overflow: auto;
        }

        .groupMemberPicker button.selected {
          border-color: rgba(29, 78, 216, 0.32);
          background: rgba(29, 78, 216, 0.08);
        }

        @media (max-width: 1280px) {
          .messagesApp {
            grid-template-columns: 320px minmax(0, 1fr);
          }

          .conversationInfoPanel {
            display: none;
          }
        }

        @media (max-width: 860px) {
          .professionalMessagesPage {
            padding: 0;
          }

          .messagesApp {
            height: calc(100dvh - 118px);
            min-height: 0;
            max-height: calc(100dvh - 118px);
            grid-template-columns: 1fr;
            border-radius: 0;
            border-left: 0;
            border-right: 0;
          }

          .conversationSidebar,
          .chatSurface {
            grid-column: 1;
            grid-row: 1;
          }

          .chatSurface {
            display: none;
          }

          .professionalMessagesPage.chatOpen .conversationSidebar {
            display: none;
          }

          .professionalMessagesPage.chatOpen .chatSurface {
            display: grid;
          }

          .mobileBack {
            display: inline-grid;
          }

          .messageBubble {
            max-width: calc(100% - 76px);
          }

          .chatHeaderActions {
            gap: 5px;
          }

          .composerRow {
            grid-template-columns: auto minmax(0, 1fr) auto;
          }

          .composerTools {
            grid-column: auto;
            max-width: 126px;
            overflow: hidden;
          }

          .composerTools button {
            width: 28px;
            height: 28px;
          }

          .messageComposerDock {
            min-height: 64px !important;
            padding: 7px 10px 10px !important;
          }

          .messageComposerBar {
            width: 100% !important;
            height: 50px !important;
            min-height: 50px !important;
            max-height: 50px !important;
            gap: 5px !important;
            padding: 5px !important;
          }

          .messageComposerTools {
            gap: 0 !important;
          }

          .messageComposerTools button {
            width: 30px !important;
            height: 30px !important;
            min-width: 30px !important;
          }

          .voiceRecordingBar {
            width: 100% !important;
            grid-template-columns: auto auto minmax(0, 1fr) auto !important;
            gap: 5px !important;
          }

          .voiceCancelButton,
          .voiceStopButton,
          .voiceSendNowButton {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
          }

          .voiceRecordingTrack {
            height: 40px !important;
            padding: 0 9px !important;
          }

          .voiceBubble {
            width: min(270px, 78vw);
          }

          .messageSendButton {
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
          }

          .messageActions {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
