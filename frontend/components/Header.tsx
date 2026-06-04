'use client';

import Link from 'next/link';
import { SignOutButton, useAuth, useUser } from '@clerk/nextjs';
import {
  Bell,
  CircleHelp,
  Compass,
  Crown,
  FileText,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { localizeHref, stripLocalePrefix } from '@/components/locale-path';
import ScrollProgress from '@/components/ScrollProgress';
import ThemeToggle from '@/components/ThemeToggle';
import { buildPublicRoutes } from '@/lib/public-routes';
import { defaultLocale, isLocale, type Locale } from '@/i18n.config';
import type { LucideIcon as LucideIconType } from 'lucide-react';

interface HeaderProps {
  current?: string;
  locale?: Locale;
}

interface HeaderCopy {
  brandTagline: string;
  guestNav: {
    home: string;
    discover: string;
    features: string;
    premium: string;
    security: string;
  };
  memberNav: {
    home: string;
    network?: string;
    dashboard: string;
    studio: string;
    messages: string;
    notifications: string;
    premium: string;
  };
  searchPlaceholder: string;
  actions: {
    signIn: string;
    signUp: string;
    menu: string;
    account: string;
    openMenu: string;
  };
  menu: {
    studio: string;
    subscription: string;
    stats: string;
    invitations?: string;
    settings: string;
    guide: string;
    help: string;
    dashboard: string;
    signOut: string;
  };
}

interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIconType;
  active: boolean;
}

const copyByLocale: Record<Locale, HeaderCopy> = {
  en: {
    brandTagline: 'Professional network',
    guestNav: {
      home: 'Home',
      discover: 'Profiles',
      features: 'Community',
      premium: 'Premium',
      security: 'Security',
    },
    memberNav: {
      home: 'Home',
      network: 'Network',
      dashboard: 'Dashboard',
      studio: 'Profile',
      messages: 'Messages',
      notifications: 'Notifications',
      premium: 'Premium',
    },
    searchPlaceholder: 'Search profiles, sectors, companies...',
    actions: {
      signIn: 'Sign in',
      signUp: 'Create account',
      menu: 'Menu',
      account: 'My account',
      openMenu: 'Open navigation menu',
    },
    menu: {
      studio: 'Profile',
      subscription: 'Subscription',
      stats: 'Statistics',
      invitations: 'Invitations',
      settings: 'Settings',
      guide: 'User guide',
      help: 'Help',
      dashboard: 'Dashboard',
      signOut: 'Sign out',
    },
  },
  fr: {
    brandTagline: 'Reseau professionnel',
    guestNav: {
      home: 'Accueil',
      discover: 'Profils',
      features: 'Communaute',
      premium: 'Premium',
      security: 'Securite',
    },
    memberNav: {
      home: 'Accueil',
      network: 'Reseau',
      dashboard: 'Tableau de bord',
      studio: 'Profil',
      messages: 'Messages',
      notifications: 'Notifications',
      premium: 'Premium',
    },
    searchPlaceholder: 'Rechercher profils, secteurs, entreprises...',
    actions: {
      signIn: 'Se connecter',
      signUp: 'Creer un compte',
      menu: 'Menu',
      account: 'Mon compte',
      openMenu: 'Ouvrir le menu de navigation',
    },
    menu: {
      studio: 'Profil',
      subscription: 'Abonnement',
      stats: 'Statistiques',
      invitations: 'Invitations',
      settings: 'Parametres',
      guide: 'Guide utilisateur',
      help: 'Aide',
      dashboard: 'Tableau de bord',
      signOut: 'Deconnexion',
    },
  },
  es: {
    brandTagline: 'Red profesional',
    guestNav: {
      home: 'Inicio',
      discover: 'Perfiles',
      features: 'Comunidad',
      premium: 'Premium',
      security: 'Seguridad',
    },
    memberNav: {
      home: 'Inicio',
      network: 'Red',
      dashboard: 'Panel',
      studio: 'Perfil',
      messages: 'Mensajes',
      notifications: 'Notificaciones',
      premium: 'Premium',
    },
    searchPlaceholder: 'Buscar perfiles, sectores, empresas...',
    actions: {
      signIn: 'Iniciar sesion',
      signUp: 'Crear cuenta',
      menu: 'Menu',
      account: 'Mi cuenta',
      openMenu: 'Abrir menu de navegacion',
    },
    menu: {
      studio: 'Perfil',
      subscription: 'Suscripcion',
      stats: 'Estadisticas',
      invitations: 'Invitaciones',
      settings: 'Ajustes',
      guide: 'Guia de usuario',
      help: 'Ayuda',
      dashboard: 'Panel',
      signOut: 'Cerrar sesion',
    },
  },
  ar: {
    brandTagline: 'Professional network',
    guestNav: {
      home: 'Home',
      discover: 'Profiles',
      features: 'Community',
      premium: 'Premium',
      security: 'Security',
    },
    memberNav: {
      home: 'Home',
      network: 'Network',
      dashboard: 'Dashboard',
      studio: 'Profile',
      messages: 'Messages',
      notifications: 'Notifications',
      premium: 'Premium',
    },
    searchPlaceholder: 'Search profiles, sectors, companies...',
    actions: {
      signIn: 'Sign in',
      signUp: 'Create account',
      menu: 'Menu',
      account: 'My account',
      openMenu: 'Open navigation menu',
    },
    menu: {
      studio: 'Profile',
      subscription: 'Subscription',
      stats: 'Statistics',
      invitations: 'Invitations',
      settings: 'Settings',
      guide: 'User guide',
      help: 'Help',
      dashboard: 'Dashboard',
      signOut: 'Sign out',
    },
  },
  de: {
    brandTagline: 'Professional network',
    guestNav: {
      home: 'Home',
      discover: 'Profiles',
      features: 'Community',
      premium: 'Premium',
      security: 'Security',
    },
    memberNav: {
      home: 'Home',
      network: 'Network',
      dashboard: 'Dashboard',
      studio: 'Profile',
      messages: 'Messages',
      notifications: 'Notifications',
      premium: 'Premium',
    },
    searchPlaceholder: 'Search profiles, sectors, companies...',
    actions: {
      signIn: 'Sign in',
      signUp: 'Create account',
      menu: 'Menu',
      account: 'My account',
      openMenu: 'Open navigation menu',
    },
    menu: {
      studio: 'Profile',
      subscription: 'Subscription',
      stats: 'Statistics',
      invitations: 'Invitations',
      settings: 'Settings',
      guide: 'User guide',
      help: 'Help',
      dashboard: 'Dashboard',
      signOut: 'Sign out',
    },
  },
  zh: {
    brandTagline: 'Professional network',
    guestNav: {
      home: 'Home',
      discover: 'Profiles',
      features: 'Community',
      premium: 'Premium',
      security: 'Security',
    },
    memberNav: {
      home: 'Home',
      network: 'Network',
      dashboard: 'Dashboard',
      studio: 'Profile',
      messages: 'Messages',
      notifications: 'Notifications',
      premium: 'Premium',
    },
    searchPlaceholder: 'Search profiles, sectors, companies...',
    actions: {
      signIn: 'Sign in',
      signUp: 'Create account',
      menu: 'Menu',
      account: 'My account',
      openMenu: 'Open navigation menu',
    },
    menu: {
      studio: 'Profile',
      subscription: 'Subscription',
      stats: 'Statistics',
      invitations: 'Invitations',
      settings: 'Settings',
      guide: 'User guide',
      help: 'Help',
      dashboard: 'Dashboard',
      signOut: 'Sign out',
    },
  },
  ja: {
    brandTagline: 'Professional network',
    guestNav: {
      home: 'Home',
      discover: 'Profiles',
      features: 'Community',
      premium: 'Premium',
      security: 'Security',
    },
    memberNav: {
      home: 'Home',
      network: 'Network',
      dashboard: 'Dashboard',
      studio: 'Profile',
      messages: 'Messages',
      notifications: 'Notifications',
      premium: 'Premium',
    },
    searchPlaceholder: 'Search profiles, sectors, companies...',
    actions: {
      signIn: 'Sign in',
      signUp: 'Create account',
      menu: 'Menu',
      account: 'My account',
      openMenu: 'Open navigation menu',
    },
    menu: {
      studio: 'Profile',
      subscription: 'Subscription',
      stats: 'Statistics',
      invitations: 'Invitations',
      settings: 'Settings',
      guide: 'User guide',
      help: 'Help',
      dashboard: 'Dashboard',
      signOut: 'Sign out',
    },
  },
  pt: {
    brandTagline: 'Professional network',
    guestNav: {
      home: 'Home',
      discover: 'Profiles',
      features: 'Community',
      premium: 'Premium',
      security: 'Security',
    },
    memberNav: {
      home: 'Home',
      network: 'Network',
      dashboard: 'Dashboard',
      studio: 'Profile',
      messages: 'Messages',
      notifications: 'Notifications',
      premium: 'Premium',
    },
    searchPlaceholder: 'Search profiles, sectors, companies...',
    actions: {
      signIn: 'Sign in',
      signUp: 'Create account',
      menu: 'Menu',
      account: 'My account',
      openMenu: 'Open navigation menu',
    },
    menu: {
      studio: 'Profile',
      subscription: 'Subscription',
      stats: 'Statistics',
      invitations: 'Invitations',
      settings: 'Settings',
      guide: 'User guide',
      help: 'Help',
      dashboard: 'Dashboard',
      signOut: 'Sign out',
    },
  },
  ru: {
    brandTagline: 'Professional network',
    guestNav: {
      home: 'Home',
      discover: 'Profiles',
      features: 'Community',
      premium: 'Premium',
      security: 'Security',
    },
    memberNav: {
      home: 'Home',
      network: 'Network',
      dashboard: 'Dashboard',
      studio: 'Profile',
      messages: 'Messages',
      notifications: 'Notifications',
      premium: 'Premium',
    },
    searchPlaceholder: 'Search profiles, sectors, companies...',
    actions: {
      signIn: 'Sign in',
      signUp: 'Create account',
      menu: 'Menu',
      account: 'My account',
      openMenu: 'Open navigation menu',
    },
    menu: {
      studio: 'Profile',
      subscription: 'Subscription',
      stats: 'Statistics',
      invitations: 'Invitations',
      settings: 'Settings',
      guide: 'User guide',
      help: 'Help',
      dashboard: 'Dashboard',
      signOut: 'Sign out',
    },
  },
};

function assetUrl(value?: string | null) {
  if (!value) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  return value.startsWith('/') ? value : `/${value}`;
}

export default function Header({ current, locale: localeProp }: HeaderProps) {
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchText, setSearchText] = useState(searchParams.get('q') || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const { getToken } = useAuth();

  const pathLocale = pathname.split('/').filter(Boolean)[0];
  const locale = isLocale(localeProp)
    ? localeProp
    : isLocale(pathLocale)
      ? pathLocale
      : isLocale(params?.locale)
        ? params.locale
        : defaultLocale;
  const copy = copyByLocale[locale];
  const normalizedPath = stripLocalePrefix(pathname);
  const isSignedIn = Boolean(isLoaded && user);
  const isPending = !isLoaded;

  const homeHref = localizeHref(locale, '/feed');
  const publicRoutes = buildPublicRoutes(locale);
  const dashboardHref = localizeHref(locale, '/dashboard');
  const networkHref = localizeHref(locale, '/discover');
  const invitationsHref = localizeHref(locale, '/discover?tab=invitations');
  const statisticsHref = localizeHref(locale, '/dashboard/statistics');
  const subscriptionHref = localizeHref(locale, '/dashboard/subscription');
  const profileHref = localizeHref(locale, '/dashboard/profile');
  const settingsHref = localizeHref(locale, '/settings');
  const privacySettingsHref = localizeHref(locale, '/settings/privacy');
  const guideHref = localizeHref(locale, '/settings/profile-completion');
  const helpHref = localizeHref(locale, '/contact');
  const messagesHref = localizeHref(locale, '/messages');
  const notificationsHref = localizeHref(locale, '/notifications');
  const signInHref = localizeHref(locale, '/auth/sign-in');
  const signUpHref = localizeHref(locale, '/auth/select-account-type');
  const premiumHref = localizeHref(locale, '/premium');
  const searchHref = localizeHref(locale, '/search');

  const memberLabel = user?.firstName || user?.username || 'Communium';
  const memberEmail = user?.primaryEmailAddress?.emailAddress || '';
  const memberAvatar = profileAvatarUrl || user?.imageUrl || '';

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    setSearchText(searchParams.get('q') || '');
  }, [searchParams]);

  function handleHeaderSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchText.trim();
    const nextHref = nextQuery ? `${searchHref}?q=${encodeURIComponent(nextQuery)}` : searchHref;
    router.push(nextHref);
  }

  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      setUnreadNotifications(0);
      return;
    }

    let cancelled = false;
    async function loadUnreadCount() {
      try {
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const token = await getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (user?.id) headers.set('x-user-id', user.id);
        if (user?.fullName) headers.set('x-user-name', user.fullName);
        if (user?.username) headers.set('x-user-username', user.username);
        if (user?.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
        const response = await fetch('/api/notifications/unread?limit=1', { headers, cache: 'no-store' });
        const body = (await response.json().catch(() => ({}))) as { count?: number; counts?: { unread?: number } };
        if (!cancelled) {
          setUnreadNotifications(Number(body.counts?.unread ?? body.count ?? 0));
        }
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    }

    void loadUnreadCount();
    const timer = window.setInterval(loadUnreadCount, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [getToken, isSignedIn, user]);

  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      setProfileAvatarUrl('');
      return;
    }

    let cancelled = false;

    async function loadProfileAvatar() {
      try {
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const token = await getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (user?.id) headers.set('x-user-id', user.id);
        if (user?.fullName) headers.set('x-user-name', user.fullName);
        if (user?.username) headers.set('x-user-username', user.username);
        if (user?.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);

        const response = await fetch('/api/profile/me', { headers, cache: 'no-store' });
        const body = (await response.json().catch(() => ({}))) as { data?: { profilePictureUrl?: string | null } };

        if (!cancelled && response.ok) {
          setProfileAvatarUrl(assetUrl(body.data?.profilePictureUrl));
        }
      } catch {
        if (!cancelled) setProfileAvatarUrl('');
      }
    }

    void loadProfileAvatar();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn, user]);

  useEffect(() => {
    function handleDocumentPointer(event: MouseEvent | PointerEvent | TouchEvent | FocusEvent) {
      const target = event.target as Node;

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    }

    function closeFloatingMenus() {
      setIsMobileMenuOpen(false);
      setIsProfileMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeFloatingMenus();
      }
    }

    document.addEventListener('pointerdown', handleDocumentPointer, true);
    document.addEventListener('mousedown', handleDocumentPointer, true);
    document.addEventListener('touchstart', handleDocumentPointer, true);
    document.addEventListener('focusin', handleDocumentPointer, true);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', closeFloatingMenus, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointer, true);
      document.removeEventListener('mousedown', handleDocumentPointer, true);
      document.removeEventListener('touchstart', handleDocumentPointer, true);
      document.removeEventListener('focusin', handleDocumentPointer, true);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', closeFloatingMenus);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname, searchParams]);

  const activeMemberKey = useMemo(() => {
    if (current) {
      return current;
    }

    if (normalizedPath === '/messages' || normalizedPath.startsWith('/messages/')) {
      return 'messages';
    }

    if (normalizedPath === '/notifications' || normalizedPath.startsWith('/notifications/')) {
      return 'notifications';
    }

    if (normalizedPath === '/discover' || normalizedPath.startsWith('/discover/')) {
      return 'network';
    }

    if (
      normalizedPath === '/checkout' ||
      normalizedPath.startsWith('/checkout/') ||
      normalizedPath === '/dashboard/subscription' ||
      normalizedPath.startsWith('/dashboard/subscription/') ||
      normalizedPath === '/premium' ||
      normalizedPath.startsWith('/premium/')
    ) {
      return 'premium';
    }

    if (
      normalizedPath === '/dashboard' ||
      normalizedPath.startsWith('/dashboard/statistics/') ||
      normalizedPath === '/dashboard/statistics'
    ) {
      return 'dashboard';
    }

    if (
      normalizedPath === '/profile' ||
      normalizedPath.startsWith('/profile/') ||
      normalizedPath === '/dashboard/profile' ||
      normalizedPath.startsWith('/dashboard/profile/') ||
      normalizedPath === '/settings' ||
      normalizedPath.startsWith('/settings/') ||
      normalizedPath === '/profile/settings' ||
      normalizedPath.startsWith('/profile/settings/') ||
      normalizedPath === '/profile/help' ||
      normalizedPath.startsWith('/profile/help/') ||
      normalizedPath === '/profile/settings/privacy' ||
      normalizedPath.startsWith('/profile/settings/privacy/')
    ) {
      return 'studio';
    }

    if (normalizedPath === '/' || normalizedPath === '/feed' || normalizedPath.startsWith('/feed/')) {
      return 'home';
    }

    return 'home';
  }, [current, normalizedPath]);

  const activeGuestKey = useMemo(() => {
    if (normalizedPath === '/discover' || normalizedPath.startsWith('/discover/')) {
      return 'discover';
    }

    if (normalizedPath === '/features' || normalizedPath.startsWith('/features/')) {
      return 'features';
    }

    if (normalizedPath === '/premium' || normalizedPath.startsWith('/premium/')) {
      return 'premium';
    }

    if (normalizedPath === '/privacy' || normalizedPath.startsWith('/privacy/')) {
      return 'security';
    }

    return 'home';
  }, [normalizedPath]);

  const guestNavItems: NavItem[] = [
    { key: 'home', href: publicRoutes.home, label: copy.guestNav.home, icon: House, active: activeGuestKey === 'home' },
    {
      key: 'discover',
      href: publicRoutes.discover,
      label: copy.guestNav.discover,
      icon: Compass,
      active: activeGuestKey === 'discover',
    },
    {
      key: 'features',
      href: publicRoutes.features,
      label: copy.guestNav.features,
      icon: UsersRound,
      active: activeGuestKey === 'features',
    },
    {
      key: 'premium',
      href: publicRoutes.premium,
      label: copy.guestNav.premium,
      icon: Crown,
      active: activeGuestKey === 'premium',
    },
    {
      key: 'security',
      href: publicRoutes.privacy,
      label: copy.guestNav.security,
      icon: ShieldCheck,
      active: activeGuestKey === 'security',
    },
  ];

  const memberNavItems: NavItem[] = [
    { key: 'home', href: homeHref, label: copy.memberNav.home, icon: House, active: activeMemberKey === 'home' },
    {
      key: 'network',
      href: invitationsHref,
      label: copy.memberNav.network || 'Reseau',
      icon: UsersRound,
      active: activeMemberKey === 'network',
    },
    {
      key: 'dashboard',
      href: dashboardHref,
      label: copy.memberNav.dashboard,
      icon: LayoutDashboard,
      active: activeMemberKey === 'dashboard',
    },
    {
      key: 'studio',
      href: profileHref,
      label: copy.memberNav.studio,
      icon: UserRound,
      active: activeMemberKey === 'studio',
    },
    {
      key: 'messages',
      href: messagesHref,
      label: copy.memberNav.messages,
      icon: MessageSquareText,
      active: activeMemberKey === 'messages',
    },
    {
      key: 'notifications',
      href: notificationsHref,
      label: copy.memberNav.notifications,
      icon: Bell,
      active: activeMemberKey === 'notifications',
    },
    {
      key: 'premium',
      href: premiumHref,
      label: copy.memberNav.premium,
      icon: Crown,
      active: activeMemberKey === 'premium',
    },
  ];

  const profileMenuLinks = [
    { href: profileHref, label: copy.menu.studio, icon: UserRound },
    { href: invitationsHref, label: copy.menu.invitations || 'Invitations', icon: UserPlus },
    { href: subscriptionHref, label: copy.menu.subscription, icon: Crown },
    { href: dashboardHref, label: copy.menu.dashboard, icon: LayoutDashboard },
    { href: statisticsHref, label: copy.menu.stats, icon: UsersRound },
    { href: settingsHref, label: copy.menu.settings, icon: Settings },
    { href: guideHref, label: copy.menu.guide, icon: CircleHelp },
    { href: helpHref, label: copy.menu.help, icon: FileText },
  ];

  const navItems = isSignedIn ? memberNavItems : guestNavItems;
  const prefetchTargets = useMemo(
    () =>
      Array.from(
        new Set(
          (
            isSignedIn
              ? [
                  homeHref,
                  networkHref,
                  invitationsHref,
                  dashboardHref,
                  profileHref,
                  messagesHref,
                  notificationsHref,
                  premiumHref,
                  searchHref,
                ]
              : [
                  publicRoutes.home,
                  publicRoutes.discover,
                  publicRoutes.features,
                  publicRoutes.premium,
                  publicRoutes.privacy,
                  signInHref,
                  signUpHref,
                ]
          ).filter((href) => href.startsWith('/')),
        ),
      ),
    [
      dashboardHref,
      homeHref,
      invitationsHref,
      isSignedIn,
      messagesHref,
      networkHref,
      notificationsHref,
      premiumHref,
      profileHref,
      publicRoutes.discover,
      publicRoutes.features,
      publicRoutes.home,
      publicRoutes.premium,
      publicRoutes.privacy,
      searchHref,
      signInHref,
      signUpHref,
    ],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      prefetchTargets.forEach((href) => {
        router.prefetch(href);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [prefetchTargets, router]);

  return (
    <>
    <header className="siteHeader">
      <div className="siteHeaderFrame">
        <div className={isSignedIn ? 'siteHeaderShell memberShell' : 'siteHeaderShell guestShell'}>
          <Link href={homeHref} className="brandLink" aria-label="Communium">
            <span className="brandLogo">
              <img src="/communium_logo.svg" alt="Communium" />
            </span>
            <span className="brandText">
              <strong>Communium</strong>
            </span>
          </Link>

          {isSignedIn ? (
            <form className="headerSearch" onSubmit={handleHeaderSearchSubmit} role="search" aria-label={copy.searchPlaceholder}>
              <button type="submit" className="headerSearchButton" aria-label={copy.searchPlaceholder}>
                <Search className="headerSearchIcon" strokeWidth={2.15} />
              </button>
              <input
                type="search"
                name="q"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={copy.searchPlaceholder}
                autoComplete="off"
              />
            </form>
          ) : null}

          <nav className="primaryNav desktopNav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={isSignedIn ? (item.active ? 'navLink memberNavLink active' : 'navLink memberNavLink') : item.active ? 'navLink guestNavLink active' : 'navLink guestNavLink'}
                  aria-label={item.label}
                  title={item.label}
                  data-label={item.label}
                >
                  <span className="navIconWrap">
                    <Icon className="navIcon" strokeWidth={2.1} />
                    {item.key === 'notifications' && unreadNotifications ? (
                      <span className="navUnreadBadge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                    ) : null}
                  </span>
                  {!isSignedIn ? <span className="navLabel">{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="headerActions">
            <div className="headerControlCluster">
              <ThemeToggle locale={locale} />
              <LanguageSwitcher />
            </div>

            {!isPending && !isSignedIn ? (
              <div className="guestActions desktopGuestActions">
                <Link href={signInHref} className="headerActionGhost">
                  {copy.actions.signIn}
                </Link>
                <Link href={signUpHref} className="headerActionPrimary">
                  {copy.actions.signUp}
                </Link>
              </div>
            ) : null}

            {!isPending && isSignedIn ? (
              <div ref={profileMenuRef} className="profileMenuWrap">
                <button
                  type="button"
                  className={isProfileMenuOpen ? 'profileTrigger open' : 'profileTrigger'}
                  aria-label={copy.actions.account}
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                >
                  <span className="profileAvatar">
                    {memberAvatar ? (
                      <img src={memberAvatar} alt={memberLabel} />
                    ) : (
                      <span className="profileAvatarFallback">{memberLabel.slice(0, 1).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="profileTriggerCopy">
                    <strong>{memberLabel}</strong>
                    <small>{copy.actions.account}</small>
                  </span>
                </button>

                {isProfileMenuOpen ? (
                  <div className="profileDropdown" role="menu" aria-label={copy.actions.account}>
                    <div className="profileDropdownHead">
                      <strong>{memberLabel}</strong>
                      {memberEmail ? <small>{memberEmail}</small> : null}
                    </div>

                    <div className="profileDropdownList">
                      {profileMenuLinks.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="profileMenuLink"
                            role="menuitem"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <span className="profileMenuIcon">
                              <Icon className="menuIcon" strokeWidth={2.1} />
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>

                    <SignOutButton redirectUrl={homeHref}>
                      <button type="button" className="profileMenuLogout">
                        <span className="profileMenuIcon">
                          <LogOut className="menuIcon" strokeWidth={2.1} />
                        </span>
                        <span>{copy.menu.signOut}</span>
                      </button>
                    </SignOutButton>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div ref={mobileMenuRef} className="mobileMenuWrap">
              <button
                type="button"
                className={isMobileMenuOpen ? 'mobileMenuButton open' : 'mobileMenuButton'}
                aria-label={copy.actions.openMenu}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((open) => !open)}
              >
                {isMobileMenuOpen ? (
                  <X className="menuIcon" strokeWidth={2.1} />
                ) : (
                  <Menu className="menuIcon" strokeWidth={2.1} />
                )}
              </button>

              {isMobileMenuOpen ? (
                <div className="mobilePanel">
                  <div className="mobileNavList">
                    {navItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={item.active ? 'mobileNavLink active' : 'mobileNavLink'}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="mobileNavIcon">
                            <Icon className="menuIcon" strokeWidth={2.1} />
                            {item.key === 'notifications' && unreadNotifications ? (
                              <span className="mobileUnreadBadge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                            ) : null}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {!isPending && !isSignedIn ? (
                    <div className="mobileActionStack">
                      <Link href={signInHref} className="headerActionGhost fullWidthMobile" onClick={() => setIsMobileMenuOpen(false)}>
                        {copy.actions.signIn}
                      </Link>
                      <Link href={signUpHref} className="headerActionPrimary fullWidthMobile" onClick={() => setIsMobileMenuOpen(false)}>
                        {copy.actions.signUp}
                      </Link>
                    </div>
                  ) : null}

                  {!isPending && isSignedIn ? (
                    <div className="mobileAccountList">
                      <div className="mobileAccountHead">
                        <strong>{memberLabel}</strong>
                        {memberEmail ? <small>{memberEmail}</small> : null}
                      </div>

                      <div className="mobileNavList">
                        {profileMenuLinks.map((item) => {
                          const Icon = item.icon;

                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="mobileNavLink"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <span className="mobileNavIcon">
                                <Icon className="menuIcon" strokeWidth={2.1} />
                              </span>
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>

                      <SignOutButton redirectUrl={homeHref}>
                        <button type="button" className="mobileLogoutButton">
                          {copy.menu.signOut}
                        </button>
                      </SignOutButton>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="siteHeaderProgressWrap">
          <ScrollProgress />
        </div>
      </div>

      <style>{`
        .siteHeader {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 90;
          width: 100%;
          margin-left: 0;
          padding: 6px 10px 0;
          background: transparent;
          transform: translateZ(0);
          will-change: transform;
        }

        .siteHeaderSpacer {
          height: 78px;
          flex: 0 0 auto;
        }

        .siteHeaderFrame {
          position: relative;
          width: 100%;
          border-radius: 22px;
          border: 1px solid var(--header-shell-border);
          background: var(--header-shell-bg);
          color: var(--header-foreground);
          box-shadow: var(--shadow-card);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          overflow: visible;
        }

        .siteHeaderShell {
          position: relative;
          z-index: 3;
          width: 100%;
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 10px;
          min-height: 56px;
          padding: 8px 14px 6px;
          border-radius: 22px 22px 18px 18px;
          background: transparent;
          color: var(--header-foreground);
          overflow: visible;
        }

        .siteHeaderProgressWrap {
          position: relative;
          z-index: 2;
          width: 100%;
          margin-top: -2px;
          padding: 0 14px 6px;
        }

        .siteHeaderProgressWrap::before {
          content: '';
          position: absolute;
          left: 14px;
          right: 14px;
          top: -6px;
          height: 14px;
          border-radius: 0 0 18px 18px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0));
          pointer-events: none;
        }

        .guestShell {
          display: grid;
          grid-template-columns: minmax(160px, 1fr) auto minmax(160px, 1fr);
          justify-content: initial;
        }

        .guestShell .brandLink {
          justify-self: start;
        }

        .guestShell .primaryNav {
          justify-self: center;
        }

        .guestShell .headerActions {
          justify-self: end;
          margin-left: 0;
        }

        .memberShell {
          justify-content: space-between;
        }

        .brandLink,
        .brandText,
        .primaryNav,
        .navLink,
        .headerActions,
        .guestActions,
        .headerControlCluster,
        .profileTrigger,
        .profileDropdownHead,
        .profileDropdownList,
        .profileMenuLink,
        .mobileNavList,
        .mobileNavLink,
        .mobileActionStack,
        .mobileAccountList,
        .mobileAccountHead {
          display: flex;
        }

        .brandLink {
          align-items: center;
          gap: 10px;
          color: var(--header-foreground);
          text-decoration: none;
          flex: 0 0 auto;
        }

        .brandLogo {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .brandLogo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: scale(1.16);
        }

        .brandText {
          align-items: center;
          min-height: 42px;
        }

        .brandText strong {
          display: block;
          font-size: 1.05rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.045em;
          text-wrap: nowrap;
          text-shadow: 0 8px 22px rgba(15, 23, 42, 0.14);
        }

        .headerSearch {
          flex: 1 1 260px;
          min-width: 180px;
          max-width: 560px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          min-height: 38px;
          border-radius: 14px;
          background: var(--header-control-bg);
          border: 1px solid var(--header-control-border);
        }

        .headerSearch:focus-within {
          border-color: rgba(148, 197, 255, 0.42);
          box-shadow: 0 0 0 4px rgba(148, 197, 255, 0.12);
        }

        .headerSearchIcon,
        .navIcon,
        .menuIcon {
          flex: 0 0 auto;
        }

        .headerSearchIcon {
          width: 18px;
          height: 18px;
          color: var(--header-muted);
        }

        .headerSearchButton {
          width: 24px;
          height: 24px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
        }

        .headerSearchButton:hover,
        .headerSearchButton:focus-visible {
          background: rgba(148, 197, 255, 0.16);
          outline: none;
        }

        .headerSearch input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--header-foreground);
          font-size: 0.92rem;
          font-weight: 700;
        }

        .headerSearch input::placeholder {
          color: var(--header-muted);
        }

        .primaryNav {
          flex: 0 1 auto;
          min-width: 0;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 4px;
          border-radius: 18px;
          background: var(--header-control-bg);
          border: 1px solid var(--header-control-border);
        }

        .navLink {
          position: relative;
          z-index: 1;
          min-height: 38px;
          min-width: 42px;
          justify-content: center;
          align-items: center;
          padding: 0 10px;
          border-radius: 12px;
          color: var(--header-muted);
          text-decoration: none;
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .guestNavLink {
          gap: 7px;
          padding: 0 12px;
        }

        .memberNavLink {
          min-width: 42px;
        }

        .navLink::after {
          content: attr(data-label);
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          z-index: 8;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.92);
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18);
          transform: translate(-50%, -6px);
          opacity: 0;
          pointer-events: none;
          transition:
            opacity 0.18s ease,
            transform 0.18s ease;
        }

        .guestNavLink::after {
          display: none;
        }

        .navIconWrap {
          position: relative;
          display: inline-grid;
          place-items: center;
          transform: translateY(2px);
          opacity: 0.76;
          transition:
            transform 0.18s ease,
            opacity 0.18s ease,
            color 0.18s ease;
        }

        .navIcon {
          width: 17px;
          height: 17px;
        }

        .navUnreadBadge,
        .mobileUnreadBadge {
          position: absolute;
          display: inline-grid;
          place-items: center;
          min-width: 17px;
          height: 17px;
          border: 2px solid #ffffff;
          border-radius: 999px;
          background: #dc2626;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 900;
          line-height: 1;
          box-shadow: 0 8px 18px rgba(220, 38, 38, 0.32);
        }

        .navUnreadBadge {
          top: -10px;
          right: -12px;
        }

        .mobileUnreadBadge {
          top: -7px;
          right: -7px;
        }

        .navLabel {
          font-size: 0.86rem;
          font-weight: 800;
          line-height: 1;
        }

        .navLink:hover,
        .navLink:focus-visible,
        .navLink.active,
        .headerActionGhost:hover,
        .headerActionPrimary:hover,
        .profileTrigger:hover,
        .profileMenuLink:hover,
        .profileMenuLogout:hover,
        .mobileNavLink:hover,
        .mobileLogoutButton:hover {
          transform: translateY(-1px);
        }

        .memberNavLink:hover,
        .memberNavLink:focus-visible {
          z-index: 6;
        }

        .navLink:hover .navIconWrap,
        .navLink:focus-visible .navIconWrap,
        .navLink.active .navIconWrap {
          transform: translateY(0);
          opacity: 1;
        }

        .guestNavLink:hover .navLabel,
        .guestNavLink:focus-visible .navLabel,
        .guestNavLink.active .navLabel {
          color: currentColor;
        }

        .navLink:hover::after,
        .navLink:focus-visible::after {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        .navLink.active {
          color: #ffffff;
          background: var(--header-active-bg);
          box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.24);
        }

        .headerActions {
          margin-left: auto;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
        }

        .headerControlCluster,
        .guestActions {
          align-items: center;
          gap: 8px;
        }

        .headerActionGhost,
        .headerActionPrimary,
        .mobileLogoutButton,
        .mobileMenuButton {
          min-height: var(--control-height);
          border-radius: var(--radius-control);
          font-weight: 800;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease,
            color 0.18s ease;
        }

        .headerActionGhost,
        .headerActionPrimary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 15px;
          text-decoration: none;
        }

        .headerActionGhost {
          border: 1px solid var(--header-control-border);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.06));
          color: var(--header-foreground);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .headerActionPrimary {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: var(--header-cta-bg);
          color: var(--header-cta-ink);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.14);
        }

        .profileMenuWrap {
          position: relative;
        }

        .profileTrigger {
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 9px 0 6px;
          border-radius: 13px;
          border: 1px solid var(--header-control-border);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.06));
          color: var(--header-foreground);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .profileTrigger.open {
          background: var(--header-active-bg);
          border-color: rgba(255, 255, 255, 0.24);
        }

        .profileAvatar {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          overflow: hidden;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          font-weight: 900;
        }

        .profileAvatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profileTriggerCopy {
          display: grid;
          gap: 1px;
          text-align: left;
        }

        .profileTriggerCopy strong {
          font-size: 0.9rem;
        }

        .profileTriggerCopy small {
          color: var(--header-muted);
          font-size: 0.72rem;
        }

        .profileDropdown,
        .mobilePanel {
          border-radius: 24px;
          border: 1px solid var(--line-soft);
          background: var(--dropdown-bg);
          color: var(--dropdown-ink);
          box-shadow: var(--shadow-card);
          backdrop-filter: blur(18px);
        }

        .profileDropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: min(340px, 90vw);
          display: grid;
          gap: 10px;
          padding: 12px;
        }

        .profileDropdownHead,
        .mobileAccountHead {
          flex-direction: column;
          gap: 4px;
          padding: 6px 6px 10px;
        }

        .profileDropdownHead small,
        .mobileAccountHead small {
          color: var(--dropdown-muted);
          font-size: 0.8rem;
        }

        .profileDropdownList,
        .mobileNavList,
        .mobileActionStack,
        .mobileAccountList {
          flex-direction: column;
          gap: 8px;
        }

        .profileMenuLink,
        .profileMenuLogout,
        .mobileNavLink,
        .mobileLogoutButton {
          width: 100%;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          min-height: 48px;
          border-radius: 16px;
          color: inherit;
          text-decoration: none;
          font-weight: 800;
          border: 1px solid transparent;
          background: transparent;
        }

        .profileMenuLink:hover,
        .mobileNavLink:hover,
        .profileMenuLogout:hover,
        .mobileLogoutButton:hover {
          background: rgba(226, 232, 240, 0.38);
          border-color: var(--line-soft);
        }

        .profileMenuLogout,
        .mobileLogoutButton {
          justify-content: flex-start;
        }

        .profileMenuIcon,
        .mobileNavIcon {
          position: relative;
          width: 34px;
          height: 34px;
          display: inline-grid;
          place-items: center;
          border-radius: 12px;
          background: var(--dropdown-icon-bg);
        }

        .mobileMenuWrap {
          position: relative;
        }

        .mobileMenuButton {
          width: 44px;
          padding: 0;
          display: none;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--header-control-border);
          background: var(--header-control-bg);
          color: var(--header-foreground);
        }

        .mobileMenuButton.open {
          background: var(--header-active-bg);
          border-color: rgba(255, 255, 255, 0.24);
        }

        .menuIcon {
          width: 18px;
          height: 18px;
        }

        .mobilePanel {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: min(360px, 92vw);
          display: grid;
          gap: 12px;
          padding: 12px;
        }

        .mobileNavLink {
          min-height: 48px;
        }

        .mobileNavLink.active {
          background: rgba(219, 234, 254, 0.62);
          color: var(--brand-700);
        }

        .fullWidthMobile {
          width: 100%;
        }

        @media (max-width: 1320px) {
          .profileTriggerCopy {
            display: none;
          }

          .brandText strong {
            font-size: 0.98rem;
          }

          .guestNavLink {
            padding: 0 10px;
          }
        }

        @media (max-width: 1360px) {
          .desktopNav {
            display: none;
          }

          .mobileMenuButton {
            display: inline-flex;
          }

          .memberShell .headerSearch {
            max-width: none;
          }
        }

        @media (max-width: 980px) {
          .desktopNav,
          .desktopGuestActions,
          .profileTriggerCopy {
            display: none;
          }

          .memberShell .headerSearch {
            display: none;
          }

          .siteHeaderShell {
            min-height: 54px;
            padding: 7px 10px 5px;
            border-radius: 20px;
          }

          .siteHeaderFrame {
            border-radius: 20px;
          }

          .siteHeaderProgressWrap {
            padding: 0 12px 5px;
          }

          .siteHeaderProgressWrap::before {
            left: 14px;
            right: 14px;
          }

          .headerActions {
            margin-left: auto;
          }

          .siteHeaderSpacer {
            height: 72px;
          }
        }

        @media (max-width: 640px) {
          .siteHeader {
            padding: 5px 6px 0;
          }

          .siteHeaderShell {
            padding: 7px 8px 5px;
            gap: 8px;
            min-height: 52px;
          }

          .brandLogo {
            width: 38px;
            height: 38px;
          }

          .brandText strong {
            font-size: 0.98rem;
          }

          .siteHeaderFrame {
            border-radius: 18px;
          }

          .siteHeaderProgressWrap {
            padding: 0 10px 5px;
          }

          .siteHeaderProgressWrap::before {
            left: 12px;
            right: 12px;
          }

          .headerControlCluster {
            gap: 6px;
          }

          .profileDropdown,
          .mobilePanel {
            width: min(92vw, 360px);
          }

          .siteHeaderSpacer {
            height: 68px;
          }
        }
      `}</style>
    </header>
    <div className="siteHeaderSpacer" aria-hidden="true" />
    </>
  );
}
