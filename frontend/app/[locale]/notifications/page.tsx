'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  Archive,
  Bell,
  BellOff,
  CheckCheck,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Inbox,
  LockKeyhole,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale } from '@/i18n.config';

type NotificationCategory =
  | 'all'
  | 'unread'
  | 'network'
  | 'messages'
  | 'profile'
  | 'security'
  | 'publications'
  | 'recommendations'
  | 'system'
  | 'archived';

type NotificationPriority = 'info' | 'message' | 'important' | 'security' | 'validation' | 'recommendation';

interface NotificationItem {
  id: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  preview?: string;
  href?: string | null;
  read: boolean;
  createdAt?: string | null;
  archivedAt?: string | null;
  groupCount?: number;
  actor?: {
    id?: string | null;
    name?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
}

interface NotificationSettings {
  soundsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  networkEnabled: boolean;
  messagesEnabled: boolean;
  securityEnabled: boolean;
  profileEnabled: boolean;
  premiumEnabled: boolean;
  mutedTypes: string[];
}

interface NotificationsResponse {
  success: boolean;
  count: number;
  counts: Record<NotificationCategory, number>;
  page?: { limit: number; offset: number; hasMore: boolean };
  settings?: NotificationSettings;
  data: NotificationItem[];
  error?: string;
}

function assetUrl(value?: string | null) {
  if (!value) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  return value.startsWith('/') ? value : `/${value}`;
}

interface SocketLike {
  on(event: string, callback: (payload: unknown) => void): void;
  disconnect(): void;
}

type SocketWindow = Window & {
  io?: (url?: string, options?: Record<string, unknown>) => SocketLike;
};

const categories: Array<{ id: NotificationCategory; label: string; icon: typeof Inbox }> = [
  { id: 'all', label: 'Toutes', icon: Inbox },
  { id: 'unread', label: 'Non lues', icon: Bell },
  { id: 'network', label: 'Reseau', icon: UsersRound },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'Profil', icon: UserRound },
  { id: 'security', label: 'Securite', icon: ShieldCheck },
  { id: 'publications', label: 'Publications', icon: FileText },
  { id: 'recommendations', label: 'Recommandations', icon: Sparkles },
  { id: 'system', label: 'Systeme', icon: LockKeyhole },
  { id: 'archived', label: 'Archivees', icon: Archive },
];

const priorityLabels: Record<NotificationPriority, string> = {
  info: 'Info',
  message: 'Message',
  important: 'Important',
  security: 'Securite',
  validation: 'Validation',
  recommendation: 'Recommandation',
};

const defaultCounts = categories.reduce(
  (acc, item) => ({ ...acc, [item.id]: 0 }),
  {} as Record<NotificationCategory, number>,
);

const defaultSettings: NotificationSettings = {
  soundsEnabled: true,
  emailEnabled: true,
  pushEnabled: true,
  networkEnabled: true,
  messagesEnabled: true,
  securityEnabled: true,
  profileEnabled: true,
  premiumEnabled: true,
  mutedTypes: [],
};

function loadSocketScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const socketWindow = window as SocketWindow;

    if (socketWindow.io) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-communium-socket]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Socket indisponible')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.async = true;
    script.dataset.communiumSocket = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Socket indisponible'));
    document.head.appendChild(script);
  });
}

function formatRelativeTime(value?: string | null) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'A l instant';
  if (diff < hour) return `Il y a ${Math.max(1, Math.round(diff / minute))} min`;
  if (diff < day) return `Il y a ${Math.round(diff / hour)} h`;
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function initialsFor(item: NotificationItem) {
  const name = item.actor?.name || item.actor?.username || item.title || 'Communium';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function actionLabel(item: NotificationItem) {
  if (item.category === 'messages') return 'Ouvrir discussion';
  if (item.category === 'profile') return 'Voir profil';
  if (item.category === 'publications') return 'Voir publication';
  if (item.category === 'network') return 'Voir reseau';
  if (item.category === 'security') return 'Verifier';
  return 'Ouvrir';
}

function notificationHref(item: NotificationItem) {
  if (item.category === 'network') {
    return item.href || '/discover?tab=invitations';
  }

  return item.href;
}

async function parseApi<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || 'Action indisponible.');
  }
  return body as T;
}

export default function NotificationsPage() {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const socketRef = useRef<SocketLike | null>(null);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState<Record<NotificationCategory, number>>(defaultCounts);
  const [category, setCategory] = useState<NotificationCategory>('all');
  const [query, setQuery] = useState('');
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const unreadCount = counts.unread || 0;
  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.title, item.message, item.preview, item.actor?.name, item.actor?.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [items, query]);

  const authHeaders = useCallback(async () => {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (user?.id) headers.set('x-user-id', user.id);
    if (user?.fullName) headers.set('x-user-name', user.fullName);
    if (user?.username) headers.set('x-user-username', user.username);
    if (user?.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
    return headers;
  }, [getToken, user]);

  const loadNotifications = useCallback(
    async (nextOffset = 0, append = false) => {
      if (!isLoaded || !user) return;
      setLoading(!append);
      setNotice('');

      try {
        const response = await fetch(`/api/notifications?category=${category}&limit=30&offset=${nextOffset}`, {
          headers: await authHeaders(),
        });
        const body = await parseApi<NotificationsResponse>(response);
        setItems((current) => (append ? [...current, ...(body.data || [])] : body.data || []));
        setCounts({ ...defaultCounts, ...(body.counts || {}) });
        setSettings({ ...defaultSettings, ...(body.settings || {}) });
        setHasMore(Boolean(body.page?.hasMore));
        setOffset(nextOffset + (body.data?.length || 0));
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Notifications indisponibles.');
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, category, isLoaded, user],
  );

  useEffect(() => {
    void loadNotifications(0, false);
  }, [loadNotifications]);

  useEffect(() => {
    if (!isLoaded || !user?.id) return undefined;

    let cancelled = false;
    loadSocketScript()
      .then(() => {
        const socketWindow = window as SocketWindow;
        if (cancelled || !socketWindow.io) return;
        const socket = socketWindow.io(undefined, {
          path: '/socket.io',
          transports: ['polling', 'websocket'],
          auth: { userId: user.id },
          query: { userId: user.id },
        });
        socketRef.current = socket;
        socket.on('notification:new', (payload) => {
          const next = payload as NotificationItem;
          void loadNotifications(0, false);
          setCounts((current) => ({
            ...current,
            all: current.all + 1,
            unread: current.unread + 1,
            [next.category]: (current[next.category] || 0) + 1,
          }));
          if (settings.soundsEnabled) {
            setNotice('Nouvelle notification recue.');
          }
        });
        socket.on('notification:updated', () => void loadNotifications(0, false));
        socket.on('notification:deleted', () => void loadNotifications(0, false));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isLoaded, loadNotifications, settings.soundsEnabled, user?.id]);

  async function markRead(id: string) {
    await mutate('/api/notifications/read', { ids: [id] }, () => {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
      setCounts((current) => ({ ...current, unread: Math.max(0, current.unread - 1) }));
    });
  }

  async function markAllRead() {
    await mutate('/api/notifications/read-all', {}, () => {
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setCounts((current) => ({ ...current, unread: 0 }));
    });
  }

  async function archiveItem(id: string) {
    await mutate('/api/notifications/archive', { ids: [id] }, () => {
      setItems((current) => current.filter((item) => item.id !== id));
    });
  }

  async function deleteItem(id: string) {
    await mutate(`/api/notifications/${id}`, null, () => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 'DELETE');
  }

  async function muteType(type: string) {
    const mutedTypes = settings.mutedTypes.includes(type)
      ? settings.mutedTypes.filter((item) => item !== type)
      : [...settings.mutedTypes, type];
    await saveSettings({ mutedTypes });
  }

  async function saveSettings(patch: Partial<NotificationSettings>) {
    await mutate('/api/notifications/settings', patch, (body) => {
      const data = (body as { data?: NotificationSettings }).data;
      if (data) setSettings({ ...defaultSettings, ...data });
    });
  }

  async function mutate(
    url: string,
    body: Record<string, unknown> | null,
    onSuccess: (body?: unknown) => void,
    method = 'POST',
  ) {
    try {
      setNotice('');
      const response = await fetch(url, {
        method,
        headers: await authHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const parsed = await parseApi(response);
      onSuccess(parsed);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Action indisponible.');
    }
  }

  return (
    <main className="notificationsCenter">
      <aside className="sideNav" aria-label="Filtres notifications">
        <div className="sideTitle">
          <Bell size={18} />
          <span>Centre notifications</span>
        </div>
        <nav>
          {categories.map((item) => {
            const Icon = item.icon;
            const selected = category === item.id;
            return (
              <button
                type="button"
                key={item.id}
                className={selected ? 'navItem active' : 'navItem'}
                onClick={() => setCategory(item.id)}
              >
                <span><Icon size={16} />{item.label}</span>
                <strong>{counts[item.id] || 0}</strong>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="timelinePanel">
        <header className="smartHeader">
          <div>
            <span className="eyebrow">Notifications</span>
            <h1>Activite recente</h1>
            <p>{unreadCount ? `${unreadCount} notification(s) non lue(s)` : 'Aucune notification prioritaire'}</p>
          </div>

          <div className="headerTools">
            <label className="searchBox">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" />
            </label>
            <button type="button" className="toolButton" onClick={() => setSettingsOpen((open) => !open)}>
              <Settings size={16} />
              Parametres
            </button>
            <button type="button" className="primaryButton" disabled={!unreadCount} onClick={() => void markAllRead()}>
              <CheckCheck size={16} />
              Tout marquer comme lu
            </button>
          </div>
        </header>

        {settingsOpen ? (
          <section className="settingsPanel">
            <Toggle icon={settings.soundsEnabled ? Volume2 : VolumeX} label="Sons" checked={settings.soundsEnabled} onChange={(checked) => saveSettings({ soundsEnabled: checked })} />
            <Toggle icon={Mail} label="Email" checked={settings.emailEnabled} onChange={(checked) => saveSettings({ emailEnabled: checked })} />
            <Toggle icon={Bell} label="Push" checked={settings.pushEnabled} onChange={(checked) => saveSettings({ pushEnabled: checked })} />
            <Toggle icon={UsersRound} label="Reseau" checked={settings.networkEnabled} onChange={(checked) => saveSettings({ networkEnabled: checked })} />
            <Toggle icon={MessageSquare} label="Messages" checked={settings.messagesEnabled} onChange={(checked) => saveSettings({ messagesEnabled: checked })} />
            <Toggle icon={ShieldCheck} label="Securite" checked={settings.securityEnabled} onChange={(checked) => saveSettings({ securityEnabled: checked })} />
            <Toggle icon={UserRound} label="Profil" checked={settings.profileEnabled} onChange={(checked) => saveSettings({ profileEnabled: checked })} />
            <Toggle icon={Sparkles} label="Premium" checked={settings.premiumEnabled} onChange={(checked) => saveSettings({ premiumEnabled: checked })} />
          </section>
        ) : null}

        {notice ? <p className="notice">{notice}</p> : null}

        <div className="timeline">
          {loading ? (
            <div className="loadingState">Chargement des notifications...</div>
          ) : filteredItems.length ? (
            filteredItems.map((item) => (
              <article key={item.id} className={item.read ? 'notificationRow read' : 'notificationRow'}>
                <div className="avatar">
                  {assetUrl(item.actor?.avatarUrl) ? <img src={assetUrl(item.actor?.avatarUrl)} alt="" /> : <span>{initialsFor(item)}</span>}
                </div>

                <div className="notificationContent">
                  <div className="rowTop">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                    </div>
                    <span className={`priority ${item.priority}`}>{priorityLabels[item.priority] || 'Info'}</span>
                  </div>

                  <div className="rowMeta">
                    <span><Clock3 size={14} />{formatRelativeTime(item.createdAt)}</span>
                    {item.groupCount && item.groupCount > 1 ? <span>{item.groupCount} activites similaires</span> : null}
                    {!item.read ? <span className="unreadBadge">Non lue</span> : null}
                  </div>

                  <div className="rowActions">
                    {notificationHref(item) ? (
                      <Link href={localizeHref(locale, notificationHref(item) || '/notifications')} className="inlineAction" onClick={() => !item.read && void markRead(item.id)}>
                        <Eye size={14} />
                        {actionLabel(item)}
                      </Link>
                    ) : null}
                    {!item.read ? (
                      <button type="button" className="inlineAction" onClick={() => void markRead(item.id)}>
                        <CheckCheck size={14} />
                        Marquer comme lu
                      </button>
                    ) : null}
                    <button type="button" className="inlineAction" onClick={() => void archiveItem(item.id)}>
                      <Archive size={14} />
                      Archiver
                    </button>
                    <button type="button" className="inlineAction" onClick={() => void muteType(item.type)}>
                      {settings.mutedTypes.includes(item.type) ? <Bell size={14} /> : <BellOff size={14} />}
                      {settings.mutedTypes.includes(item.type) ? 'Reactiver ce type' : 'Desactiver ce type'}
                    </button>
                    <button type="button" className="iconAction" aria-label="Supprimer" onClick={() => void deleteItem(item.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <button type="button" className="moreButton" aria-label="Actions">
                  <MoreHorizontal size={16} />
                </button>
              </article>
            ))
          ) : (
            <div className="emptyState">
              <Bell size={24} />
              <strong>Aucune nouvelle notification</strong>
              <p>Votre activite recente apparaitra ici.</p>
            </div>
          )}
        </div>

        {hasMore && !loading ? (
          <button type="button" className="loadMore" onClick={() => void loadNotifications(offset, true)}>
            Charger plus
            <ChevronDown size={16} />
          </button>
        ) : null}
      </section>

      <footer className="compactFooter">
        <span>Communium</span>
        <span>Notifications en temps reel</span>
        <Link href={localizeHref(locale, '/settings')}>Parametres</Link>
      </footer>

      <style>{`
        html, body { overflow-x: hidden; }

        .notificationsCenter {
          width: min(1480px, calc(100% - 24px));
          margin: 0 auto;
          padding: 24px 0 18px;
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 18px;
          color: #0f172a;
        }

        .sideNav,
        .timelinePanel,
        .settingsPanel,
        .notificationRow,
        .compactFooter {
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(255,255,255,0.95);
          box-shadow: 0 16px 44px rgba(15, 23, 42, 0.07);
        }

        .sideNav {
          position: sticky;
          top: 14px;
          height: fit-content;
          border-radius: 18px;
          padding: 12px;
        }

        .sideTitle,
        .navItem,
        .headerTools,
        .searchBox,
        .toolButton,
        .primaryButton,
        .rowMeta,
        .rowActions,
        .inlineAction,
        .compactFooter {
          display: flex;
          align-items: center;
        }

        .sideTitle {
          gap: 8px;
          padding: 10px 10px 14px;
          font-weight: 900;
        }

        .sideNav nav {
          display: grid;
          gap: 4px;
        }

        .navItem {
          width: 100%;
          justify-content: space-between;
          gap: 10px;
          min-height: 42px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: #334155;
          padding: 0 10px;
          cursor: pointer;
          font-weight: 800;
        }

        .navItem span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .navItem strong {
          min-width: 26px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.78rem;
        }

        .navItem.active {
          background: #0f172a;
          color: #fff;
        }

        .navItem.active strong {
          background: rgba(255,255,255,0.14);
          color: #fff;
        }

        .timelinePanel {
          min-width: 0;
          border-radius: 20px;
          padding: 18px;
          display: grid;
          gap: 14px;
        }

        .smartHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        }

        .eyebrow {
          color: #1d4ed8;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        h1, p { margin: 0; letter-spacing: 0; }

        h1 {
          margin-top: 4px;
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          line-height: 1.05;
        }

        .smartHeader p,
        .rowTop p,
        .rowMeta,
        .emptyState p,
        .compactFooter {
          color: #64748b;
        }

        .headerTools {
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .searchBox {
          min-height: 42px;
          gap: 8px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: #f8fafc;
        }

        .searchBox input {
          width: 190px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
          font: inherit;
        }

        .toolButton,
        .primaryButton,
        .loadMore {
          min-height: 42px;
          gap: 8px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: #fff;
          color: #0f172a;
          padding: 0 13px;
          font-weight: 850;
          cursor: pointer;
        }

        .primaryButton {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        .primaryButton:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .settingsPanel {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          border-radius: 16px;
          padding: 10px;
        }

        .toggle {
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: #f8fafc;
          border-radius: 12px;
          padding: 0 10px;
          font-weight: 800;
        }

        .toggle span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .switch {
          width: 36px;
          height: 20px;
          border-radius: 999px;
          border: 0;
          background: #cbd5e1;
          padding: 2px;
          cursor: pointer;
        }

        .switch::after {
          content: '';
          display: block;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform .16s ease;
        }

        .switch.on {
          background: #1d4ed8;
        }

        .switch.on::after {
          transform: translateX(16px);
        }

        .notice {
          border-radius: 12px;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 10px 12px;
          font-weight: 800;
        }

        .timeline {
          display: grid;
          gap: 8px;
        }

        .notificationRow {
          position: relative;
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr) 30px;
          gap: 12px;
          border-radius: 16px;
          padding: 14px;
        }

        .notificationRow:not(.read) {
          border-color: rgba(37, 99, 235, 0.28);
          background: #f8fbff;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          overflow: hidden;
          background: #e2e8f0;
          color: #0f172a;
          display: grid;
          place-items: center;
          font-weight: 900;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .notificationContent {
          min-width: 0;
          display: grid;
          gap: 8px;
        }

        .rowTop {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
        }

        .rowTop strong {
          display: block;
          margin-bottom: 3px;
        }

        .rowTop p {
          line-height: 1.45;
        }

        .priority {
          height: 26px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 9px;
          background: #f1f5f9;
          color: #334155;
          font-size: 0.76rem;
          font-weight: 900;
        }

        .priority.message { background: #ecfeff; color: #0e7490; }
        .priority.important { background: #fff7ed; color: #c2410c; }
        .priority.security { background: #fef2f2; color: #b91c1c; }
        .priority.validation { background: #f0fdf4; color: #15803d; }
        .priority.recommendation { background: #eef2ff; color: #4338ca; }

        .rowMeta,
        .rowActions {
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.84rem;
        }

        .rowMeta span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .unreadBadge {
          color: #1d4ed8;
          font-weight: 900;
        }

        .inlineAction,
        .iconAction,
        .moreButton {
          min-height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: #fff;
          color: #0f172a;
          padding: 0 10px;
          gap: 6px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
        }

        .iconAction,
        .moreButton {
          width: 34px;
          display: grid;
          place-items: center;
          padding: 0;
        }

        .moreButton {
          border: 0;
          background: transparent;
          color: #64748b;
        }

        .emptyState,
        .loadingState {
          min-height: 260px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 8px;
          text-align: center;
          color: #475569;
        }

        .emptyState svg {
          color: #64748b;
        }

        .emptyState strong {
          color: #0f172a;
          font-size: 1.05rem;
        }

        .loadMore {
          width: fit-content;
          justify-self: center;
          display: inline-flex;
          align-items: center;
        }

        .compactFooter {
          grid-column: 1 / -1;
          justify-content: center;
          gap: 14px;
          min-height: 44px;
          border-radius: 14px;
          font-size: 0.86rem;
        }

        .compactFooter a {
          color: #1d4ed8;
          font-weight: 850;
        }

        @media (max-width: 980px) {
          .notificationsCenter {
            grid-template-columns: 1fr;
          }

          .sideNav {
            position: static;
          }

          .sideNav nav {
            display: flex;
            overflow-x: auto;
            padding-bottom: 2px;
          }

          .navItem {
            width: auto;
            flex: 0 0 auto;
          }

          .smartHeader {
            display: grid;
          }

          .headerTools {
            justify-content: stretch;
          }

          .searchBox,
          .searchBox input {
            width: 100%;
          }

          .settingsPanel {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .notificationsCenter {
            width: min(100% - 12px, 100%);
            padding-top: 12px;
          }

          .timelinePanel {
            padding: 12px;
            border-radius: 16px;
          }

          .notificationRow {
            grid-template-columns: 38px minmax(0, 1fr);
          }

          .avatar {
            width: 38px;
            height: 38px;
            border-radius: 12px;
          }

          .moreButton {
            display: none;
          }

          .rowTop {
            grid-template-columns: 1fr;
          }

          .settingsPanel {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function Toggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="toggle">
      <span><Icon size={15} />{label}</span>
      <button
        type="button"
        aria-label={label}
        className={checked ? 'switch on' : 'switch'}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
