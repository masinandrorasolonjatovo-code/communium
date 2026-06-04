'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Crown,
  FileText,
  Gem,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import { localizeHref } from '@/components/locale-path';
import { buildCheckoutHref } from '@/lib/checkout-flow';
import type { Locale } from '@/i18n.config';
import { verificationBadgeText, verificationStatusLabel, type VerificationAccountType, type VerificationStatus } from '@/lib/verification';

type Visibility = 'Public' | 'Private' | 'ContactsOnly';
type PageKey =
  | 'public-profile'
  | 'publications'
  | 'subscription'
  | 'statistics'
  | 'settings'
  | 'guide'
  | 'help';

interface PrivacySettings {
  profileVisibility?: Visibility | null;
  cvVisibility?: Visibility | null;
  photoVisibility?: Visibility | null;
  bannerVisibility?: Visibility | null;
  professionalExperienceVisibility?: Visibility | null;
  interestsVisibility?: Visibility | null;
  professionVisibility?: Visibility | null;
  allowNetworkingRequests?: boolean;
}

interface WorkspaceProfile {
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  city?: string | null;
  profilePictureUrl?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  currentIndustry?: string | null;
  publicProfileUrl?: string | null;
  cvUrl?: string | null;
  identityVerified?: boolean;
  accountType?: 'PERSONAL' | 'BUSINESS' | null;
  verificationStatus?: VerificationStatus | null;
  verificationBadgeLabel?: string | null;
  professionalExperiences?: Array<{ id: number }>;
  interests?: Array<{ id: number; name: string }>;
  privacySettings?: PrivacySettings | null;
}

interface QuickMetric {
  label: string;
  value: string;
  help: string;
}

interface SubscriptionPlan {
  id: 'free' | 'silver' | 'gold' | 'platinum';
  tone: 'light' | 'silver' | 'gold' | 'violet';
  icon: typeof ShieldCheck;
  eyebrow: string;
  title: string;
  detailPill: string;
  price: string;
  priceLabel: string;
  description: string;
  highlightTitle: string;
  highlightText: string;
  features: string[];
  buttonHref: string;
  buttonLabel: string;
}

interface ContentCard {
  title: string;
  text: string;
  icon: typeof Globe2;
  href?: string;
  ctaLabel?: string;
  badge?: string;
  tone?: 'slate' | 'blue' | 'mint' | 'gold' | 'violet' | 'silver' | 'light';
}

interface PageAction {
  href: string;
  label: string;
  icon: typeof Globe2;
}

interface PageContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: PageAction;
  secondaryAction?: PageAction;
  cards: ContentCard[];
}

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const apiBase = backendOrigin ? `${backendOrigin}/api/profile` : '/api/profile';

function assetUrl(fileUrl?: string | null) {
  if (!fileUrl) {
    return '';
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
}

function memberName(profile: WorkspaceProfile | null, fallback: string) {
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || fallback;
}

function memberInitials(profile: WorkspaceProfile | null, fallback: string) {
  return memberName(profile, fallback)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function visibilityLabel(locale: Locale, value?: Visibility | null) {
  const isFrench = locale === 'fr';

  if (value === 'ContactsOnly') {
    return isFrench ? 'Connexions uniquement' : 'Connections only';
  }

  if (value === 'Private') {
    return isFrench ? 'Prive' : 'Private';
  }

  return isFrench ? 'Public' : 'Public';
}

function profileCompletion(profile: WorkspaceProfile | null) {
  const checks = [
    Boolean(profile?.profilePictureUrl),
    Boolean(profile?.firstName && profile?.lastName),
    Boolean(profile?.currentJobTitle),
    Boolean(profile?.city && profile?.country),
    Boolean((profile?.professionalExperiences?.length || 0) > 0),
    Boolean((profile?.interests?.length || 0) >= 3),
    Boolean(profile?.cvUrl),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function renderCardLink(card: ContentCard, key: string) {
  const Icon = card.icon;
  const content = (
    <>
      <span className={`cardTone ${card.tone || 'blue'}`}>
        <Icon className="cardIcon" strokeWidth={2.1} />
        {card.badge ? <small>{card.badge}</small> : null}
      </span>
      <strong>{card.title}</strong>
      <p>{card.text}</p>
      {card.href && card.ctaLabel ? (
        <span className="cardInlineCta">
          {card.ctaLabel}
          <ArrowRight className="ctaArrow" strokeWidth={2.1} />
        </span>
      ) : null}
    </>
  );

  if (card.href) {
    return (
      <Link key={key} href={card.href} className={`contentCard ${card.tone || 'blue'}`}>
        {content}
      </Link>
    );
  }

  return (
    <article key={key} className={`contentCard ${card.tone || 'blue'}`}>
      {content}
    </article>
  );
}

export default function MemberAccountRoutePage({
  locale,
  pageKey,
}: {
  locale: Locale;
  pageKey: PageKey;
}) {
  const isFrench = locale === 'fr';
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const homeHref = localizeHref(locale, '/');
  const dashboardHref = localizeHref(locale, '/dashboard');
  const studioHref = localizeHref(locale, '/dashboard/profile');
  const subscriptionHref = localizeHref(locale, '/dashboard/subscription');
  const statisticsHref = localizeHref(locale, '/dashboard/statistics');
  const settingsHref = localizeHref(locale, '/profile/settings');
  const privacyHref = localizeHref(locale, '/profile/settings/privacy');
  const verificationHref = localizeHref(locale, '/profile/settings/verification');
  const guideHref = localizeHref(locale, '/profile/settings/guide');
  const helpHref = localizeHref(locale, '/profile/help');

  const fallbackName = user?.fullName || user?.username || (isFrench ? 'Membre Communium' : 'Communium member');
  const displayName = memberName(profile, fallbackName);
  const initials = memberInitials(profile, fallbackName || 'CM');
  const avatarSrc = assetUrl(profile?.profilePictureUrl) || user?.imageUrl || '';
  const completion = profileCompletion(profile);
  const experiencesCount = profile?.professionalExperiences?.length || 0;
  const interestsCount = profile?.interests?.length || 0;
  const currentRole =
    [profile?.currentJobTitle, profile?.currentCompany].filter(Boolean).join(isFrench ? ' chez ' : ' @ ') ||
    profile?.currentIndustry ||
    (isFrench ? 'Profil professionnel en cours' : 'Professional profile in progress');
  const currentLocation =
    [profile?.city, profile?.country].filter(Boolean).join(', ') ||
    (isFrench ? 'Ville et pays a completer' : 'City and country to complete');
  const verificationLabel = verificationStatusLabel((profile?.verificationStatus || 'NON_VERIFIED') as VerificationStatus, locale);
  const verificationBadge =
    profile?.verificationBadgeLabel ||
    verificationBadgeText(
      (profile?.accountType || 'PERSONAL') as VerificationAccountType,
      (profile?.verificationStatus || 'NON_VERIFIED') as VerificationStatus,
      locale,
    );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setProfileLoading(false);
      setProfile(null);
      return;
    }

    let ignore = false;

    async function loadProfile() {
      try {
        setProfileLoading(true);

        const token = await getToken();
        const response = await fetch(`${apiBase}/my-profile`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                'x-user-email': user?.primaryEmailAddress?.emailAddress || '',
                'x-user-name': user?.fullName || user?.username || '',
                'x-user-account-type':
                  typeof user?.unsafeMetadata?.accountType === 'string' ? user.unsafeMetadata.accountType : '',
              }
            : undefined,
        });

        const data = (await response.json()) as {
          success?: boolean;
          data?: WorkspaceProfile;
        };

        if (!ignore && response.ok && data.success && data.data) {
          setProfile(data.data);
          return;
        }

        if (!ignore) {
          setProfile(null);
        }
      } catch {
        if (!ignore) {
          setProfile(null);
        }
      } finally {
        if (!ignore) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [getToken, isLoaded, user]);

  const quickLinks = useMemo(
    () => [
      { href: dashboardHref, label: isFrench ? 'Tableau de bord' : 'Dashboard', icon: LayoutDashboard },
      { href: studioHref, label: isFrench ? 'Profil' : 'Profile', icon: UserRound },
      { href: settingsHref, label: isFrench ? 'Parametres' : 'Settings', icon: Settings },
      { href: helpHref, label: isFrench ? 'Aide' : 'Help', icon: HelpCircle },
    ],
    [dashboardHref, helpHref, isFrench, settingsHref, studioHref],
  );

  const heroMetrics = useMemo<QuickMetric[]>(() => {
    switch (pageKey) {
      case 'public-profile':
        return [
          {
            label: isFrench ? 'Profil' : 'Profile',
            value: profile?.publicProfileUrl ? (isFrench ? 'Active' : 'Active') : isFrench ? 'A creer' : 'To create',
            help: profile?.publicProfileUrl || (isFrench ? 'Cree ton lien public depuis le profil.' : 'Create your public link from the profile.'),
          },
          {
            label: isFrench ? 'Visibilite' : 'Visibility',
            value: visibilityLabel(locale, profile?.privacySettings?.profileVisibility),
            help: isFrench ? 'Reglage general du profil.' : 'Global profile visibility.',
          },
          {
            label: isFrench ? 'Profil complete' : 'Profile completion',
            value: `${completion}%`,
            help: isFrench ? 'Progression globale du profil.' : 'Overall profile progress.',
          },
        ];
      case 'publications':
        return [
          {
            label: isFrench ? 'Zone membre' : 'Member area',
            value: isFrench ? 'Active' : 'Active',
            help: isFrench ? 'Le feed membre reste disponible sur l accueil connecte.' : 'The member feed remains available on the signed-in home page.',
          },
          {
            label: isFrench ? 'Profil' : 'Profile',
            value: profile?.publicProfileUrl ? (isFrench ? 'Prete' : 'Ready') : isFrench ? 'A preparer' : 'To prepare',
            help: isFrench ? 'Le profil renforce la portee du feed.' : 'The profile strengthens feed reach.',
          },
          {
            label: isFrench ? 'Confidentialite' : 'Privacy',
            value: visibilityLabel(locale, profile?.privacySettings?.profileVisibility),
            help: isFrench ? 'Les contenus restent coherents avec ton profil.' : 'Content stays coherent with your profile settings.',
          },
        ];
      case 'subscription':
        return [
          {
            label: isFrench ? 'Silver' : 'Silver',
            value: isFrench ? '0 DH / 30 j' : '0 MAD / 30 d',
            help: isFrench ? 'Entree pro avec essai gratuit.' : 'Professional start with a free trial.',
          },
          {
            label: isFrench ? 'Gold' : 'Gold',
            value: '250 DH',
            help: isFrench ? 'Presence renforcee dans le reseau.' : 'Stronger presence inside the network.',
          },
          {
            label: isFrench ? 'Platinum' : 'Platinum',
            value: '500 DH',
            help: isFrench ? 'Diffusion premium et priorite haute.' : 'Premium distribution and high priority.',
          },
        ];
      case 'statistics':
        return [
          {
            label: isFrench ? 'Profil complete' : 'Profile completion',
            value: `${completion}%`,
            help: isFrench ? 'Photo, profession, ville, experiences, centres d interet et CV.' : 'Photo, profession, city, experiences, interests and CV.',
          },
          {
            label: isFrench ? 'Experiences' : 'Experiences',
            value: String(experiencesCount),
            help: isFrench ? 'Nombre d experiences renseignees.' : 'Number of listed experiences.',
          },
          {
            label: isFrench ? 'Interets' : 'Interests',
            value: String(interestsCount),
            help: isFrench ? 'Centres d interet saisis dans le profil.' : 'Interests added in the profile.',
          },
        ];
      case 'settings':
        return [
          {
            label: isFrench ? 'Confidentialite' : 'Privacy',
            value: visibilityLabel(locale, profile?.privacySettings?.profileVisibility),
            help: isFrench ? 'Pilotage global du profil.' : 'Global control of the profile.',
          },
          {
            label: isFrench ? 'Verification' : 'Verification',
            value: verificationLabel,
            help:
              verificationBadge ||
              (isFrench ? 'Ajoute les pieces KYC ou KYB pour activer le badge.' : 'Upload KYC or KYB documents to unlock the badge.'),
          },
          {
            label: isFrench ? 'Progression' : 'Progress',
            value: `${completion}%`,
            help: isFrench ? 'Etat general du profil membre.' : 'Overall state of the member profile.',
          },
        ];
      case 'guide':
        return [
          {
            label: isFrench ? 'Profil' : 'Profile',
            value: `${completion}%`,
            help: isFrench ? 'Progression du compte.' : 'Account progress.',
          },
          {
            label: isFrench ? 'Confidentialite' : 'Privacy',
            value: visibilityLabel(locale, profile?.privacySettings?.profileVisibility),
            help: isFrench ? 'Regles de diffusion.' : 'Visibility rules.',
          },
          {
            label: isFrench ? 'Feed' : 'Feed',
            value: profile?.publicProfileUrl ? (isFrench ? 'Actif' : 'Active') : isFrench ? 'A activer' : 'To activate',
            help: isFrench ? 'Page publique et activite.' : 'Public page and activity.',
          },
        ];
      case 'help':
        return [
          {
            label: isFrench ? 'Support' : 'Support',
            value: isFrench ? 'Disponible' : 'Available',
            help: 'support@communium.local',
          },
          {
            label: isFrench ? 'Compte' : 'Account',
            value: isFrench ? 'Protege' : 'Protected',
            help: isFrench ? 'Routes privees et controle de session.' : 'Private routes and session control.',
          },
          {
            label: isFrench ? 'Parcours' : 'Flow',
            value: isFrench ? 'Separer' : 'Separated',
            help: isFrench ? 'Chaque module dispose maintenant de sa vraie page.' : 'Each module now has its own real page.',
          },
        ];
      default:
        return [];
    }
  }, [
    completion,
    experiencesCount,
    interestsCount,
    isFrench,
    locale,
    pageKey,
    profile?.privacySettings,
    profile?.publicProfileUrl,
    verificationBadge,
    verificationLabel,
  ]);

  const pageContent = useMemo<PageContent>(() => {
    switch (pageKey) {
      case 'public-profile':
        return {
          eyebrow: isFrench ? 'Profil' : 'Profile',
          title: isFrench ? 'Cette page a ete retiree.' : 'This page has been removed.',
          description: isFrench
            ? 'La gestion du profil est maintenant centralisee dans la vraie page Profil.'
            : 'Profile management is now centralized in the real Profile page.',
          primaryAction: {
            href: studioHref,
            label: isFrench ? 'Ouvrir le profil' : 'Open profile',
            icon: UserRound,
          },
          secondaryAction: {
            href: dashboardHref,
            label: isFrench ? 'Retour dashboard' : 'Back to dashboard',
            icon: LayoutDashboard,
          },
          cards: [],
        };
      case 'publications':
        return {
          eyebrow: isFrench ? 'Feed' : 'Feed',
          title: isFrench ? 'Cette page a ete retiree.' : 'This page has been removed.',
          description: isFrench
            ? 'Les publications se font maintenant directement depuis l accueil membre, sans page separee.'
            : 'Posts are now handled directly from the member feed, without a separate page.',
          primaryAction: {
            href: homeHref,
            label: isFrench ? 'Ouvrir le feed' : 'Open feed',
            icon: Megaphone,
          },
          secondaryAction: {
            href: studioHref,
            label: isFrench ? 'Ouvrir le profil' : 'Open profile',
            icon: UserRound,
          },
          cards: [],
        };
      case 'subscription':
        return {
          eyebrow: isFrench ? 'Abonnement' : 'Subscription',
          title: isFrench ? 'Chaque formule a maintenant sa propre page membre.' : 'Each plan now has its own dedicated member page.',
          description: isFrench
            ? 'Au lieu d ouvrir un simple bloc dans une page longue, le menu compte t amene ici pour comparer les niveaux Gratuit, Silver, Gold et Platinum.'
            : 'Instead of opening a simple block inside a long page, the account menu brings you here to compare Free, Silver, Gold and Platinum.',
          primaryAction: {
            href: buildCheckoutHref(locale, 'gold'),
            label: isFrench ? 'Voir Gold' : 'View Gold',
            icon: Crown,
          },
          secondaryAction: {
            href: buildCheckoutHref(locale, 'platinum'),
            label: isFrench ? 'Voir Platinum' : 'View Platinum',
            icon: Sparkles,
          },
          cards: [],
        };
      case 'statistics':
        return {
          eyebrow: isFrench ? 'Statistiques' : 'Statistics',
          title: isFrench ? 'Suis la qualite de ton profil dans une page separee.' : 'Track your profile quality from a separate page.',
          description: isFrench
            ? 'Le menu ne te renvoie plus vers un bloc enfoui dans le dashboard. Cette page regroupe maintenant les points de progression essentiels.'
            : 'The menu no longer sends you to a block buried inside the dashboard. This page now groups the essential progress indicators.',
          primaryAction: {
            href: studioHref,
            label: isFrench ? 'Completer le profil' : 'Complete the profile',
            icon: UserRound,
          },
          secondaryAction: {
            href: dashboardHref,
            label: isFrench ? 'Retour dashboard' : 'Back to dashboard',
            icon: LayoutDashboard,
          },
          cards: [
            {
              title: isFrench ? 'Progression du profil' : 'Profile progress',
              text: isFrench
                ? `${completion}% complete selon la photo, le nom, la profession, la localisation, les experiences, les centres d interet et le CV.`
                : `${completion}% completed based on photo, name, profession, location, experiences, interests and CV.`,
              icon: BarChart3,
              href: studioHref,
              ctaLabel: isFrench ? 'Ameliorer le profil' : 'Improve the profile',
              tone: 'blue',
            },
            {
              title: isFrench ? 'Parcours professionnel' : 'Professional journey',
              text: isFrench
                ? `${experiencesCount} experience(s) renseignee(s). Une seule experience minimum aide deja beaucoup la lisibilite du profil.`
                : `${experiencesCount} experience(s) listed. Even one experience already improves profile readability a lot.`,
              icon: UsersRound,
              href: studioHref,
              ctaLabel: isFrench ? 'Gerer les experiences' : 'Manage experiences',
              tone: 'slate',
            },
            {
              title: isFrench ? 'Centres d interet' : 'Interests',
              text: isFrench
                ? `${interestsCount} centre(s) d interet ajoute(s). Trois ou plus renforcent les recommandations et la decouverte.`
                : `${interestsCount} interest(s) added. Three or more strengthen recommendations and discovery.`,
              icon: Sparkles,
              href: studioHref,
              ctaLabel: isFrench ? 'Ajouter des interets' : 'Add interests',
              tone: 'mint',
            },
            {
              title: isFrench ? 'Documents et profil' : 'Documents and profile',
              text: isFrench
                ? `${profile?.cvUrl ? 'CV ajoute' : 'CV manquant'} · profil a jour.`
                : `${profile?.cvUrl ? 'CV uploaded' : 'CV missing'} · profile up to date.`,
              icon: FileText,
              href: studioHref,
              ctaLabel: isFrench ? 'Voir le profil' : 'View profile',
              tone: 'gold',
            },
          ],
        };
      case 'settings':
        return {
          eyebrow: isFrench ? 'Parametres' : 'Settings',
          title: isFrench ? 'Parametres du compte' : 'Account settings',
          description: isFrench
            ? 'Gere les informations du compte, la confidentialite et la verification depuis des pages dediees.'
            : 'Manage account information, privacy and verification from dedicated pages.',
          primaryAction: {
            href: privacyHref,
            label: isFrench ? 'Ouvrir la confidentialite' : 'Open privacy settings',
            icon: ShieldCheck,
          },
          secondaryAction: {
            href: verificationHref,
            label: isFrench ? 'Ouvrir la verification' : 'Open verification',
            icon: ShieldCheck,
          },
          cards: [
            {
              title: isFrench ? 'Confidentialite' : 'Privacy',
              text: isFrench
                ? 'Telephone, email, CV, profession, photo, banniere et parcours ont chacun leur propre regle.'
                : 'Phone, email, CV, profession, photo, banner and journey all have their own rule.',
              icon: ShieldCheck,
              href: privacyHref,
              ctaLabel: isFrench ? 'Aller a la confidentialite' : 'Go to privacy',
              tone: 'blue',
            },
            {
              title: isFrench ? 'Verification du compte' : 'Account verification',
              text: verificationBadge
                ? isFrench
                  ? `${verificationBadge}. Les pieces et l historique de revue sont centralises dans une page dediee.`
                  : `${verificationBadge}. Documents and review history are centralized in a dedicated page.`
                : isFrench
                  ? `Statut actuel: ${verificationLabel}. Ajoute les pieces KYC ou KYB dans l espace dedie.`
                  : `Current status: ${verificationLabel}. Upload KYC or KYB documents from the dedicated workspace.`,
              icon: ShieldCheck,
              href: verificationHref,
              ctaLabel: isFrench ? 'Ouvrir la verification' : 'Open verification',
              tone: 'gold',
            },
            {
              title: isFrench ? 'Guide utilisateur' : 'User guide',
              text: isFrench
                ? 'Retrouve les etapes claires pour completer le profil, regler la visibilite et publier proprement.'
                : 'Find clear steps to complete the profile, adjust visibility and publish cleanly.',
              icon: BookOpen,
              href: guideHref,
              ctaLabel: isFrench ? 'Ouvrir le guide' : 'Open the guide',
              tone: 'mint',
            },
            {
              title: isFrench ? 'Aide' : 'Help',
              text: isFrench
                ? 'Acces, profil, abonnement et support ont maintenant une entree distincte.'
                : 'Access, profile, subscription and support now each have their own entry point.',
              icon: HelpCircle,
              href: helpHref,
              ctaLabel: isFrench ? 'Ouvrir l aide' : 'Open help',
              tone: 'slate',
            },
          ],
        };
      case 'guide':
        return {
          eyebrow: isFrench ? 'Guide utilisateur' : 'User guide',
          title: isFrench ? 'Configuration du compte' : 'Account setup',
          description: isFrench
            ? 'Complete les actions importantes de ton espace Communium.'
            : 'Complete the important actions in your Communium space.',
          primaryAction: {
            href: guideHref,
            label: isFrench ? 'Ouvrir le guide' : 'Open guide',
            icon: BookOpen,
          },
          secondaryAction: {
            href: studioHref,
            label: isFrench ? 'Modifier le profil' : 'Edit profile',
            icon: UserRound,
          },
          cards: [
            {
              title: isFrench ? '1. Completer l identite' : '1. Complete identity',
              text: isFrench
                ? 'Nom, profession, ville, pays, photo et CV forment la base du profil.'
                : 'Name, profession, city, country, photo and CV form the profile foundation.',
              icon: UserRound,
              href: studioHref,
              ctaLabel: isFrench ? 'Ouvrir le profil' : 'Open profile',
              tone: 'blue',
            },
            {
              title: isFrench ? '2. Regler la confidentialite' : '2. Adjust privacy',
              text: isFrench
                ? 'Choisis ce qui est public, reserve aux connexions ou completement prive.'
                : 'Choose what is public, connections-only or completely private.',
              icon: ShieldCheck,
              href: privacyHref,
              ctaLabel: isFrench ? 'Regler la confidentialite' : 'Adjust privacy',
              tone: 'mint',
            },
            {
              title: isFrench ? '3. Regler le profil' : '3. Adjust the profile',
              text: isFrench
                ? 'Complete le profil et controle les informations visibles.'
                : 'Complete the profile and control visible information.',
              icon: UserRound,
              href: studioHref,
              ctaLabel: isFrench ? 'Ouvrir le profil' : 'Open profile',
              tone: 'gold',
            },
            {
              title: isFrench ? '4. Monter en visibilite' : '4. Increase visibility',
              text: isFrench
                ? 'Si besoin, passe a Silver, Gold ou Platinum depuis une page abonnement distincte.'
                : 'If needed, move to Silver, Gold or Platinum from a dedicated subscription page.',
              icon: Crown,
              href: subscriptionHref,
              ctaLabel: isFrench ? 'Voir les abonnements' : 'View subscriptions',
              tone: 'violet',
            },
          ],
        };
      case 'help':
        return {
          eyebrow: isFrench ? 'Aide' : 'Help',
          title: isFrench ? 'Une page d aide distincte, au lieu d un simple scroll.' : 'A dedicated help page instead of a simple scroll target.',
          description: isFrench
            ? 'Le menu compte te conduit maintenant vers un vrai centre d aide avec les chemins utiles pour le profil, la confidentialite et l abonnement.'
            : 'The account menu now leads to a real help center with useful paths for the profile, privacy and subscription.',
          primaryAction: {
            href: settingsHref,
            label: isFrench ? 'Voir les parametres' : 'View settings',
            icon: Settings,
          },
          secondaryAction: {
            href: guideHref,
            label: isFrench ? 'Lire le guide' : 'Read the guide',
            icon: BookOpen,
          },
          cards: [
            {
              title: isFrench ? 'Compte et acces' : 'Account and access',
              text: isFrench
                ? 'Si le profil n apparait pas comme prevu, commence par le dashboard puis le profil.'
                : 'If the profile does not appear as expected, start from the dashboard and then the profile.',
              icon: LayoutDashboard,
              href: dashboardHref,
              ctaLabel: isFrench ? 'Ouvrir le dashboard' : 'Open dashboard',
              tone: 'blue',
            },
            {
              title: isFrench ? 'Profil' : 'Profile',
              text: isFrench
                ? 'Pour la visibilite et les informations du compte, utilise la page profil.'
                : 'For visibility and account information, use the profile page.',
              icon: UserRound,
              href: studioHref,
              ctaLabel: isFrench ? 'Aller au profil' : 'Go to profile',
              tone: 'gold',
            },
            {
              title: isFrench ? 'Confidentialite' : 'Privacy',
              text: isFrench
                ? 'Pour email, telephone, CV, profession, photo ou banniere, la page confidentialite reste la bonne entree.'
                : 'For email, phone, CV, profession, photo or banner, the privacy page remains the right entry point.',
              icon: ShieldCheck,
              href: privacyHref,
              ctaLabel: isFrench ? 'Ouvrir la confidentialite' : 'Open privacy',
              tone: 'mint',
            },
            {
              title: isFrench ? 'Abonnement' : 'Subscription',
              text: isFrench
                ? 'Pour choisir Silver, Gold ou Platinum avec un rendu clair, utilise la page abonnement dediee.'
                : 'To choose Silver, Gold or Platinum with a clear presentation, use the dedicated subscription page.',
              icon: Crown,
              href: subscriptionHref,
              ctaLabel: isFrench ? 'Voir les abonnements' : 'View subscriptions',
              tone: 'violet',
            },
          ],
        };
      default:
        return {
          eyebrow: '',
          title: '',
          description: '',
          cards: [],
        };
    }
  }, [
    completion,
    dashboardHref,
    helpHref,
    homeHref,
    isFrench,
    locale,
    pageKey,
    privacyHref,
    verificationHref,
    profile?.cvUrl,
    profile?.verificationStatus,
    profile?.verificationBadgeLabel,
    profile?.privacySettings,
    profile?.publicProfileUrl,
    settingsHref,
    studioHref,
    subscriptionHref,
    guideHref,
  ]);

  const PrimaryActionIcon = pageContent.primaryAction?.icon;
  const SecondaryActionIcon = pageContent.secondaryAction?.icon;
  const routeThemeClass = `route-${pageKey}`;

  const subscriptionPlans = useMemo<SubscriptionPlan[]>(
    () => [
      {
        id: 'free',
        tone: 'light',
        icon: ShieldCheck,
        eyebrow: 'FREE',
        title: isFrench ? 'Base essentielle' : 'Essential base',
        detailPill: isFrench ? 'Essentiel' : 'Essential',
        price: '0 DH',
        priceLabel: isFrench ? 'Plan gratuit' : 'Free plan',
        description: isFrench
          ? 'Une entree simple pour poser ton identite, regler la confidentialite et ouvrir ton espace membre.'
          : 'Profile base, private space and first settings.',
        highlightTitle: isFrench ? 'POINT DE DEPART' : 'STARTING POINT',
        highlightText: isFrench
          ? 'Le profil reste sobre mais deja propre pour publier, configurer et preparer la suite.'
          : 'A clean starting point to publish, configure and prepare what comes next.',
        features: isFrench
          ? ['Profil professionnel de base', 'Confidentialite par champ', 'Acces a la homepage membre']
          : ['Base professional profile', 'Field-level privacy', 'Access to the member homepage'],
        buttonHref: studioHref,
        buttonLabel: isFrench ? 'Rester en gratuit' : 'Stay on Free',
      },
      {
        id: 'silver',
        tone: 'silver',
        icon: Sparkles,
        eyebrow: isFrench ? 'PACK SILVER' : 'SILVER PACK',
        title: isFrench ? 'Essai Silver 1 mois' : 'Silver 1-month trial',
        detailPill: isFrench ? '30 jours' : '30 days',
        price: '0 DH',
        priceLabel: isFrench ? 'Offre Silver 30 jours' : 'Silver 30-day offer',
        description: isFrench
          ? 'Une mise en route plus dynamique pour entrer dans le reseau avec une vraie presence professionnelle.'
          : 'Clean trial to enter the network with a professional presence.',
        highlightTitle: isFrench ? 'ENTREE GUIDEE' : 'GUIDED ENTRY',
        highlightText: isFrench
          ? 'Le profil gagne en structure, en visibilite initiale et en lisibilite pendant tout le mois d essai.'
          : 'Your profile gets a stronger structure and more visibility during the trial month.',
        features: isFrench
          ? ['Essai gratuit pendant 30 jours', 'Page membre et reseau essentiel', 'Activation rapide du profil']
          : ['Free 30-day trial', 'Member page and essential network', 'Fast profile activation'],
        buttonHref: buildCheckoutHref(locale, 'silver'),
        buttonLabel: isFrench ? 'Activer Silver' : 'Activate Silver',
      },
      {
        id: 'gold',
        tone: 'gold',
        icon: Crown,
        eyebrow: isFrench ? 'PACK GOLD' : 'GOLD PACK',
        title: isFrench ? 'Activation Pack Gold' : 'Activate Gold Pack',
        detailPill: isFrench ? 'Plus visible' : 'More visible',
        price: '250 DH',
        priceLabel: isFrench ? 'Abonnement Gold' : 'Gold subscription',
        description: isFrench
          ? 'Plus de presence, plus de visibilite, plus d impact dans le reseau.'
          : 'More views, more recommendations and stronger presence.',
        highlightTitle: isFrench ? 'VISIBILITE RENFORCEE' : 'STRONGER VISIBILITY',
        highlightText: isFrench
          ? 'Le profil ressort davantage et gagne en exposition dans le reseau.'
          : 'The profile stands out more and gets stronger exposure in the network.',
        features: isFrench
          ? ['Plus de vues sur le profil', 'Mise en avant dans le reseau', 'Activation prioritaire des opportunites']
          : ['More profile views', 'Featured in the network', 'Priority access to opportunities'],
        buttonHref: buildCheckoutHref(locale, 'gold'),
        buttonLabel: isFrench ? 'Activer Pack Gold' : 'Activate Gold Pack',
      },
      {
        id: 'platinum',
        tone: 'violet',
        icon: Gem,
        eyebrow: isFrench ? 'PACK PLATINUM' : 'PLATINUM PACK',
        title: isFrench ? 'Activation Platinum' : 'Activate Platinum',
        detailPill: isFrench ? 'Elite' : 'Elite',
        price: '500 DH',
        priceLabel: isFrench ? 'Abonnement Platinum' : 'Platinum subscription',
        description: isFrench
          ? 'Le niveau premium pour une image elite, une diffusion forte et un traitement prioritaire.'
          : 'Premium distribution, elite image and maximum priority.',
        highlightTitle: isFrench ? 'PRESENCE ELITE' : 'ELITE PRESENCE',
        highlightText: isFrench
          ? 'La diffusion monte en gamme et le profil prend une vraie stature VIP dans l ecosysteme.'
          : 'Your profile gets a premium VIP presence across the ecosystem.',
        features: isFrench
          ? ['Diffusion premium du profil', 'Traitement ultra prioritaire', 'Accompagnement VIP et image elite']
          : ['Premium profile distribution', 'Ultra-priority handling', 'VIP support and elite image'],
        buttonHref: buildCheckoutHref(locale, 'platinum'),
        buttonLabel: isFrench ? 'Activer Platinum' : 'Activate Platinum',
      },
    ],
    [isFrench, locale, studioHref],
  );

  const guideSteps = useMemo(
    () => [
      {
        step: '01',
        title: isFrench ? 'Construire le profil' : 'Build the profile',
        text: isFrench
          ? 'Renseigne ton identite, ta profession, ta photo et ta ville pour poser une base credible.'
          : 'Fill in identity, profession, photo and location to build a credible base.',
        href: studioHref,
      },
      {
        step: '02',
        title: isFrench ? 'Regler la confidentialite' : 'Adjust privacy',
        text: isFrench
          ? 'Choisis ce qui reste public, reserve aux connexions ou prive selon chaque champ.'
          : 'Choose what stays public, connections-only or private for each field.',
        href: privacyHref,
      },
      {
        step: '03',
        title: isFrench ? 'Activer la diffusion' : 'Activate reach',
        text: isFrench
          ? 'Complete le profil, publie proprement et choisis le bon abonnement.'
          : 'Complete the profile, publish cleanly and choose the right subscription.',
        href: subscriptionHref,
      },
    ],
    [isFrench, privacyHref, studioHref, subscriptionHref],
  );

  function renderRouteDetailSection() {
    if (pageKey === 'subscription') {
      return null;
    }

    if (pageKey === 'statistics') {
      return (
        <section className="contentSection routeDetailSection">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">{isFrench ? 'Lecture rapide' : 'Quick reading'}</span>
              <h2>{isFrench ? 'Des chiffres lisibles, sans quitter la page.' : 'Readable numbers without leaving the page.'}</h2>
            </div>
          </div>

          <div className="routeStatStrip">
            <article className="routeStatCard">
              <small>{isFrench ? 'Completion' : 'Completion'}</small>
              <strong>{completion}%</strong>
            </article>
            <article className="routeStatCard">
              <small>{isFrench ? 'Experiences' : 'Experiences'}</small>
              <strong>{experiencesCount}</strong>
            </article>
            <article className="routeStatCard">
              <small>{isFrench ? 'Interets' : 'Interests'}</small>
              <strong>{interestsCount}</strong>
            </article>
          </div>

          <div className="routeProgressTrack" aria-hidden="true">
            <span style={{ width: `${completion}%` }} />
          </div>
        </section>
      );
    }

    if (pageKey === 'settings') {
      return (
        <section className="contentSection routeDetailSection">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">{isFrench ? 'Reglages' : 'Settings'}</span>
              <h2>{isFrench ? 'Confidentialite et verification' : 'Privacy and verification'}</h2>
            </div>
          </div>

          <div className="routeDetailGrid twoCols">
            <Link href={privacyHref} className="routeDetailPanelLink blue">
              <small>{isFrench ? 'Confidentialite' : 'Privacy'}</small>
              <strong>{isFrench ? 'Proteger les donnees' : 'Protect data'}</strong>
              <p>{isFrench ? 'Telephone, email, CV, photo et banniere se reglent ici.' : 'Phone, email, resume, photo and banner are controlled here.'}</p>
            </Link>
            <Link href={verificationHref} className="routeDetailPanelLink gold">
              <small>{isFrench ? 'Verification' : 'Verification'}</small>
              <strong>{verificationBadge || verificationLabel}</strong>
              <p>
                {isFrench
                  ? 'Le dossier KYC ou KYB, les documents et les notifications de revue restent dans une page separee.'
                  : 'The KYC or KYB file, documents and review notifications stay in a dedicated page.'}
              </p>
            </Link>
            <Link href={guideHref} className="routeDetailPanelLink mint">
              <small>{isFrench ? 'Guide utilisateur' : 'User guide'}</small>
              <strong>{isFrench ? 'Suivre le parcours' : 'Follow the flow'}</strong>
              <p>{isFrench ? 'Des etapes claires pour completer et publier.' : 'Clear steps to complete and publish.'}</p>
            </Link>
          </div>
        </section>
      );
    }

    if (pageKey === 'guide') {
      return (
        <section className="contentSection routeDetailSection">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">{isFrench ? 'Etapes' : 'Steps'}</span>
              <h2>{isFrench ? 'Actions prioritaires' : 'Priority actions'}</h2>
            </div>
          </div>

          <div className="routeTimeline">
            {guideSteps.map((item) => (
              <Link key={item.step} href={item.href} className="routeTimelineItem">
                <span className="routeStepBadge">{item.step}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    if (pageKey === 'help') {
      return (
        <section className="contentSection routeDetailSection">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">{isFrench ? 'Support' : 'Support'}</span>
              <h2>{isFrench ? 'Une vraie page d aide.' : 'A real help page.'}</h2>
            </div>
          </div>

          <div className="routeFaqStack">
            <article className="routeFaqCard">
              <strong>{isFrench ? 'Je veux regler mes donnees privees' : 'I want to adjust private data'}</strong>
              <p>{isFrench ? 'Passe par Parametres puis Confidentialite.' : 'Go through Settings then Privacy.'}</p>
            </article>
            <article className="routeFaqCard">
              <strong>{isFrench ? 'Je veux regler mon profil' : 'I want to adjust my profile'}</strong>
              <p>{isFrench ? 'Passe par la page Profil.' : 'Go through the Profile page.'}</p>
            </article>
          </div>
        </section>
      );
    }

    return null;
  }

  const isPending = !isLoaded || profileLoading;

  return (
    <main className={`memberRoutePage ${routeThemeClass}`}>
      <div className="pageGlow glowOne" />
      <div className="pageGlow glowTwo" />

      <div className="memberRouteShell">
        <section className="heroCard">
          <div className="heroCopy">
            <span className="eyebrow">{pageContent.eyebrow || (isFrench ? 'Espace membre' : 'Member space')}</span>
            <h1>{pageContent.title || (isFrench ? 'Chargement...' : 'Loading...')}</h1>
            <p>{pageContent.description || (isFrench ? 'Chargement de la page...' : 'Loading page...')}</p>

            <div className="heroActionRow">
              {pageContent.primaryAction ? (
                <Link href={pageContent.primaryAction.href} className="primaryButton">
                  {PrimaryActionIcon ? <PrimaryActionIcon className="buttonIcon" strokeWidth={2.1} /> : null}
                  {pageContent.primaryAction.label}
                </Link>
              ) : null}
              {pageContent.secondaryAction ? (
                <Link href={pageContent.secondaryAction.href} className="ghostButton">
                  {SecondaryActionIcon ? <SecondaryActionIcon className="buttonIcon" strokeWidth={2.1} /> : null}
                  {pageContent.secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="heroProfileCard">
            <div className="profileLockup">
              <span className="profileAvatar">
                {avatarSrc ? <img src={avatarSrc} alt={displayName} /> : <span>{initials}</span>}
              </span>

              <div className="profileCopy">
                <strong>{displayName}</strong>
                <p>{currentRole}</p>
                <small>{currentLocation}</small>
              </div>
            </div>

            <div className="metricGrid">
              {heroMetrics.map((metric) => (
                <article key={metric.label} className="metricCard">
                  <small>{metric.label}</small>
                  <strong>{isPending ? '...' : metric.value}</strong>
                  <span>{metric.help}</span>
                </article>
              ))}
            </div>

            <div className="quickLinkRow">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link key={item.label} href={item.href} className="quickLink">
                    <Icon className="quickLinkIcon" strokeWidth={2.1} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>

        {pageKey === 'subscription' ? (
          <section className="contentSection">
            <div className="sectionHead">
              <div>
                <span className="eyebrow">{isFrench ? 'Formules' : 'Plans'}</span>
                <h2>{isFrench ? 'Gratuit, Silver, Gold et Platinum' : 'Free, Silver, Gold and Platinum'}</h2>
                <p>
                  {isFrench
                    ? 'Chaque niveau de presence reste lisible et separe dans une vraie page abonnement.'
                    : 'Each presence tier stays readable and separated inside a real subscription page.'}
                </p>
              </div>
            </div>

            <div className="planGrid">
              {subscriptionPlans.map((plan) => (
                <article key={plan.id} className={`planCard ${plan.tone}`}>
                  <div className="planTop">
                    <span className={`planIconShell ${plan.tone}`}>
                      <plan.icon className="planIcon" strokeWidth={2.1} />
                    </span>
                    <div className="planTitleBlock">
                      <span className="planEyebrow">{plan.eyebrow}</span>
                      <h3>{plan.title}</h3>
                    </div>
                    <span className={`planDetailPill ${plan.tone}`}>{plan.detailPill}</span>
                  </div>
                  <p className="planSummary">{plan.description}</p>
                  <div className="planPricing">
                    <span className="planPrice">{plan.price}</span>
                    <span className="planPriceLabel">{plan.priceLabel}</span>
                  </div>
                  <div className={`planHighlight ${plan.tone}`}>
                    <span className="planHighlightEyebrow">{plan.highlightTitle}</span>
                    <p>{plan.highlightText}</p>
                  </div>
                  <ul className="planFeatureList">
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span className={`planFeatureDot ${plan.tone}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.buttonHref} className={`planButton ${plan.tone}`}>
                    {plan.buttonLabel}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {renderRouteDetailSection()}

        {pageContent.cards.length ? (
          <section className="contentSection">
            <div className="sectionHead">
              <div>
                <span className="eyebrow">{isFrench ? 'Actions' : 'Actions'}</span>
                <h2>{isFrench ? 'Actions principales' : 'Main actions'}</h2>
                <p>
                  {isFrench
                    ? 'Les chemins utiles restent separes et lisibles.'
                    : 'Useful paths stay separated and readable.'}
                </p>
              </div>
            </div>

            <div className="contentGrid">
              {pageContent.cards.map((card, index) => renderCardLink(card, `${pageKey}-${index}`))}
            </div>
          </section>
        ) : null}

        <SiteFooter locale={locale} />
      </div>

      <style>{`
        .memberRoutePage {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(29, 78, 216, 0.16), transparent 28%),
            radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 24%),
            linear-gradient(180deg, #f8fbff 0%, #eef4fb 44%, #e6eef8 100%);
          color: var(--ink-950);
          font-family: Manrope, 'Segoe UI', ui-sans-serif, system-ui, sans-serif;
          --member-theme-ink: var(--ink-950);
          --member-theme-muted: var(--ink-600);
          --member-theme-soft: var(--ink-500);
          --member-surface-ink: #0f172a;
          --member-surface-muted: #475569;
          --member-surface-soft: #334155;
          --member-surface-brand: #1d4ed8;
        }

        .pageGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(96px);
          opacity: 0.7;
          pointer-events: none;
        }

        .glowOne {
          top: -110px;
          left: -90px;
          width: 340px;
          height: 340px;
          background: rgba(29, 78, 216, 0.18);
        }

        .glowTwo {
          right: -70px;
          top: 250px;
          width: 300px;
          height: 300px;
          background: rgba(14, 165, 233, 0.14);
        }

        .memberRouteShell {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 18px;
          padding: 18px 14px 24px;
        }

        .heroCard,
        .contentSection {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(18px);
        }

        .heroCard {
          display: grid;
          grid-template-columns: minmax(0, 1.16fr) minmax(320px, 0.84fr);
          gap: 18px;
          padding: 24px;
        }

        .heroCopy,
        .heroProfileCard,
        .profileCopy,
        .sectionHead,
        .contentSection,
        .metricGrid,
        .contentGrid,
        .planGrid {
          display: grid;
        }

        .heroCopy,
        .heroProfileCard,
        .sectionHead {
          gap: 14px;
        }

        .eyebrow,
        .memberRoutePage h1,
        .memberRoutePage h2,
        .memberRoutePage p {
          margin: 0;
        }

        .eyebrow {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 8px;
          color: var(--brand-700);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .memberRoutePage h1 {
          font-size: clamp(2.3rem, 4vw, 4.2rem);
          line-height: 0.96;
          letter-spacing: -0.05em;
        }

        .memberRoutePage h2 {
          font-size: clamp(1.5rem, 2.8vw, 2.4rem);
          line-height: 1.02;
          letter-spacing: -0.04em;
        }

        .heroCopy p,
        .sectionHead p,
        .profileCopy p,
        .profileCopy small,
        .metricCard span,
        .contentCard p,
        .planCard p {
          color: var(--member-theme-muted);
          line-height: 1.68;
        }

        .heroActionRow,
        .quickLinkRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .primaryButton,
        .ghostButton,
        .quickLink,
        .planButton {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          border-radius: 16px;
          font-weight: 800;
          text-decoration: none;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease;
        }

        .primaryButton {
          border: 0;
          color: #ffffff;
          background: linear-gradient(135deg, #0f172a, #1d4ed8 60%, #3b82f6);
          box-shadow: 0 18px 34px rgba(29, 78, 216, 0.2);
        }

        .ghostButton,
        .quickLink {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.9);
          color: var(--member-theme-ink);
        }

        .primaryButton:hover,
        .ghostButton:hover,
        .quickLink:hover,
        .contentCard:hover,
        .planButton:hover {
          transform: translateY(-2px);
        }

        .buttonIcon,
        .quickLinkIcon,
        .cardIcon,
        .ctaArrow {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
        }

        .feedbackBadge {
          width: fit-content;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(219, 234, 254, 0.92);
          color: var(--member-surface-brand);
          font-size: 0.82rem;
          font-weight: 800;
        }

        .heroProfileCard {
          padding: 20px;
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.94));
        }

        .profileLockup {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 14px;
          align-items: center;
        }

        .profileAvatar {
          width: 74px;
          height: 74px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 24px;
          background: linear-gradient(135deg, #0f172a, #1d4ed8 62%, #3b82f6);
          color: #ffffff;
          font-size: 1.38rem;
          font-weight: 900;
        }

        .profileAvatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profileCopy strong,
        .metricCard strong,
        .contentCard strong,
        .planCard strong {
          color: var(--member-theme-ink);
        }

        .profileCopy strong {
          font-size: 1.22rem;
          letter-spacing: -0.04em;
        }

        .metricGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .metricCard,
        .contentCard,
        .planCard {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
        }

        .metricCard {
          display: grid;
          gap: 6px;
          padding: 14px;
          border-radius: 20px;
        }

        .metricCard small {
          color: var(--member-theme-soft);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .metricCard strong {
          font-size: 1.38rem;
          letter-spacing: -0.04em;
        }

        .contentSection {
          gap: 18px;
          padding: 22px;
        }

        .contentGrid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .memberRoutePage.route-public-profile .heroCard {
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 26%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.92));
        }

        .memberRoutePage.route-publications .heroCard {
          background:
            radial-gradient(circle at top right, rgba(16, 185, 129, 0.16), transparent 26%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 250, 0.92));
        }

        .memberRoutePage.route-statistics .heroCard {
          background:
            radial-gradient(circle at top right, rgba(100, 116, 139, 0.16), transparent 26%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
        }

        .memberRoutePage.route-settings .heroCard {
          background:
            radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 26%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(236, 254, 255, 0.92));
        }

        .memberRoutePage.route-guide .heroCard {
          background:
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.18), transparent 26%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 245, 255, 0.92));
        }

        .memberRoutePage.route-help .heroCard {
          background:
            radial-gradient(circle at top right, rgba(245, 158, 11, 0.18), transparent 26%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 251, 235, 0.92));
        }

        .routeDetailSection {
          gap: 18px;
        }

        .routeDetailGrid,
        .routeStatStrip,
        .routeTimeline,
        .routeFaqStack {
          display: grid;
          gap: 16px;
        }

        .routeDetailGrid.twoCols {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .routeDetailGrid.threeCols,
        .routeStatStrip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .routeDetailPanel,
        .routeDetailPanelLink,
        .routeStatCard,
        .routeTimelineItem,
        .routeFaqCard {
          display: grid;
          gap: 10px;
          min-height: 100%;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
        }

        .routeDetailPanel.blue,
        .routeDetailPanelLink.blue {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(219, 234, 254, 0.44));
        }

        .routeDetailPanel.mint,
        .routeDetailPanelLink.mint {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(204, 251, 241, 0.42));
        }

        .routeDetailPanel.gold,
        .routeDetailPanelLink.gold {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(254, 240, 138, 0.36));
        }

        .routeDetailPanel.violet,
        .routeDetailPanelLink.violet {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(221, 214, 254, 0.42));
        }

        .routeDetailPanel small,
        .routeStatCard small,
        .routeStepBadge {
          color: var(--member-surface-muted);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .routeDetailPanel strong,
        .routeDetailPanelLink strong,
        .routeStatCard strong,
        .routeTimelineItem strong,
        .routeFaqCard strong {
          color: var(--member-surface-ink);
          font-size: 1.18rem;
          letter-spacing: -0.03em;
        }

        .routeDetailPanel p,
        .routeDetailPanelLink p,
        .routeTimelineItem p,
        .routeFaqCard p {
          margin: 0;
          color: var(--member-surface-muted);
          line-height: 1.7;
        }

        .routeDetailPanelLink,
        .routeTimelineItem {
          color: inherit;
          text-decoration: none;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .routeDetailPanelLink:hover,
        .routeTimelineItem:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
        }

        .routeDetailList {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .routeDetailList li {
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.66);
          color: var(--member-surface-ink);
          font-weight: 700;
        }

        .routeProgressTrack {
          position: relative;
          overflow: hidden;
          height: 12px;
          border-radius: 999px;
          background: rgba(226, 232, 240, 0.86);
        }

        .routeProgressTrack span {
          position: absolute;
          inset: 0 auto 0 0;
          border-radius: inherit;
          background: linear-gradient(90deg, #1d4ed8, #38bdf8);
        }

        .routeTimelineItem {
          grid-template-columns: auto minmax(0, 1fr);
          align-items: start;
          gap: 16px;
        }

        .routeStepBadge {
          width: 58px;
          min-height: 58px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(219, 234, 254, 0.92);
          color: var(--member-surface-brand);
        }

        .contentCard {
          display: grid;
          gap: 12px;
          min-height: 100%;
          padding: 18px;
          border-radius: 24px;
          color: var(--member-surface-ink);
          text-decoration: none;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .cardTone {
          width: fit-content;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .cardTone.blue {
          background: rgba(219, 234, 254, 0.92);
          color: var(--member-surface-brand);
        }

        .cardTone.mint {
          background: rgba(204, 251, 241, 0.92);
          color: #0f766e;
        }

        .cardTone.slate,
        .cardTone.light {
          background: rgba(241, 245, 249, 0.96);
          color: var(--member-surface-soft);
        }

        .cardTone.gold {
          background: linear-gradient(135deg, rgba(254, 240, 138, 0.98), rgba(251, 191, 36, 0.96));
          color: #8a5a00;
        }

        .cardTone.silver {
          background: linear-gradient(135deg, rgba(241, 245, 249, 0.98), rgba(203, 213, 225, 0.96));
          color: var(--member-surface-soft);
        }

        .cardTone.violet {
          background: linear-gradient(135deg, rgba(221, 214, 254, 0.98), rgba(168, 85, 247, 0.94));
          color: #5b21b6;
        }

        .contentCard.gold {
          background: linear-gradient(180deg, rgba(255, 251, 235, 0.99), rgba(253, 230, 138, 0.88));
        }

        .contentCard.violet {
          background: linear-gradient(180deg, rgba(250, 245, 255, 0.99), rgba(216, 180, 254, 0.9));
        }

        .contentCard.mint {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(204, 251, 241, 0.48));
        }

        .contentCard.blue {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(219, 234, 254, 0.5));
        }

        .cardInlineCta {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--member-surface-brand);
          font-weight: 800;
        }

        .planGrid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .planCard {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          display: grid;
          gap: 18px;
          min-height: 100%;
          padding: 24px;
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          box-shadow: 0 24px 44px rgba(15, 23, 42, 0.08);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .planCard::before,
        .planCard::after {
          content: '';
          position: absolute;
          pointer-events: none;
        }

        .planCard::before {
          top: -58px;
          right: -36px;
          width: 156px;
          height: 156px;
          border-radius: 999px;
          filter: blur(14px);
          opacity: 0.84;
        }

        .planCard::after {
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 28%);
          opacity: 0.64;
        }

        .planCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 34px 56px rgba(15, 23, 42, 0.14);
        }

        .planCard.light {
          border-color: rgba(203, 213, 225, 0.62);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(244, 246, 248, 0.97)),
            rgba(255, 255, 255, 0.94);
        }

        .planCard.light::before {
          background: radial-gradient(circle, rgba(203, 213, 225, 0.72), transparent 70%);
        }

        .planCard.silver {
          border-color: rgba(148, 163, 184, 0.34);
          background:
            linear-gradient(160deg, rgba(255, 255, 255, 0.99), rgba(241, 245, 249, 0.98) 42%, rgba(203, 213, 225, 0.92)),
            rgba(248, 250, 252, 0.96);
        }

        .planCard.silver::before {
          background: radial-gradient(circle, rgba(226, 232, 240, 0.9), transparent 68%);
        }

        .planCard.gold {
          border-color: rgba(245, 158, 11, 0.34);
          background:
            linear-gradient(160deg, rgba(255, 255, 255, 0.99), rgba(255, 247, 214, 0.98) 44%, rgba(251, 191, 36, 0.44)),
            rgba(255, 248, 227, 0.96);
        }

        .planCard.gold::before {
          background: radial-gradient(circle, rgba(250, 204, 21, 0.9), transparent 68%);
        }

        .planCard.violet {
          border-color: rgba(168, 85, 247, 0.34);
          background:
            linear-gradient(155deg, rgba(255, 255, 255, 0.99), rgba(248, 241, 255, 0.98) 36%, rgba(196, 181, 253, 0.54) 78%, rgba(168, 85, 247, 0.4)),
            rgba(250, 245, 255, 0.97);
        }

        .planCard.violet::before {
          background: radial-gradient(circle, rgba(196, 181, 253, 0.9), transparent 70%);
        }

        .planTop {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
        }

        .planIconShell {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.34);
        }

        .planIconShell.light {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(226, 232, 240, 0.98));
          color: var(--member-surface-muted);
        }

        .planIconShell.silver {
          background: linear-gradient(135deg, rgba(226, 232, 240, 1), rgba(148, 163, 184, 0.94));
          color: var(--member-surface-soft);
        }

        .planIconShell.gold {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.98), rgba(250, 204, 21, 0.96));
          color: #ffffff;
        }

        .planIconShell.violet {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.98), rgba(168, 85, 247, 0.96));
          color: #ffffff;
        }

        .planIcon {
          width: 20px;
          height: 20px;
        }

        .planTitleBlock {
          display: grid;
          gap: 4px;
        }

        .planEyebrow,
        .planHighlightEyebrow {
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .planEyebrow {
          color: var(--member-surface-brand);
        }

        .planTitleBlock h3 {
          margin: 0;
          color: var(--member-surface-ink);
          font-size: 1.9rem;
          line-height: 1.05;
          letter-spacing: -0.05em;
        }

        .planDetailPill {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .planDetailPill.light {
          background: rgba(255, 255, 255, 0.9);
          color: var(--member-surface-muted);
          border-color: rgba(148, 163, 184, 0.24);
        }

        .planDetailPill.silver {
          background: rgba(255, 255, 255, 0.66);
          color: var(--member-surface-soft);
          border-color: rgba(148, 163, 184, 0.24);
        }

        .planDetailPill.gold {
          background: rgba(255, 251, 235, 0.76);
          color: #b45309;
          border-color: rgba(245, 158, 11, 0.24);
        }

        .planDetailPill.violet {
          background: rgba(250, 245, 255, 0.76);
          color: #7c3aed;
          border-color: rgba(168, 85, 247, 0.24);
        }

        .planSummary {
          margin: 0;
          font-size: 1.02rem;
        }

        .planPricing {
          display: grid;
          gap: 4px;
        }

        .planPrice {
          font-size: clamp(2.35rem, 3.4vw, 3.15rem);
          font-weight: 900;
          line-height: 0.94;
          letter-spacing: -0.07em;
        }

        .planPriceLabel {
          color: var(--member-surface-muted);
          font-size: 1rem;
          font-weight: 800;
        }

        .planHighlight {
          display: grid;
          gap: 10px;
          padding: 18px 18px 16px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.56);
          background: rgba(255, 255, 255, 0.62);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.54);
        }

        .planHighlight.light {
          background: rgba(255, 255, 255, 0.76);
        }

        .planHighlight.silver {
          background: rgba(255, 255, 255, 0.66);
        }

        .planHighlight.gold {
          background: rgba(255, 251, 235, 0.76);
          border-color: rgba(245, 158, 11, 0.16);
        }

        .planHighlight.violet {
          background: rgba(250, 245, 255, 0.78);
          border-color: rgba(168, 85, 247, 0.14);
        }

        .planHighlight p {
          margin: 0;
        }

        .planCard.light .planPrice {
          color: var(--member-surface-ink);
        }

        .planCard.light .planHighlightEyebrow {
          color: var(--member-surface-muted);
        }

        .planCard.silver .planPrice {
          color: var(--member-surface-muted);
        }

        .planCard.gold .planPrice,
        .planCard.gold .planHighlightEyebrow {
          color: #a16207;
        }

        .planCard.violet .planPrice,
        .planCard.violet .planHighlightEyebrow {
          color: #7c3aed;
        }

        .planCard.silver .planHighlightEyebrow {
          color: var(--member-surface-muted);
        }

        .planFeatureList {
          display: grid;
          gap: 12px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .planFeatureList li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: var(--member-surface-ink);
          font-size: 1.02rem;
          font-weight: 700;
          line-height: 1.55;
        }

        .planFeatureDot {
          width: 10px;
          height: 10px;
          flex: 0 0 auto;
          margin-top: 0.42rem;
          border-radius: 999px;
          background: #cbd5e1;
          box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.32);
        }

        .planFeatureDot.silver {
          background: #94a3b8;
        }

        .planFeatureDot.gold {
          background: #f59e0b;
        }

        .planFeatureDot.violet {
          background: #8b5cf6;
        }

        .planButton {
          margin-top: auto;
          min-height: 56px;
          border-radius: 18px;
          font-size: 1.02rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
        }

        .planButton.light {
          color: var(--member-surface-ink);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(226, 232, 240, 0.96));
          border: 1px solid rgba(148, 163, 184, 0.24);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.52),
            0 18px 30px rgba(148, 163, 184, 0.12);
        }

        .planButton.silver {
          color: var(--member-surface-ink);
          background: linear-gradient(135deg, rgba(226, 232, 240, 0.98), rgba(148, 163, 184, 0.94));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 18px 32px rgba(100, 116, 139, 0.18);
        }

        .planButton.gold {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(180, 83, 9, 0.96), rgba(250, 204, 21, 0.98));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 22px 36px rgba(245, 158, 11, 0.28);
        }

        .planButton.violet {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.98), rgba(168, 85, 247, 0.94));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 22px 36px rgba(124, 58, 237, 0.26);
        }

        html[data-theme='dark'] .memberRoutePage .heroProfileCard strong,
        html[data-theme='dark'] .memberRoutePage .contentCard,
        html[data-theme='dark'] .memberRoutePage .contentCard strong,
        html[data-theme='dark'] .memberRoutePage .routeDetailPanel strong,
        html[data-theme='dark'] .memberRoutePage .routeDetailPanelLink strong,
        html[data-theme='dark'] .memberRoutePage .routeStatCard strong,
        html[data-theme='dark'] .memberRoutePage .routeTimelineItem strong,
        html[data-theme='dark'] .memberRoutePage .routeFaqCard strong,
        html[data-theme='dark'] .memberRoutePage .routeDetailList li,
        html[data-theme='dark'] .memberRoutePage .planTitleBlock h3,
        html[data-theme='dark'] .memberRoutePage .planFeatureList li,
        html[data-theme='dark'] .memberRoutePage .planButton.light,
        html[data-theme='dark'] .memberRoutePage .planButton.silver,
        html[data-theme='dark'] .memberRoutePage .planCard.light .planPrice,
        html[data-theme='dark'] .memberRoutePage .planCard.silver .planPrice {
          color: var(--member-surface-ink) !important;
        }

        html[data-theme='dark'] .memberRoutePage .heroProfileCard p,
        html[data-theme='dark'] .memberRoutePage .heroProfileCard small,
        html[data-theme='dark'] .memberRoutePage .contentCard p,
        html[data-theme='dark'] .memberRoutePage .routeDetailPanel p,
        html[data-theme='dark'] .memberRoutePage .routeDetailPanelLink p,
        html[data-theme='dark'] .memberRoutePage .routeTimelineItem p,
        html[data-theme='dark'] .memberRoutePage .routeFaqCard p,
        html[data-theme='dark'] .memberRoutePage .planCard p,
        html[data-theme='dark'] .memberRoutePage .routeDetailPanel small,
        html[data-theme='dark'] .memberRoutePage .routeStatCard small,
        html[data-theme='dark'] .memberRoutePage .planPriceLabel,
        html[data-theme='dark'] .memberRoutePage .planCard.light .planHighlightEyebrow,
        html[data-theme='dark'] .memberRoutePage .planCard.silver .planHighlightEyebrow,
        html[data-theme='dark'] .memberRoutePage .planDetailPill.light,
        html[data-theme='dark'] .memberRoutePage .planDetailPill.silver {
          color: var(--member-surface-muted) !important;
        }

        @media (max-width: 1180px) {
          .heroCard {
            grid-template-columns: 1fr;
          }

          .contentGrid,
          .planGrid,
          .routeDetailGrid.twoCols,
          .routeDetailGrid.threeCols,
          .routeStatStrip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 780px) {
          .memberRouteShell {
            padding: 14px 12px 22px;
          }

          .heroCard,
          .contentSection {
            padding: 20px;
            border-radius: 24px;
          }

          .metricGrid,
          .contentGrid,
          .planGrid,
          .routeDetailGrid.twoCols,
          .routeDetailGrid.threeCols,
          .routeStatStrip,
          .routeTimeline {
            grid-template-columns: 1fr;
          }

          .heroActionRow,
          .quickLinkRow {
            flex-direction: column;
            align-items: stretch;
          }

          .primaryButton,
          .ghostButton,
          .quickLink,
          .planButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
