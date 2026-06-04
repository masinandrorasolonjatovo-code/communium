'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Edit3,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  formatCompletionLabel,
  formatMemberRole,
  formatPlanLabel,
  formatPostTypeLabel,
  formatSubscriptionStatus,
  formatVerificationStatus,
  formatVerificationType,
  formatVisibilityLabel,
  tr,
} from '@/components/localized-labels';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isSupportedLocale, type Locale } from '@/i18n.config';

type PostVisibility = 'public' | 'private' | 'network' | 'premium';
type PostType = 'text' | 'image' | 'video' | 'project' | 'article' | 'cv' | 'event' | 'recruitment' | 'business';

interface DashboardProfile {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  city?: string | null;
  country?: string | null;
  profilePictureUrl?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  currentIndustry?: string | null;
  profession?: string | null;
  currentPosition?: string | null;
  membershipTier?: string | null;
  publicProfileUrl?: string | null;
  cvUrl?: string | null;
  privacySettings?: {
    profileVisibility?: string | null;
    allowNetworkingRequests?: boolean;
  };
}

interface DashboardPost {
  id: number;
  type: string;
  body: string;
  visibility: string;
  showOnProfile: boolean;
  pinned: boolean;
  stats: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  createdAt?: string | null;
}

interface CompletionItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

interface DashboardOverview {
  user: {
    id: number;
    username?: string | null;
    email?: string | null;
    role?: string | null;
    accountType?: string | null;
  };
  profile: DashboardProfile | null;
  subscription: {
    plan: string;
    status: string;
    renewsAt?: string | null;
    expiresAt?: string | null;
  };
  verificationStatus: {
    status: string;
    type: string;
    submittedAt?: string | null;
    reviewedAt?: string | null;
  };
  profileCompletion: {
    percent: number;
    completed: number;
    total: number;
    items: CompletionItem[];
  };
  stats: {
    profileViews: number;
    interactions: number;
    connections: number;
    activePosts: number;
  };
  activity: Array<{
    date: string;
    profileViews: number;
    interactions: number;
    connections: number;
  }>;
  hasActivityData?: boolean;
  unreadNotificationCount?: number;
  recentPosts: DashboardPost[];
  unreadNotifications: Array<{
    id: string;
    title: string;
    message: string;
    createdAt?: string | null;
  }>;
  recommendedActions: Array<{
    id: string;
    title: string;
    description: string;
    href: string;
    priority: string;
  }>;
}

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const postTypeValues: PostType[] = ['text', 'image', 'video', 'project', 'article', 'cv', 'event', 'recruitment', 'business'];
const visibilityValues: PostVisibility[] = ['public', 'network', 'premium', 'private'];

function assetUrl(fileUrl?: string | null) {
  if (!fileUrl) {
    return '';
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  return `${backendOrigin}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
}

function dateLocale(locale: Locale) {
  if (locale === 'en') return 'en-US';
  if (locale === 'ar') return 'ar-MA';
  return 'fr-FR';
}

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return tr(locale, 'Recent', 'Recent', 'Ø­Ø¯ÙŠØ«');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(dateLocale(locale), { day: '2-digit', month: 'short' }).format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function normalizeDashboardHref(locale: string, href: string) {
  return localizeHref(locale, href);
}

export default function DashboardPage() {
  const params = useParams<{ locale?: string }>();
  const locale: Locale = isSupportedLocale(params?.locale) ? params.locale : defaultLocale;
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [postBody, setPostBody] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [postVisibility, setPostVisibility] = useState<PostVisibility>('public');
  const [postOnProfile, setPostOnProfile] = useState(true);
  const [posting, setPosting] = useState(false);

  const fallbackName = user?.fullName || user?.username || tr(locale, 'Membre Communium', 'Communium member', 'Ø¹Ø¶Ùˆ Communium');
  const profile = overview?.profile || null;
  const displayName = profile?.fullName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || fallbackName;
  const editProfileHref = normalizeDashboardHref(locale, '/profile/edit');
  const postsHref = normalizeDashboardHref(locale, '/feed');
  const analyticsHref = normalizeDashboardHref(locale, '/dashboard/analytics');
  const completionHref = normalizeDashboardHref(locale, '/settings/profile-completion');
  const cvHref = normalizeDashboardHref(locale, '/profile/cv');
  const privacyHref = normalizeDashboardHref(locale, '/profile/settings/privacy');
  const verificationHref = normalizeDashboardHref(locale, '/profile/settings/verification');
  const signInHref = normalizeDashboardHref(locale, '/auth/sign-in');
  const headline =
    [profile?.currentJobTitle || profile?.profession || profile?.currentPosition, profile?.currentCompany]
      .filter(Boolean)
      .join(' - ') ||
    formatMemberRole(locale, overview?.user?.role) ||
    tr(locale, 'Membre Communium', 'Communium member', 'Ø¹Ø¶Ùˆ Communium');
  const location = [profile?.city, profile?.country].filter(Boolean).join(', ');
  const avatar = assetUrl(profile?.profilePictureUrl) || user?.imageUrl || '';
  const stats = overview?.stats || { profileViews: 0, interactions: 0, connections: 0, activePosts: 0 };
  const hasStats = Object.values(stats).some((value) => value > 0);
  const hasActivity = Boolean(
    overview?.hasActivityData ?? overview?.activity?.some((item) => item.profileViews || item.interactions || item.connections)
  );

  const navigationItems = useMemo(
    () => [
      { label: tr(locale, 'Vue d ensemble', 'Overview', ''), href: normalizeDashboardHref(locale, '/dashboard'), icon: LayoutDashboard },
      { label: tr(locale, 'Statistiques', 'Statistics', 'Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª'), href: analyticsHref, icon: BarChart3 },
      { label: tr(locale, 'Reseau', 'Network', 'Ø§Ù„Ø´Ø¨ÙƒØ©'), href: normalizeDashboardHref(locale, '/discover'), icon: Users },
      { label: tr(locale, 'Messages', 'Messages', 'Ø§Ù„Ø±Ø³Ø§Ø¦Ù„'), href: normalizeDashboardHref(locale, '/messages'), icon: MessageCircle },
      { label: tr(locale, 'Notifications', 'Notifications', 'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª'), href: normalizeDashboardHref(locale, '/notifications'), icon: Bell },
      { label: tr(locale, 'CV & documents', 'Resume & documents', 'Ø§Ù„Ø³ÙŠØ±Ø© ÙˆØ§Ù„ÙˆØ«Ø§Ø¦Ù‚'), href: cvHref, icon: FileText },
      { label: tr(locale, 'Premium', 'Premium', 'Premium'), href: normalizeDashboardHref(locale, '/premium'), icon: Wallet },
      { label: tr(locale, 'Securite', 'Security', 'Ø§Ù„Ø£Ù…Ø§Ù†'), href: normalizeDashboardHref(locale, '/settings/security'), icon: ShieldCheck },
      { label: tr(locale, 'Parametres', 'Settings', 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª'), href: normalizeDashboardHref(locale, '/settings'), icon: Settings },
    ],
    [analyticsHref, cvHref, locale],
  );

  async function authHeaders(json = true) {
    const token = await getToken();
    const headers = new Headers();

    if (json) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (user?.id) {
      headers.set('x-user-id', user.id);
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

  async function loadOverview() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendOrigin}/api/dashboard/overview`, {
        headers: await authHeaders(),
        cache: 'no-store',
      });
      const body = (await response.json()) as { success?: boolean; data?: DashboardOverview; error?: string };

      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error || tr(locale, 'Tableau de bord indisponible', 'Dashboard unavailable', 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ØºÙŠØ± Ù…ØªØ§Ø­Ø©'));
      }

      setOverview(body.data);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr(locale, 'Tableau de bord indisponible', 'Dashboard unavailable', 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ØºÙŠØ± Ù…ØªØ§Ø­Ø©'));
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  async function createPost(event: FormEvent) {
    event.preventDefault();
    if (!postBody.trim()) {
      setError(tr(locale, 'La publication est vide.', 'The post is empty.', 'Ø§Ù„Ù…Ù†Ø´ÙˆØ± ÙØ§Ø±Øº.'));
      return;
    }

    setPosting(true);
    try {
      const response = await fetch(`${backendOrigin}/api/profile/posts`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          body: postBody.trim(),
          type: postType,
          visibility: postVisibility,
          showOnProfile: postOnProfile,
        }),
      });
      const body = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !body.success) {
        throw new Error(body.error || tr(locale, 'Publication impossible', 'Cannot publish', 'ØªØ¹Ø°Ø± Ø§Ù„Ù†Ø´Ø±'));
      }

      setPostBody('');
      setPostType('text');
      setPostVisibility('public');
      setPostOnProfile(true);
      setPostModalOpen(false);
      await loadOverview();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr(locale, 'Publication impossible', 'Cannot publish', 'ØªØ¹Ø°Ø± Ø§Ù„Ù†Ø´Ø±'));
    } finally {
      setPosting(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <main className="dashboardPage dashboardShell">
        <section className="dashboardAuthState">
          <h1>{tr(locale, 'Tableau de bord', 'Dashboard', 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…')}</h1>
          <p>{tr(locale, 'Chargement de votre activite professionnelle.', 'Loading your professional activity.', 'Ø¬Ø§Ø± ØªØ­Ù…ÙŠÙ„ Ù†Ø´Ø§Ø·Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ.')}</p>
        </section>
        <DashboardStyles />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="dashboardPage dashboardShell">
        <section className="dashboardAuthState">
          <h1>{tr(locale, 'Tableau de bord', 'Dashboard', 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…')}</h1>
          <p>{tr(locale, 'Connectez-vous pour suivre votre profil, vos publications et votre reseau.', 'Sign in to track your profile, posts and network.', 'Ø³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ù„ÙÙƒ ÙˆÙ…Ù†Ø´ÙˆØ±Ø§ØªÙƒ ÙˆØ´Ø¨ÙƒØªÙƒ.')}</p>
          <Link href={signInHref} className="primaryButton">{tr(locale, 'Se connecter', 'Sign in', 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„')}</Link>
        </section>
        <DashboardStyles />
      </main>
    );
  }

  return (
    <main className="dashboardPage dashboardShell">
      <div className="dashboardGrid">
        <aside className="leftSidebar" aria-label="Navigation dashboard">
          <div className="sidebarIdentity">
            <div className="smallAvatar">{avatar ? <img src={avatar} alt={displayName} /> : <span>{initials(displayName) || 'CM'}</span>}</div>
            <div>
              <strong>{displayName}</strong>
              <span>{headline}</span>
            </div>
          </div>

          <nav className="sidebarNav">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="navItem">
                  <Icon size={17} />
                  <span>{item.href.endsWith('/dashboard') ? tr(locale, 'Vue d ensemble', 'Overview', 'Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø©') : item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="dashboardMain" id="overview">
          {error ? (
            <div className="errorBanner">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} aria-label="Fermer">
                <X size={15} />
              </button>
            </div>
          ) : null}

          <header className="dashboardHeader">
            <div className="headerCopy">
              <p className="eyebrow">{tr(locale, 'Tableau de bord', 'Dashboard', 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…')}</p>
              <h1>{tr(locale, 'Tableau de bord', 'Dashboard', 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…')}</h1>
              <p>{tr(locale, 'Suivez votre visibilite, vos publications et votre activite professionnelle.', 'Track your visibility, posts and professional activity.', 'ØªØ§Ø¨Ø¹ Ø¸Ù‡ÙˆØ±Ùƒ ÙˆÙ…Ù†Ø´ÙˆØ±Ø§ØªÙƒ ÙˆÙ†Ø´Ø§Ø·Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ.')}</p>
              <div className="profileMeta">
                <span>{headline}</span>
                {location ? <span>{location}</span> : null}
                <span>{formatVisibilityLabel(locale, profile?.privacySettings?.profileVisibility || 'Public')}</span>
                <span>{formatPlanLabel(locale, profile?.membershipTier || overview?.subscription?.plan)}</span>
              </div>
            </div>

            <div className="headerActions">
              <Link href={editProfileHref} className="softButton">
                <Edit3 size={16} />
                {tr(locale, 'Modifier profil', 'Edit profile', 'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ù„Ù')}
              </Link>
              <button type="button" className="primaryButton" onClick={() => setPostModalOpen(true)}>
                <Plus size={16} />
                {tr(locale, 'Creer une publication', 'Create a post', 'Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù†Ø´ÙˆØ±')}
              </button>
            </div>
          </header>

          <section className="statsGrid" aria-label="Statistiques principales">
            <StatCard locale={locale} title={tr(locale, 'Vues du profil', 'Profile views', 'Ù…Ø´Ø§Ù‡Ø¯Ø§Øª Ø§Ù„Ù…Ù„Ù')} value={stats.profileViews} />
            <StatCard locale={locale} title={tr(locale, 'Interactions', 'Interactions', 'Ø§Ù„ØªÙØ§Ø¹Ù„Ø§Øª')} value={stats.interactions} />
            <StatCard locale={locale} title={tr(locale, 'Connexions', 'Connections', 'Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª')} value={stats.connections} />
            <StatCard locale={locale} title={tr(locale, 'Publications actives', 'Active posts', 'Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø©')} value={stats.activePosts} />
          </section>

          {!hasStats ? <p className="dataNotice">{tr(locale, 'Aucune donnee pour le moment.', 'No data yet.', 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø­Ø§Ù„ÙŠØ§.')}</p> : null}

          <section className="contentPanel">
            <div className="panelTitle">
              <div>
                <p className="eyebrow">{tr(locale, 'Statistiques', 'Statistics', 'Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª')}</p>
                <h2>{tr(locale, 'Activite', 'Activity', 'Ø§Ù„Ù†Ø´Ø§Ø·')}</h2>
              </div>
              <Link href={analyticsHref} className="textLink">{tr(locale, 'Voir statistiques', 'View statistics', 'Ø¹Ø±Ø¶ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª')}</Link>
            </div>

            {hasActivity ? (
              <ActivityChart data={overview?.activity || []} locale={locale} />
            ) : (
              <div className="emptyState">
                <BarChart3 size={22} />
                <strong>{tr(locale, 'Les statistiques apparaitront apres les premieres interactions.', 'Statistics will appear after the first interactions.', 'Ø³ØªØ¸Ù‡Ø± Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø¨Ø¹Ø¯ Ø£ÙˆÙ„ ØªÙØ§Ø¹Ù„Ø§Øª.')}</strong>
              </div>
            )}
          </section>

          <section className="contentPanel">
            <div className="panelTitle">
              <div>
                <p className="eyebrow">{tr(locale, 'Publications recentes', 'Recent posts', 'Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø§Ù„Ø£Ø®ÙŠØ±Ø©')}</p>
                <h2>{tr(locale, 'Publications recentes', 'Recent posts', 'Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø§Ù„Ø£Ø®ÙŠØ±Ø©')}</h2>
              </div>
              <div className="panelActions">
                <button type="button" className="softButton compact" onClick={() => setPostModalOpen(true)}>
                  <Plus size={15} />
                  {tr(locale, 'Creer', 'Create', 'Ø¥Ù†Ø´Ø§Ø¡')}
                </button>
                <Link href={postsHref} className="textLink">{tr(locale, 'Voir toutes les publications', 'View all posts', 'Ø¹Ø±Ø¶ ÙƒÙ„ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª')}</Link>
              </div>
            </div>

            {overview?.recentPosts?.length ? (
              <div className="postList">
                {overview.recentPosts.map((post) => (
                  <article key={post.id} className="postRow">
                    <div>
                      <strong>{post.body}</strong>
                      <span>
                        {formatDate(post.createdAt, locale)} - {formatVisibilityLabel(locale, post.visibility)} - {post.showOnProfile ? tr(locale, 'Sur le profil', 'On profile', 'Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù„Ù') : tr(locale, 'Masquee du profil', 'Hidden from profile', 'Ù…Ø®ÙÙŠ Ù…Ù† Ø§Ù„Ù…Ù„Ù')}
                      </span>
                    </div>
                    <div className="postStats">
                      <span>{post.stats.likes} {tr(locale, 'reactions', 'reactions', 'ØªÙØ§Ø¹Ù„Ø§Øª')}</span>
                      <span>{post.stats.comments} {tr(locale, 'commentaires', 'comments', 'ØªØ¹Ù„ÙŠÙ‚Ø§Øª')}</span>
                      <span>{post.stats.saves} {tr(locale, 'sauvegardes', 'saves', 'Ø­ÙØ¸')}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyState">
                <Send size={22} />
                <strong>{tr(locale, 'Aucune publication pour le moment.', 'No posts yet.', 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø­Ø§Ù„ÙŠØ§.')}</strong>
              </div>
            )}
          </section>

          <section className="contentPanel">
            <div className="panelTitle">
              <div>
                <p className="eyebrow">{tr(locale, 'Progression du profil', 'Profile progress', 'ØªÙ‚Ø¯Ù… Ø§Ù„Ù…Ù„Ù')}</p>
                <h2>{tr(locale, 'Profil complete a', 'Profile completed at', 'Ø§ÙƒØªÙ…Ù„ Ø§Ù„Ù…Ù„Ù Ø¨Ù†Ø³Ø¨Ø©')} {overview?.profileCompletion?.percent || 0}%</h2>
              </div>
              <Link href={completionHref} className="textLink">{tr(locale, 'Voir la checklist', 'View checklist', 'Ø¹Ø±Ø¶ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©')}</Link>
            </div>

            <div className="completionLayout">
              <div className="completionMeter">
                <span style={{ width: `${overview?.profileCompletion?.percent || 0}%` }} />
              </div>
              <div className="completionItems">
                {(overview?.profileCompletion?.items || []).map((item) => (
                  <Link key={item.id} href={normalizeDashboardHref(locale, item.href)} className={item.done ? 'completionItem done' : 'completionItem'}>
                    <CheckCircle2 size={16} />
                    <span>{formatCompletionLabel(locale, item.id, item.label)}</span>
                  </Link>
                ))}
              </div>
              <div className="completionActions">
                <Link href={editProfileHref} className="softButton compact">{tr(locale, 'Completer identite', 'Complete identity', 'Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ù‡ÙˆÙŠØ©')}</Link>
                <Link href={cvHref} className="softButton compact">{tr(locale, 'Ajouter CV', 'Add resume', 'Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø³ÙŠØ±Ø©')}</Link>
                <Link href={privacyHref} className="softButton compact">{tr(locale, 'Configurer confidentialite', 'Set privacy', 'Ø¶Ø¨Ø· Ø§Ù„Ø®ØµÙˆØµÙŠØ©')}</Link>
                <Link href={verificationHref} className="softButton compact">{tr(locale, 'Lancer verification', 'Start verification', 'Ø¨Ø¯Ø¡ Ø§Ù„ØªÙˆØ«ÙŠÙ‚')}</Link>
              </div>
            </div>
          </section>
        </section>

        <aside className="rightPanel" aria-label="Informations dashboard">
          <section className="sideCard recommendedCard">
            <p className="eyebrow">{tr(locale, 'Action recommandee', 'Recommended action', 'Ø¥Ø¬Ø±Ø§Ø¡ Ù…Ù‚ØªØ±Ø­')}</p>
            {overview?.recommendedActions?.[0] ? (
              <>
                <h2>{overview.recommendedActions[0].title}</h2>
                <p>{overview.recommendedActions[0].description}</p>
                <Link href={normalizeDashboardHref(locale, overview.recommendedActions[0].href)} className="primaryButton full">
                  {tr(locale, 'Ouvrir', 'Open', 'ÙØªØ­')}
                </Link>
              </>
            ) : (
              <>
                <h2>{tr(locale, 'Profil stable', 'Stable profile', 'Ù…Ù„Ù Ù…Ø³ØªÙ‚Ø±')}</h2>
                <p>{tr(locale, 'Aucune action urgente pour le moment.', 'No urgent action for now.', 'Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø¥Ø¬Ø±Ø§Ø¡ Ø¹Ø§Ø¬Ù„ Ø­Ø§Ù„ÙŠØ§.')}</p>
              </>
            )}
          </section>

          <section className="sideCard">
            <div className="sideTitle">
              <div>
                <p className="eyebrow">{tr(locale, 'Notifications importantes', 'Important notifications', 'Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù…Ù‡Ù…Ø©')}</p>
                <h2>{tr(locale, 'Notifications', 'Notifications', 'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª')}</h2>
              </div>
              <button type="button" className="iconButton" onClick={() => setNotificationsOpen(true)} aria-label="Ouvrir notifications">
                <Bell size={16} />
              </button>
            </div>
            {(overview?.unreadNotificationCount || overview?.unreadNotifications?.length) ? (
              <div className="notificationStack">
                {overview.unreadNotifications.slice(0, 3).map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mutedText">{tr(locale, 'Aucune notification importante.', 'No important notification.', 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù…Ù‡Ù…Ø©.')}</p>
            )}
            {overview?.unreadNotificationCount && overview.unreadNotificationCount > overview.unreadNotifications.length ? (
              <p className="mutedText">{overview.unreadNotificationCount} {tr(locale, 'notifications non lues au total.', 'unread notifications in total.', 'Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ØºÙŠØ± Ù…Ù‚Ø±ÙˆØ¡Ø© Ø¥Ø¬Ù…Ø§Ù„Ø§.')}</p>
            ) : null}
            <Link href={normalizeDashboardHref(locale, '/notifications')} className="textLink">{tr(locale, 'Voir notifications', 'View notifications', 'Ø¹Ø±Ø¶ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª')}</Link>
          </section>

          <section className="sideCard">
            <p className="eyebrow">{tr(locale, 'Statut abonnement', 'Subscription status', 'Ø­Ø§Ù„Ø© Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ')}</p>
            <h2>{formatPlanLabel(locale, overview?.subscription?.plan)}</h2>
            <p>{formatSubscriptionStatus(locale, overview?.subscription?.status)}</p>
            <Link href={normalizeDashboardHref(locale, '/premium')} className="softButton full">
              <Wallet size={15} />
              {tr(locale, 'Voir Premium', 'View Premium', 'Ø¹Ø±Ø¶ Premium')}
            </Link>
          </section>

          <section className="sideCard">
            <p className="eyebrow">{tr(locale, 'Verification', 'Verification', 'Ø§Ù„ØªÙˆØ«ÙŠÙ‚')}</p>
            <h2>{formatVerificationStatus(locale, overview?.verificationStatus?.status)}</h2>
            <p>{formatVerificationType(locale, overview?.verificationStatus?.type)}</p>
            <Link href={verificationHref} className="softButton full">
              <ShieldCheck size={15} />
              {tr(locale, 'Ouvrir verification', 'Open verification', 'ÙØªØ­ Ø§Ù„ØªÙˆØ«ÙŠÙ‚')}
            </Link>
          </section>

          <section className="sideCard">
            <p className="eyebrow">{tr(locale, 'Raccourcis rapides', 'Quick shortcuts', 'Ø§Ø®ØªØµØ§Ø±Ø§Øª Ø³Ø±ÙŠØ¹Ø©')}</p>
            <div className="shortcutStack">
              <Link href={normalizeDashboardHref(locale, '/messages')}>{tr(locale, 'Voir messages', 'View messages', 'Ø¹Ø±Ø¶ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„')}</Link>
              <Link href={cvHref}>{tr(locale, 'Documents', 'Documents', 'Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚')}</Link>
              <Link href={normalizeDashboardHref(locale, '/settings/security')}>{tr(locale, 'Securite', 'Security', 'Ø§Ù„Ø£Ù…Ø§Ù†')}</Link>
              <Link href={normalizeDashboardHref(locale, '/settings')}>{tr(locale, 'Parametres', 'Settings', 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª')}</Link>
            </div>
          </section>
        </aside>
      </div>

      {postModalOpen ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <form className="postModal" onSubmit={createPost}>
            <header>
              <div>
                <p className="eyebrow">{tr(locale, 'Publication', 'Post', 'Ù…Ù†Ø´ÙˆØ±')}</p>
                <h2>{tr(locale, 'Creer une publication', 'Create a post', 'Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù†Ø´ÙˆØ±')}</h2>
              </div>
              <button type="button" className="iconButton" onClick={() => setPostModalOpen(false)} aria-label="Fermer">
                <X size={16} />
              </button>
            </header>

            <textarea value={postBody} onChange={(event) => setPostBody(event.target.value)} placeholder={tr(locale, 'Partager une actualite, un projet ou une opportunite professionnelle...', 'Share news, a project or a professional opportunity...', 'Ø´Ø§Ø±Ùƒ Ø®Ø¨Ø±Ø§ Ø£Ùˆ Ù…Ø´Ø±ÙˆØ¹Ø§ Ø£Ùˆ ÙØ±ØµØ© Ù…Ù‡Ù†ÙŠØ©...')} />
            <div className="modalControls">
              <label>
                {tr(locale, 'Type', 'Type', 'Ø§Ù„Ù†ÙˆØ¹')}
                <select value={postType} onChange={(event) => setPostType(event.target.value as PostType)}>
                  {postTypeValues.map((item) => (
                    <option key={item} value={item}>{formatPostTypeLabel(locale, item)}</option>
                  ))}
                </select>
              </label>
              <label>
                {tr(locale, 'Visibilite', 'Visibility', 'Ø§Ù„Ø¸Ù‡ÙˆØ±')}
                <select value={postVisibility} onChange={(event) => setPostVisibility(event.target.value as PostVisibility)}>
                  {visibilityValues.map((item) => (
                    <option key={item} value={item}>{formatVisibilityLabel(locale, item)}</option>
                  ))}
                </select>
              </label>
              <label className="checkControl">
                <input type="checkbox" checked={postOnProfile} onChange={(event) => setPostOnProfile(event.target.checked)} />
                {tr(locale, 'Afficher sur le profil', 'Show on profile', 'Ø¥Ø¸Ù‡Ø§Ø± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù„Ù')}
              </label>
            </div>

            <footer>
              <button type="button" className="softButton" onClick={() => setPostModalOpen(false)}>{tr(locale, 'Annuler', 'Cancel', 'Ø¥Ù„ØºØ§Ø¡')}</button>
              <button type="submit" className="primaryButton" disabled={posting}>{posting ? tr(locale, 'Publication...', 'Publishing...', 'Ø¬Ø§Ø± Ø§Ù„Ù†Ø´Ø±...') : tr(locale, 'Publier', 'Publish', 'Ù†Ø´Ø±')}</button>
            </footer>
          </form>
        </div>
      ) : null}

      {notificationsOpen ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <section className="notificationModal">
            <header>
              <div>
                <p className="eyebrow">{tr(locale, 'Notifications importantes', 'Important notifications', 'Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù…Ù‡Ù…Ø©')}</p>
                <h2>{tr(locale, 'Notifications', 'Notifications', 'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª')}</h2>
              </div>
              <button type="button" className="iconButton" onClick={() => setNotificationsOpen(false)} aria-label="Fermer">
                <X size={16} />
              </button>
            </header>
            {(overview?.unreadNotificationCount || overview?.unreadNotifications?.length) ? (
              <div className="notificationStack">
                {overview.unreadNotifications.map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                    <small>{formatDate(item.createdAt, locale)}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mutedText">{tr(locale, 'Aucune notification importante.', 'No important notification.', 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù…Ù‡Ù…Ø©.')}</p>
            )}
            {overview?.unreadNotificationCount && overview.unreadNotificationCount > overview.unreadNotifications.length ? (
              <p className="mutedText">{overview.unreadNotificationCount} {tr(locale, 'notifications non lues au total.', 'unread notifications in total.', 'Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ØºÙŠØ± Ù…Ù‚Ø±ÙˆØ¡Ø© Ø¥Ø¬Ù…Ø§Ù„Ø§.')}</p>
            ) : null}
            <Link href={normalizeDashboardHref(locale, '/notifications')} className="primaryButton full">{tr(locale, 'Ouvrir les notifications', 'Open notifications', 'ÙØªØ­ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª')}</Link>
          </section>
        </div>
      ) : null}

      <DashboardStyles />
    </main>
  );
}

function StatCard({ locale, title, value }: { locale: Locale; title: string; value: number }) {
  return (
    <article className="statCard">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{value > 0 ? tr(locale, 'Donnee disponible', 'Data available', 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…ØªØ§Ø­Ø©') : tr(locale, 'Aucune donnee pour le moment', 'No data yet', 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø­Ø§Ù„ÙŠØ§')}</small>
    </article>
  );
}

function ActivityChart({ data, locale }: { data: DashboardOverview['activity']; locale: Locale }) {
  const max = Math.max(1, ...data.map((item) => item.profileViews + item.interactions + item.connections));

  return (
    <div className="activityChart" aria-label="Graphique activite">
      {data.map((item) => {
        const total = item.profileViews + item.interactions + item.connections;
        return (
          <div key={item.date} className="activityBar">
            <span style={{ height: `${Math.max(4, (total / max) * 100)}%` }} />
            <small>{new Date(item.date).toLocaleDateString(dateLocale(locale), { weekday: 'short' })}</small>
          </div>
        );
      })}
    </div>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      .dashboardShell {
        min-height: calc(100vh - 120px);
        color: var(--text-primary);
        padding: 14px 10px 28px;
      }

      .dashboardGrid {
        width: min(1740px, 100%);
        display: grid;
        grid-template-columns: 250px minmax(0, 1fr) 320px;
        gap: 16px;
        align-items: start;
        margin: 0 auto;
      }

      .leftSidebar,
      .dashboardHeader,
      .contentPanel,
      .sideCard,
      .statCard,
      .dashboardAuthState,
      .postModal,
      .notificationModal {
        border: 1px solid var(--line-soft);
        background: var(--surface-3);
        color: var(--text-primary);
        box-shadow: var(--shadow-soft);
      }

      .leftSidebar,
      .rightPanel {
        position: sticky;
        top: 130px;
      }

      .leftSidebar {
        display: grid;
        gap: 14px;
        border-radius: 22px;
        padding: 14px;
      }

      .sidebarIdentity {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        padding-bottom: 12px;
      }

      .smallAvatar {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 14px;
        background: #0f172a;
        color: #ffffff;
        font-weight: 950;
      }

      .smallAvatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .sidebarIdentity strong,
      .sidebarIdentity span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sidebarIdentity span,
      .mutedText,
      .postRow span,
      .statCard small,
      .profileMeta span,
      .notificationStack span,
      .sideCard p {
        color: var(--text-muted);
      }

      .sidebarNav {
        display: grid;
        gap: 4px;
      }

      .navItem,
      .shortcutStack a {
        min-height: 38px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 12px;
        color: var(--text-secondary);
        padding: 0 10px;
        text-decoration: none;
        font-weight: 850;
      }

      .navItem:hover,
      .shortcutStack a:hover {
        background: color-mix(in srgb, var(--brand-600) 11%, transparent);
        color: var(--brand-600);
      }

      .dashboardMain {
        display: grid;
        gap: 16px;
      }

      .dashboardHeader {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        border-radius: 24px;
        padding: 24px;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: var(--brand-600);
        font-size: 0.76rem;
        font-weight: 950;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      h1,
      h2,
      p {
        letter-spacing: 0;
      }

      h1 {
        margin: 0;
        font-size: clamp(2.1rem, 4vw, 4.1rem);
        line-height: 1;
      }

      h2 {
        margin: 0;
        font-size: 1.1rem;
      }

      .headerCopy > p:not(.eyebrow) {
        max-width: 760px;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .profileMeta,
      .headerActions,
      .panelActions,
      .completionActions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .profileMeta span {
        border: 1px solid var(--line-soft);
        border-radius: 999px;
        background: var(--panel-inset);
        padding: 6px 10px;
        font-size: 0.84rem;
        font-weight: 850;
      }

      .headerActions {
        justify-content: flex-end;
        align-content: flex-start;
        min-width: 280px;
      }

      .primaryButton,
      .softButton,
      .textLink {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        font-weight: 900;
        text-decoration: none;
        cursor: pointer;
      }

      .primaryButton {
        border: 0;
        background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
        color: #ffffff;
        padding: 0 16px;
      }

      .softButton {
        border: 1px solid var(--line-soft);
        background: var(--panel-inset);
        color: var(--text-primary);
        padding: 0 14px;
      }

      .compact {
        min-height: 34px;
        padding: 0 12px;
        font-size: 0.88rem;
      }

      .full {
        width: 100%;
      }

      .textLink {
        min-height: auto;
        color: var(--brand-600);
        padding: 0;
      }

      .statsGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .statCard,
      .contentPanel,
      .sideCard {
        border-radius: 18px;
        padding: 18px;
      }

      .statCard {
        display: grid;
        gap: 8px;
      }

      .statCard span {
        color: var(--text-secondary);
        font-weight: 850;
      }

      .statCard strong {
        font-size: 2rem;
      }

      .dataNotice {
        margin: -4px 0 0;
        color: var(--text-muted);
        font-weight: 850;
      }

      .panelTitle,
      .sideTitle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .activityChart {
        height: 240px;
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        align-items: end;
        gap: 10px;
        border-radius: 16px;
        background: var(--panel-inset);
        padding: 16px;
      }

      .activityBar {
        height: 100%;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: end;
        justify-items: center;
      }

      .activityBar span {
        width: 100%;
        max-width: 34px;
        border-radius: 999px 999px 4px 4px;
        background: var(--brand-600);
      }

      .activityBar small {
        color: var(--text-muted);
        font-weight: 800;
      }

      .emptyState {
        display: grid;
        place-items: center;
        gap: 10px;
        min-height: 190px;
        border: 1px dashed var(--line-strong);
        border-radius: 16px;
        background: var(--panel-inset);
        color: var(--text-secondary);
        text-align: center;
      }

      .postList,
      .completionItems,
      .notificationStack,
      .shortcutStack,
      .rightPanel {
        display: grid;
        gap: 10px;
      }

      .postRow {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        border: 1px solid var(--line-soft);
        border-radius: 16px;
        background: var(--surface-2);
        padding: 14px;
      }

      .postRow strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .postStats {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
      }

      .postStats span {
        border-radius: 999px;
        background: var(--panel-inset);
        padding: 5px 8px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .completionLayout {
        display: grid;
        gap: 14px;
      }

      .completionMeter {
        height: 10px;
        overflow: hidden;
        border-radius: 999px;
        background: var(--line-strong);
      }

      .completionMeter span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--brand-600);
      }

      .completionItems {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .completionItem {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--line-soft);
        border-radius: 12px;
        background: var(--panel-inset);
        color: var(--text-secondary);
        padding: 10px;
        text-decoration: none;
        font-weight: 850;
      }

      .completionItem.done {
        border-color: rgba(22, 163, 74, 0.24);
        background: #f0fdf4;
        color: #166534;
      }

      .recommendedCard {
        background: var(--surface-3);
        color: var(--text-primary);
      }

      .recommendedCard .eyebrow,
      .recommendedCard p {
        color: var(--text-muted);
      }

      .iconButton {
        width: 36px;
        height: 36px;
        display: inline-grid;
        place-items: center;
        border: 1px solid var(--line-soft);
        border-radius: 12px;
        background: var(--surface-3);
        color: var(--text-primary);
        cursor: pointer;
      }

      .notificationStack article {
        display: grid;
        gap: 5px;
        border: 1px solid var(--line-soft);
        border-radius: 14px;
        background: var(--panel-inset);
        padding: 12px;
      }

      .shortcutStack a {
        background: var(--panel-inset);
      }

      .errorBanner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border: 1px solid rgba(220, 38, 38, 0.2);
        border-radius: 14px;
        background: #fef2f2;
        color: #991b1b;
        padding: 12px 14px;
        font-weight: 850;
      }

      .errorBanner button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }

      .dashboardAuthState {
        width: min(680px, 100%);
        display: grid;
        gap: 14px;
        margin: 60px auto;
        border-radius: 22px;
        padding: 28px;
        text-align: center;
      }

      .modalBackdrop {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(15, 23, 42, 0.42);
      }

      .postModal,
      .notificationModal {
        width: min(680px, 100%);
        display: grid;
        gap: 14px;
        border-radius: 22px;
        padding: 20px;
      }

      .postModal header,
      .notificationModal header,
      .postModal footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .postModal textarea {
        min-height: 160px;
        resize: vertical;
      }

      .postModal textarea,
      .postModal select {
        width: 100%;
        border: 1px solid var(--field-line);
        border-radius: 14px;
        background: var(--field-bg);
        color: var(--text-primary);
        padding: 12px;
        font: inherit;
      }

      .modalControls {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .modalControls label {
        display: grid;
        gap: 6px;
        color: var(--text-secondary);
        font-size: 0.86rem;
        font-weight: 850;
      }

      .checkControl {
        align-content: end;
        grid-template-columns: auto 1fr;
        align-items: center;
      }

      html[data-theme='dark'] .dashboardPage {
        color: #e7eefb !important;
      }

      html[data-theme='dark'] .dashboardPage :is(
        .leftSidebar,
        .dashboardHeader,
        .statCard,
        .contentPanel,
        .sideCard,
        .recommendedCard,
        .dashboardAuthState,
        .postModal,
        .notificationModal
      ) {
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 30%),
          rgba(15, 23, 42, 0.96) !important;
        border-color: rgba(148, 163, 184, 0.24) !important;
        color: #e7eefb !important;
        box-shadow: 0 24px 70px rgba(2, 6, 23, 0.36) !important;
      }

      html[data-theme='dark'] .dashboardPage :is(
        .activityChart,
        .emptyState,
        .postRow,
        .completionItem,
        .notificationStack article,
        .shortcutStack a,
        .profileMeta span,
        .softButton,
        .iconButton,
        .postStats span,
        .modalControls label,
        .postModal textarea,
        .postModal select
      ) {
        background: rgba(30, 41, 59, 0.92) !important;
        border-color: rgba(148, 163, 184, 0.26) !important;
        color: #e7eefb !important;
      }

      html[data-theme='dark'] .dashboardPage :is(h1, h2, h3, strong, label, li, .statCard strong) {
        color: #f8fafc !important;
      }

      html[data-theme='dark'] .dashboardPage :is(
        p,
        small,
        span,
        .mutedText,
        .dataNotice,
        .statCard span,
        .sideCard p,
        .recommendedCard .eyebrow,
        .recommendedCard p,
        .headerCopy > p:not(.eyebrow)
      ) {
        color: #cbd5e1 !important;
      }

      html[data-theme='dark'] .dashboardPage .eyebrow {
        color: #60a5fa !important;
      }

      html[data-theme='dark'] .dashboardPage :is(.primaryButton, .primaryButton *, .textLink) {
        color: #ffffff !important;
      }

      html[data-theme='dark'] .dashboardPage .completionItem.done {
        background: rgba(22, 163, 74, 0.18) !important;
        border-color: rgba(34, 197, 94, 0.3) !important;
        color: #bbf7d0 !important;
      }

      html[data-theme='dark'] .dashboardPage .errorBanner {
        background: rgba(127, 29, 29, 0.34) !important;
        border-color: rgba(248, 113, 113, 0.34) !important;
        color: #fecaca !important;
      }

      html[data-theme='dark'] .dashboardPage :is(
        .sidebarIdentity,
        .navItem,
        .panelTitle,
        .sideTitle,
        .activityBar small,
        .notificationStack span,
        .shortcutStack a
      ) {
        color: #e7eefb !important;
      }

      html[data-theme='dark'] .dashboardPage :is(.navItem:hover, .shortcutStack a:hover) {
        background: rgba(37, 99, 235, 0.22) !important;
        color: #bfdbfe !important;
      }

      html[data-theme='dark'] .dashboardPage :is(.emptyState svg, .completionItem svg, .iconButton svg, .navItem svg) {
        color: #bfdbfe !important;
      }

      @media (max-width: 1240px) {
        .dashboardGrid {
          grid-template-columns: 210px minmax(0, 1fr);
        }

        .rightPanel {
          position: static;
          grid-column: 2;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          display: grid;
        }
      }

      @media (max-width: 860px) {
        .dashboardShell {
          padding: 8px 6px 90px;
        }

        .dashboardGrid,
        .statsGrid,
        .completionItems,
        .modalControls,
        .postRow,
        .rightPanel {
          grid-template-columns: 1fr;
        }

        .leftSidebar {
          position: fixed;
          left: 8px;
          right: 8px;
          bottom: 8px;
          top: auto;
          z-index: 60;
          padding: 8px;
        }

        .sidebarIdentity {
          display: none;
        }

        .sidebarNav {
          grid-template-columns: repeat(5, minmax(0, 1fr));
          overflow-x: auto;
        }

        .navItem {
          min-width: 96px;
          justify-content: center;
          flex-direction: column;
          gap: 4px;
          font-size: 0.74rem;
        }

        .dashboardHeader {
          flex-direction: column;
          padding: 18px;
        }

        .headerActions {
          justify-content: flex-start;
          min-width: 0;
        }

        .postStats,
        .panelTitle,
        .postModal header,
        .notificationModal header,
        .postModal footer {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `}</style>
  );
}
