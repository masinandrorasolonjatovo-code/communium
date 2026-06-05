'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Globe2,
  HelpCircle,
  Languages,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquare,
  MonitorSmartphone,
  Network,
  Palette,
  ReceiptText,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Upload,
  UserRound,
  Volume2,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import {
  formatPlanLabel,
  formatSubscriptionStatus,
  formatVisibilityLabel,
  tr,
} from '@/components/localized-labels';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';

type Visibility = 'Public' | 'Private' | 'ContactsOnly';

interface AccountData {
  user: {
    username?: string | null;
    email?: string | null;
    role?: string | null;
    accountType?: string | null;
  };
  profile: {
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    country?: string | null;
    profilePictureUrl?: string | null;
    bannerUrl?: string | null;
    currentJobTitle?: string | null;
    currentCompany?: string | null;
    currentIndustry?: string | null;
    membershipTier?: string | null;
    publicProfileUrl?: string | null;
    cvUrl?: string | null;
    websiteUrl?: string | null;
    portfolioUrl?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
  };
  preferences: {
    language?: string | null;
    region?: string | null;
    timezone?: string | null;
  };
  verification?: {
    status?: string | null;
    type?: string | null;
  };
}

interface PrivacyData {
  profileVisibility: Visibility;
  emailVisibility: Visibility;
  phoneVisibility: Visibility;
  cvVisibility: Visibility;
  photoVisibility: Visibility;
  bannerVisibility: Visibility;
  bioVisibility: Visibility;
  professionVisibility: Visibility;
  professionalExperienceVisibility: Visibility;
  interestsVisibility: Visibility;
  cityVisibility: Visibility;
  countryVisibility: Visibility;
  allowSearchEngines: boolean;
  allowNetworkingRequests: boolean;
}

interface SecurityData {
  loginAlerts: boolean;
  sessionNotifications: boolean;
  trustedDevicesOnly: boolean;
  twoFactorEnabled: boolean;
  activeSessions: Array<{
    id: string;
    label: string;
    userAgent: string;
    ipAddress?: string | null;
    current?: boolean;
  }>;
  recentActivity: Array<{
    event: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt?: string | null;
  }>;
}

interface NotificationsData {
  emailMessages: boolean;
  emailNetwork: boolean;
  emailPublications: boolean;
  emailOpportunities: boolean;
  emailSystem: boolean;
  pushMessages: boolean;
  pushInvitations: boolean;
  pushComments: boolean;
  pushVerification: boolean;
  weeklyDigest: boolean;
}

interface MessageSettingsData {
  theme: string;
  disappearingMessages: string;
  archivedMuted: boolean;
  sound: boolean;
  enterToSend: boolean;
  readReceipts: boolean;
  blockedUsers: unknown[];
}

interface SubscriptionData {
  plan: string;
  status: string;
  startedAt?: string | null;
  expiresAt?: string | null;
  renewsAt?: string | null;
  billingUrl: string;
  upgradeUrl: string;
}

interface PaymentRow {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  createdAt?: string | null;
}

interface SettingsCenterProps {
  locale: Locale;
}

interface NavItem {
  id: string;
  label: string;
  detail: string;
  panel:
    | 'account'
    | 'media'
    | 'bio'
    | 'language'
    | 'privacy'
    | 'security'
    | 'notifications'
    | 'appearance'
    | 'network'
    | 'verification'
    | 'sessions'
    | 'documents'
    | 'messages'
    | 'subscription'
    | 'support';
  icon: typeof UserRound;
}

const emptyPrivacy: PrivacyData = {
  profileVisibility: 'Public',
  emailVisibility: 'Private',
  phoneVisibility: 'Private',
  cvVisibility: 'ContactsOnly',
  photoVisibility: 'Public',
  bannerVisibility: 'Public',
  bioVisibility: 'Public',
  professionVisibility: 'Public',
  professionalExperienceVisibility: 'Public',
  interestsVisibility: 'Public',
  cityVisibility: 'Public',
  countryVisibility: 'Public',
  allowSearchEngines: true,
  allowNetworkingRequests: true,
};

const emptySecurity: SecurityData = {
  loginAlerts: true,
  sessionNotifications: true,
  trustedDevicesOnly: false,
  twoFactorEnabled: false,
  activeSessions: [],
  recentActivity: [],
};

const emptyNotifications: NotificationsData = {
  emailMessages: true,
  emailNetwork: true,
  emailPublications: false,
  emailOpportunities: true,
  emailSystem: true,
  pushMessages: true,
  pushInvitations: true,
  pushComments: true,
  pushVerification: true,
  weeklyDigest: false,
};

const emptyMessages: MessageSettingsData = {
  theme: 'system',
  disappearingMessages: 'off',
  archivedMuted: true,
  sound: true,
  enterToSend: true,
  readReceipts: true,
  blockedUsers: [],
};

function unwrap<T>(payload: unknown): T {
  const envelope = payload as { data?: T };
  return (envelope?.data ?? payload) as T;
}

function displayDate(value?: string | null, locale: Locale = 'fr') {
  if (!value) {
    return tr(locale, 'Aucune date', 'No date', 'لا يوجد تاريخ');
  }

  try {
    const dateLocale = locale === 'en' ? 'en-US' : locale === 'ar' ? 'ar-MA' : 'fr-FR';
    return new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
}

function assetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  return value.startsWith('/') ? value : `/${value}`;
}

function visibilityLabel(value: Visibility, locale: Locale) {
  return formatVisibilityLabel(locale, value);
}

export default function SettingsCenter({ locale }: SettingsCenterProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [activeId, setActiveId] = useState('account');
  const [account, setAccount] = useState<AccountData | null>(null);
  const [accountDraft, setAccountDraft] = useState<Record<string, string>>({});
  const [privacy, setPrivacy] = useState<PrivacyData>(emptyPrivacy);
  const [security, setSecurity] = useState<SecurityData>(emptySecurity);
  const [notifications, setNotifications] = useState<NotificationsData>(emptyNotifications);
  const [messages, setMessages] = useState<MessageSettingsData>(emptyMessages);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navGroups = useMemo(
    () => [
      {
        title: 'Compte',
        items: [
          { id: 'account', label: 'Informations personnelles', detail: 'Nom, contact, ville', panel: 'account', icon: UserRound },
          { id: 'media', label: 'Photo et couverture', detail: 'Avatar et banniere', panel: 'media', icon: Camera },
          { id: 'bio', label: 'Bio et profession', detail: 'Titre, entreprise, liens', panel: 'bio', icon: BriefcaseBusiness },
          { id: 'language', label: 'Langue', detail: 'Francais', panel: 'language', icon: Languages },
          { id: 'region', label: 'Region', detail: 'Pays et fuseau horaire', panel: 'language', icon: MapPin },
        ],
      },
      {
        title: 'Confidentialite',
        items: [
          { id: 'privacy-profile', label: 'Visibilite profil', detail: 'Public, reseau, prive', panel: 'privacy', icon: ShieldCheck },
          { id: 'privacy-email', label: 'Visibilite email', detail: 'Adresse publique ou masquee', panel: 'privacy', icon: Mail },
          { id: 'privacy-phone', label: 'Visibilite telephone', detail: 'Telephone public ou prive', panel: 'privacy', icon: Smartphone },
          { id: 'privacy-cv', label: 'Visibilite CV', detail: 'CV recruteurs ou prive', panel: 'privacy', icon: FileText },
          { id: 'public-profile', label: 'Profil public', detail: 'Moteurs et demandes reseau', panel: 'privacy', icon: Globe2 },
        ],
      },
      {
        title: 'Securite',
        items: [
          { id: 'security', label: 'Mot de passe', detail: 'Gere par authentification', panel: 'security', icon: LockKeyhole },
          { id: 'two-factor', label: 'Double authentification', detail: '2FA et alertes', panel: 'security', icon: ShieldCheck },
          { id: 'devices', label: 'Appareils connectes', detail: 'Session actuelle', panel: 'security', icon: MonitorSmartphone },
          { id: 'sessions', label: 'Sessions actives', detail: 'Controle des connexions', panel: 'security', icon: RefreshCw },
          { id: 'history', label: 'Historique connexion', detail: 'Journal securite', panel: 'security', icon: ReceiptText },
        ],
      },
      {
        title: 'Notifications',
        items: [
          { id: 'notif-email', label: 'Email', detail: 'Messages et reseau', panel: 'notifications', icon: Mail },
          { id: 'notif-push', label: 'Push', detail: 'Invitations et commentaires', panel: 'notifications', icon: Bell },
          { id: 'notif-messages', label: 'Messages', detail: 'Alertes conversation', panel: 'notifications', icon: MessageSquare },
          { id: 'notif-network', label: 'Reseau', detail: 'Demandes et abonnements', panel: 'notifications', icon: UserRound },
          { id: 'notif-posts', label: 'Publications', detail: 'Commentaires et opportunites', panel: 'notifications', icon: FileText },
        ],
      },
      {
        title: 'Messages',
        items: [
          { id: 'chat-theme', label: 'Theme discussion', detail: 'Systeme, clair, sombre', panel: 'messages', icon: MessageSquare },
          { id: 'ephemeral', label: 'Messages ephemeres', detail: '24h, 7j, lecture unique', panel: 'messages', icon: RefreshCw },
          { id: 'blocked-users', label: 'Utilisateurs bloques', detail: 'Blocage et securite', panel: 'messages', icon: ShieldCheck },
          { id: 'archive', label: 'Archivage', detail: 'Conversations archivees', panel: 'messages', icon: FileText },
          { id: 'sounds', label: 'Sons notifications', detail: 'Son et envoi clavier', panel: 'messages', icon: Volume2 },
        ],
      },
      {
        title: 'Abonnement',
        items: [
          { id: 'plans', label: 'Silver, Gold, Platinum', detail: 'Plan actuel et upgrade', panel: 'subscription', icon: CreditCard },
          { id: 'billing', label: 'Facturation', detail: 'Paiement et renouvellement', panel: 'subscription', icon: ReceiptText },
          { id: 'payment-history', label: 'Historique paiements', detail: 'Factures disponibles', panel: 'subscription', icon: FileText },
        ],
      },
      {
        title: 'Support',
        items: [
          { id: 'tickets', label: 'Tickets', detail: 'Demandes ouvertes', panel: 'support', icon: HelpCircle },
          { id: 'help-center', label: 'Centre aide', detail: 'Documentation et FAQ', panel: 'support', icon: FileText },
          { id: 'contact-support', label: 'Contact support', detail: 'Support technique', panel: 'support', icon: Mail },
        ],
      },
    ],
    []
  );

  const activeItem = useMemo(() => {
    for (const group of navGroups) {
      const found = group.items.find((item) => item.id === activeId);
      if (found) {
        return found as NavItem;
      }
    }
    return navGroups[0].items[0] as NavItem;
  }, [activeId, navGroups]);

  const requestSettings = useCallback(
    async <T,>(endpoint: string, init?: RequestInit) => {
      const token = await getToken();
      const headers = new Headers(init?.headers);

      if (!(init?.body instanceof FormData)) {
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

      const response = await fetch(`/api/${endpoint}`, {
        ...init,
        headers,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Action impossible pour le moment');
      }

      return unwrap<T>(payload);
    },
    [getToken, user?.fullName, user?.id, user?.primaryEmailAddress?.emailAddress, user?.username]
  );

  const hydrateDraft = useCallback((data: AccountData) => {
    setAccountDraft({
      firstName: data.profile.firstName || '',
      lastName: data.profile.lastName || '',
      email: data.profile.email || data.user.email || '',
      phone: data.profile.phone || '',
      city: data.profile.city || '',
      country: data.profile.country || '',
      bio: data.profile.bio || '',
      currentJobTitle: data.profile.currentJobTitle || '',
      currentCompany: data.profile.currentCompany || '',
      currentIndustry: data.profile.currentIndustry || '',
      websiteUrl: data.profile.websiteUrl || '',
      portfolioUrl: data.profile.portfolioUrl || '',
      githubUrl: data.profile.githubUrl || '',
      linkedinUrl: data.profile.linkedinUrl || '',
      language: data.preferences.language || locale,
      region: data.preferences.region || 'Maroc',
      timezone: data.preferences.timezone || 'Africa/Casablanca',
    });
  }, [locale]);

  const loadSettings = useCallback(async () => {
    if (!isSignedIn) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [accountData, privacyData, securityData, notificationsData, messagesData, subscriptionData, paymentRows] =
        await Promise.all([
          requestSettings<AccountData>('settings/account'),
          requestSettings<PrivacyData>('settings/privacy'),
          requestSettings<SecurityData>('settings/security'),
          requestSettings<NotificationsData>('settings/notifications'),
          requestSettings<MessageSettingsData>('settings/messages'),
          requestSettings<SubscriptionData>('settings/subscription'),
          requestSettings<PaymentRow[]>('settings/payments/history'),
        ]);

      setAccount(accountData);
      hydrateDraft(accountData);
      setPrivacy({ ...emptyPrivacy, ...privacyData });
      setSecurity({ ...emptySecurity, ...securityData });
      setNotifications({ ...emptyNotifications, ...notificationsData });
      setMessages({ ...emptyMessages, ...messagesData });
      setSubscription(subscriptionData);
      setPayments(paymentRows);
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : 'Impossible de charger les parametres');
    } finally {
      setLoading(false);
    }
  }, [hydrateDraft, isSignedIn, requestSettings]);

  useEffect(() => {
    if (isLoaded) {
      void loadSettings();
    }
  }, [isLoaded, loadSettings]);

  async function saveAccount() {
    setSavingKey('account');
    setNotice(null);
    setError(null);

    try {
      const data = await requestSettings<AccountData>('settings/account', {
        method: 'PATCH',
        body: JSON.stringify(accountDraft),
      });
      setAccount(data);
      hydrateDraft(data);
      setNotice('Parametres enregistres');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement impossible');
    } finally {
      setSavingKey(null);
    }
  }

  async function patchPrivacy(patch: Partial<PrivacyData>, key: string) {
    setSavingKey(key);
    setError(null);

    try {
      const data = await requestSettings<PrivacyData>('settings/privacy', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setPrivacy({ ...emptyPrivacy, ...data });
      setNotice('Confidentialite mise a jour');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Mise a jour impossible');
    } finally {
      setSavingKey(null);
    }
  }

  async function patchSecurity(patch: Partial<SecurityData>, key: string) {
    setSavingKey(key);
    setError(null);

    try {
      const data = await requestSettings<SecurityData>('settings/security', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setSecurity({ ...emptySecurity, ...data });
      setNotice('Securite mise a jour');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Mise a jour impossible');
    } finally {
      setSavingKey(null);
    }
  }

  async function patchNotifications(patch: Partial<NotificationsData>, key: string) {
    setSavingKey(key);
    setError(null);

    try {
      const data = await requestSettings<NotificationsData>('settings/notifications', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setNotifications({ ...emptyNotifications, ...data });
      setNotice('Notifications mises a jour');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Mise a jour impossible');
    } finally {
      setSavingKey(null);
    }
  }

  async function patchMessages(patch: Partial<MessageSettingsData>, key: string) {
    setSavingKey(key);
    setError(null);

    try {
      const data = await requestSettings<MessageSettingsData>('settings/messages', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setMessages({ ...emptyMessages, ...data });
      setNotice('Messages mis a jour');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Mise a jour impossible');
    } finally {
      setSavingKey(null);
    }
  }

  async function uploadProfileAsset(kind: 'avatar' | 'cover', file?: File | null) {
    if (!file) {
      return;
    }

    setSavingKey(kind);
    setError(null);

    const form = new FormData();
    form.append(kind === 'avatar' ? 'profilePicture' : 'bannerImage', file);

    try {
      await requestSettings<unknown>(kind === 'avatar' ? 'profile/avatar' : 'profile/cover', {
        method: 'POST',
        body: form,
      });
      await loadSettings();
      setNotice(kind === 'avatar' ? 'Photo mise a jour' : 'Couverture mise a jour');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Upload impossible');
    } finally {
      setSavingKey(null);
    }
  }

  const displayName =
    account?.profile.fullName ||
    user?.fullName ||
    user?.username ||
    account?.user.username ||
    'Compte Communium';
  const avatar = assetUrl(account?.profile.profilePictureUrl) || user?.imageUrl || null;
  const cover = assetUrl(account?.profile.bannerUrl);
  const plan = subscription?.plan || account?.profile.membershipTier || 'Free';
  const publicProfileHref = account?.profile.publicProfileUrl
    ? localizeHref(locale, `/u/${account.profile.publicProfileUrl}`)
    : localizeHref(locale, '/profile');

  function renderShell(children: ReactNode) {
    return (
      <main className="settingsCenterPage">
        <div className="settingsCenterShell">
          <aside className="settingsSidebar" aria-label="Navigation des parametres">
            <div className="settingsProfileMini">
              <span className="miniAvatar">
                {avatar ? <img src={avatar} alt={displayName} /> : <UserRound size={18} />}
              </span>
              <div>
                <strong>{displayName}</strong>
                <span>{formatPlanLabel(locale, plan)} {tr(locale, 'membre', 'member', 'عضو')}</span>
              </div>
            </div>

            <nav className="settingsNav">
              {navGroups.map((group) => (
                <div key={group.title} className="settingsNavGroup">
                  <p>{group.title}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === activeId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={active ? 'settingsNavItem active' : 'settingsNavItem'}
                        onClick={() => setActiveId(item.id)}
                      >
                        <Icon size={16} />
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.detail}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>

          {children}
        </div>
        <SiteFooter locale={locale} />
        <SettingsStyles />
      </main>
    );
  }

  if (!isLoaded || loading) {
    return renderShell(
      <section className="settingsMain">
        <div className="settingsPanel">
          <div className="panelSkeleton wide" />
          <div className="panelSkeleton" />
          <div className="panelSkeleton" />
          <div className="panelSkeleton" />
        </div>
      </section>
    );
  }

  if (!isSignedIn) {
    return renderShell(
      <section className="settingsMain">
        <div className="settingsPanel">
          <span className="panelEyebrow">Parametres</span>
          <h1>Connexion requise</h1>
          <p className="panelIntro">Connectez-vous pour gerer vos reglages, votre confidentialite et votre securite.</p>
          <Link href={localizeHref(locale, '/auth/sign-in')} className="primaryCompactButton">
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  return renderShell(
    <section className="settingsMain">
      <div className="settingsTopBar">
        <div>
          <span className="panelEyebrow">Parametres</span>
          <h1>{activeItem.label}</h1>
          <p>{activeItem.detail}</p>
        </div>
        <div className="saveState">
          <CheckCircle2 size={16} />
          <span>{savingKey ? 'Enregistrement...' : 'Sauvegarde active'}</span>
        </div>
      </div>

      {notice ? <div className="settingsNotice success">{notice}</div> : null}
      {error ? <div className="settingsNotice error">{error}</div> : null}

      {activeItem.panel === 'account' ? (
        <SettingsPanel
          title="Informations personnelles"
          description="Ces informations alimentent votre profil public et les actions de contact."
          actions={
            <>
              <button type="button" className="ghostCompactButton" onClick={() => loadSettings()}>
                Reinitialiser
              </button>
              <button type="button" className="primaryCompactButton" onClick={saveAccount}>
                <Save size={16} />
                Enregistrer
              </button>
            </>
          }
        >
          <div className="settingsFormGrid">
            <TextField label="Prenom" value={accountDraft.firstName} onChange={(value) => setAccountDraft((prev) => ({ ...prev, firstName: value }))} />
            <TextField label="Nom" value={accountDraft.lastName} onChange={(value) => setAccountDraft((prev) => ({ ...prev, lastName: value }))} />
            <TextField label="Email public" value={accountDraft.email} onChange={(value) => setAccountDraft((prev) => ({ ...prev, email: value }))} />
            <TextField label="Telephone public" value={accountDraft.phone} onChange={(value) => setAccountDraft((prev) => ({ ...prev, phone: value }))} />
            <TextField label="Ville" value={accountDraft.city} onChange={(value) => setAccountDraft((prev) => ({ ...prev, city: value }))} />
            <TextField label="Pays" value={accountDraft.country} onChange={(value) => setAccountDraft((prev) => ({ ...prev, country: value }))} />
          </div>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'media' ? (
        <SettingsPanel
          title="Photo et couverture"
          description="Les fichiers sont envoyes vers les routes profil existantes avec validation serveur."
        >
          <div className="mediaSettingsGrid">
            <div className="mediaPreview">
              <div className="coverPreview" style={cover ? { backgroundImage: `url(${cover})` } : undefined} />
              <span className="avatarPreview">{avatar ? <img src={avatar} alt={displayName} /> : <UserRound size={24} />}</span>
              <strong>{displayName}</strong>
            </div>
            <div className="settingsList">
              <UploadRow
                title="Photo de profil"
                text="Image carree, minimum 160px."
                accept="image/*"
                busy={savingKey === 'avatar'}
                onFile={(file) => uploadProfileAsset('avatar', file)}
              />
              <UploadRow
                title="Couverture"
                text="Image large, minimum 960x240px."
                accept="image/*"
                busy={savingKey === 'cover'}
                onFile={(file) => uploadProfileAsset('cover', file)}
              />
              <Link href={localizeHref(locale, '/profile/edit')} className="settingsLinkRow">
                <span>
                  <strong>Recadrage et apercu</strong>
                  <small>Ouvrir l edition complete du profil.</small>
                </span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'bio' ? (
        <SettingsPanel
          title="Bio et profession"
          description="Gardez un titre clair, une entreprise et des liens professionnels visibles."
          actions={
            <>
              <button type="button" className="ghostCompactButton" onClick={() => loadSettings()}>
                Reinitialiser
              </button>
              <button type="button" className="primaryCompactButton" onClick={saveAccount}>
                <Save size={16} />
                Enregistrer
              </button>
            </>
          }
        >
          <div className="settingsFormGrid">
            <TextField label="Titre professionnel" value={accountDraft.currentJobTitle} onChange={(value) => setAccountDraft((prev) => ({ ...prev, currentJobTitle: value }))} />
            <TextField label="Entreprise actuelle" value={accountDraft.currentCompany} onChange={(value) => setAccountDraft((prev) => ({ ...prev, currentCompany: value }))} />
            <TextField label="Secteur" value={accountDraft.currentIndustry} onChange={(value) => setAccountDraft((prev) => ({ ...prev, currentIndustry: value }))} />
            <TextField label="Site web" value={accountDraft.websiteUrl} onChange={(value) => setAccountDraft((prev) => ({ ...prev, websiteUrl: value }))} />
            <TextField label="Portfolio" value={accountDraft.portfolioUrl} onChange={(value) => setAccountDraft((prev) => ({ ...prev, portfolioUrl: value }))} />
            <TextField label="GitHub" value={accountDraft.githubUrl} onChange={(value) => setAccountDraft((prev) => ({ ...prev, githubUrl: value }))} />
          </div>
          <label className="settingsTextarea">
            <span>Bio professionnelle</span>
            <textarea
              value={accountDraft.bio}
              maxLength={300}
              onChange={(event) => setAccountDraft((prev) => ({ ...prev, bio: event.target.value }))}
            />
          </label>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'language' ? (
        <SettingsPanel
          title="Langue et region"
          description="Ces preferences restent sauvegardees dans votre compte."
          actions={
            <button type="button" className="primaryCompactButton" onClick={saveAccount}>
              <Save size={16} />
              Enregistrer
            </button>
          }
        >
          <div className="settingsFormGrid">
            <SelectField
              label="Langue"
              value={accountDraft.language}
              options={[
                ['fr', 'Francais'],
              ]}
              onChange={(value) => setAccountDraft((prev) => ({ ...prev, language: value }))}
            />
            <TextField label="Region" value={accountDraft.region} onChange={(value) => setAccountDraft((prev) => ({ ...prev, region: value }))} />
            <TextField label="Fuseau horaire" value={accountDraft.timezone} onChange={(value) => setAccountDraft((prev) => ({ ...prev, timezone: value }))} />
          </div>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'privacy' ? (
        <SettingsPanel
          title="Confidentialite"
          description="Chaque information peut etre publique, reservee au reseau ou privee."
        >
          <div className="settingsList">
            <SelectRow title="Profil public" text="Controle l acces general a votre profil." value={privacy.profileVisibility} onChange={(value) => patchPrivacy({ profileVisibility: value }, 'profileVisibility')} />
            <SelectRow title="Email" text="Adresse visible uniquement selon votre choix." value={privacy.emailVisibility} onChange={(value) => patchPrivacy({ emailVisibility: value }, 'emailVisibility')} />
            <SelectRow title="Telephone" text="Protege le contact direct." value={privacy.phoneVisibility} onChange={(value) => patchPrivacy({ phoneVisibility: value }, 'phoneVisibility')} />
            <SelectRow title="CV" text="Partage du CV aux recruteurs ou a votre reseau." value={privacy.cvVisibility} onChange={(value) => patchPrivacy({ cvVisibility: value }, 'cvVisibility')} />
            <SelectRow title="Experiences" text="Parcours visible sur le profil public." value={privacy.professionalExperienceVisibility} onChange={(value) => patchPrivacy({ professionalExperienceVisibility: value }, 'professionalExperienceVisibility')} />
            <ToggleRow title="Demandes reseau" text="Autoriser les membres a vous envoyer des demandes." checked={privacy.allowNetworkingRequests} onChange={(checked) => patchPrivacy({ allowNetworkingRequests: checked }, 'allowNetworkingRequests')} />
            <ToggleRow title="Moteurs de recherche" text="Autoriser l indexation du profil public." checked={privacy.allowSearchEngines} onChange={(checked) => patchPrivacy({ allowSearchEngines: checked }, 'allowSearchEngines')} />
          </div>
          <div className="panelActionLine">
            <Link href={publicProfileHref} className="ghostCompactButton">Voir profil public</Link>
            <Link href={localizeHref(locale, '/settings/privacy')} className="ghostCompactButton">Reglages avances</Link>
          </div>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'security' ? (
        <SettingsPanel title="Securite" description="Controlez les alertes, la 2FA et les sessions actives.">
          <div className="settingsList">
            <StatusRow title="Mot de passe" text="Le mot de passe est gere par votre fournisseur d authentification." value="Protege" />
            <StatusRow title="Double authentification" text="Renforcez l acces avec un second facteur." value={security.twoFactorEnabled ? 'Activee' : 'Inactive'} />
            <ToggleRow title="Alertes de connexion" text="Recevoir une alerte lors des connexions sensibles." checked={security.loginAlerts} onChange={(checked) => patchSecurity({ loginAlerts: checked }, 'loginAlerts')} />
            <ToggleRow title="Notifications de session" text="Informer en cas de nouvelle session." checked={security.sessionNotifications} onChange={(checked) => patchSecurity({ sessionNotifications: checked }, 'sessionNotifications')} />
            <ToggleRow title="Appareils de confiance seulement" text="Limiter l acces aux appareils verifies." checked={security.trustedDevicesOnly} onChange={(checked) => patchSecurity({ trustedDevicesOnly: checked }, 'trustedDevicesOnly')} />
          </div>
          <div className="sessionGrid">
            {security.activeSessions.map((session) => (
              <article key={session.id} className="sessionCard">
                <strong>{session.label}</strong>
                <span>{session.userAgent}</span>
                <small>{session.current ? 'Session actuelle' : session.ipAddress}</small>
              </article>
            ))}
          </div>
          <div className="panelActionLine">
            <Link href={localizeHref(locale, '/settings/security')} className="primaryCompactButton">Ouvrir la securite avancee</Link>
            <Link href={localizeHref(locale, '/profile/settings/verification')} className="ghostCompactButton">Verification KYC/KYB</Link>
          </div>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'notifications' ? (
        <SettingsPanel title="Notifications" description="Choisissez les canaux utiles, sans bruit inutile.">
          <div className="settingsList">
            <ToggleRow title="Emails messages" text="Recevoir les nouveaux messages par email." checked={notifications.emailMessages} onChange={(checked) => patchNotifications({ emailMessages: checked }, 'emailMessages')} />
            <ToggleRow title="Emails reseau" text="Demandes de connexion et suivi reseau." checked={notifications.emailNetwork} onChange={(checked) => patchNotifications({ emailNetwork: checked }, 'emailNetwork')} />
            <ToggleRow title="Emails publications" text="Commentaires, reactions et partages." checked={notifications.emailPublications} onChange={(checked) => patchNotifications({ emailPublications: checked }, 'emailPublications')} />
            <ToggleRow title="Push messages" text="Notifications rapides dans l application." checked={notifications.pushMessages} onChange={(checked) => patchNotifications({ pushMessages: checked }, 'pushMessages')} />
            <ToggleRow title="Push verification" text="Etat KYC/KYB et documents." checked={notifications.pushVerification} onChange={(checked) => patchNotifications({ pushVerification: checked }, 'pushVerification')} />
            <ToggleRow title="Resume hebdomadaire" text="Un email synthetique sur l activite." checked={notifications.weeklyDigest} onChange={(checked) => patchNotifications({ weeklyDigest: checked }, 'weeklyDigest')} />
          </div>
          <div className="panelActionLine">
            <Link href={localizeHref(locale, '/notifications')} className="ghostCompactButton">Voir les notifications</Link>
          </div>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'messages' ? (
        <SettingsPanel title="Messages" description="Reglages conversationnels simples et professionnels.">
          <div className="settingsList">
            <SelectTextRow
              title="Theme discussion"
              text="Apparence des conversations."
              value={messages.theme}
              options={[
                ['system', 'Systeme'],
                ['light', 'Clair'],
                ['dark', 'Sombre'],
                ['blue', 'Bleu Communium'],
                ['green', 'Vert calme'],
              ]}
              onChange={(value) => patchMessages({ theme: value }, 'theme')}
            />
            <SelectTextRow
              title="Messages ephemeres"
              text="Expiration par defaut des conversations."
              value={messages.disappearingMessages}
              options={[
                ['off', 'Desactive'],
                ['24h', '24 heures'],
                ['7d', '7 jours'],
                ['once', 'Lecture unique'],
              ]}
              onChange={(value) => patchMessages({ disappearingMessages: value }, 'disappearingMessages')}
            />
            <ToggleRow title="Son notifications" text="Son leger pour les nouveaux messages." checked={messages.sound} onChange={(checked) => patchMessages({ sound: checked }, 'messageSound')} />
            <ToggleRow title="Entree pour envoyer" text="Envoyer avec la touche Entree." checked={messages.enterToSend} onChange={(checked) => patchMessages({ enterToSend: checked }, 'enterToSend')} />
            <ToggleRow title="Accuses de lecture" text="Afficher lu/envoye dans les conversations." checked={messages.readReceipts} onChange={(checked) => patchMessages({ readReceipts: checked }, 'readReceipts')} />
          </div>
          <div className="panelActionLine">
            <Link href={localizeHref(locale, '/messages')} className="primaryCompactButton">Ouvrir messages</Link>
          </div>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'subscription' ? (
        <SettingsPanel title="Abonnement" description="Plan actuel, facturation et historique des paiements.">
          <div className="subscriptionStrip">
            <div>
              <span>Plan actuel</span>
              <strong>{formatPlanLabel(locale, subscription?.plan)}</strong>
            </div>
            <div>
              <span>Statut</span>
              <strong>{formatSubscriptionStatus(locale, subscription?.status)}</strong>
            </div>
            <div>
              <span>Renouvellement</span>
              <strong>{displayDate(subscription?.renewsAt || subscription?.expiresAt, locale)}</strong>
            </div>
          </div>
          <div className="paymentsTable">
            {payments.length ? (
              payments.map((payment) => (
                <div key={payment.id} className="paymentRow">
                  <span>{displayDate(payment.createdAt, locale)}</span>
                  <strong>{payment.amount} {payment.currency}</strong>
                  <span>{formatSubscriptionStatus(locale, payment.status)}</span>
                  {payment.invoiceUrl ? <Link href={payment.invoiceUrl}>Facture</Link> : <span>{payment.invoiceNumber || 'Sans facture'}</span>}
                </div>
              ))
            ) : (
              <div className="emptyStateCompact">Aucun paiement pour le moment.</div>
            )}
          </div>
          <div className="panelActionLine">
            <Link href={localizeHref(locale, '/premium')} className="primaryCompactButton">Changer de plan</Link>
            <Link href={localizeHref(locale, '/billing')} className="ghostCompactButton">Facturation</Link>
          </div>
        </SettingsPanel>
      ) : null}

      {activeItem.panel === 'support' ? (
        <SettingsPanel title="Support" description="Acces direct aux demandes, a l aide et au support technique.">
          <div className="settingsList">
            <Link href={localizeHref(locale, '/contact')} className="settingsLinkRow">
              <span>
                <strong>Creer un ticket</strong>
                <small>Envoyer une demande au support Communium.</small>
              </span>
              <ChevronRight size={16} />
            </Link>
            <Link href={localizeHref(locale, '/features')} className="settingsLinkRow">
              <span>
                <strong>Documentation</strong>
                <small>Comprendre les modules disponibles.</small>
              </span>
              <ChevronRight size={16} />
            </Link>
            <Link href={localizeHref(locale, '/legal/privacy')} className="settingsLinkRow">
              <span>
                <strong>Confidentialite et droits</strong>
                <small>Gestion des donnees et demandes legales.</small>
              </span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </SettingsPanel>
      ) : null}
    </section>
  );
}

function SettingsPanel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="settingsPanel">
      <div className="settingsPanelHead">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions ? <div className="panelActions">{actions}</div> : null}
      </div>
      {children}
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="settingsField">
      <span>{label}</span>
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="settingsField">
      <span>{label}</span>
      <select value={value || options[0]?.[0]} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  title,
  text,
  checked,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="settingsRow">
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={checked ? 'settingsSwitch checked' : 'settingsSwitch'}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

function SelectRow({
  title,
  text,
  value,
  onChange,
}: {
  title: string;
  text: string;
  value: Visibility;
  onChange: (value: Visibility) => void;
}) {
  return (
    <div className="settingsRow">
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value as Visibility)} aria-label={title}>
        <option value="Public">{visibilityLabel('Public', 'fr')}</option>
        <option value="ContactsOnly">{visibilityLabel('ContactsOnly', 'fr')}</option>
        <option value="Private">{visibilityLabel('Private', 'fr')}</option>
      </select>
    </div>
  );
}

function SelectTextRow({
  title,
  text,
  value,
  options,
  onChange,
}: {
  title: string;
  text: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="settingsRow">
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={title}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusRow({ title, text, value }: { title: string; text: string; value: string }) {
  return (
    <div className="settingsRow">
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <em>{value}</em>
    </div>
  );
}

function UploadRow({
  title,
  text,
  accept,
  busy,
  onFile,
}: {
  title: string;
  text: string;
  accept: string;
  busy: boolean;
  onFile: (file?: File | null) => void;
}) {
  return (
    <label className="settingsUploadRow">
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <input type="file" accept={accept} onChange={(event) => onFile(event.target.files?.[0])} />
      <b>
        <Upload size={15} />
        {busy ? 'Envoi...' : 'Uploader'}
      </b>
    </label>
  );
}

function SettingsStyles() {
  return (
    <style>{`
      .settingsCenterPage {
        min-height: 100vh;
        padding: 24px clamp(14px, 2vw, 28px) 0;
        color: var(--ink-950);
        font-family: Manrope, 'Segoe UI', ui-sans-serif, system-ui, sans-serif;
      }

      .settingsCenterShell {
        display: grid;
        grid-template-columns: 286px minmax(0, 1fr);
        gap: 18px;
        align-items: start;
        max-width: 1500px;
        margin: 0 auto;
      }

      .settingsSidebar,
      .settingsPanel,
      .settingsTopBar {
        border: 1px solid rgba(148, 163, 184, 0.32);
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
        border-radius: 8px;
      }

      .settingsSidebar {
        position: sticky;
        top: 138px;
        max-height: calc(100vh - 158px);
        overflow: auto;
        padding: 14px;
      }

      .settingsProfileMini {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 8px;
        background: #f8fbff;
      }

      .settingsProfileMini strong,
      .settingsProfileMini span {
        display: block;
      }

      .settingsProfileMini strong {
        font-size: 0.92rem;
      }

      .settingsProfileMini span {
        color: #475569;
        font-size: 0.78rem;
      }

      .miniAvatar {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        overflow: hidden;
        border-radius: 50%;
        background: linear-gradient(135deg, #111c44, #2563eb);
        color: white;
        flex: 0 0 auto;
      }

      .miniAvatar img,
      .avatarPreview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .settingsNav {
        display: grid;
        gap: 14px;
        margin-top: 16px;
      }

      .settingsNavGroup p {
        margin: 0 0 6px;
        color: #0047ff;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .settingsNavItem {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 9px;
        padding: 9px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #0f172a;
        text-align: left;
        cursor: pointer;
      }

      .settingsNavItem:hover,
      .settingsNavItem.active {
        background: #eef5ff;
      }

      .settingsNavItem.active {
        color: #0f4fe6;
      }

      .settingsNavItem span {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .settingsNavItem strong {
        font-size: 0.84rem;
        line-height: 1.2;
      }

      .settingsNavItem small {
        color: #64748b;
        font-size: 0.72rem;
        line-height: 1.25;
      }

      .settingsMain {
        display: grid;
        gap: 14px;
      }

      .settingsTopBar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 18px;
      }

      .panelEyebrow {
        display: block;
        color: #0047ff;
        font-size: 0.74rem;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .settingsTopBar h1 {
        margin: 4px 0 3px;
        font-size: clamp(1.45rem, 2vw, 2.05rem);
        line-height: 1;
      }

      .settingsTopBar p,
      .settingsPanelHead p,
      .panelIntro {
        margin: 0;
        color: #475569;
        line-height: 1.55;
      }

      .saveState {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 36px;
        padding: 0 12px;
        border: 1px solid rgba(34, 197, 94, 0.22);
        border-radius: 999px;
        background: #effdf5;
        color: #166534;
        font-weight: 800;
        font-size: 0.82rem;
        white-space: nowrap;
      }

      .settingsNotice {
        border-radius: 8px;
        padding: 10px 12px;
        font-weight: 800;
      }

      .settingsNotice.success {
        border: 1px solid rgba(34, 197, 94, 0.28);
        background: #f0fdf4;
        color: #166534;
      }

      .settingsNotice.error {
        border: 1px solid rgba(239, 68, 68, 0.28);
        background: #fef2f2;
        color: #b91c1c;
      }

      .settingsPanel {
        padding: 18px;
      }

      .settingsPanelHead {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.22);
      }

      .settingsPanelHead h2 {
        margin: 0 0 4px;
        font-size: 1.1rem;
      }

      .panelActions,
      .panelActionLine {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .panelActionLine {
        margin-top: 14px;
      }

      .primaryCompactButton,
      .ghostCompactButton,
      .settingsLinkRow {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 14px;
        border-radius: 8px;
        font-weight: 900;
        text-decoration: none;
        cursor: pointer;
      }

      .primaryCompactButton {
        border: 1px solid rgba(30, 64, 175, 0.42);
        background: linear-gradient(135deg, #111c44, #2563eb);
        color: #ffffff;
      }

      .ghostCompactButton {
        border: 1px solid rgba(148, 163, 184, 0.36);
        background: #ffffff;
        color: #0f172a;
      }

      .settingsFormGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 14px;
      }

      .settingsField,
      .settingsTextarea {
        display: grid;
        gap: 7px;
        color: #334155;
        font-size: 0.8rem;
        font-weight: 850;
      }

      .settingsField input,
      .settingsField select,
      .settingsTextarea textarea,
      .settingsRow select {
        min-height: 42px;
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.34);
        border-radius: 8px;
        background: #fbfdff;
        color: #0f172a;
        font: inherit;
        font-weight: 750;
        padding: 0 12px;
        outline: none;
      }

      .settingsField input:focus,
      .settingsField select:focus,
      .settingsTextarea textarea:focus,
      .settingsRow select:focus {
        border-color: rgba(37, 99, 235, 0.56);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      .settingsTextarea {
        margin-top: 12px;
      }

      .settingsTextarea textarea {
        min-height: 96px;
        resize: vertical;
        padding-top: 10px;
      }

      .settingsList {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }

      .settingsRow,
      .settingsUploadRow,
      .settingsLinkRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        min-height: 58px;
        padding: 10px 12px;
        border: 1px solid rgba(148, 163, 184, 0.26);
        border-radius: 8px;
        background: #fbfdff;
      }

      .settingsLinkRow {
        color: #0f172a;
      }

      .settingsRow span,
      .settingsUploadRow span,
      .settingsLinkRow span {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .settingsRow strong,
      .settingsUploadRow strong,
      .settingsLinkRow strong {
        font-size: 0.92rem;
      }

      .settingsRow small,
      .settingsUploadRow small,
      .settingsLinkRow small {
        color: #64748b;
        line-height: 1.4;
      }

      .settingsRow select {
        max-width: 170px;
      }

      .settingsRow em {
        padding: 7px 10px;
        border-radius: 999px;
        background: #eef5ff;
        color: #0f4fe6;
        font-style: normal;
        font-weight: 900;
        white-space: nowrap;
      }

      .settingsSwitch {
        position: relative;
        width: 46px;
        height: 26px;
        padding: 0;
        border: 1px solid rgba(148, 163, 184, 0.45);
        border-radius: 999px;
        background: #e2e8f0;
        cursor: pointer;
        flex: 0 0 auto;
      }

      .settingsSwitch span {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
        transition: transform 0.16s ease;
      }

      .settingsSwitch.checked {
        border-color: rgba(37, 99, 235, 0.45);
        background: #2563eb;
      }

      .settingsSwitch.checked span {
        transform: translateX(20px);
      }

      .mediaSettingsGrid {
        display: grid;
        grid-template-columns: minmax(240px, 340px) 1fr;
        gap: 14px;
        margin-top: 14px;
      }

      .mediaPreview {
        position: relative;
        min-height: 230px;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.26);
        border-radius: 8px;
        background: #f8fbff;
        padding: 142px 14px 14px;
      }

      .coverPreview {
        position: absolute;
        inset: 0 0 auto;
        height: 140px;
        background:
          linear-gradient(135deg, rgba(17, 28, 68, 0.94), rgba(37, 99, 235, 0.88)),
          #18306f;
        background-size: cover;
        background-position: center;
      }

      .avatarPreview {
        position: absolute;
        top: 98px;
        left: 16px;
        display: grid;
        place-items: center;
        width: 76px;
        height: 76px;
        border: 4px solid #ffffff;
        border-radius: 50%;
        overflow: hidden;
        background: linear-gradient(135deg, #6d5dfc, #ffffff);
        color: #0f172a;
      }

      .mediaPreview strong {
        display: block;
        margin-top: 18px;
      }

      .settingsUploadRow {
        position: relative;
        cursor: pointer;
      }

      .settingsUploadRow input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      .settingsUploadRow b {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #0f4fe6;
        font-size: 0.86rem;
      }

      .sessionGrid,
      .subscriptionStrip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }

      .sessionCard,
      .subscriptionStrip > div {
        display: grid;
        gap: 5px;
        min-height: 82px;
        padding: 12px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 8px;
        background: #f8fbff;
      }

      .sessionCard span,
      .sessionCard small,
      .subscriptionStrip span {
        color: #64748b;
        font-size: 0.78rem;
        line-height: 1.35;
      }

      .subscriptionStrip strong {
        font-size: 1rem;
      }

      .paymentsTable {
        display: grid;
        gap: 8px;
        margin-top: 14px;
      }

      .paymentRow {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 12px;
        align-items: center;
        min-height: 44px;
        padding: 9px 10px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 8px;
        background: #ffffff;
      }

      .paymentRow span,
      .paymentRow a {
        color: #475569;
        font-size: 0.84rem;
      }

      .emptyStateCompact {
        padding: 12px;
        border: 1px dashed rgba(148, 163, 184, 0.36);
        border-radius: 8px;
        color: #64748b;
        font-weight: 800;
      }

      .panelSkeleton {
        height: 72px;
        margin: 14px 0;
        border-radius: 8px;
        background: linear-gradient(90deg, #eef2f7, #f8fafc, #eef2f7);
        background-size: 240% 100%;
        animation: settingsPulse 1.2s ease-in-out infinite;
      }

      .panelSkeleton.wide {
        height: 124px;
      }

      @keyframes settingsPulse {
        0% { background-position: 0% 0; }
        100% { background-position: -240% 0; }
      }

      @media (max-width: 1120px) {
        .settingsCenterShell {
          grid-template-columns: 230px minmax(0, 1fr);
        }

        .settingsSidebar {
          top: 112px;
        }

        .settingsFormGrid,
        .mediaSettingsGrid,
        .sessionGrid,
        .subscriptionStrip {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .settingsCenterPage {
          padding-inline: 10px;
        }

        .settingsCenterShell {
          grid-template-columns: 1fr;
        }

        .settingsSidebar {
          position: relative;
          top: auto;
          max-height: none;
        }

        .settingsNav {
          max-height: 360px;
          overflow: auto;
        }

        .settingsTopBar,
        .settingsPanelHead,
        .settingsRow,
        .settingsUploadRow,
        .settingsLinkRow {
          align-items: stretch;
          flex-direction: column;
        }

        .settingsRow select {
          max-width: none;
        }

        .paymentRow {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}
