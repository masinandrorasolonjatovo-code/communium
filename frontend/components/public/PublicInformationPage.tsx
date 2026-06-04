import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Crown,
  FileText,
  Gem,
  Globe2,
  Handshake,
  Info,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UsersRound,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import SiteFooter from '@/components/SiteFooter';
import { localizeHref } from '@/components/locale-path';
import PublicExperienceFrame from '@/components/public/PublicExperienceFrame';
import { buildAuthFlowHref, buildCheckoutHref } from '@/lib/checkout-flow';
import { buildPublicRoutes } from '@/lib/public-routes';
import type { Locale } from '@/i18n.config';

export type PublicPageKey = 'discover' | 'features' | 'premium' | 'about' | 'privacy' | 'terms' | 'contact';

type CardTone = 'blue' | 'mint' | 'slate' | 'light' | 'silver' | 'gold' | 'violet';

interface PageCard {
  eyebrow?: string;
  title: string;
  text: string;
  bullets?: string[];
  detailPill?: string;
  price?: string;
  priceLabel?: string;
  highlightTitle?: string;
  highlightText?: string;
  meta?: string;
  href?: string;
  ctaLabel?: string;
  tone?: CardTone;
  icon: typeof Globe2;
}

interface PageSection {
  eyebrow: string;
  title: string;
  lead: string;
  cards: PageCard[];
}

interface PageCopy {
  navLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  heroFacts: string[];
  sections: PageSection[];
  ctaTitle: string;
  ctaText: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}

function getPageCopy(locale: Locale, pageKey: PublicPageKey): PageCopy {
  const isFrench = locale === 'fr';
  const isArabic = locale === 'ar';
  const tr = (fr: string, en: string, ar: string) => (isFrench ? fr : isArabic ? ar : en);
  const routes = buildPublicRoutes(locale);
  const signUpHref = localizeHref(locale, '/auth/select-account-type');
  const signInHref = localizeHref(locale, '/auth/sign-in');
  const privacySettingsHref = localizeHref(locale, '/profile/settings/privacy');
  const securitySettingsHref = localizeHref(locale, '/profile/settings');
  const premiumCheckoutHref = buildCheckoutHref(locale, 'gold');

  const sharedCta = {
    ctaTitle: tr('Passez a l action.', 'Move into action.', 'Ø§Ù†ØªÙ‚Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©.'),
    ctaText: tr(
      'Communium separe bien les pages publiques, le profil prive et la partie membre pour garder une experience plus claire.',
      'Communium keeps public pages, the private profile and the member area separate for a cleaner experience.',
      'ÙŠÙØµÙ„ Communium Ø¨ÙŠÙ† Ø§Ù„ØµÙØ­Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ù…Ù„Ù Ø§Ù„Ø®Ø§Øµ ÙˆÙ…Ø³Ø§Ø­Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ù…Ù† Ø£Ø¬Ù„ ØªØ¬Ø±Ø¨Ø© Ø£ÙˆØ¶Ø­.'
    ),
    ctaPrimaryLabel: tr('Creer un compte', 'Create account', 'Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨'),
    ctaPrimaryHref: signUpHref,
    ctaSecondaryLabel: tr('Se connecter', 'Sign in', 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„'),
    ctaSecondaryHref: signInHref,
  };

  if (pageKey === 'discover') {
    return {
      navLabel: tr('Profils', 'Profiles', 'Ø§Ù„Ù…Ù„ÙØ§Øª'),
      heroEyebrow: tr('Profils', 'Profiles', 'Ø§Ù„Ù…Ù„ÙØ§Øª'),
      heroTitle: tr(
        'Des profils construits pour etre visibles.',
        'Profiles designed to be visible.',
        'Ù…Ù„ÙØ§Øª Ù…Ù‡Ù†ÙŠØ© ØµÙ…Ù…Øª Ù„ØªÙƒÙˆÙ† ÙˆØ§Ø¶Ø­Ø© ÙˆÙ…Ø±Ø¦ÙŠØ©.'
      ),
      heroText: tr(
        'Decouvrez des profils publics, des competences et des opportunites dans une interface claire.',
        'Discover public profiles, skills and opportunities in a clear interface.',
        'Ù…Ù„ÙØ§Øª Ø¹Ø§Ù…Ø© ÙˆÙ‚Ø·Ø§Ø¹Ø§Øª ÙˆÙ…Ù‡Ø§Ø±Ø§Øª ÙˆØ­Ø¶ÙˆØ± Ù…Ù‡Ù†ÙŠ Ø¯Ø§Ø®Ù„ ÙˆØ§Ø¬Ù‡Ø© ÙˆØ§Ø¶Ø­Ø© ÙˆØ¹ØµØ±ÙŠØ©.'
      ),
      heroFacts: [
        tr('Profil public controle', 'Controlled public profile', 'Ù…Ù„Ù Ø¹Ø§Ù… Ù…Ø¶Ø¨ÙˆØ·'),
        tr('CV partageable', 'Shareable CV', 'Ø³ÙŠØ±Ø© Ø°Ø§ØªÙŠØ© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ©'),
        tr('Reseau qualifie', 'Qualified network', 'Ø´Ø¨ÙƒØ© Ù…Ù‡Ù†ÙŠØ© Ù…Ø¤Ù‡Ù„Ø©'),
      ],
      sections: [
        {
          eyebrow: tr('Presence publique', 'Public presence', 'Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø¹Ø§Ù…'),
          title: tr(
            'Trois signaux qui rendent un profil credible.',
            'Three signals that make a profile credible.',
            'Ø«Ù„Ø§Ø« Ø¥Ø´Ø§Ø±Ø§Øª ØªØ¬Ø¹Ù„ Ø§Ù„Ù…Ù„Ù Ø£ÙƒØ«Ø± Ù…ØµØ¯Ø§Ù‚ÙŠØ©.'
          ),
          lead: tr('Visible, partageable et maitrise.', 'Visible, shareable and controlled.', 'ÙˆØ§Ø¶Ø­ ÙˆÙ‚Ø§Ø¨Ù„ Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ© ÙˆØªØ­Øª Ø§Ù„Ø³ÙŠØ·Ø±Ø©.'),
          cards: [
            {
              icon: Globe2,
              tone: 'blue',
              title: tr('Profil public controle', 'Controlled public profile', 'Ù…Ù„Ù Ø¹Ø§Ù… Ù…Ø¶Ø¨ÙˆØ·'),
              text: tr(
                'Une presence visible sans exposer les informations sensibles.',
                'A visible presence without exposing sensitive information.',
                'Ø­Ø¶ÙˆØ± Ø¸Ø§Ù‡Ø± Ù…Ù† Ø¯ÙˆÙ† ÙƒØ´Ù Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©.'
              ),
              bullets: [
                tr('URL claire et partageable', 'Clear and shareable URL', 'Ø±Ø§Ø¨Ø· ÙˆØ§Ø¶Ø­ ÙˆÙ‚Ø§Ø¨Ù„ Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ©'),
                tr('Lecture rapide du profil', 'Fast profile reading', 'Ù‚Ø±Ø§Ø¡Ø© Ø³Ø±ÙŠØ¹Ø© Ù„Ù„Ù…Ù„Ù'),
              ],
            },
            {
              icon: FileText,
              tone: 'light',
              title: tr('CV partageable', 'Shareable CV', 'Ø³ÙŠØ±Ø© Ø°Ø§ØªÙŠØ© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ©'),
              text: tr(
                'Un lien professionnel simple a transmettre.',
                'A professional link that stays easy to send.',
                'Ø±Ø§Ø¨Ø· Ù…Ù‡Ù†ÙŠ Ø¨Ø³ÙŠØ· ÙˆØ¬Ø§Ù‡Ø² Ù„Ù„Ø¥Ø±Ø³Ø§Ù„.'
              ),
              bullets: [
                tr('Diffusion sur permission', 'Shared with permission', 'Ù…Ø´Ø§Ø±ÙƒØ© Ø­Ø³Ø¨ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©'),
                tr('Document pret a presenter', 'Document ready to present', 'Ù…Ø³ØªÙ†Ø¯ Ø¬Ø§Ù‡Ø² Ù„Ù„ØªÙ‚Ø¯ÙŠÙ…'),
              ],
            },
            {
              icon: UsersRound,
              tone: 'mint',
              title: tr('Reseau qualifie', 'Qualified network', 'Ø´Ø¨ÙƒØ© Ù…Ù‡Ù†ÙŠØ© Ù…Ø¤Ù‡Ù„Ø©'),
              text: tr(
                'Des interactions orientees competences et opportunites.',
                'Interactions shaped around skills and opportunities.',
                'ØªÙØ§Ø¹Ù„Ø§Øª Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù‡Ø§Ø±Ø§Øª ÙˆØ§Ù„ÙØ±Øµ.'
              ),
              bullets: [
                tr('Suggestions plus pertinentes', 'More relevant suggestions', 'Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª Ø£ÙƒØ«Ø± Ø¯Ù‚Ø©'),
                tr('Presence orientee metier', 'Profession-focused presence', 'Ø­Ø¶ÙˆØ± Ù…ÙˆØ¬Ù‘Ù‡ Ù„Ù„Ù…Ø¬Ø§Ù„ Ø§Ù„Ù…Ù‡Ù†ÙŠ'),
              ],
            },
          ],
        },
        {
          eyebrow: tr('Exploration', 'Exploration', 'Ø§Ù„Ø§Ø³ØªÙƒØ´Ø§Ù'),
          title: tr(
            'Une recherche pensee pour les vraies opportunites.',
            'Search built for real opportunities.',
            'Ø¨Ø­Ø« Ù…ØµÙ…Ù… Ù„Ù„ÙØ±Øµ Ø§Ù„Ù…Ù‡Ù†ÙŠØ© Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ©.'
          ),
          lead: tr(
            'Secteurs, competences et signaux utiles dans une meme surface.',
            'Sectors, skills and useful signals gathered in one surface.',
            'Ù‚Ø·Ø§Ø¹Ø§Øª ÙˆÙ…Ù‡Ø§Ø±Ø§Øª ÙˆØ¥Ø´Ø§Ø±Ø§Øª Ù…ÙÙŠØ¯Ø© Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø­Ø© ÙˆØ§Ø­Ø¯Ø©.'
          ),
          cards: [
            {
              icon: Compass,
              tone: 'slate',
              title: tr('Recherche par secteur', 'Sector search', 'Ø¨Ø­Ø« Ø­Ø³Ø¨ Ø§Ù„Ù‚Ø·Ø§Ø¹'),
              text: tr(
                'Competences, domaines et localisations dans une grille plus nette.',
                'Skills, fields and locations inside a cleaner grid.',
                'Ù…Ù‡Ø§Ø±Ø§Øª ÙˆÙ…Ø¬Ø§Ù„Ø§Øª ÙˆÙ…ÙˆØ§Ù‚Ø¹ Ø¯Ø§Ø®Ù„ Ø´Ø¨ÙƒØ© Ø£ÙˆØ¶Ø­.'
              ),
            },
            {
              icon: Sparkles,
              tone: 'blue',
              title: tr('Suggestions ciblees', 'Targeted suggestions', 'Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª Ù…ÙˆØ¬Ù‡Ø©'),
              text: tr(
                'Des profils coherents, sans bruit inutile.',
                'Relevant profiles without unnecessary noise.',
                'Ù…Ù„ÙØ§Øª Ù…ØªÙ†Ø§Ø³Ù‚Ø© Ù…Ù† Ø¯ÙˆÙ† Ø¶Ø¬ÙŠØ¬ ØºÙŠØ± Ù…ÙÙŠØ¯.'
              ),
            },
            {
              icon: Target,
              tone: 'light',
              title: tr('Signaux professionnels', 'Professional signals', 'Ø¥Ø´Ø§Ø±Ø§Øª Ù…Ù‡Ù†ÙŠØ©'),
              text: tr(
                'Parcours, competences et activite recente au premier regard.',
                'Journey, skills and recent activity at first glance.',
                'Ø§Ù„Ù…Ø³Ø§Ø± ÙˆØ§Ù„Ù…Ù‡Ø§Ø±Ø§Øª ÙˆØ§Ù„Ù†Ø´Ø§Ø· Ø§Ù„Ø£Ø®ÙŠØ± ÙÙŠ Ù†Ø¸Ø±Ø© Ø³Ø±ÙŠØ¹Ø©.'
              ),
            },
          ],
        },
      ],
      ctaTitle: tr('Entrez dans le reseau.', 'Enter the network.', 'Ø§Ø¯Ø®Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ø´Ø¨ÙƒØ©.'),
      ctaText: tr(
        'Creez votre compte pour ouvrir les profils complets, la messagerie et la partie membre.',
        'Create your account to unlock full profiles, messaging and the member area.',
        'Ø£Ù†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ùƒ Ù„ÙØªØ­ Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„ÙƒØ§Ù…Ù„Ø© ÙˆØ§Ù„Ø±Ø³Ø§Ø¦Ù„ ÙˆÙ…Ø³Ø§Ø­Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡.'
      ),
      ctaPrimaryLabel: tr('Creer un compte', 'Create account', 'Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨'),
      ctaPrimaryHref: signUpHref,
      ctaSecondaryLabel: tr('Se connecter', 'Sign in', 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„'),
      ctaSecondaryHref: signInHref,
    };
  }

  if (pageKey === 'features') {
    return {
      navLabel: tr('Communaute', 'Community', 'Ø§Ù„Ù…Ø¬ØªÙ…Ø¹'),
      heroEyebrow: tr('Communaute', 'Community', 'Ø§Ù„Ù…Ø¬ØªÙ…Ø¹'),
      heroTitle: tr(
        'Des echanges utiles autour de profils actifs.',
        'Useful exchanges around active profiles.',
        'Ù…Ø¬ØªÙ…Ø¹ Ù…Ù‡Ù†ÙŠ Ù…Ø¨Ù†ÙŠ Ø­ÙˆÙ„ Ø§Ù„Ù…Ù„ÙØ§Øª ÙˆØ§Ù„ÙØ±Øµ.'
      ),
      heroText: tr(
        'Publications, recommandations et interactions professionnelles dans un espace structure.',
        'Publications, recommendations and professional interactions in a structured space.',
        'Ù…Ù†Ø´ÙˆØ±Ø§Øª ÙˆÙ…Ù„ÙØ§Øª ÙˆØªÙˆØµÙŠØ§Øª ÙˆØªÙØ§Ø¹Ù„Ø§Øª Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø­Ø© Ù…ØµÙ…Ù…Ø© Ù„Ù„ØªØ¨Ø§Ø¯Ù„ Ø§Ù„Ù…Ù‡Ù†ÙŠ.'
      ),
      heroFacts: [
        tr('Publication recente', 'Recent publication', 'Ù…Ù†Ø´ÙˆØ± Ø­Ø¯ÙŠØ«'),
        tr('Connexions pertinentes', 'Relevant connections', 'Ø§ØªØµØ§Ù„Ø§Øª Ù…Ù†Ø§Ø³Ø¨Ø©'),
        tr('Presence active', 'Active presence', 'Ø­Ø¶ÙˆØ± Ù†Ø´Ø·'),
      ],
      sections: [
        {
          eyebrow: tr('Activite du reseau', 'Network activity', 'Ù†Ø´Ø§Ø· Ø§Ù„Ø´Ø¨ÙƒØ©'),
          title: tr(
            'Une activite professionnelle visible et credible.',
            'Professional activity that stays visible and credible.',
            'Ù†Ø´Ø§Ø· Ù…Ù‡Ù†ÙŠ ÙˆØ§Ø¶Ø­ ÙˆÙ…ÙˆØ«ÙˆÙ‚.'
          ),
          lead: tr(
            'Profils, publications, opportunites et discussions dans une meme surface plus lisible.',
            'Profiles, posts, opportunities and discussions gathered in one clearer surface.',
            'Ù…Ù„ÙØ§Øª ÙˆÙ…Ù†Ø´ÙˆØ±Ø§Øª ÙˆÙØ±Øµ ÙˆÙ†Ù‚Ø§Ø´Ø§Øª Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø­Ø© ÙˆØ§Ø­Ø¯Ø© Ø£ÙƒØ«Ø± ÙˆØ¶ÙˆØ­Ø§Ù‹.'
          ),
          cards: [
            {
              icon: MessageSquareText,
              tone: 'blue',
              title: tr('Publication recente', 'Recent publication', 'Ù…Ù†Ø´ÙˆØ± Ø­Ø¯ÙŠØ«'),
              text: tr(
                'Mise a jour produit, partage d experience ou annonce professionnelle.',
                'Product update, shared experience or professional announcement.',
                'ØªØ­Ø¯ÙŠØ« Ù…Ù†ØªØ¬ Ø£Ùˆ Ù…Ø´Ø§Ø±ÙƒØ© ØªØ¬Ø±Ø¨Ø© Ø£Ùˆ Ø¥Ø¹Ù„Ø§Ù† Ù…Ù‡Ù†ÙŠ.'
              ),
            },
            {
              icon: UsersRound,
              tone: 'light',
              title: tr('Connexions pertinentes', 'Relevant connections', 'Ø§ØªØµØ§Ù„Ø§Øª Ù…Ù†Ø§Ø³Ø¨Ø©'),
              text: tr(
                'Suggestions basees sur les domaines, competences et interactions.',
                'Suggestions based on fields, skills and interactions.',
                'Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø¬Ø§Ù„Ø§Øª ÙˆØ§Ù„Ù…Ù‡Ø§Ø±Ø§Øª ÙˆØ§Ù„ØªÙØ§Ø¹Ù„.'
              ),
            },
            {
              icon: Sparkles,
              tone: 'mint',
              title: tr('Presence active', 'Active presence', 'Ø­Ø¶ÙˆØ± Ù†Ø´Ø·'),
              text: tr(
                'Le profil reste visible grace aux publications et interactions utiles.',
                'The profile stays visible through useful publications and interactions.',
                'ÙŠØ¨Ù‚Ù‰ Ø§Ù„Ù…Ù„Ù Ù…Ø±Ø¦ÙŠØ§Ù‹ Ø¨ÙØ¶Ù„ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª ÙˆØ§Ù„ØªÙØ§Ø¹Ù„Ø§Øª Ø§Ù„Ù…ÙÙŠØ¯Ø©.'
              ),
            },
          ],
        },
        {
          eyebrow: tr('Surface pro', 'Professional surface', 'ÙˆØ§Ø¬Ù‡Ø© Ù…Ù‡Ù†ÙŠØ©'),
          title: tr(
            'Un fil plus clair, un reseau plus utile.',
            'A clearer feed, a more useful network.',
            'Ø®Ù„Ø§ØµØ© Ø£ÙˆØ¶Ø­ ÙˆØ´Ø¨ÙƒØ© Ø£ÙƒØ«Ø± ÙØ§Ø¦Ø¯Ø©.'
          ),
          lead: tr(
            'Suggestions, secteurs et opportunites dans une interface plus sobre.',
            'Suggestions, sectors and opportunities inside a quieter interface.',
            'Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª ÙˆÙ‚Ø·Ø§Ø¹Ø§Øª ÙˆÙØ±Øµ Ø¯Ø§Ø®Ù„ ÙˆØ§Ø¬Ù‡Ø© Ø£ÙƒØ«Ø± Ù‡Ø¯ÙˆØ¡Ø§Ù‹.'
          ),
          cards: [
            {
              icon: Handshake,
              tone: 'slate',
              title: tr('Discussions professionnelles', 'Professional discussions', 'Ù†Ù‚Ø§Ø´Ø§Øª Ù…Ù‡Ù†ÙŠØ©'),
              text: tr(
                'Des echanges construits autour des projets, recrutements et retours d experience.',
                'Conversations built around projects, hiring and shared experience.',
                'Ù†Ù‚Ø§Ø´Ø§Øª Ù…Ø¨Ù†ÙŠØ© Ø­ÙˆÙ„ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØ§Ù„ØªÙˆØ¸ÙŠÙ ÙˆØªØ¨Ø§Ø¯Ù„ Ø§Ù„Ø®Ø¨Ø±Ø§Øª.'
              ),
            },
            {
              icon: Compass,
              tone: 'blue',
              title: tr('Secteurs actifs', 'Active sectors', 'Ù‚Ø·Ø§Ø¹Ø§Øª Ù†Ø´Ø·Ø©'),
              text: tr(
                'Produit, data, design, recrutement et operations dans un meme parcours de lecture.',
                'Product, data, design, hiring and operations in the same reading path.',
                'Ø§Ù„Ù…Ù†ØªØ¬ ÙˆØ§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ§Ù„ØªØµÙ…ÙŠÙ… ÙˆØ§Ù„ØªÙˆØ¸ÙŠÙ ÙˆØ§Ù„Ø¹Ù…Ù„ÙŠØ§Øª ÙÙŠ Ù…Ø³Ø§Ø± Ù‚Ø±Ø§Ø¡Ø© ÙˆØ§Ø­Ø¯.'
              ),
            },
            {
              icon: Target,
              tone: 'mint',
              title: tr('Opportunites visibles', 'Visible opportunities', 'ÙØ±Øµ Ø¸Ø§Ù‡Ø±Ø©'),
              text: tr(
                'Mentorat, missions, postes et collaborations plus faciles a reperer.',
                'Mentoring, roles, missions and collaborations surfaced more clearly.',
                'Ø¥Ø±Ø´Ø§Ø¯ ÙˆÙ…Ù‡Ø§Ù… ÙˆÙˆØ¸Ø§Ø¦Ù ÙˆØªØ¹Ø§ÙˆÙ†Ø§Øª ÙŠØ³Ù‡Ù„ Ø±ØµØ¯Ù‡Ø§.'
              ),
            },
          ],
        },
      ],
      ctaTitle: tr('Entrez dans la partie membre.', 'Enter the member area.', 'Ø§Ø¯Ø®Ù„ Ø¥Ù„Ù‰ Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡.'),
      ctaText: tr(
        'Ouvrez les profils complets, les messages et les recommandations en creant votre compte.',
        'Open full profiles, messaging and recommendations by creating your account.',
        'Ø§ÙØªØ­ Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„ÙƒØ§Ù…Ù„Ø© ÙˆØ§Ù„Ø±Ø³Ø§Ø¦Ù„ ÙˆØ§Ù„ØªÙˆØµÙŠØ§Øª Ø¹Ø¨Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨Ùƒ.'
      ),
      ctaPrimaryLabel: tr('Creer un compte', 'Create account', 'Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨'),
      ctaPrimaryHref: signUpHref,
      ctaSecondaryLabel: tr('Se connecter', 'Sign in', 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„'),
      ctaSecondaryHref: signInHref,
    };
  }

  if (pageKey === 'premium') {
    return {
      navLabel: 'Premium',
      heroEyebrow: 'Premium',
      heroTitle: tr(
        'Renforcez votre visibilite professionnelle.',
        'Strengthen your professional visibility.',
        'Ù…Ø²ÙŠØ¯ Ù…Ù† Ø§Ù„Ø¸Ù‡ÙˆØ±. Ù…Ø²ÙŠØ¯ Ù…Ù† Ø§Ù„ÙØ±Øµ.'
      ),
      heroText: tr(
        'Les abonnements Premium renforcent la diffusion, la presence reseau et les opportunites professionnelles.',
        'Premium plans strengthen distribution, network presence and professional opportunities.',
        'ØªØ¹Ø²Ø² Ø§Ø´ØªØ±Ø§ÙƒØ§Øª Premium Ø§Ù„Ø§Ù†ØªØ´Ø§Ø± ÙˆØ§Ù„Ø¸Ù‡ÙˆØ± Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ© ÙˆØ§Ù„ÙØ±Øµ Ø§Ù„Ù…Ù‡Ù†ÙŠØ©.'
      ),
      heroFacts: [
        tr('Diffusion prioritaire', 'Priority distribution', 'Ø§Ù†ØªØ´Ø§Ø± Ø¨Ø£ÙˆÙ„ÙˆÙŠØ©'),
        tr('Suggestions renforcees', 'Stronger suggestions', 'Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª Ø£Ù‚ÙˆÙ‰'),
        tr('Presence plus visible', 'More visible presence', 'Ø­Ø¶ÙˆØ± Ø£ÙƒØ«Ø± ÙˆØ¶ÙˆØ­Ø§Ù‹'),
      ],
      sections: [
        {
          eyebrow: tr('Offres', 'Plans', 'Ø§Ù„Ø¹Ø±ÙˆØ¶'),
          title: tr(
            'Quatre niveaux pour renforcer votre presence.',
            'Four levels to strengthen your presence.',
            'Ø£Ø±Ø¨Ø¹Ø© Ù…Ø³ØªÙˆÙŠØ§Øª Ù„ØªØ¹Ø²ÙŠØ² Ø­Ø¶ÙˆØ±Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ.'
          ),
          lead: tr(
            'Une progression claire entre base professionnelle, diffusion renforcee et presence prioritaire.',
            'A clear progression from professional base to stronger distribution and priority presence.',
            'ØªØ¯Ø±Ø¬ ÙˆØ§Ø¶Ø­ Ø¨ÙŠÙ† Ø§Ù„Ø£Ø³Ø§Ø³ Ø§Ù„Ù…Ù‡Ù†ÙŠ ÙˆØ§Ù„Ø§Ù†ØªØ´Ø§Ø± Ø§Ù„Ù…Ø¹Ø²Ø² ÙˆØ§Ù„Ø­Ø¶ÙˆØ± Ø°ÙŠ Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©.'
          ),
          cards: [
            {
              icon: ShieldCheck,
              tone: 'light',
              eyebrow: 'FREE',
              title: tr('Base professionnelle', 'Professional base', 'Ù‚Ø§Ø¹Ø¯Ø© Ù…Ù‡Ù†ÙŠØ©'),
              detailPill: tr('Essentiel', 'Essential', 'Ø£Ø³Ø§Ø³ÙŠ'),
              price: isFrench ? '0 DH' : isArabic ? '0 Ø¯Ø±Ù‡Ù…' : '0 MAD',
              priceLabel: tr('Plan gratuit', 'Free plan', ''),
              text: tr(
                'Les outils essentiels pour creer une presence propre et credible.',
                'The essential tools to build a clean and credible presence.',
                'Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù„Ø¨Ù†Ø§Ø¡ Ø­Ø¶ÙˆØ± Ù…Ù‡Ù†ÙŠ ÙˆØ§Ø¶Ø­ ÙˆÙ…ÙˆØ«ÙˆÙ‚.'
              ),
              highlightTitle: tr('Base stable', 'Stable base', 'Ø£Ø³Ø§Ø³ Ø«Ø§Ø¨Øª'),
              highlightText: tr(
                'Le profil pose une base claire pour la confidentialite, le CV et la premiere impression.',
                'A clear base for privacy, resume sharing and first impression.',
                'ÙŠÙ…Ù†Ø­ Ø§Ù„Ù…Ù„Ù Ø£Ø³Ø§Ø³Ø§Ù‹ ÙˆØ§Ø¶Ø­Ø§Ù‹ Ù„Ù„Ø®ØµÙˆØµÙŠØ© ÙˆØ§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© ÙˆØ§Ù„Ø§Ù†Ø·Ø¨Ø§Ø¹ Ø§Ù„Ø£ÙˆÙ„.'
              ),
              bullets: [
                tr('Profil pro de base', 'Base professional profile', 'Ù…Ù„Ù Ù…Ù‡Ù†ÙŠ Ø£Ø³Ø§Ø³ÙŠ'),
                tr('Confidentialite par champ', 'Field-level privacy', 'Ø®ØµÙˆØµÙŠØ© Ø­Ø³Ø¨ Ø§Ù„Ø­Ù‚Ù„'),
                tr('Acces a l espace membre', 'Access to member space', 'Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¥Ù„Ù‰ Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡'),
              ],
              href: signUpHref,
              ctaLabel: tr('Creer mon profil', 'Create my profile', 'Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„ÙÙŠ'),
            },
            {
              icon: Sparkles,
              tone: 'silver',
              eyebrow: tr('PACK SILVER', 'SILVER PACK', 'Ø¨Ø§Ù‚Ø© SILVER'),
              title: tr('Visibilite initiale', 'Initial visibility', 'Ø¸Ù‡ÙˆØ± Ø£ÙˆÙ„ÙŠ'),
              detailPill: tr('30 jours', '30 days', '30 ÙŠÙˆÙ…Ø§Ù‹'),
              price: isFrench ? '0 DH' : isArabic ? '0 Ø¯Ø±Ù‡Ù…' : '0 MAD',
              priceLabel: tr('Offre Silver 30 jours', 'Silver 30-day offer', 'Ø¹Ø±Ø¶ Silver Ù„Ù…Ø¯Ø© 30 ÙŠÙˆÙ…Ø§Ù‹'),
              text: tr(
                'Une presence plus active pour commencer a developper son reseau.',
                'A more active presence to start building your network.',
                'Ø­Ø¶ÙˆØ± Ø£ÙƒØ«Ø± Ù†Ø´Ø§Ø·Ø§Ù‹ Ù„Ø¨Ø¯Ø¡ ØªØ·ÙˆÙŠØ± Ø´Ø¨ÙƒØªÙƒ.'
              ),
              highlightTitle: tr('Visibilite initiale', 'Initial visibility', 'Ø¸Ù‡ÙˆØ± Ø£ÙˆÙ„ÙŠ'),
              highlightText: tr(
                'Le profil gagne en lisibilite, en premier signal reseau et en diffusion de depart.',
                'The profile gains readability, first network signals and early distribution.',
                'ÙŠÙƒØªØ³Ø¨ Ø§Ù„Ù…Ù„Ù ÙˆØ¶ÙˆØ­Ø§Ù‹ Ø£ÙƒØ¨Ø± ÙˆØ¥Ø´Ø§Ø±Ø© Ø£ÙˆÙ„Ù‰ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ© ÙˆØ§Ù†ØªØ´Ø§Ø±Ø§Ù‹ Ù…Ù‡Ù†ÙŠØ§Ù‹ Ø£ÙˆÙ„ÙŠØ§Ù‹.'
              ),
              bullets: [
                tr('Essai gratuit 30 jours', '30-day free trial', 'ØªØ¬Ø±Ø¨Ø© Ù…Ø¬Ø§Ù†ÙŠØ© Ù„Ù…Ø¯Ø© 30 ÙŠÙˆÙ…Ø§Ù‹'),
                tr('Reseau essentiel actif', 'Essential network active', 'Ø´Ø¨ÙƒØ© Ø£Ø³Ø§Ø³ÙŠØ© Ù†Ø´Ø·Ø©'),
                tr('Activation rapide du profil', 'Fast profile activation', 'ØªÙØ¹ÙŠÙ„ Ø³Ø±ÙŠØ¹ Ù„Ù„Ù…Ù„Ù'),
              ],
              href: buildAuthFlowHref(locale, 'sign-up', 'silver'),
              ctaLabel: tr('Decouvrir Silver', 'Explore Silver', 'Ø§ÙƒØªØ´Ù Silver'),
            },
            {
              icon: Crown,
              tone: 'gold',
              eyebrow: tr('PACK GOLD', 'GOLD PACK', 'Ø¨Ø§Ù‚Ø© GOLD'),
              title: tr('Diffusion renforcee', 'Stronger distribution', 'Ø§Ù†ØªØ´Ø§Ø± Ù…Ø¹Ø²Ø²'),
              detailPill: tr('Plus visible', 'More visible', 'Ø£ÙƒØ«Ø± Ø¸Ù‡ÙˆØ±Ø§Ù‹'),
              price: isFrench ? '250 DH' : isArabic ? '250 Ø¯Ø±Ù‡Ù…' : '250 MAD',
              priceLabel: tr('Abonnement Gold', 'Gold subscription', 'Ø§Ø´ØªØ±Ø§Ùƒ Gold'),
              text: tr(
                'Plus de visibilite dans les suggestions, publications et opportunites.',
                'More visibility across suggestions, publications and opportunities.',
                'Ø¸Ù‡ÙˆØ± Ø£ÙƒØ¨Ø± Ø¯Ø§Ø®Ù„ Ø§Ù„Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª ÙˆØ§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª ÙˆØ§Ù„ÙØ±Øµ.'
              ),
              highlightTitle: tr('Diffusion renforcee', 'Stronger distribution', 'Ø§Ù†ØªØ´Ø§Ø± Ù…Ø¹Ø²Ø²'),
              highlightText: tr(
                'Le profil ressort davantage dans le reseau et capte un signal plus fort.',
                'The profile stands out more across the network and gains a stronger signal.',
                'ÙŠØ¨Ø±Ø² Ø§Ù„Ù…Ù„Ù Ø¨Ø´ÙƒÙ„ Ø£ÙˆØ¶Ø­ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ© ÙˆÙŠØ­ØµÙ„ Ø¹Ù„Ù‰ Ø¥Ø´Ø§Ø±Ø© Ù…Ù‡Ù†ÙŠØ© Ø£Ù‚ÙˆÙ‰.'
              ),
              bullets: [
                tr('Apparition prioritaire', 'Priority appearance', 'Ø¸Ù‡ÙˆØ± Ø¨Ø£ÙˆÙ„ÙˆÙŠØ©'),
                tr('Suggestions renforcees', 'Stronger suggestions', 'Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª Ù…Ø¹Ø²Ø²Ø©'),
                tr('Opportunites plus visibles', 'More visible opportunities', 'ÙØ±Øµ Ø£ÙƒØ«Ø± ÙˆØ¶ÙˆØ­Ø§Ù‹'),
              ],
              href: buildAuthFlowHref(locale, 'sign-up', 'gold'),
              ctaLabel: tr('Decouvrir Gold', 'Discover Gold', 'Ø§ÙƒØªØ´Ù Gold'),
            },
            {
              icon: Gem,
              tone: 'violet',
              eyebrow: tr('PACK PLATINUM', 'PLATINUM PACK', 'Ø¨Ø§Ù‚Ø© PLATINUM'),
              title: tr('Presence prioritaire', 'Priority presence', 'Ø­Ø¶ÙˆØ± Ø¨Ø£ÙˆÙ„ÙˆÙŠØ©'),
              detailPill: tr('Elite', 'Elite', 'Ù†Ø®Ø¨Ø©'),
              price: isFrench ? '500 DH' : isArabic ? '500 Ø¯Ø±Ù‡Ù…' : '500 MAD',
              priceLabel: tr('Abonnement Platinum', 'Platinum subscription', 'Ø§Ø´ØªØ±Ø§Ùƒ Platinum'),
              text: tr(
                'Une visibilite maximale et des outils avances pour les profils les plus actifs.',
                'Maximum visibility and advanced tools for the most active profiles.',
                'Ø£Ù‚ØµÙ‰ Ù…Ø³ØªÙˆÙ‰ Ù…Ù† Ø§Ù„Ø¸Ù‡ÙˆØ± ÙˆØ£Ø¯ÙˆØ§Øª Ù…ØªÙ‚Ø¯Ù…Ø© Ù„Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ø£ÙƒØ«Ø± Ù†Ø´Ø§Ø·Ø§Ù‹.'
              ),
              highlightTitle: tr('Presence prioritaire', 'Priority presence', 'Ø­Ø¶ÙˆØ± Ø°Ùˆ Ø£ÙˆÙ„ÙˆÙŠØ©'),
              highlightText: tr(
                'Le profil gagne une diffusion plus forte, une priorite claire et une presence plus prestigieuse.',
                'The profile gains stronger distribution, clear priority and a more premium presence.',
                'ÙŠÙƒØªØ³Ø¨ Ø§Ù„Ù…Ù„Ù Ø§Ù†ØªØ´Ø§Ø±Ø§Ù‹ Ø£Ù‚ÙˆÙ‰ ÙˆØ£ÙˆÙ„ÙˆÙŠØ© ÙˆØ§Ø¶Ø­Ø© ÙˆØ­Ø¶ÙˆØ±Ø§Ù‹ Ø£ÙƒØ«Ø± ØªÙ…ÙŠØ²Ø§Ù‹.'
              ),
              bullets: [
                tr('Diffusion premium du profil', 'Premium profile distribution', 'Ø§Ù†ØªØ´Ø§Ø± Premium Ù„Ù„Ù…Ù„Ù'),
                tr('Priorite maximale', 'Maximum priority', 'Ø£ÙˆÙ„ÙˆÙŠØ© Ù‚ØµÙˆÙ‰'),
                tr('Image plus influente', 'More influential image', 'ØµÙˆØ±Ø© Ù…Ù‡Ù†ÙŠØ© Ø£ÙƒØ«Ø± ØªØ£Ø«ÙŠØ±Ø§Ù‹'),
              ],
              href: buildAuthFlowHref(locale, 'sign-up', 'platinum'),
              ctaLabel: tr('Activer Platinum', 'Activate Platinum', 'ØªÙØ¹ÙŠÙ„ Platinum'),
            },
          ],
        },
        {
          eyebrow: tr('Pourquoi Premium', 'Why Premium', 'Ù„Ù…Ø§Ø°Ø§ Premium'),
          title: tr(
            'Une visibilite qui se voit dans le reseau.',
            'Visibility that shows up across the network.',
            'Ø¸Ù‡ÙˆØ± ÙŠÙ†Ø¹ÙƒØ³ ÙØ¹Ù„Ø§Ù‹ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©.'
          ),
          lead: tr(
            'Diffusion, recommandations et signaux d activite dans une meme logique de presence.',
            'Distribution, recommendations and activity signals inside one presence strategy.',
            'Ø§Ù†ØªØ´Ø§Ø± ÙˆØªÙˆØµÙŠØ§Øª ÙˆØ¥Ø´Ø§Ø±Ø§Øª Ù†Ø´Ø§Ø· Ø¯Ø§Ø®Ù„ Ù…Ù†Ø·Ù‚ ÙˆØ§Ø­Ø¯ Ù„Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ù…Ù‡Ù†ÙŠ.'
          ),
          cards: [
            {
              icon: ShieldCheck,
              tone: 'blue',
              title: tr('Visibilite renforcee', 'Stronger visibility', 'Ø¸Ù‡ÙˆØ± Ù…Ø¹Ø²Ø²'),
              text: tr(
                'Apparition prioritaire, recommandations renforcees et diffusion plus large.',
                'Priority appearance, stronger recommendations and wider distribution.',
                'Ø¸Ù‡ÙˆØ± Ø¨Ø£ÙˆÙ„ÙˆÙŠØ© ÙˆØ§Ù‚ØªØ±Ø§Ø­Ø§Øª Ø£Ù‚ÙˆÙ‰ ÙˆØ§Ù†ØªØ´Ø§Ø± Ø£ÙˆØ³Ø¹ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©.'
              ),
              bullets: isFrench
                ? ['Profil plus souvent recommande', 'Portee publication renforcee', 'Presence plus visible']
                : isArabic
                  ? ['Ø§Ù„Ù…Ù„Ù ÙŠÙˆØµÙ‰ Ø¨Ù‡ Ø£ÙƒØ«Ø±', 'ÙˆØµÙˆÙ„ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø£Ù‚ÙˆÙ‰', 'Ø­Ø¶ÙˆØ± Ø£ÙƒØ«Ø± ÙˆØ¶ÙˆØ­Ø§Ù‹']
                  : ['Profile recommended more often', 'Stronger post reach', 'More visible presence'],
            },
            {
              icon: Target,
              tone: 'mint',
              title: tr('Opportunites mieux ciblees', 'Better-targeted opportunities', 'ÙØ±Øµ Ø£ÙƒØ«Ø± Ø¯Ù‚Ø©'),
              text: tr(
                'Profils mis en avant, recommandations professionnelles et acces plus direct aux opportunites.',
                'Highlighted profiles, stronger recommendations and more direct access to opportunities.',
                'Ù…Ù„ÙØ§Øª Ù…Ø¨Ø±Ø²Ø© ÙˆØªÙˆØµÙŠØ§Øª Ù…Ù‡Ù†ÙŠØ© Ø£ÙˆØ¶Ø­ ÙˆÙˆØµÙˆÙ„ Ø£Ø³Ø±Ø¹ Ø¥Ù„Ù‰ Ø§Ù„ÙØ±Øµ.'
              ),
              bullets: isFrench
                ? ['Visibilite reseau plus forte', 'Acces prioritaire aux opportunites', 'Recommandations mieux orientees']
                : isArabic
                  ? ['Ø¸Ù‡ÙˆØ± Ø£Ù‚ÙˆÙ‰ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©', 'Ø£ÙˆÙ„ÙˆÙŠØ© ÙÙŠ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„ÙØ±Øµ', 'ØªÙˆØµÙŠØ§Øª Ø£ÙƒØ«Ø± Ø¯Ù‚Ø©']
                  : ['Stronger network visibility', 'Priority access to opportunities', 'Better-directed recommendations'],
            },
            {
              icon: LayoutDashboard,
              tone: 'slate',
              title: tr('Signaux d activite lisibles', 'Readable activity signals', 'Ø¥Ø´Ø§Ø±Ø§Øª Ù†Ø´Ø§Ø· ÙˆØ§Ø¶Ø­Ø©'),
              text: tr(
                'Vues profil, portee publication, interactions et activite restent visibles sans surcharger l interface.',
                'Profile views, post reach, interactions and activity remain visible without overloading the interface.',
                'ØªØ¨Ù‚Ù‰ Ø§Ù„Ù…Ø´Ø§Ù‡Ø¯Ø§Øª ÙˆØ§Ù„ÙˆØµÙˆÙ„ ÙˆØ§Ù„ØªÙØ§Ø¹Ù„Ø§Øª ÙˆØ§Ù„Ù†Ø´Ø§Ø· Ù…Ø±Ø¦ÙŠØ© Ù…Ù† Ø¯ÙˆÙ† Ø¥Ø±Ø¨Ø§Ùƒ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©.'
              ),
              bullets: isFrench
                ? ['Vues profil suivies', 'Portee publication visible', 'Connexions et activite actives']
                : isArabic
                  ? ['Ù…Ø´Ø§Ù‡Ø¯Ø§Øª Ø§Ù„Ù…Ù„Ù Ù…ØªØªØ¨Ø¹Ø©', 'ÙˆØµÙˆÙ„ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª ÙˆØ§Ø¶Ø­', 'Ø§ØªØµØ§Ù„Ø§Øª ÙˆÙ†Ø´Ø§Ø· Ù…Ø³ØªÙ…Ø±Ø§Ù†']
                  : ['Tracked profile views', 'Visible post reach', 'Active connections and activity'],
            },
          ],
        },
      ],
      ctaTitle: tr(
        'Renforcez votre presence quand vous etes pret.',
        'Strengthen your presence when you are ready.',
        'Ø¹Ø²Ø² Ø­Ø¶ÙˆØ±Ùƒ Ø¹Ù†Ø¯Ù…Ø§ ØªÙƒÙˆÙ† Ø¬Ø§Ù‡Ø²Ø§Ù‹.'
      ),
      ctaText: tr(
        'Gold accelere la diffusion. Platinum ouvre le niveau le plus visible du reseau.',
        'Gold accelerates distribution. Platinum opens the most visible level of the network.',
        'ÙŠØ³Ø±Ù‘Ø¹ Gold Ø§Ù„Ø§Ù†ØªØ´Ø§Ø±ØŒ ÙˆÙŠÙ…Ù†Ø­Ùƒ Platinum Ø£Ø¹Ù„Ù‰ Ù…Ø³ØªÙˆÙ‰ Ù…Ù† Ø§Ù„Ø¸Ù‡ÙˆØ± Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©.'
      ),
      ctaPrimaryLabel: tr('Decouvrir Gold', 'Discover Gold', 'Ø§ÙƒØªØ´Ù Gold'),
      ctaPrimaryHref: buildAuthFlowHref(locale, 'sign-up', 'gold'),
      ctaSecondaryLabel: tr('Activer Platinum', 'Activate Platinum', 'ØªÙØ¹ÙŠÙ„ Platinum'),
      ctaSecondaryHref: buildAuthFlowHref(locale, 'sign-up', 'platinum'),
    };
  }

  if (pageKey === 'about') {
    return {
      navLabel: tr('A propos', 'About', 'Ø­ÙˆÙ„'),
      heroEyebrow: tr('A propos', 'About', 'Ø­ÙˆÙ„'),
      heroTitle: tr(
        'Une plateforme construite pour une presence plus credible.',
        'A platform built for a more credible presence.',
        'Ù…Ù†ØµØ© Ù…ØµÙ…Ù…Ø© Ù„Ø¨Ù†Ø§Ø¡ Ø­Ø¶ÙˆØ± Ù…Ù‡Ù†ÙŠ Ø£ÙƒØ«Ø± Ù…ØµØ¯Ø§Ù‚ÙŠØ©.'
      ),
      heroText: tr(
        'Communium structure l identite professionnelle, la visibilite et la confiance dans une meme surface produit.',
        'Communium structures professional identity, visibility and trust inside one product surface.',
        'ÙŠÙ†Ø¸Ù… Communium Ø§Ù„Ù‡ÙˆÙŠØ© Ø§Ù„Ù…Ù‡Ù†ÙŠØ© ÙˆØ§Ù„Ø¸Ù‡ÙˆØ± ÙˆØ§Ù„Ø«Ù‚Ø© Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø­Ø© Ù…Ù†ØªØ¬ ÙˆØ§Ø­Ø¯Ø©.'
      ),
      heroFacts: [
        tr('Identite professionnelle', 'Professional identity', 'Ù‡ÙˆÙŠØ© Ù…Ù‡Ù†ÙŠØ©'),
        tr('Visibilite maitrisee', 'Controlled visibility', 'Ø¸Ù‡ÙˆØ± Ù…Ø¶Ø¨ÙˆØ·'),
        tr('Separation public / prive', 'Public / private separation', 'ÙØµÙ„ Ø§Ù„Ø¹Ø§Ù… Ø¹Ù† Ø§Ù„Ø®Ø§Øµ'),
      ],
      sections: [
        {
          eyebrow: tr('Mission', 'Mission', 'Ø§Ù„Ø±Ø¤ÙŠØ©'),
          title: tr('Une presence qui inspire confiance.', 'A presence that inspires trust.', 'Ø­Ø¶ÙˆØ± ÙŠØ¨Ù†ÙŠ Ø§Ù„Ø«Ù‚Ø©.'),
          lead: tr(
            'Le produit va plus loin qu un simple profil et construit une presence professionnelle durable.',
            'The product goes beyond a simple profile and builds a lasting professional presence.',
            'ÙŠØªØ¬Ø§ÙˆØ² Ø§Ù„Ù…Ù†ØªØ¬ ÙÙƒØ±Ø© Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø¨Ø³ÙŠØ· Ù„ÙŠØ¨Ù†ÙŠ Ø­Ø¶ÙˆØ±Ø§Ù‹ Ù…Ù‡Ù†ÙŠØ§Ù‹ Ø·ÙˆÙŠÙ„ Ø§Ù„Ø£Ø«Ø±.'
          ),
          cards: [
            {
              icon: Target,
              tone: 'blue',
              title: tr('Une identite claire', 'A clear identity', 'Ù‡ÙˆÙŠØ© ÙˆØ§Ø¶Ø­Ø©'),
              text: tr(
                'Nom, profession, parcours, CV, publications et URL publique dans un ensemble coherent.',
                'Name, profession, experience, resume, publications and public URL in one coherent whole.',
                'Ø§Ù„Ø§Ø³Ù… ÙˆØ§Ù„Ù…Ù‡Ù†Ø© ÙˆØ§Ù„Ù…Ø³Ø§Ø± ÙˆØ§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© ÙˆØ§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª ÙˆØ§Ù„Ø±Ø§Ø¨Ø· Ø§Ù„Ø¹Ø§Ù… Ø¯Ø§Ø®Ù„ Ø¨Ù†ÙŠØ© ÙˆØ§Ø­Ø¯Ø© Ù…ØªÙ…Ø§Ø³ÙƒØ©.'
              ),
            },
            {
              icon: ShieldCheck,
              tone: 'mint',
              title: tr('Une confiance mieux geree', 'Better-managed trust', 'Ø«Ù‚Ø© Ø£ÙƒØ«Ø± Ø¶Ø¨Ø·Ø§Ù‹'),
              text: tr(
                'Verification, confidentialite et regles d exposition mieux controlees.',
                'Verification, privacy and exposure rules are better controlled.',
                'Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„Ø®ØµÙˆØµÙŠØ© ÙˆÙ‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø¸Ù‡ÙˆØ± ØªØ¨Ù‚Ù‰ Ø£ÙƒØ«Ø± ØªØ­ÙƒÙ…Ø§Ù‹ ÙˆØ¯Ù‚Ø©.'
              ),
            },
            {
              icon: Handshake,
              tone: 'light',
              title: tr('Un vrai reseau professionnel', 'A real professional network', 'Ø´Ø¨ÙƒØ© Ù…Ù‡Ù†ÙŠØ© Ø­Ù‚ÙŠÙ‚ÙŠØ©'),
              text: tr(
                'Suggestions, publications, premium et opportunites dans une logique business.',
                'Suggestions, publications, premium and opportunities in a business-oriented logic.',
                'Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª ÙˆÙ…Ù†Ø´ÙˆØ±Ø§Øª ÙˆÙ…ÙŠØ²Ø§Øª Premium ÙˆÙØ±Øµ Ø¯Ø§Ø®Ù„ Ù…Ù†Ø·Ù‚ Ù…Ù‡Ù†ÙŠ ÙˆØ§Ø¶Ø­.'
              ),
            },
          ],
        },
        {
          eyebrow: tr('Positionnement', 'Positioning', 'Ø§Ù„ØªÙ…ÙˆØ¶Ø¹'),
          title: tr(
            'Un produit pense pour la visibilite professionnelle.',
            'A product designed for professional visibility.',
            'Ù…Ù†ØªØ¬ Ù…ØµÙ…Ù… Ù„Ù„Ø¸Ù‡ÙˆØ± Ø§Ù„Ù…Ù‡Ù†ÙŠ.'
          ),
          lead: tr(
            'Communium garde une logique propre: vitrine publique, espace membre, confidentialite forte et upgrades premium.',
            'Communium keeps its own logic: public showcase, member space, strong privacy and premium upgrades.',
            'ÙŠØ­Ø§ÙØ¸ Communium Ø¹Ù„Ù‰ Ù…Ù†Ø·Ù‚Ù‡ Ø§Ù„Ø®Ø§Øµ: ÙˆØ§Ø¬Ù‡Ø© Ø¹Ø§Ù…Ø© ÙˆÙ…Ø³Ø§Ø­Ø© Ø£Ø¹Ø¶Ø§Ø¡ ÙˆØ®ØµÙˆØµÙŠØ© Ù‚ÙˆÙŠØ© ÙˆØªØ±Ù‚ÙŠØ§Øª Premium.'
          ),
          cards: [
            {
              icon: LayoutDashboard,
              tone: 'slate',
              title: tr('Pages separees', 'Separated pages', 'ØµÙØ­Ø§Øª Ù…Ø³ØªÙ‚Ù„Ø©'),
              text: tr(
                'Accueil, decouverte, fonctionnalites, premium et a propos vivent chacune dans leur vraie page.',
                'Home, discovery, features, premium and about each live in their own real page.',
                'Ø§Ù„Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ ÙˆØ§Ù„Ø§ÙƒØªØ´Ø§Ù ÙˆØ§Ù„Ù…ÙŠØ²Ø§Øª ÙˆPremium Ùˆ"Ø­ÙˆÙ„" Ù„ÙƒÙ„ Ù…Ù†Ù‡Ø§ ØµÙØ­Ø© Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù…Ø³ØªÙ‚Ù„Ø©.'
              ),
            },
            {
              icon: LockKeyhole,
              tone: 'mint',
              title: tr('Prive reste prive', 'Private stays private', 'Ø§Ù„Ø®Ø§Øµ ÙŠØ¨Ù‚Ù‰ Ø®Ø§ØµØ§Ù‹'),
              text: tr(
                'Dashboard, profil et outils membre ne sont pas melanges a la vitrine publique.',
                'Dashboard, profile and member tools are not mixed with the public showcase.',
                'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ÙˆØ§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ ÙˆØ£Ø¯ÙˆØ§Øª Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ù„Ø§ ØªØ®ØªÙ„Ø· Ø¨Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø¹Ø§Ù…Ø©.'
              ),
            },
          ],
        },
      ],
      ...sharedCta,
    };
  }

  if (pageKey === 'privacy') {
    return {
      navLabel: tr('Securite', 'Security', 'Ø§Ù„Ø£Ù…Ø§Ù†'),
      heroEyebrow: tr('Securite', 'Security', 'Ø§Ù„Ø£Ù…Ø§Ù†'),
      heroTitle: tr(
        'Gardez le controle sur vos donnees.',
        'Keep control over your data.',
        'Ø§Ù„Ø®ØµÙˆØµÙŠØ© Ù…Ø¯Ù…Ø¬Ø© ÙÙŠ ØµÙ…ÙŠÙ… Ø§Ù„Ù…Ù†ØªØ¬.'
      ),
      heroText: tr(
        'Confidentialite, permissions et protection des informations sensibles au coeur de Communium.',
        'Privacy, permissions and sensitive data protection at the core of Communium.',
        'ÙŠÙØµÙ„ Communium Ø¨ÙŠÙ† Ø§Ù„Ù…Ø³Ø§Ø­Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ø®Ø§ØµØ© ÙˆØ§Ù„Ø­Ø³Ø§Ø³Ø© Ø¹Ø¨Ø± Ù‚ÙˆØ§Ø¹Ø¯ Ø¸Ù‡ÙˆØ± Ù…ØªÙ‚Ø¯Ù…Ø©.'
      ),
      heroFacts: [
        tr('Controle de visibilite', 'Visibility control', 'Ø§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ø¸Ù‡ÙˆØ±'),
        tr('Documents proteges', 'Protected documents', 'Ù…Ø³ØªÙ†Ø¯Ø§Øª Ù…Ø­Ù…ÙŠØ©'),
        tr('Sessions securisees', 'Secured sessions', 'Ø¬Ù„Ø³Ø§Øª Ù…Ø¤Ù…Ù†Ø©'),
      ],
      sections: [
        {
          eyebrow: tr('Visibilite', 'Visibility', 'Ø§Ù„Ø¸Ù‡ÙˆØ±'),
          title: tr(
            'Des permissions precises, champ par champ.',
            'Precise permissions, field by field.',
            'ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¯Ù‚ÙŠÙ‚Ø© Ù„ÙƒÙ„ Ø­Ù‚Ù„.'
          ),
          lead: tr(
            'Chaque donnee critique garde son propre niveau d acces.',
            'Each critical piece of data keeps its own access level.',
            'ÙƒÙ„ Ù…Ø¹Ù„ÙˆÙ…Ø© Ø­Ø³Ø§Ø³Ø© ØªØ­ØªÙØ¸ Ø¨Ù…Ø³ØªÙˆÙ‰ ÙˆØµÙˆÙ„ Ù…Ø³ØªÙ‚Ù„.'
          ),
          cards: [
            {
              icon: ShieldCheck,
              tone: 'blue',
              title: tr('Controle de visibilite', 'Visibility control', 'Ø§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ø¸Ù‡ÙˆØ±'),
              text: tr(
                'Chaque donnee possede un niveau d acces independant.',
                'Each field carries its own access level.',
                'ÙƒÙ„ Ù…Ø¹Ù„ÙˆÙ…Ø© ØªÙ…Ù„Ùƒ Ù…Ø³ØªÙˆÙ‰ ÙˆØµÙˆÙ„ Ù…Ø³ØªÙ‚Ù„Ø§Ù‹.'
              ),
            },
            {
              icon: Globe2,
              tone: 'light',
              title: tr('Profil public filtre', 'Filtered public profile', 'Ù…Ù„Ù Ø¹Ø§Ù… Ù…ØµÙÙ‰'),
              text: tr(
                'Les informations sensibles restent exclues des pages publiques.',
                'Sensitive information stays excluded from public pages.',
                'Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© ØªØ¨Ù‚Ù‰ Ù…Ø³ØªØ¨Ø¹Ø¯Ø© Ù…Ù† Ø§Ù„ØµÙØ­Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø©.'
              ),
            },
            {
              icon: FileText,
              tone: 'mint',
              title: tr('Documents proteges', 'Protected documents', 'Ù…Ø³ØªÙ†Ø¯Ø§Øª Ù…Ø­Ù…ÙŠØ©'),
              text: tr(
                'CV et fichiers restent accessibles selon les permissions definies.',
                'Resumes and files remain available according to defined permissions.',
                'Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© ÙˆØ§Ù„Ù…Ù„ÙØ§Øª ØªØ¨Ù‚Ù‰ Ù…ØªØ§Ø­Ø© Ø­Ø³Ø¨ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ù…Ø­Ø¯Ø¯Ø©.'
              ),
            },
            {
              icon: UsersRound,
              tone: 'slate',
              title: tr('Acces reserve aux connexions', 'Connections-only access', 'ÙˆØµÙˆÙ„ Ù…Ø®ØµØµ Ù„Ù„Ø§ØªØµØ§Ù„Ø§Øª'),
              text: tr(
                'Certaines informations restent visibles uniquement pour le reseau approuve.',
                'Some information stays visible only to the approved network.',
                'Ø¨Ø¹Ø¶ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ØªØ¨Ù‚Ù‰ Ù…Ø±Ø¦ÙŠØ© ÙÙ‚Ø· Ù„Ù„Ø´Ø¨ÙƒØ© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©.'
              ),
            },
          ],
        },
        {
          eyebrow: tr('Protection des donnees', 'Data protection', 'Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª'),
          title: tr(
            'Une couche de securite plus mature.',
            'A more mature security layer.',
            'Ø·Ø¨Ù‚Ø© Ø£Ù…Ø§Ù† Ø£ÙƒØ«Ø± Ù†Ø¶Ø¬Ø§Ù‹.'
          ),
          lead: tr(
            'Chiffrement, authentification, sessions et controle des acces dans une meme architecture.',
            'Encryption, authentication, sessions and access control in one architecture.',
            'ØªØ´ÙÙŠØ± ÙˆÙ…ØµØ§Ø¯Ù‚Ø© ÙˆØ¬Ù„Ø³Ø§Øª ÙˆØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„ÙˆØµÙˆÙ„ Ø¯Ø§Ø®Ù„ Ø¨Ù†ÙŠØ© ÙˆØ§Ø­Ø¯Ø©.'
          ),
          cards: [
            {
              icon: ShieldCheck,
              tone: 'slate',
              title: tr('Chiffrement des donnees', 'Data encryption', 'ØªØ´ÙÙŠØ± Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª'),
              text: tr(
                'Les informations sensibles restent protegees au repos et dans les parcours critiques.',
                'Sensitive information stays protected at rest and in critical flows.',
                'Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© ØªØ¨Ù‚Ù‰ Ù…Ø­Ù…ÙŠØ© Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªØ®Ø²ÙŠÙ† ÙˆÙÙŠ Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©.'
              ),
            },
            {
              icon: LockKeyhole,
              tone: 'mint',
              title: tr('Authentification securisee', 'Secure authentication', 'Ù…ØµØ§Ø¯Ù‚Ø© Ø¢Ù…Ù†Ø©'),
              text: tr(
                'Le CV peut rester reserve aux connexions plutot que publie a tout le monde.',
                'Authentication remains hardened for the most sensitive account actions.',
                'ØªØ¨Ù‚Ù‰ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ù…Ø¹Ø²Ø²Ø© ÙÙŠ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø£ÙƒØ«Ø± Ø­Ø³Ø§Ø³ÙŠØ© Ø¯Ø§Ø®Ù„ Ø§Ù„Ø­Ø³Ø§Ø¨.'
              ),
            },
            {
              icon: LayoutDashboard,
              tone: 'blue',
              title: tr('Sessions protegees', 'Protected sessions', 'Ø¬Ù„Ø³Ø§Øª Ù…Ø­Ù…ÙŠØ©'),
              text: tr(
                'Les sessions actives, appareils et validations restent sous controle.',
                'Active sessions, devices and validations stay under control.',
                'Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø£Ø¬Ù‡Ø²Ø© ÙˆØ§Ù„ØªØ­Ù‚Ù‚Ø§Øª ØªØ¨Ù‚Ù‰ ØªØ­Øª Ø§Ù„Ø³ÙŠØ·Ø±Ø©.'
              ),
            },
            {
              icon: Info,
              tone: 'light',
              title: tr('Journal d activite', 'Activity logs', 'Ø³Ø¬Ù„ Ø§Ù„Ù†Ø´Ø§Ø·'),
              text: tr(
                'Les acces sensibles, changements critiques et signaux suspects restent tracables.',
                'Sensitive access, critical changes and suspicious signals remain traceable.',
                'Ø§Ù„ÙˆØµÙˆÙ„Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© ÙˆØ§Ù„ØªØºÙŠÙŠØ±Ø§Øª Ø§Ù„Ø­Ø±Ø¬Ø© ÙˆØ§Ù„Ø¥Ø´Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø´Ø¨ÙˆÙ‡Ø© ØªØ¨Ù‚Ù‰ Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªØªØ¨Ø¹.'
              ),
            },
          ],
        },
        {
          eyebrow: tr('Controle du compte', 'Account control', 'Ø§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ø­Ø³Ø§Ø¨'),
          title: tr(
            'Des signaux de confiance plus visibles.',
            'Trust signals that remain visible.',
            'Ø¥Ø´Ø§Ø±Ø§Øª Ø«Ù‚Ø© Ø£ÙƒØ«Ø± ÙˆØ¶ÙˆØ­Ø§Ù‹.'
          ),
          lead: tr(
            'Appareils connectes, alertes et verifications dans une surface plus lisible.',
            'Connected devices, alerts and verification states inside a clearer surface.',
            'Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…ØªØµÙ„Ø© ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª ÙˆØ­Ø§Ù„Ø§Øª Ø§Ù„ØªØ­Ù‚Ù‚ Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø­Ø© Ø£ÙˆØ¶Ø­.'
          ),
          cards: [
            {
              icon: LayoutDashboard,
              tone: 'blue',
              title: tr('Appareils connectes', 'Connected devices', 'Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…ØªØµÙ„Ø©'),
              text: tr(
                'Les appareils et acces recents restent visibles dans les reglages du compte.',
                'Devices and recent access remain visible in account settings.',
                'Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© ÙˆØ§Ù„ÙˆØµÙˆÙ„Ø§Øª Ø§Ù„Ø£Ø®ÙŠØ±Ø© ØªØ¨Ù‚Ù‰ Ø¸Ø§Ù‡Ø±Ø© Ø¯Ø§Ø®Ù„ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø¨.'
              ),
            },
            {
              icon: Mail,
              tone: 'light',
              title: tr('Validation email', 'Email verification', 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ'),
              text: tr(
                'La verification email reste active dans les parcours sensibles.',
                'Email verification remains active for sensitive flows.',
                'ÙŠØ¨Ù‚Ù‰ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ÙØ¹Ø§Ù„Ø§Ù‹ ÙÙŠ Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©.'
              ),
            },
            {
              icon: ShieldCheck,
              tone: 'mint',
              title: tr('Double authentification', 'Two-factor authentication', 'Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©'),
              text: tr(
                'Une couche supplementaire pour les comptes qui demandent un niveau de confiance plus eleve.',
                'An extra layer for accounts that require a higher trust level.',
                'Ø·Ø¨Ù‚Ø© Ø¥Ø¶Ø§ÙÙŠØ© Ù„Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„ØªÙŠ ØªØ­ØªØ§Ø¬ Ù…Ø³ØªÙˆÙ‰ Ø«Ù‚Ø© Ø£Ø¹Ù„Ù‰.'
              ),
            },
            {
              icon: UsersRound,
              tone: 'slate',
              title: tr('Permissions reseau', 'Network permissions', 'ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø´Ø¨ÙƒØ©'),
              text: tr(
                'Les acces reserves aux connexions gardent une limite lisible et maitrisable.',
                'Connections-only visibility stays readable and easier to manage.',
                'ÙŠØ¨Ù‚Ù‰ Ø§Ù„Ø¸Ù‡ÙˆØ± Ø§Ù„Ù…Ø®ØµØµ Ù„Ù„Ø§ØªØµØ§Ù„Ø§Øª ÙˆØ§Ø¶Ø­Ø§Ù‹ ÙˆØ£Ø³Ù‡Ù„ ÙÙŠ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.'
              ),
            },
          ],
        },
      ],
      ctaTitle: tr(
        'Pilotez vos regles de confidentialite.',
        'Manage your privacy rules.',
        'Ø£Ø¯Ø± Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø®ØµÙˆØµÙŠØ© Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ.'
      ),
      ctaText: tr(
        'Retrouvez les permissions, les regles de visibilite et les reglages sensibles dans votre espace securise.',
        'Open your permissions, visibility rules and sensitive settings in your secured space.',
        'Ø±Ø§Ø¬Ø¹ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª ÙˆÙ‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø¸Ù‡ÙˆØ± ÙˆØ§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø­ØªÙƒ Ø§Ù„Ø¢Ù…Ù†Ø©.'
      ),
      ctaPrimaryLabel: tr('Gerer la confidentialite', 'Manage privacy', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©'),
      ctaPrimaryHref: privacySettingsHref,
      ctaSecondaryLabel: tr('Parametres securite', 'Security settings', 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø£Ù…Ø§Ù†'),
      ctaSecondaryHref: securitySettingsHref,
    };
  }

  if (pageKey === 'terms') {
    return {
      navLabel: tr('Conditions', 'Terms', 'Ø§Ù„Ø´Ø±ÙˆØ·'),
      heroEyebrow: tr('Conditions', 'Terms', 'Ø§Ù„Ø´Ø±ÙˆØ·'),
      heroTitle: tr(
        'Un cadre clair pour utiliser la plateforme.',
        'A clear framework to use the platform.',
        'Ø¥Ø·Ø§Ø± ÙˆØ§Ø¶Ø­ Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ù†ØµØ©.'
      ),
      heroText: tr(
        'Compte, abonnement, paiement et usage restent relies a des regles simples, lisibles et coherentes.',
        'Account, subscription, payment and usage remain tied to simple, readable and consistent rules.',
        'ÙŠØ¨Ù‚Ù‰ Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ÙˆØ§Ù„Ø¯ÙØ¹ ÙˆØ§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù…Ø±ØªØ¨Ø·Ø§Ù‹ Ø¨Ù‚ÙˆØ§Ø¹Ø¯ ÙˆØ§Ø¶Ø­Ø© ÙˆÙ…ØªØ³Ù‚Ø© ÙˆØ³Ù‡Ù„Ø© Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©.'
      ),
      heroFacts: [
        tr('Compte puis espace membre', 'Account then member area', 'Ø§Ù„Ø­Ø³Ø§Ø¨ Ø«Ù… Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡'),
        tr('Choix de formule clair', 'Clear plan selection', 'Ø§Ø®ØªÙŠØ§Ø± ÙˆØ§Ø¶Ø­ Ù„Ù„Ø®Ø·Ø©'),
        tr('Flux de paiement separe', 'Separate payment flow', 'Ù…Ø³Ø§Ø± Ø¯ÙØ¹ Ù…Ù†ÙØµÙ„'),
      ],
      sections: [
        {
          eyebrow: tr('Parcours', 'Flow', 'Ø§Ù„Ù…Ø³Ø§Ø±'),
          title: tr('Un parcours plus lisible.', 'A clearer flow.', 'Ù…Ø³Ø§Ø± Ø£ÙƒØ«Ø± ÙˆØ¶ÙˆØ­Ø§Ù‹.'),
          lead: tr(
            'Les pages publiques, l inscription et l espace membre restent mieux separes.',
            'Public pages, sign-up and member space remain better separated.',
            'ØªØ¨Ù‚Ù‰ Ø§Ù„ØµÙØ­Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„ØªØ³Ø¬ÙŠÙ„ ÙˆÙ…Ø³Ø§Ø­Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø£ÙƒØ«Ø± ÙØµÙ„Ø§Ù‹ ÙˆÙˆØ¶ÙˆØ­Ø§Ù‹.'
          ),
          cards: [
            {
              icon: ArrowRight,
              tone: 'blue',
              title: tr('Choix puis action', 'Choice then action', 'Ø§Ø®ØªÙŠØ§Ø± Ø«Ù… Ø¥Ø¬Ø±Ø§Ø¡'),
              text: tr(
                'Decouverte, fonctionnalites, premium et a propos sont lisibles avant de creer un compte.',
                'Discovery, features, premium and about stay readable before creating an account.',
                'ØªØ¨Ù‚Ù‰ ØµÙØ­Ø§Øª Ø§Ù„Ø§ÙƒØªØ´Ø§Ù ÙˆØ§Ù„Ù…ÙŠØ²Ø§Øª ÙˆPremium Ùˆ"Ø­ÙˆÙ„" ÙˆØ§Ø¶Ø­Ø© Ù‚Ø¨Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨.'
              ),
            },
            {
              icon: ShieldCheck,
              tone: 'slate',
              title: tr('Espace prive protege', 'Protected private area', 'Ù…Ø³Ø§Ø­Ø© Ø®Ø§ØµØ© Ù…Ø­Ù…ÙŠØ©'),
              text: tr(
                'Le dashboard, la messagerie et le profil ne sont accessibles qu apres authentification.',
                'Dashboard, messaging and the profile are accessible only after authentication.',
                'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ÙˆØ§Ù„Ø±Ø³Ø§Ø¦Ù„ ÙˆØ§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ Ù„Ø§ ØªØµØ¨Ø­ Ù…ØªØ§Ø­Ø© Ø¥Ù„Ø§ Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.'
              ),
            },
          ],
        },
        {
          eyebrow: tr('Abonnements', 'Subscriptions', 'Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª'),
          title: tr('Le premium reste clair', 'Premium stays clear', 'ÙŠØ¨Ù‚Ù‰ Premium ÙˆØ§Ø¶Ø­Ø§Ù‹'),
          lead: tr(
            'Les niveaux Gratuit, Silver, Gold et Platinum gardent leur propre espace pour eviter la confusion.',
            'Free, Silver, Gold and Platinum keep their own space to avoid confusion.',
            'ØªØ­ØªÙØ¸ Ù…Ø³ØªÙˆÙŠØ§Øª Free ÙˆSilver ÙˆGold ÙˆPlatinum Ø¨Ù…Ø³Ø§Ø­ØªÙ‡Ø§ Ø§Ù„Ø®Ø§ØµØ© Ù„ØªØ¬Ù†Ø¨ Ø§Ù„Ø§Ù„ØªØ¨Ø§Ø³.'
          ),
          cards: [
            {
              icon: Crown,
              tone: 'gold',
              title: tr('Comparaison propre', 'Clean comparison', 'Ù…Ù‚Ø§Ø±Ù†Ø© ÙˆØ§Ø¶Ø­Ø©'),
              text: tr(
                'Le visiteur compare les offres puis rejoint le bon tunnel d inscription.',
                'Visitors compare offers and then enter the right sign-up flow.',
                'ÙŠÙ‚Ø§Ø±Ù† Ø§Ù„Ø²Ø§Ø¦Ø± Ø¨ÙŠÙ† Ø§Ù„Ø¹Ø±ÙˆØ¶ Ø«Ù… ÙŠÙ†ØªÙ‚Ù„ Ø¥Ù„Ù‰ Ù…Ø³Ø§Ø± Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨.'
              ),
            },
          ],
        },
      ],
      ...sharedCta,
    };
  }

  if (pageKey === 'contact') {
    return {
      navLabel: tr('Contact', 'Contact', 'Ø§ØªØµÙ„ Ø¨Ù†Ø§'),
      heroEyebrow: tr('Contact', 'Contact', 'Ø§ØªØµÙ„ Ø¨Ù†Ø§'),
      heroTitle: tr(
        'Le bon canal pour chaque besoin.',
        'The right channel for each need.',
        'Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø© Ù„ÙƒÙ„ Ø­Ø§Ø¬Ø©.'
      ),
      heroText: tr(
        'Support, partenariats, accompagnement premium et questions produit restent regroupes dans une page plus claire.',
        'Support, partnerships, premium guidance and product questions stay grouped in a clearer page.',
        'ÙŠØ¨Ù‚Ù‰ Ø§Ù„Ø¯Ø¹Ù… ÙˆØ§Ù„Ø´Ø±Ø§ÙƒØ§Øª ÙˆØ§Ù„Ù…Ø±Ø§ÙÙ‚Ø© Premium ÙˆØ£Ø³Ø¦Ù„Ø© Ø§Ù„Ù…Ù†ØªØ¬ Ù…Ø¬Ù…Ø¹Ø© Ø¯Ø§Ø®Ù„ ØµÙØ­Ø© Ø£ÙˆØ¶Ø­.'
      ),
      heroFacts: [
        tr('Support produit', 'Product support', 'Ø¯Ø¹Ù… Ø§Ù„Ù…Ù†ØªØ¬'),
        tr('Partenariats', 'Partnerships', 'Ø§Ù„Ø´Ø±Ø§ÙƒØ§Øª'),
        tr('Onboarding premium', 'Premium onboarding', 'ØªÙ‡ÙŠØ¦Ø© Premium'),
      ],
      sections: [
        {
          eyebrow: tr('Nous joindre', 'Reach us', 'Ø§Ù„ØªÙˆØ§ØµÙ„'),
          title: tr(
            'Le bon canal pour la bonne question',
            'The right channel for the right question',
            'Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø© Ù„ÙƒÙ„ Ø³Ø¤Ø§Ù„'
          ),
          lead: tr(
            'Les demandes produit, support et business gardent chacune leur espace de contact.',
            'Product, support and business requests each keep their own contact path.',
            'ØªØ­Ø§ÙØ¸ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ù†ØªØ¬ ÙˆØ§Ù„Ø¯Ø¹Ù… ÙˆØ§Ù„Ø£Ø¹Ù…Ø§Ù„ Ø¹Ù„Ù‰ Ù…Ø³Ø§Ø± ØªÙˆØ§ØµÙ„ Ø®Ø§Øµ Ø¨ÙƒÙ„ Ù†ÙˆØ¹.'
          ),
          cards: [
            {
              icon: Mail,
              tone: 'blue',
              title: tr('Support compte et acces', 'Account and access support', 'Ø¯Ø¹Ù… Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ§Ù„ÙˆØµÙˆÙ„'),
              text: tr(
                'Pour l inscription, la connexion, la verification ou la recuperation d acces.',
                'For sign-up, sign-in, verification or access recovery.',
                'Ù„Ù„ØªØ³Ø¬ÙŠÙ„ ÙˆØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ ÙˆØ§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ø³ØªØ±Ø¬Ø§Ø¹ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ø­Ø³Ø§Ø¨.'
              ),
              meta: 'support@communium.local',
            },
            {
              icon: Handshake,
              tone: 'mint',
              title: tr('Partenariats et business', 'Partnerships and business', 'Ø§Ù„Ø´Ø±Ø§ÙƒØ§Øª ÙˆØ§Ù„Ø£Ø¹Ù…Ø§Ù„'),
              text: tr(
                'Pour les ecoles, entreprises, evenements ou integrations autour de Communium.',
                'For schools, companies, events or integrations around Communium.',
                'Ù„Ù„Ù…Ø¯Ø§Ø±Ø³ ÙˆØ§Ù„Ø´Ø±ÙƒØ§Øª ÙˆØ§Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª ÙˆØ§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ù€ Communium.'
              ),
              meta: 'partnerships@communium.local',
            },
            {
              icon: Crown,
              tone: 'violet',
              title: tr('Accompagnement premium', 'Premium guidance', 'Ù…Ø±Ø§ÙÙ‚Ø© Premium'),
              text: tr(
                'Pour preparer une montee en visibilite ou choisir la bonne formule.',
                'To prepare a visibility upgrade or choose the right plan.',
                'Ù„ØªØ­Ø¶ÙŠØ± Ø±ÙØ¹ Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø¸Ù‡ÙˆØ± Ø£Ùˆ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø®Ø·Ø© Ø§Ù„Ø£Ù†Ø³Ø¨.'
              ),
              href: buildAuthFlowHref(locale, 'sign-up', 'gold'),
              ctaLabel: tr('Commencer avec Gold', 'Start with Gold', 'Ø§Ø¨Ø¯Ø£ Ù…Ø¹ Gold'),
            },
          ],
        },
      ],
      ...sharedCta,
    };
  }

  return {
    navLabel: tr('Information', 'Information', 'Ù…Ø¹Ù„ÙˆÙ…Ø©'),
    heroEyebrow: tr('Information', 'Information', 'Ù…Ø¹Ù„ÙˆÙ…Ø©'),
    heroTitle: tr('Page publique', 'Public page', 'ØµÙØ­Ø© Ø¹Ø§Ù…Ø©'),
    heroText: tr('Contenu indisponible.', 'Content unavailable.', 'Ø§Ù„Ù…Ø­ØªÙˆÙ‰ ØºÙŠØ± Ù…ØªØ§Ø­ Ø­Ø§Ù„ÙŠØ§Ù‹.'),
    heroFacts: [],
    sections: [],
    ...sharedCta,
  };
}

export default function PublicInformationPage({
  locale,
  pageKey,
}: {
  locale: Locale;
  pageKey: PublicPageKey;
}) {
  const copy = getPageCopy(locale, pageKey);
  const routes = buildPublicRoutes(locale);
  const isPremiumPage = pageKey === 'premium';
  const isDiscoverPage = pageKey === 'discover';
  const isCommunityPage = pageKey === 'features';
  const isPrivacyPage = pageKey === 'privacy';
  const isFrench = locale === 'fr';
  const isArabic = locale === 'ar';
  const tr = (fr: string, en: string, ar: string) => (isFrench ? fr : isArabic ? ar : en);

  const discoverHeroFilters = isFrench
    ? ['Produit', 'Data', 'Design', 'Operations']
    : isArabic
      ? ['Ø§Ù„Ù…Ù†ØªØ¬', 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª', 'Ø§Ù„ØªØµÙ…ÙŠÙ…', 'Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª']
      : ['Product', 'Data', 'Design', 'Operations'];
  const discoverHeroSkills = isFrench
    ? ['Next.js', 'Brand', 'Go-to-market', 'UX research']
    : isArabic
      ? ['Next.js', 'Ø§Ù„Ø¹Ù„Ø§Ù…Ø©', 'Go-to-market', 'Ø¨Ø­Ø« UX']
      : ['Next.js', 'Brand', 'Go-to-market', 'UX research'];
  const discoverHeroSectors = isFrench
    ? ['Product', 'Software', 'Conseil', 'Talent']
    : isArabic
      ? ['Ø§Ù„Ù…Ù†ØªØ¬', 'Ø§Ù„Ø¨Ø±Ù…Ø¬ÙŠØ§Øª', 'Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø©', 'Ø§Ù„Ù…ÙˆØ§Ù‡Ø¨']
      : ['Product', 'Software', 'Advisory', 'Talent'];
  const communityHeroFilters = isFrench
    ? ['Produit', 'Data', 'Recrutement', 'Operations']
    : isArabic
      ? ['Ø§Ù„Ù…Ù†ØªØ¬', 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª', 'Ø§Ù„ØªÙˆØ¸ÙŠÙ', 'Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª']
      : ['Product', 'Data', 'Hiring', 'Operations'];
  const communityHeroTags = isFrench
    ? ['Mentorat', 'Design systems', 'Node.js', 'Go-to-market']
    : isArabic
      ? ['Ø¥Ø±Ø´Ø§Ø¯', 'Ø£Ù†Ø¸Ù…Ø© ØªØµÙ…ÙŠÙ…', 'Node.js', 'Go-to-market']
      : ['Mentorship', 'Design systems', 'Node.js', 'Go-to-market'];
  const communityHeroSectors = isFrench
    ? ['Produit', 'Logiciel', 'Conseil', 'People']
    : isArabic
      ? ['Ø§Ù„Ù…Ù†ØªØ¬', 'Ø§Ù„Ø¨Ø±Ù…Ø¬ÙŠØ§Øª', 'Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø©', 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©']
      : ['Product', 'Software', 'Advisory', 'People'];
  const communityFeedItems = isFrench
    ? [
        {
          author: 'Sofia Benkirane',
          role: 'Product strategist',
          meta: 'Casablanca - A l instant',
          title: 'Publication recente',
          text: 'Presentation d une mise a jour produit pour renforcer la visibilite professionnelle.',
          tags: ['Produit', 'Mentorat'],
          signals: ['Profil visible', 'Reseau actif', 'Presence claire'],
        },
        {
          author: 'Youssef Alaoui',
          role: 'Full stack engineer',
          meta: 'Rabat - Il y a 2 h',
          title: 'CV PDF mis a jour',
          text: 'Nouvelle version optimisee pour les recruteurs et les missions plus techniques.',
          tags: ['Infrastructure', 'Node.js'],
          signals: ['Publication recente', 'Profil a jour', 'Donnees protegees'],
        },
      ]
    : isArabic
      ? [
          {
            author: 'Sofia Benkirane',
            role: 'Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© Ù…Ù†ØªØ¬',
            meta: 'Ø§Ù„Ø¯Ø§Ø± Ø§Ù„Ø¨ÙŠØ¶Ø§Ø¡ - Ø§Ù„Ø¢Ù†',
            title: 'Ù…Ù†Ø´ÙˆØ± Ø­Ø¯ÙŠØ«',
            text: 'Ø¹Ø±Ø¶ ØªØ­Ø¯ÙŠØ« Ù…Ù†ØªØ¬ Ù…Ù† Ø£Ø¬Ù„ ØªØ¹Ø²ÙŠØ² Ø§Ù„Ø¸Ù‡ÙˆØ± Ø§Ù„Ù…Ù‡Ù†ÙŠ.',
            tags: ['Ø§Ù„Ù…Ù†ØªØ¬', 'Ø¥Ø±Ø´Ø§Ø¯'],
            signals: ['Ù…Ù„Ù Ø¸Ø§Ù‡Ø±', 'Ø´Ø¨ÙƒØ© Ù†Ø´Ø·Ø©', 'Ø­Ø¶ÙˆØ± ÙˆØ§Ø¶Ø­'],
          },
          {
            author: 'Youssef Alaoui',
            role: 'Ù…Ù‡Ù†Ø¯Ø³ Full stack',
            meta: 'Ø§Ù„Ø±Ø¨Ø§Ø· - Ù…Ù†Ø° Ø³Ø§Ø¹ØªÙŠÙ†',
            title: 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©',
            text: 'Ù†Ø³Ø®Ø© Ø£Ø­Ø¯Ø« ÙˆØ£ÙƒØ«Ø± ÙˆØ¶ÙˆØ­Ø§Ù‹ Ù„Ù„Ù…Ø¬Ù†Ø¯ÙŠÙ† ÙˆØ§Ù„ÙØ±Øµ Ø§Ù„ØªÙ‚Ù†ÙŠØ©.',
            tags: ['Ø§Ù„Ø¨Ù†ÙŠØ© Ø§Ù„ØªØ­ØªÙŠØ©', 'Node.js'],
            signals: ['Ù…Ù†Ø´ÙˆØ± Ø­Ø¯ÙŠØ«', 'Ù…Ù„Ù Ù…Ø­Ø¯Ø«', 'Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø­Ù…ÙŠØ©'],
          },
        ]
      : [
        {
          author: 'Sofia Benkirane',
          role: 'Product strategist',
          meta: 'Casablanca - Just now',
          title: 'Recent post',
          text: 'A product update shared to strengthen professional visibility.',
          tags: ['Product', 'Mentorship'],
          signals: ['Visible profile', 'Active network', 'Clear presence'],
        },
        {
          author: 'Youssef Alaoui',
          role: 'Full stack engineer',
          meta: 'Rabat - 2h ago',
          title: 'Resume refreshed',
          text: 'A sharper version prepared for recruiters and more technical opportunities.',
          tags: ['Infrastructure', 'Node.js'],
          signals: ['Recent post', 'Updated profile', 'Protected data'],
        },
      ];
  const communitySidebarSections = isFrench
    ? [
        {
          title: 'Profils recommandes',
          items: ['Meryem Idrissi - Talent partner', 'Imane Fassi - Product design', 'Zakaria Elharchi - Data lead'],
        },
        {
          title: 'Secteurs actifs',
          items: ['Produit', 'Data', 'Recrutement', 'Operations'],
        },
        {
          title: 'Opportunites recentes',
          items: ['Mentorat produit', 'Mission UX audit', 'Poste growth junior'],
        },
      ]
    : isArabic
      ? [
          {
            title: 'Ù…Ù„ÙØ§Øª Ù…ÙˆØµÙ‰ Ø¨Ù‡Ø§',
            items: ['Meryem Idrissi - Ø´Ø±ÙŠÙƒØ© Ù…ÙˆØ§Ù‡Ø¨', 'Imane Fassi - ØªØµÙ…ÙŠÙ… Ù…Ù†ØªØ¬', 'Zakaria Elharchi - Ù‚Ø§Ø¦Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª'],
          },
          {
            title: 'Ù‚Ø·Ø§Ø¹Ø§Øª Ù†Ø´Ø·Ø©',
            items: ['Ø§Ù„Ù…Ù†ØªØ¬', 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª', 'Ø§Ù„ØªÙˆØ¸ÙŠÙ', 'Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª'],
          },
          {
            title: 'ÙØ±Øµ Ø­Ø¯ÙŠØ«Ø©',
            items: ['Ø¥Ø±Ø´Ø§Ø¯ Ù…Ù†ØªØ¬', 'Ù…Ù‡Ù…Ø© ØªØ¯Ù‚ÙŠÙ‚ UX', 'Ù…Ù†ØµØ¨ Ù†Ù…Ùˆ Ù…Ø¨ØªØ¯Ø¦'],
          },
        ]
      : [
        {
          title: 'Recommended profiles',
          items: ['Meryem Idrissi - Talent partner', 'Imane Fassi - Product design', 'Zakaria Elharchi - Data lead'],
        },
        {
          title: 'Active sectors',
          items: ['Product', 'Data', 'Hiring', 'Operations'],
        },
        {
          title: 'Recent opportunities',
          items: ['Product mentorship', 'UX audit mission', 'Junior growth role'],
        },
      ];
  const premiumHeroSignals = isFrench
    ? [
        {
          title: 'Apparition prioritaire',
          text: 'Le profil remonte plus facilement dans les suggestions et les surfaces visibles.',
        },
        {
          title: 'Diffusion plus large',
          text: 'Les publications gagnent en portee et touchent un reseau plus qualifie.',
        },
        {
          title: 'Acces plus direct',
          text: 'Les opportunites, profils et recommandations arrivent dans un espace plus actif.',
        },
      ]
    : isArabic
      ? [
          {
            title: 'Ø¸Ù‡ÙˆØ± Ø¨Ø£ÙˆÙ„ÙˆÙŠØ©',
            text: 'ÙŠØ±ØªÙØ¹ Ø§Ù„Ù…Ù„Ù Ø¨Ø³Ù‡ÙˆÙ„Ø© Ø£ÙƒØ¨Ø± Ø¯Ø§Ø®Ù„ Ø§Ù„Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª ÙˆØ§Ù„Ù…Ø³Ø§Ø­Ø§Øª Ø§Ù„Ù…Ø±Ø¦ÙŠØ©.',
          },
          {
            title: 'Ø§Ù†ØªØ´Ø§Ø± Ø£ÙˆØ³Ø¹',
            text: 'ØªØ­ØµÙ„ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø¹Ù„Ù‰ ÙˆØµÙˆÙ„ Ø£ÙƒØ¨Ø± Ø¯Ø§Ø®Ù„ Ø´Ø¨ÙƒØ© Ø£ÙƒØ«Ø± ØªØ£Ù‡ÙŠÙ„Ø§Ù‹.',
          },
          {
            title: 'ÙˆØµÙˆÙ„ Ø£ÙƒØ«Ø± Ù…Ø¨Ø§Ø´Ø±Ø©',
            text: 'ØªØµÙ„ Ø§Ù„ÙØ±Øµ ÙˆØ§Ù„Ù…Ù„ÙØ§Øª ÙˆØ§Ù„ØªÙˆØµÙŠØ§Øª Ø¥Ù„Ù‰ Ù…Ø³Ø§Ø­Ø© Ø£ÙƒØ«Ø± Ù†Ø´Ø§Ø·Ø§Ù‹.',
          },
        ]
      : [
        {
          title: 'Priority appearance',
          text: 'The profile rises more easily across suggestions and visible surfaces.',
        },
        {
          title: 'Wider distribution',
          text: 'Publications gain reach and touch a more qualified network.',
        },
        {
          title: 'More direct access',
          text: 'Opportunities, profiles and recommendations land in a more active space.',
        },
      ];
  const privacyHeroSignals = isFrench
    ? [
        {
          title: 'Niveaux d acces',
          text: 'Public, connexions uniquement ou prive selon la nature de chaque donnee.',
        },
        {
          title: 'Documents controles',
          text: 'CV, fichiers et elements sensibles restent filtres par permissions.',
        },
        {
          title: 'Sessions surveillees',
          text: 'Appareils, acces recents et actions critiques gardent une trace lisible.',
        },
      ]
    : isArabic
      ? [
          {
            title: 'Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„ÙˆØµÙˆÙ„',
            text: 'Ø¹Ø§Ù… Ø£Ùˆ Ù„Ù„Ø§ØªØµØ§Ù„Ø§Øª ÙÙ‚Ø· Ø£Ùˆ Ø®Ø§Øµ Ø¨Ø­Ø³Ø¨ Ø·Ø¨ÙŠØ¹Ø© ÙƒÙ„ Ù…Ø¹Ù„ÙˆÙ…Ø©.',
          },
          {
            title: 'Ù…Ø³ØªÙ†Ø¯Ø§Øª Ù…Ø¶Ø¨ÙˆØ·Ø©',
            text: 'Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© ÙˆØ§Ù„Ù…Ù„ÙØ§Øª ÙˆØ§Ù„Ø¹Ù†Ø§ØµØ± Ø§Ù„Ø­Ø³Ø§Ø³Ø© ØªØ¨Ù‚Ù‰ Ù…ØµÙØ§Ø© Ø­Ø³Ø¨ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª.',
          },
          {
            title: 'Ø¬Ù„Ø³Ø§Øª Ù…Ø±Ø§Ù‚Ø¨Ø©',
            text: 'Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© ÙˆØ§Ù„ÙˆØµÙˆÙ„Ø§Øª Ø§Ù„Ø£Ø®ÙŠØ±Ø© ÙˆØ§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø­Ø±Ø¬Ø© ØªØ­ØªÙØ¸ Ø¨Ø³Ø¬Ù„ ÙˆØ§Ø¶Ø­.',
          },
        ]
      : [
        {
          title: 'Access levels',
          text: 'Public, connections-only or private depending on the nature of each field.',
        },
        {
          title: 'Controlled documents',
          text: 'Resumes, files and sensitive elements remain filtered by permissions.',
        },
        {
          title: 'Monitored sessions',
          text: 'Devices, recent access and critical actions keep a readable trace.',
        },
      ];

  return (
    <PublicExperienceFrame>
      <main className={`publicInfoPage ${isPremiumPage ? 'isPremiumPage' : ''} ${isDiscoverPage ? 'isDiscoverPage' : ''} ${isCommunityPage ? 'isCommunityPage' : ''} ${isPrivacyPage ? 'isPrivacyPage' : ''}`}>
        <div className="publicInfoShell">
        <PageHero
          className={`publicHeroCard ${isDiscoverPage ? 'discoverHeroCard' : ''} ${isCommunityPage ? 'communityHeroCard' : ''} ${isPrivacyPage ? 'privacyHeroCard' : ''}`}
          label={copy.heroEyebrow}
          title={copy.heroTitle}
          description={copy.heroText}
          rightContent={
            <div className={`publicHeroAside ${isDiscoverPage ? 'discoverHeroAside' : ''} ${isCommunityPage ? 'communityHeroAside' : ''}`}>
            {isPrivacyPage ? (
              <>
                <div className="privacyHeroPanel">
                  <div className="privacyHeroPanelHead">
                    <strong>{tr('Controle du compte', 'Account control', 'Ø§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ø­Ø³Ø§Ø¨')}</strong>
                    <span>{tr('Protection active', 'Active protection', 'Ø­Ù…Ø§ÙŠØ© Ù†Ø´Ø·Ø©')}</span>
                  </div>

                  <div className="privacyHeroSignalList">
                    {privacyHeroSignals.map((item) => (
                      <div key={item.title} className="privacyHeroSignalRow">
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="privacyHeroStatusGrid">
                  {copy.heroFacts.map((fact) => (
                    <span key={fact}>{fact}</span>
                  ))}
                </div>

                <div className="publicHeroActions privacyHeroActions">
                  <Link href={copy.ctaPrimaryHref} className="ghostPublicButton">
                    {copy.ctaPrimaryLabel}
                  </Link>
                  <Link href={copy.ctaSecondaryHref} className="ghostPublicButton">
                    {copy.ctaSecondaryLabel}
                  </Link>
                </div>
              </>
            ) : isPremiumPage ? (
              <>
                <div className="premiumHeroPanel">
                  <div className="premiumHeroPanelHead">
                    <strong>{tr('Impact Premium', 'Premium impact', 'Ø£Ø«Ø± Premium')}</strong>
                    <span>{tr('Presence reseau', 'Network presence', 'Ø§Ù„Ø­Ø¶ÙˆØ± Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©')}</span>
                  </div>

                  <div className="premiumHeroSignalList">
                    {premiumHeroSignals.map((item) => (
                      <div key={item.title} className="premiumHeroSignalRow">
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="premiumHeroStatusGrid">
                  {copy.heroFacts.map((fact) => (
                    <span key={fact}>{fact}</span>
                  ))}
                </div>

                <div className="publicHeroActions premiumHeroActions">
                  <Link href={buildAuthFlowHref(locale, 'sign-up', 'gold')} className="primaryPublicButton">
                    {tr('Decouvrir Gold', 'Discover Gold', 'Ø§ÙƒØªØ´Ù Gold')}
                  </Link>
                  <Link href={buildAuthFlowHref(locale, 'sign-up', 'platinum')} className="ghostPublicButton">
                    {tr('Activer Platinum', 'Activate Platinum', 'ØªÙØ¹ÙŠÙ„ Platinum')}
                  </Link>
                </div>
              </>
            ) : isDiscoverPage ? (
              <>
                <div className="discoverSearchCard">
                  <div className="discoverSearchField">
                    <Search className="publicCardIcon" strokeWidth={2.1} />
                    <span>
                      {tr(
                        'Rechercher un metier, une competence ou un secteur',
                        'Search a role, skill or sector',
                        'Ø§Ø¨Ø­Ø« Ø¹Ù† Ù…Ù‡Ù†Ø© Ø£Ùˆ Ù…Ù‡Ø§Ø±Ø© Ø£Ùˆ Ù‚Ø·Ø§Ø¹'
                      )}
                    </span>
                  </div>

                  <div className="discoverFilterRow">
                    {discoverHeroFilters.map((item) => (
                      <span key={item} className="discoverFilterChip">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="discoverInfoGrid">
                    <div className="discoverInfoBlock">
                      <small>{tr('Secteurs visibles', 'Visible sectors', 'Ø§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª Ø§Ù„Ø¸Ø§Ù‡Ø±Ø©')}</small>
                      <div className="discoverInlineList">
                        {discoverHeroSectors.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </div>

                    <div className="discoverInfoBlock">
                      <small>{tr('Competences populaires', 'Popular skills', 'Ø§Ù„Ù…Ù‡Ø§Ø±Ø§Øª Ø§Ù„Ø´Ø§Ø¦Ø¹Ø©')}</small>
                      <div className="discoverInlineList soft">
                        {discoverHeroSkills.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <article className="discoverSpotlightCard">
                  <div className="discoverSpotlightHead">
                    <span className="discoverAvatarShell">
                      <UsersRound className="publicCardIcon" strokeWidth={2.1} />
                    </span>
                    <div className="discoverSpotlightIdentity">
                      <strong>Sofia Benkirane</strong>
                      <small>{tr('Product strategist · Casablanca', 'Product strategist · Casablanca', 'Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© Ù…Ù†ØªØ¬ · Ø§Ù„Ø¯Ø§Ø± Ø§Ù„Ø¨ÙŠØ¶Ø§Ø¡')}</small>
                    </div>
                    <span className="discoverVerifiedPill">
                      <ShieldCheck className="publicCardIcon" strokeWidth={2.1} />
                      {tr('Profil verifie', 'Verified profile', 'Ù…Ù„Ù Ù…ÙˆØ«Ù‚')}
                    </span>
                  </div>

                  <p className="discoverSpotlightText">
                    {tr(
                      'Profil public net, competences visibles et CV partageable dans une seule presence professionnelle.',
                      'A clear public profile, visible skills and a shareable resume in one professional presence.',
                      'Ù…Ù„Ù Ø¹Ø§Ù… ÙˆØ§Ø¶Ø­ ÙˆÙ…Ù‡Ø§Ø±Ø§Øª Ø¸Ø§Ù‡Ø±Ø© ÙˆØ³ÙŠØ±Ø© Ø°Ø§ØªÙŠØ© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ© Ø¯Ø§Ø®Ù„ Ø­Ø¶ÙˆØ± Ù…Ù‡Ù†ÙŠ ÙˆØ§Ø­Ø¯.'
                    )}
                  </p>

                  <div className="discoverSignalGrid">
                    {copy.heroFacts.map((fact) => (
                      <span key={fact}>{fact}</span>
                    ))}
                  </div>
                </article>

                <div className="publicHeroActions discoverHeroActions">
                  <Link href={copy.ctaPrimaryHref} className="primaryPublicButton">
                    {copy.ctaPrimaryLabel}
                  </Link>
                  <Link href={copy.ctaSecondaryHref} className="ghostPublicButton">
                    {copy.ctaSecondaryLabel}
                  </Link>
                </div>
              </>
            ) : isCommunityPage ? (
              <>
                <div className="communitySearchCard">
                  <div className="discoverSearchField">
                    <Search className="publicCardIcon" strokeWidth={2.1} />
                    <span>
                      {tr(
                        'Rechercher un profil, un secteur ou une competence',
                        'Search a profile, sector or skill',
                        'Ø§Ø¨Ø­Ø« Ø¹Ù† Ù…Ù„Ù Ø£Ùˆ Ù‚Ø·Ø§Ø¹ Ø£Ùˆ Ù…Ù‡Ø§Ø±Ø©'
                      )}
                    </span>
                  </div>

                  <div className="discoverFilterRow">
                    {communityHeroFilters.map((item) => (
                      <span key={item} className="discoverFilterChip">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="communitySearchMeta">
                    <div className="discoverInfoBlock">
                      <small>{tr('Secteurs actifs', 'Active sectors', 'Ø§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø©')}</small>
                      <div className="discoverInlineList">
                        {communityHeroSectors.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </div>
                    <div className="discoverInfoBlock">
                      <small>{tr('Tags visibles', 'Visible tags', 'Ø§Ù„ÙˆØ³ÙˆÙ… Ø§Ù„Ø¸Ø§Ù‡Ø±Ø©')}</small>
                      <div className="discoverInlineList soft">
                        {communityHeroTags.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <article className="communityHeroPreview">
                  <div className="communityHeroPreviewHead">
                    <strong>{tr('Apercu du reseau', 'Network preview', 'Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„Ø´Ø¨ÙƒØ©')}</strong>
                    <span>{tr('Activite recente', 'Recent activity', 'Ù†Ø´Ø§Ø· Ø­Ø¯ÙŠØ«')}</span>
                  </div>
                  <div className="communityHeroPreviewBody">
                    {communityFeedItems.map((item) => (
                      <div key={`${item.author}-${item.title}`} className="communityPreviewPost">
                        <div className="communityPreviewAuthor">
                          <span className="communityPreviewAvatar">{item.author.slice(0, 2).toUpperCase()}</span>
                          <div>
                            <strong>{item.author}</strong>
                            <small>{item.role}</small>
                          </div>
                          <em>{item.meta}</em>
                        </div>
                        <p>{item.text}</p>
                        <div className="discoverInlineList soft">
                          {item.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <div className="publicHeroActions">
                  <Link href={copy.ctaPrimaryHref} className="primaryPublicButton">
                    {tr('Explorer la communaute', 'Explore community', 'Ø§Ø³ØªÙƒØ´Ù Ø§Ù„Ù…Ø¬ØªÙ…Ø¹')}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="publicHeroStats">
                  {copy.heroFacts.map((fact) => (
                    <span key={fact}>{fact}</span>
                  ))}
                </div>

                <div className="publicHeroActions">
                  <Link href={routes.home} className="ghostPublicButton">
                    {tr('Retour accueil', 'Back home', 'Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©')}
                  </Link>
                  <Link href={copy.ctaPrimaryHref} className="primaryPublicButton">
                    {copy.ctaPrimaryLabel}
                  </Link>
                </div>
              </>
            )}
            </div>
          }
        />

        {copy.sections.map((section, sectionIndex) => {
          const isPremiumPlanSection = isPremiumPage && sectionIndex === 0;
          const isCommunityNetworkSection = isCommunityPage && sectionIndex === 0;

          return (
            <section
              key={section.title}
              id={isPremiumPlanSection ? 'premium-offers' : undefined}
              className={isPremiumPlanSection ? 'publicSectionCard premiumCatalogSection' : isCommunityNetworkSection ? 'publicSectionCard communityNetworkSection' : 'publicSectionCard'}
            >
              <div className="publicSectionHead">
                <span className="publicEyebrow">{section.eyebrow}</span>
                <h2>{section.title}</h2>
                <p>{section.lead}</p>
              </div>

              {isCommunityNetworkSection ? (
                <div className="communityNetworkLayout">
                  <div className="communityFeedColumn">
                    {communityFeedItems.map((item) => (
                      <article key={`${item.author}-${item.title}-feed`} className="communityFeedEntry">
                        <div className="communityFeedEntryHead">
                          <div className="communityPreviewAuthor">
                            <span className="communityPreviewAvatar">{item.author.slice(0, 2).toUpperCase()}</span>
                            <div>
                              <strong>{item.author}</strong>
                              <small>{item.role}</small>
                            </div>
                          </div>
                          <em>{item.meta}</em>
                        </div>
                        <p className="communityFeedEntryText">{item.text}</p>
                        <div className="communityFeedEntryNote">
                          <strong>{item.title}</strong>
                          <span>
                            {isFrench
                              ? 'Contexte, objectifs et prochaines etapes.'
                              : 'Context, goals and the next steps.'}
                          </span>
                        </div>
                        <div className="communityFeedSignals">
                          {item.tags.map((tag) => (
                            <span key={tag} className="communitySignalTag">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="communityFeedSignals communityFeedSignalsDense">
                          {item.signals.map((signal) => (
                            <span key={signal}>{signal}</span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>

                  <aside className="communitySidebarColumn">
                    {communitySidebarSections.map((group) => (
                      <article key={group.title} className="communitySidebarCard">
                        <strong>{group.title}</strong>
                        <ul className="communitySidebarList">
                          {group.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </aside>
                </div>
              ) : (
              <div className={isPremiumPlanSection ? 'publicCardGrid premiumPlanGrid' : 'publicCardGrid'}>
                {section.cards.map((card) => {
                  const Icon = card.icon;
                  const cardClassName = [
                    'publicInfoCard',
                    card.tone || 'blue',
                    isPremiumPlanSection ? 'premiumPlanCard' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const content = (
                    <>
                      {isPremiumPlanSection ? (
                        <>
                          <div className="premiumPlanTop">
                            <span className={`premiumPlanIconShell ${card.tone || 'blue'}`}>
                              <Icon className="publicCardIcon" strokeWidth={2.1} />
                            </span>
                            <div className="premiumPlanTitleBlock">
                              {card.eyebrow ? <small className="premiumPlanEyebrow">{card.eyebrow}</small> : null}
                              <strong className="premiumPlanTitle">{card.title}</strong>
                            </div>
                            {card.detailPill ? <span className={`premiumPlanPill ${card.tone || 'blue'}`}>{card.detailPill}</span> : null}
                          </div>
                          <p className="premiumPlanSummary">{card.text}</p>
                          {card.price ? (
                            <div className="premiumPlanPricing">
                              <strong className="publicPlanPrice">{card.price}</strong>
                              {card.priceLabel ? <span className="premiumPlanPriceLabel">{card.priceLabel}</span> : null}
                            </div>
                          ) : null}
                          {card.highlightTitle || card.highlightText ? (
                            <div className={`premiumPlanHighlight ${card.tone || 'blue'}`}>
                              {card.highlightTitle ? <span className="premiumPlanHighlightEyebrow">{card.highlightTitle}</span> : null}
                              {card.highlightText ? <p>{card.highlightText}</p> : null}
                            </div>
                          ) : null}
                          {card.bullets?.length ? (
                            <ul className="publicBulletList premiumBulletList">
                              {card.bullets.map((item) => (
                                <li key={item}>
                                  <span className={`premiumFeatureDot ${card.tone || 'blue'}`} />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {card.meta ? <span className="publicMetaText">{card.meta}</span> : null}
                          {card.href && card.ctaLabel ? <span className="publicInlineCta">{card.ctaLabel}</span> : null}
                        </>
                      ) : (
                        <>
                          <span className={`publicCardTone ${card.tone || 'blue'}`}>
                            <Icon className="publicCardIcon" strokeWidth={2.1} />
                            {card.eyebrow ? <small>{card.eyebrow}</small> : null}
                          </span>
                          <strong>{card.title}</strong>
                          <p>{card.text}</p>
                          {card.bullets?.length ? (
                            <ul className="publicBulletList">
                              {card.bullets.map((item) => (
                                <li key={item}>
                                  <CheckCircle2 className="publicBulletIcon" strokeWidth={2.1} />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {card.meta ? <span className="publicMetaText">{card.meta}</span> : null}
                          {card.href && card.ctaLabel ? <span className="publicInlineCta">{card.ctaLabel}</span> : null}
                        </>
                      )}
                    </>
                  );

                  if (card.href) {
                    return (
                      <Link key={card.title} href={card.href} className={cardClassName}>
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <article key={card.title} className={cardClassName}>
                      {content}
                    </article>
                  );
                })}
              </div>
              )}
            </section>
          );
        })}

        <section className="publicCtaCard">
          <div>
            <span className="publicEyebrow">{copy.navLabel}</span>
            <h2>{copy.ctaTitle}</h2>
            <p>{copy.ctaText}</p>
          </div>

          <div className="publicHeroActions">
            <Link href={copy.ctaPrimaryHref} className="primaryPublicButton">
              {copy.ctaPrimaryLabel}
            </Link>
            <Link href={copy.ctaSecondaryHref} className="ghostPublicButton">
              {copy.ctaSecondaryLabel}
            </Link>
          </div>
        </section>

          <SiteFooter locale={locale} variant="public" />
        </div>

        <style>{`
        .publicInfoPage {
          min-height: 100vh;
          padding: 18px 14px 28px;
          color: var(--ink-950);
          --public-surface-ink: #0f172a;
          --public-surface-muted: #475569;
          --public-surface-soft: #334155;
          --public-surface-brand: #1d4ed8;
        }

        .publicInfoShell {
          display: grid;
          gap: 18px;
        }

        .publicHeroCard,
        .publicSectionCard,
        .publicCtaCard {
          border: 1px solid var(--line-soft);
          border-radius: 26px;
          background: var(--panel-strong);
          box-shadow: var(--shadow-soft);
          backdrop-filter: blur(18px);
        }

        .publicHeroCard {
          padding: 28px;
        }

        .isDiscoverPage .publicHeroCard {
          padding: 30px;
        }

        .publicHeroAside,
        .publicSectionHead {
          display: grid;
          gap: 12px;
        }

        .publicSectionCard h2,
        .publicCtaCard h2 {
          margin: 0;
          letter-spacing: -0.05em;
        }

        .isCommunityPage .publicHeroCard {
          padding: 30px;
        }

        .isPremiumPage .publicHeroCard {
          padding: 30px;
        }

        .isPrivacyPage .publicHeroCard {
          padding: 30px;
        }

        .publicHeroCard p,
        .publicSectionCard p,
        .publicCtaCard p,
        .publicInfoCard p {
          margin: 0;
          color: var(--ink-500);
          line-height: 1.7;
        }

        .publicEyebrow {
          width: fit-content;
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 0 11px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(235, 244, 255, 0.96), rgba(219, 234, 254, 0.9));
          color: var(--brand-700);
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
        }

        .publicHeroStats,
        .publicHeroActions {
          display: grid;
          gap: 10px;
        }

        .publicHeroStats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .publicHeroStats span:last-child {
          grid-column: 1 / -1;
        }

        .publicHeroActions {
          grid-template-columns: repeat(2, minmax(0, max-content));
          align-content: start;
        }

        .publicHeroStats span {
          min-height: var(--control-height-compact);
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: var(--radius-pill);
          background: linear-gradient(180deg, rgba(250, 252, 255, 0.98), rgba(239, 246, 255, 0.94));
          border: 1px solid rgba(29, 78, 216, 0.14);
          color: var(--public-surface-brand);
          font-size: 0.82rem;
          font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
        }

        .discoverHeroAside {
          align-content: start;
          gap: 14px;
        }

        .discoverSearchCard,
        .discoverSpotlightCard {
          display: grid;
          gap: 14px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.94)),
            rgba(255, 255, 255, 0.88);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
        }

        .discoverSearchField {
          min-height: 52px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(255, 255, 255, 0.78);
          color: var(--public-surface-soft);
          font-weight: 700;
        }

        .discoverFilterRow,
        .discoverSignalGrid,
        .discoverInlineList {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .discoverFilterChip,
        .discoverInlineList span,
        .discoverSignalGrid span {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.94);
          color: var(--public-surface-ink);
          font-size: 0.84rem;
          font-weight: 700;
          line-height: 1;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .discoverFilterChip {
          color: var(--public-surface-brand);
          background: rgba(239, 246, 255, 0.94);
        }

        .discoverInfoGrid,
        .discoverInfoBlock,
        .discoverSpotlightIdentity {
          display: grid;
          gap: 8px;
        }

        .discoverInfoBlock small {
          color: var(--public-surface-muted);
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .discoverInlineList.soft span,
        .discoverSignalGrid span {
          background: rgba(248, 250, 252, 0.98);
          color: var(--public-surface-soft);
        }

        .discoverSpotlightHead {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .discoverAvatarShell {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(219, 234, 254, 0.96), rgba(191, 219, 254, 0.92));
          color: var(--brand-700);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
        }

        .discoverSpotlightIdentity strong {
          font-size: 1.1rem;
          letter-spacing: -0.03em;
        }

        .discoverSpotlightIdentity small {
          color: var(--public-surface-muted);
          font-size: 0.92rem;
        }

        .discoverVerifiedPill {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(29, 78, 216, 0.16);
          background: rgba(239, 246, 255, 0.9);
          color: var(--public-surface-brand);
          font-size: 0.8rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .discoverSpotlightText {
          margin: 0;
          color: var(--public-surface-muted);
          line-height: 1.65;
        }

        .communityHeroAside,
        .communitySearchCard,
        .communityHeroPreview,
        .communitySearchMeta,
        .communityHeroPreviewBody,
        .communityPreviewPost {
          display: grid;
          gap: 14px;
        }

        .communitySearchCard,
        .communityHeroPreview,
        .communityFeedEntry,
        .communitySidebarCard {
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.94)),
            rgba(255, 255, 255, 0.92);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
        }

        .communityHeroPreviewHead,
        .communityFeedEntryHead,
        .communityPreviewAuthor,
        .communityFeedSignals {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .communityHeroPreviewHead,
        .communityFeedEntryHead {
          justify-content: space-between;
        }

        .communityHeroPreviewHead strong,
        .communitySidebarCard strong,
        .communityFeedEntryNote strong {
          font-size: 0.96rem;
          letter-spacing: -0.02em;
        }

        .communityHeroPreviewHead span,
        .communityFeedEntryHead em,
        .communityPreviewAuthor small,
        .communityFeedEntryNote span {
          color: var(--public-surface-muted);
          font-size: 0.9rem;
          font-style: normal;
        }

        .communityPreviewAuthor {
          align-items: flex-start;
          flex: 1 1 auto;
        }

        .communityPreviewAuthor > div {
          display: grid;
          gap: 2px;
        }

        .communityPreviewAvatar {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(219, 234, 254, 0.94), rgba(191, 219, 254, 0.9));
          color: var(--brand-700);
          font-size: 0.84rem;
          font-weight: 800;
          line-height: 1;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
        }

        .communityPreviewPost p,
        .communityFeedEntryText {
          margin: 0;
          color: var(--public-surface-ink);
          line-height: 1.62;
        }

        .communityFeedEntryNote {
          display: grid;
          gap: 6px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(248, 250, 252, 0.92);
        }

        .communitySignalTag,
        .communityFeedSignalsDense span {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.94);
          color: var(--public-surface-ink);
          font-size: 0.84rem;
          font-weight: 700;
          line-height: 1;
        }

        .communitySignalTag {
          color: var(--brand-700);
          background: rgba(239, 246, 255, 0.94);
        }

        .communityFeedSignals {
          flex-wrap: wrap;
        }

        .communityFeedSignalsDense {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .communityNetworkSection {
          padding: 24px;
        }

        .communityNetworkLayout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
          gap: 16px;
          margin-top: 18px;
        }

        .communityFeedColumn,
        .communitySidebarColumn {
          display: grid;
          gap: 14px;
          align-content: start;
        }

        .communitySidebarCard {
          gap: 12px;
        }

        .communitySidebarList {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 10px;
        }

        .communitySidebarList li {
          color: var(--public-surface-muted);
          line-height: 1.55;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
        }

        .communitySidebarList li:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }

        .premiumHeroPanel,
        .premiumHeroSignalList {
          display: grid;
          gap: 14px;
        }

        .premiumHeroPanel {
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.94)),
            rgba(255, 255, 255, 0.92);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
        }

        .premiumHeroPanelHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .premiumHeroPanelHead strong {
          font-size: 1rem;
          letter-spacing: -0.02em;
        }

        .premiumHeroPanelHead span,
        .premiumHeroSignalRow p {
          color: var(--public-surface-muted);
          font-size: 0.92rem;
        }

        .premiumHeroSignalRow {
          display: grid;
          gap: 6px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(248, 250, 252, 0.92);
        }

        .premiumHeroSignalRow strong {
          font-size: 0.98rem;
          letter-spacing: -0.02em;
        }

        .premiumHeroSignalRow p {
          margin: 0;
          line-height: 1.62;
        }

        .premiumHeroStatusGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .premiumHeroStatusGrid span {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          padding: 0 14px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.96);
          color: var(--public-surface-ink);
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
        }

        .premiumHeroActions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .privacyHeroPanel,
        .privacyHeroSignalList {
          display: grid;
          gap: 14px;
        }

        .privacyHeroPanel {
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.94)),
            rgba(255, 255, 255, 0.92);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
        }

        .privacyHeroPanelHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .privacyHeroPanelHead strong {
          font-size: 1rem;
          letter-spacing: -0.02em;
        }

        .privacyHeroPanelHead span,
        .privacyHeroSignalRow p {
          color: var(--public-surface-muted);
          font-size: 0.92rem;
        }

        .privacyHeroSignalRow {
          display: grid;
          gap: 6px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(248, 250, 252, 0.92);
        }

        .privacyHeroSignalRow strong {
          font-size: 0.98rem;
          letter-spacing: -0.02em;
        }

        .privacyHeroSignalRow p {
          margin: 0;
          line-height: 1.62;
        }

        .privacyHeroStatusGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .privacyHeroStatusGrid span {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          padding: 0 14px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.96);
          color: var(--public-surface-ink);
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
        }

        .privacyHeroActions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .primaryPublicButton,
        .ghostPublicButton {
          min-height: var(--control-height);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 16px;
          border-radius: var(--radius-control);
          font-weight: 800;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .primaryPublicButton {
          background: linear-gradient(135deg, var(--brand-700), var(--brand-500) 58%, #60a5fa);
          color: #ffffff;
          box-shadow: var(--button-shadow-primary);
        }

        .ghostPublicButton {
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
          color: var(--ink-950);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
        }

        .primaryPublicButton:hover,
        .ghostPublicButton:hover,
        .publicInfoCard:hover {
          transform: translateY(-2px);
        }

        .publicSectionCard,
        .publicCtaCard {
          padding: 24px;
        }

        .publicCardGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
        }

        .isDiscoverPage .publicSectionCard {
          padding: 22px;
        }

        .isDiscoverPage .publicSectionHead {
          gap: 10px;
        }

        .isDiscoverPage .publicSectionCard h2 {
          max-width: 16ch;
          font-size: clamp(1.7rem, 2.6vw, 2.55rem);
          line-height: 1.04;
        }

        .isDiscoverPage .publicSectionCard p {
          max-width: 64ch;
        }

        .premiumCatalogSection {
          background:
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.1), transparent 28%),
            radial-gradient(circle at top left, rgba(251, 191, 36, 0.1), transparent 24%),
            var(--panel-strong);
        }

        .premiumPlanGrid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .publicInfoCard {
          display: grid;
          gap: 12px;
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
          color: var(--ink-950);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .isDiscoverPage .publicInfoCard {
          gap: 10px;
          padding: 20px;
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94)),
            rgba(255, 255, 255, 0.88);
          box-shadow: 0 18px 28px rgba(15, 23, 42, 0.045);
        }

        .premiumPlanCard {
          position: relative;
          overflow: hidden;
          gap: 14px;
          min-height: 100%;
          padding: 22px;
          border-radius: 22px;
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
        }

        .premiumPlanCard::before,
        .premiumPlanCard::after {
          content: '';
          position: absolute;
          inset: auto;
          pointer-events: none;
        }

        .premiumPlanCard::before {
          top: -46px;
          right: -26px;
          width: 138px;
          height: 138px;
          border-radius: 999px;
          filter: blur(12px);
          opacity: 0.72;
        }

        .premiumPlanCard::after {
          top: 0;
          left: 18px;
          right: 18px;
          height: 3px;
          border-radius: 999px;
        }

        .premiumPlanCard:hover {
          transform: translateY(-5px);
          box-shadow: 0 30px 52px rgba(15, 23, 42, 0.12);
        }

        .publicInfoCard strong {
          font-size: 1.14rem;
          letter-spacing: -0.03em;
        }

        .isDiscoverPage .publicInfoCard strong {
          font-size: 1.18rem;
          line-height: 1.18;
        }

        .publicPlanPrice {
          font-size: clamp(2.05rem, 3.6vw, 2.9rem) !important;
          letter-spacing: -0.06em !important;
          line-height: 0.94;
        }

        .premiumPlanTop {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
        }

        .premiumPlanIconShell {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.34);
        }

        .premiumPlanIconShell.light {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(226, 232, 240, 0.98));
          color: var(--public-surface-muted);
        }

        .premiumPlanIconShell.silver {
          background: linear-gradient(135deg, rgba(226, 232, 240, 1), rgba(148, 163, 184, 0.94));
          color: var(--public-surface-soft);
        }

        .premiumPlanIconShell.gold {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.98), rgba(250, 204, 21, 0.96));
          color: #ffffff;
        }

        .premiumPlanIconShell.violet {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.98), rgba(168, 85, 247, 0.96));
          color: #ffffff;
        }

        .premiumPlanTitleBlock {
          display: grid;
          gap: 4px;
        }

        .premiumPlanEyebrow,
        .premiumPlanHighlightEyebrow {
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .premiumPlanEyebrow {
          color: var(--public-surface-brand);
        }

        .premiumPlanTitle {
          margin: 0;
          color: var(--public-surface-ink);
          font-size: 1.9rem !important;
          line-height: 1.05;
          letter-spacing: -0.05em !important;
        }

        .premiumPlanPill {
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

        .premiumPlanPill.light {
          background: rgba(255, 255, 255, 0.9);
          color: var(--public-surface-muted);
          border-color: rgba(148, 163, 184, 0.24);
        }

        .premiumPlanPill.silver {
          background: rgba(255, 255, 255, 0.66);
          color: var(--public-surface-soft);
          border-color: rgba(148, 163, 184, 0.24);
        }

        .premiumPlanPill.gold {
          background: rgba(255, 251, 235, 0.76);
          color: #b45309;
          border-color: rgba(245, 158, 11, 0.24);
        }

        .premiumPlanPill.violet {
          background: rgba(250, 245, 255, 0.76);
          color: #7c3aed;
          border-color: rgba(168, 85, 247, 0.24);
        }

        .premiumPlanSummary {
          margin: 0;
          font-size: 1.02rem;
        }

        .premiumPlanPricing {
          display: grid;
          gap: 4px;
        }

        .premiumPlanPriceLabel {
          color: var(--public-surface-muted);
          font-size: 1rem;
          font-weight: 800;
        }

        .premiumPlanHighlight {
          display: grid;
          gap: 10px;
          padding: 18px 18px 16px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.56);
          background: rgba(255, 255, 255, 0.62);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.54);
        }

        .premiumPlanHighlight.light {
          background: rgba(255, 255, 255, 0.76);
        }

        .premiumPlanHighlight.silver {
          background: rgba(255, 255, 255, 0.66);
        }

        .premiumPlanHighlight.gold {
          background: rgba(255, 251, 235, 0.76);
          border-color: rgba(245, 158, 11, 0.16);
        }

        .premiumPlanHighlight.violet {
          background: rgba(250, 245, 255, 0.78);
          border-color: rgba(168, 85, 247, 0.14);
        }

        .premiumPlanHighlightEyebrow {
          color: var(--public-surface-muted);
        }

        .premiumPlanCard.gold .premiumPlanHighlightEyebrow {
          color: #a16207;
        }

        .premiumPlanCard.violet .premiumPlanHighlightEyebrow {
          color: #7c3aed;
        }

        .premiumPlanHighlight p {
          margin: 0;
        }

        .publicCardTone {
          width: fit-content;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          border-radius: 14px;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        .publicCardTone.blue {
          background: rgba(219, 234, 254, 0.92);
          color: var(--brand-700);
        }

        .publicCardTone.mint {
          background: rgba(204, 251, 241, 0.92);
          color: #0f766e;
        }

        .publicCardTone.slate,
        .publicCardTone.light {
          background: rgba(241, 245, 249, 0.96);
          color: var(--public-surface-soft);
        }

        .publicCardTone.silver {
          background: linear-gradient(135deg, rgba(226, 232, 240, 0.98), rgba(203, 213, 225, 0.94));
          color: var(--public-surface-soft);
        }

        .publicCardTone.gold {
          background: linear-gradient(135deg, rgba(254, 240, 138, 0.98), rgba(251, 191, 36, 0.96));
          color: #854d0e;
        }

        .publicCardTone.violet {
          background: linear-gradient(135deg, rgba(221, 214, 254, 0.98), rgba(168, 85, 247, 0.94));
          color: #581c87;
        }

        .publicInfoCard.free,
        .publicInfoCard.light {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 250, 0.96));
        }

        .premiumPlanCard.light {
          border-color: rgba(148, 163, 184, 0.18);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(242, 244, 247, 0.96)),
            rgba(255, 255, 255, 0.92);
        }

        .premiumPlanCard.light::before {
          background: radial-gradient(circle, rgba(203, 213, 225, 0.58), transparent 70%);
        }

        .premiumPlanCard.light::after {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.7), rgba(226, 232, 240, 0.94));
        }

        .publicInfoCard.silver {
          background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.94));
        }

        .premiumPlanCard.silver {
          border-color: rgba(148, 163, 184, 0.24);
          background:
            linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(226, 232, 240, 0.96) 55%, rgba(203, 213, 225, 0.94));
        }

        .premiumPlanCard.silver::before {
          background: radial-gradient(circle, rgba(226, 232, 240, 0.78), transparent 68%);
        }

        .premiumPlanCard.silver::after {
          background: linear-gradient(90deg, rgba(203, 213, 225, 0.96), rgba(100, 116, 139, 0.88));
        }

        .publicInfoCard.gold {
          background: linear-gradient(180deg, rgba(255, 251, 235, 0.99), rgba(253, 230, 138, 0.88));
          border-color: rgba(245, 158, 11, 0.18);
        }

        .premiumPlanCard.gold {
          border-color: rgba(245, 158, 11, 0.24);
          background:
            linear-gradient(160deg, rgba(255, 255, 255, 0.99), rgba(255, 247, 214, 0.98) 42%, rgba(251, 191, 36, 0.34)),
            rgba(255, 248, 227, 0.96);
        }

        .premiumPlanCard.gold::before {
          background: radial-gradient(circle, rgba(250, 204, 21, 0.82), transparent 68%);
        }

        .premiumPlanCard.gold::after {
          background: linear-gradient(90deg, rgba(254, 240, 138, 0.94), rgba(245, 158, 11, 0.92));
        }

        .publicInfoCard.violet {
          background: linear-gradient(180deg, rgba(250, 245, 255, 0.99), rgba(216, 180, 254, 0.9));
          border-color: rgba(168, 85, 247, 0.18);
        }

        .premiumPlanCard.violet {
          border-color: rgba(168, 85, 247, 0.26);
          background:
            linear-gradient(155deg, rgba(255, 255, 255, 0.99), rgba(248, 241, 255, 0.98) 36%, rgba(196, 181, 253, 0.48) 78%, rgba(168, 85, 247, 0.4)),
            rgba(250, 245, 255, 0.97);
        }

        .premiumPlanCard.violet::before {
          background: radial-gradient(circle, rgba(196, 181, 253, 0.88), transparent 70%);
        }

        .premiumPlanCard.violet::after {
          background: linear-gradient(90deg, rgba(196, 181, 253, 0.95), rgba(168, 85, 247, 0.96));
        }

        .premiumPlanCard.light .publicPlanPrice {
          color: var(--public-surface-ink);
        }

        .premiumPlanCard.silver .publicPlanPrice {
          color: var(--public-surface-muted);
        }

        .premiumPlanCard.gold .publicPlanPrice {
          color: #a16207;
        }

        .premiumPlanCard.violet .publicPlanPrice {
          color: #7c3aed;
        }

        .premiumBulletList li {
          color: var(--public-surface-ink);
          font-size: 1.02rem;
          font-weight: 700;
        }

        .premiumFeatureDot {
          width: 10px;
          height: 10px;
          flex: 0 0 auto;
          margin-top: 0.42rem;
          border-radius: 999px;
          background: #cbd5e1;
          box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.32);
        }

        .premiumFeatureDot.silver {
          background: #94a3b8;
        }

        .premiumFeatureDot.gold {
          background: #f59e0b;
        }

        .premiumFeatureDot.violet {
          background: #8b5cf6;
        }

        .premiumPlanCard .publicInlineCta {
          margin-top: auto;
          min-height: var(--control-height);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-control);
          padding: 0 16px;
          border: 1px solid transparent;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }

        .premiumPlanCard.light .publicInlineCta {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(226, 232, 240, 0.96));
          color: var(--public-surface-ink);
          border-color: rgba(148, 163, 184, 0.24);
        }

        .premiumPlanCard.silver .publicInlineCta {
          background: linear-gradient(135deg, rgba(226, 232, 240, 0.96), rgba(148, 163, 184, 0.92));
          color: var(--public-surface-ink);
          border-color: rgba(100, 116, 139, 0.18);
        }

        .premiumPlanCard.gold .publicInlineCta {
          background: linear-gradient(135deg, rgba(250, 204, 21, 0.96), rgba(245, 158, 11, 0.94));
          color: #ffffff;
        }

        .premiumPlanCard.violet .publicInlineCta {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.96), rgba(168, 85, 247, 0.94));
          color: #ffffff;
        }

        .publicCardIcon,
        .publicBulletIcon {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
        }

        .publicBulletList {
          display: grid;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .publicBulletList li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: var(--ink-700);
          font-weight: 700;
          line-height: 1.5;
        }

        .isDiscoverPage .publicBulletList {
          margin-top: 2px;
        }

        .isDiscoverPage .publicBulletList li {
          color: var(--public-surface-soft);
        }

        .publicMetaText {
          color: var(--brand-700);
          font-weight: 800;
        }

        .publicInlineCta {
          color: var(--brand-700);
          font-weight: 800;
        }

        .publicCtaCard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .isDiscoverPage .publicCtaCard {
          padding: 22px 24px;
        }

        .isDiscoverPage .publicCtaCard h2 {
          font-size: clamp(1.45rem, 2.3vw, 2rem);
          line-height: 1.08;
        }

        html[data-theme='dark'] .publicHeroCard,
        html[data-theme='dark'] .publicSectionCard,
        html[data-theme='dark'] .publicCtaCard,
        html[data-theme='dark'] .publicInfoCard {
          background: var(--panel-strong);
        }

        html[data-theme='dark'] .publicHeroStats span,
        html[data-theme='dark'] .publicCardTone.light,
        html[data-theme='dark'] .publicCardTone.slate {
          background: rgba(15, 23, 42, 0.88);
          color: var(--ink-950);
        }

        html[data-theme='dark'] .ghostPublicButton {
          background: rgba(15, 23, 42, 0.86);
          color: var(--ink-950);
        }

        html[data-theme='dark'] .publicInfoPage .premiumPlanTitle,
        html[data-theme='dark'] .publicInfoPage .premiumBulletList li,
        html[data-theme='dark'] .publicInfoPage .premiumPlanCard.light .publicPlanPrice,
        html[data-theme='dark'] .publicInfoPage .premiumPlanCard.silver .publicPlanPrice,
        html[data-theme='dark'] .publicInfoPage .premiumPlanCard.light .publicInlineCta,
        html[data-theme='dark'] .publicInfoPage .premiumPlanCard.silver .publicInlineCta {
          color: var(--public-surface-ink) !important;
        }

        html[data-theme='dark'] .publicInfoPage .premiumPlanCard p,
        html[data-theme='dark'] .publicInfoPage .premiumPlanPriceLabel,
        html[data-theme='dark'] .publicInfoPage .premiumPlanHighlightEyebrow,
        html[data-theme='dark'] .publicInfoPage .premiumPlanPill.light,
        html[data-theme='dark'] .publicInfoPage .premiumPlanPill.silver {
          color: var(--public-surface-muted) !important;
        }

        html[data-theme='dark'] .publicInfoPage .premiumPlanEyebrow {
          color: var(--public-surface-brand) !important;
        }

        @media (max-width: 1100px) {
          .publicHeroCard,
          .publicCtaCard {
            grid-template-columns: 1fr;
          }

          .publicHeroStats,
          .publicHeroActions {
            grid-template-columns: 1fr;
          }

          .publicHeroStats span:last-child {
            grid-column: auto;
          }

          .premiumPlanGrid,
          .publicCardGrid {
            grid-template-columns: 1fr;
          }

          .discoverSpotlightHead {
            grid-template-columns: 1fr;
            align-items: start;
          }

          .discoverHeroActions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .communityNetworkLayout,
          .communityFeedSignalsDense {
            grid-template-columns: 1fr;
          }

          .premiumHeroActions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .privacyHeroActions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .communityHeroPreviewHead,
          .communityFeedEntryHead {
            align-items: start;
            gap: 12px;
          }

          .publicCtaCard {
            display: grid;
          }
        }

        @media (max-width: 720px) {
          .publicInfoPage {
            padding: 14px 12px 24px;
          }

          .publicHeroCard,
          .publicSectionCard,
          .publicCtaCard {
            padding: 20px;
            border-radius: 24px;
          }

          .publicHeroActions {
            grid-template-columns: 1fr;
          }

          .primaryPublicButton,
          .ghostPublicButton {
            width: 100%;
          }

          .discoverSearchField {
            min-height: 50px;
            padding: 0 14px;
          }

          .discoverFilterChip,
          .discoverInlineList span,
          .discoverSignalGrid span {
            font-size: 0.8rem;
          }

          .communityPreviewAuthor,
          .communityHeroPreviewHead,
          .communityFeedEntryHead {
            flex-direction: column;
            align-items: flex-start;
          }

          .communityFeedSignalsDense {
            grid-template-columns: 1fr;
          }

          .premiumHeroPanelHead {
            flex-direction: column;
            align-items: flex-start;
          }

          .privacyHeroPanelHead {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        `}</style>
      </main>
    </PublicExperienceFrame>
  );
}
