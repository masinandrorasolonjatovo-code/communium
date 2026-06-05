'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Crown,
  Eye,
  FileText,
  Gem,
  Globe2,
  Lock,
  MessageSquareText,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  UsersRound,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import PublicImmersionSection from '@/components/home/PublicImmersionSection';
import { useTheme } from '@/components/ThemeProvider';
import type { Locale } from '@/i18n.config';

interface LandingMetric {
  label: string;
  value: string;
}

interface LandingAttachment {
  title: string;
  detail: string;
}

interface LandingPost {
  id: string;
  authorAvatar?: string | null;
  authorInitials: string;
  authorName: string;
  authorRole: string;
  time: string;
  text: string;
  chips: string[];
  reactions: string;
  comments: string;
  shares: string;
  attachment?: LandingAttachment;
  premium?: boolean;
}

interface LandingProfile {
  id: number | string;
  avatarUrl?: string | null;
  initials: string;
  name: string;
  headline: string;
  location: string;
  tags: string[];
  activity: string;
  visibility: string;
  href: string;
}

interface LandingPlan {
  id: string;
  accent: string;
  eyebrow: string;
  title: string;
  price: string;
  note: string;
  summary: string;
  features: string[];
  href: string;
  cta: string;
  recommended: boolean;
}

interface WorkflowStep {
  step: string;
  title: string;
  text: string;
}

interface HeroProfile {
  avatarUrl?: string | null;
  initials: string;
  name: string;
  headline: string;
  location: string;
  username: string;
  stats: LandingMetric[];
}

interface PublicLandingExperienceProps {
  locale: Locale;
  signUpHref: string;
  signInHref: string;
  discoverHref: string;
  featuresHref: string;
  privacyHref: string;
  heroProfile: HeroProfile;
  heroPost?: LandingPost | null;
  feedPosts: LandingPost[];
  previewProfiles: LandingProfile[];
  premiumPlans: LandingPlan[];
  workflowSteps: WorkflowStep[];
}

function Avatar({
  avatarUrl,
  initials,
  className,
}: {
  avatarUrl?: string | null;
  initials: string;
  className: string;
}) {
  return (
    <span className={`${className} ${avatarUrl ? 'avatarHasImage' : 'avatarHasFallback'}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" loading="lazy" />
      ) : (
        <span className="avatarFallbackShell" aria-hidden="true">
          <span className="avatarFallbackGlow" />
          <UserRound className="avatarFallbackIcon" strokeWidth={2.1} />
          <span className="avatarFallbackBadge">{initials}</span>
        </span>
      )}
    </span>
  );
}

function getPlanTone(accent: string) {
  if (accent === 'gold') {
    return 'gold';
  }

  if (accent === 'platinum') {
    return 'platinum';
  }

  if (accent === 'silver') {
    return 'silver';
  }

  return 'free';
}

function pickLocaleCopy(locale: Locale, fr: string, en: string, ar: string, es?: string) {
  if (locale === 'ar') {
    return ar;
  }

  if (locale === 'es' && es) {
    return es;
  }

  return locale === 'fr' ? fr : en;
}

function getLandingPlanPresentation(planId: string, locale: Locale) {
  switch (planId) {
    case 'free':
      return {
        icon: ShieldCheck,
        eyebrow: 'FREE',
        title: pickLocaleCopy(locale, 'Base essentielle', 'Essential foundation', 'Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©'),
        detailPill: pickLocaleCopy(locale, 'Essentiel', 'Essential', 'Ø£Ø³Ø§Ø³ÙŠ'),
        priceLabel: pickLocaleCopy(locale, 'Plan gratuit', 'Free plan', ''),
        summary: pickLocaleCopy(
          locale,
          'Une base propre pour ouvrir le profil, regler la confidentialite et lancer sa presence.',
          'A clean starting point to open the profile, set privacy and launch your presence.',
          'Ø¨Ø¯Ø§ÙŠØ© ÙˆØ§Ø¶Ø­Ø© Ù„ÙØªØ­ Ø§Ù„Ù…Ù„Ù ÙˆØ¶Ø¨Ø· Ø§Ù„Ø®ØµÙˆØµÙŠØ© ÙˆØ¥Ø·Ù„Ø§Ù‚ Ø­Ø¶ÙˆØ±Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ.',
        ),
        highlightTitle: pickLocaleCopy(locale, 'POINT DE DEPART', 'STARTING POINT', 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø§Ù†Ø·Ù„Ø§Ù‚'),
        highlightText: pickLocaleCopy(
          locale,
          'Le profil reste sobre mais deja professionnel pour commencer dans de bonnes conditions.',
          'A simple and professional base to start with clarity.',
          'Ù…Ù„Ù Ø¨Ø³ÙŠØ· Ù„ÙƒÙ†Ù‡ Ù…Ù‡Ù†ÙŠ Ù…Ù†Ø° Ø§Ù„Ø¨Ø¯Ø§ÙŠØ© Ù„ØªØ¨Ø¯Ø£ Ø¨Ø«Ù‚Ø©.',
        ),
        features:
          locale === 'ar'
            ? ['Ù…Ù„Ù Ù…Ù‡Ù†ÙŠ Ø£Ø³Ø§Ø³ÙŠ', 'Ø®ØµÙˆØµÙŠØ© Ù„ÙƒÙ„ Ø­Ù‚Ù„', 'Ø¯Ø®ÙˆÙ„ Ø¥Ù„Ù‰ Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø¹Ø¶Ùˆ']
            : locale === 'fr'
              ? ['Profil pro de base', 'Confidentialite par champ', 'Acces a l espace membre']
              : ['Core professional profile', 'Field-level privacy', 'Member space access'],
        cta: pickLocaleCopy(locale, 'Creer mon profil', 'Create my profile', 'Ø£Ù†Ø´Ø¦ Ù…Ù„ÙÙŠ'),
      };
    case 'silver':
      return {
        icon: Sparkles,
        eyebrow: pickLocaleCopy(locale, 'PACK SILVER', 'SILVER PACK', 'Ø¨Ø§Ù‚Ø© Silver'),
        title: pickLocaleCopy(locale, 'Essai Silver 1 mois', 'Silver 1-month trial', 'ØªØ¬Ø±Ø¨Ø© Silver Ù„Ù…Ø¯Ø© Ø´Ù‡Ø±'),
        detailPill: pickLocaleCopy(locale, '30 jours', '30 days', '30 ÙŠÙˆÙ…Ù‹Ø§'),
        priceLabel: pickLocaleCopy(locale, 'Offre Silver 30 jours', 'Silver 30-day offer', 'Ø¹Ø±Ø¶ Silver Ù„Ù…Ø¯Ø© 30 ÙŠÙˆÙ…Ù‹Ø§'),
        summary: pickLocaleCopy(
          locale,
          'Une mise en route plus dynamique pour entrer dans Communium avec une presence pro claire.',
          'A more guided start to enter Communium with a clear professional presence.',
          'Ø§Ù†Ø·Ù„Ø§Ù‚Ø© Ø£ÙƒØ«Ø± ØªÙˆØ¬ÙŠÙ‡Ù‹Ø§ Ù„Ù„Ø¯Ø®ÙˆÙ„ Ø¥Ù„Ù‰ Communium Ø¨Ø­Ø¶ÙˆØ± Ù…Ù‡Ù†ÙŠ ÙˆØ§Ø¶Ø­.',
        ),
        highlightTitle: pickLocaleCopy(locale, 'ENTREE GUIDEE', 'GUIDED ENTRY', 'Ø¯Ø®ÙˆÙ„ Ù…ÙˆØ¬Ù‘Ù‡'),
        highlightText: pickLocaleCopy(
          locale,
          'Le profil gagne en structure, en visibilite initiale et en lisibilite pendant tout le mois d essai.',
          'The profile gains structure, early visibility and better readability during the trial month.',
          'ÙŠÙƒØªØ³Ø¨ Ø§Ù„Ù…Ù„Ù Ø¨Ù†ÙŠØ© Ø£ÙˆØ¶Ø­ ÙˆØ¸Ù‡ÙˆØ±Ù‹Ø§ Ø£ÙˆÙ„ÙŠÙ‹Ø§ Ø£ÙØ¶Ù„ Ø·ÙˆØ§Ù„ ÙØªØ±Ø© Ø§Ù„ØªØ¬Ø±Ø¨Ø©.',
        ),
        features:
          locale === 'ar'
            ? ['ØªØ¬Ø±Ø¨Ø© Ù…Ø¬Ø§Ù†ÙŠØ© 30 ÙŠÙˆÙ…Ù‹Ø§', 'ØµÙØ­Ø© Ø¹Ø¶Ùˆ ÙˆØ´Ø¨ÙƒØ© Ø£Ø³Ø§Ø³ÙŠØ©', 'ØªÙØ¹ÙŠÙ„ Ø³Ø±ÙŠØ¹ Ù„Ù„Ù…Ù„Ù']
            : locale === 'fr'
              ? ['Essai gratuit 30 jours', 'Page membre et reseau essentiel', 'Activation rapide du profil']
              : ['Free 30-day trial', 'Member page and core network', 'Fast profile activation'],
        cta: pickLocaleCopy(locale, 'Choisir Silver', 'Choose Silver', 'Ø§Ø®ØªØ± Silver'),
      };
    case 'gold':
      return {
        icon: Crown,
        eyebrow: pickLocaleCopy(locale, 'PACK GOLD', 'GOLD PACK', 'Ø¨Ø§Ù‚Ø© Gold'),
        title: pickLocaleCopy(locale, 'Activation Pack Gold', 'Activate Gold Pack', 'ØªÙØ¹ÙŠÙ„ Ø¨Ø§Ù‚Ø© Gold'),
        detailPill: pickLocaleCopy(locale, 'Plus visible', 'More visible', 'Ø£Ø¹Ù„Ù‰ Ø¸Ù‡ÙˆØ±Ù‹Ø§'),
        priceLabel: pickLocaleCopy(locale, 'Abonnement Gold', 'Gold subscription', 'Ø§Ø´ØªØ±Ø§Ùƒ Gold'),
        summary: pickLocaleCopy(
          locale,
          'Plus de presence, plus de visibilite, plus d impact.',
          'More presence, more visibility and more impact.',
          'Ø­Ø¶ÙˆØ± Ø£ÙƒØ¨Ø± ÙˆØ¸Ù‡ÙˆØ± Ø£Ù‚ÙˆÙ‰ ÙˆØªØ£Ø«ÙŠØ± Ø£ÙˆØ¶Ø­.',
        ),
        highlightTitle: pickLocaleCopy(locale, 'VISIBILITE RENFORCEE', 'STRONGER VISIBILITY', 'Ø¸Ù‡ÙˆØ± Ù…Ø¹Ø²Ù‘Ø²'),
        highlightText: pickLocaleCopy(
          locale,
          'Le profil ressort davantage et gagne en exposition dans le reseau.',
          'The profile stands out more and gains stronger exposure in the network.',
          'ÙŠØ¨Ø±Ø² Ø§Ù„Ù…Ù„Ù Ø£ÙƒØ«Ø± ÙˆÙŠÙƒØ³Ø¨ Ø­Ø¶ÙˆØ±Ù‹Ø§ Ø£ÙØ¶Ù„ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©.',
        ),
        features:
          locale === 'ar'
            ? ['Ù…Ø´Ø§Ù‡Ø¯Ø§Øª Ø£ÙƒØ«Ø± Ù„Ù„Ù…Ù„Ù', 'Ø¥Ø¨Ø±Ø§Ø² Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©', 'Ø£ÙˆÙ„ÙˆÙŠØ© ÙÙŠ Ø§Ù„ÙØ±Øµ']
            : locale === 'fr'
              ? ['Plus de vues sur le profil', 'Mise en avant dans le reseau', 'Activation prioritaire des opportunites']
              : ['More profile views', 'Featured in the network', 'Priority access to opportunities'],
        cta: pickLocaleCopy(locale, 'Choisir Gold', 'Choose Gold', 'Ø§Ø®ØªØ± Gold'),
      };
    case 'platinum':
      return {
        icon: Gem,
        eyebrow: pickLocaleCopy(locale, 'PACK PLATINUM', 'PLATINUM PACK', 'Ø¨Ø§Ù‚Ø© Platinum'),
        title: pickLocaleCopy(locale, 'Activation Platinum', 'Activate Platinum', 'ØªÙØ¹ÙŠÙ„ Platinum'),
        detailPill: pickLocaleCopy(locale, 'Elite', 'Elite', 'Elite'),
        priceLabel: pickLocaleCopy(locale, 'Abonnement Platinum', 'Platinum subscription', 'Ø§Ø´ØªØ±Ø§Ùƒ Platinum'),
        summary: pickLocaleCopy(
          locale,
          'Le niveau premium pour une image elite, une diffusion forte et un traitement prioritaire.',
          'The premium level for an elite image, stronger distribution and priority handling.',
          'Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£Ø¹Ù„Ù‰ Ù„ØµÙˆØ±Ø© Ù†Ø®Ø¨ÙˆÙŠØ© ÙˆØ§Ù†ØªØ´Ø§Ø± Ø£Ù‚ÙˆÙ‰ ÙˆØ£ÙˆÙ„ÙˆÙŠØ© Ø£ÙƒØ¨Ø±.',
        ),
        highlightTitle: pickLocaleCopy(locale, 'PRESENCE ELITE', 'ELITE PRESENCE', 'Ø­Ø¶ÙˆØ± Ù†Ø®Ø¨Ø©'),
        highlightText: pickLocaleCopy(
          locale,
          'La diffusion monte en gamme et le profil prend une vraie stature VIP dans le reseau.',
          'Distribution rises in quality and the profile gains a true VIP presence in the network.',
          'ÙŠØ±ØªÙØ¹ Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø§Ù†ØªØ´Ø§Ø± ÙˆÙŠØ£Ø®Ø° Ø§Ù„Ù…Ù„Ù Ù…ÙƒØ§Ù†Ø© Ø£Ù‚ÙˆÙ‰ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©.',
        ),
        features:
          locale === 'ar'
            ? ['Ø§Ù†ØªØ´Ø§Ø± Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ… Ù„Ù„Ù…Ù„Ù', 'Ù…Ø¹Ø§Ù„Ø¬Ø© ÙØ§Ø¦Ù‚Ø© Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©', 'Ù…Ø±Ø§ÙÙ‚Ø© VIP ÙˆØµÙˆØ±Ø© Ù†Ø®Ø¨ÙˆÙŠØ©']
            : locale === 'fr'
              ? ['Diffusion premium du profil', 'Traitement ultra prioritaire', 'Accompagnement VIP et image elite']
              : ['Premium profile distribution', 'Ultra-priority handling', 'VIP support and elite image'],
        cta: pickLocaleCopy(locale, 'Choisir Platinum', 'Choose Platinum', 'Ø§Ø®ØªØ± Platinum'),
      };
    default:
      return {
        icon: ShieldCheck,
        eyebrow: '',
        title: '',
        detailPill: '',
        priceLabel: '',
        summary: '',
        highlightTitle: '',
        highlightText: '',
        features: [] as string[],
        cta: pickLocaleCopy(locale, 'Choisir ce plan', 'Choose this plan', 'Ø§Ø®ØªØ± Ù‡Ø°Ù‡ Ø§Ù„Ø®Ø·Ø©'),
      };
  }
}

export default function PublicLandingExperience({
  locale,
  signUpHref,
  signInHref,
  discoverHref,
  featuresHref,
  privacyHref,
  heroProfile,
  heroPost,
  feedPosts,
  previewProfiles,
  premiumPlans,
  workflowSteps,
}: PublicLandingExperienceProps) {
  const { theme } = useTheme();
  const isFrench = locale === 'fr';
  const isArabic = locale === 'ar';
  const t = (fr: string, en: string, ar: string, es?: string) => pickLocaleCopy(locale, fr, en, ar, es);

  const testimonials = isFrench
    ? [
        {
          quote:
            "Enfin un endroit ou notre profil raconte quelque chose de coherent. Les echanges sont plus simples des le premier message.",
          name: 'Leila H.',
          role: 'Directrice des operations',
          company: 'Studio Nord (services B2B)',
        },
        {
          quote:
            "Ce qui nous a convaincus, c'est le controle fin sur ce qui est public ou non. On evite les fuites sans se cacher du marche.",
          name: 'Marc D.',
          role: 'Associe',
          company: 'Atelier Continu (conseil)',
        },
        {
          quote:
            'La page publique est claire, lisible, et nos candidats comprennent tout de suite qui nous sommes.',
          name: 'Sanaa K.',
          role: 'Responsable talent',
          company: 'Helios Mobility',
        },
      ]
    : [
        {
          quote:
            'Finally a place where our profile tells a coherent story. Conversations get easier from the very first message.',
          name: 'Leila H.',
          role: 'Director of Operations',
          company: 'Nord Studio (B2B services)',
        },
        {
          quote:
            'What sold us was fine-grained control over what stays public. We stay market-facing without accidental oversharing.',
          name: 'Marc D.',
          role: 'Partner',
          company: 'Continuum Advisory',
        },
        {
          quote:
            'The public page is clear and readable-candidates immediately understand who we are.',
          name: 'Sanaa K.',
          role: 'Head of Talent',
          company: 'Helios Mobility',
        },
      ];

  const privacyRows = [
    {
      label: t('Email', 'Email', 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ'),
      state: t('Prive par defaut', 'Private by default', 'Ø®Ø§Øµ Ø§ÙØªØ±Ø§Ø¶ÙŠÙ‹Ø§'),
      tone: 'private',
    },
    {
      label: t('Telephone', 'Phone', 'Ø§Ù„Ù‡Ø§ØªÙ'),
      state: t('Prive par defaut', 'Private by default', 'Ø®Ø§Øµ Ø§ÙØªØ±Ø§Ø¶ÙŠÙ‹Ø§'),
      tone: 'private',
    },
    {
      label: t('CV', 'Resume', 'Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©'),
      state: t('Connexions uniquement', 'Connections only', 'Ù„Ù„Ø§ØªØµØ§Ù„Ø§Øª ÙÙ‚Ø·'),
      tone: 'connections',
    },
    {
      label: t('Profession', 'Profession', 'Ø§Ù„Ù…Ù‡Ù†Ø©'),
      state: t('Public', 'Public', 'Ø¹Ø§Ù…'),
      tone: 'public',
    },
  ];

  const premiumLabel = t('Premium', 'Premium', 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…');

  const feedInsightCards = [
    {
      title: isFrench ? 'Profil recemment consulte' : 'Profile recently viewed',
      text: isFrench
        ? 'Un signal discret quand des profils pertinents s interessent a vous.'
        : 'A discreet signal when relevant profiles show interest.',
    },
    {
      title: isFrench ? 'Publication active cette semaine' : 'Active publication this week',
      text: isFrench
        ? 'Montrez un travail recent, sans mettre en avant des metriques creuses.'
        : 'Show recent work-without hollow vanity metrics.',
    },
    {
      title: isFrench ? 'CV pret a partager' : 'Resume ready to share',
      text: isFrench
        ? 'Partage intentionnel : visible quand vous le decidez.'
        : 'Intentional sharing-visible only when you decide.',
    },
  ];

  const localizedFeedInsightCards = isArabic
    ? [
        {
          title: 'Ù…Ù„Ù ØªÙ…Øª Ø²ÙŠØ§Ø±ØªÙ‡ Ù…Ø¤Ø®Ø±Ù‹Ø§',
          text: 'Ø¥Ø´Ø§Ø±Ø© Ù‡Ø§Ø¯Ø¦Ø© Ø¹Ù†Ø¯Ù…Ø§ ÙŠÙ‡ØªÙ… Ø¨ÙƒÙ… Ù…Ù„Ù Ù…Ù‡Ù†ÙŠ Ù…Ù†Ø§Ø³Ø¨.',
        },
        {
          title: 'Ù…Ù†Ø´ÙˆØ± Ù†Ø´Ø· Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹',
          text: 'Ø§Ø¹Ø±Ø¶ Ø¹Ù…Ù„Ø§Ù‹ Ø­Ø¯ÙŠØ«Ù‹Ø§ Ù…Ù† Ø¯ÙˆÙ† ØªØ¶Ø®ÙŠÙ… Ø£Ø±Ù‚Ø§Ù… ÙØ§Ø±ØºØ©.',
        },
        {
          title: 'Ø³ÙŠØ±Ø© Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ©',
          text: 'Ù…Ø´Ø§Ø±ÙƒØ© Ù…Ù‚ØµÙˆØ¯Ø© ØªØ¸Ù‡Ø± ÙÙ‚Ø· Ø¹Ù†Ø¯Ù…Ø§ ØªØ®ØªØ§Ø± Ø°Ù„Ùƒ.',
        },
      ]
    : feedInsightCards;

  const localizedTestimonials = isArabic
    ? [
        {
          quote: 'Ø£Ø®ÙŠØ±Ù‹Ø§ Ù…Ø³Ø§Ø­Ø© ÙŠØ¬Ø¹Ù„ ÙÙŠÙ‡Ø§ Ø§Ù„Ù…Ù„Ù Ø§Ù„Ù…Ù‡Ù†ÙŠ Ø§Ù„Ù‚ØµØ© ÙˆØ§Ø¶Ø­Ø© ÙˆÙ…Ù‚Ù†Ø¹Ø©. ØªØµØ¨Ø­ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø§Øª Ø£Ø³Ù‡Ù„ Ù…Ù† Ø£ÙˆÙ„ Ø±Ø³Ø§Ù„Ø©.',
          name: 'Ù„ÙŠÙ„Ù‰ Ø­.',
          role: 'Ù…Ø¯ÙŠØ±Ø© Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª',
          company: 'Nord Studio',
        },
        {
          quote: 'Ù…Ø§ Ø£Ù‚Ù†Ø¹Ù†Ø§ Ù‡Ùˆ Ø§Ù„ØªØ­ÙƒÙ… Ø§Ù„Ø¯Ù‚ÙŠÙ‚ ÙÙŠÙ…Ø§ ÙŠØ¨Ù‚Ù‰ Ø¹Ø§Ù…Ù‹Ø§. Ù†Ø¨Ù‚Ù‰ Ø¸Ø§Ù‡Ø±ÙŠÙ† Ù„Ù„Ø³ÙˆÙ‚ Ù…Ù† Ø¯ÙˆÙ† ÙƒØ´Ù ØºÙŠØ± Ù…Ù‚ØµÙˆØ¯.',
          name: 'Ù…Ø§Ø±Ùƒ Ø¯.',
          role: 'Ø´Ø±ÙŠÙƒ',
          company: 'Continuum Advisory',
        },
        {
          quote: 'Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ø¶Ø­Ø© ÙˆÙ…Ù‚Ø±ÙˆØ¡Ø©ØŒ ÙˆØ§Ù„Ù…Ø±Ø´Ø­ÙˆÙ† ÙŠÙÙ‡Ù…ÙˆÙ† Ø¨Ø³Ø±Ø¹Ø© Ù…Ù† Ù†ÙƒÙˆÙ†.',
          name: 'Ø³Ù†Ø§Ø¡ Ùƒ.',
          role: 'Ù…Ø³Ø¤ÙˆÙ„Ø© Ø§Ù„Ù…ÙˆØ§Ù‡Ø¨',
          company: 'Helios Mobility',
        },
      ]
    : testimonials;

  return (
    <div className={theme === 'dark' ? 'publicSaasLanding' : 'publicSaasLanding publicSaasLandingLight'} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="landingBackdropGlow landingBackdropGlowLeft" aria-hidden="true" />
      <div className="landingBackdropGlow landingBackdropGlowRight" aria-hidden="true" />

      <section className="landingHeroSection" id="top">
        <div className="landingHeroCopy">
          <span className="landingKicker">
            {t(
              'Une plateforme pour votre image professionnelle',
              'A platform built around your professional image',
              'Ù…Ù†ØµØ© Ù…Ø¨Ù†ÙŠØ© Ø­ÙˆÙ„ ØµÙˆØ±ØªÙƒ Ø§Ù„Ù…Ù‡Ù†ÙŠØ©',
              'Una plataforma para tu imagen profesional',
            )}
          </span>
          <h1>
            {t(
              'Construisez une presence credible, visible et maitrisee.',
              'Build a credible, visible and controlled professional presence.',
              'Ø§Ø¨Ù†Ù Ø­Ø¶ÙˆØ±Ù‹Ø§ Ù…Ù‡Ù†ÙŠÙ‹Ø§ Ù…ÙˆØ«ÙˆÙ‚Ù‹Ø§ ÙˆÙˆØ§Ø¶Ø­Ù‹Ø§ ÙˆØªØ­Øª Ø³ÙŠØ·Ø±ØªÙƒ.',
              'Construye una presencia profesional creible, visible y controlada.',
            )}
          </h1>
          <p className="landingHeroLead">
            {t(
              'Centralisez votre profil, vos publications et votre visibilite. Une experience sobre, claire et digne d un produit serieux.',
              'Bring your profile, publishing and visibility together in one calm surface-clear enough to feel like a serious product.',
              'Ø§Ø¬Ù…Ø¹ Ù…Ù„ÙÙƒ ÙˆÙ…Ù†Ø´ÙˆØ±Ø§ØªÙƒ ÙˆØ¸Ù‡ÙˆØ±Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ ÙÙŠ Ù…Ø³Ø§Ø­Ø© ÙˆØ§Ø­Ø¯Ø© Ù‡Ø§Ø¯Ø¦Ø© ÙˆÙˆØ§Ø¶Ø­Ø© ÙˆØªÙ„ÙŠÙ‚ Ø¨Ù…Ù†ØªØ¬ Ø¬Ø§Ø¯.',
              'Reune tu perfil, tus publicaciones y tu visibilidad en una experiencia clara, sobria y profesional.',
            )}
          </p>

          <div className="landingActionRow landingHeroActionRow">
            <Link href={signUpHref} className="landingPrimaryButton">
              {t('Creer mon profil', 'Create my profile', 'Ø£Ù†Ø´Ø¦ Ù…Ù„ÙÙŠ', 'Crear mi perfil')}
            </Link>
            <Link href={discoverHref} className="landingGhostButton">
              {t('Explorer les profils', 'Explore profiles', 'Ø§Ø³ØªÙƒØ´Ù Ø§Ù„Ù…Ù„ÙØ§Øª', 'Explorar perfiles')}
            </Link>
            <Link href={featuresHref} className="landingSubtleCta">
              {t('Voir comment ca fonctionne', 'See how it works', 'Ø´Ø§Ù‡Ø¯ ÙƒÙŠÙ ØªØ¹Ù…Ù„ Ø§Ù„Ù…Ù†ØµØ©', 'Ver como funciona')}
              <ArrowRight className="miniIcon" strokeWidth={2.1} />
            </Link>
          </div>
        </div>

        <div className="landingHeroStage">
          <div className="heroStageGrid" aria-hidden="true" />

          <article className="heroStagePrimaryCard">
            <div className="heroStageTopbar">
              <span className="topbarDot red" />
              <span className="topbarDot amber" />
              <span className="topbarDot blue" />
              <small>communium.app/presence</small>
            </div>

            <div className="heroProfileShell">
              <div className="heroProfileHead">
                <Avatar avatarUrl={heroProfile.avatarUrl} initials={heroProfile.initials} className="heroAvatarLarge" />
                <div className="heroProfileMeta">
                  <div className="heroProfileNameRow">
                    <strong>{heroProfile.name}</strong>
                    <span className="heroPremiumTag">
                      <Crown className="miniIcon" strokeWidth={2.1} />
                      {premiumLabel}
                    </span>
                  </div>
                  <p className="heroProfileRole">{heroProfile.headline}</p>
                  <small className="heroProfileLocation">{heroProfile.location}</small>
                </div>
              </div>

              <div className="heroMetricGrid">
                {heroProfile.stats.map((item) => (
                  <article key={item.label} className="heroMetricCard">
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>

              <div className="heroProfileTrack">
                <div className="heroTrackLine" />
                <div className="heroTrackGlow" />
                <div className="heroTrackDots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="heroProfileFooter">
                <span className="heroProfileUrl">communium.com/u/{heroProfile.username}</span>
              </div>
            </div>
          </article>

          {heroPost ? (
            <article className="heroStageFeedCard">
              <div className="heroFeedHeader">
                <div className="heroFeedAuthor">
                  <Avatar avatarUrl={heroPost.authorAvatar} initials={heroPost.authorInitials} className="heroAvatarSmall" />
                  <div>
                    <strong>{heroPost.authorName}</strong>
                    <small>{heroPost.authorRole}</small>
                  </div>
                </div>
                <span className="heroFeedTime">{heroPost.time}</span>
              </div>

              <p className="heroFeedBody">{heroPost.text}</p>

              {heroPost.attachment ? (
                <div className="heroAttachmentCard">
                  <strong>{heroPost.attachment.title}</strong>
                  <small>{heroPost.attachment.detail}</small>
                </div>
              ) : null}

              <div className="heroFeedChips">
                {heroPost.chips.slice(0, 4).map((chip) => (
                  <span key={`${heroPost.id}-${chip}`}>{chip}</span>
                ))}
              </div>

              <div className="heroFeedMeta">
                <span>{heroPost.reactions}</span>
                <span>{heroPost.comments}</span>
                <span>{heroPost.shares}</span>
              </div>
            </article>
          ) : null}

          <article className="heroStageFloatingCard heroStageNotifications">
            <div className="floatingCardHead">
              <Bell className="miniIcon" strokeWidth={2.1} />
              <span>{t('Activite recente', 'Recent activity', 'Ù†Ø´Ø§Ø· Ø­Ø¯ÙŠØ«')}</span>
            </div>
            <strong>{t('Mise a jour du profil', 'Profile update', 'ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù„Ù')}</strong>
            <small>
              {t(
                'Visibilite et messages restent alignes avec ce que vous montrez.',
                'Visibility and messages stay aligned with what you choose to show.',
                'ÙŠØ¨Ù‚Ù‰ Ø§Ù„Ø¸Ù‡ÙˆØ± ÙˆØ§Ù„Ø±Ø³Ø§Ø¦Ù„ Ù…Ù†Ø³Ø¬Ù…ÙŠÙ† Ù…Ø¹ Ù…Ø§ ØªØ®ØªØ§Ø± Ø¥Ø¸Ù‡Ø§Ø±Ù‡.',
              )}
            </small>
          </article>

          <article className="heroStageFloatingCard heroStageMessage">
            <div className="floatingCardHead">
              <MessageSquareText className="miniIcon" strokeWidth={2.1} />
              <span>{t('Discussion professionnelle', 'Professional conversation', 'Ù…Ø­Ø§Ø¯Ø«Ø© Ù…Ù‡Ù†ÙŠØ©')}</span>
            </div>
            <strong>
              {t(
                'Des echanges qui partent d une presence claire, pas d un fil bruyant.',
                'Conversations that start from a clear presence-not a noisy feed.',
                'Ù…Ø­Ø§Ø¯Ø«Ø§Øª ØªØ¨Ø¯Ø£ Ù…Ù† Ø­Ø¶ÙˆØ± ÙˆØ§Ø¶Ø­ Ù„Ø§ Ù…Ù† Ù…ÙˆØ¬Ø² Ù…Ù„ÙŠØ¡ Ø¨Ø§Ù„Ø¶Ø¬ÙŠØ¬.',
              )}
            </strong>
          </article>
        </div>
      </section>

      <section className="landingHowSection" aria-labelledby="how-heading">
        <div className="landingHowInner">
          <div className="landingSectionHead landingHowHead">
            <span className="landingSectionLabel">{t('Comment ca fonctionne', 'How it works', 'ÙƒÙŠÙ ØªØ¹Ù…Ù„ Ø§Ù„Ù…Ù†ØµØ©')}</span>
            <h2 id="how-heading">
              {t('Trois etapes pour une presence professionnelle nette.', 'Three steps to a crisp professional presence.', 'Ø«Ù„Ø§Ø« Ø®Ø·ÙˆØ§Øª Ù„Ø­Ø¶ÙˆØ± Ù…Ù‡Ù†ÙŠ ÙˆØ§Ø¶Ø­.')}
            </h2>
            <p>
              {t(
                'Sans jargon : vous structurez, vous choisissez ce qui est public, puis vous renforcez votre visibilite au fil du temps.',
                'No jargon: you structure your story, choose what stays public, then strengthen visibility over time.',
                'Ù…Ù† Ø¯ÙˆÙ† ØªØ¹Ù‚ÙŠØ¯: ØªØ±ØªØ¨ Ù‚ØµØªÙƒ Ø§Ù„Ù…Ù‡Ù†ÙŠØ©ØŒ ØªØ®ØªØ§Ø± Ù…Ø§ ÙŠØ¸Ù‡Ø±ØŒ Ø«Ù… ØªØ¹Ø²Ø² Ø­Ø¶ÙˆØ±Ùƒ Ù…Ø¹ Ø§Ù„ÙˆÙ‚Øª.',
              )}
            </p>
          </div>
          <ol className="landingHowSteps">
            {workflowSteps.map((step, index) => (
              <li key={step.step} className="landingHowStep" style={{ animationDelay: `${index * 0.07}s` }}>
                <span className="landingHowStepBadge" aria-hidden>
                  {step.step}
                </span>
                <div className="landingHowStepBody">
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landingStorySection">
        <div className="landingStoryCopy">
          <span className="landingSectionLabel storySectionLabel">{t('Identite lisible', 'Readable identity', 'Ù‡ÙˆÙŠØ© ÙˆØ§Ø¶Ø­Ø©')}</span>
          <h2>{t('Une identite professionnelle claire inspire davantage confiance.', 'A clear professional identity inspires deeper trust.', 'Ù‡ÙˆÙŠØ© Ù…Ù‡Ù†ÙŠØ© ÙˆØ§Ø¶Ø­Ø© ØªØ¨Ù†ÙŠ Ø«Ù‚Ø© Ø£ÙƒØ¨Ø±.')}</h2>
          <p>
            {t(
              'Avant les connexions, il y a la perception. Communium vous aide a presenter une trajectoire lisible, credible et immediate, sans reduire votre valeur a un simple CV.',
              'Before connections comes perception. Communium helps you present a path that feels readable, credible and immediate, without reducing your value to a simple resume.',
              'Ù‚Ø¨Ù„ Ø§Ù„Ø§ØªØµØ§Ù„Ø§Øª ØªØ£ØªÙŠ Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰. ÙŠØ³Ø§Ø¹Ø¯Ùƒ Communium Ø¹Ù„Ù‰ ØªÙ‚Ø¯ÙŠÙ… Ù…Ø³Ø§Ø± ÙˆØ§Ø¶Ø­ ÙˆÙ…ÙˆØ«ÙˆÙ‚ ÙˆÙ…Ø¨Ø§Ø´Ø± Ù…Ù† Ø¯ÙˆÙ† Ø§Ø®ØªØ²Ø§Ù„ Ù‚ÙŠÙ…ØªÙƒ ÙÙŠ Ø³ÙŠØ±Ø© ÙÙ‚Ø·.',
            )}
          </p>

          <div className="storyBulletList">
            <article>
              <Globe2 className="miniIcon" strokeWidth={2.1} />
              <div>
                <p className="storyBulletSentence">
                  <strong>{t('Une vitrine qui inspire confiance :', 'A public surface that inspires trust:', 'ÙˆØ§Ø¬Ù‡Ø© Ø¹Ø§Ù…Ø© ØªØ¨Ù†ÙŠ Ø§Ù„Ø«Ù‚Ø©:')}</strong>
                  <span>{t('Claire, partageable et facile a retenir.', 'Clear, shareable and easy to remember.', 'ÙˆØ§Ø¶Ø­Ø© ÙˆÙ‚Ø§Ø¨Ù„Ø© Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ© ÙˆØ³Ù‡Ù„Ø© Ø§Ù„ØªØ°ÙƒØ±.')}</span>
                </p>
              </div>
            </article>
            <article>
              <Lock className="miniIcon" strokeWidth={2.1} />
              <div>
                <p className="storyBulletSentence">
                  <strong>{t('Des regles qui protegent l essentiel :', 'Rules that protect what matters:', 'Ù‚ÙˆØ§Ø¹Ø¯ ØªØ­Ù…ÙŠ Ù…Ø§ ÙŠÙ‡Ù…:')}</strong>
                  <span>{t('Chaque information garde le bon niveau de visibilite.', 'Each detail stays at the right level of visibility.', 'ÙƒÙ„ Ù…Ø¹Ù„ÙˆÙ…Ø© ØªØ¨Ù‚Ù‰ Ø¶Ù…Ù† Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø¸Ù‡ÙˆØ± Ø§Ù„Ù…Ù†Ø§Ø³Ø¨.')}</span>
                </p>
              </div>
            </article>
            <article>
              <Sparkles className="miniIcon" strokeWidth={2.1} />
              <div>
                <p className="storyBulletSentence">
                  <strong>{t('Une presence qui gagne en relief :', 'A presence that gains momentum:', 'Ø­Ø¶ÙˆØ± ÙŠØ²Ø¯Ø§Ø¯ Ù‚ÙˆØ©:')}</strong>
                  <span>{t('Des signes clairs qui renforcent votre presence.', 'Clear signals that strengthen your presence.', 'Ø¥Ø´Ø§Ø±Ø§Øª ÙˆØ§Ø¶Ø­Ø© ØªØ¹Ø²Ø² Ø­Ø¶ÙˆØ±Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ.')}</span>
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <PublicImmersionSection locale={locale} signUpHref={signUpHref} exploreHref={featuresHref} />

      <section className="landingFeedSection">
        <div className="landingSectionHead">
          <span className="landingSectionLabel">{t('Publications professionnelles', 'Professional publishing', 'Ù…Ù†Ø´ÙˆØ±Ø§Øª Ù…Ù‡Ù†ÙŠØ©')}</span>
          <h2>{t('Un flux sobre pour vos projets et vos annonces.', 'A calm feed for your projects and announcements.', 'Ù…ÙˆØ¬Ø² Ù‡Ø§Ø¯Ø¦ Ù„Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ ÙˆØ¥Ø¹Ù„Ø§Ù†Ø§ØªÙƒ.')}</h2>
          <p>
            {t(
              'Partagez ce qui compte vraiment : contexte, preuves et prochaines etapes. Pas de bruit type reseau social grand public.',
              'Share what actually matters-context, proof and next steps-without consumer-social noise.',
              'Ø´Ø§Ø±Ùƒ Ù…Ø§ ÙŠÙ‡Ù… ÙØ¹Ù„Ù‹Ø§: Ø§Ù„Ø³ÙŠØ§Ù‚ ÙˆØ§Ù„Ù†ØªØ§Ø¦Ø¬ ÙˆØ§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©ØŒ Ù…Ù† Ø¯ÙˆÙ† Ø¶Ø¬ÙŠØ¬ Ø§Ù„Ø´Ø¨ÙƒØ§Øª Ø§Ù„Ø¹Ø§Ù…Ø©.',
            )}
          </p>
        </div>

        <div className="feedExperienceGrid">
          <div className="feedMockupColumn">
            {feedPosts.slice(0, 3).map((post) => (
              <article key={post.id} className="feedMockupCard">
                <div className="feedMockupHead">
                  <div className="feedMockupAuthor">
                    <Avatar avatarUrl={post.authorAvatar} initials={post.authorInitials} className="heroAvatarSmall" />
                    <div>
                      <strong>{post.authorName}</strong>
                      <small>{post.authorRole}</small>
                    </div>
                  </div>
                  {post.premium ? (
                    <span className="miniPremiumPill">
                      <Star className="miniIcon" strokeWidth={2.1} />
                      {premiumLabel}
                    </span>
                  ) : (
                    <span className="feedMockupTime">{post.time}</span>
                  )}
                </div>

                <p className="feedMockupBody">{post.text}</p>

                {post.attachment ? (
                  <div className="feedAttachmentRow">
                    <FileText className="miniIcon" strokeWidth={2.1} />
                    <div className="feedAttachmentCopy">
                      <strong>{post.attachment.title}</strong>
                      <small>{post.attachment.detail}</small>
                    </div>
                  </div>
                ) : null}

                <div className="feedMockupChips">
                  {post.chips.slice(0, 4).map((chip) => (
                    <span key={`${post.id}-chip-${chip}`}>{chip}</span>
                  ))}
                </div>

                <div className="feedMockupFooter feedMockupSignals" role="list" aria-label={t('Signaux professionnels', 'Professional signals', 'Ø¥Ø´Ø§Ø±Ø§Øª Ù…Ù‡Ù†ÙŠØ©')}>
                  <span role="listitem">{post.reactions}</span>
                  <span role="listitem">{post.comments}</span>
                  <span role="listitem">{post.shares}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="feedSideColumn">
            <article className="feedSidePanel tractionPanel">
              <div className="feedPanelHead">
                <span>{t('Signaux professionnels', 'Professional signals', 'Ø¥Ø´Ø§Ø±Ø§Øª Ù…Ù‡Ù†ÙŠØ©')}</span>
                <BarChart3 className="miniIcon" strokeWidth={2.1} />
              </div>
              <div className="feedInsightGrid">
                {localizedFeedInsightCards.map((card) => (
                  <article key={card.title} className="feedInsightCard">
                    <strong>{card.title}</strong>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="feedSidePanel peoplePanel">
              <div className="feedPanelHead">
                <span>{t('Profils en mouvement', 'Profiles in motion', 'Ù…Ù„ÙØ§Øª ÙÙŠ Ø­Ø±ÙƒØ©')}</span>
                <UsersRound className="miniIcon" strokeWidth={2.1} />
              </div>

              <div className="peoplePanelList">
                {previewProfiles.slice(0, 3).map((profile) => (
                  <Link key={profile.id} href={profile.href} className="peoplePanelRow">
                    <Avatar avatarUrl={profile.avatarUrl} initials={profile.initials} className="heroAvatarSmall" />
                    <div className="peoplePanelCopy">
                      <strong>{profile.name}</strong>
                      <small>{profile.headline}</small>
                      <span>{profile.activity}</span>
                    </div>
                    <ArrowRight className="miniIcon" strokeWidth={2.1} />
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landingPremiumSection">
        <div className="landingSectionHead">
          <span className="landingSectionLabel">{t('Offres', 'Plans', 'Ø§Ù„Ø¨Ø§Ù‚Ø§Øª')}</span>
          <h2>{t('Renforcez votre presence lorsque vous etes pret.', 'Strengthen your presence when you are ready.', 'Ø¹Ø²Ù‘Ø² Ø­Ø¶ÙˆØ±Ùƒ Ø¹Ù†Ø¯Ù…Ø§ ØªÙƒÙˆÙ† Ø¬Ø§Ù‡Ø²Ù‹Ø§.')}</h2>
          <p>
            {t(
              'Des niveaux clairs pour aller plus loin, sans sensation de tableau comparatif froid.',
              'Clear tiers to go further-without a cold spreadsheet vibe.',
              'Ù…Ø³ØªÙˆÙŠØ§Øª ÙˆØ§Ø¶Ø­Ø© Ù„Ù„ØªÙ‚Ø¯Ù… Ù…Ù† Ø¯ÙˆÙ† Ø¥Ø­Ø³Ø§Ø³ Ø¨Ø¬Ø¯ÙˆÙ„ Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø§Ø±Ø¯.',
            )}
          </p>
        </div>

        <div className="landingPremiumGrid">
          {premiumPlans.map((plan) => {
            const tone = getPlanTone(plan.accent);
            const presentation = getLandingPlanPresentation(plan.id, locale);
            const PlanIcon = presentation.icon;

            return (
              <article key={plan.id} className={`landingPlanCard ${tone}${plan.recommended ? ' recommended' : ''}`}>
                <div className="landingPlanTop">
                  <div className={`landingPlanIconShell ${tone}`}>
                    <PlanIcon className="miniIcon" strokeWidth={2.1} />
                  </div>
                  <div className="landingPlanTitleBlock">
                    <small className="landingPlanEyebrow">{presentation.eyebrow || plan.eyebrow}</small>
                    <strong className="landingPlanTitle">{presentation.title || plan.title}</strong>
                  </div>
                  <span className={`landingPlanDetailPill ${tone}`}>{presentation.detailPill}</span>
                </div>

                <p className="landingPlanSummary">{presentation.summary || plan.summary}</p>

                <div className="landingPlanPrice">
                  <span>{plan.price}</span>
                  <small className="landingPlanPriceLabel">{presentation.priceLabel || plan.note}</small>
                </div>

                <div className={`landingPlanHighlight ${tone}`}>
                  <strong className="landingPlanHighlightEyebrow">{presentation.highlightTitle}</strong>
                  <p>{presentation.highlightText}</p>
                </div>

                <ul className="landingPlanList">
                  {(presentation.features.length ? presentation.features : plan.features.slice(0, 3)).map((feature) => (
                    <li key={feature}>
                      <span className={`landingPlanFeatureDot ${tone}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className={`landingPlanButton ${tone} fullWidth`}>
                  {presentation.cta || plan.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landingSecuritySection">
        <div className="landingSecurityShell">
          <div className="landingSecurityCopy">
            <span className="landingSectionLabel">{t('Controle total', 'Total control', 'ØªØ­ÙƒÙ… ÙƒØ§Ù…Ù„')}</span>
            <h2>{t('Votre identite professionnelle, vos regles.', 'Your professional identity, your rules.', 'Ù‡ÙˆÙŠØªÙƒ Ø§Ù„Ù…Ù‡Ù†ÙŠØ©ØŒ Ù‚ÙˆØ§Ø¹Ø¯Ùƒ.')}</h2>
            <p>
              {t(
                'Rendez visible ce qui inspire confiance, gardez prive ce qui doit le rester, et pilotez chaque information importante avec precision.',
                'Make visible what builds trust, keep private what should stay protected, and control every important detail with precision.',
                'Ø£Ø¸Ù‡Ø± Ù…Ø§ ÙŠØ¨Ù†ÙŠ Ø§Ù„Ø«Ù‚Ø©ØŒ ÙˆØ£Ø¨Ù‚Ù Ù…Ø§ ÙŠØ¬Ø¨ Ø­Ù…Ø§ÙŠØªÙ‡ Ø®Ø§ØµÙ‹Ø§ØŒ ÙˆØªØ­ÙƒÙ… Ø¨ÙƒÙ„ Ù…Ø¹Ù„ÙˆÙ…Ø© Ù…Ù‡Ù…Ø© Ø¨Ø¯Ù‚Ø©.',
              )}
            </p>

            <div className="securityTrustList">
              <article>
                <ShieldCheck className="miniIcon" strokeWidth={2.1} />
                <div>
                  <strong>{t('Visibilite par champ', 'Field-level visibility', 'Ø¸Ù‡ÙˆØ± Ø­Ø³Ø¨ ÙƒÙ„ Ø­Ù‚Ù„')}</strong>
                  <small>{t('Public, connexions ou prive.', 'Public, connections or private.', 'Ø¹Ø§Ù… Ø£Ùˆ Ù„Ù„Ø§ØªØµØ§Ù„Ø§Øª Ø£Ùˆ Ø®Ø§Øµ.')}</small>
                </div>
              </article>
              <article>
                <Eye className="miniIcon" strokeWidth={2.1} />
                <div>
                  <strong>{t('URL publique controlee', 'Controlled public URL', 'Ø±Ø§Ø¨Ø· Ø¹Ø§Ù… Ù…Ø¶Ø¨ÙˆØ·')}</strong>
                  <small>{t('Une page lisible sans fuite de donnees.', 'A readable page without data leaks.', 'ØµÙØ­Ø© ÙˆØ§Ø¶Ø­Ø© Ù…Ù† Ø¯ÙˆÙ† ØªØ³Ø±Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª.')}</small>
                </div>
              </article>
              <article>
                <FileText className="miniIcon" strokeWidth={2.1} />
                <div>
                  <strong>{t('CV distribue avec intention', 'Resume shared intentionally', 'Ø³ÙŠØ±Ø© Ø°Ø§ØªÙŠØ© ØªÙØ´Ø§Ø±Ùƒ Ø¨Ù‚ØµØ¯')}</strong>
                  <small>{t('Seulement quand vous l autorisez.', 'Only when you allow it.', 'ÙÙ‚Ø· Ø¹Ù†Ø¯Ù…Ø§ ØªØ³Ù…Ø­ Ø£Ù†Øª Ø¨Ø°Ù„Ùƒ.')}</small>
                </div>
              </article>
            </div>
          </div>

          <div className="landingSecurityConsole">
            <div className="securityConsoleHead">
              <span>{t('Panneau de visibilite', 'Visibility panel', 'Ù„ÙˆØ­Ø© Ø§Ù„Ø¸Ù‡ÙˆØ±')}</span>
              <Lock className="miniIcon" strokeWidth={2.1} />
            </div>

            <div className="securityConsoleBody">
              {privacyRows.map((row) => (
                <div key={`console-${row.label}`} className="securityConsoleRow">
                  <div>
                    <strong>{row.label}</strong>
                    <small>{row.state}</small>
                  </div>
                  <span className={`consoleVisibility ${row.tone}`}>
                    {row.tone === 'public'
                      ? t('Public', 'Public', 'Ø¹Ø§Ù…')
                      : row.tone === 'connections'
                        ? t('Connexions', 'Connections', 'Ø§ØªØµØ§Ù„Ø§Øª')
                        : t('Prive', 'Private', 'Ø®Ø§Øµ')}
                  </span>
                </div>
              ))}
            </div>

            <div className="securityConsoleFooter">
              <span>{t('Les donnees sensibles ne sortent pas par defaut.', 'Sensitive information never leaves by default.', 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ù„Ø§ ØªØ®Ø±Ø¬ Ø§ÙØªØ±Ø§Ø¶ÙŠÙ‹Ø§.')}</span>
              <Link href={privacyHref} className="inlineTextLink">
                {t('Voir les regles', 'See the rules', 'Ø¹Ø±Ø¶ Ø§Ù„Ù‚ÙˆØ§Ø¹Ø¯')}
                <ArrowRight className="miniIcon" strokeWidth={2.1} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landingProfilesSection">
        <div className="landingSectionHead">
          <span className="landingSectionLabel">{t('Profils qui marquent', 'Profiles that stand out', 'Ù…Ù„ÙØ§Øª ØªØªØ±Ùƒ Ø£Ø«Ø±Ù‹Ø§')}</span>
          <h2>{t('Des profils concus pour etre clairs et memorables.', 'Profiles designed to feel clear and memorable.', 'Ù…Ù„ÙØ§Øª Ù…ØµÙ…Ù…Ø© Ù„ØªØ¨Ø¯Ùˆ ÙˆØ§Ø¶Ø­Ø© ÙˆÙ„Ø§ ØªÙÙ†Ø³Ù‰.')}</h2>
          <p>
            {t(
              'Chaque apercu montre une presence plus humaine, plus lisible et plus convaincante des les premiers instants.',
              'Each preview shows a more human, more readable and more convincing presence from the very first glance.',
              'ÙƒÙ„ Ù…Ø¹Ø§ÙŠÙ†Ø© ØªØ¹Ø±Ø¶ Ø­Ø¶ÙˆØ±Ù‹Ø§ Ø£ÙƒØ«Ø± Ø¥Ù†Ø³Ø§Ù†ÙŠØ© ÙˆÙˆØ¶ÙˆØ­Ù‹Ø§ ÙˆØ¥Ù‚Ù†Ø§Ø¹Ù‹Ø§ Ù…Ù† Ø§Ù„Ù„Ø­Ø¸Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰.',
            )}
          </p>
        </div>

        <div className="landingProfilesGrid">
          {previewProfiles.map((profile) => (
            <article key={profile.id} className="landingProfileCard">
              <div className="landingProfileTop">
                <Avatar avatarUrl={profile.avatarUrl} initials={profile.initials} className="heroAvatarMedium" />
                <div className="landingProfileIdentity">
                  <strong>{profile.name}</strong>
                  <p>{profile.headline}</p>
                  <small>{profile.location}</small>
                </div>
                <span className="landingProfileVisibility">{profile.visibility}</span>
              </div>

              <div className="landingProfileActivity">
                <span>{profile.activity}</span>
              </div>

              <div className="landingProfileTags">
                {profile.tags.slice(0, 3).map((tag) => (
                  <span key={`${profile.id}-${tag}`}>{tag}</span>
                ))}
              </div>

              <div className="landingProfileActions">
                <Link href={profile.href} className="landingGhostButton fullWidth">
                  {t('Voir apercu', 'View preview', 'Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø¹Ø§ÙŠÙ†Ø©')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landingTrustSection" aria-labelledby="trust-heading">
        <div className="landingTrustShell">
          <div className="landingSectionHead landingTrustHead">
            <span className="landingSectionLabel">{t('Confiance', 'Trust', 'Ø§Ù„Ø«Ù‚Ø©')}</span>
            <h2 id="trust-heading">
              {t('Des equipes qui cherchent la clarte avant le volume.', 'Teams that value clarity before volume.', 'ÙØ±Ù‚ ØªÙØ¶Ù„ Ø§Ù„ÙˆØ¶ÙˆØ­ Ø¹Ù„Ù‰ Ø§Ù„Ø¶Ø¬ÙŠØ¬.')}
            </h2>
            <p>
              {t(
                'Des retours mesures, alignes sur ce que les professionnels attendent d une plateforme moderne.',
                'Measured feedback aligned with what professionals expect from a modern platform.',
                'Ø¢Ø±Ø§Ø¡ Ù…ØªØ²Ù†Ø© ØªÙ†Ø³Ø¬Ù… Ù…Ø¹ Ù…Ø§ ÙŠÙ†ØªØ¸Ø±Ù‡ Ø§Ù„Ù…Ù‡Ù†ÙŠÙˆÙ† Ù…Ù† Ù…Ù†ØµØ© Ø­Ø¯ÙŠØ«Ø©.',
              )}
            </p>
          </div>
          <div className="landingTrustGrid">
            {localizedTestimonials.map((item) => (
              <figure key={item.name} className="landingTrustCard">
                <Quote className="landingTrustQuoteIcon" strokeWidth={1.6} aria-hidden />
                <blockquote cite={item.company}>{item.quote}</blockquote>
                <figcaption>
                  <span className="landingTrustName">{item.name}</span>
                  <span className="landingTrustMeta">
                    {item.role} · {item.company}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="landingFinalCta">
        <div className="landingFinalCtaCopy">
          <span className="landingSectionLabel">{t('Entrer dans le reseau', 'Enter the network', 'Ø§Ø¯Ø®Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ø´Ø¨ÙƒØ©')}</span>
          <h2>{t('Votre prochaine opportunite commence par votre presence.', 'Your next opportunity starts with your presence.', 'ÙØ±ØµØªÙƒ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø© ØªØ¨Ø¯Ø£ Ù…Ù† Ø­Ø¶ÙˆØ±Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ.')}</h2>
          <p>
            {t(
              'Communium vous aide a structurer votre identite, publier vos projets et developper une visibilite professionnelle qui donne envie de vous contacter.',
              'Communium helps you structure your identity, publish your work and build professional visibility that makes people want to reach out.',
              'ÙŠØ³Ø§Ø¹Ø¯Ùƒ Communium Ø¹Ù„Ù‰ ØªÙ†Ø¸ÙŠÙ… Ù‡ÙˆÙŠØªÙƒ ÙˆÙ†Ø´Ø± Ø£Ø¹Ù…Ø§Ù„Ùƒ ÙˆØ¨Ù†Ø§Ø¡ Ø¸Ù‡ÙˆØ± Ù…Ù‡Ù†ÙŠ ÙŠØ´Ø¬Ø¹ Ø§Ù„Ø¢Ø®Ø±ÙŠÙ† Ø¹Ù„Ù‰ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ.',
            )}
          </p>
        </div>

        <div className="landingActionRow">
          <Link href={signUpHref} className="landingPrimaryButton">
            {t('Commencer gratuitement', 'Start for free', 'Ø§Ø¨Ø¯Ø£ Ù…Ø¬Ø§Ù†Ù‹Ø§')}
          </Link>
          <Link href={signInHref} className="landingGhostButton">
            {t('Se connecter', 'Sign in', 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„')}
          </Link>
          <Link href={discoverHref} className="landingSubtleCta">
            {t('Decouvrir la plateforme', 'Discover the platform', 'Ø§Ø³ØªÙƒØ´Ù Ø§Ù„Ù…Ù†ØµØ©')}
            <ArrowRight className="miniIcon" strokeWidth={2.1} />
          </Link>
        </div>
      </section>

      <SiteFooter locale={locale} variant="public" />

      <style jsx>{`
        .publicSaasLanding {
          position: relative;
          z-index: 1;
          display: grid;
          gap: clamp(2.25rem, 5vw, 4rem);
          padding: 12px 0 32px;
          color: #e7eefb;
          --motion-slow: 0.55s;
          --motion-medium: 0.4s;
          --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
          --ease-soft: cubic-bezier(0.22, 1, 0.36, 1);
        }

        .landingHeroSection,
        .landingProofBar,
        .landingStorySection,
        .landingHowSection,
        .landingFeedSection,
        .landingPremiumSection,
        .landingSecuritySection,
        .landingProfilesSection,
        .landingTrustSection,
        .landingFinalCta {
          position: relative;
        }

        .landingHeroSection {
          overflow: hidden;
          isolation: isolate;
          border: 1px solid rgba(148, 163, 184, 0.11);
          border-radius: clamp(22px, 2.5vw, 32px);
          background:
            radial-gradient(circle at 18% 18%, rgba(59, 130, 246, 0.14), transparent 24%),
            radial-gradient(circle at 82% 10%, rgba(45, 212, 191, 0.08), transparent 18%),
            linear-gradient(180deg, rgba(5, 10, 22, 0.94), rgba(8, 15, 29, 0.9));
          box-shadow: 0 36px 100px rgba(2, 6, 23, 0.38);
          backdrop-filter: blur(26px);
          padding: clamp(1.75rem, 3vw, 2.25rem);
        }

        .landingHeroAura {
          position: absolute;
          pointer-events: none;
          border-radius: inherit;
          z-index: 0;
        }

        .landingHeroAuraPrimary {
          inset: -10%;
          background:
            radial-gradient(ellipse 58% 50% at 16% 24%, rgba(59, 130, 246, 0.2), transparent 58%),
            radial-gradient(ellipse 52% 46% at 90% 72%, rgba(45, 212, 191, 0.11), transparent 56%);
          opacity: 0.88;
          animation: landingHeroLuxDrift 22s ease-in-out infinite alternate;
        }

        .landingHeroAuraSecondary {
          inset: -6%;
          background: radial-gradient(ellipse 42% 40% at 72% 16%, rgba(96, 165, 250, 0.14), transparent 62%);
          opacity: 0.5;
          mix-blend-mode: screen;
          animation: landingHeroLuxDrift 32s ease-in-out infinite alternate-reverse;
        }

        .landingHeroRim {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          border-radius: inherit;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.09),
            inset 0 0 0 1px rgba(255, 255, 255, 0.03);
          animation: landingHeroRimGlow 16s ease-in-out infinite alternate;
        }

        .landingHeroCopy {
          position: relative;
          z-index: 2;
        }

        .landingProofBar {
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(8, 14, 26, 0.55), rgba(5, 9, 18, 0.4));
          box-shadow: 0 18px 48px rgba(2, 6, 23, 0.22);
          backdrop-filter: blur(16px);
        }

        .landingStorySection {
          overflow: visible;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          padding: clamp(2.75rem, 7vw, 5.5rem) clamp(0.5rem, 2vw, 1rem);
        }

        .landingStorySection::before {
          content: '';
          display: block;
          height: 1px;
          margin: 0 auto clamp(2rem, 4vw, 3rem);
          max-width: min(720px, 100%);
          background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.28), transparent);
        }

        .landingFeedSection {
          overflow: hidden;
          border: none;
          border-radius: clamp(24px, 3vw, 36px);
          background:
            radial-gradient(ellipse 90% 70% at 50% 0%, rgba(15, 23, 42, 0.72), transparent 55%),
            linear-gradient(180deg, rgba(2, 6, 14, 0.72) 0%, rgba(4, 8, 16, 0.38) 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
          padding: clamp(1.35rem, 3vw, 1.9rem) clamp(1.25rem, 3vw, 2rem) clamp(2rem, 4vw, 3rem);
        }

        .landingFeedSection > .landingSectionHead {
          display: none;
        }

        .landingFeedSection .feedExperienceGrid {
          margin-top: 0;
        }

        .landingPremiumSection {
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.07);
          border-radius: clamp(22px, 2.5vw, 30px);
          background: linear-gradient(168deg, rgba(7, 11, 22, 0.52) 0%, rgba(4, 7, 14, 0.22) 100%);
          box-shadow: 0 22px 56px rgba(2, 6, 23, 0.2);
          backdrop-filter: blur(14px);
          padding: clamp(2.25rem, 4.5vw, 3.5rem) clamp(1.25rem, 3vw, 2rem);
        }

        .landingSecuritySection {
          overflow: hidden;
          border-radius: clamp(24px, 3vw, 32px);
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: linear-gradient(185deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.96));
          box-shadow: 0 28px 72px rgba(15, 23, 42, 0.08);
        }

        .landingProfilesSection {
          overflow: visible;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          padding: clamp(2.5rem, 5vw, 4.75rem) clamp(0.75rem, 2vw, 1.25rem);
        }

        .landingProfilesSection::after {
          content: '';
          display: block;
          height: 1px;
          margin: clamp(2rem, 4vw, 3rem) auto 0;
          max-width: min(640px, 100%);
          background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.2), transparent);
        }

        .landingFinalCta {
          overflow: hidden;
          border: none;
          border-radius: clamp(20px, 2.5vw, 28px);
          background: linear-gradient(
            125deg,
            rgba(15, 23, 42, 0.5) 0%,
            rgba(30, 58, 138, 0.32) 42%,
            rgba(15, 23, 42, 0.48) 100%
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 28px 70px rgba(2, 6, 23, 0.28);
          padding: clamp(2rem, 4vw, 3rem) clamp(1.25rem, 3vw, 2rem);
        }

        .landingBackdropGlow {
          position: absolute;
          z-index: 0;
          border-radius: 999px;
          filter: blur(80px);
          opacity: 0.22;
          pointer-events: none;
        }

        .landingBackdropGlowLeft {
          animation: landingBackdropPulse 17s ease-in-out infinite;
          top: 120px;
          left: -40px;
          width: 320px;
          height: 320px;
          background: rgba(56, 189, 248, 0.32);
        }

        .landingBackdropGlowRight {
          animation: landingBackdropPulse 21s ease-in-out infinite reverse;
          animation-delay: 2.5s;
          top: 60px;
          right: -60px;
          width: 360px;
          height: 360px;
          background: rgba(59, 130, 246, 0.26);
        }

        .landingSecuritySection {
          padding: 0;
        }

        .landingProofBar {
          padding: 14px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .landingHeroSection {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);
          gap: 24px;
          align-items: center;
          min-height: 680px;
        }

        .landingHeroCopy,
        .landingStoryCopy,
        .landingSectionHead,
        .landingSecurityCopy,
        .landingFinalCtaCopy,
        .feedSideColumn,
        .feedMockupColumn,
        .landingProfilesGrid {
          display: grid;
          gap: 16px;
        }

        .landingKicker,
        .landingSectionLabel {
          width: fit-content;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.86), rgba(15, 23, 42, 0.72));
          border: 1px solid rgba(96, 165, 250, 0.18);
          color: #93c5fd;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .landingHeroCopy h1,
        .landingStoryCopy h2,
        .landingSectionHead h2,
        .landingSecurityCopy h2,
        .landingFinalCtaCopy h2 {
          margin: 0;
          color: #f8fbff;
          letter-spacing: -0.07em;
        }

        .landingHeroCopy h1 {
          max-width: min(20ch, 100%);
          font-size: clamp(2.85rem, 5.5vw, 5.35rem);
          line-height: 0.94;
          letter-spacing: -0.075em;
          text-shadow:
            0 0 100px rgba(56, 189, 248, 0.1),
            0 2px 40px rgba(2, 6, 23, 0.35);
          animation: landingHeroFadeRise 1.05s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
        }

        .landingStoryCopy h2,
        .landingSectionHead h2,
        .landingSecurityCopy h2,
        .landingFinalCtaCopy h2 {
          font-size: clamp(1.92rem, 3vw, 3rem);
          line-height: 0.98;
        }

        .landingStoryCopy h2 {
          max-width: 15ch;
        }

        .landingHeroCopy p,
        .landingHeroLead,
        .landingStoryCopy p,
        .landingSectionHead p,
        .landingSecurityCopy p,
        .landingFinalCtaCopy p,
        .proofItem small,
        .storyBulletList small,
        .storyBoardRows span,
        .feedInsightCard p,
        .securityTrustList small,
        .securityConsoleRow small,
        .landingProfileIdentity p,
        .landingProfileIdentity small {
          margin: 0;
          color: #a7b6cc;
          line-height: 1.68;
        }

        .storyBoardRows span {
          font-size: 0.84rem;
          color: #8fa4c3;
        }

        .storyBoardRows strong {
          color: #f8fbff;
          font-size: 1.06rem;
          font-weight: 760;
          line-height: 1.38;
          letter-spacing: -0.02em;
        }

        .landingHeroCopy p {
          max-width: 58ch;
          font-size: 1.04rem;
        }

        .landingHeroLead {
          max-width: 48ch;
          font-size: clamp(1.02rem, 0.9vw + 0.92rem, 1.16rem);
          color: rgba(198, 210, 228, 0.94);
          letter-spacing: -0.012em;
        }

        .landingHeroCopy .landingKicker {
          animation: landingHeroFadeRise 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.04s both;
        }

        .landingHeroCopy .landingHeroLead {
          animation: landingHeroFadeRise 1.05s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both;
        }

        .landingHeroCopy .landingActionRow {
          animation: landingHeroFadeRise 1.05s cubic-bezier(0.22, 1, 0.36, 1) 0.32s both;
        }

        .landingActionRow {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .publicSaasLanding[dir='rtl'] .landingHeroCopy,
        .publicSaasLanding[dir='rtl'] .landingSectionHead,
        .publicSaasLanding[dir='rtl'] .landingStoryCopy,
        .publicSaasLanding[dir='rtl'] .landingSecurityCopy,
        .publicSaasLanding[dir='rtl'] .landingFinalCtaCopy,
        .publicSaasLanding[dir='rtl'] .feedPanelHead,
        .publicSaasLanding[dir='rtl'] .feedInsightCard,
        .publicSaasLanding[dir='rtl'] .peoplePanelCopy,
        .publicSaasLanding[dir='rtl'] .landingTrustCard,
        .publicSaasLanding[dir='rtl'] .landingProfileIdentity,
        .publicSaasLanding[dir='rtl'] .landingProfileActivity {
          text-align: right;
        }

        .publicSaasLanding[dir='rtl'] .landingActionRow,
        .publicSaasLanding[dir='rtl'] .storyBulletList article,
        .publicSaasLanding[dir='rtl'] .securityTrustList article,
        .publicSaasLanding[dir='rtl'] .peoplePanelRow,
        .publicSaasLanding[dir='rtl'] .feedMockupHead,
        .publicSaasLanding[dir='rtl'] .heroProfileNameRow,
        .publicSaasLanding[dir='rtl'] .heroProfileHead {
          direction: rtl;
        }

        .publicSaasLanding[dir='rtl'] .landingSubtleCta .miniIcon,
        .publicSaasLanding[dir='rtl'] .inlineTextLink .miniIcon,
        .publicSaasLanding[dir='rtl'] .peoplePanelRow .miniIcon {
          transform: scaleX(-1);
        }

        .landingPrimaryButton,
        .landingGhostButton,
        .landingSubtleCta {
          position: relative;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          text-align: center;
          justify-content: center;
          gap: 10px;
          padding: 0 18px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.92rem;
          text-decoration: none;
          transition:
            transform var(--motion-medium) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft),
            background var(--motion-slow) var(--ease-soft),
            color var(--motion-medium) var(--ease-soft),
            filter var(--motion-medium) var(--ease-soft);
        }

        .landingPrimaryButton {
          overflow: hidden;
          color: #ffffff;
          background: linear-gradient(135deg, #1d4ed8, #2563eb 52%, #38bdf8);
          box-shadow:
            0 18px 38px rgba(37, 99, 235, 0.28),
            0 0 0 1px rgba(255, 255, 255, 0.06) inset;
        }

        .landingPrimaryButton::after {
          content: '';
          position: absolute;
          inset: -40% -60%;
          background: linear-gradient(
            115deg,
            transparent 35%,
            rgba(255, 255, 255, 0.22) 48%,
            rgba(255, 255, 255, 0.05) 55%,
            transparent 68%
          );
          transform: translateX(-120%) rotate(6deg);
          transition: transform 0.85s var(--ease-out-expo);
          pointer-events: none;
        }

        .landingPrimaryButton:hover::after {
          transform: translateX(120%) rotate(6deg);
        }

        .landingPrimaryButton:hover {
          transform: translateY(-2px);
          box-shadow:
            0 26px 52px rgba(37, 99, 235, 0.38),
            0 0 48px rgba(56, 189, 248, 0.18),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          filter: saturate(1.06);
        }

        .landingPrimaryButton:active {
          transform: translateY(0);
          transition-duration: 0.12s;
        }

        .landingGhostButton {
          color: #eff6ff;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.74), rgba(15, 23, 42, 0.5));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .landingGhostButton:hover {
          transform: translateY(-2px);
          border-color: rgba(147, 197, 253, 0.35);
          box-shadow:
            0 20px 44px rgba(2, 6, 23, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .landingSubtleCta {
          gap: 8px;
          padding-inline: 16px;
          border: 1px solid rgba(96, 165, 250, 0.2);
          background: linear-gradient(180deg, rgba(10, 18, 32, 0.82), rgba(9, 16, 29, 0.66));
          color: #cfe2ff;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 12px 30px rgba(2, 6, 23, 0.2);
        }

        .landingSubtleCta .miniIcon {
          transition:
            transform var(--motion-slow) var(--ease-out-expo),
            opacity var(--motion-medium) var(--ease-soft);
          opacity: 0.82;
        }

        .landingSubtleCta:hover .miniIcon {
          transform: translateX(4px);
          opacity: 1;
        }

        .landingSubtleCta:hover {
          color: #eff6ff;
          background: linear-gradient(180deg, rgba(14, 23, 40, 0.94), rgba(10, 18, 32, 0.84));
          border-color: rgba(125, 211, 252, 0.32);
          box-shadow:
            0 18px 40px rgba(2, 6, 23, 0.26),
            0 0 36px rgba(56, 189, 248, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
        }

        .landingHeroActionRow {
          row-gap: 14px;
        }

        .proofItem:hover,
        .storyBoard:hover,
        .feedMockupCard:hover,
        .feedSidePanel:hover,
        .landingPlanCard:hover,
        .landingProfileCard:hover {
          transform: translateY(-2px);
        }

        .landingSignalStrip {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .landingSignalStrip span {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(12, 20, 36, 0.86), rgba(10, 17, 30, 0.72));
          border: 1px solid rgba(148, 163, 184, 0.12);
          color: #dbeafe;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .landingHeroStage {
          position: relative;
          z-index: 2;
          min-height: 620px;
          display: grid;
          grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
          grid-template-rows: auto auto;
          gap: 18px;
          padding: 24px;
          border-radius: 26px;
          border: 1px solid rgba(148, 163, 184, 0.08);
          background:
            radial-gradient(circle at top center, rgba(59, 130, 246, 0.12), transparent 32%),
            linear-gradient(180deg, rgba(8, 14, 28, 0.55), rgba(6, 11, 20, 0.35));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.045),
            0 32px 88px rgba(2, 6, 23, 0.32),
            0 0 0 1px rgba(255, 255, 255, 0.035);
          animation: landingHeroStageFloat 22s ease-in-out infinite alternate;
        }

        .landingHeroStage > * {
          min-width: 0;
        }

        .landingHeroStage::before {
          content: '';
          position: absolute;
          inset: -25%;
          z-index: 0;
          border-radius: inherit;
          background: radial-gradient(circle at 28% 18%, rgba(96, 165, 250, 0.16), transparent 46%);
          opacity: 0.45;
          pointer-events: none;
          animation: landingHeroStageSheen 26s ease-in-out infinite alternate;
        }

        .heroStageGrid {
          position: absolute;
          inset: 0;
          z-index: 1;
          border-radius: inherit;
          opacity: 0.14;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: radial-gradient(circle at center, black 34%, transparent 92%);
          pointer-events: none;
          animation: heroStageGridDrift 48s linear infinite;
        }

        .heroStagePrimaryCard,
        .heroStageFeedCard,
        .heroStageFloatingCard,
        .landingSecurityConsole {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background:
            linear-gradient(180deg, rgba(12, 20, 36, 0.88), rgba(10, 16, 28, 0.78)),
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.07), transparent 26%);
          box-shadow:
            0 20px 44px rgba(2, 6, 23, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.045);
          backdrop-filter: blur(20px);
        }

        .storyBoard,
        .feedMockupCard,
        .feedSidePanel,
        .landingPlanCard,
        .landingProfileCard {
          position: relative;
          overflow: hidden;
          border: none;
          background: rgba(6, 11, 22, 0.38);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          transition:
            transform var(--motion-slow) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft),
            background var(--motion-slow) var(--ease-soft);
        }

        .storyBoard.publicFaceBoard {
          border-left: 3px solid rgba(56, 189, 248, 0.55);
        }

        .storyBoard.privacyBoard {
          border-left: 3px solid rgba(129, 140, 248, 0.5);
        }

        .landingPlanCard {
          border: 1px solid rgba(148, 163, 184, 0.1);
          background:
            linear-gradient(180deg, rgba(10, 16, 28, 0.75), rgba(7, 12, 22, 0.55)),
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.06), transparent 28%);
          box-shadow: 0 18px 40px rgba(2, 6, 23, 0.22);
        }

        .feedSidePanel.tractionPanel {
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          padding: 8px 4px 8px 0;
        }

        .feedSidePanel.peoplePanel {
          border: 1px solid rgba(148, 163, 184, 0.09);
          background: rgba(5, 9, 18, 0.45);
          box-shadow: 0 16px 40px rgba(2, 6, 23, 0.18);
          border-radius: 22px;
        }

        .landingProfileCard {
          border: 1px solid rgba(148, 163, 184, 0.07);
          background: rgba(5, 9, 18, 0.36);
          box-shadow: 0 20px 48px rgba(2, 6, 23, 0.16);
        }

        .heroStagePrimaryCard {
          grid-column: 1;
          grid-row: 1 / span 2;
          z-index: 3;
          padding: 20px 20px 154px;
          border-radius: 23px;
          animation: landingFloatPrimary 14s ease-in-out infinite;
          box-shadow:
            0 40px 88px rgba(0, 0, 0, 0.48),
            0 0 0 1px rgba(255, 255, 255, 0.06),
            0 0 120px rgba(56, 189, 248, 0.09),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .heroStageTopbar {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8fa4c3;
          padding-bottom: 12px;
          margin: -2px -2px 8px -2px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .heroStageTopbar small {
          margin-left: 8px;
          font-size: 0.78rem;
          letter-spacing: 0.02em;
          font-weight: 700;
        }

        .topbarDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }

        .topbarDot.red {
          background: #fb7185;
        }

        .topbarDot.amber {
          background: #f59e0b;
        }

        .topbarDot.blue {
          background: #38bdf8;
        }

        .heroProfileShell,
        .heroProfileHead,
        .heroMetricGrid,
        .storyBulletList,
        .storyBoardRows,
        .feedInsightGrid,
        .securityTrustList,
        .securityConsoleBody,
        .landingPlanList,
        .landingProfileTags,
        .peoplePanelList {
          display: grid;
          gap: 14px;
        }

        .heroProfileShell {
          margin-top: 16px;
          gap: 18px;
        }

        .heroProfileHead,
        .heroFeedHeader,
        .heroFeedAuthor,
        .heroProfileNameRow,
        .heroProfileFooter,
        .floatingCardHead,
        .storyBoardHead,
        .storyBoardProfile,
        .feedPanelHead,
        .feedMockupHead,
        .feedMockupAuthor,
        .feedMockupFooter,
        .feedAttachmentRow,
        .landingPlanHead,
        .securityConsoleHead,
        .securityConsoleRow,
        .securityConsoleFooter,
        .landingProfileTop,
        .landingProfileActions {
          display: flex;
          align-items: center;
        }

        .heroProfileFooter {
          justify-content: flex-start;
        }

        .heroProfileHead,
        .heroFeedHeader,
        .storyBoardHead,
        .securityConsoleHead,
        .securityConsoleFooter,
        .landingProfileTop {
          justify-content: space-between;
          gap: 14px;
        }

        .heroProfileMeta,
        .heroFeedAuthor > div,
        .feedMockupAuthor > div,
        .peoplePanelCopy,
        .landingProfileIdentity {
          display: grid;
          gap: 2px;
        }

        .heroFeedHeader,
        .heroFeedAuthor {
          align-items: flex-start;
        }

        .feedMockupHead,
        .feedMockupAuthor {
          align-items: flex-start;
        }

        .feedMockupHead {
          justify-content: space-between;
          gap: 16px;
        }

        .heroProfileHead {
          gap: 16px;
          align-items: flex-start;
        }

        .heroProfileMeta {
          gap: 6px;
          min-width: 0;
        }

        .heroProfileNameRow {
          flex-wrap: wrap;
          row-gap: 8px;
        }

        .heroProfileMeta strong {
          font-size: 1.28rem;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .heroFeedAuthor {
          flex: 1 1 auto;
          gap: 12px;
          min-width: 0;
        }

        .heroFeedAuthor > div {
          min-width: 0;
        }

        .feedMockupAuthor {
          flex: 1 1 auto;
          min-width: 0;
          gap: 12px;
        }

        .feedMockupAuthor > div {
          min-width: 0;
          gap: 4px;
        }

        .peoplePanelCopy {
          gap: 4px;
        }

        .heroProfileMeta strong,
        .heroFeedAuthor strong,
        .feedMockupAuthor strong,
        .storyBulletList strong,
        .storyBoardProfile strong,
        .feedInsightCard strong,
        .peoplePanelCopy strong,
        .securityTrustList strong,
        .securityConsoleRow strong,
        .landingPlanHead strong,
        .landingProfileIdentity strong {
          color: #f8fbff;
        }

        .storyBulletList article > div,
        .securityTrustList article > div,
        .storyBoardProfile > div,
        .securityConsoleRow > div {
          min-width: 0;
        }

        .storyBulletList article > div {
          display: block;
        }

        .securityTrustList article > div,
        .storyBoardProfile > div,
        .securityConsoleRow > div {
          display: grid;
          gap: 4px;
        }

        .storyBulletList strong,
        .securityTrustList strong {
          display: block;
          font-size: 1rem;
          line-height: 1.35;
          letter-spacing: -0.02em;
        }

        .storyBulletSentence {
          margin: 0;
          color: #a7b6cc;
          font-size: 0.98rem;
          line-height: 1.72;
        }

        .storyBulletSentence strong {
          display: inline;
          margin-right: 0.32rem;
          color: #f8fbff;
          font-size: 1rem;
          font-weight: 780;
          letter-spacing: -0.02em;
        }

        .storyBulletSentence span {
          color: #a7b6cc;
        }

        .feedMockupAuthor strong {
          display: block;
          font-size: 1.05rem;
          line-height: 1.18;
          letter-spacing: -0.025em;
        }

        .feedMockupAuthor small {
          display: block;
          color: #8fa4c3;
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .storyBoardProfile strong,
        .securityConsoleRow strong {
          display: block;
          font-size: 1rem;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }

        .storyBoardProfile small,
        .securityConsoleRow small {
          display: block;
          line-height: 1.5;
        }

        .heroProfileRole,
        .heroProfileLocation,
        .heroFeedBody,
        .heroFeedTime,
        .heroProfileUrl,
        .heroStageFloatingCard small {
          margin: 0;
          color: #a9bbd5;
        }

        .feedMockupBody {
          margin: 0;
          color: #d8e3f2;
          font-size: 0.98rem;
          line-height: 1.68;
          max-width: 68ch;
        }

        .heroProfileRole {
          font-size: 1rem;
          font-weight: 560;
          line-height: 1.45;
        }

        .heroProfileLocation {
          font-size: 0.84rem;
          line-height: 1.45;
        }

        .heroProfileUrl {
          font-size: 0.84rem;
          font-weight: 700;
          line-height: 1.4;
        }

        .storyBoardProfile {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 14px;
          align-items: center;
        }

        .heroPremiumTag,
        .storyBoardBadge,
        .storyBoardState,
        .miniPremiumPill,
        .landingPlanBadge,
        .landingProfileVisibility,
        .consoleVisibility {
          width: fit-content;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 11px;
          border-radius: 14px;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .storySectionLabel,
        .storyBoardBadge,
        .storyBoardState {
          letter-spacing: 0.06em;
          text-transform: none;
        }

        .heroPremiumTag,
        .miniPremiumPill,
        .landingPlanBadge {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.92), rgba(59, 130, 246, 0.88));
          border: 1px solid rgba(196, 181, 253, 0.18);
        }

        .storyBoardState.live,
        .consoleVisibility.public {
          color: #1e3a8a;
          background: rgba(219, 234, 254, 0.94);
          border: 1px solid rgba(96, 165, 250, 0.22);
        }

        .storyBoardState.secure,
        .consoleVisibility.private {
          color: #075985;
          background: rgba(224, 242, 254, 0.96);
          border: 1px solid rgba(14, 165, 233, 0.22);
        }

        .consoleVisibility.connections {
          color: #92400e;
          background: rgba(254, 240, 138, 0.5);
          border: 1px solid rgba(245, 158, 11, 0.24);
        }

        .heroAvatarLarge,
        .heroAvatarMedium,
        .heroAvatarSmall {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(56, 189, 248, 0.28));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          color: #f8fbff;
          font-weight: 900;
        }

        .heroAvatarLarge {
          width: 74px;
          height: 74px;
          --avatar-icon-size: 2rem;
          --avatar-badge-size: 24px;
          --avatar-badge-font-size: 0.62rem;
        }

        .heroAvatarMedium {
          width: 58px;
          height: 58px;
          --avatar-icon-size: 1.55rem;
          --avatar-badge-size: 22px;
          --avatar-badge-font-size: 0.56rem;
        }

        .heroAvatarSmall {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          --avatar-icon-size: 1.15rem;
          --avatar-badge-size: 18px;
          --avatar-badge-font-size: 0.48rem;
        }

        .heroAvatarLarge img,
        .heroAvatarMedium img,
        .heroAvatarSmall img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatarHasFallback {
          background:
            radial-gradient(circle at 28% 24%, rgba(255, 255, 255, 0.24), transparent 34%),
            linear-gradient(145deg, rgba(37, 99, 235, 0.96), rgba(56, 189, 248, 0.78));
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .avatarFallbackShell {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
        }

        .avatarFallbackGlow {
          position: absolute;
          inset: auto 10% -18% 10%;
          height: 46%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 70%);
          filter: blur(10px);
        }

        .avatarFallbackIcon {
          position: relative;
          z-index: 1;
          width: var(--avatar-icon-size);
          height: var(--avatar-icon-size);
          color: rgba(255, 255, 255, 0.95);
          filter: drop-shadow(0 6px 16px rgba(15, 23, 42, 0.22));
        }

        .avatarFallbackBadge {
          position: absolute;
          right: 5px;
          bottom: 5px;
          min-width: var(--avatar-badge-size);
          height: var(--avatar-badge-size);
          padding: 0 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.26);
          color: #f8fbff;
          font-size: var(--avatar-badge-font-size);
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          z-index: 2;
        }

        .heroFeedAuthor strong,
        .heroFeedAuthor small,
        .heroAttachmentCard strong,
        .heroAttachmentCard small {
          display: block;
        }

        .heroFeedAuthor strong {
          font-size: 0.98rem;
          line-height: 1.16;
        }

        .heroFeedAuthor small {
          color: #9fb0c9;
          line-height: 1.5;
        }

        .heroMetricGrid,
        .landingPremiumGrid,
        .landingProfilesGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .feedInsightGrid {
          grid-template-columns: 1fr;
        }

        .heroMetricGrid {
          gap: 10px;
          padding: 0;
          border-radius: 0;
          overflow: visible;
          background: transparent;
        }

        .heroMetricCard {
          padding: 14px 14px 15px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background:
            linear-gradient(180deg, rgba(10, 16, 28, 0.92), rgba(8, 14, 24, 0.8)),
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 38%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 14px 30px rgba(2, 6, 23, 0.18);
        }

        .feedInsightCard {
          padding: 16px 4px 16px 0;
          border-radius: 0;
          border: none;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          background: transparent;
        }

        .feedInsightGrid .feedInsightCard:last-child {
          border-bottom: none;
        }

        .heroMetricCard small,
        .feedInsightCard small,
        .feedMockupTime,
        .landingPlanPrice small,
        .securityConsoleFooter span,
        .landingProfileActivity span {
          color: #91a3be;
        }

        .heroMetricCard strong,
        .landingPlanPrice span {
          display: block;
          margin-top: 6px;
          color: #f8fbff;
          font-size: 1rem;
          font-weight: 760;
          line-height: 1.35;
          letter-spacing: -0.02em;
        }

        .feedInsightCard strong {
          display: block;
          margin: 0 0 8px;
          color: #e8f0ff;
          font-size: 0.98rem;
          font-weight: 750;
          letter-spacing: -0.02em;
          line-height: 1.35;
        }

        .heroProfileTrack {
          position: relative;
          height: 84px;
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          background: linear-gradient(180deg, rgba(8, 14, 28, 0.86), rgba(7, 13, 26, 0.78));
          overflow: hidden;
        }

        .heroTrackLine,
        .heroTrackGlow {
          position: absolute;
          left: 14px;
          right: 14px;
          border-radius: 999px;
        }

        .heroTrackLine {
          top: 50%;
          height: 2px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.4), rgba(34, 211, 238, 0.94), rgba(59, 130, 246, 0.44));
          transform: translateY(-50%);
        }

        .heroTrackGlow {
          top: 52%;
          height: 42px;
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.22), transparent 70%);
          transform: translateY(-50%);
          filter: blur(12px);
        }

        .heroTrackDots {
          position: absolute;
          inset: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .heroTrackDots span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #f8fbff;
          box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.12);
        }

        .heroStageFeedCard {
          grid-column: 2;
          grid-row: 1;
          z-index: 4;
          width: auto;
          margin-top: 96px;
          padding: 18px;
          border-radius: 20px;
          animation: landingFloatSecondary 15s ease-in-out infinite;
        }

        .heroFeedHeader {
          gap: 12px;
        }

        .heroFeedTime {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(15, 23, 42, 0.72);
          color: #c8d5e8;
          font-size: 0.74rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .heroFeedBody {
          line-height: 1.62;
          color: #e2ebf8;
        }

        .heroFeedChips,
        .feedMockupChips,
        .landingProfileTags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .heroFeedChips span,
        .feedMockupChips span,
        .landingProfileTags span {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.12);
          color: #dbeafe;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .heroFeedMeta,
        .feedMockupFooter {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          color: #dbeafe;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .heroFeedMeta span {
          display: flex;
          align-items: flex-start;
          min-height: 58px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(15, 23, 42, 0.56);
          line-height: 1.42;
        }

        .feedMockupSignals {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          align-items: stretch;
        }

        .feedMockupSignals span {
          display: flex;
          align-items: center;
          min-height: 44px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.35);
          line-height: 1.38;
        }

        .heroAttachmentCard,
        .feedAttachmentRow {
          gap: 12px;
          padding: 13px 14px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: linear-gradient(180deg, rgba(11, 18, 32, 0.92), rgba(7, 13, 24, 0.82));
        }

        .heroAttachmentCard {
          display: grid;
          gap: 6px;
        }

        .feedAttachmentRow {
          align-items: flex-start;
        }

        .feedAttachmentCopy {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .feedAttachmentRow strong {
          display: block;
          color: #f8fbff;
          line-height: 1.3;
        }

        .feedAttachmentRow small {
          display: block;
          color: #9fb0c9;
          line-height: 1.5;
        }

        .heroAttachmentCard strong {
          color: #f8fbff;
        }

        .heroAttachmentCard small {
          color: #9fb0c9;
          line-height: 1.5;
        }

        .heroStageFloatingCard {
          position: absolute;
          z-index: 5;
          display: grid;
          gap: 10px;
          padding: 16px;
          border-radius: 18px;
        }

        .heroStageNotifications {
          left: 26px;
          bottom: 26px;
          width: min(314px, calc(100% - 80px));
          animation: landingFloatTertiary 11s ease-in-out infinite;
        }

        .heroStageMessage {
          position: relative;
          right: auto;
          bottom: auto;
          width: auto;
          grid-column: 2;
          grid-row: 2;
          align-self: end;
          animation: landingFloatQuaternary 14s ease-in-out infinite;
        }

        .floatingCardHead,
        .feedPanelHead {
          gap: 8px;
          color: #93c5fd;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .proofItem {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 12px;
          align-items: start;
          padding: 16px 0;
          border-radius: 0;
          border: none;
          border-bottom: 1px solid rgba(148, 163, 184, 0.09);
          background: transparent;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .proofItem:last-child {
          border-bottom: none;
        }

        .proofItemIcon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.86);
          color: #93c5fd;
          border: 1px solid rgba(96, 165, 250, 0.16);
        }

        .proofItem strong {
          display: block;
          color: #f8fbff;
          margin-bottom: 4px;
        }

        .landingSecurityShell,
        .feedExperienceGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
          gap: 22px;
          align-items: start;
        }

        .landingSecurityShell > *,
        .feedExperienceGrid > * {
          min-width: 0;
        }

        .landingStorySection {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 22px;
          align-items: start;
          justify-items: center;
        }

        .storyBulletList article,
        .securityTrustList article {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          align-items: start;
        }

        .storyBulletList article:last-child,
        .securityTrustList article:last-child {
          border-bottom: 0;
        }

        .storyBoard {
          display: grid;
          gap: 16px;
          padding: 20px 20px 18px;
          border-radius: 22px;
        }

        .storyBoardRows div {
          display: grid;
          gap: 5px;
          padding: 15px 0;
          border-radius: 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .storyBoardRows div:last-child {
          border-bottom: none;
        }

        .inlineTextLink {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #7dd3fc;
          font-weight: 800;
          text-decoration: none;
        }

        .landingSectionHead {
          max-width: 760px;
          gap: clamp(12px, 2vw, 20px);
        }

        .landingStoryCopy {
          width: min(100%, 980px);
          max-width: 980px;
          justify-self: center;
          gap: clamp(16px, 2.5vw, 26px);
        }

        .landingStoryCopy > p {
          max-width: 64ch;
        }

        .landingSecuritySection .landingSectionLabel,
        .landingSecuritySection .securityConsoleHead span {
          color: #1d4ed8;
        }

        .landingSecuritySection .landingSectionLabel {
          background: rgba(219, 234, 254, 0.92);
          border-color: rgba(96, 165, 250, 0.2);
          box-shadow: none;
        }

        .landingSecuritySection .landingSecurityCopy h2 {
          color: #0f172a;
        }

        .landingSecuritySection .landingSecurityCopy p,
        .landingSecuritySection .securityTrustList small,
        .landingSecuritySection .securityConsoleRow small,
        .landingSecuritySection .securityConsoleFooter span {
          color: #475569;
        }

        .landingSecuritySection .securityTrustList strong,
        .landingSecuritySection .securityConsoleRow strong {
          color: #0f172a;
        }

        .landingSecuritySection .securityTrustList article,
        .landingSecuritySection .securityConsoleFooter {
          border-color: rgba(226, 232, 240, 0.9);
        }

        .landingSecuritySection .securityTrustList .miniIcon,
        .landingSecuritySection .securityConsoleHead .miniIcon {
          color: #2563eb;
        }

        .landingSecuritySection .inlineTextLink {
          color: #0f172a;
        }

        .feedExperienceGrid,
        .landingPremiumGrid,
        .landingProfilesGrid {
          margin-top: clamp(1.25rem, 3vw, 2.25rem);
        }

        .feedExperienceGrid {
          align-items: start;
        }

        .feedMockupColumn {
          grid-template-columns: 1fr;
          border-radius: 22px;
          background: rgba(4, 8, 16, 0.42);
          border: 1px solid rgba(148, 163, 184, 0.07);
          overflow: hidden;
          transition:
            border-color var(--motion-slow) var(--ease-soft),
            box-shadow var(--motion-slow) var(--ease-soft);
        }

        .feedMockupCard,
        .feedSidePanel,
        .landingProfileCard {
          padding: 18px;
          border-radius: 22px;
        }

        .feedMockupColumn .feedMockupCard {
          border-radius: 0;
          padding: 22px clamp(16px, 3vw, 24px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          background: transparent;
          box-shadow: none;
        }

        .feedMockupColumn .feedMockupCard:last-child {
          border-bottom: none;
        }

        .feedSideColumn {
          grid-template-columns: 1fr;
        }

        .peoplePanelRow {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
          padding: 14px 0;
          margin: 0;
          border-radius: 14px;
          color: inherit;
          text-decoration: none;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          transition:
            background var(--motion-medium) var(--ease-soft),
            transform var(--motion-medium) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft);
        }

        .peoplePanelRow:hover {
          background: rgba(59, 130, 246, 0.06);
          transform: translateX(2px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .peoplePanelRow:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .peoplePanelRow > svg {
          align-self: center;
          color: #94a3b8;
        }

        .peoplePanelCopy span {
          width: fit-content;
          min-height: 26px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.12);
          border: 1px solid rgba(96, 165, 250, 0.18);
          color: #93c5fd;
          font-size: 0.74rem;
          font-weight: 700;
          line-height: 1;
          margin-top: 4px;
        }

        .landingPremiumGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: clamp(14px, 2vw, 22px);
        }

        .landingPlanCard {
          display: grid;
          gap: 16px;
          min-height: 100%;
          padding: 22px;
          border-radius: 24px;
          transition:
            transform var(--motion-slow) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft);
        }

        .landingPlanTop {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
        }

        .landingPlanIconShell {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.34);
        }

        .landingPlanIconShell.free {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(226, 232, 240, 0.98));
          color: #64748b;
        }

        .landingPlanIconShell.silver {
          background: linear-gradient(135deg, rgba(226, 232, 240, 1), rgba(148, 163, 184, 0.94));
          color: #334155;
        }

        .landingPlanIconShell.gold {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.98), rgba(250, 204, 21, 0.96));
          color: #ffffff;
        }

        .landingPlanIconShell.platinum {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.98), rgba(168, 85, 247, 0.96));
          color: #ffffff;
        }

        .landingPlanTitleBlock {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .landingPlanEyebrow,
        .landingPlanHighlightEyebrow {
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .landingPlanEyebrow {
          color: #2563eb;
        }

        .landingPlanTitle {
          margin: 0;
          color: #0f172a;
          font-size: clamp(1.95rem, 1.7vw, 2.25rem);
          line-height: 1.02;
          letter-spacing: -0.05em;
        }

        .landingPlanDetailPill {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 14px;
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          white-space: nowrap;
          border: 1px solid transparent;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        .landingPlanDetailPill.free {
          background: rgba(255, 255, 255, 0.9);
          color: #64748b;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .landingPlanDetailPill.silver {
          background: rgba(255, 255, 255, 0.72);
          color: #475569;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .landingPlanDetailPill.gold {
          background: rgba(255, 251, 235, 0.8);
          color: #b45309;
          border-color: rgba(245, 158, 11, 0.24);
        }

        .landingPlanDetailPill.platinum {
          background: rgba(250, 245, 255, 0.82);
          color: #7c3aed;
          border-color: rgba(168, 85, 247, 0.24);
        }

        .landingPlanSummary {
          margin: 0;
          color: #475569;
          font-size: 1.02rem;
          line-height: 1.68;
        }

        .landingPlanCard.free {
          background:
            linear-gradient(180deg, rgba(12, 18, 32, 0.94), rgba(9, 15, 28, 0.88)),
            radial-gradient(circle at top right, rgba(148, 163, 184, 0.08), transparent 24%);
        }

        .landingPlanCard.silver {
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(10, 17, 30, 0.9)),
            radial-gradient(circle at top right, rgba(226, 232, 240, 0.1), transparent 24%);
        }

        .landingPlanCard.gold {
          background:
            linear-gradient(180deg, rgba(31, 22, 10, 0.96), rgba(18, 15, 10, 0.9)),
            radial-gradient(circle at top right, rgba(251, 191, 36, 0.14), transparent 22%);
          border-color: rgba(245, 158, 11, 0.18);
        }

        .landingPlanCard.platinum {
          background:
            linear-gradient(180deg, rgba(18, 14, 32, 0.96), rgba(10, 12, 28, 0.92)),
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.16), transparent 22%);
          border-color: rgba(168, 85, 247, 0.18);
        }

        .landingPlanCard.recommended {
          box-shadow:
            0 22px 44px rgba(2, 6, 23, 0.34),
            0 0 0 1px rgba(250, 204, 21, 0.08),
            0 0 42px rgba(250, 204, 21, 0.16);
        }

        .landingPlanHead {
          justify-content: space-between;
          align-items: start;
          gap: 12px;
        }

        .landingPlanHead small {
          display: block;
          color: #8ab4ff;
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .landingPlanPrice span {
          font-size: clamp(2rem, 3vw, 2.6rem);
          line-height: 0.95;
        }

        .landingPlanPriceLabel {
          color: #475569;
          font-size: 1rem;
          font-weight: 800;
        }

        .landingPlanHighlight {
          display: grid;
          gap: 10px;
          padding: 18px 18px 16px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.56);
          background: rgba(255, 255, 255, 0.62);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.54);
        }

        .landingPlanHighlight.free {
          background: rgba(255, 255, 255, 0.76);
        }

        .landingPlanHighlight.silver {
          background: rgba(255, 255, 255, 0.68);
        }

        .landingPlanHighlight.gold {
          background: rgba(255, 251, 235, 0.78);
          border-color: rgba(245, 158, 11, 0.16);
        }

        .landingPlanHighlight.platinum {
          background: rgba(250, 245, 255, 0.8);
          border-color: rgba(168, 85, 247, 0.14);
        }

        .landingPlanHighlightEyebrow {
          color: #475569;
        }

        .landingPlanHighlight.gold .landingPlanHighlightEyebrow {
          color: #a16207;
        }

        .landingPlanHighlight.platinum .landingPlanHighlightEyebrow {
          color: #7c3aed;
        }

        .landingPlanHighlight p {
          margin: 0;
          color: #475569;
          line-height: 1.62;
        }

        .landingPlanList {
          display: grid;
          gap: 12px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .landingPlanList li {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          color: #0f172a;
          font-size: 1.02rem;
          font-weight: 700;
          line-height: 1.55;
        }

        .landingPlanFeatureDot {
          width: 10px;
          height: 10px;
          flex: 0 0 auto;
          margin-top: 0.42rem;
          border-radius: 999px;
          background: #cbd5e1;
          box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.32);
        }

        .landingPlanFeatureDot.silver {
          background: #94a3b8;
        }

        .landingPlanFeatureDot.gold {
          background: #f59e0b;
        }

        .landingPlanFeatureDot.platinum {
          background: #8b5cf6;
        }

        .landingPlanButton {
          margin-top: auto;
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          padding: 0 16px;
          border: 1px solid transparent;
          font-size: 1rem;
          font-weight: 800;
          text-decoration: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition:
            transform var(--motion-medium) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft);
        }

        .landingPlanButton.free {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(226, 232, 240, 0.96));
          color: #0f172a;
          border-color: rgba(148, 163, 184, 0.24);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.52),
            0 18px 30px rgba(148, 163, 184, 0.12);
        }

        .landingPlanButton.silver {
          background: linear-gradient(135deg, rgba(226, 232, 240, 0.98), rgba(148, 163, 184, 0.94));
          color: #0f172a;
          border-color: rgba(100, 116, 139, 0.18);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 18px 32px rgba(100, 116, 139, 0.18);
        }

        .landingPlanButton.gold {
          background: linear-gradient(135deg, rgba(250, 204, 21, 0.96), rgba(245, 158, 11, 0.94));
          color: #ffffff;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 22px 36px rgba(245, 158, 11, 0.28);
        }

        .landingPlanButton.platinum {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.96), rgba(168, 85, 247, 0.94));
          color: #ffffff;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 22px 36px rgba(124, 58, 237, 0.26);
        }

        .landingPlanButton:hover {
          transform: translateY(-2px);
        }

        .landingSecurityShell {
          padding: 28px;
          background:
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.1), transparent 22%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
        }

        .landingSecurityConsole {
          display: grid;
          gap: 16px;
          padding: 18px;
          border-radius: 22px;
          min-height: 100%;
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        }

        .securityConsoleBody {
          gap: 10px;
        }

        .securityConsoleRow {
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(241, 245, 249, 0.96);
          border: 1px solid rgba(226, 232, 240, 0.95);
        }

        .landingProfilesGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(14px, 2.5vw, 28px);
        }

        .landingProfileCard {
          display: grid;
          gap: 14px;
        }

        .landingProfileIdentity strong {
          font-size: 1.04rem;
        }

        .landingProfileActivity {
          padding: 12px 0;
          border-radius: 0;
          background: transparent;
          border: none;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }

        .landingFinalCta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 24%),
            linear-gradient(135deg, rgba(4, 8, 18, 0.98), rgba(8, 14, 28, 0.92));
        }

        .fullWidth {
          width: 100%;
        }

        .miniIcon {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
        }

        @keyframes landingHeroLuxDrift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(1.8%, -1.2%, 0) scale(1.035);
          }
        }

        @keyframes landingHeroRimGlow {
          0% {
            opacity: 0.52;
          }
          100% {
            opacity: 0.9;
          }
        }

        @keyframes landingHeroFadeRise {
          from {
            opacity: 0;
            transform: translate3d(0, 16px, 0);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0);
          }
        }

        @keyframes landingHeroStageFloat {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(0, -5px, 0);
          }
        }

        @keyframes landingHeroStageSheen {
          0% {
            transform: translate3d(-5%, 0, 0);
            opacity: 0.32;
          }
          100% {
            transform: translate3d(7%, 5%, 0);
            opacity: 0.56;
          }
        }

        @keyframes landingBackdropPulse {
          0%,
          100% {
            opacity: 0.16;
            transform: scale(1);
          }
          50% {
            opacity: 0.26;
            transform: scale(1.04);
          }
        }

        @keyframes heroStageGridDrift {
          0% {
            background-position: 0 0, 0 0;
          }
          100% {
            background-position: -40px -28px, -40px -28px;
          }
        }

        @keyframes landingFloatPrimary {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -5px, 0);
          }
        }

        @keyframes landingFloatSecondary {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, 5px, 0);
          }
        }

        @keyframes landingFloatTertiary {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-2px, -4px, 0);
          }
        }

        @keyframes landingFloatQuaternary {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(3px, 4px, 0);
          }
        }

        @keyframes landingHeroLightBreath {
          from {
            opacity: 0.38;
          }
          to {
            opacity: 0.72;
          }
        }

        @media (max-width: 1280px) {
          .landingHeroSection,
          .landingStorySection,
          .landingSecurityShell,
          .feedExperienceGrid {
            grid-template-columns: 1fr;
          }

          .landingHeroStage {
            min-height: auto;
            padding: 18px;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            gap: 14px;
          }

          .landingPremiumGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .landingProofBar {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .heroStagePrimaryCard,
          .heroStageFeedCard,
          .heroStageNotifications,
          .heroStageMessage {
            position: relative;
            inset: auto;
            width: auto;
            right: auto;
            left: auto;
            top: auto;
            bottom: auto;
            grid-column: auto;
            grid-row: auto;
            align-self: auto;
            margin-top: 0;
            animation: none;
          }

          .heroStagePrimaryCard {
            padding-bottom: 22px;
          }
        }

        @media (max-width: 980px) {
          .landingHeroSection,
          .landingProofBar,
          .landingStorySection,
          .landingHowSection,
          .landingFeedSection,
          .landingPremiumSection,
          .landingProfilesSection,
          .landingTrustSection,
          .landingFinalCta {
            padding: 22px;
          }

          .landingHeroStage {
            padding: 16px;
          }

          .heroStagePrimaryCard,
          .heroStageFeedCard,
          .heroStageNotifications,
          .heroStageMessage {
            border-radius: 18px;
          }

          .heroStagePrimaryCard {
            padding: 18px 18px 20px;
          }

          .heroMetricGrid,
          .landingProfilesGrid {
            grid-template-columns: 1fr;
          }

          .publicSaasLanding.publicSaasLandingLight .landingHowSteps,
          .publicSaasLanding.publicSaasLandingLight .landingTrustGrid {
            grid-template-columns: 1fr;
          }

          .landingFinalCta {
            display: grid;
          }

          .feedMockupSignals {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .publicSaasLanding {
            gap: 18px;
          }

          .landingHeroSection,
          .landingProofBar,
          .landingStorySection,
          .landingHowSection,
          .landingFeedSection,
          .landingPremiumSection,
          .landingProfilesSection,
          .landingTrustSection,
          .landingFinalCta {
            padding: 18px;
            border-radius: 22px;
          }

          .landingProofBar,
          .landingPremiumGrid,
          .landingProfilesGrid {
            grid-template-columns: 1fr;
          }

          .landingHeroCopy h1 {
            max-width: 100%;
            font-size: clamp(2.5rem, 12vw, 4rem);
          }

          .landingHeroCopy p,
          .landingHeroLead {
            max-width: 100%;
          }

          .landingActionRow {
            display: grid;
            grid-template-columns: 1fr;
          }

          .landingPrimaryButton,
          .landingGhostButton,
          .landingSubtleCta {
            width: 100%;
            justify-content: center;
          }

          .storyBoard,
          .feedMockupCard,
          .feedSidePanel,
          .landingPlanCard,
          .landingProfileCard,
          .landingSecurityConsole {
            border-radius: 18px;
          }

          .landingHeroStage,
          .heroStagePrimaryCard,
          .heroStageFeedCard,
          .heroStageFloatingCard {
            border-radius: 18px;
          }

          .heroStageTopbar {
            gap: 6px;
            padding-bottom: 10px;
          }

          .heroStageTopbar small {
            margin-left: 4px;
            min-width: 0;
            font-size: 0.72rem;
            overflow-wrap: anywhere;
          }

          .heroProfileHead,
          .heroFeedHeader,
          .heroFeedAuthor {
            flex-direction: column;
            align-items: flex-start;
          }

          .heroProfileHead,
          .heroFeedHeader {
            gap: 12px;
          }

          .heroProfileMeta strong {
            font-size: clamp(1.08rem, 5.8vw, 1.28rem);
          }

          .heroPremiumTag,
          .heroFeedTime {
            align-self: flex-start;
          }

          .heroFeedBody {
            font-size: 0.98rem;
            line-height: 1.58;
          }

          .heroFeedMeta {
            grid-template-columns: 1fr;
          }

          .heroFeedMeta span,
          .feedMockupSignals span {
            min-height: 0;
          }

          .heroProfileTrack {
            height: 72px;
          }

          .heroTrackLine,
          .heroTrackGlow {
            left: 12px;
            right: 12px;
          }

          .heroTrackDots {
            inset: 0 14px;
          }
        }

        .landingHowInner {
          max-width: 1080px;
          margin: 0 auto;
          display: grid;
          gap: clamp(1.75rem, 4vw, 2.75rem);
        }

        .landingHowSteps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(1rem, 2vw, 1.5rem);
        }

        .landingHowStep {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 18px;
          align-items: start;
          padding: 22px 20px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(6, 11, 22, 0.35);
          animation: landingHeroFadeRise 0.78s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition:
            transform var(--motion-slow) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft);
        }

        .landingHowStep:hover {
          transform: translateY(-3px);
          border-color: rgba(96, 165, 250, 0.32);
          box-shadow: 0 22px 48px rgba(2, 6, 23, 0.32);
        }

        .landingHowStepBadge {
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.82rem;
          letter-spacing: 0.06em;
          background: rgba(59, 130, 246, 0.18);
          color: #93c5fd;
        }

        .landingHowStepBody h3 {
          margin: 0 0 8px;
          font-size: 1.08rem;
          letter-spacing: -0.02em;
          color: #f8fbff;
        }

        .landingHowStepBody p {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.65;
          color: #a7b6cc;
        }

        .landingTrustShell {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          gap: clamp(1.75rem, 4vw, 2.5rem);
        }

        .landingTrustGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(1rem, 2vw, 1.25rem);
        }

        .landingTrustCard {
          position: relative;
          margin: 0;
          padding: 22px 20px 20px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(6, 11, 22, 0.32);
          box-shadow: 0 16px 40px rgba(2, 6, 23, 0.14);
          transition:
            transform var(--motion-slow) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft);
        }

        .landingTrustCard:hover {
          transform: translateY(-4px);
          border-color: rgba(96, 165, 250, 0.35);
          box-shadow:
            0 28px 60px rgba(2, 6, 23, 0.28),
            0 0 40px rgba(59, 130, 246, 0.12);
        }

        .landingTrustQuoteIcon {
          width: 22px;
          height: 22px;
          color: rgba(96, 165, 250, 0.55);
          margin-bottom: 12px;
          transition:
            color var(--motion-medium) var(--ease-soft),
            transform var(--motion-slow) var(--ease-out-expo);
        }

        .landingTrustCard:hover .landingTrustQuoteIcon {
          color: rgba(59, 130, 246, 0.75);
          transform: scale(1.06);
        }

        .landingTrustCard blockquote {
          margin: 0 0 16px;
          font-size: 0.95rem;
          line-height: 1.65;
          color: #dbe7fb;
          font-weight: 520;
        }

        .landingTrustCard figcaption {
          display: grid;
          gap: 4px;
        }

        .landingTrustName {
          font-weight: 800;
          font-size: 0.9rem;
          color: #f8fbff;
        }

        .landingTrustMeta {
          font-size: 0.82rem;
          color: #94a3b8;
          line-height: 1.45;
        }

        .publicSaasLanding.publicSaasLandingLight {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .landingBackdropGlow {
          opacity: 0.1;
          filter: blur(76px);
        }

        .publicSaasLanding.publicSaasLandingLight .landingBackdropGlowLeft {
          background: rgba(59, 130, 246, 0.2);
        }

        .publicSaasLanding.publicSaasLandingLight .landingBackdropGlowRight {
          background: rgba(99, 102, 241, 0.14);
        }

        .publicSaasLanding.publicSaasLandingLight .landingHeroSection {
          border: 1px solid rgba(15, 23, 42, 0.06);
          background:
            radial-gradient(circle at 14% 22%, rgba(59, 130, 246, 0.09), transparent 42%),
            radial-gradient(circle at 86% 10%, rgba(139, 92, 246, 0.07), transparent 36%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 52%, #f1f5f9 100%);
          box-shadow: 0 22px 70px rgba(15, 23, 42, 0.07);
        }

        .publicSaasLanding.publicSaasLandingLight .landingHeroSection::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 100% 58% at 50% -18%, rgba(59, 130, 246, 0.14), transparent 56%),
            radial-gradient(ellipse 70% 45% at 100% 100%, rgba(139, 92, 246, 0.09), transparent 52%);
          opacity: 0.52;
          animation: landingHeroLightBreath 14s ease-in-out infinite alternate;
        }

        .publicSaasLanding.publicSaasLandingLight .landingHeroCopy h1 {
          color: #0f172a;
          position: relative;
          z-index: 1;
          text-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9),
            0 26px 70px rgba(59, 130, 246, 0.1),
            0 2px 24px rgba(255, 255, 255, 0.6);
        }

        .publicSaasLanding.publicSaasLandingLight .landingHeroLead {
          color: #475569;
          position: relative;
          z-index: 1;
        }

        .publicSaasLanding.publicSaasLandingLight .landingHeroCopy .landingKicker,
        .publicSaasLanding.publicSaasLandingLight .landingHeroCopy .landingActionRow {
          position: relative;
          z-index: 1;
        }

        .publicSaasLanding.publicSaasLandingLight .landingKicker,
        .publicSaasLanding.publicSaasLandingLight .landingSectionLabel {
          background: rgba(241, 245, 249, 0.96);
          border-color: rgba(59, 130, 246, 0.2);
          color: #1d4ed8;
          transition:
            transform var(--motion-medium) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft),
            background var(--motion-slow) var(--ease-soft);
        }

        .publicSaasLanding.publicSaasLandingLight .landingKicker:hover,
        .publicSaasLanding.publicSaasLandingLight .landingSectionLabel:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(59, 130, 246, 0.14);
          border-color: rgba(59, 130, 246, 0.32);
          background: rgba(255, 255, 255, 0.98);
        }

        .publicSaasLanding.publicSaasLandingLight .landingGhostButton {
          color: #0f172a;
          background: rgba(255, 255, 255, 0.92);
          border-color: rgba(148, 163, 184, 0.28);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
        }

        .publicSaasLanding.publicSaasLandingLight .landingSubtleCta {
          color: #1d4ed8;
          background: rgba(255, 255, 255, 0.92);
          border-color: rgba(148, 163, 184, 0.28);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
        }

        .publicSaasLanding.publicSaasLandingLight .landingSubtleCta:hover {
          color: #0f172a;
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(59, 130, 246, 0.28);
          box-shadow:
            0 22px 50px rgba(59, 130, 246, 0.12),
            0 14px 36px rgba(15, 23, 42, 0.06);
        }

        .publicSaasLanding.publicSaasLandingLight .landingHeroStage {
          background:
            radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.07), transparent 44%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.82));
          border-color: rgba(226, 232, 240, 0.95);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            0 26px 56px rgba(15, 23, 42, 0.06);
        }

        .publicSaasLanding.publicSaasLandingLight .heroStagePrimaryCard,
        .publicSaasLanding.publicSaasLandingLight .heroStageFeedCard,
        .publicSaasLanding.publicSaasLandingLight .heroStageFloatingCard,
        .publicSaasLanding.publicSaasLandingLight .landingSecurityConsole {
          border: 1px solid rgba(226, 232, 240, 0.98);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.07);
        }

        .publicSaasLanding.publicSaasLandingLight .heroStagePrimaryCard {
          box-shadow:
            0 28px 60px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }

        .publicSaasLanding.publicSaasLandingLight .heroStageTopbar {
          color: #64748b;
          border-bottom-color: rgba(226, 232, 240, 0.95);
        }

        .publicSaasLanding.publicSaasLandingLight .heroProfileMeta p,
        .publicSaasLanding.publicSaasLandingLight .heroProfileMeta small,
        .publicSaasLanding.publicSaasLandingLight .heroFeedAuthor small {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .heroProfileMeta strong,
        .publicSaasLanding.publicSaasLandingLight .heroFeedAuthor strong {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .heroMetricCard {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(226, 232, 240, 0.95);
          transition:
            transform var(--motion-medium) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft);
        }

        .publicSaasLanding.publicSaasLandingLight .heroMetricCard:hover {
          transform: translateY(-3px);
          border-color: rgba(147, 197, 253, 0.5);
          box-shadow: 0 16px 34px rgba(59, 130, 246, 0.12);
        }

        .publicSaasLanding.publicSaasLandingLight .heroMetricCard small {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .heroMetricCard strong {
          color: #0f172a;
          font-size: 0.95rem;
          font-weight: 750;
        }

        .publicSaasLanding.publicSaasLandingLight .heroProfileTrack {
          background: linear-gradient(180deg, #f8fafc, #f1f5f9);
          border-color: rgba(226, 232, 240, 0.95);
        }

        .publicSaasLanding.publicSaasLandingLight .heroProfileUrl {
          color: #475569;
        }

        .publicSaasLanding.publicSaasLandingLight .heroProfileRole {
          color: #334155;
        }

        .publicSaasLanding.publicSaasLandingLight .heroProfileLocation,
        .publicSaasLanding.publicSaasLandingLight .heroFeedTime {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .heroFeedTime {
          background: rgba(248, 250, 252, 0.94);
          border-color: rgba(226, 232, 240, 0.95);
        }

        .publicSaasLanding.publicSaasLandingLight .heroFeedBody {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .heroFeedMeta,
        .publicSaasLanding.publicSaasLandingLight .feedMockupFooter {
          color: #334155;
        }

        .publicSaasLanding.publicSaasLandingLight .heroFeedMeta span {
          border-color: rgba(226, 232, 240, 0.95);
          background: rgba(248, 250, 252, 0.96);
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupSignals span {
          background: rgba(255, 255, 255, 0.92);
          border-color: rgba(226, 232, 240, 0.95);
          color: #334155;
          transition:
            transform var(--motion-medium) var(--ease-out-expo),
            border-color var(--motion-medium) var(--ease-soft),
            box-shadow var(--motion-slow) var(--ease-soft);
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupSignals span:hover {
          transform: translateY(-2px);
          border-color: rgba(147, 197, 253, 0.4);
          box-shadow: 0 12px 26px rgba(59, 130, 246, 0.1);
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupAuthor small,
        .publicSaasLanding.publicSaasLandingLight .feedAttachmentRow small,
        .publicSaasLanding.publicSaasLandingLight .peoplePanelRow > svg {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .heroAttachmentCard,
        .publicSaasLanding.publicSaasLandingLight .feedAttachmentRow {
          background: #f8fafc;
          border-color: rgba(226, 232, 240, 0.95);
        }

        .publicSaasLanding.publicSaasLandingLight .heroAttachmentCard strong,
        .publicSaasLanding.publicSaasLandingLight .feedAttachmentRow strong {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .heroAttachmentCard small,
        .publicSaasLanding.publicSaasLandingLight .feedAttachmentRow small {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .heroFeedChips span,
        .publicSaasLanding.publicSaasLandingLight .feedMockupChips span {
          background: rgba(241, 245, 249, 0.95);
          border-color: rgba(226, 232, 240, 0.95);
          color: #334155;
        }

        .publicSaasLanding.publicSaasLandingLight .floatingCardHead,
        .publicSaasLanding.publicSaasLandingLight .feedPanelHead {
          color: #475569;
        }

        .publicSaasLanding.publicSaasLandingLight .heroStageFloatingCard strong {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .heroStageFloatingCard small {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .landingStorySection::before {
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.18), transparent);
        }

        .publicSaasLanding.publicSaasLandingLight .landingStoryCopy h2,
        .publicSaasLanding.publicSaasLandingLight .landingSectionHead h2,
        .publicSaasLanding.publicSaasLandingLight .landingSecurityCopy h2,
        .publicSaasLanding.publicSaasLandingLight .landingFinalCtaCopy h2 {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .landingStoryCopy p,
        .publicSaasLanding.publicSaasLandingLight .landingSectionHead p,
        .publicSaasLanding.publicSaasLandingLight .landingSecurityCopy p,
        .publicSaasLanding.publicSaasLandingLight .landingFinalCtaCopy p {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .storyBoard,
        .publicSaasLanding.publicSaasLandingLight .feedMockupCard,
        .publicSaasLanding.publicSaasLandingLight .landingPlanCard,
        .publicSaasLanding.publicSaasLandingLight .landingProfileCard {
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.05);
        }

        .publicSaasLanding.publicSaasLandingLight .storyBoard:hover,
        .publicSaasLanding.publicSaasLandingLight .landingPlanCard:hover,
        .publicSaasLanding.publicSaasLandingLight .landingProfileCard:hover {
          transform: translateY(-5px);
          border-color: rgba(147, 197, 253, 0.45);
          box-shadow:
            0 28px 56px rgba(15, 23, 42, 0.1),
            0 0 0 1px rgba(59, 130, 246, 0.06),
            0 0 48px rgba(59, 130, 246, 0.08);
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupColumn {
          transition:
            border-color var(--motion-slow) var(--ease-soft),
            box-shadow var(--motion-slow) var(--ease-soft);
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupColumn:hover {
          border-color: rgba(147, 197, 253, 0.35);
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.07);
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupColumn .feedMockupCard {
          transition:
            background var(--motion-slow) var(--ease-soft),
            box-shadow var(--motion-slow) var(--ease-soft);
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupColumn .feedMockupCard:hover {
          background: rgba(255, 255, 255, 0.62);
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.06);
        }

        .publicSaasLanding.publicSaasLandingLight .feedSidePanel.tractionPanel:hover .feedInsightCard {
          border-bottom-color: rgba(226, 232, 240, 0.6);
        }

        .publicSaasLanding.publicSaasLandingLight .landingGhostButton:hover {
          border-color: rgba(59, 130, 246, 0.24);
          box-shadow:
            0 22px 50px rgba(59, 130, 246, 0.14),
            0 14px 36px rgba(15, 23, 42, 0.06);
        }

        .publicSaasLanding.publicSaasLandingLight .landingPrimaryButton:hover {
          box-shadow:
            0 30px 58px rgba(37, 99, 235, 0.34),
            0 0 64px rgba(56, 189, 248, 0.24),
            0 0 0 1px rgba(255, 255, 255, 0.12) inset;
        }

        .publicSaasLanding.publicSaasLandingLight .feedSidePanel.peoplePanel {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(226, 232, 240, 0.95);
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.05);
          transition:
            transform var(--motion-slow) var(--ease-out-expo),
            box-shadow var(--motion-slow) var(--ease-soft),
            border-color var(--motion-medium) var(--ease-soft);
        }

        .publicSaasLanding.publicSaasLandingLight .feedSidePanel.peoplePanel:hover {
          border-color: rgba(147, 197, 253, 0.38);
          box-shadow:
            0 26px 54px rgba(15, 23, 42, 0.09),
            0 0 40px rgba(59, 130, 246, 0.08);
          transform: translateY(-3px);
        }

        .publicSaasLanding.publicSaasLandingLight .peoplePanelCopy span {
          background: rgba(219, 234, 254, 0.9);
          border-color: rgba(147, 197, 253, 0.55);
          color: #1d4ed8;
        }

        .publicSaasLanding.publicSaasLandingLight .storyBulletList strong,
        .publicSaasLanding.publicSaasLandingLight .storyBoardProfile strong,
        .publicSaasLanding.publicSaasLandingLight .securityTrustList strong,
        .publicSaasLanding.publicSaasLandingLight .securityConsoleRow strong,
        .publicSaasLanding.publicSaasLandingLight .storyBoardRows strong,
        .publicSaasLanding.publicSaasLandingLight .feedMockupAuthor strong,
        .publicSaasLanding.publicSaasLandingLight .peoplePanelCopy strong,
        .publicSaasLanding.publicSaasLandingLight .landingPlanHead strong,
        .publicSaasLanding.publicSaasLandingLight .landingProfileIdentity strong {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .storyBulletSentence {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .storyBulletSentence strong {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .storyBulletSentence span {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .storyBulletList small,
        .publicSaasLanding.publicSaasLandingLight .storyBoardProfile small,
        .publicSaasLanding.publicSaasLandingLight .securityTrustList small,
        .publicSaasLanding.publicSaasLandingLight .securityConsoleRow small,
        .publicSaasLanding.publicSaasLandingLight .storyBoardRows span,
        .publicSaasLanding.publicSaasLandingLight .peoplePanelCopy small,
        .publicSaasLanding.publicSaasLandingLight .landingProfileIdentity p,
        .publicSaasLanding.publicSaasLandingLight .landingProfileIdentity small {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupCard p {
          color: #334155;
        }

        .publicSaasLanding.publicSaasLandingLight .feedMockupTime {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .landingFeedSection {
          background:
            radial-gradient(ellipse 90% 55% at 50% 0%, rgba(59, 130, 246, 0.07), transparent 52%),
            linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .publicSaasLanding.publicSaasLandingLight .landingPremiumSection {
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: linear-gradient(168deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.05);
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.free {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.silver {
          background:
            radial-gradient(circle at top right, rgba(226, 232, 240, 0.72), transparent 24%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.96));
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.gold {
          background:
            radial-gradient(circle at top right, rgba(253, 230, 138, 0.5), transparent 24%),
            linear-gradient(180deg, rgba(255, 251, 235, 0.98), rgba(255, 247, 237, 0.96));
          border-color: rgba(245, 158, 11, 0.22);
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.platinum {
          background:
            radial-gradient(circle at top right, rgba(216, 180, 254, 0.46), transparent 24%),
            linear-gradient(180deg, rgba(250, 245, 255, 0.98), rgba(245, 243, 255, 0.96));
          border-color: rgba(168, 85, 247, 0.2);
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanHead small {
          color: #3b82f6;
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanBadge {
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.18);
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanPrice span {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanPrice small,
        .publicSaasLanding.publicSaasLandingLight .landingPlanCard > p {
          color: #475569;
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanList li {
          color: #334155;
          font-weight: 700;
          line-height: 1.52;
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanList li .miniIcon {
          color: #2563eb;
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.gold .landingPlanList li .miniIcon {
          color: #d97706;
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.platinum .landingPlanList li .miniIcon {
          color: #7c3aed;
        }

        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.free .landingGhostButton,
        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.silver .landingGhostButton,
        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.gold .landingGhostButton,
        .publicSaasLanding.publicSaasLandingLight .landingPlanCard.platinum .landingGhostButton {
          background: rgba(255, 255, 255, 0.96);
          border-color: rgba(148, 163, 184, 0.3);
          color: #0f172a;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
        }

        .publicSaasLanding.publicSaasLandingLight .landingSecuritySection {
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: linear-gradient(185deg, #f8fafc 0%, #eef2ff 100%);
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.06);
        }

        .publicSaasLanding.publicSaasLandingLight .landingSecurityConsole {
          background: rgba(255, 255, 255, 0.95);
        }

        .publicSaasLanding.publicSaasLandingLight .securityConsoleRow strong,
        .publicSaasLanding.publicSaasLandingLight .securityTrustList strong {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .securityConsoleRow small,
        .publicSaasLanding.publicSaasLandingLight .securityTrustList small,
        .publicSaasLanding.publicSaasLandingLight .securityConsoleFooter span {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .landingProfilesSection::after {
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.16), transparent);
        }

        .publicSaasLanding.publicSaasLandingLight .landingProfileTags span {
          background: rgba(241, 245, 249, 0.95);
          border-color: rgba(226, 232, 240, 0.95);
          color: #334155;
        }

        .publicSaasLanding.publicSaasLandingLight .landingFinalCta {
          background: linear-gradient(125deg, #ffffff 0%, #f1f5f9 48%, #eef2ff 100%);
          box-shadow: 0 22px 56px rgba(15, 23, 42, 0.06);
          transition:
            box-shadow var(--motion-slow) var(--ease-soft),
            transform var(--motion-slow) var(--ease-out-expo);
        }

        .publicSaasLanding.publicSaasLandingLight .landingFinalCta:hover {
          box-shadow:
            0 28px 64px rgba(15, 23, 42, 0.09),
            0 0 56px rgba(59, 130, 246, 0.1);
        }

        .publicSaasLanding.publicSaasLandingLight .landingHowSection {
          padding: clamp(2.25rem, 5vw, 3.75rem) clamp(1.25rem, 3vw, 2rem);
          border-radius: clamp(22px, 2.5vw, 30px);
          border: 1px solid rgba(226, 232, 240, 0.95);
          background:
            radial-gradient(circle at 10% 18%, rgba(59, 130, 246, 0.07), transparent 46%),
            linear-gradient(180deg, #ffffff, #f8fafc);
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.05);
        }

        .publicSaasLanding.publicSaasLandingLight .landingHowStep {
          border-color: rgba(226, 232, 240, 0.98);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.04);
        }

        .publicSaasLanding.publicSaasLandingLight .landingHowStep:hover {
          transform: translateY(-5px);
          border-color: rgba(147, 197, 253, 0.45);
          box-shadow:
            0 24px 52px rgba(15, 23, 42, 0.09),
            0 0 44px rgba(59, 130, 246, 0.09);
        }

        .publicSaasLanding.publicSaasLandingLight .landingHowStepBadge {
          background: rgba(219, 234, 254, 0.95);
          color: #1d4ed8;
        }

        .publicSaasLanding.publicSaasLandingLight .landingHowStepBody h3 {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .landingHowStepBody p {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .landingTrustSection {
          padding: clamp(2.25rem, 5vw, 3.5rem) clamp(1rem, 3vw, 1.5rem);
        }

        .publicSaasLanding.publicSaasLandingLight .landingTrustCard {
          border-color: rgba(226, 232, 240, 0.98);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
        }

        .publicSaasLanding.publicSaasLandingLight .landingTrustCard:hover {
          transform: translateY(-5px);
          border-color: rgba(147, 197, 253, 0.42);
          box-shadow:
            0 30px 58px rgba(15, 23, 42, 0.1),
            0 0 52px rgba(59, 130, 246, 0.1);
        }

        .publicSaasLanding.publicSaasLandingLight .landingTrustCard blockquote {
          color: #334155;
        }

        .publicSaasLanding.publicSaasLandingLight .landingTrustName {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .landingTrustMeta {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .landingTrustQuoteIcon {
          color: rgba(37, 99, 235, 0.35);
        }

        .publicSaasLanding.publicSaasLandingLight .feedInsightCard {
          border-bottom-color: rgba(226, 232, 240, 0.95);
        }

        .publicSaasLanding.publicSaasLandingLight .feedInsightCard strong {
          color: #0f172a;
        }

        .publicSaasLanding.publicSaasLandingLight .feedInsightCard p,
        .publicSaasLanding.publicSaasLandingLight .landingHeroCopy p {
          color: #64748b;
        }

        .publicSaasLanding.publicSaasLandingLight .inlineTextLink {
          color: #2563eb;
          transition:
            color var(--motion-medium) var(--ease-soft),
            transform var(--motion-medium) var(--ease-out-expo),
            filter var(--motion-medium) ease;
        }

        .publicSaasLanding.publicSaasLandingLight .inlineTextLink:hover {
          color: #1d4ed8;
          transform: translateX(3px);
          filter: brightness(1.05);
        }

        .publicSaasLanding.publicSaasLandingLight .heroPremiumTag,
        .publicSaasLanding.publicSaasLandingLight .miniPremiumPill {
          background: rgba(254, 243, 199, 0.95);
          color: #92400e;
          border-color: rgba(251, 191, 36, 0.35);
        }

        @media (prefers-reduced-motion: reduce) {
          .landingHeroAuraPrimary,
          .landingHeroAuraSecondary,
          .landingHeroRim,
          .landingBackdropGlowLeft,
          .landingBackdropGlowRight,
          .landingHeroStage,
          .landingHeroStage::before,
          .heroStageGrid,
          .heroStagePrimaryCard,
          .heroStageFeedCard,
          .heroStageNotifications,
          .heroStageMessage {
            animation: none !important;
          }

          .publicSaasLanding.publicSaasLandingLight .landingHeroSection::after {
            animation: none !important;
            opacity: 0.48 !important;
          }

          .landingPrimaryButton::after {
            display: none !important;
          }

          .landingSubtleCta .miniIcon {
            transition: none !important;
          }

          .landingSubtleCta:hover .miniIcon {
            transform: none !important;
          }

          .landingHeroCopy .landingKicker,
          .landingHeroCopy h1,
          .landingHeroCopy .landingHeroLead,
          .landingHeroCopy .landingActionRow {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }

          .publicSaasLanding.publicSaasLandingLight .landingHowStep {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
