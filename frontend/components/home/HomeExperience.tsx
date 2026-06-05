'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Crown,
  Eye,
  FileText,
  Globe2,
  GraduationCap,
  Hash,
  Heart,
  ImageIcon,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  Palette,
  Phone,
  Plus,
  Radio,
  Rocket,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  Video,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import PublicLandingExperience from '@/components/home/PublicLandingExperience';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale, type Locale } from '@/i18n.config';
import { buildCheckoutHref, getCheckoutFlowContent } from '@/lib/checkout-flow';
import { buildPublicRoutes } from '@/lib/public-routes';

interface PublicProfileCard {
  id: number;
  userId?: number;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  country?: string | null;
  city?: string | null;
  profilePictureUrl?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  currentIndustry?: string | null;
  publicProfileUrl?: string | null;
  membershipTier?: string | null;
  verified?: boolean;
  connectionStatus?: string | null;
  canRequest?: boolean;
  interests?: Array<{ id: number; name: string }>;
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
  professionalExperiences?: Array<{ id: number }>;
  interests?: Array<{ id: number; name: string }>;
  privacySettings?: {
    profileVisibility?: string | null;
    allowNetworkingRequests?: boolean;
  };
}

type PostVisibility = 'public' | 'connections' | 'private';
type PostComposerType = 'photo' | 'video' | 'cv' | 'project' | 'article' | 'event' | 'offer';
type FeedFilter = 'recommended' | 'all' | 'opportunities' | 'events' | 'documents' | 'cv';
type ComposerPanel = 'add' | 'audience' | null;

const composerFileAccept: Partial<Record<PostComposerType, string>> = {
  photo: 'image/*',
  video: 'video/*',
  cv: '.pdf,.doc,.docx,image/*',
};

function isFileComposerType(type: PostComposerType) {
  return Boolean(composerFileAccept[type]);
}

interface FeedAttachment {
  title: string;
  detail: string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  type?: string;
}

interface FeedPost {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  time: string;
  text: string;
  visibility: PostVisibility;
  chips: string[];
  premium: boolean;
  accent: 'ocean' | 'gold' | 'slate' | 'mint' | 'member';
  contentType: PostComposerType;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  attachment?: FeedAttachment;
  ctaHref?: string;
  ctaLabel?: string;
  canEdit?: boolean;
}

interface FeedBehavior {
  views?: number;
  dwellMs?: number;
  liked?: boolean;
  saved?: boolean;
  lastSeen?: number;
}

type FeedBehaviorMap = Record<string, FeedBehavior>;

interface MemberQuickLink {
  label: string;
  icon: LucideIcon;
  href?: string;
  feedFilter?: FeedFilter;
}

interface BackendPost {
  id: number;
  type?: string;
  body?: string;
  visibility?: PostVisibility;
  attachments?: Array<{ title?: string; detail?: string; fileName?: string; fileUrl?: string; mimeType?: string; type?: string }>;
  stats?: {
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
  author?: {
    fullName?: string;
    username?: string;
    headline?: string;
    profilePictureUrl?: string | null;
    membershipTier?: string | null;
    verified?: boolean;
  };
  viewerState?: {
    liked?: boolean;
    saved?: boolean;
    canEdit?: boolean;
  };
  createdAt?: string;
}

interface BackendComment {
  id: number;
  body: string;
  author?: {
    fullName?: string;
    profilePictureUrl?: string | null;
  };
  createdAt?: string;
}

interface HomeEvent {
  id: number;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  type?: string | null;
  joined?: boolean;
}

interface MarketingCard {
  title: string;
  text: string;
  icon: LucideIcon;
  badge?: string;
}

interface TestimonialCard {
  quote: string;
  name: string;
  role: string;
}

interface OpportunityCard {
  title: string;
  subtitle: string;
  meta: string;
  cta: string;
  icon: LucideIcon;
  tone: 'ocean' | 'gold' | 'slate' | 'mint';
}

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const apiRoot = backendOrigin ? `${backendOrigin}/api` : '/api';
const apiBase = backendOrigin ? `${backendOrigin}/api/profile` : '/api/profile';
const FEED_BEHAVIOR_STORAGE_KEY = 'communium.feed.behavior.v1';
const composerBackgroundOptions = ['', '#ffffff', '#dbeafe', '#dcfce7', '#fef3c7', '#fee2e2', '#ede9fe', '#111827'];
const postReactionOptions = [
  { label: 'Like', emoji: '\u{1F44D}' },
  { label: 'Love', emoji: '\u{2764}\u{FE0F}' },
  { label: 'Bravo', emoji: '\u{1F44F}' },
  { label: 'Smile', emoji: '\u{1F604}' },
  { label: 'Wow', emoji: '\u{1F62E}' },
  { label: 'Support', emoji: '\u{1F91D}' },
];

const opportunityTerms = [
  'opportunite',
  'opportunite',
  'offre',
  'emploi',
  'job',
  'travail',
  'recrutement',
  'hiring',
  'stage',
  'mission',
  'freelance',
  'business',
  'career',
];

const documentTerms = ['document', 'cv', 'resume', 'pdf', 'portfolio', 'certificat', 'certification', 'dossier'];

function normalizeSearchText(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function compactTerms(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => normalizeSearchText(value).split(/[^a-z0-9]+/u))
        .map((value) => value.trim())
        .filter((value) => value.length >= 3),
    ),
  );
}

function profileTerms(profile: WorkspaceProfile | null) {
  return compactTerms([
    profile?.currentIndustry,
    profile?.currentJobTitle,
    profile?.currentCompany,
    profile?.city,
    profile?.country,
    ...(profile?.interests?.map((interest) => interest.name) || []),
  ]);
}

function postSearchText(post: FeedPost) {
  return normalizeSearchText(
    [
      post.authorName,
      post.authorRole,
      post.text,
      post.contentType,
      post.attachment?.title,
      post.attachment?.detail,
      ...post.chips,
    ].join(' '),
  );
}

function postMatchesFilter(post: FeedPost, filter: FeedFilter) {
  if (filter === 'recommended' || filter === 'all') {
    return true;
  }

  const text = postSearchText(post);

  if (filter === 'opportunities') {
    return post.contentType === 'offer' || opportunityTerms.some((term) => text.includes(normalizeSearchText(term)));
  }

  if (filter === 'events') {
    return post.contentType === 'event' || text.includes('event') || text.includes('evenement');
  }

  if (filter === 'documents') {
    return post.contentType === 'cv' || Boolean(post.attachment) || documentTerms.some((term) => text.includes(term));
  }

  return post.contentType === 'cv' || text.includes('cv') || text.includes('resume');
}

function filterLabel(locale: Locale, filter: FeedFilter) {
  const isFrench = locale === 'fr';

  if (filter === 'opportunities') return isFrench ? 'Opportunites pour vous' : 'Opportunities for you';
  if (filter === 'events') return isFrench ? 'Evenements utiles' : 'Useful events';
  if (filter === 'documents') return isFrench ? 'Documents utiles' : 'Useful documents';
  if (filter === 'cv') return isFrench ? 'CV et profils' : 'Resumes and profiles';
  if (filter === 'all') return isFrench ? 'Toutes les publications' : 'All posts';
  return isFrench ? 'Pour vous' : 'For you';
}

function scorePostForMember(post: FeedPost, terms: string[], behavior?: FeedBehavior) {
  const text = postSearchText(post);
  let score = 0;

  if (post.premium) score += 3;
  if (post.contentType === 'offer' || post.contentType === 'event') score += 6;
  if (post.contentType === 'cv' || post.contentType === 'project') score += 4;
  if (post.canEdit) score += 2;

  for (const term of terms) {
    if (text.includes(term)) {
      score += 8;
    }
  }

  score += Math.min(14, Math.floor((behavior?.dwellMs || 0) / 1800));
  score += Math.min(8, (behavior?.views || 0) * 2);
  if (behavior?.liked) score += 18;
  if (behavior?.saved) score += 22;
  if (post.reactions > 0) score += Math.min(8, post.reactions);
  if (post.comments > 0) score += Math.min(8, post.comments * 2);

  return score;
}

const fallbackProfiles: PublicProfileCard[] = [
  {
    id: -1,
    firstName: 'Sofia',
    lastName: 'Benkirane',
    city: 'Casablanca',
    country: 'Maroc',
    currentJobTitle: 'Product strategist',
    currentCompany: 'North Atlas Lab',
    currentIndustry: 'Product',
    publicProfileUrl: 'sofia-benkirane',
    interests: [
      { id: 1, name: 'Product' },
      { id: 2, name: 'Mentorat' },
    ],
  },
  {
    id: -2,
    firstName: 'Youssef',
    lastName: 'Alaoui',
    city: 'Rabat',
    country: 'Maroc',
    currentJobTitle: 'Full stack engineer',
    currentCompany: 'Blue Current Studio',
    currentIndustry: 'Software',
    publicProfileUrl: 'youssef-alaoui',
    interests: [
      { id: 3, name: 'Infrastructure' },
      { id: 4, name: 'Node.js' },
    ],
  },
  {
    id: -3,
    firstName: 'Meryem',
    lastName: 'Idrissi',
    city: 'Fes',
    country: 'Maroc',
    currentJobTitle: 'Talent partner',
    currentCompany: 'Atlas People',
    currentIndustry: 'Recruitment',
    publicProfileUrl: 'meryem-idrissi',
    interests: [
      { id: 5, name: 'Recrutement' },
      { id: 6, name: 'CV' },
    ],
  },
  {
    id: -4,
    firstName: 'Adam',
    lastName: 'Cherkaoui',
    city: 'Meknes',
    country: 'Maroc',
    currentJobTitle: 'Business analyst',
    currentCompany: 'Scale Works',
    currentIndustry: 'Strategy',
    publicProfileUrl: 'adam-cherkaoui',
    interests: [
      { id: 7, name: 'Conseil' },
      { id: 8, name: 'Data' },
    ],
  },
];

const composerTypeIcons: Record<PostComposerType, LucideIcon> = {
  photo: ImageIcon,
  video: Video,
  cv: FileText,
  project: Rocket,
  article: Sparkles,
  event: CalendarDays,
  offer: BriefcaseBusiness,
};

function assetUrl(fileUrl?: string | null) {
  if (!fileUrl) {
    return '';
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
}

function profileName(profile?: PublicProfileCard | null) {
  if (!profile) {
    return 'Communium Member';
  }

  return profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Communium Member';
}

function connectionTargetId(profile: PublicProfileCard) {
  return Number(profile.userId || profile.id);
}

function memberName(profile: WorkspaceProfile | null, fallback: string) {
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || fallback;
}

function profileInitials(profile?: PublicProfileCard | null) {
  return profileName(profile)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function memberInitials(profile: WorkspaceProfile | null, fallback: string) {
  return memberName(profile, fallback)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function translateSampleRole(locale: Locale, value?: string | null) {
  if (!value) {
    return '';
  }

  if (locale !== 'ar') {
    return value;
  }

  const roleMap: Record<string, string> = {
    'Product strategist': 'Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ Ù…Ù†ØªØ¬Ø§Øª',
    'Full stack engineer': 'Ù…Ù‡Ù†Ø¯Ø³ Full Stack',
    'Talent partner': 'Ø´Ø±ÙŠÙƒ Ù…ÙˆØ§Ù‡Ø¨',
    'Business analyst': 'Ù…Ø­Ù„Ù„ Ø£Ø¹Ù…Ø§Ù„',
  };

  return roleMap[value] || value;
}

function translatePublicTag(locale: Locale, value?: string | null) {
  if (!value) {
    return '';
  }

  if (locale !== 'ar') {
    return value;
  }

  const tagMap: Record<string, string> = {
    Product: 'Ø§Ù„Ù…Ù†ØªØ¬',
    Mentorat: 'Ø§Ù„Ø¥Ø±Ø´Ø§Ø¯',
    Infrastructure: 'Ø§Ù„Ø¨Ù†ÙŠØ© Ø§Ù„ØªØ­ØªÙŠØ©',
    Recrutement: 'Ø§Ù„ØªÙˆØ¸ÙŠÙ',
    CV: 'Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©',
    Conseil: 'Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø©',
    Data: 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª',
    Software: 'Ø§Ù„Ø¨Ø±Ù…Ø¬ÙŠØ§Øª',
    Recruitment: 'Ø§Ù„ØªÙˆØ¸ÙŠÙ',
    Strategy: 'Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ©',
  };

  return tagMap[value] || value;
}

function translatePublicCountry(locale: Locale, value?: string | null) {
  if (!value) {
    return '';
  }

  if (locale !== 'ar') {
    return value;
  }

  const countryMap: Record<string, string> = {
    Maroc: 'Ø§Ù„Ù…ØºØ±Ø¨',
    Morocco: 'Ø§Ù„Ù…ØºØ±Ø¨',
  };

  return countryMap[value] || value;
}

function profileHeadline(profile?: PublicProfileCard | null, locale: Locale = defaultLocale) {
  if (!profile) {
    return locale === 'ar' ? 'Ù…Ù„Ù Ù…Ù‡Ù†ÙŠ' : 'Professional profile';
  }

  return (
    [translateSampleRole(locale, profile.currentJobTitle), profile.currentCompany]
      .filter(Boolean)
      .join(locale === 'ar' ? ' Ù„Ø¯Ù‰ ' : ' @ ') ||
    translatePublicTag(locale, profile.currentIndustry) ||
    (locale === 'ar' ? 'Ù…Ù„Ù Ù…Ù‡Ù†ÙŠ' : 'Professional profile')
  );
}

function memberHeadline(profile: WorkspaceProfile | null, locale: Locale) {
  const isFrench = locale === 'fr';

  return (
    [profile?.currentJobTitle, profile?.currentCompany]
      .filter(Boolean)
      .join(isFrench ? ' chez ' : ' @ ') ||
    profile?.currentIndustry ||
    (isFrench ? 'Profil professionnel' : 'Professional profile')
  );
}

function visibilityLabel(locale: Locale, value?: string | null) {
  const isFrench = locale === 'fr';

  if (value === 'ContactsOnly') {
    return isFrench ? 'Connexions uniquement' : 'Connections only';
  }

  if (value === 'Private') {
    return isFrench ? 'Prive' : 'Private';
  }

  return isFrench ? 'Public' : 'Public';
}

function postVisibilityLabel(locale: Locale, visibility: PostVisibility) {
  const isFrench = locale === 'fr';

  if (visibility === 'connections') {
    return isFrench ? 'Connexions' : 'Connections';
  }

  if (visibility === 'private') {
    return isFrench ? 'Prive' : 'Private';
  }

  return isFrench ? 'Public' : 'Public';
}

function normalizeFeedType(value?: string): PostComposerType {
  if (value === 'photo' || value === 'video' || value === 'cv' || value === 'project' || value === 'article' || value === 'event' || value === 'offer') {
    return value;
  }

  return 'article';
}

function relativeTimeLabel(value: string | undefined, locale: Locale) {
  if (!value) {
    return locale === 'fr' ? 'A l instant' : 'Just now';
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return locale === 'fr' ? 'A l instant' : 'Just now';
  }

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) {
    return locale === 'fr' ? 'A l instant' : 'Just now';
  }
  if (minutes < 60) {
    return locale === 'fr' ? `Il y a ${minutes} min` : `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return locale === 'fr' ? `Il y a ${hours} h` : `${hours} h ago`;
  }

  const days = Math.floor(hours / 24);
  return locale === 'fr' ? `Il y a ${days} j` : `${days} d ago`;
}

function mapBackendPost(post: BackendPost, locale: Locale, viewProfileLabel: string): FeedPost {
  const authorName = post.author?.fullName || post.author?.username || 'Communium Member';
  const attachment = post.attachments?.[0]
    ? {
        title: post.attachments[0].title || post.attachments[0].fileName || (locale === 'fr' ? 'Piece jointe' : 'Attachment'),
        detail: post.attachments[0].detail || '',
        fileName: post.attachments[0].fileName,
        fileUrl: post.attachments[0].fileUrl,
        mimeType: post.attachments[0].mimeType,
        type: post.attachments[0].type,
      }
    : undefined;
  const profileHref = post.author?.username ? localizeHref(locale, `/u/${post.author.username}`) : undefined;

  return {
    id: String(post.id),
    authorName,
    authorRole: post.author?.headline || (locale === 'fr' ? 'Profil professionnel' : 'Professional profile'),
    authorAvatar: assetUrl(post.author?.profilePictureUrl),
    time: relativeTimeLabel(post.createdAt, locale),
    text: post.body || '',
    visibility: post.visibility || 'public',
    chips: [post.type || 'article'].slice(0, 4),
    premium: ['Gold', 'Platinum'].includes(post.author?.membershipTier || ''),
    accent: post.viewerState?.canEdit ? 'member' : post.author?.membershipTier === 'Gold' ? 'gold' : 'ocean',
    contentType: normalizeFeedType(post.type),
    reactions: Number(post.stats?.likes || 0),
    comments: Number(post.stats?.comments || 0),
    shares: Number(post.stats?.shares || 0),
    saves: Number(post.stats?.saves || 0),
    attachment,
    ctaHref: profileHref,
    ctaLabel: viewProfileLabel,
    canEdit: Boolean(post.viewerState?.canEdit),
  };
}

function attachmentKind(attachment?: FeedAttachment) {
  const source = `${attachment?.mimeType || ''} ${attachment?.type || ''} ${attachment?.fileUrl || ''}`.toLowerCase();

  if (source.includes('video') || /\.(mp4|webm|ogg|mov)$/i.test(source)) {
    return 'video';
  }

  if (source.includes('image') || /\.(png|jpe?g|gif|webp|avif)$/i.test(source)) {
    return 'image';
  }

  return attachment?.fileUrl ? 'file' : 'note';
}

function profileCompletion(profile: WorkspaceProfile | null) {
  const checks = [
    Boolean(profile?.firstName),
    Boolean(profile?.lastName),
    Boolean(profile?.currentJobTitle),
    Boolean(profile?.profilePictureUrl),
    Boolean(profile?.publicProfileUrl),
    Boolean((profile?.interests?.length || 0) > 0),
    Boolean((profile?.professionalExperiences?.length || 0) > 0),
    Boolean(profile?.cvUrl),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function isNavigableProfile(profile?: PublicProfileCard | null) {
  return Boolean(profile && profile.id > 0 && profile.publicProfileUrl);
}

function buildGeneratedPosts(locale: Locale, profiles: PublicProfileCard[], viewProfileLabel: string): FeedPost[] {
  const isFrench = locale === 'fr';
  const isArabic = locale === 'ar';
  const t = (fr: string, en: string, ar: string) => (isArabic ? ar : isFrench ? fr : en);
  const accents: FeedPost['accent'][] = ['ocean', 'gold', 'slate', 'mint'];

  return profiles
    .filter((profile) => profile.publicProfileUrl)
    .slice(0, 5)
    .map((profile, index) => {
      const primaryTag = translatePublicTag(locale, profile.interests?.[0]?.name || profile.currentIndustry) || 'Communium';
      const secondaryTag =
        translatePublicTag(locale, profile.interests?.[1]?.name) || t('Profil public', 'Public profile', 'Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø¹Ø§Ù…');
      const author = profileName(profile);
      const scenarios = [
        {
          type: 'project' as PostComposerType,
          text: t(
            `${author} presente un projet axe sur ${primaryTag} pour renforcer sa visibilite et attirer de nouvelles connexions qualifiees.`,
            `${author} is showcasing a ${primaryTag}-driven project to strengthen visibility and attract qualified connections.`,
            `${author} ÙŠØ¹Ø±Ø¶ Ù…Ø´Ø±ÙˆØ¹Ù‹Ø§ Ù…Ø±ØªØ¨Ø·Ù‹Ø§ Ø¨Ù€ ${primaryTag} Ù„ØªØ¹Ø²ÙŠØ² Ø¸Ù‡ÙˆØ±Ù‡ Ø§Ù„Ù…Ù‡Ù†ÙŠ ÙˆØ¬Ø°Ø¨ Ø§ØªØµØ§Ù„Ø§Øª Ù…Ø¤Ù‡Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©.`,
          ),
          attachment: {
            title: t('Note de projet', 'Project note', 'Ù…Ø°ÙƒØ±Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹'),
            detail: t('Contexte, objectifs et prochaines etapes', 'Context, goals and next steps', 'Ø§Ù„Ø³ÙŠØ§Ù‚ ÙˆØ§Ù„Ø£Ù‡Ø¯Ø§Ù ÙˆØ§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©'),
          },
        },
        {
          type: 'cv' as PostComposerType,
          text: t(
            `${author} partage une mise a jour de son CV public avec un angle fort sur ${primaryTag} et ${secondaryTag}.`,
            `${author} shared a refreshed public resume with a strong focus on ${primaryTag} and ${secondaryTag}.`,
            `${author} ÙŠØ´Ø§Ø±Ùƒ ØªØ­Ø¯ÙŠØ«Ù‹Ø§ Ù„Ø³ÙŠØ±ØªÙ‡ Ø§Ù„Ø°Ø§ØªÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø© Ù…Ø¹ ØªØ±ÙƒÙŠØ² ÙˆØ§Ø¶Ø­ Ø¹Ù„Ù‰ ${primaryTag} Ùˆ${secondaryTag}.`,
          ),
          attachment: {
            title: t('CV PDF mis a jour', 'Updated PDF resume', 'Ø³ÙŠØ±Ø© Ø°Ø§ØªÙŠØ© PDF Ù…Ø­Ø¯Ø«Ø©'),
            detail: t('Version courte optimisee pour recruteurs', 'Short version optimized for recruiters', 'Ù†Ø³Ø®Ø© Ù…Ø®ØªØµØ±Ø© Ù…Ù‡ÙŠØ£Ø© Ù„Ù„Ù…Ø¬Ù†Ø¯ÙŠÙ†'),
          },
        },
        {
          type: 'article' as PostComposerType,
          text: t(
            `${author} publie un retour d experience sur ${primaryTag} et la maniere dont ce sujet renforce son profil public.`,
            `${author} posted an experience report about ${primaryTag} and how it strengthens the public profile.`,
            `${author} ÙŠÙ†Ø´Ø± Ø®Ù„Ø§ØµØ© ØªØ¬Ø±Ø¨Ø© Ø­ÙˆÙ„ ${primaryTag} ÙˆÙƒÙŠÙ ÙŠØ¹Ø²Ø² Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¶ÙˆØ¹ Ù…Ù„ÙÙ‡ Ø§Ù„Ø¹Ø§Ù….`,
          ),
          attachment: {
            title: t('Article professionnel', 'Professional article', 'Ù…Ù‚Ø§Ù„ Ù…Ù‡Ù†ÙŠ'),
            detail: t('Lecture 3 min pour le reseau Communium', '3-minute read for the Communium network', 'Ù‚Ø±Ø§Ø¡Ø© 3 Ø¯Ù‚Ø§Ø¦Ù‚ Ù„Ø´Ø¨ÙƒØ© Communium'),
          },
        },
        {
          type: 'event' as PostComposerType,
          text: t(
            `${author} annonce sa participation a un evenement business autour de ${primaryTag} afin d etendre son reseau.`,
            `${author} announced attendance at a business event focused on ${primaryTag} to grow the network.`,
            `${author} ÙŠØ¹Ù„Ù† Ù…Ø´Ø§Ø±ÙƒØªÙ‡ ÙÙŠ ÙØ¹Ø§Ù„ÙŠØ© Ù…Ù‡Ù†ÙŠØ© Ø­ÙˆÙ„ ${primaryTag} Ù„ØªÙˆØ³ÙŠØ¹ Ø´Ø¨ÙƒØªÙ‡.`,
          ),
          attachment: {
            title: t('Evenement a venir', 'Upcoming event', 'ÙØ¹Ø§Ù„ÙŠØ© Ù‚Ø§Ø¯Ù…Ø©'),
            detail: t('Networking, prise de parole et rencontres cibles', 'Networking, speaking and target meetings', 'Ø´Ø¨ÙƒØ§Øª ÙˆØ¹Ø±ÙˆØ¶ ÙˆÙ„Ù‚Ø§Ø¡Ø§Øª Ù…Ù‡Ù†ÙŠØ© Ù…Ø³ØªÙ‡Ø¯ÙØ©'),
          },
        },
        {
          type: 'offer' as PostComposerType,
          text: t(
            `${author} met en avant une opportunite liee a ${primaryTag} et ouvre les echanges avec des profils verifies.`,
            `${author} highlighted an opportunity linked to ${primaryTag} and opened discussions with verified members.`,
            `${author} ÙŠØ¨Ø±Ø² ÙØ±ØµØ© Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ù€ ${primaryTag} ÙˆÙŠÙØªØ­ Ø§Ù„Ù†Ù‚Ø§Ø´ Ù…Ø¹ Ù…Ù„ÙØ§Øª Ù…ÙˆØ«Ù‚Ø©.`,
          ),
          attachment: {
            title: t('Opportunite professionnelle', 'Professional opportunity', 'ÙØ±ØµØ© Ù…Ù‡Ù†ÙŠØ©'),
            detail: t('Brief, criteres et prise de contact rapide', 'Brief, criteria and fast contact path', 'Ù…Ù„Ø®Øµ ÙˆÙ…Ø¹Ø§ÙŠÙŠØ± ÙˆÙ…Ø³Ø§Ø± ØªÙˆØ§ØµÙ„ Ø³Ø±ÙŠØ¹'),
          },
        },
      ];

      const scenario = scenarios[index % scenarios.length];

      return {
        id: `seed-${profile.id}`,
        authorName: author,
        authorRole: profileHeadline(profile, locale),
        authorAvatar: assetUrl(profile.profilePictureUrl),
        time:
          index === 0
            ? t('A l instant', 'Just now', 'Ø§Ù„Ø¢Ù†')
            : index === 1
              ? t('Il y a 18 min', '18 min ago', 'Ù‚Ø¨Ù„ 18 Ø¯Ù‚ÙŠÙ‚Ø©')
              : index === 2
                ? t('Il y a 1 h', '1 h ago', 'Ù‚Ø¨Ù„ Ø³Ø§Ø¹Ø©')
                : index === 3
                  ? t('Aujourd hui', 'Today', 'Ø§Ù„ÙŠÙˆÙ…')
                  : t('Cette semaine', 'This week', 'Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹'),
        text: scenario.text,
        visibility: 'public',
        chips: [primaryTag, secondaryTag],
        premium: index < 2,
        accent: accents[index % accents.length],
        contentType: scenario.type,
        reactions: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        attachment: scenario.attachment,
        ctaHref: isNavigableProfile(profile) ? localizeHref(locale, `/profile/${profile.publicProfileUrl}`) : undefined,
        ctaLabel: viewProfileLabel,
      };
    });
}

function buildLoopedFeedPosts(locale: Locale, posts: FeedPost[], batchCount: number) {
  const isFrench = locale === 'fr';
  const isArabic = locale === 'ar';
  const relativeTimes = isArabic
    ? ['Ù‚Ø¨Ù„ 12 Ø¯Ù‚ÙŠÙ‚Ø©', 'Ù‚Ø¨Ù„ 26 Ø¯Ù‚ÙŠÙ‚Ø©', 'Ù‚Ø¨Ù„ 41 Ø¯Ù‚ÙŠÙ‚Ø©', 'Ù‚Ø¨Ù„ 58 Ø¯Ù‚ÙŠÙ‚Ø©', 'Ù‚Ø¨Ù„ Ø³Ø§Ø¹Ø©']
    : isFrench
      ? ['Il y a 12 min', 'Il y a 26 min', 'Il y a 41 min', 'Il y a 58 min', 'Il y a 1 h']
      : ['12 min ago', '26 min ago', '41 min ago', '58 min ago', '1 h ago'];

  if (!posts.length || batchCount <= 0) {
    return [];
  }

  return Array.from({ length: batchCount }).flatMap((_, batchIndex) =>
    posts.map((post, postIndex) => ({
      ...post,
      id: batchIndex === 0 ? post.id : `${post.id}-loop-${batchIndex}-${postIndex}`,
      time: batchIndex === 0 ? post.time : relativeTimes[(batchIndex + postIndex) % relativeTimes.length],
      reactions: post.reactions + batchIndex * ((postIndex % 3) + 1),
      comments: post.comments + Math.floor((batchIndex + postIndex) / 2),
      shares: post.shares + (batchIndex % 2),
      saves: post.saves + batchIndex,
    })),
  );
}

function buildMarketingReasons(locale: Locale): MarketingCard[] {
  const isFrench = locale === 'fr';

  return [
    {
      icon: UserRound,
      badge: isFrench ? 'Identite' : 'Identity',
      title: isFrench ? 'Un profil professionnel net et credible' : 'A clean and credible professional profile',
      text: isFrench
        ? 'Centralisez parcours, photo, CV, competences et lien public dans une seule vitrine.'
        : 'Bring your story, photo, resume, skills and public link into one polished surface.',
    },
    {
      icon: Eye,
      badge: isFrench ? 'Visibilite' : 'Visibility',
      title: isFrench ? 'Un meilleur signal pour recruteurs et partenaires' : 'Stronger signal for recruiters and partners',
      text: isFrench
        ? 'Montrez ce qui doit etre public tout en gardant le reste sous controle.'
        : 'Show what should be public while keeping the rest under control.',
    },
    {
      icon: UsersRound,
      badge: isFrench ? 'Reseau' : 'Network',
      title: isFrench ? 'Des connexions mieux ciblees' : 'Better targeted connections',
      text: isFrench
        ? 'Reliez votre profil, vos publications et vos opportunites dans le meme flux.'
        : 'Connect your profile, publications and opportunities inside the same flow.',
    },
    {
      icon: ShieldCheck,
      badge: isFrench ? 'Confidentialite' : 'Privacy',
      title: isFrench ? 'Des donnees visibles seulement quand vous le decidez' : 'Data visible only when you decide',
      text: isFrench
        ? 'Choisissez ce qui est public, reserve aux connexions ou totalement prive.'
        : 'Choose what is public, connections-only or completely private.',
    },
  ];
}

function buildFeatureCards(locale: Locale): MarketingCard[] {
  const isFrench = locale === 'fr';

  return [
    {
      icon: Globe2,
      title: isFrench ? 'Profil public partageable' : 'Shareable public profile',
      text: isFrench ? 'Une URL propre pour votre presence pro.' : 'A clean URL for your professional presence.',
    },
    {
      icon: Lock,
      title: isFrench ? 'Profil prive pilote par vous' : 'Private profile controlled by you',
      text: isFrench ? 'Chaque information peut avoir sa propre visibilite.' : 'Every field can have its own visibility rule.',
    },
    {
      icon: FileText,
      title: isFrench ? 'CV PDF toujours pret' : 'PDF resume always ready',
      text: isFrench ? 'Un support professionnel facile a partager.' : 'A professional asset that is easy to share.',
    },
    {
      icon: Sparkles,
      title: isFrench ? 'Publications professionnelles' : 'Professional publishing',
      text: isFrench ? 'Projets, retours d experience, offres et evenements.' : 'Projects, experience notes, offers and events.',
    },
    {
      icon: UsersRound,
      title: isFrench ? 'Reseau vivant' : 'Living network',
      text: isFrench ? 'Suggestions, decouverte et interactions dans le meme espace.' : 'Suggestions, discovery and interactions in one space.',
    },
    {
      icon: ShieldCheck,
      title: isFrench ? 'Confidentialite intelligente' : 'Smart privacy',
      text: isFrench ? 'Public, connexions seulement ou prive selon vos besoins.' : 'Public, connections only or private depending on your needs.',
    },
    {
      icon: Crown,
      title: isFrench ? 'Premium a forte visibilite' : 'High-visibility premium',
      text: isFrench ? 'Silver, Gold et Platinum pour augmenter votre presence.' : 'Silver, Gold and Platinum to amplify your presence.',
    },
  ];
}

function buildTestimonials(locale: Locale): TestimonialCard[] {
  const isFrench = locale === 'fr';

  return [
    {
      quote: isFrench
        ? 'Communium m aide a separer ce que je montre publiquement et ce que je garde pour mon espace prive.'
        : 'Communium helps me separate what I share publicly from what stays in my private workspace.',
      name: 'Nadia B.',
      role: isFrench ? 'Consultante produit' : 'Product consultant',
    },
    {
      quote: isFrench
        ? 'Le format profil + publications + CV donne une image bien plus professionnelle qu une simple page statique.'
        : 'The profile + publications + resume format feels much more professional than a static page.',
      name: 'Anas R.',
      role: isFrench ? 'Full stack developer' : 'Full stack developer',
    },
    {
      quote: isFrench
        ? 'Le plan Gold a surtout du sens pour la visibilite et les suggestions premium dans le reseau.'
        : 'Gold makes the biggest difference on visibility and premium suggestions inside the network.',
      name: 'Sarah M.',
      role: isFrench ? 'Talent manager' : 'Talent manager',
    },
  ];
}

function buildOpportunities(locale: Locale): OpportunityCard[] {
  const isFrench = locale === 'fr';

  return [
    {
      icon: BriefcaseBusiness,
      tone: 'ocean',
      title: isFrench ? 'Offre produit senior' : 'Senior product role',
      subtitle: 'North Atlas Lab',
      meta: isFrench ? 'Hybride · Casablanca' : 'Hybrid · Casablanca',
      cta: isFrench ? 'Voir l offre' : 'View role',
    },
    {
      icon: CalendarDays,
      tone: 'gold',
      title: isFrench ? 'Petit-dejeuner reseau' : 'Network breakfast',
      subtitle: isFrench ? 'Evenement Communium' : 'Communium event',
      meta: isFrench ? 'Jeudi · 09:00 · Fes' : 'Thursday · 09:00 · Fes',
      cta: isFrench ? 'Reserver' : 'Reserve',
    },
    {
      icon: UsersRound,
      tone: 'slate',
      title: isFrench ? 'Mentorat CV & visibilite' : 'Resume & visibility mentoring',
      subtitle: isFrench ? 'Session premium guidee' : 'Guided premium session',
      meta: isFrench ? 'Places limitees' : 'Limited seats',
      cta: isFrench ? 'Rejoindre' : 'Join',
    },
    {
      icon: GraduationCap,
      tone: 'mint',
      title: isFrench ? 'Formation profil public' : 'Public profile training',
      subtitle: isFrench ? 'Atelier express' : 'Express workshop',
      meta: isFrench ? '45 min · En ligne' : '45 min · Remote',
      cta: isFrench ? 'Participer' : 'Attend',
    },
  ];
}

function buildRecommendationReason(profile: PublicProfileCard, workspaceProfile: WorkspaceProfile | null, locale: Locale) {
  const isFrench = locale === 'fr';

  if (workspaceProfile?.currentIndustry && profile.currentIndustry === workspaceProfile.currentIndustry) {
    return isFrench ? 'Meme domaine' : 'Same field';
  }

  if (workspaceProfile?.city && profile.city === workspaceProfile.city) {
    return isFrench ? 'Meme ville' : 'Same city';
  }

  return isFrench ? 'Profil tres actif' : 'Highly active profile';
}

function buildSocialLinks(locale: Locale) {
  const isFrench = locale === 'fr';

  return [
    { label: 'Directory', icon: Globe2, href: '#about' },
    { label: 'Network', icon: UsersRound, href: '#discover' },
    { label: 'Community', icon: MessageSquareText, href: '#premium' },
    { label: isFrench ? 'Premium' : 'Premium', icon: Sparkles, href: '#contact' },
  ];
}

export default function HomeExperience() {
  const params = useParams<{ locale?: string }>();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const isFrench = locale === 'fr';
  const isArabic = locale === 'ar';
  const t = (fr: string, en: string, ar: string) => (isArabic ? ar : isFrench ? fr : en);
  const flowCopy = getCheckoutFlowContent(locale);
  const publicRoutes = buildPublicRoutes(locale);

  const profileHref = localizeHref(locale, '/dashboard/profile');
  const editProfileHref = localizeHref(locale, '/dashboard/profile?view=identity');
  const publishingHref = localizeHref(locale, '/dashboard/profile');
  const documentsHref = localizeHref(locale, '/dashboard/profile?view=documents');
  const privacyHref = localizeHref(locale, '/profile/settings/privacy');
  const messagesHref = localizeHref(locale, '/messages');
  const notificationsHref = localizeHref(locale, '/notifications');
  const signInHref = localizeHref(locale, '/auth/sign-in');
  const signUpHref = localizeHref(locale, '/auth/select-account-type');
  const premiumHref = localizeHref(locale, '/premium');
  const discoverPageHref = publicRoutes.discover;
  const featuresPageHref = publicRoutes.features;
  const publicPrivacyPageHref = publicRoutes.privacy;

  const viewProfileLabel = t('Voir le profil', 'View profile', 'Ø¹Ø±Ø¶ Ø§Ù„Ù…Ù„Ù');
  const createProfileLabel = t('Creer mon profil', 'Create my profile', 'Ø£Ù†Ø´Ø¦ Ù…Ù„ÙÙŠ');
  const createPostLabel = isFrench ? 'Quoi de neuf ?' : 'What is new?';
  const composerPublishLabel = isFrench ? 'Publier' : 'Publish';
  const reactionsLabel = isFrench ? 'reactions' : 'reactions';
  const commentsLabel = isFrench ? 'commentaires' : 'comments';
  const shareLabel = isFrench ? 'Partager' : 'Share';
  const saveLabel = isFrench ? 'Enregistrer' : 'Save';
  const likeLabel = isFrench ? "J'aime" : 'Like';
  const commentLabel = isFrench ? 'Commenter' : 'Comment';

  const composerTypeLabels = useMemo<Record<PostComposerType, string>>(
    () => ({
      photo: isFrench ? 'Photo' : 'Photo',
      video: isFrench ? 'Video' : 'Video',
      cv: 'CV',
      project: isFrench ? 'Projet' : 'Project',
      article: isFrench ? 'Article' : 'Article',
      event: isFrench ? 'Evenement' : 'Event',
      offer: isFrench ? 'Offre pro' : 'Professional offer',
    }),
    [isFrench],
  );

  const [profiles, setProfiles] = useState<PublicProfileCard[]>([]);
  const [workspaceProfile, setWorkspaceProfile] = useState<WorkspaceProfile | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<number[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [memberPosts, setMemberPosts] = useState<FeedPost[]>([]);
  const [memberPostsLoading, setMemberPostsLoading] = useState(false);
  const [postNotice, setPostNotice] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pendingConnectionIds, setPendingConnectionIds] = useState<number[]>([]);
  const [pendingEventIds, setPendingEventIds] = useState<number[]>([]);
  const [composeType, setComposeType] = useState<PostComposerType>('article');
  const [draftText, setDraftText] = useState('');
  const [draftVisibility, setDraftVisibility] = useState<PostVisibility>('public');
  const [draftHashtags, setDraftHashtags] = useState('');
  const [draftMentions, setDraftMentions] = useState('');
  const [draftAttachment, setDraftAttachment] = useState('');
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftFilePreview, setDraftFilePreview] = useState('');
  const [draftBackground, setDraftBackground] = useState('');
  const [composerPanel, setComposerPanel] = useState<ComposerPanel>(null);
  const [pendingFilePickerType, setPendingFilePickerType] = useState<PostComposerType | null>(null);
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, BackendComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [selectedReactions, setSelectedReactions] = useState<Record<string, string>>({});
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [feedBatchCount, setFeedBatchCount] = useState(4);
  const [activeFeedFilter, setActiveFeedFilter] = useState<FeedFilter>('recommended');
  const [feedBehavior, setFeedBehavior] = useState<FeedBehaviorMap>({});
  const [feedBehaviorReady, setFeedBehaviorReady] = useState(false);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);
  const feedLoadLockRef = useRef(0);
  const visiblePostTimersRef = useRef<Map<string, number>>(new Map());
  const postObserversRef = useRef<Map<string, IntersectionObserver>>(new Map());
  const composerFileInputRef = useRef<HTMLInputElement | null>(null);

  const showMemberHome = Boolean(isLoaded && user);
  const fallbackMemberName = user?.fullName || user?.username || (isFrench ? 'Membre Communium' : 'Communium Member');
  const currentMemberName = memberName(workspaceProfile, fallbackMemberName);
  const currentMemberFirstName = currentMemberName.split(/\s+/)[0] || currentMemberName;
  const currentMemberInitials = memberInitials(workspaceProfile, fallbackMemberName || 'CM');
  const currentMemberHeadline = memberHeadline(workspaceProfile, locale);
  const currentMemberAvatar = assetUrl(workspaceProfile?.profilePictureUrl) || user?.imageUrl || '';
  const currentMemberLocation =
    [workspaceProfile?.city, workspaceProfile?.country].filter(Boolean).join(', ') ||
    (isFrench ? 'Ville et pays a completer' : 'City and country to complete');
  const currentMemberCompany =
    workspaceProfile?.currentCompany ||
    (isFrench ? 'Entreprise ou etablissement a completer' : 'Company or institution to complete');
  const currentMemberVisibility = visibilityLabel(locale, workspaceProfile?.privacySettings?.profileVisibility);
  const currentPublicHref =
    workspaceProfile?.publicProfileUrl && workspaceProfile.publicProfileUrl.trim()
      ? localizeHref(locale, `/u/${workspaceProfile.publicProfileUrl}`)
      : publishingHref;
  const completionValue = profileCompletion(workspaceProfile);
  const formatter = new Intl.NumberFormat(isFrench ? 'fr-FR' : 'en-US');

  const publishedProfiles = profiles.filter((profile) => profile.publicProfileUrl);
  const effectiveProfiles = showMemberHome ? publishedProfiles : publishedProfiles.length ? publishedProfiles : fallbackProfiles;
  const suggestedProfiles = effectiveProfiles
    .filter((profile) => profile.publicProfileUrl !== workspaceProfile?.publicProfileUrl)
    .slice(0, 4);
  const recommendedProfiles = effectiveProfiles
    .filter((profile) => profile.publicProfileUrl !== workspaceProfile?.publicProfileUrl)
    .slice(0, 3);
  const generatedPosts = useMemo(
    () => buildGeneratedPosts(locale, effectiveProfiles, viewProfileLabel),
    [effectiveProfiles, locale, viewProfileLabel],
  );
  const loopedGeneratedPosts = useMemo(
    () => buildLoopedFeedPosts(locale, generatedPosts, feedBatchCount),
    [feedBatchCount, generatedPosts, locale],
  );
  const memberFeedPosts = useMemo(
    () => (showMemberHome ? memberPosts : [...memberPosts, ...loopedGeneratedPosts]),
    [loopedGeneratedPosts, memberPosts, showMemberHome],
  );
  const memberProfileTerms = useMemo(() => profileTerms(workspaceProfile), [workspaceProfile]);
  const personalizedFeedPosts = useMemo(() => {
    const filteredPosts = memberFeedPosts.filter((post) => postMatchesFilter(post, activeFeedFilter));

    return [...filteredPosts].sort((left, right) => {
      const rightScore = scorePostForMember(right, memberProfileTerms, feedBehavior[right.id]);
      const leftScore = scorePostForMember(left, memberProfileTerms, feedBehavior[left.id]);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return Number(right.id.replace(/\D/gu, '') || 0) - Number(left.id.replace(/\D/gu, '') || 0);
    });
  }, [activeFeedFilter, feedBehavior, memberFeedPosts, memberProfileTerms]);
  const activeFilterTitle = filterLabel(locale, activeFeedFilter);
  const heroProfile = effectiveProfiles[0] || fallbackProfiles[0];
  const heroPost = generatedPosts[0];
  const topicChips = useMemo(() => {
    const labels = effectiveProfiles.flatMap((profile) => profile.interests?.map((interest) => interest.name) || []);
    const uniqueLabels = Array.from(new Set(labels)).slice(0, 6);
    return uniqueLabels.length
      ? uniqueLabels
      : isFrench
        ? ['Profil public', 'CV', 'Reseau', 'Confidentialite']
        : ['Public profile', 'Resume', 'Network', 'Privacy'];
  }, [effectiveProfiles, isFrench]);

  const memberQuickLinks = useMemo<MemberQuickLink[]>(
    () => [
      { label: isFrench ? 'Mon profil' : 'My profile', href: profileHref, icon: UserRound },
      { label: isFrench ? 'Pour vous' : 'For you', feedFilter: 'recommended' as FeedFilter, icon: Target },
      { label: isFrench ? 'Publications' : 'Posts', feedFilter: 'all' as FeedFilter, icon: MessageSquareText },
      { label: 'Messages', href: messagesHref, icon: MessageSquareText },
      { label: isFrench ? 'Reseau' : 'Network', href: localizeHref(locale, '/discover'), icon: UsersRound },
      { label: isFrench ? 'Opportunites' : 'Opportunities', href: localizeHref(locale, '/feed#opportunities'), icon: BriefcaseBusiness },
      { label: isFrench ? 'Evenements' : 'Events', href: localizeHref(locale, '/feed#opportunities'), icon: CalendarDays },
      { label: 'Documents', feedFilter: 'documents' as FeedFilter, icon: FileText },
      { label: 'CV', feedFilter: 'cv' as FeedFilter, icon: FileText },
      { label: isFrench ? 'Parametres' : 'Settings', href: privacyHref, icon: Settings },
    ],
    [isFrench, locale, messagesHref, privacyHref, profileHref],
  );

  const trendItems = useMemo(
    () => {
      const profileTopics = effectiveProfiles
        .flatMap((profile) => [
          profile.currentIndustry,
          profile.currentJobTitle,
          ...(profile.interests?.map((interest) => interest.name) || []),
        ])
        .filter((item): item is string => Boolean(item?.trim()));
      const fallbackTopics = isFrench
        ? ['Informatique', 'Gestion de projet', 'Bases de donnees', 'IA en Afrique', 'Stages et emplois', 'CV et portfolio']
        : ['Software', 'Project management', 'Databases', 'AI in Africa', 'Internships and jobs', 'Resume and portfolio'];

      return Array.from(new Set([...profileTopics, ...fallbackTopics])).slice(0, 6).map((label) => ({ label }));
    },
    [effectiveProfiles, isFrench],
  );

  const activityItems = useMemo(
    () => [
      { label: isFrench ? 'Notifications recentes' : 'Recent notifications', href: notificationsHref, icon: Bell },
      { label: isFrench ? 'Messages a suivre' : 'Messages to review', href: messagesHref, icon: MessageSquareText },
      { label: isFrench ? 'Invitations reseau' : 'Network invitations', href: localizeHref(locale, '/discover'), icon: UsersRound },
    ],
    [isFrench, locale, messagesHref, notificationsHref],
  );

  const publicProofSignals = useMemo(
    () => [
      { label: isFrench ? 'Profils verifies' : 'Verified profiles', icon: BadgeCheck },
      { label: isFrench ? 'Confidentialite par champ' : 'Field-level privacy', icon: ShieldCheck },
      { label: isFrench ? 'CV partageable' : 'Shareable CV', icon: FileText },
      { label: isFrench ? 'Visibilite Premium' : 'Premium visibility', icon: Crown },
      { label: isFrench ? 'Reseau professionnel' : 'Professional network', icon: UsersRound },
    ],
    [isFrench],
  );

  const publicProblemPoints = useMemo(
    () =>
      isFrench
        ? [
            'presenter une identite professionnelle credible',
            'partager un parcours et des projets concrets',
            'publier sans melanger public et prive',
            'garder les informations sensibles sous controle',
            'etre visible aupres des bonnes personnes',
          ]
        : [
            'present a credible professional identity',
            'share a clear track record and real projects',
            'publish without mixing public and private spaces',
            'keep sensitive information under control',
            'be visible to the right people',
          ],
    [isFrench],
  );

  const publicSolutionCards = useMemo(
    () => [
      {
        icon: Globe2,
        title: isFrench ? 'Profil public clair' : 'Clear public profile',
        text: isFrench
          ? 'Une page sobre et partageable pour montrer votre valeur sans surcharge.'
          : 'A clean, shareable page to show your value without clutter.',
      },
      {
        icon: Lock,
        title: isFrench ? 'Espace prive securise' : 'Secure private space',
        text: isFrench
          ? 'Chaque information garde sa propre visibilite: public, connexions ou prive.'
          : 'Every field keeps its own visibility: public, connections or private.',
      },
      {
        icon: MessageSquareText,
        title: isFrench ? 'Publications professionnelles' : 'Professional publishing',
        text: isFrench
          ? 'Projets, CV, retours d experience, offres et evenements dans un meme flux.'
          : 'Projects, resumes, experience notes, offers and events in one feed.',
      },
      {
        icon: Crown,
        title: isFrench ? 'Visibilite Premium' : 'Premium visibility',
        text: isFrench
          ? 'Des offres claires pour renforcer votre presence et vos opportunites.'
          : 'Clear plans to strengthen your presence and opportunities.',
      },
    ],
    [isFrench],
  );

  const publicWorkflowSteps = useMemo(
    () => [
      {
        step: '01',
        title: t('Creez votre profil', 'Create your profile', 'Ø£Ù†Ø´Ø¦ Ù…Ù„ÙÙƒ'),
        text: t(
          'Photo, identite, CV, bio et positionnement professionnel dans un espace propre.',
          'Photo, identity, resume, bio and positioning inside one polished space.',
          'Ø§Ù„ØµÙˆØ±Ø© ÙˆØ§Ù„Ù‡ÙˆÙŠØ© ÙˆØ§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© ÙˆØ§Ù„ØªØ¹Ø±ÙŠÙ Ø§Ù„Ù…Ù‡Ù†ÙŠ ÙÙŠ Ù…Ø³Ø§Ø­Ø© ÙˆØ§Ø¶Ø­Ø© ÙˆÙ…Ù†Ø¸Ù…Ø©.',
        ),
      },
      {
        step: '02',
        title: t('Choisissez ce qui devient public', 'Choose what becomes public', 'Ø§Ø®ØªØ± Ù…Ø§ ÙŠØµØ¨Ø­ Ø¹Ø§Ù…Ù‹Ø§'),
        text: t(
          'Gardez email, telephone, adresse et documents sensibles sous le bon niveau de visibilite.',
          'Keep email, phone, address and sensitive files at the right visibility level.',
          'Ø§Ø­ØªÙØ¸ Ø¨Ø§Ù„Ø¨Ø±ÙŠØ¯ ÙˆØ§Ù„Ù‡Ø§ØªÙ ÙˆØ§Ù„Ø¹Ù†ÙˆØ§Ù† ÙˆØ§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ø¶Ù…Ù† Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø¸Ù‡ÙˆØ± Ø§Ù„Ù…Ù†Ø§Ø³Ø¨.',
        ),
      },
      {
        step: '03',
        title: t('Developpez votre reseau', 'Grow your network', 'Ø·ÙˆÙ‘Ø± Ø´Ø¨ÙƒØªÙƒ'),
        text: t(
          'Publiez, apparaissez dans les suggestions et renforcez votre presence au fil du temps.',
          'Publish, appear in suggestions and strengthen your presence over time.',
          'Ø§Ù†Ø´Ø± ÙˆØ§Ø¸Ù‡Ø± ÙÙŠ Ø§Ù„Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª ÙˆØ¹Ø²Ø² Ø­Ø¶ÙˆØ±Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ Ù…Ø¹ Ø§Ù„ÙˆÙ‚Øª.',
        ),
      },
    ],
    [isArabic, isFrench, t],
  );

  const publicPremiumCards = useMemo(
    () => [
      {
        id: 'free',
        accent: 'free',
        eyebrow: 'Free',
        title: t('Base professionnelle', 'Professional base', 'Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ù…Ù‡Ù†ÙŠØ©'),
        price: '0 DH',
        note: t('Pour demarrer proprement', 'For a clean start', 'Ù„Ù„Ø¨Ø¯Ø§ÙŠØ© Ø¨Ø´ÙƒÙ„ ÙˆØ§Ø¶Ø­'),
        summary: t(
          'Un point de depart simple pour poser votre profil et votre presence.',
          'A simple starting point to set up your profile and presence.',
          'Ù†Ù‚Ø·Ø© Ø§Ù†Ø·Ù„Ø§Ù‚ Ø¨Ø³ÙŠØ·Ø© Ù„Ø¨Ù†Ø§Ø¡ Ù…Ù„ÙÙƒ ÙˆØ­Ø¶ÙˆØ±Ùƒ Ø§Ù„Ù…Ù‡Ù†ÙŠ.',
        ),
        features: isArabic
          ? ['Ù…Ù„Ù Ø¹Ø§Ù… Ø£Ø³Ø§Ø³ÙŠ', 'Ø®ØµÙˆØµÙŠØ© Ø­Ø³Ø¨ ÙƒÙ„ Ø­Ù‚Ù„', 'Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø£ÙˆÙ„Ù‰']
          : isFrench
            ? ['Profil public de base', 'Confidentialite par champ', 'Premieres publications']
            : ['Base public profile', 'Field-level privacy', 'First publications'],
        href: signUpHref,
        cta: createProfileLabel,
        recommended: false,
      },
      ...flowCopy.plans.map((plan) => ({
        id: plan.id,
        accent: plan.accent,
        eyebrow: plan.eyebrow,
        title: plan.title,
        price: plan.offerPrice,
        note: plan.renewalLabel,
        summary: plan.summary,
        features: plan.features.slice(0, 3),
        href: buildCheckoutHref(locale, plan.id),
        cta: t('Choisir ce plan', 'Choose this plan', 'Ø§Ø®ØªØ± Ù‡Ø°Ù‡ Ø§Ù„Ø¨Ø§Ù‚Ø©'),
        recommended: plan.id === 'gold',
      })),
    ],
    [createProfileLabel, flowCopy.plans, isArabic, isFrench, locale, signUpHref, t],
  );

  const previewMetricCards = useMemo(
    () => [
      {
        label: t('Profil public', 'Public profile', 'Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø¹Ø§Ù…'),
        value: t('Profil public pret', 'Public profile ready', 'Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø¹Ø§Ù… Ø¬Ø§Ù‡Ø²'),
      },
      {
        label: t('Visibilite', 'Visibility', 'Ø§Ù„Ø¸Ù‡ÙˆØ±'),
        value: t('Visibilite maitrisee', 'Visibility controlled', 'Ø§Ù„Ø¸Ù‡ÙˆØ± Ù…Ø¶Ø¨ÙˆØ·'),
      },
      {
        label: t('CV', 'Resume', 'Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©'),
        value: t('CV partageable', 'Resume shareable', 'Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ©'),
      },
    ],
    [isArabic, isFrench, t],
  );

  const previewProfiles = useMemo(() => effectiveProfiles.slice(0, 3), [effectiveProfiles]);
  const publicLandingHeroProfile = useMemo(
    () => ({
      avatarUrl: assetUrl(heroProfile.profilePictureUrl),
      initials: profileInitials(heroProfile),
      name: profileName(heroProfile),
      headline: profileHeadline(heroProfile, locale),
      location:
        [heroProfile.city, translatePublicCountry(locale, heroProfile.country)].filter(Boolean).join(' - ') ||
        t('Ville - Pays', 'City - Country', 'Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© - Ø§Ù„Ø¨Ù„Ø¯'),
      username: heroProfile.publicProfileUrl || 'communium-member',
      stats: previewMetricCards,
    }),
    [heroProfile, locale, previewMetricCards, t],
  );
  const publicLandingFeedPosts = useMemo(
    () =>
      [heroPost, generatedPosts[1], generatedPosts[2]]
        .filter((post): post is FeedPost => Boolean(post))
        .map((post, index) => ({
          id: post.id,
          authorAvatar: post.authorAvatar,
          authorInitials: post.authorName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join(''),
          authorName: post.authorName,
          authorRole: post.authorRole.split('@')[0]?.trim() || post.authorRole,
          time: post.time,
          text: post.text,
          chips: post.chips,
          reactions:
            index === 0
              ? isFrench
                ? 'Profil visible'
                : isArabic
                  ? 'Ù…Ù„Ù Ø¸Ø§Ù‡Ø±'
                  : 'Visible profile'
              : index === 1
                ? isFrench
                  ? 'Publication recente'
                  : isArabic
                    ? 'Ù…Ù†Ø´ÙˆØ± Ø­Ø¯ÙŠØ«'
                    : 'Recent publication'
                : isFrench
                  ? 'Espace prive'
                  : isArabic
                    ? 'Ù…Ø³Ø§Ø­Ø© Ø®Ø§ØµØ©'
                    : 'Private space active',
          comments:
            index === 0
              ? isFrench
                ? 'Reseau actif'
                : isArabic
                  ? 'Ø´Ø¨ÙƒØ© Ù†Ø´Ø·Ø©'
                  : 'Active network'
              : index === 1
                ? isFrench
                  ? 'Profil a jour'
                  : isArabic
                    ? 'Ù…Ù„Ù Ù…Ø­Ø¯Ø«'
                    : 'Profile up to date'
                : isFrench
                  ? 'Connexions utiles'
                  : isArabic
                    ? 'Ø§ØªØµØ§Ù„Ø§Øª Ù…ÙÙŠØ¯Ø©'
                    : 'Qualified connections',
          shares:
            index === 0
              ? isFrench
                ? 'Presence claire'
                : isArabic
                  ? 'Ø­Ø¶ÙˆØ± ÙˆØ§Ø¶Ø­'
                  : 'Qualified presence'
              : index === 1
                ? isFrench
                  ? 'Donnees protegees'
                  : isArabic
                    ? 'Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø­Ù…ÙŠØ©'
                    : 'Protected data'
                : isFrench
                  ? 'Profil recommande'
                  : isArabic
                    ? 'Ù…Ù„Ù Ù…ÙˆØµÙ‰ Ø¨Ù‡'
                    : 'Recommended profile',
          attachment: post.attachment,
          premium: post.premium,
        })),
    [generatedPosts, heroPost, isArabic, isFrench],
  );
  const publicLandingPreviewProfiles = useMemo(
    () =>
      previewProfiles.map((profile, index) => ({
        id: profile.id,
        avatarUrl: assetUrl(profile.profilePictureUrl),
        initials: profileInitials(profile),
        name: profileName(profile),
        headline: profileHeadline(profile, locale),
        location:
          [profile.city, translatePublicCountry(locale, profile.country)].filter(Boolean).join(' - ') ||
          t('Ville - Pays', 'City - Country', 'Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© - Ø§Ù„Ø¨Ù„Ø¯'),
        tags: profile.interests?.length
          ? profile.interests.slice(0, 3).map((interest) => translatePublicTag(locale, interest.name))
          : [translatePublicTag(locale, profile.currentIndustry) || t('Profil professionnel', 'Professional profile', 'Ù…Ù„Ù Ù…Ù‡Ù†ÙŠ')],
        activity:
          index === 0
            ? isFrench
              ? 'Profil pret a partager'
              : isArabic
                ? 'Ù…Ù„Ù Ø¬Ø§Ù‡Ø² Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ©'
                : 'Complete, shareable profile'
            : index === 1
              ? isFrench
                ? 'Publication recente'
                : isArabic
                  ? 'Ù…Ù†Ø´ÙˆØ± Ù…Ù‡Ù†ÙŠ Ø­Ø¯ÙŠØ«'
                  : 'Recent professional publication'
              : isFrench
                ? 'Presence visible'
                : isArabic
                  ? 'Ø­Ø¶ÙˆØ± Ø¸Ø§Ù‡Ø±'
                  : 'Visible to the right professional audience',
        visibility: t('Public', 'Public', 'Ø¹Ø§Ù…'),
        href: isNavigableProfile(profile) ? localizeHref(locale, `/u/${profile.publicProfileUrl}`) : discoverPageHref,
      })),
    [discoverPageHref, isArabic, isFrench, locale, previewProfiles, t],
  );
  useEffect(() => {
    if (!showMemberHome) {
      void loadProfiles();
    }
  }, [showMemberHome]);

  useEffect(() => {
    if (!user || !isLoaded) {
      setWorkspaceProfile(null);
      setWorkspaceLoading(false);
      setMemberPosts([]);
      setEvents([]);
      return;
    }

    void fetchWorkspaceProfile();
    void loadMemberFeed();
    void loadSuggestions();
    void loadEvents();
  }, [getToken, isLoaded, user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) {
      return;
    }

    const storageKey = `${FEED_BEHAVIOR_STORAGE_KEY}:${user?.id || 'guest'}`;
    setFeedBehaviorReady(false);

    try {
      const stored = window.localStorage.getItem(storageKey);
      setFeedBehavior(stored ? (JSON.parse(stored) as FeedBehaviorMap) : {});
    } catch {
      setFeedBehavior({});
    }

    setFeedBehaviorReady(true);
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded || !feedBehaviorReady) {
      return;
    }

    const storageKey = `${FEED_BEHAVIOR_STORAGE_KEY}:${user?.id || 'guest'}`;
    window.localStorage.setItem(storageKey, JSON.stringify(feedBehavior));
  }, [feedBehavior, feedBehaviorReady, isLoaded, user?.id]);

  useEffect(() => {
    return () => {
      postObserversRef.current.forEach((observer) => observer.disconnect());
      postObserversRef.current.clear();
      visiblePostTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsComposerOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isComposerOpen]);

  useEffect(() => {
    if (!draftFile || !draftFile.type.startsWith('image/')) {
      setDraftFilePreview('');
      return;
    }

    const previewUrl = URL.createObjectURL(draftFile);
    setDraftFilePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [draftFile]);

  useEffect(() => {
    if (!isComposerOpen || !pendingFilePickerType) {
      return;
    }

    const timer = window.setTimeout(() => {
      const input = composerFileInputRef.current;
      if (input) {
        input.accept = composerFileAccept[pendingFilePickerType] || 'image/*,video/*,.pdf,.doc,.docx';
        input.value = '';
        input.click();
      }
      setPendingFilePickerType(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isComposerOpen, pendingFilePickerType]);

  useEffect(() => {
    setFeedBatchCount(4);
    feedLoadLockRef.current = 0;
  }, [generatedPosts.length, locale]);

  useEffect(() => {
    const sentinel = feedSentinelRef.current;

    if (!showMemberHome || !sentinel || !generatedPosts.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];

        if (!target?.isIntersecting) {
          return;
        }

        if (feedLoadLockRef.current === feedBatchCount) {
          return;
        }

        feedLoadLockRef.current = feedBatchCount;
        setFeedBatchCount((current) => current + 2);
      },
      {
        rootMargin: '0px 0px 420px 0px',
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [feedBatchCount, generatedPosts.length, showMemberHome]);

  async function loadProfiles() {
    try {
      const response = await fetch(`${apiBase}/public`, { cache: 'no-store' });
      const body = (await response.json()) as { success?: boolean; data?: PublicProfileCard[] };

      if (!response.ok || !body.success || !body.data) {
        throw new Error('Directory unavailable');
      }

      setProfiles(body.data);
    } catch {
      setProfiles([]);
    }
  }

  async function fetchWorkspaceProfile() {
    try {
      setWorkspaceLoading(true);

      const response = await fetch(`${apiBase}/my-profile`, {
        headers: await authHeaders(),
      });

      const body = (await response.json()) as { success?: boolean; data?: WorkspaceProfile };

      if (!response.ok || !body.success || !body.data) {
        setWorkspaceProfile(null);
        return;
      }

      setWorkspaceProfile(body.data);
    } catch {
      setWorkspaceProfile(null);
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function authHeaders(json = true) {
    const headers = new Headers();
    if (json) {
      headers.set('Content-Type', 'application/json');
    }
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (user?.id) headers.set('x-user-id', user.id);
    if (user?.fullName) headers.set('x-user-name', user.fullName);
    if (user?.username) headers.set('x-user-username', user.username);
    if (user?.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
    return headers;
  }

  async function loadMemberFeed() {
    if (!user) return;
    setMemberPostsLoading(true);
    try {
      const response = await fetch(`${apiRoot}/posts/feed?limit=40`, {
        headers: await authHeaders(),
        cache: 'no-store',
      });
      const body = (await response.json()) as { success?: boolean; data?: BackendPost[] };
      if (!response.ok || !body.success) {
        throw new Error('Feed unavailable');
      }

      const posts = (body.data || []).map((post) => mapBackendPost(post, locale, viewProfileLabel));
      setMemberPosts(posts);
      setLikedIds((body.data || []).filter((post) => post.viewerState?.liked).map((post) => String(post.id)));
      setSavedIds((body.data || []).filter((post) => post.viewerState?.saved).map((post) => String(post.id)));
    } catch {
      setMemberPosts([]);
      setPostNotice(isFrench ? 'Impossible de charger le fil pour le moment.' : 'Unable to load the feed right now.');
    } finally {
      setMemberPostsLoading(false);
    }
  }

  async function loadSuggestions() {
    if (!user) return;
    try {
      const response = await fetch(`${apiRoot}/profiles/suggestions`, {
        headers: await authHeaders(),
        cache: 'no-store',
      });
      const body = (await response.json()) as { success?: boolean; data?: PublicProfileCard[] };
      if (response.ok && body.success && body.data) {
        setProfiles(body.data);
        setFollowingIds(
          body.data
            .filter((profile) => profile.connectionStatus === 'pending' || profile.connectionStatus === 'accepted')
            .map((profile) => connectionTargetId(profile))
            .filter(Boolean),
        );
      }
    } catch {
      setProfiles([]);
    }
  }

  async function loadEvents() {
    if (!user) return;
    try {
      const response = await fetch(`${apiRoot}/events`, {
        headers: await authHeaders(),
        cache: 'no-store',
      });
      const body = (await response.json()) as { success?: boolean; data?: HomeEvent[] };
      if (response.ok && body.success && body.data) {
        setEvents(body.data);
      }
    } catch {
      setEvents([]);
    }
  }

  async function toggleFollowing(profile: PublicProfileCard) {
    if (!user) {
      setPostNotice(isFrench ? 'Connectez-vous pour ajouter cette personne.' : 'Sign in to add this person.');
      return;
    }

    const targetId = connectionTargetId(profile);

    if (!targetId || targetId === Number(user.id)) {
      setPostNotice(isFrench ? 'Ce profil ne peut pas etre ajoute.' : 'This profile cannot be added.');
      return;
    }

    if (followingIds.includes(targetId) || profile.connectionStatus === 'pending') {
      setFollowingIds((current) => current.filter((id) => id !== targetId));
      setPendingConnectionIds((current) => Array.from(new Set([...current, targetId])));
      setProfiles((current) =>
        current.map((item) =>
          connectionTargetId(item) === targetId
            ? { ...item, connectionStatus: null, canRequest: true }
            : item,
        ),
      );

      try {
        const response = await fetch(`${apiRoot}/connections/${targetId}`, {
          method: 'DELETE',
          headers: await authHeaders(),
        });
        if (!response.ok) {
          throw new Error('Cancel request failed');
        }
        setPostNotice(isFrench ? 'Demande annulee.' : 'Request cancelled.');
      } catch {
        setFollowingIds((current) => Array.from(new Set([...current, targetId])));
        setProfiles((current) =>
          current.map((item) =>
            connectionTargetId(item) === targetId
              ? { ...item, connectionStatus: 'pending', canRequest: false }
              : item,
          ),
        );
        setPostNotice(isFrench ? 'Impossible d annuler cette demande.' : 'Unable to cancel this request.');
      } finally {
        setPendingConnectionIds((current) => current.filter((id) => id !== targetId));
      }
      return;
    }

    setFollowingIds((current) => Array.from(new Set([...current, targetId])));
    setPendingConnectionIds((current) => Array.from(new Set([...current, targetId])));
    try {
      const response = await fetch(`${apiRoot}/connections/request`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ userId: targetId }),
      });
      const body = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string; status?: string };
      if (!response.ok || body.success === false) {
        throw new Error(body.error || 'Connection request failed');
      }
      setProfiles((current) =>
        current.map((item) =>
          connectionTargetId(item) === targetId
            ? { ...item, connectionStatus: body.status || 'pending', canRequest: false }
            : item,
        ),
      );
      setPostNotice(isFrench ? 'Invitation reseau envoyee.' : 'Network invitation sent.');
    } catch {
      setFollowingIds((current) => current.filter((id) => id !== targetId));
      setPostNotice(isFrench ? "La demande n'a pas pu etre envoyee." : 'The connection request could not be sent.');
    } finally {
      setPendingConnectionIds((current) => current.filter((id) => id !== targetId));
    }
  }

  async function toggleLike(postId: string) {
    const liked = likedIds.includes(postId);
    setLikedIds((current) => (liked ? current.filter((id) => id !== postId) : [...current, postId]));
    setSelectedReactions((current) => {
      if (!liked) {
        return { ...current, [postId]: current[postId] || postReactionOptions[0].emoji };
      }
      const next = { ...current };
      delete next[postId];
      return next;
    });
    recordFeedBehavior(postId, { liked: !liked });
    try {
      const response = await fetch(`${apiRoot}/posts/${postId}/like`, {
        method: 'POST',
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error('Like failed');
      const body = (await response.json()) as { liked?: boolean; stats?: { likes?: number } };
      setLikedIds((current) => (body.liked ? Array.from(new Set([...current, postId])) : current.filter((id) => id !== postId)));
      if (body.stats) {
        setMemberPosts((current) =>
          current.map((post) => (post.id === postId ? { ...post, reactions: Number(body.stats?.likes || 0) } : post)),
        );
      }
    } catch {
      setLikedIds((current) => (liked ? Array.from(new Set([...current, postId])) : current.filter((id) => id !== postId)));
      setSelectedReactions((current) => {
        const next = { ...current };
        if (liked) {
          next[postId] = next[postId] || postReactionOptions[0].emoji;
        } else {
          delete next[postId];
        }
        return next;
      });
      recordFeedBehavior(postId, { liked });
      setPostNotice(isFrench ? 'Action indisponible pour cette publication.' : 'This action is unavailable for this post.');
    }
  }

  function chooseReaction(postId: string, emoji: string) {
    if (!likedIds.includes(postId)) {
      void toggleLike(postId);
    }
    setSelectedReactions((current) => ({ ...current, [postId]: emoji }));
    recordFeedBehavior(postId, { liked: true });
  }

  async function toggleSave(postId: string) {
    const saved = savedIds.includes(postId);
    setSavedIds((current) => (saved ? current.filter((id) => id !== postId) : [...current, postId]));
    recordFeedBehavior(postId, { saved: !saved });
    try {
      const response = await fetch(`${apiRoot}/posts/${postId}/save`, {
        method: saved ? 'DELETE' : 'POST',
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error('Save failed');
      const body = (await response.json()) as { saved?: boolean; stats?: { saves?: number } };
      setSavedIds((current) => (body.saved ? Array.from(new Set([...current, postId])) : current.filter((id) => id !== postId)));
      if (body.stats) {
        setMemberPosts((current) =>
          current.map((post) => (post.id === postId ? { ...post, saves: Number(body.stats?.saves || 0) } : post)),
        );
      }
    } catch {
      setSavedIds((current) => (saved ? Array.from(new Set([...current, postId])) : current.filter((id) => id !== postId)));
      recordFeedBehavior(postId, { saved });
      setPostNotice(isFrench ? 'Enregistrement indisponible pour cette publication.' : 'Saving is unavailable for this post.');
    }
  }

  function selectComposerType(type: PostComposerType) {
    setComposeType(type);

    if (isFileComposerType(type)) {
      const input = composerFileInputRef.current;
      if (input) {
        input.accept = composerFileAccept[type] || 'image/*,video/*,.pdf,.doc,.docx';
        input.value = '';
        input.click();
        return;
      }
      setPendingFilePickerType(type);
      return;
    }

    setDraftFile(null);
    setDraftFilePreview('');
  }

  function openComposer(type: PostComposerType) {
    setIsComposerOpen(true);
    selectComposerType(type);
  }

  function closeComposer() {
    setIsComposerOpen(false);
    setComposerPanel(null);
  }

  function resetComposer() {
    setDraftText('');
    setDraftVisibility('public');
    setDraftHashtags('');
    setDraftMentions('');
    setDraftAttachment('');
    setDraftFile(null);
    setDraftBackground('');
    setComposerPanel(null);
    setPendingFilePickerType(null);
    setComposeType('article');
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const typedText = draftText.trim();
    const attachmentText = draftAttachment.trim();
    const text = typedText || attachmentText || (draftFile ? `${composerTypeLabels[composeType]} - ${draftFile.name}` : '');
    if (!text) {
      return;
    }

    const rawHashtags = draftHashtags
      .split(/\s+/)
      .map((item) => item.replace(/^#+/, '').trim())
      .filter(Boolean)
      .map((item) => `#${item}`);
    const rawMentions = draftMentions
      .split(/\s+/)
      .map((item) => item.replace(/^@+/, '').trim())
      .filter(Boolean)
      .map((item) => `@${item}`);
    const visibilityChip = postVisibilityLabel(locale, draftVisibility);
    const typeLabel = composerTypeLabels[composeType];
    const attachment =
      attachmentText.length > 0
        ? {
            title: attachmentText,
            detail:
              draftVisibility === 'public'
                ? isFrench
                  ? 'Visible dans le feed public selon votre choix'
                  : 'Visible in the public feed depending on your choice'
                : draftVisibility === 'connections'
                  ? isFrench
                    ? 'Reserve a votre reseau'
                    : 'Shared with your connections only'
                  : isFrench
                    ? 'Visible uniquement par vous'
                    : 'Visible only in your private workspace',
          }
        : undefined;

    setIsPublishing(true);
    setPostNotice('');

    try {
      const formData = new FormData();
      formData.set('body', text);
      formData.set('type', composeType);
      formData.set('visibility', draftVisibility);
      formData.set('showOnProfile', 'true');
      if (attachmentText) {
        formData.set('attachmentTitle', attachmentText);
        formData.set('attachmentDetail', [visibilityChip, ...rawHashtags, ...rawMentions].filter(Boolean).join(' '));
      }
      if (draftFile) {
        formData.set('file', draftFile);
      }

      const response = await fetch(`${apiRoot}/posts`, {
        method: 'POST',
        headers: await authHeaders(false),
        body: formData,
      });
      const body = (await response.json()) as { success?: boolean; data?: BackendPost; error?: string };
      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error || 'Publication failed');
      }

      const newPost = mapBackendPost(body.data, locale, viewProfileLabel);
      newPost.chips = [typeLabel, visibilityChip, ...rawHashtags, ...rawMentions].slice(0, 6);
      newPost.attachment = attachment || newPost.attachment;
      newPost.ctaHref = draftVisibility === 'public' ? currentPublicHref : newPost.ctaHref;
      setMemberPosts((current) => [newPost, ...current]);
      setActiveFeedFilter('all');
      void loadMemberFeed();
      setPostNotice(isFrench ? 'Publication ajoutee au fil.' : 'Post added to the feed.');
      closeComposer();
      resetComposer();
    } catch {
      setPostNotice(isFrench ? 'La publication n a pas pu etre enregistree.' : 'The post could not be saved.');
    } finally {
      setIsPublishing(false);
    }
  }

  function handleDraftFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setDraftFile(file);

    if (!file) {
      return;
    }

    if (file.type.startsWith('image/')) {
      setComposeType('photo');
    } else if (file.type.startsWith('video/')) {
      setComposeType('video');
    } else {
      setComposeType('cv');
    }
  }

  async function toggleComments(postId: string) {
    const willOpen = !commentsOpen[postId];
    setCommentsOpen((current) => ({ ...current, [postId]: willOpen }));
    if (!willOpen || commentsByPost[postId]) return;

    try {
      const response = await fetch(`${apiRoot}/posts/${postId}/comments`, {
        headers: await authHeaders(),
      });
      const body = (await response.json()) as { success?: boolean; data?: BackendComment[] };
      if (response.ok && body.success) {
        setCommentsByPost((current) => ({ ...current, [postId]: body.data || [] }));
      }
    } catch {
      setPostNotice(isFrench ? 'Impossible de charger les commentaires.' : 'Unable to load comments.');
    }
  }

  async function submitComment(postId: string) {
    const bodyText = (commentDrafts[postId] || '').trim();
    if (!bodyText) return;

    try {
      const response = await fetch(`${apiRoot}/posts/${postId}/comments`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ body: bodyText }),
      });
      const body = (await response.json()) as { success?: boolean; data?: BackendComment };
      if (!response.ok || !body.success || !body.data) throw new Error('Comment failed');
      setCommentsByPost((current) => ({ ...current, [postId]: [...(current[postId] || []), body.data as BackendComment] }));
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      setMemberPosts((current) =>
        current.map((post) => (post.id === postId ? { ...post, comments: post.comments + 1 } : post)),
      );
    } catch {
      setPostNotice(isFrench ? 'Le commentaire n a pas pu etre publie.' : 'The comment could not be posted.');
    }
  }

  async function handleSharePost(postId: string) {
    const original = memberPosts.find((post) => post.id === postId);
    try {
      const response = await fetch(`${apiRoot}/posts/${postId}/share`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ target: 'repost', body: original?.text || '' }),
      });
      const body = (await response.json()) as { success?: boolean; stats?: { shares?: number }; data?: BackendPost; error?: string };
      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Share failed');
      }
      setMemberPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, shares: Number(body.stats?.shares ?? post.shares + 1) } : post,
        ),
      );
      if (body.data) {
        const repost = mapBackendPost(body.data, locale, viewProfileLabel);
        repost.chips = [isFrench ? 'Repartage' : 'Repost', ...repost.chips].slice(0, 5);
        setMemberPosts((current) => [repost, ...current.filter((post) => post.id !== repost.id)]);
      }
      setPostNotice(isFrench ? 'Publication repartagee dans votre fil.' : 'Post reshared to your feed.');
    } catch {
      setPostNotice(isFrench ? 'La publication n a pas pu etre repartagee.' : 'The post could not be reshared.');
    }
  }

  async function deletePost(postId: string) {
    const confirmed = window.confirm(isFrench ? 'Supprimer cette publication ?' : 'Delete this post?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${apiRoot}/posts/${postId}`, {
        method: 'DELETE',
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error('Delete failed');
      setMemberPosts((current) => current.filter((post) => post.id !== postId));
      setPostNotice(isFrench ? 'Publication supprimee.' : 'Post deleted.');
    } catch {
      setPostNotice(isFrench ? 'La publication n a pas pu etre supprimee.' : 'The post could not be deleted.');
    }
  }

  async function toggleEventJoin(eventId: number) {
    if (!user) {
      setPostNotice(isFrench ? 'Connectez-vous pour participer.' : 'Sign in to join.');
      return;
    }

    const currentEvent = events.find((item) => item.id === eventId);
    const joined = Boolean(currentEvent?.joined);
    if (joined) {
      setPostNotice(isFrench ? 'Vous participez deja a cette opportunite.' : 'You already joined this opportunity.');
      return;
    }
    setPendingEventIds((current) => Array.from(new Set([...current, eventId])));
    setEvents((current) => current.map((item) => (item.id === eventId ? { ...item, joined: !joined } : item)));

    try {
      const response = await fetch(`${apiRoot}/events/${eventId}/join`, {
        method: 'POST',
        headers: await authHeaders(),
      });
      const body = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!response.ok || body.success === false) throw new Error(body.error || 'Event action failed');
      setPostNotice(isFrench ? 'Participation confirmee.' : 'Participation confirmed.');
    } catch {
      setEvents((current) => current.map((item) => (item.id === eventId ? { ...item, joined } : item)));
      setPostNotice(isFrench ? 'Action evenement indisponible.' : 'Event action unavailable.');
    } finally {
      setPendingEventIds((current) => current.filter((id) => id !== eventId));
    }
  }

  function renderAvatar(name: string, avatar: string, fallback: string, className: string) {
    return (
      <div className={className}>
        {avatar ? <img src={avatar} alt={name} /> : <span>{fallback}</span>}
      </div>
    );
  }

  function renderPostSkeleton(index: number) {
    return (
      <article key={`post-skeleton-${index}`} className="networkPostCard postSkeleton" aria-hidden="true">
        <div className="skeletonHead">
          <span className="skeletonAvatar" />
          <div className="skeletonStack">
            <span className="skeletonLine short" />
            <span className="skeletonLine mini" />
          </div>
        </div>
        <span className="skeletonLine full" />
        <span className="skeletonLine wide" />
        <div className="skeletonActions">
          <span />
          <span />
          <span />
          <span />
        </div>
      </article>
    );
  }

  function recordFeedBehavior(postId: string, patch: Partial<FeedBehavior>) {
    setFeedBehavior((current) => {
      const previous = current[postId] || {};
      return {
        ...current,
        [postId]: {
          ...previous,
          ...patch,
          lastSeen: Date.now(),
        },
      };
    });
  }

  function startPostView(postId: string) {
    if (visiblePostTimersRef.current.has(postId)) {
      return;
    }

    visiblePostTimersRef.current.set(postId, Date.now());
    setFeedBehavior((current) => {
      const previous = current[postId] || {};
      return {
        ...current,
        [postId]: {
          ...previous,
          views: (previous.views || 0) + 1,
          lastSeen: Date.now(),
        },
      };
    });
  }

  function stopPostView(postId: string) {
    const startedAt = visiblePostTimersRef.current.get(postId);

    if (!startedAt) {
      return;
    }

    visiblePostTimersRef.current.delete(postId);
    const dwellMs = Math.max(0, Date.now() - startedAt);

    if (dwellMs < 600) {
      return;
    }

    setFeedBehavior((current) => {
      const previous = current[postId] || {};
      return {
        ...current,
        [postId]: {
          ...previous,
          dwellMs: (previous.dwellMs || 0) + dwellMs,
          lastSeen: Date.now(),
        },
      };
    });
  }

  function attachPostTracking(postId: string, node: HTMLElement | null) {
    const existingObserver = postObserversRef.current.get(postId);
    existingObserver?.disconnect();
    postObserversRef.current.delete(postId);

    if (!node) {
      stopPostView(postId);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.55) {
          startPostView(postId);
        } else {
          stopPostView(postId);
        }
      },
      { threshold: [0, 0.55, 0.9] },
    );

    observer.observe(node);
    postObserversRef.current.set(postId, observer);
  }

  function renderPostCard(post: FeedPost, compact = false) {
    const liked = likedIds.includes(post.id);
    const saved = savedIds.includes(post.id);
    const reactions = post.reactions;
    const saves = post.saves;
    const ContentIcon = composerTypeIcons[post.contentType];

    return (
      <article
        key={post.id}
        ref={compact ? undefined : (node) => attachPostTracking(post.id, node)}
        className={`networkPostCard ${post.accent}${compact ? ' compact' : ''}`}
      >
        <div className="networkPostHead">
          <div className="networkPostAuthor">
            {renderAvatar(post.authorName, post.authorAvatar, post.authorName.slice(0, 2).toUpperCase(), 'networkPostAvatar')}
            <div className="networkPostAuthorCopy">
              <strong>{post.authorName}</strong>
              <span>{post.authorRole}</span>
              <small>{post.time}</small>
            </div>
          </div>

          <div className="networkPostBadgeRow">
            <span className={`audiencePill ${post.visibility}`}>{postVisibilityLabel(locale, post.visibility)}</span>
            {post.premium ? (
              <span className="premiumPill">
                <Star className="miniIcon" strokeWidth={2.1} />
                {isFrench ? 'Premium' : 'Premium'}
              </span>
            ) : null}
          </div>
        </div>

        <div className="networkPostBody">
          <div className="networkPostType">
            <ContentIcon className="miniIcon" strokeWidth={2.1} />
            <span>{composerTypeLabels[post.contentType]}</span>
          </div>
          <p>{post.text}</p>

          {post.attachment ? (
            <div className={`postMedia ${attachmentKind(post.attachment)}`}>
              {attachmentKind(post.attachment) === 'image' ? (
                <img src={assetUrl(post.attachment.fileUrl)} alt={post.attachment.title || composerTypeLabels[post.contentType]} loading="lazy" />
              ) : null}
              {attachmentKind(post.attachment) === 'video' ? (
                <video src={assetUrl(post.attachment.fileUrl)} controls preload="metadata" />
              ) : null}
              {attachmentKind(post.attachment) === 'file' ? (
                <a href={assetUrl(post.attachment.fileUrl)} target="_blank" rel="noreferrer" className="attachmentCard">
                  <strong>{post.attachment.title || post.attachment.fileName || composerTypeLabels[post.contentType]}</strong>
                  <span>{isFrench ? 'Ouvrir le fichier joint' : 'Open attached file'}</span>
                </a>
              ) : null}
              {attachmentKind(post.attachment) === 'note' ? (
                <div className="attachmentCard">
                  <strong>{post.attachment.title}</strong>
                  <span>{post.attachment.detail}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="chipRow">
            {post.chips.map((chip) => (
              <span key={`${post.id}-${chip}`}>{chip}</span>
            ))}
          </div>
        </div>

        <div className="networkPostMeta">
          <span>{formatter.format(reactions)} {reactionsLabel}</span>
          <span>{formatter.format(post.comments)} {commentsLabel}</span>
          <span>{formatter.format(post.shares)} {isFrench ? 'partages' : 'shares'}</span>
          <span>{formatter.format(saves)} {isFrench ? 'sauvegardes' : 'saves'}</span>
        </div>

        {!compact ? (
          <>
          <div className="networkPostActions">
            <div className="reactionActionWrap">
              <div className="reactionPicker" aria-label={isFrench ? 'Reactions' : 'Reactions'}>
                {postReactionOptions.map((reaction) => (
                  <button key={reaction.label} type="button" onClick={() => chooseReaction(post.id, reaction.emoji)} title={reaction.label}>
                    {reaction.emoji}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={liked ? 'postAction active' : 'postAction'}
                onClick={() => void toggleLike(post.id)}
              >
                <span className="reactionIcon">{selectedReactions[post.id] || <Heart className="miniIcon" strokeWidth={2.1} />}</span>
                {liked ? (selectedReactions[post.id] || likeLabel) : likeLabel}
              </button>
            </div>
            <button type="button" className={commentsOpen[post.id] ? 'postAction active' : 'postAction'} onClick={() => void toggleComments(post.id)}>
              <MessageCircle className="miniIcon" strokeWidth={2.1} />
              {commentLabel}
            </button>
            <button type="button" className="postAction" onClick={() => void handleSharePost(post.id)}>
              <ArrowRight className="miniIcon" strokeWidth={2.1} />
              {shareLabel}
            </button>
            <button
              type="button"
              className={saved ? 'postAction active' : 'postAction'}
              onClick={() => void toggleSave(post.id)}
            >
              <Bookmark className="miniIcon" strokeWidth={2.1} />
              {saveLabel}
            </button>
            {post.canEdit ? (
              <button type="button" className="postAction" onClick={() => void deletePost(post.id)}>
                <Trash2 className="miniIcon" strokeWidth={2.1} />
                {isFrench ? 'Supprimer' : 'Delete'}
              </button>
            ) : null}
            {post.ctaHref ? (
              <Link href={post.ctaHref} className="textActionLink">
                {post.ctaLabel || viewProfileLabel}
              </Link>
            ) : null}
            <div className="postMenuWrap">
              <button type="button" className="postAction iconOnly" onClick={() => setOpenPostMenuId((current) => (current === post.id ? null : post.id))} aria-label={isFrench ? 'Options' : 'Options'}>
                <MoreHorizontal className="miniIcon" strokeWidth={2.1} />
              </button>
              {openPostMenuId === post.id ? (
                <div className="postMenuPanel">
                  <button type="button" onClick={() => { recordFeedBehavior(post.id, { saved: true }); setOpenPostMenuId(null); }}>{isFrench ? 'Ca m interesse' : 'Show me more'}</button>
                  <button type="button" onClick={() => { recordFeedBehavior(post.id, { liked: false }); setOpenPostMenuId(null); }}>{isFrench ? 'Ca ne m interesse pas' : 'Show me less'}</button>
                  <button type="button" onClick={() => void toggleSave(post.id)}>{saved ? (isFrench ? 'Retirer des enregistrements' : 'Unsave post') : saveLabel}</button>
                  <button type="button" onClick={() => { setPostNotice(isFrench ? 'Signalement enregistre pour moderation.' : 'Report sent for moderation.'); setOpenPostMenuId(null); }}>{isFrench ? 'Signaler la publication' : 'Report post'}</button>
                </div>
              ) : null}
            </div>
          </div>
          {commentsOpen[post.id] ? (
            <div className="commentPanel">
              {(commentsByPost[post.id] || []).length ? (
                <div className="commentList">
                  {(commentsByPost[post.id] || []).map((comment) => (
                    <article key={comment.id} className="commentItem">
                      {renderAvatar(comment.author?.fullName || 'Communium', assetUrl(comment.author?.profilePictureUrl), (comment.author?.fullName || 'CM').slice(0, 2).toUpperCase(), 'commentAvatar')}
                      <div>
                        <strong>{comment.author?.fullName || (isFrench ? 'Membre Communium' : 'Communium member')}</strong>
                        <p>{comment.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="commentEmpty">{isFrench ? 'Aucun commentaire pour le moment.' : 'No comments yet.'}</p>
              )}
              <div className="commentComposer">
                <input
                  type="text"
                  value={commentDrafts[post.id] || ''}
                  onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                  placeholder={isFrench ? 'Ajouter un commentaire professionnel...' : 'Add a professional comment...'}
                />
                <button type="button" className="ghostMiniButton" onClick={() => void submitComment(post.id)}>
                  {isFrench ? 'Envoyer' : 'Send'}
                </button>
              </div>
            </div>
          ) : null}
          </>
        ) : (
          <div className="networkPostPreviewCta">
            {post.ctaHref ? (
              <Link href={post.ctaHref} className="ghostInlineLink">
                {post.ctaLabel || viewProfileLabel}
              </Link>
            ) : (
              <span className="limitedPreviewLabel">{isFrench ? 'Apercu public limite' : 'Limited public preview'}</span>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <main className="homeExperience">
      <div className="homeExperienceShell">
        {showMemberHome ? (
          <>
            <section className="memberHomeGrid">
              <aside className="memberRail leftRail">
                <article className="surfaceCard profileSummaryCard">
                  <div className="profileCoverBand" />
                  <div className="profileIdentityBlock">
                    {renderAvatar(currentMemberName, currentMemberAvatar, currentMemberInitials, 'summaryAvatar')}

                    <div className="profileIdentityCopy">
                      <span className="memberPlanBadge free">{isFrench ? 'Membre gratuit' : 'Free member'}</span>
                      <strong>{currentMemberName}</strong>
                      <p>{workspaceLoading ? 'Chargement...' : currentMemberHeadline}</p>
                      <small>{currentMemberCompany}</small>
                    </div>
                  </div>

                  <div className="summaryMetaList">
                    <span>
                      <MapPin className="miniIcon" strokeWidth={2.1} />
                      {currentMemberLocation}
                    </span>
                    <span>
                      <ShieldCheck className="miniIcon" strokeWidth={2.1} />
                      {isFrench ? 'Visibilite' : 'Visibility'} : {currentMemberVisibility}
                    </span>
                    <span>
                      <BadgeCheck className="miniIcon" strokeWidth={2.1} />
                      {workspaceProfile?.identityVerified ? (isFrench ? 'Profil verifie' : 'Verified profile') : (isFrench ? 'Verification en attente' : 'Verification pending')}
                    </span>
                  </div>

                  <div className="summaryStatsGrid">
                    <article>
                      <small>{isFrench ? 'Profil' : 'Profile'}</small>
                      <strong>{currentMemberVisibility === 'Public' ? (isFrench ? 'Public actif' : 'Public active') : currentMemberVisibility}</strong>
                    </article>
                    <article>
                      <small>{isFrench ? 'Verification' : 'Verification'}</small>
                      <strong>{workspaceProfile?.identityVerified ? (isFrench ? 'Validee' : 'Verified') : (isFrench ? 'En attente' : 'Pending')}</strong>
                    </article>
                    <article>
                      <small>{isFrench ? 'CV' : 'Resume'}</small>
                      <strong>{workspaceProfile?.cvUrl ? (isFrench ? 'Pret' : 'Ready') : (isFrench ? 'A ajouter' : 'Add it')}</strong>
                    </article>
                  </div>

                  <div className="profilePrimaryRow">
                    <Link href={profileHref} className="primaryButton compactAction">
                      <UserRound className="buttonIcon" strokeWidth={2.1} />
                      {isFrench ? 'Voir mon profil' : 'View my profile'}
                    </Link>
                    <Link href={editProfileHref} className="ghostButton compactAction">
                      <UserRound className="buttonIcon" strokeWidth={2.1} />
                      {isFrench ? 'Modifier' : 'Edit'}
                    </Link>
                  </div>
                </article>

                <article className="surfaceCard quickNavCard">
                  <div className="railSectionHead">
                    <strong>{isFrench ? 'Raccourcis' : 'Shortcuts'}</strong>
                  </div>
                  <nav className="quickNavList" aria-label={isFrench ? 'Navigation membre' : 'Member navigation'}>
                    {memberQuickLinks.map((item) => {
                      const Icon = item.icon;
                      const derivedFeedFilter =
                        item.feedFilter ||
                        (item.href?.includes('#opportunities')
                          ? item.icon === BriefcaseBusiness
                            ? 'opportunities'
                            : item.icon === CalendarDays
                              ? 'events'
                              : null
                          : null);

                      if (derivedFeedFilter) {
                        return (
                          <button
                            key={item.label}
                            type="button"
                            className={activeFeedFilter === derivedFeedFilter ? 'quickNavLink active' : 'quickNavLink'}
                            onClick={() => {
                              setActiveFeedFilter(derivedFeedFilter);
                              document.getElementById('member-feed')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
                            }}
                          >
                            <Icon className="miniIcon" strokeWidth={2.1} />
                            <span>{item.label}</span>
                          </button>
                        );
                      }

                      return (
                        <Link key={item.label} href={item.href || '#'} className="quickNavLink">
                          <Icon className="miniIcon" strokeWidth={2.1} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </article>

                <article className="surfaceCard trendsCard">
                  <div className="railSectionHead">
                    <strong>{isFrench ? 'Tendances' : 'Trends'}</strong>
                  </div>
                  <div className="trendList">
                    {trendItems.slice(0, 5).map((item) => (
                      <Link key={item.label} href={localizeHref(locale, `/search?q=${encodeURIComponent(item.label)}`)} className="trendLink">
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </article>
              </aside>

              <section className="memberFeedColumn" id="member-feed">
                <article className="surfaceCard composerLauncherCard">
                  <div className="composerLauncherHead">
                    {renderAvatar(currentMemberName, currentMemberAvatar, currentMemberInitials, 'composerAvatar')}

                    <button
                      type="button"
                      className="composerPromptButton"
                      onClick={() => openComposer('article')}
                    >
                      {isFrench ? `Quoi de neuf, ${currentMemberFirstName} ?` : `${createPostLabel}, ${currentMemberFirstName}?`}
                    </button>
                  </div>

                  <div className="composerShortcutRow">
                    {(Object.keys(composerTypeIcons) as PostComposerType[]).map((type) => {
                      const Icon = composerTypeIcons[type];

                      return (
                        <button
                          key={type}
                          type="button"
                          className={`composerShortcut ${type}`}
                          onClick={() => openComposer(type)}
                        >
                          <Icon className="miniIcon" strokeWidth={2.1} />
                          {composerTypeLabels[type]}
                        </button>
                      );
                    })}
                  </div>
                </article>

                <article className="surfaceCard feedColumnCard">
                  <div className="sectionHead">
                    <div>
                      <span className="eyebrow">{isFrench ? "Fil d'actualite" : 'Feed'}</span>
                      <h2>{isFrench ? 'Reseau professionnel' : 'Professional network'}</h2>
                    </div>

                    <div className="sectionHeadActions">
                      <Link href={messagesHref} className="ghostInlineLink">
                        <MessageSquareText className="miniIcon" strokeWidth={2.1} />
                        {isFrench ? 'Messages' : 'Messages'}
                      </Link>
                      <Link href={notificationsHref} className="ghostInlineLink">
                        <Bell className="miniIcon" strokeWidth={2.1} />
                        {isFrench ? 'Notifications' : 'Notifications'}
                      </Link>
                    </div>
                  </div>

                  <div className="feedFilterBar" aria-label={isFrench ? 'Filtres du fil' : 'Feed filters'}>
                    {(['recommended', 'all', 'opportunities', 'events', 'documents', 'cv'] as FeedFilter[]).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={activeFeedFilter === filter ? 'feedFilterChip active' : 'feedFilterChip'}
                        onClick={() => setActiveFeedFilter(filter)}
                      >
                        {filter === activeFeedFilter ? activeFilterTitle : filterLabel(locale, filter)}
                      </button>
                    ))}
                  </div>

                  <div className="postFeedList">
                    {postNotice ? <div className="inlineNotice">{postNotice}</div> : null}
                    {memberPostsLoading ? (
                      <div className="skeletonFeed" aria-busy="true" aria-live="polite">
                        {[0, 1, 2].map((item) => renderPostSkeleton(item))}
                      </div>
                    ) : personalizedFeedPosts.length ? (
                      personalizedFeedPosts.map((post) => renderPostCard(post))
                    ) : (
                      <div className="feedEmptyState">
                        <strong>{isFrench ? 'Aucune publication pour le moment' : 'No posts yet'}</strong>
                        <p>{isFrench ? 'Publiez une idee, un projet ou une actualite pour lancer votre reseau.' : 'Share an idea, a project or an update to start your network.'}</p>
                      </div>
                    )}
                  </div>

                  {!showMemberHome && generatedPosts.length ? (
                    <div ref={feedSentinelRef} className="feedContinuationPanel" aria-live="polite">
                      <span className="feedContinuationGlow" aria-hidden="true" />
                      <strong>{isFrench ? 'Le feed continue' : 'The feed keeps going'}</strong>
                      <p>
                        {isFrench
                          ? 'De nouvelles publications se chargent pendant que vous descendez.'
                          : 'More publications load as you continue scrolling.'}
                      </p>
                    </div>
                  ) : null}
                </article>
              </section>

              <aside className="memberRail rightRail">
                <article className="surfaceCard suggestionCard">
                  <div className="sectionHead compact">
                    <div>
                      <span className="eyebrow">{isFrench ? 'Reseau' : 'Network'}</span>
                      <h3>{isFrench ? 'A suivre' : 'People to follow'}</h3>
                    </div>
                  </div>

                  <div className="suggestionList">
                    {suggestedProfiles.length ? suggestedProfiles.map((profile) => {
                      const targetId = connectionTargetId(profile);
                      const added = followingIds.includes(targetId);
                      const pending = pendingConnectionIds.includes(targetId);

                      return (
                        <article key={profile.id} className="suggestionRow">
                          <div className="suggestionIdentity">
                            {renderAvatar(profileName(profile), assetUrl(profile.profilePictureUrl), profileInitials(profile), 'suggestionAvatar')}
                            <div className="suggestionCopy">
                              <strong>{profileName(profile)}</strong>
                        <span>{profileHeadline(profile)}</span>
                        <small>{[profile.city, profile.country].filter(Boolean).join(', ') || (isFrench ? 'Localisation a venir' : 'Location coming soon')}</small>
                            </div>
                          </div>

                          <div className="suggestionActions">
                            <button
                              type="button"
                              className={added ? 'followButton active' : 'followButton'}
                              onClick={() => toggleFollowing(profile)}
                              disabled={pending}
                            >
                              <Plus className="miniIcon" strokeWidth={2.1} />
                              {added ? (isFrench ? 'Demande' : 'Requested') : (isFrench ? 'Ajouter' : 'Add')}
                            </button>
                            {isNavigableProfile(profile) ? (
                              <Link href={localizeHref(locale, `/u/${profile.publicProfileUrl}`)} className="textActionLink">
                                {viewProfileLabel}
                              </Link>
                            ) : null}
                          </div>
                        </article>
                      );
                    }) : (
                      <div className="compactEmptyState">{isFrench ? 'Aucune suggestion pour le moment.' : 'No suggestions right now.'}</div>
                    )}
                  </div>
                </article>

                {recommendedProfiles.length ? <article className="surfaceCard premiumRecommendationCard">
                  <div className="sectionHead compact">
                    <div>
                      <span className="eyebrow">{isFrench ? 'Premium' : 'Premium'}</span>
                      <h3>{isFrench ? 'Profils a forte affinite' : 'High-affinity profiles'}</h3>
                    </div>
                  </div>

                  <div className="recommendationList">
                    {recommendedProfiles.map((profile, index) => {
                      const tier = profile.membershipTier && profile.membershipTier !== 'Free' ? profile.membershipTier : null;
                      return (
                      <article key={`${profile.id}-premium`} className="recommendationRow">
                        <div className="recommendationTopline">
                          <strong>{profileName(profile)}</strong>
                          {tier ? <span className={`memberPlanBadge ${tier.toLowerCase()}`}>{tier}</span> : null}
                        </div>
                        <span>{profileHeadline(profile)}</span>
                        <small>{buildRecommendationReason(profile, workspaceProfile, locale)}</small>
                      </article>
                    );
                    })}
                  </div>
                </article> : null}

                <article className="surfaceCard opportunitiesCard">
                  <div className="sectionHead compact">
                    <div>
                      <span className="eyebrow">{isFrench ? 'Opportunites' : 'Opportunities'}</span>
                      <h3>{isFrench ? 'A ne pas manquer' : 'Worth checking'}</h3>
                    </div>
                  </div>

                  <div className="opportunityList">
                    {events.length ? events.map((item) => {
                      const Icon = item.type === 'job' ? BriefcaseBusiness : item.type === 'mentoring' ? UsersRound : GraduationCap;
                      const pending = pendingEventIds.includes(item.id);

                      return (
                        <article key={item.id} className="opportunityRow ocean">
                          <div className="opportunityIconWrap">
                            <Icon className="miniIcon" strokeWidth={2.1} />
                          </div>
                          <div className="opportunityCopy">
                            <strong>{item.title}</strong>
                            <span>{item.subtitle || (isFrench ? 'Evenement Communium' : 'Communium event')}</span>
                            <small>{item.meta || (isFrench ? 'En ligne' : 'Online')}</small>
                          </div>
                          <button type="button" className={item.joined ? 'ghostMiniButton active' : 'ghostMiniButton'} onClick={() => void toggleEventJoin(item.id)} disabled={pending || Boolean(item.joined)}>
                            {pending ? (isFrench ? 'En cours...' : 'Joining...') : item.joined ? (isFrench ? 'Inscrit' : 'Joined') : (isFrench ? 'Participer' : 'Join')}
                          </button>
                        </article>
                      );
                    }) : (
                      <div className="compactEmptyState">{isFrench ? 'Aucun evenement pour le moment.' : 'No events right now.'}</div>
                    )}
                  </div>
                </article>

                <article className="surfaceCard activityCard">
                  <div className="railSectionHead">
                    <strong>{isFrench ? 'Activite' : 'Activity'}</strong>
                  </div>
                  <div className="activityList">
                    {activityItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.label} href={item.href} className="activityLink">
                          <span className="activityIcon">
                            <Icon className="miniIcon" strokeWidth={2.1} />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </article>

                <article className="surfaceCard premiumBannerCard">
                  <div className="cardHead">
                    <span className="eyebrow">{isFrench ? 'Premium' : 'Premium'}</span>
                    <Crown className="miniIcon premiumHeadIcon" strokeWidth={2.1} />
                  </div>
                  <h3>{isFrench ? 'Gagnez en visibilite' : 'Grow your visibility'}</h3>
                  <p>
                    {isFrench
                      ? 'Mettez votre profil et vos publications devant les bonnes personnes.'
                      : 'Appear higher in suggestions and give more weight to your publications.'}
                  </p>
                  <Link href={premiumHref} className="premiumActionButton">
                    {isFrench ? 'Decouvrir Premium' : 'Discover premium'}
                  </Link>
                </article>
              </aside>
            </section>

          </>
        ) : (
          <>
            <PublicLandingExperience
              locale={locale}
              signUpHref={signUpHref}
              signInHref={signInHref}
              discoverHref={discoverPageHref}
              featuresHref={featuresPageHref}
              privacyHref={publicPrivacyPageHref}
              heroProfile={publicLandingHeroProfile}
              heroPost={publicLandingFeedPosts[0]}
              feedPosts={publicLandingFeedPosts}
              previewProfiles={publicLandingPreviewProfiles}
              premiumPlans={publicPremiumCards}
              workflowSteps={publicWorkflowSteps}
            />
            {/* Legacy public landing removed during premium redesign.
            <PublicLandingAtmosphere />
            <section className="guestHero" id="top">
              <div className="guestHeroCopy">
                <span className="eyebrow">{isFrench ? 'Communium' : 'Communium'}</span>
                <h1>
                  {isFrench
                    ? 'Le reseau professionnel qui valorise votre profil, vos projets et vos connexions.'
                    : 'The professional network that elevates your profile, your projects and your connections.'}
                </h1>
                <p>
                  {isFrench
                    ? 'Creez une presence professionnelle claire, partagez vos realisations, controlez vos donnees et augmentez votre visibilite aupres des bonnes personnes.'
                    : 'Build a clear professional presence, share your work, control your data and increase visibility with the right people.'}
                </p>

                <div className="heroButtonRow">
                  <Link href={signUpHref} className="primaryButton">
                    {isFrench ? 'Creer mon profil' : 'Create my profile'}
                  </Link>
                  <Link href={discoverPageHref} className="ghostButton">
                    {isFrench ? 'Explorer les profils' : 'Explore profiles'}
                  </Link>
                </div>

                <div className="heroSignalRow">
                  <span>{isFrench ? 'Profils verifies' : 'Verified profiles'}</span>
                  <span>{isFrench ? 'Public / Connexions / Prive' : 'Public / Connections / Private'}</span>
                  <span>{isFrench ? 'Visibilite Premium' : 'Premium visibility'}</span>
                </div>
              </div>

              <div className="heroShowcase landingProductPreview">
                <article className="showcasePrimaryCard heroPreviewProfileCard">
                  <div className="showcaseHead heroPreviewHead">
                    <span className="showcaseBadge">{isFrench ? 'Apercu produit' : 'Product preview'}</span>
                    <span className="heroPremiumBadge">
                      <Crown className="miniIcon" strokeWidth={2.1} />
                      {isFrench ? 'Premium' : 'Premium'}
                    </span>
                  </div>

                  <div className="showcaseIdentity heroPreviewIdentity">
                    {renderAvatar(profileName(heroProfile), assetUrl(heroProfile.profilePictureUrl), profileInitials(heroProfile), 'showcaseAvatar')}
                    <div>
                      <strong>{profileName(heroProfile)}</strong>
                      <p>{profileHeadline(heroProfile)}</p>
                      <small>
                        {[heroProfile.city, heroProfile.country].filter(Boolean).join(' · ') ||
                          (isFrench ? 'Ville · Pays' : 'City · Country')}
                      </small>
                    </div>
                  </div>

                  <div className="previewMetricGrid">
                    {previewMetricCards.map((item) => (
                      <article key={item.label} className="previewMetricCard">
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                      </article>
                    ))}
                  </div>

                  <div className="previewSurfaceFooter">
                    <span className="showcaseUrl">communium.com/u/{heroProfile.publicProfileUrl || 'masinandro'}</span>
                    <Link href={discoverPageHref} className="textActionLink">
                      {isFrench ? 'Explorer les profils' : 'Explore profiles'}
                    </Link>
                  </div>
                </article>

                {heroPost ? (
                  <article className="showcaseSecondaryCard heroPreviewPostCard">
                    <div className="previewPostHead">
                      <div className="previewPostAuthor">
                        {renderAvatar(
                          heroPost.authorName,
                          heroPost.authorAvatar,
                          heroPost.authorName.slice(0, 2).toUpperCase(),
                          'networkPostAvatar',
                        )}
                        <div>
                          <strong>{heroPost.authorName}</strong>
                          <small>{heroPost.authorRole}</small>
                        </div>
                      </div>
                      <span className="premiumPill">
                        <Star className="miniIcon" strokeWidth={2.1} />
                        {isFrench ? 'Publication pro' : 'Professional post'}
                      </span>
                    </div>

                    <p>{heroPost.text}</p>

                    {heroPost.attachment ? (
                      <div className={`postMedia ${attachmentKind(heroPost.attachment)}`}>
                        {attachmentKind(heroPost.attachment) === 'image' ? (
                          <img src={assetUrl(heroPost.attachment.fileUrl)} alt={heroPost.attachment.title || composerTypeLabels[heroPost.contentType]} loading="lazy" />
                        ) : null}
                        {attachmentKind(heroPost.attachment) === 'video' ? (
                          <video src={assetUrl(heroPost.attachment.fileUrl)} controls preload="metadata" />
                        ) : null}
                        {attachmentKind(heroPost.attachment) === 'file' ? (
                          <a href={assetUrl(heroPost.attachment.fileUrl)} target="_blank" rel="noreferrer" className="attachmentCard">
                            <strong>{heroPost.attachment.title || heroPost.attachment.fileName || composerTypeLabels[heroPost.contentType]}</strong>
                            <span>{isFrench ? 'Ouvrir le fichier joint' : 'Open attached file'}</span>
                          </a>
                        ) : null}
                        {attachmentKind(heroPost.attachment) === 'note' ? (
                          <div className="attachmentCard">
                            <strong>{heroPost.attachment.title}</strong>
                            <span>{heroPost.attachment.detail}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="chipRow">
                      {heroPost.chips.slice(0, 3).map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>

                    <div className="networkPostMeta">
                      <span>{formatter.format(heroPost.reactions)} {reactionsLabel}</span>
                      <span>{formatter.format(heroPost.comments)} {commentsLabel}</span>
                      <span>{formatter.format(heroPost.shares)} {isFrench ? 'partages' : 'shares'}</span>
                    </div>
                  </article>
                ) : null}
              </div>
            </section>

            <PublicImmersionSection locale={locale} signUpHref={signUpHref} exploreHref={featuresPageHref} />

            <section className="marketingSection proofStripSection">
              <div className="proofStripRow">
                {publicProofSignals.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.label} className="proofSignalPill">
                      <span className="proofSignalIcon">
                        <Icon className="miniIcon" strokeWidth={2.1} />
                      </span>
                      <span>{item.label}</span>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="marketingSection problemSection">
              <div className="problemGrid">
                <div className="sectionHead compact">
                  <div>
                    <span className="eyebrow">{isFrench ? 'Le probleme' : 'The problem'}</span>
                    <h2>
                      {isFrench
                        ? 'Un profil professionnel ne doit pas etre une simple page statique.'
                        : 'A professional profile should not be a static page.'}
                    </h2>
                  </div>
                  <p>
                    {isFrench
                      ? 'Pour convaincre, il faut pouvoir montrer son identite, ses projets, son parcours et ses signaux de confiance sans exposer les mauvaises informations.'
                      : 'To convince, people need to show identity, projects, track record and trust signals without exposing the wrong information.'}
                  </p>
                </div>

                <article className="problemPanel">
                  <ul className="problemPointList">
                    {publicProblemPoints.map((item) => (
                      <li key={item}>
                        <CheckCircle2 className="miniIcon" strokeWidth={2.1} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <section className="marketingSection solutionSection">
              <div className="sectionHead">
                <div>
                  <span className="eyebrow">{isFrench ? 'La solution' : 'The solution'}</span>
                  <h2>
                    {isFrench
                      ? 'Communium centralise votre presence professionnelle.'
                      : 'Communium centralizes your professional presence.'}
                  </h2>
                </div>
                <p>
                  {isFrench
                    ? 'Une architecture simple: profil public, espace prive, publications professionnelles et visibilite Premium quand vous voulez aller plus vite.'
                    : 'A simple architecture: public profile, private space, professional publishing and Premium visibility when you want to move faster.'}
                </p>
              </div>

              <div className="marketingCardGrid fourCols landingFeatureGrid">
                {publicSolutionCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <article key={card.title} className="surfaceCard landingFeatureCard">
                      <span className="featureIcon">
                        <Icon className="buttonIcon" strokeWidth={2.1} />
                      </span>
                      <strong>{card.title}</strong>
                      <p>{card.text}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="marketingSection workflowSection">
              <div className="sectionHead">
                <div>
                  <span className="eyebrow">{isFrench ? 'Comment ca marche' : 'How it works'}</span>
                  <h2>{isFrench ? 'Trois etapes pour poser une presence claire.' : 'Three steps to build a clear presence.'}</h2>
                </div>
                <p>
                  {isFrench
                    ? 'Creez votre base, choisissez votre niveau d ouverture, puis activez votre reseau.'
                    : 'Create your base, choose the right level of visibility, then activate your network.'}
                </p>
              </div>

              <div className="workflowRail">
                {publicWorkflowSteps.map((step, index) => (
                  <article key={step.step} className="workflowStepCard">
                    <div className="workflowMarker">
                      <span>{step.step}</span>
                    </div>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                    {index < publicWorkflowSteps.length - 1 ? <span className="workflowConnector" aria-hidden="true" /> : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="marketingSection previewShowcaseSection">
              <div className="sectionHead">
                <div>
                  <span className="eyebrow">{isFrench ? 'Apercu feed' : 'Feed preview'}</span>
                  <h2>{isFrench ? 'Le produit se comprend en regardant le reseau vivre.' : 'The product becomes clear when the network comes alive.'}</h2>
                </div>
                <p>
                  {isFrench
                    ? 'Profils, publications, reactions et preuves sociales se renforcent dans le meme espace.'
                    : 'Profiles, posts, reactions and social proof reinforce one another inside the same space.'}
                </p>
              </div>

              <div className="previewShowcaseGrid">
                <div className="limitedFeedPreview compactFeed">
                  {heroPost ? renderPostCard(heroPost, true) : null}
                  {generatedPosts[1] ? renderPostCard(generatedPosts[1], true) : null}
                </div>

                <div className="previewSideColumn">
                  <article className="surfaceCard previewSideCard">
                    <div className="sectionHead compact">
                      <div>
                        <span className="eyebrow">{isFrench ? 'Carte profil' : 'Profile card'}</span>
                        <h3>{isFrench ? 'Presence lisible en un coup d oeil' : 'Readable presence at a glance'}</h3>
                      </div>
                    </div>

                    <div className="previewProfileMini">
                      {renderAvatar(profileName(heroProfile), assetUrl(heroProfile.profilePictureUrl), profileInitials(heroProfile), 'summaryAvatar')}
                      <div className="previewProfileCopy">
                        <strong>{profileName(heroProfile)}</strong>
                        <span>{profileHeadline(heroProfile)}</span>
                        <small>
                          {[heroProfile.city, heroProfile.country].filter(Boolean).join(' · ') ||
                            (isFrench ? 'Ville · Pays' : 'City · Country')}
                        </small>
                      </div>
                    </div>

                    <div className="previewPillRow">
                      <span>{isFrench ? 'Badge Premium' : 'Premium badge'}</span>
                      <span>{isFrench ? 'CV partageable' : 'Shareable CV'}</span>
                      <span>{isFrench ? 'Confidentialite' : 'Privacy'}</span>
                    </div>
                  </article>

                  <article className="surfaceCard previewSideCard">
                    <div className="sectionHead compact">
                      <div>
                        <span className="eyebrow">{isFrench ? 'Communaute' : 'Community'}</span>
                        <h3>{isFrench ? 'Une activite plus credible et mieux ciblee' : 'More credible and better targeted activity'}</h3>
                      </div>
                    </div>

                    <div className="previewMetricGrid dense">
                      <article className="previewMetricCard">
                        <small>{isFrench ? 'Publications visibles' : 'Visible posts'}</small>
                        <strong>{formatter.format(generatedPosts.length * 12 + 48)}</strong>
                      </article>
                      <article className="previewMetricCard">
                        <small>{isFrench ? 'Interactions reseau' : 'Network interactions'}</small>
                        <strong>{formatter.format(320 + effectiveProfiles.length * 28)}</strong>
                      </article>
                    </div>

                    <Link href={featuresPageHref} className="textActionLink">
                      {isFrench ? 'Voir la communaute' : 'View the community'}
                    </Link>
                  </article>
                </div>
              </div>
            </section>

            <section className="marketingSection premiumLandingSection">
              <div className="sectionHead">
                <div>
                  <span className="eyebrow">{isFrench ? 'Premium' : 'Premium'}</span>
                  <h2>{isFrench ? 'Des offres lisibles et elegantes.' : 'Clear and elegant plans.'}</h2>
                </div>
                <p>
                  {isFrench
                    ? 'Chaque abonnement met en avant un benefice principal avec trois avantages maximum pour rester lisible.'
                    : 'Each plan focuses on one main benefit with up to three clear advantages.'}
                </p>
              </div>

              <div className="premiumCompactGrid">
                {publicPremiumCards.map((plan) => (
                  <article key={plan.id} className={`premiumCompactCard ${plan.accent}${plan.recommended ? ' recommended' : ''}`}>
                    <div className="premiumCompactHead">
                      <span className="premiumCompactEyebrow">{plan.eyebrow}</span>
                      {plan.recommended ? <span className="premiumCompactBadge">{isFrench ? 'Recommande' : 'Recommended'}</span> : null}
                    </div>
                    <div className="premiumCompactPriceBlock">
                      <strong>{plan.price}</strong>
                      <small>{plan.note}</small>
                    </div>
                    <p>{plan.summary}</p>
                    <ul className="premiumFeatureList">
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <CheckCircle2 className="miniIcon" strokeWidth={2.1} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.href} className={plan.recommended ? 'primaryButton fullWidth' : 'ghostButton fullWidth'}>
                      {plan.cta}
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="marketingSection securityLandingSection">
              <div className="sectionHead">
                <div>
                  <span className="eyebrow">{isFrench ? 'Securite' : 'Security'}</span>
                  <h2>{isFrench ? 'Vos donnees restent sous votre controle.' : 'Your data stays under your control.'}</h2>
                </div>
                <p>
                  {isFrench
                    ? 'Communium distingue la page publique, les connexions et l espace prive afin de proteger ce qui doit rester sensible.'
                    : 'Communium separates public view, connections and private space so sensitive information stays protected.'}
                </p>
              </div>

              <div className="securityLandingGrid">
                <article className="surfaceCard securityLandingCard">
                  <div className="securityPillRow">
                    <span className="isPublic">{isFrench ? 'Public' : 'Public'}</span>
                    <span className="isConnections">{isFrench ? 'Connexions' : 'Connections'}</span>
                    <span className="isPrivate">{isFrench ? 'Prive' : 'Private'}</span>
                  </div>
                  <ul className="securityRuleList">
                    <li>{isFrench ? 'Email, telephone, CIN et adresse prives par defaut' : 'Email, phone, ID and address private by default'}</li>
                    <li>{isFrench ? 'URL publique controlee par votre username' : 'Public URL controlled by your username'}</li>
                    <li>{isFrench ? 'CV visible seulement selon votre permission' : 'CV visible only with your permission'}</li>
                    <li>{isFrench ? 'Visibilite par champ pour chaque information importante' : 'Field-level visibility for every important detail'}</li>
                  </ul>
                </article>

                <article className="surfaceCard securityLandingCard">
                  <div className="securityPrivacyMatrix">
                    <div>
                      <small>{isFrench ? 'Coordonnees' : 'Contact details'}</small>
                      <strong>{isFrench ? 'Prive par defaut' : 'Private by default'}</strong>
                    </div>
                    <div>
                      <small>{isFrench ? 'Profil public' : 'Public profile'}</small>
                      <strong>{isFrench ? 'Controle total' : 'Full control'}</strong>
                    </div>
                    <div>
                      <small>{isFrench ? 'Connexions' : 'Connections'}</small>
                      <strong>{isFrench ? 'Partage cible' : 'Targeted sharing'}</strong>
                    </div>
                  </div>

                  <Link href={publicPrivacyPageHref} className="textActionLink">
                    <ShieldCheck className="miniIcon" strokeWidth={2.1} />
                    {isFrench ? 'Voir la page securite' : 'View security page'}
                  </Link>
                </article>
              </div>
            </section>

            <section className="marketingSection publicExamplesSection">
              <div className="sectionHead">
                <div>
                  <span className="eyebrow">{isFrench ? 'Profils publics' : 'Public profiles'}</span>
                  <h2>{isFrench ? 'Trois apercus compacts et realistes.' : 'Three compact, realistic previews.'}</h2>
                </div>
                <p>
                  {isFrench
                    ? 'Des exemples sobres qui montrent la clarte du produit sans l alourdir.'
                    : 'Clean examples that show the product clearly without making the page heavy.'}
                </p>
              </div>

              <div className="profilePreviewGrid publicExamplesGrid">
                {previewProfiles.map((profile) => (
                  <article key={profile.id} className="surfaceCard publicProfileCard publicExampleCard">
                    <div className="publicProfileTop">
                      {renderAvatar(profileName(profile), assetUrl(profile.profilePictureUrl), profileInitials(profile), 'publicProfileAvatar')}
                      <div className="publicExampleMeta">
                        <strong>{profileName(profile)}</strong>
                        <span>{profileHeadline(profile)}</span>
                        <small>
                          {[profile.city, profile.country].filter(Boolean).join(' · ') || (isFrench ? 'Ville · Pays' : 'City · Country')}
                        </small>
                      </div>
                    </div>
                    <div className="publicProfileTags">
                      {(profile.interests?.slice(0, 3) || []).map((interest) => (
                        <span key={`${profile.id}-${interest.id}`}>{interest.name}</span>
                      ))}
                    </div>
                    <Link
                      href={isNavigableProfile(profile) ? localizeHref(locale, `/profile/${profile.publicProfileUrl}`) : discoverPageHref}
                      className="ghostButton fullWidth"
                    >
                      {isFrench ? 'Voir apercu' : 'View preview'}
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="finalCtaSection" id="contact">
              <div className="finalCtaCopy">
                <span className="eyebrow">{isFrench ? 'Pret a entrer' : 'Ready to join'}</span>
                <h2>
                  {isFrench
                    ? 'Construisez une presence professionnelle qui inspire confiance.'
                    : 'Build a professional presence that inspires trust.'}
                </h2>
                <p>
                  {isFrench
                    ? 'Rejoignez Communium et transformez votre profil en veritable espace de visibilite professionnelle.'
                    : 'Join Communium and turn your profile into a true professional visibility space.'}
                </p>
              </div>
              <div className="finalCtaActions">
                <Link href={signUpHref} className="primaryButton">
                  {isFrench ? 'Creer mon profil' : 'Create my profile'}
                </Link>
                <Link href={signInHref} className="ghostButton">
                  {isFrench ? 'Se connecter' : 'Sign in'}
                </Link>
              </div>
            </section>

            <SiteFooter locale={locale} variant="public" />
          */}
          </>
        )}
      </div>

      {showMemberHome && isComposerOpen ? (
        <div className="composerModalBackdrop" role="presentation" onClick={closeComposer}>
          <div className="composerModalCard" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="composerModalHead">
              <div>
                <span className="eyebrow">{isFrench ? 'Nouvelle publication' : 'New publication'}</span>
                <h2>{isFrench ? 'Publier une mise a jour' : 'Share an update'}</h2>
              </div>
              <button type="button" className="iconCloseButton" onClick={closeComposer} aria-label={isFrench ? 'Fermer' : 'Close'}>
                <X className="miniIcon" strokeWidth={2.1} />
              </button>
            </div>

            <form className="composerModalForm" onSubmit={handleCreatePost}>
              <input
                ref={composerFileInputRef}
                className="hiddenComposerFileInput"
                type="file"
                accept={composerFileAccept[composeType] || 'image/*,video/*,.pdf,.doc,.docx'}
                onChange={handleDraftFileChange}
                aria-hidden="true"
                tabIndex={-1}
              />
              <div className="composerTypeGrid">
                {(Object.keys(composerTypeIcons) as PostComposerType[]).map((type) => {
                  const Icon = composerTypeIcons[type];
                  const active = composeType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      className={active ? 'composerTypeChip active' : 'composerTypeChip'}
                      onClick={() => selectComposerType(type)}
                    >
                      <Icon className="miniIcon" strokeWidth={2.1} />
                      {composerTypeLabels[type]}
                    </button>
                  );
                })}
              </div>

              <label className="fieldBlock">
                <span>{isFrench ? 'Votre message' : 'Your message'}</span>
                <textarea
                  rows={5}
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                  placeholder={
                    isFrench
                      ? 'Partager une idee, un projet ou une actualite...'
                      : 'Share an idea, a project or an update...'
                  }
                />
              </label>

              <div className="fieldGrid">
                <label className="fieldBlock">
                  <span>{isFrench ? 'Hashtags' : 'Hashtags'}</span>
                  <div className="fieldWithIcon">
                    <Hash className="miniIcon" strokeWidth={2.1} />
                    <input
                      type="text"
                      value={draftHashtags}
                      onChange={(event) => setDraftHashtags(event.target.value)}
                      placeholder={isFrench ? '#portfolio #premium #reseau' : '#portfolio #premium #network'}
                    />
                  </div>
                </label>

                <label className="fieldBlock">
                  <span>{isFrench ? 'Mentions' : 'Mentions'}</span>
                  <div className="fieldWithIcon">
                    <AtSign className="miniIcon" strokeWidth={2.1} />
                    <input
                      type="text"
                      value={draftMentions}
                      onChange={(event) => setDraftMentions(event.target.value)}
                      placeholder={isFrench ? '@salma @atlas-team' : '@salma @atlas-team'}
                    />
                  </div>
                </label>
              </div>

              <label className="fieldBlock">
                <span>{isFrench ? 'Lien ou reference' : 'Link or reference'}</span>
                <div className="fieldWithIcon">
                  <FileText className="miniIcon" strokeWidth={2.1} />
                  <input
                    type="text"
                    value={draftAttachment}
                    onChange={(event) => setDraftAttachment(event.target.value)}
                    placeholder={
                      isFrench
                        ? 'PDF, video, projet ou lien utile'
                        : 'PDF, video, project or useful link'
                    }
                  />
                </div>
              </label>

              {draftFile ? (
                <div className="selectedAttachmentPreview">
                  {draftFilePreview ? (
                    <img src={draftFilePreview} alt={draftFile.name} />
                  ) : (
                    <span className="selectedAttachmentIcon">
                      <FileText className="miniIcon" strokeWidth={2.1} />
                    </span>
                  )}
                  <div>
                    <strong>{draftFile.name}</strong>
                    <span>{composerTypeLabels[composeType]}</span>
                  </div>
                  <button type="button" onClick={() => { setDraftFile(null); setDraftFilePreview(''); }}>
                    <X className="miniIcon" strokeWidth={2.1} />
                  </button>
                </div>
              ) : null}

              <div className="fieldBlock">
                <span>{isFrench ? 'Visibilite' : 'Visibility'}</span>
                <div className="visibilityChoiceRow">
                  {(['public', 'connections', 'private'] as PostVisibility[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={draftVisibility === value ? 'visibilityChoice active' : 'visibilityChoice'}
                      onClick={() => setDraftVisibility(value)}
                    >
                      {postVisibilityLabel(locale, value)}
                    </button>
                  ))}
                </div>
                <p className="fieldHint">
                  {draftVisibility === 'public'
                    ? isFrench
                       ? 'Visible par tout le monde.'
                       : 'Visible to everyone.'
                    : draftVisibility === 'connections'
                      ? isFrench
                         ? 'Visible par votre reseau.'
                         : 'Visible to your network.'
                      : isFrench
                         ? 'Visible uniquement par vous.'
                         : 'Only visible to you.'}
                </p>
              </div>

              <div className="composerModalFooter">
                <div className="composerModalInfo">
                  <Sparkles className="miniIcon" strokeWidth={2.1} />
                  <span>
                    {isFrench
                      ? 'Votre publication sera ajoutee au fil.'
                      : 'The post will be saved and added to the feed.'}
                  </span>
                </div>

                <button type="submit" className="primaryButton" disabled={!(draftText.trim() || draftAttachment.trim() || draftFile) || isPublishing}>
                  <Send className="buttonIcon" strokeWidth={2.1} />
                  {isPublishing ? (isFrench ? 'Publication...' : 'Publishing...') : composerPublishLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <style>{`
        .homeExperience {
          width: 100%;
          color: var(--ink-950);
        }

        .homeExperienceShell {
          width: 100%;
          display: grid;
          gap: 16px;
          padding: 12px 10px 24px;
        }

        .publicHomeExperience {
          position: relative;
          isolation: isolate;
          display: grid;
          gap: 22px;
        }

        .publicHomeExperience::before {
          content: '';
          position: absolute;
          inset: -24px -18px;
          border-radius: 42px;
          background:
            radial-gradient(circle at 18% 14%, rgba(96, 165, 250, 0.16), transparent 24%),
            radial-gradient(circle at 82% 12%, rgba(244, 114, 182, 0.14), transparent 22%),
            radial-gradient(circle at 50% 84%, rgba(45, 212, 191, 0.14), transparent 26%);
          filter: blur(20px);
          opacity: 0.88;
          pointer-events: none;
          z-index: 0;
        }

        .publicHomeExperience > :not(.publicLandingAtmosphere) {
          position: relative;
          z-index: 1;
        }

        .surfaceCard,
        .marketingSection,
        .guestHero,
        .memberHero,
        .finalCtaSection,
        .marketingFooter {
          border: 1px solid var(--line-soft);
          border-radius: 30px;
          background: var(--panel-strong);
          box-shadow: var(--shadow-soft);
          backdrop-filter: blur(18px);
        }

        .publicHomeExperience .guestHero,
        .publicHomeExperience .marketingSection,
        .publicHomeExperience .marketingFooter {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 255, 0.88));
          border-color: rgba(191, 219, 254, 0.54);
          box-shadow:
            0 24px 56px rgba(15, 23, 42, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(26px);
        }

        .publicHomeExperience .featureCard,
        .publicHomeExperience .testimonialCard,
        .publicHomeExperience .trustCard,
        .publicHomeExperience .publicProfileCard,
        .publicHomeExperience .limitedFeedPreview,
        .publicHomeExperience .showcasePrimaryCard,
        .publicHomeExperience .showcaseSecondaryCard,
        .publicHomeExperience .planCard {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 246, 255, 0.92));
          border-color: rgba(191, 219, 254, 0.46);
          box-shadow:
            0 18px 40px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(24px);
        }

        .publicHomeExperience .featureCard,
        .publicHomeExperience .testimonialCard,
        .publicHomeExperience .trustCard,
        .publicHomeExperience .publicProfileCard,
        .publicHomeExperience .planCard,
        .publicHomeExperience .showcasePrimaryCard,
        .publicHomeExperience .showcaseSecondaryCard,
        .publicHomeExperience .heroFactCard {
          transition:
            transform 0.24s ease,
            box-shadow 0.24s ease,
            border-color 0.24s ease;
        }

        .publicHomeExperience .featureCard:hover,
        .publicHomeExperience .testimonialCard:hover,
        .publicHomeExperience .trustCard:hover,
        .publicHomeExperience .publicProfileCard:hover,
        .publicHomeExperience .planCard:hover,
        .publicHomeExperience .showcasePrimaryCard:hover,
        .publicHomeExperience .showcaseSecondaryCard:hover,
        .publicHomeExperience .heroFactCard:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.24);
          box-shadow:
            0 28px 54px rgba(2, 6, 23, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .eyebrow,
        .homeExperience h1,
        .homeExperience h2,
        .homeExperience h3,
        .homeExperience p {
          margin: 0;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--brand-700);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .homeExperience h1 {
          font-size: clamp(2.7rem, 5vw, 5.1rem);
          line-height: 0.96;
          letter-spacing: -0.06em;
        }

        .homeExperience h2 {
          font-size: clamp(1.72rem, 2.8vw, 2.6rem);
          line-height: 1.02;
          letter-spacing: -0.05em;
        }

        .homeExperience h3 {
          font-size: 1.12rem;
          letter-spacing: -0.03em;
        }

        .guestHero,
        .memberHero,
        .marketingSection,
        .finalCtaSection,
        .marketingFooter,
        .surfaceCard {
          scroll-margin-top: 112px;
        }

        .guestHero,
        .memberHero,
        .finalCtaSection {
          padding: 28px;
        }

        .marketingSection {
          display: grid;
          gap: 20px;
          padding: 24px;
        }

        .memberHero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.86fr);
          gap: 22px;
          align-items: center;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 26%),
            linear-gradient(180deg, var(--panel-elevated), var(--panel-strong));
        }

        .memberHeroCopy,
        .guestHeroCopy,
        .marketingFooterLead,
        .marketingFooterBrand,
        .cardHead,
        .profileIdentityBlock,
        .summaryMetaList,
        .stackActions,
        .postFeedList,
        .discoverTools,
        .composerModalForm,
        .recommendationList,
        .opportunityList {
          display: grid;
          gap: 16px;
        }

        .memberHeroCopy,
        .guestHeroCopy {
          gap: 18px;
        }

        .memberHeroCopy p,
        .guestHeroCopy p,
        .sectionHead p,
        .featureCard p,
        .testimonialCard p,
        .trustCard p,
        .planCard p,
        .suggestionCopy span,
        .suggestionCopy small,
        .recommendationRow span,
        .recommendationRow small,
        .profileIdentityCopy p,
        .profileIdentityCopy small,
        .publicProfileCard p,
        .publicProfileCard small,
        .showcaseBody,
        .showcaseSecondaryCard p,
        .attachmentCard span,
        .networkPostAuthorCopy span,
        .networkPostAuthorCopy small,
        .opportunityCopy span,
        .opportunityCopy small,
        .fieldHint {
          color: var(--ink-600);
          line-height: 1.65;
        }

        .memberHeroMetrics,
        .heroFactRow,
        .summaryStatsGrid,
        .marketingCardGrid,
        .planGrid,
        .trustHighlights,
        .fieldGrid,
        .composerTypeGrid {
          display: grid;
          gap: 16px;
        }

        .memberHeroMetrics {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .metricCard,
        .heroFactCard {
          padding: 18px;
          border-radius: 22px;
          border: 1px solid var(--line-soft);
          background: var(--panel-inset);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .metricCard small,
        .heroFactCard small,
        .summaryStatsGrid small,
        .publicProfileUrl,
        .showcaseUrl,
        .networkPostMeta span,
        .fieldBlock span,
        .limitedPreviewLabel {
          color: var(--ink-500);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .metricCard strong,
        .heroFactCard strong,
        .summaryStatsGrid strong,
        .planPrice,
        .publicProfileCard strong,
        .showcasePrimaryCard strong,
        .showcaseSecondaryCard strong,
        .networkPostAuthorCopy strong,
        .profileIdentityCopy strong,
        .recommendationRow strong,
        .opportunityCopy strong,
        .attachmentCard strong,
        .featureCard strong,
        .testimonialCard strong {
          color: var(--ink-950);
        }

        .metricCard strong,
        .heroFactCard strong {
          display: block;
          margin-top: 8px;
          font-size: 1.55rem;
          letter-spacing: -0.04em;
        }

        .memberHomeGrid {
          display: grid;
          grid-template-columns: minmax(250px, 0.74fr) minmax(520px, 1.22fr) minmax(280px, 0.82fr);
          gap: 14px;
          align-items: start;
        }

        .memberRail,
        .memberFeedColumn {
          display: grid;
          gap: 12px;
          align-items: start;
        }

        .memberRail {
          position: sticky;
          top: 132px;
          max-height: calc(100vh - 148px);
          overflow: auto;
          scrollbar-width: thin;
          padding-bottom: 8px;
        }

        .surfaceCard {
          padding: 16px;
        }

        .profileSummaryCard {
          overflow: hidden;
        }

        .profileCoverBand {
          height: 78px;
          margin: -16px -16px 0;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(51, 65, 85, 0.78)),
            #e8eef6;
        }

        .profileIdentityBlock {
          gap: 10px;
          margin-top: -28px;
        }

        .summaryAvatar,
        .composerAvatar,
        .showcaseAvatar,
        .publicProfileAvatar,
        .suggestionAvatar,
        .networkPostAvatar {
          overflow: hidden;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(15, 139, 141, 0.18));
          color: var(--brand-700);
          display: grid;
          place-items: center;
          font-weight: 900;
        }

        .summaryAvatar {
          width: 66px;
          height: 66px;
          border: 3px solid rgba(255, 255, 255, 0.92);
          box-shadow: 0 14px 26px rgba(15, 23, 42, 0.14);
        }

        .composerAvatar,
        .showcaseAvatar {
          width: 48px;
          height: 48px;
        }

        .publicProfileAvatar,
        .suggestionAvatar,
        .networkPostAvatar {
          width: 52px;
          height: 52px;
        }

        .summaryAvatar img,
        .composerAvatar img,
        .showcaseAvatar img,
        .publicProfileAvatar img,
        .suggestionAvatar img,
        .networkPostAvatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profileIdentityCopy {
          display: grid;
          gap: 4px;
        }

        .profileIdentityCopy strong {
          font-size: 1.18rem;
          letter-spacing: -0.02em;
        }

        .memberPlanBadge {
          width: fit-content;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          padding: 0 11px;
          border-radius: 14px;
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid transparent;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56);
        }

        .memberPlanBadge.free {
          background: rgba(226, 232, 240, 0.68);
          color: var(--ink-800);
          border-color: rgba(148, 163, 184, 0.2);
        }

        .memberPlanBadge.silver {
          background: rgba(226, 232, 240, 0.82);
          color: #475569;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .memberPlanBadge.gold {
          background: rgba(255, 236, 179, 0.92);
          color: #8a5a00;
          border-color: rgba(217, 119, 6, 0.16);
        }

        .memberPlanBadge.platinum {
          background: rgba(219, 234, 254, 0.92);
          color: #1d4ed8;
          border-color: rgba(37, 99, 235, 0.16);
        }

        .summaryMetaList span,
        .networkPostMeta,
        .suggestionIdentity,
        .networkPostHead,
        .networkPostAuthor,
        .networkPostBadgeRow,
        .networkPostActions,
        .composerLauncherHead,
        .composerShortcutRow,
        .sectionHead,
        .sectionHeadActions,
        .showcaseHead,
        .showcaseIdentity,
        .showcaseTags,
        .publicProfileTop,
        .publicProfileTags,
        .publicProfileActions,
        .planHead,
        .heroButtonRow,
        .marketingFooterSocials,
        .marketingFooterLinks,
        .marketingFooterBottom,
        .composerModalHead,
        .visibilityChoiceRow,
        .composerModalFooter,
        .composerModalInfo,
        .fieldWithIcon {
          display: flex;
          align-items: center;
        }

        .summaryMetaList span,
        .networkPostMeta {
          gap: 10px;
        }

        .summaryMetaList span {
          font-size: 0.84rem;
          color: var(--ink-700);
        }

        .summaryStatsGrid {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .summaryStatsGrid article,
        .showcaseSecondaryCard,
        .featureCard,
        .testimonialCard,
        .trustCard,
        .publicProfileCard,
        .limitedFeedPreview,
        .recommendationRow,
        .opportunityRow,
        .attachmentCard,
        .composerTypeChip,
        .discoverSearch,
        .emptyStateCard {
          border: 1px solid var(--line-soft);
          background: var(--panel-inset);
        }

        .summaryStatsGrid article {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 14px;
        }

        .profilePrimaryRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
        }

        .compactAction {
          min-height: 40px;
          border-radius: 14px;
        }

        .primaryButton,
        .ghostButton,
        .premiumActionButton,
        .ghostMiniButton,
        .planButton,
        .postAction,
        .composerShortcut,
        .composerPromptButton,
        .composerTypeChip,
        .visibilityChoice,
        .iconCloseButton {
          min-height: var(--control-height);
          border-radius: var(--radius-control);
          border: 1px solid transparent;
          font-weight: 800;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease,
            color 0.18s ease;
        }

        .primaryButton,
        .ghostButton,
        .premiumActionButton,
        .planButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 16px;
          text-decoration: none;
        }

        .primaryButton,
        .premiumActionButton,
        .planButton.gold,
        .planButton.platinum,
        .planButton.silver {
          background: linear-gradient(135deg, var(--brand-700), var(--brand-500) 55%, #60a5fa);
          color: #ffffff;
          box-shadow: var(--button-shadow-primary);
        }

        .ghostButton,
        .composerShortcut,
        .composerTypeChip,
        .visibilityChoice,
        .postAction,
        .ghostMiniButton,
        .composerPromptButton,
        .iconCloseButton,
        .discoverSearch button {
          color: var(--ink-800);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.88));
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .primaryButton:hover,
        .ghostButton:hover,
        .premiumActionButton:hover,
        .planButton:hover,
        .composerShortcut:hover,
        .composerTypeChip:hover,
        .visibilityChoice:hover,
        .postAction:hover,
        .ghostMiniButton:hover,
        .composerPromptButton:hover,
        .discoverSearch button:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-soft);
        }

        .fullWidth {
          width: 100%;
        }

        .buttonIcon,
        .miniIcon {
          flex: 0 0 auto;
        }

        .buttonIcon {
          width: 18px;
          height: 18px;
        }

        .miniIcon {
          width: 16px;
          height: 16px;
        }

        .premiumBoostCard,
        .premiumBannerCard {
          background:
            radial-gradient(circle at top right, rgba(255, 193, 7, 0.16), transparent 24%),
            linear-gradient(180deg, var(--panel-elevated), var(--panel-strong));
        }

        .premiumBannerCard {
          padding: 14px;
        }

        .premiumBannerCard p {
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .premiumBoostCard h3,
        .premiumBannerCard h3 {
          margin: 0;
          font-size: 1.28rem;
        }

        .premiumHeadIcon {
          color: #d97706;
        }

        .railSectionHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          color: var(--ink-950);
        }

        .quickNavList,
        .trendList,
        .activityList {
          display: grid;
          gap: 4px;
        }

        .quickNavLink,
        .trendLink,
        .activityLink {
          min-height: 38px;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 12px;
          border: 0;
          padding: 0 10px;
          background: transparent;
          color: var(--ink-800);
          cursor: pointer;
          font: inherit;
          text-decoration: none;
          font-weight: 800;
          text-align: left;
          transition:
            background 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;
        }

        .quickNavLink:hover,
        .trendLink:hover,
        .activityLink:hover {
          background: rgba(219, 234, 254, 0.72);
          color: var(--brand-700);
          transform: translateX(2px);
        }

        .quickNavLink.active {
          background: rgba(37, 99, 235, 0.1);
          color: var(--brand-700);
          box-shadow: inset 3px 0 0 var(--brand-600);
        }

        .feedFilterBar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 4px 0 2px;
        }

        .feedFilterChip {
          min-height: 34px;
          border: 1px solid rgba(148, 163, 184, 0.26);
          border-radius: 999px;
          background: var(--panel-elevated);
          color: var(--ink-700);
          padding: 0 13px;
          font: inherit;
          font-size: 0.84rem;
          font-weight: 900;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
        }

        .feedFilterChip:hover,
        .feedFilterChip.active {
          border-color: rgba(37, 99, 235, 0.24);
          background: rgba(219, 234, 254, 0.72);
          color: var(--brand-700);
        }

        .trendLink {
          justify-content: flex-start;
        }

        .activityIcon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(219, 234, 254, 0.72);
          color: var(--brand-700);
        }

        .composerLauncherCard {
          display: grid;
          gap: 12px;
        }

        .composerLauncherHead {
          gap: 12px;
        }

        .composerPromptButton {
          width: 100%;
          justify-content: flex-start;
          min-height: 44px;
          padding: 0 16px;
          text-align: left;
          color: var(--ink-500);
        }

        .composerShortcutRow {
          flex-wrap: wrap;
          gap: 8px;
        }

        .composerShortcut {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          padding: 0 12px;
          font-size: 0.92rem;
        }

        .composerShortcut.photo { color: #0f766e; }
        .composerShortcut.video { color: #be123c; }
        .composerShortcut.cv { color: #475569; }
        .composerShortcut.project { color: #6d28d9; }
        .composerShortcut.article { color: #1d4ed8; }
        .composerShortcut.event { color: #b45309; }
        .composerShortcut.offer { color: #047857; }

        .feedColumnCard {
          display: grid;
          gap: 14px;
        }

        .feedContinuationPanel {
          position: relative;
          overflow: hidden;
          display: grid;
          gap: 8px;
          justify-items: center;
          padding: 18px 20px;
          border-radius: 22px;
          border: 1px solid rgba(37, 99, 235, 0.14);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.94)),
            var(--panel-inset);
          text-align: center;
        }

        .feedContinuationGlow {
          position: absolute;
          inset: auto auto -28px 50%;
          width: 180px;
          height: 74px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.26), transparent 70%);
          transform: translateX(-50%);
          pointer-events: none;
        }

        .feedContinuationPanel strong {
          position: relative;
          z-index: 1;
          font-size: 1.02rem;
          letter-spacing: -0.03em;
          color: var(--ink-950);
        }

        .feedContinuationPanel p {
          position: relative;
          z-index: 1;
          max-width: 480px;
          color: var(--ink-600);
        }

        .sectionHead {
          justify-content: space-between;
          gap: 18px;
        }

        .sectionHead.compact {
          align-items: flex-start;
        }

        .memberHomeGrid .eyebrow {
          font-size: 0.72rem;
          letter-spacing: 0.08em;
        }

        .sectionHead h2,
        .sectionHead h3 {
          margin-top: 6px;
        }

        .memberFeedColumn .sectionHead h2 {
          font-size: clamp(1.5rem, 2.2vw, 2rem);
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .sectionHeadActions,
        .marketingFooterLinks,
        .marketingFooterSocials,
        .networkPostActions,
        .heroButtonRow,
        .showcaseTags,
        .publicProfileTags,
        .chipRow,
        .visibilityChoiceRow {
          flex-wrap: wrap;
          gap: 10px;
        }

        .ghostInlineLink,
        .textActionLink {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--brand-700);
          font-weight: 800;
          text-decoration: none;
        }

        .textActionLink {
          justify-content: flex-end;
        }

        .networkPostCard {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--line-soft);
          background: var(--panel-inset);
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .networkPostCard:hover {
          transform: translateY(-1px);
          border-color: rgba(37, 99, 235, 0.16);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
        }

        .networkPostCard.ocean {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(239, 246, 255, 0.96)),
            var(--panel-inset);
        }

        .networkPostCard.gold {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 251, 235, 0.96)),
            var(--panel-inset);
        }

        .networkPostCard.slate {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(248, 250, 252, 0.96)),
            var(--panel-inset);
        }

        .networkPostCard.mint {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(240, 253, 250, 0.96)),
            var(--panel-inset);
        }

        .networkPostCard.member {
          background:
            linear-gradient(180deg, rgba(59, 130, 246, 0.1), rgba(255, 255, 255, 0.98)),
            var(--panel-inset);
        }

        .networkPostCard.compact {
          padding: 16px;
        }

        .networkPostHead,
        .networkPostAuthor,
        .networkPostActions {
          justify-content: space-between;
          gap: 10px;
        }

        .networkPostAuthor {
          align-items: flex-start;
        }

        .networkPostAuthorCopy {
          display: grid;
          gap: 2px;
        }

        .networkPostBadgeRow {
          gap: 8px;
        }

        .audiencePill,
        .premiumPill {
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .audiencePill.public {
          background: rgba(219, 234, 254, 0.92);
          color: #1d4ed8;
        }

        .audiencePill.connections {
          background: rgba(236, 253, 245, 0.92);
          color: #0f766e;
        }

        .audiencePill.private {
          background: rgba(241, 245, 249, 0.92);
          color: #475569;
        }

        .premiumPill {
          background: rgba(255, 236, 179, 0.92);
          color: #8a5a00;
        }

        .networkPostBody {
          display: grid;
          gap: 10px;
        }

        .networkPostType {
          width: fit-content;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid var(--line-soft);
          color: var(--ink-700);
          font-size: 0.8rem;
          font-weight: 800;
        }

        .networkPostBody p {
          color: var(--ink-800);
          line-height: 1.58;
        }

        .attachmentCard {
          display: grid;
          gap: 4px;
          padding: 14px;
          border-radius: 18px;
          color: inherit;
          text-decoration: none;
        }

        .postMedia {
          overflow: hidden;
          border: 1px solid var(--line-soft);
          border-radius: 18px;
          background: #ffffff;
        }

        .postMedia.image,
        .postMedia.video {
          display: grid;
          place-items: center;
        }

        .postMedia img,
        .postMedia video {
          display: block;
          width: 100%;
          max-height: min(70vh, 680px);
          object-fit: contain;
          background: #0f172a;
        }

        .postMedia.image img {
          background: #ffffff;
        }

        .chipRow span,
        .showcaseTags span,
        .publicProfileTags span {
          min-height: 26px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94));
          border: 1px solid rgba(148, 163, 184, 0.18);
          color: var(--ink-700);
          font-size: 0.74rem;
          font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        .networkPostMeta {
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 2px;
        }

        .networkPostActions {
          flex-wrap: wrap;
          border-top: 1px solid var(--line-soft);
          padding-top: 10px;
        }

        .postAction {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 36px;
          padding: 0 12px;
          font-size: 0.92rem;
        }

        .postAction.active {
          color: var(--brand-700);
          background: rgba(219, 234, 254, 0.86);
          border-color: rgba(37, 99, 235, 0.16);
        }

        .reactionActionWrap,
        .postMenuWrap {
          position: relative;
          display: inline-flex;
        }

        .reactionPicker,
        .postMenuPanel {
          position: absolute;
          z-index: 6;
          opacity: 0;
          pointer-events: none;
          transform: translateY(6px);
          transition: opacity 0.16s ease, transform 0.16s ease;
          border: 1px solid var(--line-soft);
          background: var(--panel-elevated);
          box-shadow: var(--shadow-card);
        }

        .reactionPicker {
          left: 0;
          bottom: calc(100% + 8px);
          display: flex;
          gap: 5px;
          padding: 6px;
          border-radius: 999px;
        }

        .reactionActionWrap:hover .reactionPicker,
        .reactionActionWrap:focus-within .reactionPicker,
        .postMenuWrap:focus-within .postMenuPanel {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .reactionPicker button {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          cursor: pointer;
          font-size: 1.25rem;
          transition: transform 0.14s ease;
        }

        .reactionPicker button:hover {
          transform: translateY(-4px) scale(1.08);
        }

        .reactionIcon {
          min-width: 18px;
          display: inline-grid;
          place-items: center;
        }

        .postAction.iconOnly {
          width: 38px;
          padding: 0;
          justify-content: center;
        }

        .postMenuPanel {
          right: 0;
          top: calc(100% + 8px);
          min-width: 250px;
          display: grid;
          gap: 4px;
          padding: 8px;
          border-radius: 16px;
        }

        .postMenuPanel button {
          min-height: 38px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: var(--ink-900);
          font: inherit;
          font-weight: 800;
          text-align: left;
          cursor: pointer;
          padding: 0 10px;
        }

        .postMenuPanel button:hover {
          background: rgba(219, 234, 254, 0.72);
        }

        .inlineNotice,
        .feedEmptyState,
        .compactEmptyState {
          border: 1px solid var(--line-soft);
          background: rgba(255, 255, 255, 0.72);
          color: var(--text-muted);
          border-radius: 18px;
          padding: 14px 16px;
        }

        .feedEmptyState {
          display: grid;
          gap: 4px;
        }

        .feedEmptyState strong,
        .compactEmptyState {
          color: var(--text-strong);
        }

        .skeletonFeed {
          display: grid;
          gap: 12px;
        }

        .postSkeleton {
          pointer-events: none;
        }

        .skeletonHead {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
        }

        .skeletonStack {
          display: grid;
          gap: 8px;
        }

        .skeletonAvatar,
        .skeletonLine,
        .skeletonActions span {
          display: block;
          border-radius: 999px;
          background:
            linear-gradient(90deg, rgba(226, 232, 240, 0.7), rgba(248, 250, 252, 0.96), rgba(226, 232, 240, 0.7));
          background-size: 220% 100%;
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }

        .skeletonAvatar {
          width: 44px;
          height: 44px;
        }

        .skeletonLine {
          height: 12px;
        }

        .skeletonLine.short {
          width: 38%;
        }

        .skeletonLine.mini {
          width: 24%;
        }

        .skeletonLine.full {
          width: 100%;
        }

        .skeletonLine.wide {
          width: 72%;
        }

        .skeletonActions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--line-soft);
        }

        .skeletonActions span {
          height: 34px;
          border-radius: 14px;
        }

        @keyframes skeletonPulse {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 220% 50%;
          }
        }

        .commentPanel {
          display: grid;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--line-soft);
        }

        .commentList {
          display: grid;
          gap: 10px;
        }

        .commentItem {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
        }

        .commentAvatar {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          overflow: hidden;
          display: grid;
          place-items: center;
          background: #e8eef6;
          color: var(--brand-700);
          font-size: 0.78rem;
          font-weight: 900;
        }

        .commentAvatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .commentItem p,
        .commentEmpty {
          margin: 3px 0 0;
          color: var(--text-muted);
        }

        .commentComposer {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }

        .commentComposer input {
          width: 100%;
          border: 1px solid var(--line-soft);
          border-radius: 14px;
          padding: 0 14px;
          min-height: 42px;
          background: rgba(255, 255, 255, 0.88);
        }

        .suggestionList {
          display: grid;
          gap: 14px;
        }

        .suggestionRow {
          display: grid;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--line-soft);
        }

        .suggestionRow:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .suggestionIdentity {
          gap: 12px;
          align-items: flex-start;
        }

        .suggestionCopy {
          display: grid;
          gap: 3px;
        }

        .suggestionCopy strong,
        .publicProfileCard strong {
          font-size: 1rem;
        }

        .suggestionActions,
        .publicProfileActions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .followButton {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid var(--line-strong);
          background: rgba(255, 255, 255, 0.82);
          color: var(--ink-800);
          font-weight: 800;
        }

        .followButton.active {
          background: rgba(219, 234, 254, 0.92);
          color: var(--brand-700);
          border-color: rgba(37, 99, 235, 0.18);
        }

        .recommendationRow,
        .opportunityRow,
        .featureCard,
        .testimonialCard,
        .publicProfileCard,
        .trustCard,
        .showcasePrimaryCard,
        .showcaseSecondaryCard,
        .limitedFeedPreview,
        .emptyStateCard {
          padding: 18px;
          border-radius: 24px;
        }

        .recommendationRow {
          display: grid;
          gap: 6px;
        }

        .recommendationTopline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .opportunityRow {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .opportunityIconWrap {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid var(--line-soft);
        }

        .opportunityRow.ocean .opportunityIconWrap {
          color: var(--brand-700);
        }

        .opportunityRow.gold .opportunityIconWrap {
          color: #d97706;
        }

        .opportunityRow.slate .opportunityIconWrap {
          color: var(--ink-700);
        }

        .opportunityRow.mint .opportunityIconWrap {
          color: var(--teal-500);
        }

        .opportunityCopy {
          display: grid;
          gap: 2px;
        }

        .ghostMiniButton {
          padding: 0 14px;
        }

        .ghostMiniButton.active {
          color: var(--brand-700);
          background: rgba(219, 234, 254, 0.86);
          border-color: rgba(37, 99, 235, 0.16);
        }

        .guestHero {
          display: grid;
          grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
          gap: 24px;
          align-items: center;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.2), transparent 28%),
            linear-gradient(180deg, var(--panel-elevated), var(--panel-strong));
        }

        .heroButtonRow {
          align-items: center;
        }

        .heroFactRow {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .heroShowcase {
          display: grid;
          gap: 16px;
        }

        .showcasePrimaryCard {
          display: grid;
          gap: 14px;
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.14), transparent 26%),
            var(--panel-inset);
          border: 1px solid var(--line-soft);
        }

        .showcaseHead {
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .showcaseBadge {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(219, 234, 254, 0.92);
          color: var(--brand-700);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .showcaseUrl,
        .publicProfileUrl {
          font-family: 'IBM Plex Mono', 'Cascadia Code', monospace;
        }

        .showcaseIdentity {
          gap: 14px;
          align-items: center;
        }

        .showcaseIdentity strong {
          display: block;
          font-size: 1.1rem;
        }

        .showcaseIdentity p {
          margin-top: 4px;
        }

        .showcaseStack {
          display: grid;
          gap: 16px;
        }

        .sectionHead .statusBadge {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid var(--line-soft);
          color: var(--ink-700);
          font-size: 0.82rem;
          font-weight: 800;
        }

        .marketingCardGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .marketingCardGrid.fourCols {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .marketingCardGrid.threeCols {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .heroSignalRow,
        .proofStripRow,
        .securityPillRow,
        .previewPillRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .heroSignalRow span,
        .proofSignalPill,
        .securityPillRow span,
        .previewPillRow span {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.8);
          color: var(--ink-700);
          font-size: 0.82rem;
          font-weight: 800;
        }

        .landingProductPreview,
        .previewShowcaseGrid,
        .problemGrid,
        .securityLandingGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .heroPreviewProfileCard,
        .heroPreviewPostCard,
        .problemPanel,
        .previewSideCard,
        .securityLandingCard {
          box-shadow:
            0 22px 44px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .heroPreviewHead,
        .previewPostHead,
        .previewPostAuthor,
        .previewSurfaceFooter,
        .premiumCompactHead,
        .previewProfileMini {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .heroPremiumBadge {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(250, 204, 21, 0.16);
          border: 1px solid rgba(234, 179, 8, 0.22);
          color: #b45309;
          font-size: 0.8rem;
          font-weight: 900;
        }

        .previewMetricGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .previewMetricGrid.dense {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .previewMetricCard {
          display: grid;
          gap: 6px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid var(--line-soft);
          background: rgba(255, 255, 255, 0.8);
        }

        .previewMetricCard strong {
          font-size: 1.2rem;
          letter-spacing: -0.04em;
        }

        .previewSurfaceFooter {
          padding-top: 4px;
        }

        .proofStripSection {
          padding-block: 8px;
          background: transparent;
          box-shadow: none;
        }

        .proofStripRow {
          justify-content: center;
        }

        .proofSignalPill {
          background: rgba(255, 255, 255, 0.82);
        }

        .proofSignalIcon {
          width: 24px;
          height: 24px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(219, 234, 254, 0.9);
          color: var(--brand-700);
        }

        .problemPanel {
          padding: 22px;
          border-radius: 26px;
          border: 1px solid var(--line-soft);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent 28%),
            var(--panel-inset);
        }

        .problemPointList,
        .premiumFeatureList,
        .securityRuleList {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 12px;
        }

        .problemPointList li,
        .premiumFeatureList li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: var(--ink-700);
          line-height: 1.62;
        }

        .solutionSection,
        .workflowSection,
        .previewShowcaseSection,
        .premiumLandingSection,
        .securityLandingSection,
        .publicExamplesSection {
          gap: 22px;
        }

        .landingFeatureGrid {
          align-items: stretch;
        }

        .landingFeatureCard {
          display: grid;
          gap: 12px;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
        }

        .workflowRail {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .workflowStepCard {
          position: relative;
          display: grid;
          gap: 12px;
          padding: 22px;
          border-radius: 24px;
          border: 1px solid var(--line-soft);
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
        }

        .workflowMarker {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(29, 78, 216, 0.98), rgba(56, 189, 248, 0.92));
          color: #ffffff;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .workflowConnector {
          position: absolute;
          top: 48px;
          left: calc(100% - 10px);
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.6), rgba(56, 189, 248, 0.22));
        }

        .previewSideColumn,
        .publicExampleMeta,
        .previewProfileCopy,
        .securityPrivacyMatrix {
          display: grid;
          gap: 14px;
        }

        .previewProfileMini {
          justify-content: flex-start;
        }

        .previewProfileMini .summaryAvatar {
          width: 72px;
          height: 72px;
        }

        .previewProfileCopy strong,
        .publicExampleMeta strong {
          font-size: 1.04rem;
        }

        .premiumCompactGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .premiumCompactCard {
          display: grid;
          gap: 14px;
          padding: 20px;
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
        }

        .premiumCompactCard.free {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92));
        }

        .premiumCompactCard.silver {
          background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(226, 232, 240, 0.92));
        }

        .premiumCompactCard.gold {
          background: linear-gradient(180deg, rgba(255, 250, 229, 0.98), rgba(254, 240, 138, 0.5));
          border-color: rgba(245, 158, 11, 0.24);
        }

        .premiumCompactCard.platinum {
          background: linear-gradient(180deg, rgba(245, 243, 255, 0.98), rgba(221, 214, 254, 0.72));
          border-color: rgba(139, 92, 246, 0.22);
        }

        .premiumCompactCard.recommended {
          transform: translateY(-6px);
          box-shadow: 0 26px 48px rgba(245, 158, 11, 0.16);
        }

        .premiumCompactEyebrow,
        .premiumCompactBadge {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .premiumCompactEyebrow {
          background: rgba(255, 255, 255, 0.76);
          color: var(--ink-700);
        }

        .premiumCompactBadge {
          background: rgba(15, 23, 42, 0.08);
          color: var(--ink-800);
        }

        .premiumCompactPriceBlock {
          display: grid;
          gap: 4px;
        }

        .premiumCompactPriceBlock strong {
          font-size: 2rem;
          line-height: 0.96;
          letter-spacing: -0.06em;
        }

        .premiumCompactPriceBlock small {
          color: var(--ink-600);
          font-weight: 700;
        }

        .securityLandingGrid {
          align-items: stretch;
        }

        .securityLandingCard {
          display: grid;
          gap: 16px;
        }

        .securityPillRow .isPublic {
          color: #047857;
          background: rgba(209, 250, 229, 0.9);
        }

        .securityPillRow .isConnections {
          color: #1d4ed8;
          background: rgba(219, 234, 254, 0.92);
        }

        .securityPillRow .isPrivate {
          color: #b91c1c;
          background: rgba(254, 226, 226, 0.9);
        }

        .securityRuleList li {
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid var(--line-soft);
          background: rgba(255, 255, 255, 0.78);
          color: var(--ink-700);
          line-height: 1.62;
        }

        .securityPrivacyMatrix {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .securityPrivacyMatrix div {
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--line-soft);
          background: rgba(255, 255, 255, 0.78);
        }

        .securityPrivacyMatrix strong {
          display: block;
          margin-top: 6px;
        }

        .publicExamplesGrid {
          align-items: stretch;
        }

        .quickEntrySection {
          gap: 22px;
        }

        .routeTeaserGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .routeTeaserCard {
          display: grid;
          gap: 16px;
          padding: 20px;
          border-radius: 26px;
          border: 1px solid rgba(191, 219, 254, 0.42);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(240, 246, 255, 0.9));
          box-shadow:
            0 18px 38px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.66);
        }

        .routeTeaserHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .routeTeaserIcon {
          width: 46px;
          height: 46px;
          display: inline-grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(219, 234, 254, 0.88);
          color: var(--brand-700);
        }

        .routeTeaserEyebrow {
          color: var(--brand-700);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .routeTeaserBody {
          display: grid;
          gap: 8px;
        }

        .routeTeaserBody strong {
          font-size: 1.16rem;
          letter-spacing: -0.03em;
          color: var(--ink-950);
        }

        .routeTeaserBody p {
          color: var(--ink-600);
          line-height: 1.68;
        }

        .routeTeaserLink {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--brand-700);
          text-decoration: none;
          font-weight: 800;
        }

        .featureCard {
          display: grid;
          gap: 12px;
        }

        .featureCard small {
          color: var(--brand-700);
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .featureIcon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(219, 234, 254, 0.88);
          color: var(--brand-700);
        }

        .planGrid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .planCard {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          display: grid;
          gap: 14px;
          padding: 22px;
          border-radius: 28px;
          border: 1px solid var(--line-soft);
          background: var(--panel-inset);
          box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
          transition:
            transform 0.24s ease,
            box-shadow 0.24s ease,
            border-color 0.24s ease;
        }

        .planCard::before,
        .planCard::after {
          content: '';
          position: absolute;
          pointer-events: none;
        }

        .planCard::before {
          top: -54px;
          right: -36px;
          width: 148px;
          height: 148px;
          border-radius: 999px;
          opacity: 0.82;
          filter: blur(14px);
        }

        .planCard::after {
          top: 0;
          left: 20px;
          right: 20px;
          height: 4px;
          border-radius: 999px;
        }

        .planCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 30px 56px rgba(15, 23, 42, 0.14);
        }

        .planCard.free {
          border-color: rgba(148, 163, 184, 0.18);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 244, 246, 0.98)),
            rgba(255, 255, 255, 0.94);
        }

        .planCard.free::before {
          background: radial-gradient(circle, rgba(203, 213, 225, 0.64), transparent 70%);
        }

        .planCard.free::after {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.72), rgba(226, 232, 240, 0.94));
        }

        .planCard.silver {
          border-color: rgba(148, 163, 184, 0.24);
          background:
            linear-gradient(155deg, rgba(255, 255, 255, 0.99), rgba(241, 245, 249, 0.98) 46%, rgba(203, 213, 225, 0.96)),
            rgba(248, 250, 252, 0.96);
        }

        .planCard.silver::before {
          background: radial-gradient(circle, rgba(226, 232, 240, 0.82), transparent 68%);
        }

        .planCard.silver::after {
          background: linear-gradient(90deg, rgba(203, 213, 225, 0.96), rgba(100, 116, 139, 0.88));
        }

        .planCard.gold {
          border-color: rgba(245, 158, 11, 0.24);
          background:
            linear-gradient(160deg, rgba(255, 255, 255, 0.99), rgba(255, 247, 214, 0.98) 44%, rgba(251, 191, 36, 0.36)),
            rgba(255, 249, 224, 0.96);
        }

        .planCard.gold::before {
          background: radial-gradient(circle, rgba(250, 204, 21, 0.84), transparent 68%);
        }

        .planCard.gold::after {
          background: linear-gradient(90deg, rgba(254, 240, 138, 0.96), rgba(245, 158, 11, 0.92));
        }

        .planCard.platinum {
          border-color: rgba(168, 85, 247, 0.26);
          background:
            linear-gradient(155deg, rgba(255, 255, 255, 0.99), rgba(248, 241, 255, 0.98) 34%, rgba(196, 181, 253, 0.5) 76%, rgba(168, 85, 247, 0.42)),
            rgba(250, 245, 255, 0.97);
        }

        .planCard.platinum::before {
          background: radial-gradient(circle, rgba(196, 181, 253, 0.88), transparent 70%);
        }

        .planCard.platinum::after {
          background: linear-gradient(90deg, rgba(196, 181, 253, 0.94), rgba(168, 85, 247, 0.96));
        }

        .planFeatureList,
        .trustList {
          display: grid;
          gap: 12px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .planFeatureList li,
        .trustList li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: var(--ink-700);
          line-height: 1.6;
        }

        .planFeatureList li {
          color: #0f172a;
          font-size: 1.02rem;
          font-weight: 700;
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

        .planIconShell.free {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(226, 232, 240, 0.98));
          color: #475569;
        }

        .planIconShell.silver {
          background: linear-gradient(135deg, rgba(226, 232, 240, 1), rgba(148, 163, 184, 0.94));
          color: #334155;
        }

        .planIconShell.gold {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.98), rgba(250, 204, 21, 0.96));
          color: #ffffff;
        }

        .planIconShell.platinum {
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
          color: #1d4ed8;
        }

        .planTitleBlock h3 {
          margin: 0;
          color: #0f172a;
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

        .planDetailPill.free {
          background: rgba(255, 255, 255, 0.9);
          color: #475569;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .planDetailPill.silver {
          background: rgba(255, 255, 255, 0.66);
          color: #334155;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .planDetailPill.gold {
          background: rgba(255, 251, 235, 0.76);
          color: #b45309;
          border-color: rgba(245, 158, 11, 0.24);
        }

        .planDetailPill.platinum {
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
          font-size: clamp(2.35rem, 3.2vw, 3.1rem);
          font-weight: 900;
          letter-spacing: -0.07em;
          line-height: 0.94;
        }

        .planPriceLabel {
          color: var(--ink-600);
          font-size: 1rem;
          font-weight: 800;
        }

        .planCard.free .planPrice {
          color: #111827;
        }

        .planCard.silver .planPrice {
          color: #475569;
        }

        .planCard.gold .planPrice,
        .planCard.gold .planHighlightEyebrow {
          color: #a16207;
        }

        .planCard.platinum .planPrice,
        .planCard.platinum .planHighlightEyebrow {
          color: #7c3aed;
        }

        .planCard.silver .planHighlightEyebrow {
          color: #475569;
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

        .planHighlight.free {
          background: rgba(255, 255, 255, 0.76);
        }

        .planHighlight.silver {
          background: rgba(255, 255, 255, 0.66);
        }

        .planHighlight.gold {
          background: rgba(255, 251, 235, 0.76);
          border-color: rgba(245, 158, 11, 0.16);
        }

        .planHighlight.platinum {
          background: rgba(250, 245, 255, 0.78);
          border-color: rgba(168, 85, 247, 0.14);
        }

        .planHighlightEyebrow {
          color: #475569;
        }

        .planHighlight p {
          margin: 0;
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

        .planFeatureDot.platinum {
          background: #8b5cf6;
        }

        .planButton.free {
          min-height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(226, 232, 240, 0.96));
          color: #0f172a;
          border-color: rgba(148, 163, 184, 0.24);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.52),
            0 18px 30px rgba(148, 163, 184, 0.12);
        }

        .planButton.silver {
          min-height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(226, 232, 240, 0.98), rgba(148, 163, 184, 0.94));
          color: #0f172a;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 18px 32px rgba(100, 116, 139, 0.18);
        }

        .planButton.gold {
          min-height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(180, 83, 9, 0.96), rgba(250, 204, 21, 0.98));
          color: #ffffff;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 22px 36px rgba(245, 158, 11, 0.28);
        }

        .planButton.platinum {
          min-height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.98), rgba(168, 85, 247, 0.94));
          color: #ffffff;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 22px 36px rgba(124, 58, 237, 0.26);
        }

        .discoverSection {
          gap: 18px;
        }

        .discoverTools {
          gap: 14px;
        }

        .discoverSearch {
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 18px;
        }

        .discoverSearch input,
        .fieldWithIcon input,
        .fieldBlock textarea {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--ink-950);
          font: inherit;
        }

        .fieldBlock textarea {
          resize: vertical;
          min-height: 132px;
        }

        .discoverSearch button {
          padding: 0 16px;
        }

        .discoverGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
          gap: 18px;
          align-items: start;
        }

        .profilePreviewGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .publicProfileCard {
          display: grid;
          gap: 14px;
        }

        .publicProfileTop {
          align-items: flex-start;
          gap: 12px;
        }

        .limitedFeedPreview {
          display: grid;
          gap: 16px;
        }

        .compactFeed {
          gap: 12px;
        }

        .testimonialCard {
          display: grid;
          gap: 12px;
        }

        .testimonialCard p {
          font-size: 1rem;
          line-height: 1.8;
        }

        .trustSection {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: stretch;
        }

        .trustCard {
          display: grid;
          gap: 16px;
        }

        .trustHighlights {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .trustHighlights article {
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.74);
          border: 1px solid var(--line-soft);
        }

        .finalCtaSection {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) auto;
          gap: 20px;
          align-items: center;
          border-color: rgba(37, 99, 235, 0.24);
          background:
            radial-gradient(circle at top right, rgba(96, 165, 250, 0.22), transparent 22%),
            radial-gradient(circle at bottom left, rgba(45, 212, 191, 0.16), transparent 18%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(20, 35, 74, 0.96) 48%, rgba(29, 78, 216, 0.9));
          color: #ffffff;
          box-shadow:
            0 26px 58px rgba(15, 23, 42, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .finalCtaSection .eyebrow,
        .finalCtaSection h2,
        .finalCtaSection p {
          color: #ffffff;
        }

        .finalCtaSection p {
          opacity: 0.84;
        }

        .finalCtaActions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .finalCtaSection .ghostButton {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }

        .marketingFooter {
          display: grid;
          gap: 18px;
          padding: 24px;
        }

        .marketingFooterLead {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
        }

        .marketingFooterBrand {
          grid-template-columns: auto minmax(0, 1fr);
          gap: 14px;
          align-items: center;
        }

        .marketingFooterLogo {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(219, 234, 254, 0.92);
          border: 1px solid var(--line-soft);
          overflow: hidden;
        }

        .marketingFooterLogo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: scale(1.15);
        }

        .marketingFooterBrand strong {
          display: block;
          font-size: 1.18rem;
          letter-spacing: -0.04em;
        }

        .marketingFooterSocials a {
          width: 42px;
          height: 42px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid var(--line-soft);
          background: rgba(255, 255, 255, 0.78);
          color: var(--ink-700);
        }

        .marketingFooterLinks a {
          color: var(--ink-700);
          font-weight: 700;
          text-decoration: none;
        }

        .marketingFooterBottom {
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          color: var(--ink-500);
          font-size: 0.88rem;
        }

        .composerModalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(2, 6, 23, 0.54);
          backdrop-filter: blur(18px);
        }

        .composerModalCard {
          width: min(560px, 100%);
          max-height: min(88vh, 920px);
          overflow: auto;
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--line-soft);
          background: var(--panel-elevated);
          box-shadow: var(--shadow-card);
        }

        .composerModalHead {
          min-height: 42px;
          justify-content: space-between;
          gap: 14px;
          border-bottom: 1px solid var(--line-soft);
          padding-bottom: 10px;
        }

        .composerModalHead h2 {
          margin: 0;
          flex: 1;
          font-size: 1.16rem;
          text-align: center;
        }

        .composerModalHead .eyebrow {
          display: none;
        }

        .composerModalHead h2 {
          font-size: 0;
        }

        .composerModalHead h2::before {
          content: "Creer une publication";
          font-size: 1.16rem;
        }

        .iconCloseButton {
          width: 44px;
          padding: 0;
          display: inline-grid;
          place-items: center;
        }

        .composerModalForm {
          gap: 12px;
        }

        .hiddenComposerFileInput {
          display: none;
        }

        .composerTypeGrid {
          order: 3;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .composerTypeChip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 0;
          padding: 0 12px;
          border-radius: 999px;
        }

        .composerTypeChip.active,
        .visibilityChoice.active {
          color: var(--brand-700);
          border-color: rgba(37, 99, 235, 0.2);
          background: rgba(219, 234, 254, 0.92);
        }

        .selectedAttachmentPreview {
          order: 4;
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          min-height: 64px;
          padding: 8px;
          border-radius: 16px;
          border: 1px solid var(--line-soft);
          background: var(--panel-inset);
        }

        .selectedAttachmentPreview img,
        .selectedAttachmentIcon {
          width: 52px;
          height: 48px;
          border-radius: 12px;
          object-fit: cover;
          display: grid;
          place-items: center;
          background: rgba(219, 234, 254, 0.9);
          color: var(--brand-700);
        }

        .selectedAttachmentPreview strong,
        .selectedAttachmentPreview span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .selectedAttachmentPreview strong {
          color: var(--ink-950);
          font-size: 0.92rem;
        }

        .selectedAttachmentPreview span {
          color: var(--ink-500);
          font-size: 0.8rem;
          font-weight: 800;
        }

        .selectedAttachmentPreview button {
          width: 36px;
          min-height: 36px;
          padding: 0;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
        }

        .fieldBlock {
          display: grid;
          gap: 10px;
        }

        .composerModalForm > .fieldGrid,
        .composerModalForm > label.fieldBlock:nth-of-type(2) {
          display: none;
        }

        .composerModalForm > label.fieldBlock:first-of-type span {
          display: none;
        }

        .composerModalForm > label.fieldBlock:first-of-type textarea {
          min-height: 128px;
          border: 0;
          background: transparent;
          font-size: 1.2rem;
          box-shadow: none;
        }

        .composerModalForm > label.fieldBlock:nth-of-type(3) {
          order: 4;
        }

        .composerModalForm > label.fieldBlock:nth-of-type(3) > span {
          display: none;
        }

        .composerModalForm > label.fieldBlock:nth-of-type(3) .fieldWithIcon {
          min-height: 48px;
          border-radius: 14px;
        }

        .composerModalForm > div.fieldBlock {
          order: 1;
          gap: 8px;
        }

        .fieldGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .fieldWithIcon {
          gap: 10px;
          padding: 0 14px;
          min-height: 52px;
          border-radius: 18px;
          border: 1px solid var(--line-soft);
          background: var(--panel-inset);
        }

        .fieldBlock textarea {
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid var(--line-soft);
          background: var(--panel-inset);
        }

        .visibilityChoice {
          padding: 0 16px;
        }

        .composerModalFooter {
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 6px;
        }

        .composerModalInfo {
          gap: 8px;
          color: var(--ink-600);
          font-weight: 700;
        }

        @media (max-width: 1320px) {
          .memberHomeGrid {
            grid-template-columns: minmax(250px, 0.9fr) minmax(0, 1.25fr);
          }

          .rightRail {
            grid-column: 1 / -1;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .discoverGrid {
            grid-template-columns: 1fr;
          }

          .planGrid,
          .marketingCardGrid.fourCols,
          .premiumCompactGrid,
          .workflowRail,
          .previewMetricGrid,
          .securityPrivacyMatrix,
          .routeTeaserGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1080px) {
          .guestHero,
          .memberHero,
          .finalCtaSection,
          .marketingFooterLead,
          .previewShowcaseGrid,
          .problemGrid,
          .securityLandingGrid {
            grid-template-columns: 1fr;
          }

          .memberHomeGrid,
          .trustSection {
            grid-template-columns: 1fr;
          }

          .memberRail {
            position: static;
            max-height: none;
            overflow: visible;
          }

          .rightRail {
            grid-template-columns: 1fr;
          }

          .profilePreviewGrid,
          .marketingCardGrid,
          .marketingCardGrid.threeCols,
          .premiumCompactGrid,
          .workflowRail,
          .previewMetricGrid.dense,
          .routeTeaserGrid,
          .trustHighlights,
          .memberHeroMetrics,
          .heroFactRow,
          .fieldGrid,
          .composerTypeGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .homeExperienceShell {
            padding-inline: 10px;
          }

          .guestHero,
          .memberHero,
          .marketingSection,
          .surfaceCard,
          .finalCtaSection,
          .marketingFooter,
          .composerModalCard {
            padding: 18px;
            border-radius: 24px;
          }

          .homeExperience h1 {
            font-size: clamp(2.2rem, 11vw, 3.1rem);
          }

          .memberHeroMetrics,
          .heroFactRow,
          .summaryStatsGrid,
          .marketingCardGrid,
          .marketingCardGrid.fourCols,
          .marketingCardGrid.threeCols,
          .premiumCompactGrid,
          .workflowRail,
          .previewMetricGrid,
          .securityPrivacyMatrix,
          .planGrid,
          .routeTeaserGrid,
          .profilePreviewGrid,
          .trustHighlights,
          .fieldGrid,
          .composerTypeGrid {
            grid-template-columns: 1fr;
          }

          .composerLauncherHead,
          .networkPostHead,
          .networkPostAuthor,
          .publicProfileTop,
          .showcaseIdentity,
          .heroPreviewHead,
          .previewPostHead,
          .previewPostAuthor,
          .premiumCompactHead,
          .previewSurfaceFooter {
            align-items: flex-start;
          }

          .discoverSearch {
            grid-template-columns: 1fr;
          }

          .networkPostHead,
          .networkPostAuthor,
          .opportunityRow {
            grid-template-columns: 1fr;
            display: grid;
          }

          .proofStripRow,
          .heroSignalRow {
            justify-content: flex-start;
          }

          .workflowConnector {
            display: none;
          }

          .networkPostBadgeRow,
          .opportunityRow,
          .publicProfileActions,
          .suggestionActions,
          .composerModalFooter,
          .marketingFooterBottom {
            justify-content: flex-start;
          }

          .composerPromptButton,
          .ghostMiniButton,
          .discoverSearch button {
            width: 100%;
            justify-content: center;
          }

          .composerModalBackdrop {
            padding: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeletonAvatar,
          .skeletonLine,
          .skeletonActions span,
          .networkPostCard,
          .quickNavLink,
          .trendLink,
          .activityLink,
          .composerShortcut,
          .postAction {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
