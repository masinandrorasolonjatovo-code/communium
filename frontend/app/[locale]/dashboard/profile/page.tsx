'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  Archive,
  BadgeCheck,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronDown,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { localizeHref } from '@/components/locale-path';

type Visibility = 'Public' | 'Private' | 'ContactsOnly';
type ProfileTab = 'posts' | 'about' | 'experience' | 'education' | 'network' | 'media' | 'documents' | 'more';
type PostVisibility = 'public' | 'private' | 'network';
type PostType = 'text' | 'image' | 'photo' | 'video' | 'project' | 'article' | 'cv' | 'event';
type MediaCropKind = 'avatar' | 'cover';

interface MediaCropDraft {
  kind: MediaCropKind;
  file: File;
  url: string;
  zoom: number;
  x: number;
  y: number;
}

interface Interest {
  id: number;
  profileInterestId?: number;
  name: string;
  category?: string | null;
}

interface Experience {
  id: number;
  jobTitle?: string | null;
  company?: string | null;
  industry?: string | null;
  experienceType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string | null;
  location?: string | null;
  skillsUsed?: string[];
}

interface EducationItem {
  school?: string;
  degree?: string;
  years?: string;
  certificate?: string;
}

interface PrivacySettings {
  emailVisibility?: Visibility;
  phoneVisibility?: Visibility;
  cvVisibility?: Visibility;
  profileVisibility?: Visibility;
  professionalExperienceVisibility?: Visibility;
  interestsVisibility?: Visibility;
  photoVisibility?: Visibility;
  bannerVisibility?: Visibility;
  bioVisibility?: Visibility;
  allowSearchEngines?: boolean;
  allowNetworkingRequests?: boolean;
}

interface Profile {
  id: number;
  userId?: number;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  hometown?: string | null;
  profilePictureUrl?: string | null;
  profilePictureCrop?: Record<string, unknown> | null;
  bannerUrl?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  currentIndustry?: string | null;
  profession?: string | null;
  currentPosition?: string | null;
  establishment?: string | null;
  availability?: string | null;
  websiteUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  behanceUrl?: string | null;
  xUrl?: string | null;
  instagramUrl?: string | null;
  languages?: string[];
  education?: EducationItem[];
  primarySkills?: string[];
  membershipTier?: 'Free' | 'Silver' | 'Gold' | 'Platinum' | null;
  profileViewsCount?: number;
  connectionsCount?: number;
  cvDownloadCount?: number;
  cvUrl?: string | null;
  publicProfileUrl?: string | null;
  verificationStatus?: string | null;
  verificationBadgeLabel?: string | null;
  user?: {
    id?: number;
    username?: string | null;
    email?: string | null;
  } | null;
  professionalExperiences?: Experience[];
  interests?: Interest[];
  privacySettings?: PrivacySettings;
}

interface ProfilePost {
  id: number;
  type: PostType;
  body: string;
  visibility: PostVisibility;
  showOnProfile: boolean;
  pinned: boolean;
  attachments: Array<{ title?: string; detail?: string; url?: string; fileUrl?: string; fileName?: string; mimeType?: string; type?: string }>;
  stats: {
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ProfileComment {
  id: number;
  postId: number;
  body: string;
  author?: {
    fullName?: string | null;
    profilePictureUrl?: string | null;
  };
  createdAt?: string | null;
}

interface DocumentItem {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  visibility?: string;
}

interface ProfileMedia {
  photos: Array<Record<string, unknown>>;
  videos: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  cover?: string | null;
  avatar?: string | null;
}

interface ProfileSuggestion {
  id: number;
  userId: number;
  fullName?: string | null;
  city?: string | null;
  country?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  profilePictureUrl?: string | null;
  publicProfileUrl?: string | null;
  membershipTier?: string | null;
  verified?: boolean;
  connectionStatus?: string | null;
  canRequest?: boolean;
}

interface CommunityEvent {
  id: string | number;
  title?: string | null;
  subtitle?: string | null;
  meta?: string | null;
  joined?: boolean;
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  hometown: string;
  currentJobTitle: string;
  currentCompany: string;
  currentIndustry: string;
  profession: string;
  currentPosition: string;
  establishment: string;
  availability: string;
  websiteUrl: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  behanceUrl: string;
  xUrl: string;
  instagramUrl: string;
  languagesText: string;
  educationText: string;
  primarySkillsText: string;
  membershipTier: 'Free' | 'Silver' | 'Gold' | 'Platinum';
  publicProfileUrl: string;
}

interface ExperienceForm {
  id?: number;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location: string;
  industry: string;
  description: string;
  skillsUsed: string;
}

const emptyProfileForm: ProfileForm = {
  firstName: '',
  lastName: '',
  username: '',
  bio: '',
  email: '',
  phone: '',
  city: '',
  country: '',
  address: '',
  hometown: '',
  currentJobTitle: '',
  currentCompany: '',
  currentIndustry: '',
  profession: '',
  currentPosition: '',
  establishment: '',
  availability: 'Ouvert aux opportunites',
  websiteUrl: '',
  portfolioUrl: '',
  githubUrl: '',
  linkedinUrl: '',
  behanceUrl: '',
  xUrl: '',
  instagramUrl: '',
  languagesText: '',
  educationText: '',
  primarySkillsText: '',
  membershipTier: 'Free',
  publicProfileUrl: '',
};

const emptyExperience: ExperienceForm = {
  jobTitle: '',
  company: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  location: '',
  industry: '',
  description: '',
  skillsUsed: '',
};

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: 'posts', label: 'Publications' },
  { id: 'about', label: 'A propos' },
  { id: 'experience', label: 'Experiences' },
  { id: 'media', label: 'Medias' },
  { id: 'network', label: 'Reseau' },
  { id: 'documents', label: 'Documents' },
  { id: 'more', label: 'Activite' },
];

const postTypes: Array<{ value: PostType; label: string }> = [
  { value: 'text', label: 'Texte' },
  { value: 'image', label: 'Image' },
  { value: 'photo', label: 'Photo' },
  { value: 'video', label: 'Video' },
  { value: 'project', label: 'Projet' },
  { value: 'article', label: 'Article' },
  { value: 'event', label: 'Evenement' },
  { value: 'cv', label: 'CV' },
];

const postVisibilityOptions: Array<{ value: PostVisibility; label: string }> = [
  { value: 'public', label: 'Public' },
  { value: 'network', label: 'Reseau' },
  { value: 'private', label: 'Prive' },
];

const postFileAccept: Partial<Record<PostType, string>> = {
  image: 'image/*',
  photo: 'image/*',
  video: 'video/*',
  cv: '.pdf,.doc,.docx,image/*',
};

function isPostFileType(type: PostType) {
  return Boolean(postFileAccept[type]);
}

const apiBase = '/api/profile';

function splitList(value: string) {
  return value
    .split(/[,;\n]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEducation(value: string): EducationItem[] {
  return value
    .split(/\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [school = '', degree = '', years = '', certificate = ''] = line.split('|').map((item) => item.trim());
      return { school, degree, years, certificate };
    });
}

function educationToText(items?: EducationItem[]) {
  return (items || [])
    .map((item) => [item.school, item.degree, item.years, item.certificate].filter(Boolean).join(' | '))
    .join('\n');
}

function assetUrl(fileUrl?: string | null) {
  if (!fileUrl) {
    return '';
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function profileToForm(profile: Profile, fallbackName: string): ProfileForm {
  const fallbackParts = fallbackName.split(/\s+/u);

  return {
    firstName: profile.firstName || fallbackParts[0] || '',
    lastName: profile.lastName || fallbackParts.slice(1).join(' ') || '',
    username: profile.user?.username || profile.publicProfileUrl || '',
    bio: profile.bio || '',
    email: profile.email || profile.user?.email || '',
    phone: profile.phone || '',
    city: profile.city || '',
    country: profile.country || '',
    address: profile.address || '',
    hometown: profile.hometown || '',
    currentJobTitle: profile.currentJobTitle || '',
    currentCompany: profile.currentCompany || '',
    currentIndustry: profile.currentIndustry || '',
    profession: profile.profession || '',
    currentPosition: profile.currentPosition || '',
    establishment: profile.establishment || '',
    availability: profile.availability || 'Ouvert aux opportunites',
    websiteUrl: profile.websiteUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
    githubUrl: profile.githubUrl || '',
    linkedinUrl: profile.linkedinUrl || '',
    behanceUrl: profile.behanceUrl || '',
    xUrl: profile.xUrl || '',
    instagramUrl: profile.instagramUrl || '',
    languagesText: (profile.languages || []).join(', '),
    educationText: educationToText(profile.education),
    primarySkillsText: (profile.primarySkills || []).join(', '),
    membershipTier: profile.membershipTier || 'Free',
    publicProfileUrl: profile.publicProfileUrl || profile.user?.username || '',
  };
}

function buildProfilePayload(form: ProfileForm) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    username: form.username.trim(),
    bio: form.bio.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    city: form.city.trim(),
    country: form.country.trim(),
    address: form.address.trim(),
    hometown: form.hometown.trim(),
    currentJobTitle: form.currentJobTitle.trim(),
    currentCompany: form.currentCompany.trim(),
    currentIndustry: form.currentIndustry.trim(),
    profession: form.profession.trim(),
    currentPosition: form.currentPosition.trim(),
    establishment: form.establishment.trim(),
    availability: form.availability.trim(),
    websiteUrl: form.websiteUrl.trim(),
    portfolioUrl: form.portfolioUrl.trim(),
    githubUrl: form.githubUrl.trim(),
    linkedinUrl: form.linkedinUrl.trim(),
    behanceUrl: form.behanceUrl.trim(),
    xUrl: form.xUrl.trim(),
    instagramUrl: form.instagramUrl.trim(),
    languages: splitList(form.languagesText),
    education: parseEducation(form.educationText),
    primarySkills: splitList(form.primarySkillsText),
    membershipTier: form.membershipTier,
    publicProfileUrl: form.publicProfileUrl.trim() || form.username.trim(),
  };
}

async function parseBody<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    throw new Error(friendlyApiError(body?.error, response.status));
  }

  return body as T;
}

function friendlyApiError(error: unknown, status?: number) {
  const message = typeof error === 'string' ? error : '';

  if (status && status >= 500) {
    return 'Le profil est momentanement indisponible. Reessayez dans un instant.';
  }

  if (!message || /Erreur serveur|Prisma|SQL|database|module profil/i.test(message)) {
    return 'Action indisponible pour le moment.';
  }

  return message;
}

function friendlyClientError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';

  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Connexion au serveur impossible. Verifiez que Communium est bien lance puis reessayez.';
  }

  return message || fallback;
}

function visibilityLabel(value?: Visibility | string | null) {
  if (value === 'Private') {
    return 'Prive';
  }

  if (value === 'ContactsOnly') {
    return 'Reseau uniquement';
  }

  return 'Public';
}

function postVisibilityLabel(value?: PostVisibility | string | null) {
  if (value === 'private') {
    return 'Prive';
  }

  if (value === 'network') {
    return 'Reseau';
  }

  return 'Public';
}

function postTypeLabel(value?: PostType | string | null) {
  return postTypes.find((item) => item.value === value)?.label || 'Texte';
}

function postAttachmentUrl(attachment?: ProfilePost['attachments'][number]) {
  return attachment?.fileUrl || attachment?.url || '';
}

function postAttachmentKind(attachment?: ProfilePost['attachments'][number]) {
  const source = `${attachment?.mimeType || ''} ${attachment?.type || ''} ${postAttachmentUrl(attachment)}`.toLowerCase();

  if (source.includes('video') || /\.(mp4|webm|ogg|mov)$/i.test(source)) {
    return 'video';
  }

  if (source.includes('image') || /\.(png|jpe?g|gif|webp|avif)$/i.test(source)) {
    return 'image';
  }

  return postAttachmentUrl(attachment) ? 'file' : 'note';
}

function clampNumber(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image illisible'));
    };
    image.src = objectUrl;
  });
}

async function createCroppedImageFile(draft: MediaCropDraft) {
  const image = await loadImageFromFile(draft.file);
  const aspect = draft.kind === 'avatar' ? 1 : 16 / 5;
  const outputWidth = draft.kind === 'avatar' ? 512 : 1600;
  const outputHeight = draft.kind === 'avatar' ? 512 : 500;
  const imageAspect = image.naturalWidth / image.naturalHeight;
  const baseCropWidth = imageAspect > aspect ? image.naturalHeight * aspect : image.naturalWidth;
  const baseCropHeight = imageAspect > aspect ? image.naturalHeight : image.naturalWidth / aspect;
  const zoom = clampNumber(draft.zoom, 1, 3);
  const cropWidth = baseCropWidth / zoom;
  const cropHeight = baseCropHeight / zoom;
  const centerX = (clampNumber(draft.x, 0, 100) / 100) * image.naturalWidth;
  const centerY = (clampNumber(draft.y, 0, 100) / 100) * image.naturalHeight;
  const sx = clampNumber(centerX - cropWidth / 2, 0, image.naturalWidth - cropWidth);
  const sy = clampNumber(centerY - cropHeight / 2, 0, image.naturalHeight - cropHeight);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Recadrage indisponible');
  }

  context.drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value);
      } else {
        reject(new Error('Image recadree indisponible'));
      }
    }, 'image/jpeg', 0.92);
  });

  const suffix = draft.kind === 'avatar' ? 'profil' : 'couverture';
  return new File([blob], `${suffix}-${Date.now()}.jpg`, { type: 'image/jpeg' });
}

export default function ProfessionalProfilePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || 'fr';
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const postFileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm);
  const [privacy, setPrivacy] = useState<PrivacySettings>({});
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [media, setMedia] = useState<ProfileMedia>({ photos: [], videos: [], projects: [] });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 512 });
  const [mediaCropDraft, setMediaCropDraft] = useState<MediaCropDraft | null>(null);
  const [coverDraftFile, setCoverDraftFile] = useState<File | null>(null);
  const [coverDraftUrl, setCoverDraftUrl] = useState('');
  const [postDraft, setPostDraft] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [postVisibility, setPostVisibility] = useState<PostVisibility>('public');
  const [postOnProfile, setPostOnProfile] = useState(true);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postFilePreview, setPostFilePreview] = useState('');
  const [pendingPostFileType, setPendingPostFileType] = useState<PostType | null>(null);
  const [openPostComments, setOpenPostComments] = useState<Record<number, boolean>>({});
  const [postComments, setPostComments] = useState<Record<number, ProfileComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [experienceForm, setExperienceForm] = useState<ExperienceForm>(emptyExperience);
  const [interestInput, setInterestInput] = useState('');

  const ownerName = user?.fullName || user?.username || 'Membre Communium';
  const displayName = [form.firstName, form.lastName].filter(Boolean).join(' ').trim() || profile?.fullName || ownerName;
  const headline = [form.currentJobTitle || form.profession, form.currentCompany].filter(Boolean).join(' - ');
  const organizationLine = form.currentCompany || form.establishment || '';
  const location = [form.city, form.country].filter(Boolean).join(', ');
  const username = form.username || profile?.user?.username || '';
  const publicPath = username ? localizeHref(locale, `/u/${username}`) : '';
  const privacyHref = localizeHref(locale, '/settings/privacy');
  const completionHref = localizeHref(locale, '/settings/profile-completion');
  const dashboardHref = localizeHref(locale, '/dashboard');
  const savedHref = localizeHref(locale, '/saved');
  const avatarSrc = assetUrl(profile?.profilePictureUrl);
  const coverSrc = assetUrl(profile?.bannerUrl);
  const skills = splitList(form.primarySkillsText);
  const languages = splitList(form.languagesText);
  const educationItems = parseEducation(form.educationText);
  const profileNeedsWork = !form.firstName || !form.lastName || !headline || !location || !avatarSrc;
  const completionItems = [displayName, headline, location, form.bio, avatarSrc, coverSrc, skills.length, educationItems.length];
  const completionPercent = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );
  const shortBio =
    form.bio ||
    'Ajoutez une courte bio pour donner du contexte a votre parcours, vos projets et vos collaborations.';
  const displayHeadline = headline || [form.profession, form.establishment].filter(Boolean).join(' - ') || 'Membre Communium';
  const displayLocation = location || 'Localisation a completer';
  const availabilityLine = form.availability || 'Disponible pour echanger';
  const categoryLine = form.profession || form.currentJobTitle || form.currentIndustry || 'Membre Communium';
  const connectionCount = Number(profile?.connectionsCount || 0);
  const profileViewsCount = Number(profile?.profileViewsCount || 0);
  const identityStats = [
    { label: 'connexions', value: connectionCount },
    { label: 'vues profil', value: profileViewsCount },
    { label: 'publications', value: posts.length },
  ];
  const postAnalytics = [
    { label: 'Publications', value: String(posts.length) },
    { label: 'Reactions', value: String(posts.reduce((total, post) => total + Number(post.stats?.likes || 0), 0)) },
    { label: 'Commentaires', value: String(posts.reduce((total, post) => total + Number(post.stats?.comments || 0), 0)) },
  ];
  const publicUrl =
    typeof window !== 'undefined' && publicPath ? `${window.location.origin}${publicPath}` : publicPath;

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

  async function apiFetch<T>(path: string, init: RequestInit = {}) {
    const headers = await authHeaders(!(init.body instanceof FormData));
    const requestHeaders = new Headers(init.headers || {});

    headers.forEach((value, key) => {
      if (!requestHeaders.has(key)) {
        requestHeaders.set(key, value);
      }
    });

    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: requestHeaders,
      cache: 'no-store',
    });

    return parseBody<T>(response);
  }

  async function appFetch<T>(path: string, init: RequestInit = {}) {
    const headers = await authHeaders(!(init.body instanceof FormData));
    const requestHeaders = new Headers(init.headers || {});

    headers.forEach((value, key) => {
      if (!requestHeaders.has(key)) {
        requestHeaders.set(key, value);
      }
    });

    const response = await fetch(path, {
      ...init,
      headers: requestHeaders,
      cache: 'no-store',
    });

    return parseBody<T>(response);
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const profileBody = await apiFetch<{ data: Profile }>('/me');
      const [postsBody, mediaBody, documentsBody, suggestionsBody, eventsBody] = await Promise.all([
        apiFetch<{ data: ProfilePost[] }>('/posts').catch(() => ({ data: [] })),
        apiFetch<{ data: ProfileMedia }>('/media').catch(() => ({ data: { photos: [], videos: [], projects: [], cover: null, avatar: null } })),
        apiFetch<{ data: DocumentItem[] }>('/documents').catch(() => ({ data: [] })),
        appFetch<{ data: ProfileSuggestion[] }>('/api/profiles/suggestions').catch(() => ({ data: [] })),
        appFetch<{ data: CommunityEvent[] }>('/api/events').catch(() => ({ data: [] })),
      ]);

      setProfile(profileBody.data);
      setForm(profileToForm(profileBody.data, ownerName));
      setPrivacy(profileBody.data.privacySettings || {});
      setPosts(postsBody.data || []);
      setMedia(mediaBody.data || { photos: [], videos: [], projects: [] });
      setDocuments(documentsBody.data || []);
      setSuggestions(suggestionsBody.data || []);
      setEvents(eventsBody.data || []);
    } catch (error) {
      setNotice(friendlyClientError(error, 'Profil indisponible'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  useEffect(() => {
    return () => {
      if (coverDraftUrl) {
        URL.revokeObjectURL(coverDraftUrl);
      }
    };
  }, [coverDraftUrl]);

  useEffect(() => {
    return () => {
      if (mediaCropDraft?.url) {
        URL.revokeObjectURL(mediaCropDraft.url);
      }
    };
  }, [mediaCropDraft?.url]);

  useEffect(() => {
    if (!postFile || !postFile.type.startsWith('image/')) {
      setPostFilePreview('');
      return;
    }

    const previewUrl = URL.createObjectURL(postFile);
    setPostFilePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [postFile]);

  useEffect(() => {
    if (!pendingPostFileType) {
      return;
    }

    const timer = window.setTimeout(() => {
      const input = postFileInputRef.current;
      if (input) {
        input.accept = postFileAccept[pendingPostFileType] || 'image/*,video/*,.pdf,.doc,.docx';
        input.value = '';
        input.click();
      }
      setPendingPostFileType(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pendingPostFileType]);

  async function saveProfile(event?: FormEvent) {
    event?.preventDefault();
    setSaving(true);
    try {
      const body = await apiFetch<{ data: Profile }>('/', {
        method: 'PATCH',
        body: JSON.stringify(buildProfilePayload(form)),
      });
      setProfile(body.data);
      setForm(profileToForm(body.data, ownerName));
      setPrivacy(body.data.privacySettings || {});
      setNotice('Profil enregistre');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Enregistrement impossible'));
    } finally {
      setSaving(false);
    }
  }

  async function updatePrivacy(patch: Partial<PrivacySettings>) {
    try {
      const body = await apiFetch<{ data: Profile }>('/privacy', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setProfile(body.data);
      setPrivacy(body.data.privacySettings || {});
      setNotice('Confidentialite mise a jour');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Confidentialite indisponible'));
    }
  }

  function openCoverPicker() {
    coverInputRef.current?.click();
  }

  function openAvatarPicker() {
    setAvatarMenuOpen(false);
    avatarInputRef.current?.click();
  }

  function openMediaCropDraft(kind: MediaCropKind, file?: File | null) {
    if (!file) {
      return;
    }

    setMediaCropDraft((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }

      return {
        kind,
        file,
        url: URL.createObjectURL(file),
        zoom: 1,
        x: 50,
        y: 50,
      };
    });
  }

  function closeMediaCropDraft() {
    setMediaCropDraft((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }

  async function saveMediaCropDraft() {
    if (!mediaCropDraft) {
      return;
    }

    try {
      const croppedFile = await createCroppedImageFile(mediaCropDraft);
      const uploaded = await uploadProfileFile(
        mediaCropDraft.kind === 'avatar' ? '/avatar' : '/cover',
        mediaCropDraft.kind === 'avatar' ? 'profilePicture' : 'bannerImage',
        croppedFile,
        mediaCropDraft.kind === 'avatar' ? 'Photo mise a jour' : 'Couverture mise a jour',
      );

      if (uploaded) {
        closeMediaCropDraft();
      }
    } catch (error) {
      setNotice(friendlyClientError(error, 'Recadrage impossible'));
    }
  }

  function handleCoverSelected(file?: File) {
    openMediaCropDraft('cover', file);
  }

  function closeCoverDraft() {
    if (coverDraftUrl) {
      URL.revokeObjectURL(coverDraftUrl);
    }

    setCoverDraftFile(null);
    setCoverDraftUrl('');
  }

  async function saveCoverDraft() {
    if (!coverDraftFile) {
      return;
    }

    try {
      const uploaded = await uploadProfileFile('/cover', 'bannerImage', coverDraftFile, 'Couverture mise a jour');
      if (uploaded) {
        closeCoverDraft();
      }
    } catch (error) {
      setNotice(friendlyClientError(error, 'Couverture indisponible'));
    }
  }

  async function uploadProfileFile(endpoint: string, fieldName: string, file?: File, successMessage = 'Fichier mis a jour') {
    if (!file) {
      return false;
    }

    const formData = new FormData();
    formData.append(fieldName, file);

    try {
      const body = await apiFetch<{ data: Profile }>(endpoint, {
        method: 'POST',
        body: formData,
      });
      setProfile(body.data);
      setForm(profileToForm(body.data, ownerName));
      setNotice(successMessage);
      await refreshAssets();
      return true;
    } catch (error) {
      setNotice(friendlyClientError(error, 'Upload impossible'));
      return false;
    }
  }

  async function refreshAssets() {
    const [mediaBody, documentsBody] = await Promise.all([
      apiFetch<{ data: ProfileMedia }>('/media').catch(() => ({ data: media })),
      apiFetch<{ data: DocumentItem[] }>('/documents').catch(() => ({ data: documents })),
    ]);
    setMedia(mediaBody.data);
    setDocuments(documentsBody.data);
  }

  async function deleteAsset(kind: 'avatar' | 'cover' | 'cv') {
    try {
      const endpoint = kind === 'cover' ? '/cover' : kind === 'cv' ? '/cv' : '/avatar';
      await apiFetch(endpoint, { method: 'DELETE' });
      await loadProfile();
      setNotice('Element supprime');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Suppression impossible'));
    }
  }

  async function saveCrop() {
    try {
      const body = await apiFetch<{ data: Profile }>('/avatar/crop', {
        method: 'PUT',
        body: JSON.stringify({
          crop: {
            x: crop.x,
            y: crop.y,
            width: crop.size,
            height: crop.size,
            outputWidth: 512,
            outputHeight: 512,
          },
        }),
      });
      setProfile(body.data);
      setCropOpen(false);
      setNotice('Recadrage enregistre');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Recadrage impossible'));
    }
  }

  function resetPostComposer() {
    setEditingPostId(null);
    setPostDraft('');
    setPostType('text');
    setPostVisibility('public');
    setPostOnProfile(true);
    setPostFile(null);
    setPostFilePreview('');
    setPendingPostFileType(null);
    if (postFileInputRef.current) {
      postFileInputRef.current.value = '';
    }
  }

  function selectPostType(type: PostType) {
    setPostType(type);
    if (isPostFileType(type)) {
      const input = postFileInputRef.current;
      if (input) {
        input.accept = postFileAccept[type] || 'image/*,video/*,.pdf,.doc,.docx';
        input.value = '';
        input.click();
        return;
      }
      setPendingPostFileType(type);
      return;
    }

    if (!editingPostId) {
      setPostFile(null);
      setPostFilePreview('');
    }
  }

  function handlePostFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setPostFile(file);

    if (!file) {
      return;
    }

    if (file.type.startsWith('image/')) {
      setPostType('image');
    } else if (file.type.startsWith('video/')) {
      setPostType('video');
    } else {
      setPostType('cv');
    }
  }

  async function submitPost() {
    const draftText = postDraft.trim();

    if (!draftText && !postFile) {
      setNotice('Ajoutez un texte, une photo, une video ou un document avant de publier.');
      return;
    }

    try {
      const wasEditing = Boolean(editingPostId);
      const bodyText = draftText || (postFile ? `${postTypeLabel(postType)} - ${postFile.name}` : '');
      const payload = {
        body: bodyText,
        type: postType,
        visibility: postVisibility,
        showOnProfile: postOnProfile,
      };
      const body = editingPostId && !postFile
        ? await apiFetch<{ data: ProfilePost }>(`/posts/${editingPostId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await (async () => {
            const formData = new FormData();
            formData.set('body', bodyText);
            formData.set('type', postType);
            formData.set('visibility', postVisibility);
            formData.set('showOnProfile', postOnProfile ? 'true' : 'false');
            if (postFile) {
              formData.set('file', postFile);
            }

            return parseBody<{ data: ProfilePost }>(
              await fetch('/api/posts', {
                method: 'POST',
                headers: await authHeaders(false),
                body: formData,
                cache: 'no-store',
              }),
            );
          })();

      setPosts((current) =>
        editingPostId ? current.map((post) => (post.id === editingPostId ? body.data : post)) : [body.data, ...current],
      );
      resetPostComposer();
      void loadProfile();
      setNotice(wasEditing ? 'Publication mise a jour' : 'Publication publiee');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Publication impossible'));
    }
  }

  function editPost(post: ProfilePost) {
    setEditingPostId(post.id);
    setPostDraft(post.body);
    setPostType(post.type);
    setPostVisibility(post.visibility);
    setPostOnProfile(post.showOnProfile);
    setPostFile(null);
    setPostFilePreview('');
    setTab('posts');
  }

  async function patchPost(post: ProfilePost, patch: Partial<ProfilePost>) {
    try {
      const body = await apiFetch<{ data: ProfilePost }>(`/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...post, ...patch }),
      });
      setPosts((current) => current.map((item) => (item.id === post.id ? body.data : item)));
    } catch (error) {
      setNotice(friendlyClientError(error, 'Action publication impossible'));
    }
  }

  async function deletePost(post: ProfilePost) {
    try {
      await apiFetch(`/posts/${post.id}`, { method: 'DELETE' });
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setNotice('Publication supprimee');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Suppression impossible'));
    }
  }

  async function saveExperience(event: FormEvent) {
    event.preventDefault();
    if (!experienceForm.jobTitle || !experienceForm.company || !experienceForm.startDate) {
      setNotice('Poste, entreprise et date de debut sont requis');
      return;
    }

    const payload = {
      ...experienceForm,
      skillsUsed: splitList(experienceForm.skillsUsed),
    };
    const endpoint = experienceForm.id ? `/experiences/${experienceForm.id}` : '/experiences';
    const method = experienceForm.id ? 'PUT' : 'POST';

    try {
      const body = await apiFetch<{ data: Profile }>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      setProfile(body.data);
      setExperienceForm(emptyExperience);
      setNotice('Experience enregistree');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Experience impossible'));
    }
  }

  async function removeExperience(id: number) {
    try {
      const body = await apiFetch<{ data: Profile }>(`/experiences/${id}`, { method: 'DELETE' });
      setProfile(body.data);
      setNotice('Experience supprimee');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Suppression impossible'));
    }
  }

  async function addInterest() {
    if (!interestInput.trim()) {
      return;
    }

    try {
      const body = await apiFetch<{ data: Profile }>('/interests', {
        method: 'POST',
        body: JSON.stringify({ name: interestInput.trim() }),
      });
      setProfile(body.data);
      setInterestInput('');
      setNotice('Competence ajoutee');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Competence impossible'));
    }
  }

  async function removeInterest(interest: Interest) {
    const id = interest.profileInterestId || interest.id;
    try {
      const body = await apiFetch<{ data: Profile }>(`/interests/${id}`, { method: 'DELETE' });
      setProfile(body.data);
      setNotice('Competence retiree');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Suppression impossible'));
    }
  }

  async function shareProfile() {
    if (!publicUrl) {
      setNotice('URL publique indisponible');
      return;
    }

    await navigator.clipboard.writeText(publicUrl).catch(() => undefined);
    setNotice('Lien du profil copie');
  }

  async function requestConnection(suggestion: ProfileSuggestion) {
    if (!suggestion.userId) {
      return;
    }

    if (suggestion.connectionStatus === 'pending') {
      setSuggestions((current) =>
        current.map((item) =>
          item.userId === suggestion.userId ? { ...item, connectionStatus: null, canRequest: true } : item,
        ),
      );

      try {
        await appFetch(`/api/connections/${suggestion.userId}`, {
          method: 'DELETE',
        });
        setNotice('Demande annulee');
      } catch (error) {
        setSuggestions((current) =>
          current.map((item) =>
            item.userId === suggestion.userId ? { ...item, connectionStatus: 'pending', canRequest: false } : item,
          ),
        );
        setNotice(friendlyClientError(error, 'Annulation indisponible'));
      }
      return;
    }

    try {
      await appFetch('/api/connections/request', {
        method: 'POST',
        body: JSON.stringify({ userId: suggestion.userId }),
      });
      setSuggestions((current) =>
        current.map((item) =>
          item.userId === suggestion.userId ? { ...item, connectionStatus: 'pending', canRequest: false } : item,
        ),
      );
      setNotice('Invitation envoyee');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Invitation indisponible'));
    }
  }

  async function joinEvent(eventId: CommunityEvent['id']) {
    try {
      await appFetch(`/api/events/${eventId}/join`, { method: 'POST' });
      setEvents((current) => current.map((event) => (event.id === eventId ? { ...event, joined: true } : event)));
      setNotice('Participation confirmee');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Inscription indisponible'));
    }
  }

  async function interactWithPost(post: ProfilePost, action: 'like' | 'save' | 'share') {
    try {
      const body = await appFetch<{ stats?: ProfilePost['stats']; liked?: boolean; saved?: boolean }>(`/api/posts/${post.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(action === 'share' ? { target: 'profile' } : {}),
      });
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, stats: body.stats || item.stats } : item,
        ),
      );
      setNotice(action === 'like' ? 'Reaction enregistree' : action === 'save' ? 'Publication enregistree' : 'Lien partage');
    } catch (error) {
      setNotice(friendlyClientError(error, 'Action indisponible'));
    }
  }

  async function togglePostComments(post: ProfilePost) {
    const willOpen = !openPostComments[post.id];
    setOpenPostComments((current) => ({ ...current, [post.id]: willOpen }));
    if (!willOpen || postComments[post.id]) {
      return;
    }

    try {
      const body = await appFetch<{ data: ProfileComment[] }>(`/api/posts/${post.id}/comments`);
      setPostComments((current) => ({ ...current, [post.id]: body.data || [] }));
    } catch (error) {
      setNotice(friendlyClientError(error, 'Commentaires indisponibles'));
    }
  }

  async function submitProfileComment(post: ProfilePost) {
    const bodyText = (commentDrafts[post.id] || '').trim();
    if (!bodyText) {
      return;
    }

    try {
      const body = await appFetch<{ data: ProfileComment }>(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: bodyText }),
      });
      setPostComments((current) => ({ ...current, [post.id]: [...(current[post.id] || []), body.data] }));
      setCommentDrafts((current) => ({ ...current, [post.id]: '' }));
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, stats: { ...item.stats, comments: Number(item.stats?.comments || 0) + 1 } }
            : item,
        ),
      );
    } catch (error) {
      setNotice(friendlyClientError(error, 'Commentaire impossible'));
    }
  }

  function startEditExperience(experience: Experience) {
    setExperienceForm({
      id: experience.id,
      jobTitle: experience.jobTitle || '',
      company: experience.company || '',
      startDate: experience.startDate || '',
      endDate: experience.endDate || '',
      isCurrent: Boolean(experience.isCurrent),
      location: experience.location || '',
      industry: experience.industry || '',
      description: experience.description || '',
      skillsUsed: (experience.skillsUsed || []).join(', '),
    });
    setTab('experience');
  }

  function field<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  if (!isLoaded || !user) {
    return (
      <main className="profilePage">
        <section className="authPanel">
          <h1>Profil Communium</h1>
          <p>Connectez-vous pour gerer votre identite professionnelle.</p>
          <Link href={localizeHref(locale, '/auth/sign-in')} className="primaryButton">
            Se connecter
          </Link>
        </section>
        <ProfileStyles />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="profilePage">
        <section className="authPanel">
          <h1>Chargement du profil</h1>
          <p>Preparation de votre espace professionnel.</p>
        </section>
        <ProfileStyles />
      </main>
    );
  }

  return (
    <main className="profilePage">
      {notice ? (
        <div className="profileNotice">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section className="profileHero">
        <div
          className="cover"
          style={
            coverSrc
              ? {
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.2)), url(${coverSrc})`,
                }
              : undefined
          }
        >
          <div className="coverActions">
            <button type="button" className="coverAction" onClick={openCoverPicker}>
              <Camera size={15} />
              <span>{coverSrc ? 'Changer la couverture' : 'Ajouter une couverture'}</span>
            </button>
            {coverSrc ? (
              <button type="button" className="coverAction subtle" onClick={() => deleteAsset('cover')}>
                <Trash2 size={15} />
                <span>Supprimer</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="heroBody">
          <div className="avatarWrap">
            <button type="button" className="avatarButton" onClick={() => setAvatarMenuOpen((open) => !open)}>
              {avatarSrc ? <img src={avatarSrc} alt={displayName} /> : <span>{initials(displayName) || 'CM'}</span>}
              <span className="avatarEdit">
                <Camera size={16} />
              </span>
            </button>
            {avatarMenuOpen ? (
              <div className="avatarMenu">
                <button type="button" onClick={() => window.open(avatarSrc || '', '_blank')} disabled={!avatarSrc}>
                  Voir la photo
                </button>
                <button type="button" onClick={openAvatarPicker}>
                  Changer la photo
                </button>
                <button type="button" onClick={() => setCropOpen(true)} disabled={!avatarSrc}>
                  Recadrer
                </button>
                <button type="button" onClick={() => deleteAsset('avatar')} disabled={!avatarSrc}>
                  Supprimer
                </button>
              </div>
            ) : null}
          </div>

          <div className="identityBlock">
            <div className="identityTop">
              <div>
                <h1>{displayName}</h1>
                <p className="profileHeroBio">{shortBio}</p>
                <div className="identityStats" aria-label="Statistiques du profil">
                  {identityStats.map((item) => (
                    <span key={item.label}>
                      <strong>{item.value}</strong>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="badgeRow refined">
                {profile?.verificationBadgeLabel || profile?.verificationStatus === 'VERIFIED' ? (
                  <span className="statusBadge">
                    <BadgeCheck size={15} />
                    Verifie
                  </span>
                ) : null}
                {form.membershipTier && form.membershipTier !== 'Free' ? <span className="statusBadge premium">{form.membershipTier}</span> : null}
              </div>
            </div>

            <div className="profileEssentials">
              <span>
                <BriefcaseBusiness size={15} />
                {categoryLine}
              </span>
              <span>{displayHeadline}{organizationLine && !displayHeadline.includes(organizationLine) ? ` - ${organizationLine}` : ''}</span>
              <span>
                <MapPin size={15} />
                {displayLocation}
              </span>
              <span>{availabilityLine}</span>
              <span>{username ? `@${username}` : 'Identifiant public a definir'}</span>
            </div>

            <div className="linkLine">
              {form.websiteUrl ? <a href={form.websiteUrl}>Site web</a> : null}
              {form.portfolioUrl ? <a href={form.portfolioUrl}>Portfolio</a> : null}
              {form.githubUrl ? <a href={form.githubUrl}>GitHub</a> : null}
              {form.linkedinUrl ? <a href={form.linkedinUrl}>LinkedIn</a> : null}
            </div>

            <div className="actionRow">
              <button type="button" className="primaryButton" onClick={() => setTab('about')}>
                <Edit3 size={16} />
                Modifier
              </button>
              <button type="button" className="ghostButton" onClick={shareProfile}>
                <Share2 size={16} />
                Partager
              </button>
              <Link href={dashboardHref} className="ghostButton">
                <Settings size={16} />
                Tableau de bord
              </Link>
              <Link href={savedHref} className="ghostButton">
                <Bookmark size={16} />
                Enregistrements
              </Link>
              <div className="moreMenuWrap">
                <button type="button" className="ghostButton iconButton" onClick={() => setMoreMenuOpen((open) => !open)} aria-label="Plus d'actions">
                  <MoreHorizontal size={18} />
                </button>
                {moreMenuOpen ? (
                  <div className="moreMenu">
                    {publicPath ? <Link href={publicPath} target="_blank"><Eye size={15} />Apercu public</Link> : null}
                    <Link href={savedHref}><Bookmark size={15} />Enregistrements</Link>
                    <Link href={privacyHref}><Shield size={15} />Confidentialite</Link>
                    <button type="button" onClick={shareProfile}><Copy size={15} />Copier le lien</button>
                    <button type="button" onClick={() => profile?.cvUrl ? window.open(assetUrl(profile.cvUrl), '_blank') : cvInputRef.current?.click()}><Upload size={15} />{profile?.cvUrl ? 'Ouvrir le CV' : 'Ajouter un CV'}</button>
                    <Link href={completionHref}><Sparkles size={15} />Optimiser</Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <nav className="profileTabs" aria-label="Navigation du profil">
          {tabs.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </section>

      <div className="profileLayout">
        <aside className="leftRail">
          <InfoCard title="Intro" onEdit={() => setTab('about')}>
            <div className="completionBlock">
              <div>
                <strong>{completionPercent}%</strong>
                <span>Profil complete</span>
              </div>
              <span className="completionTrack"><span style={{ width: `${completionPercent}%` }} /></span>
            </div>
            <InfoRow label="Categorie" value={categoryLine} />
            <InfoRow label="Localisation" value={location || form.country} />
            <InfoRow label="Disponibilite" value={form.availability} />
          </InfoCard>

          <InfoCard title="Formation" onEdit={() => setTab('education')}>
            {educationItems.length ? (
              educationItems.slice(0, 3).map((item) => (
                <MiniEntry key={`${item.school}-${item.degree}`} title={item.school || 'Formation'} detail={[item.degree, item.years].filter(Boolean).join(' - ')} />
              ))
            ) : (
              <p className="muted">Ajoutez votre parcours pour renforcer la confiance.</p>
            )}
          </InfoCard>

          <InfoCard title="Competences" onEdit={() => setTab('about')}>
            <TagCloud items={[...skills, ...(profile?.interests || []).map((item) => item.name)].slice(0, 14)} empty="Ajoutez vos domaines forts." />
          </InfoCard>

          <InfoCard title="Coordonnees" onEdit={() => setTab('about')}>
            <SocialLink label="GitHub" href={form.githubUrl} />
            <SocialLink label="LinkedIn" href={form.linkedinUrl} />
            <SocialLink label="Portfolio" href={form.portfolioUrl} />
            <SocialLink label="Instagram pro" href={form.instagramUrl} />
            <TagCloud items={languages.slice(0, 4)} empty="Ajoutez vos langues." />
          </InfoCard>

          <InfoCard title="Highlights">
            <div className="highlightGrid">
              <span>{posts.length} publications</span>
              <span>{documents.length || (profile?.cvUrl ? 1 : 0)} documents</span>
              <span>{media.photos.length + media.videos.length + media.projects.length} medias</span>
            </div>
          </InfoCard>
        </aside>

        <section className="mainColumn">
          {tab === 'posts' ? renderPosts() : null}
          {tab === 'about' ? renderAbout() : null}
          {tab === 'experience' ? renderExperience() : null}
          {tab === 'education' ? renderEducation() : null}
          {tab === 'network' ? renderNetwork() : null}
          {tab === 'media' ? renderMedia() : null}
          {tab === 'documents' ? renderDocuments() : null}
          {tab === 'more' ? renderMore() : null}
        </section>

        <aside className="rightRail">
          <InfoCard title="Activite">
            <div className="metricInline">
              {postAnalytics.map((item) => (
                <Metric key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
            <Link href={privacyHref} className="fullGhost compactAction">
              Confidentialite
            </Link>
          </InfoCard>

          <InfoCard title="Suggestions">
            {suggestions.slice(0, 3).length ? (
              suggestions.slice(0, 3).map((suggestion) => (
                <article key={suggestion.userId} className="suggestionItem">
                  <span className="miniAvatar soft">{initials(suggestion.fullName || 'CM')}</span>
                  <div>
                    <strong>{suggestion.fullName || 'Profil Communium'}</strong>
                    <small>{[suggestion.currentJobTitle, suggestion.currentCompany].filter(Boolean).join(' - ') || [suggestion.city, suggestion.country].filter(Boolean).join(', ')}</small>
                    <div className="suggestionActions">
                      {suggestion.publicProfileUrl ? <Link href={localizeHref(locale, `/u/${suggestion.publicProfileUrl}`)}>Voir</Link> : null}
                      {suggestion.canRequest || suggestion.connectionStatus === 'pending' ? <button type="button" onClick={() => requestConnection(suggestion)}>{suggestion.connectionStatus === 'pending' ? 'Demande' : 'Ajouter'}</button> : <span>{suggestion.connectionStatus || 'Actif'}</span>}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">Les profils pertinents apparaitront ici.</p>
            )}
          </InfoCard>

          <InfoCard title="Evenements">
            {events.slice(0, 2).length ? (
              events.slice(0, 2).map((event) => (
                <article key={event.id} className="eventItem">
                  <strong>{event.title || 'Evenement Communium'}</strong>
                  <small>{event.subtitle || event.meta || 'Programme professionnel'}</small>
                  <button type="button" onClick={() => joinEvent(event.id)} disabled={Boolean(event.joined)}>
                    {event.joined ? 'Inscrit' : 'Participer'}
                  </button>
                </article>
              ))
            ) : (
              <p className="muted">Aucun evenement recommande pour le moment.</p>
            )}
          </InfoCard>

          <InfoCard title="Premium">
            <p className="muted">Boost discret, statistiques avancees et meilleure visibilite.</p>
            <Link href={localizeHref(locale, '/premium')} className="fullGhost compactAction">
              Decouvrir
            </Link>
          </InfoCard>
        </aside>
      </div>

      <input ref={avatarInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { openMediaCropDraft('avatar', event.target.files?.[0]); event.currentTarget.value = ''; }} />
      <input ref={coverInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { handleCoverSelected(event.target.files?.[0]); event.currentTarget.value = ''; }} />
      <input ref={cvInputRef} hidden type="file" accept="application/pdf" onChange={(event) => { uploadProfileFile('/cv', 'cv', event.target.files?.[0], 'Document ajoute'); event.currentTarget.value = ''; }} />

      {mediaCropDraft ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="mediaCropModal">
            <header>
              <strong>{mediaCropDraft.kind === 'avatar' ? 'Recadrer la photo de profil' : 'Recadrer la couverture'}</strong>
              <button type="button" onClick={closeMediaCropDraft} aria-label="Fermer">
                <X size={16} />
              </button>
            </header>
            <div
              className={mediaCropDraft.kind === 'avatar' ? 'mediaCropPreview avatarCropPreview' : 'mediaCropPreview coverCropPreview'}
              style={{
                backgroundImage: `url(${mediaCropDraft.url})`,
                backgroundPosition: `${mediaCropDraft.x}% ${mediaCropDraft.y}%`,
                backgroundSize: `${mediaCropDraft.zoom * 100}% auto`,
              }}
            />
            <label>
              Zoom
              <input type="range" min="1" max="3" step="0.05" value={mediaCropDraft.zoom} onChange={(event) => setMediaCropDraft((current) => current ? { ...current, zoom: Number(event.target.value) } : current)} />
            </label>
            <label>
              Horizontal
              <input type="range" min="0" max="100" value={mediaCropDraft.x} onChange={(event) => setMediaCropDraft((current) => current ? { ...current, x: Number(event.target.value) } : current)} />
            </label>
            <label>
              Vertical
              <input type="range" min="0" max="100" value={mediaCropDraft.y} onChange={(event) => setMediaCropDraft((current) => current ? { ...current, y: Number(event.target.value) } : current)} />
            </label>
            <p className="muted">
              {mediaCropDraft.kind === 'avatar'
                ? 'Ajustez le cadrage rond, puis enregistrez.'
                : 'Ajustez la zone visible de la couverture, puis enregistrez.'}
            </p>
            <div className="modalActions">
              <button type="button" className="ghostButton" onClick={closeMediaCropDraft}>
                Annuler
              </button>
              <button type="button" className="primaryButton" onClick={saveMediaCropDraft}>
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {coverDraftUrl ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="coverModal">
            <header>
              <strong>Nouvelle couverture</strong>
              <button type="button" onClick={closeCoverDraft}>
                <X size={16} />
              </button>
            </header>
            <div
              className="coverPreview"
              style={{
                backgroundImage: `url(${coverDraftUrl})`,
              }}
            />
            <p className="muted">La photo est envoyee directement, sans recadrage destructif. Utilisez une image large pour un rendu plus net.</p>
            <div className="modalActions">
              <button type="button" className="ghostButton" onClick={closeCoverDraft}>
                Annuler
              </button>
              <button type="button" className="ghostButton" onClick={openCoverPicker}>
                Changer l'image
              </button>
              <button type="button" className="primaryButton" onClick={saveCoverDraft}>
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cropOpen ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="cropModal">
            <header>
              <strong>Recentrer la photo</strong>
              <button type="button" onClick={() => setCropOpen(false)}>
                <X size={16} />
              </button>
            </header>
            <div className="cropPreview">
              {avatarSrc ? <img src={avatarSrc} alt="Apercu recadrage" /> : null}
              <span
                className="cropFrame"
                style={{
                  transform: `translate(${crop.x / 12}px, ${crop.y / 12}px)`,
                  width: `${Math.max(96, crop.size / 4)}px`,
                  height: `${Math.max(96, crop.size / 4)}px`,
                }}
              />
            </div>
            <label>
              Horizontal
              <input type="range" min="0" max="1200" value={crop.x} onChange={(event) => setCrop((current) => ({ ...current, x: Number(event.target.value) }))} />
            </label>
            <label>
              Vertical
              <input type="range" min="0" max="1200" value={crop.y} onChange={(event) => setCrop((current) => ({ ...current, y: Number(event.target.value) }))} />
            </label>
            <label>
              Taille
              <input type="range" min="160" max="1200" value={crop.size} onChange={(event) => setCrop((current) => ({ ...current, size: Number(event.target.value) }))} />
            </label>
            <button type="button" className="primaryButton" onClick={saveCrop}>
              Enregistrer le cadrage
            </button>
          </div>
        </div>
      ) : null}

      <ProfileStyles />
    </main>
  );

  function renderPosts() {
    return (
      <>
        <section className="composerPanel">
          <input
            ref={postFileInputRef}
            className="hiddenComposerFileInput"
            type="file"
            accept={postFileAccept[postType] || 'image/*,video/*,.pdf,.doc,.docx'}
            onChange={handlePostFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className="composerHead">
            <span className="miniAvatar soft">{initials(displayName) || 'CM'}</span>
            <button type="button" className="composerPrompt" onClick={() => selectPostType('text')}>
              {editingPostId ? 'Modifier cette publication' : 'Partager une idee, une experience ou un projet...'}
            </button>
            {editingPostId ? (
              <button type="button" className="iconOnly" onClick={resetPostComposer}>
                <X size={16} />
              </button>
            ) : null}
          </div>
          <textarea value={postDraft} onChange={(event) => setPostDraft(event.target.value)} placeholder="Qu'avez-vous appris, construit ou decouvert recemment ?" />
          <div className="composerPills" aria-label="Type de publication">
            <button type="button" className={postType === 'image' || postType === 'photo' ? 'active' : ''} onClick={() => selectPostType('image')}><ImageIcon size={15} />Photo</button>
            <button type="button" className={postType === 'video' ? 'active' : ''} onClick={() => selectPostType('video')}><Camera size={15} />Video</button>
            <button type="button" className={postType === 'article' ? 'active' : ''} onClick={() => selectPostType('article')}><FileText size={15} />Article</button>
            <button type="button" className={postType === 'project' ? 'active' : ''} onClick={() => selectPostType('project')}><Sparkles size={15} />Projet</button>
            <button type="button" className={postType === 'cv' ? 'active' : ''} onClick={() => selectPostType('cv')}><Archive size={15} />CV</button>
            <button type="button" className={postType === 'event' ? 'active' : ''} onClick={() => selectPostType('event')}><GraduationCap size={15} />Evenement</button>
          </div>
          {postFile ? (
            <div className="selectedPostAttachment">
              {postFilePreview ? <img src={postFilePreview} alt={postFile.name} /> : <Archive size={18} />}
              <span>{postFile.name}</span>
              <button type="button" onClick={() => setPostFile(null)} aria-label="Retirer le fichier">
                <X size={15} />
              </button>
            </div>
          ) : null}
          <div className="composerControls">
            <label>
              Visibilite
              <select value={postVisibility} onChange={(event) => setPostVisibility(event.target.value as PostVisibility)}>
                {postVisibilityOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="smallCheck">
              <input type="checkbox" checked={postOnProfile} onChange={(event) => setPostOnProfile(event.target.checked)} />
              Afficher sur le profil
            </label>
            <button type="button" className="primaryButton" onClick={submitPost}>
              <Send size={16} />
              {editingPostId ? 'Mettre a jour' : 'Publier'}
            </button>
          </div>
        </section>

        <div className="postStack">
          {posts.length ? (
            posts.map((post) => (
              <article key={post.id} className={post.pinned ? 'postCard pinned' : 'postCard'}>
                <header>
                  <div className="postAuthor">
                    <span className="miniAvatar">{initials(displayName) || 'CM'}</span>
                    <div>
                      <strong>{displayName}</strong>
                      <small>{formatDate(post.createdAt)} - {postVisibilityLabel(post.visibility)}</small>
                    </div>
                  </div>
                  <div className="postTools">
                    <button type="button" onClick={() => patchPost(post, { pinned: !post.pinned })} title="Epingler">
                      <Pin size={15} />
                    </button>
                    <button type="button" onClick={() => patchPost(post, { showOnProfile: !post.showOnProfile })} title="Afficher ou masquer">
                      {post.showOnProfile ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button type="button" onClick={() => editPost(post)} title="Modifier">
                      <Edit3 size={15} />
                    </button>
                    <button type="button" onClick={() => deletePost(post)} title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </header>
                <p>{post.body}</p>
                {post.attachments?.[0] ? (
                  <div className={`profilePostMedia ${postAttachmentKind(post.attachments[0])}`}>
                    {postAttachmentKind(post.attachments[0]) === 'image' ? (
                      <img src={assetUrl(postAttachmentUrl(post.attachments[0]))} alt={post.attachments[0].title || postTypeLabel(post.type)} loading="lazy" />
                    ) : null}
                    {postAttachmentKind(post.attachments[0]) === 'video' ? (
                      <video src={assetUrl(postAttachmentUrl(post.attachments[0]))} controls preload="metadata" />
                    ) : null}
                    {postAttachmentKind(post.attachments[0]) === 'file' ? (
                      <a href={assetUrl(postAttachmentUrl(post.attachments[0]))} target="_blank" rel="noreferrer">
                        <FileText size={18} />
                        <span>{post.attachments[0].title || post.attachments[0].fileName || postTypeLabel(post.type)}</span>
                      </a>
                    ) : null}
                    {postAttachmentKind(post.attachments[0]) === 'note' ? (
                      <div className="profilePostAttachment">
                        <strong>{post.attachments[0].title || postTypeLabel(post.type)}</strong>
                        {post.attachments[0].detail ? <span>{post.attachments[0].detail}</span> : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <footer>
                  <button type="button" onClick={() => interactWithPost(post, 'like')}><Heart size={15} />Reagir</button>
                  <button type="button" onClick={() => togglePostComments(post)}><MessageCircle size={15} />Commenter</button>
                  <button type="button" onClick={() => interactWithPost(post, 'share')}><Share2 size={15} />Partager</button>
                  <button type="button" onClick={() => interactWithPost(post, 'save')}><Bookmark size={15} />Enregistrer</button>
                </footer>
                {openPostComments[post.id] ? (
                  <div className="profileCommentPanel">
                    <div className="profileCommentList">
                      {(postComments[post.id] || []).length ? (
                        (postComments[post.id] || []).map((comment) => (
                          <div key={comment.id} className="profileCommentItem">
                            <span className="miniAvatar soft">
                              {comment.author?.profilePictureUrl ? (
                                <img src={assetUrl(comment.author.profilePictureUrl)} alt={comment.author.fullName || 'Commentaire'} />
                              ) : (
                                initials(comment.author?.fullName || displayName) || 'CM'
                              )}
                            </span>
                            <div>
                              <strong>{comment.author?.fullName || 'Membre Communium'}</strong>
                              <p>{comment.body}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="muted">Aucun commentaire pour le moment.</p>
                      )}
                    </div>
                    <div className="profileCommentComposer">
                      <input
                        value={commentDrafts[post.id] || ''}
                        onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                        placeholder="Ecrire un commentaire..."
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            submitProfileComment(post);
                          }
                        }}
                      />
                      <button type="button" className="primaryButton" onClick={() => submitProfileComment(post)}>
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="postMeta">
                  <span>{postTypeLabel(post.type)}</span>
                  <span>{Number(post.stats?.likes || 0)} reactions</span>
                  <span>{Number(post.stats?.comments || 0)} commentaires</span>
                  <span>{Number(post.stats?.shares || 0)} partages</span>
                  {!post.showOnProfile ? <span>Masquee du profil</span> : null}
                  {post.pinned ? <span>Epinglee</span> : null}
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="Votre espace de publication est pret." text="Partagez une idee, une realisation ou une actualite pour donner vie a votre profil." />
          )}
        </div>
      </>
    );
  }

  function renderAbout() {
    return (
      <form className="editPanel aboutEditor" onSubmit={saveProfile}>
        <PanelTitle icon={<Edit3 size={18} />} title="Modifier le profil" action={saving ? 'Enregistrement...' : 'Simple et complet'} />

        <div className="aboutShell">
          <nav className="aboutMenu" aria-label="Sections du profil">
            {['Intro', 'Categorie', 'Informations personnelles', 'Liens', 'Communautes', 'Formation', 'Loisirs', 'Coordonnees', 'Confidentialite'].map((item) => (
              <a key={item} href={`#profile-${item.toLowerCase().replace(/\s+/g, '-')}`}>{item}</a>
            ))}
          </nav>

          <div className="aboutSections">
            <details id="profile-intro" className="aboutSection" open>
              <summary>
                <span>Intro</span>
                <Edit3 size={16} />
              </summary>
              <label className="wideField">
                Bio
                <textarea value={form.bio} onChange={(event) => field('bio', event.target.value)} maxLength={300} placeholder="Ex: Informaticien, ouvert aux opportunites, base a Fes." />
              </label>
              <div className="formGrid">
                <Field label="Prenom" value={form.firstName} onChange={(value) => field('firstName', value)} />
                <Field label="Nom" value={form.lastName} onChange={(value) => field('lastName', value)} />
                <Field label="Nom public" value={form.username} onChange={(value) => field('username', value)} />
                <Field label="Disponibilite" value={form.availability} onChange={(value) => field('availability', value)} />
              </div>
            </details>

            <details id="profile-categorie" className="aboutSection" open>
              <summary>
                <span>Categorie professionnelle</span>
                <BriefcaseBusiness size={16} />
              </summary>
              <div className="formGrid">
                <Field label="Metier ou categorie" value={form.profession} onChange={(value) => field('profession', value)} />
                <Field label="Titre actuel" value={form.currentJobTitle} onChange={(value) => field('currentJobTitle', value)} />
                <Field label="Entreprise ou organisation" value={form.currentCompany} onChange={(value) => field('currentCompany', value)} />
                <Field label="Secteur" value={form.currentIndustry} onChange={(value) => field('currentIndustry', value)} />
              </div>
            </details>

            <details id="profile-informations-personnelles" className="aboutSection">
              <summary>
                <span>Informations personnelles</span>
                <MapPin size={16} />
              </summary>
              <div className="formGrid">
                <Field label="Ville actuelle" value={form.city} onChange={(value) => field('city', value)} />
                <Field label="Pays" value={form.country} onChange={(value) => field('country', value)} />
                <Field label="Vient de" value={form.hometown} onChange={(value) => field('hometown', value)} />
                <Field label="Adresse courte" value={form.address} onChange={(value) => field('address', value)} />
              </div>
            </details>

            <details id="profile-liens" className="aboutSection">
              <summary>
                <span>Liens et reseaux</span>
                <LinkIcon size={16} />
              </summary>
              <div className="formGrid">
                <Field label="Site web" value={form.websiteUrl} onChange={(value) => field('websiteUrl', value)} />
                <Field label="Portfolio" value={form.portfolioUrl} onChange={(value) => field('portfolioUrl', value)} />
                <Field label="GitHub" value={form.githubUrl} onChange={(value) => field('githubUrl', value)} />
                <Field label="LinkedIn" value={form.linkedinUrl} onChange={(value) => field('linkedinUrl', value)} />
                <Field label="Instagram pro" value={form.instagramUrl} onChange={(value) => field('instagramUrl', value)} />
                <Field label="Behance" value={form.behanceUrl} onChange={(value) => field('behanceUrl', value)} />
                <Field label="X" value={form.xUrl} onChange={(value) => field('xUrl', value)} />
              </div>
            </details>

            <details id="profile-communautes" className="aboutSection">
              <summary>
                <span>Communautes et offres</span>
                <Users size={16} />
              </summary>
              <div className="aboutPreviewGrid">
                <span>Groupes professionnels: a connecter avec les communautes Communium.</span>
                <span>Offres: vos opportunites, services et disponibilites seront visibles ici.</span>
              </div>
            </details>

            <details id="profile-formation" className="aboutSection">
              <summary>
                <span>Formation, competences et langues</span>
                <GraduationCap size={16} />
              </summary>
              <label className="wideField">
                Formation
                <textarea rows={5} value={form.educationText} onChange={(event) => field('educationText', event.target.value)} placeholder="Etablissement | diplome | periode" />
              </label>
              <div className="formGrid">
                <Field label="Competences" value={form.primarySkillsText} onChange={(value) => field('primarySkillsText', value)} />
                <Field label="Langues" value={form.languagesText} onChange={(value) => field('languagesText', value)} />
              </div>
            </details>

            <details id="profile-loisirs" className="aboutSection">
              <summary>
                <span>Loisirs et centres d'interet</span>
                <Sparkles size={16} />
              </summary>
              <div className="aboutPreviewGrid">
                <span>{profile?.interests?.length ? profile.interests.map((item) => item.name).join(', ') : 'Ajoutez vos centres d interet depuis la section Activite.'}</span>
              </div>
            </details>

            <details id="profile-coordonnees" className="aboutSection">
              <summary>
                <span>Coordonnees</span>
                <Globe2 size={16} />
              </summary>
              <div className="formGrid">
                <Field label="Email" value={form.email} onChange={(value) => field('email', value)} />
                <Field label="Telephone" value={form.phone} onChange={(value) => field('phone', value)} />
              </div>
            </details>

            <details id="profile-confidentialite" className="aboutSection">
              <summary>
                <span>Confidentialite et informations</span>
                <Shield size={16} />
              </summary>
              <div className="privacyQuick">
                <button type="button" className="ghostButton" onClick={() => updatePrivacy({ profileVisibility: 'Public', allowNetworkingRequests: true })}>Profil public</button>
                <button type="button" className="ghostButton" onClick={() => updatePrivacy({ phoneVisibility: 'Private', emailVisibility: 'ContactsOnly' })}>Coordonnees protegees</button>
                <Link href={privacyHref} className="ghostButton">Parametres avances</Link>
              </div>
            </details>
          </div>
        </div>

        <div className="stickySave">
          <span>Les changements restent propres sur le profil public.</span>
          <button type="submit" className="primaryButton">
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </form>
    );
  }

  function renderExperience() {
    return (
      <section className="editPanel">
        <PanelTitle icon={<BriefcaseBusiness size={18} />} title="Experiences" />
        <form className="experienceForm" onSubmit={saveExperience}>
          <div className="formGrid">
            <Field label="Poste" value={experienceForm.jobTitle} onChange={(value) => setExperienceForm((current) => ({ ...current, jobTitle: value }))} />
            <Field label="Entreprise" value={experienceForm.company} onChange={(value) => setExperienceForm((current) => ({ ...current, company: value }))} />
            <Field label="Date de debut" type="date" value={experienceForm.startDate} onChange={(value) => setExperienceForm((current) => ({ ...current, startDate: value }))} />
            <Field label="Date de fin" type="date" value={experienceForm.endDate} onChange={(value) => setExperienceForm((current) => ({ ...current, endDate: value }))} />
            <Field label="Localisation" value={experienceForm.location} onChange={(value) => setExperienceForm((current) => ({ ...current, location: value }))} />
            <Field label="Technologies" value={experienceForm.skillsUsed} onChange={(value) => setExperienceForm((current) => ({ ...current, skillsUsed: value }))} />
          </div>
          <label className="smallCheck">
            <input type="checkbox" checked={experienceForm.isCurrent} onChange={(event) => setExperienceForm((current) => ({ ...current, isCurrent: event.target.checked }))} />
            Poste actuel
          </label>
          <label className="wideField">
            Description
            <textarea value={experienceForm.description} onChange={(event) => setExperienceForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <button type="submit" className="primaryButton">
            <Plus size={16} />
            {experienceForm.id ? 'Modifier experience' : 'Ajouter experience'}
          </button>
        </form>
        <div className="timeline">
          {(profile?.professionalExperiences || []).map((experience) => (
            <article key={experience.id}>
              <div>
                <strong>{experience.jobTitle}</strong>
                <p>{experience.company} - {formatDate(experience.startDate)} {experience.isCurrent ? 'a aujourd hui' : experience.endDate ? `a ${formatDate(experience.endDate)}` : ''}</p>
              </div>
              <div className="postTools">
                <button type="button" onClick={() => startEditExperience(experience)}><Edit3 size={15} /></button>
                <button type="button" onClick={() => removeExperience(experience.id)}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderEducation() {
    return (
      <form className="editPanel" onSubmit={saveProfile}>
        <PanelTitle icon={<GraduationCap size={18} />} title="Formation et certifications" action="Enregistrer" />
        <label className="wideField">
          Formation: etablissement | diplome | periode | certification
          <textarea rows={7} value={form.educationText} onChange={(event) => field('educationText', event.target.value)} />
        </label>
        <button type="submit" className="primaryButton">
          <Save size={16} />
          Enregistrer
        </button>
      </form>
    );
  }

  function renderNetwork() {
    return (
      <section className="editPanel">
        <PanelTitle icon={<Users size={18} />} title="Reseau professionnel" />
        <EmptyState title="Reseau Communium" text="Les connexions confirmees et interactions reelles seront affichees ici lorsqu'elles seront disponibles." />
        <div className="networkActions">
          <button type="button" className="ghostButton" onClick={shareProfile}><UserPlus size={16} />Partager le profil</button>
          <Link href={localizeHref(locale, '/messages')} className="ghostButton"><MessageCircle size={16} />Messages</Link>
          <Link href={localizeHref(locale, '/discover')} className="ghostButton"><Search size={16} />Decouvrir</Link>
        </div>
      </section>
    );
  }

  function renderMedia() {
    const gallery = [
      ...(media.cover ? [{ title: 'Couverture', url: media.cover, kind: 'cover' }] : []),
      ...(media.avatar ? [{ title: 'Photo de profil', url: media.avatar, kind: 'avatar' }] : []),
      ...media.photos.map((item, index) => ({ title: `Photo ${index + 1}`, url: String(item.url || item.fileUrl || ''), kind: 'photo' })),
      ...media.videos.map((item, index) => ({ title: `Video ${index + 1}`, url: String(item.url || item.fileUrl || ''), kind: 'video' })),
      ...media.projects.map((item, index) => ({ title: `Projet ${index + 1}`, url: String(item.url || item.fileUrl || ''), kind: 'project' })),
    ];

    return (
      <section className="editPanel">
        <PanelTitle icon={<ImageIcon size={18} />} title="Medias partages" />
        <div className="mediaGrid">
          {gallery.length ? gallery.map((item) => (
            <a key={`${item.kind}-${item.title}`} href={assetUrl(item.url)} target="_blank" rel="noreferrer">
              {item.url ? <img src={assetUrl(item.url)} alt={item.title} /> : <ImageIcon size={24} />}
              <span>{item.title}</span>
            </a>
          )) : <EmptyState title="Aucun media" text="Ajoutez une couverture, une photo ou des publications avec medias." />}
        </div>
      </section>
    );
  }

  function renderDocuments() {
    return (
      <section className="editPanel">
        <PanelTitle icon={<FileText size={18} />} title="Documents" />
        <div className="documentActions">
          <button type="button" className="primaryButton" onClick={() => cvInputRef.current?.click()}><Upload size={16} />Ajouter CV PDF</button>
          {profile?.cvUrl ? <button type="button" className="ghostButton" onClick={() => deleteAsset('cv')}><Trash2 size={16} />Supprimer CV</button> : null}
        </div>
        <div className="fileList">
          {documents.length ? documents.map((doc) => (
            <a key={doc.id} href={assetUrl(doc.fileUrl)} target="_blank" rel="noreferrer">
              <FileText size={18} />
              <span><strong>{doc.title}</strong><small>{doc.visibility}</small></span>
              <Download size={16} />
            </a>
          )) : <EmptyState title="Aucun document public" text="Ajoutez votre CV ou un portfolio PDF." />}
        </div>
      </section>
    );
  }

  function renderMore() {
    return (
      <form className="editPanel" onSubmit={saveProfile}>
        <PanelTitle icon={<LinkIcon size={18} />} title="Activite et diffusion" action="Enregistrer" />
        <div className="formGrid">
          <Field label="Site web" value={form.websiteUrl} onChange={(value) => field('websiteUrl', value)} />
          <Field label="Portfolio" value={form.portfolioUrl} onChange={(value) => field('portfolioUrl', value)} />
          <Field label="GitHub" value={form.githubUrl} onChange={(value) => field('githubUrl', value)} />
          <Field label="LinkedIn" value={form.linkedinUrl} onChange={(value) => field('linkedinUrl', value)} />
          <Field label="Behance" value={form.behanceUrl} onChange={(value) => field('behanceUrl', value)} />
          <Field label="X" value={form.xUrl} onChange={(value) => field('xUrl', value)} />
          <Field label="Instagram pro" value={form.instagramUrl} onChange={(value) => field('instagramUrl', value)} />
          <Field label="URL publique" value={form.publicProfileUrl} onChange={(value) => field('publicProfileUrl', value)} />
        </div>
        <div className="privacyGrid">
          <SelectPrivacy label="Profil" value={privacy.profileVisibility || 'Public'} onChange={(value) => updatePrivacy({ profileVisibility: value })} />
          <SelectPrivacy label="Email" value={privacy.emailVisibility || 'Private'} onChange={(value) => updatePrivacy({ emailVisibility: value })} />
          <SelectPrivacy label="Telephone" value={privacy.phoneVisibility || 'Private'} onChange={(value) => updatePrivacy({ phoneVisibility: value })} />
          <SelectPrivacy label="CV" value={privacy.cvVisibility || 'ContactsOnly'} onChange={(value) => updatePrivacy({ cvVisibility: value })} />
        </div>
        <button type="submit" className="primaryButton"><Save size={16} />Enregistrer</button>
      </form>
    );
  }
}

function InfoCard({ title, children, onEdit }: { title: string; children: ReactNode; onEdit?: () => void }) {
  return (
    <section className="infoCard">
      <header>
        <strong>{title}</strong>
        {onEdit ? <button type="button" onClick={onEdit}><Edit3 size={14} /></button> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) {
    return null;
  }

  return (
    <p className="infoRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function MiniEntry({ title, detail }: { title?: string; detail?: string }) {
  return (
    <div className="miniEntry">
      <strong>{title}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}

function SocialLink({ label, href }: { label: string; href?: string }) {
  return href ? <a className="socialLink" href={href} target="_blank" rel="noreferrer">{label}</a> : null;
}

function TagCloud({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? <div className="tagCloud">{items.map((item) => <span key={item}>{item}</span>)}</div> : <p className="muted">{empty}</p>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="field">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PanelTitle({ icon, title, action }: { icon: ReactNode; title: string; action?: string }) {
  return (
    <header className="panelTitle">
      <span>{icon}</span>
      <strong>{title}</strong>
      {action ? <button type="submit" className="tinySubmit">{action}</button> : null}
    </header>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="emptyState">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metricCard">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SelectPrivacy({ label, value, onChange }: { label: string; value: Visibility; onChange: (value: Visibility) => void }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value as Visibility)}>
        <option value="Public">Public</option>
        <option value="ContactsOnly">Reseau</option>
        <option value="Private">Prive</option>
      </select>
    </label>
  );
}

function ProfileStyles() {
  return (
    <style>{`
      .profilePage {
        min-height: calc(100vh - 120px);
        padding: 12px 8px 28px;
        color: #0f172a;
      }

      .profileHero,
      .infoCard,
      .composerPanel,
      .postCard,
      .editPanel,
      .authPanel {
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 20px 58px rgba(15, 23, 42, 0.08);
      }

      .profileHero {
        position: relative;
        z-index: 20;
        width: min(1900px, 100%);
        margin: 0 auto;
        overflow: visible;
        border-radius: 16px;
      }

      .cover {
        position: relative;
        min-height: 190px;
        overflow: hidden;
        border-radius: 16px 16px 0 0;
        background:
          radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.92), transparent 34%),
          linear-gradient(135deg, #f8fafc 0%, #e5e7eb 48%, #f1f5f9 100%);
        background-size: cover;
        background-position: center;
      }

      .cover::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(15, 23, 42, 0.04));
        pointer-events: none;
      }

      .coverActions {
        position: absolute;
        right: 18px;
        bottom: 18px;
        z-index: 2;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .coverAction {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.94);
        color: #0f172a;
        font-weight: 780;
        padding: 0 14px;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
      }

      .coverAction.subtle {
        background: rgba(255, 255, 255, 0.82);
        color: #475569;
      }

      .heroBody {
        position: relative;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 18px;
        align-items: start;
        padding: 0 24px 18px;
        margin-top: 0;
      }

      .avatarWrap {
        position: relative;
        z-index: 60;
        margin-top: -62px;
      }

      .avatarButton {
        position: relative;
        width: 132px;
        height: 132px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border: 6px solid #ffffff;
        border-radius: 50%;
        background: linear-gradient(135deg, #e2e8f0, #f8fafc);
        color: #334155;
        font-size: 2.25rem;
        font-weight: 900;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.2);
        cursor: pointer;
        transition: transform 160ms ease, box-shadow 160ms ease;
      }

      .avatarButton:hover {
        transform: translateY(-2px);
        box-shadow: 0 24px 54px rgba(15, 23, 42, 0.22);
      }

      .avatarButton img,
      .mediaGrid img,
      .cropPreview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatarEdit {
        position: absolute;
        right: 8px;
        bottom: 8px;
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #ffffff;
        color: #334155;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
      }

      .avatarMenu {
        position: absolute;
        z-index: 160;
        left: 0;
        top: calc(100% + 10px);
        width: 210px;
        display: grid;
        gap: 5px;
        padding: 8px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 0 24px 52px rgba(15, 23, 42, 0.18);
      }

      .profileLayout {
        position: relative;
        z-index: 1;
      }

      .avatarMenu button,
      .postTools button,
      .iconOnly,
      .infoCard header button {
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: #0f172a;
        cursor: pointer;
      }

      .avatarMenu button {
        min-height: 36px;
        text-align: left;
        padding: 0 10px;
        font-weight: 750;
      }

      .identityBlock {
        min-width: 0;
        display: grid;
        gap: 10px;
        align-self: start;
        padding-top: 18px;
      }

      .identityTop,
      .badgeRow,
      .metaLine,
      .profileEssentials,
      .linkLine,
      .actionRow,
      .profileTabs,
      .composerControls,
      .composerHead,
      .composerPills,
      .postCard footer,
      .postTools,
      .postAuthor,
      .panelTitle,
      .documentActions,
      .networkActions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .identityTop {
        justify-content: space-between;
        align-items: flex-start;
      }

      .identityTop > div {
        min-width: 0;
        flex: 1 1 520px;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(1.85rem, 2.5vw, 2.65rem);
        line-height: 1.08;
        letter-spacing: 0;
      }

      .identityBlock h1 {
        max-width: 100%;
        overflow-wrap: anywhere;
        word-break: normal;
      }

      .profileHeroBio {
        max-width: 760px;
        margin-top: 8px;
        color: #334155;
        font-size: 1rem;
        line-height: 1.45;
        font-weight: 700;
      }

      .identityStats {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 9px;
        color: #64748b;
        font-size: 0.9rem;
        font-weight: 800;
      }

      .identityStats span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .identityStats strong {
        color: #0f172a;
      }

      .username,
      .headline,
      .identityLine,
      .profileEssentials,
      .metaLine,
      .muted,
      .emptyState p,
      .postCard small,
      .infoRow span,
      .miniEntry span {
        color: #64748b;
      }

      .identityLine {
        margin-top: 8px;
        color: #334155;
        font-weight: 850;
      }

      .headline {
        font-weight: 800;
        font-size: 1.04rem;
      }

      .metaLine span,
      .profileEssentials span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-weight: 700;
      }

      .profileEssentials {
        gap: 14px;
        font-size: 0.94rem;
      }

      .statusBadge,
      .tagCloud span,
      .postMeta span {
        min-height: 30px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        background: rgba(29, 78, 216, 0.09);
        color: #1d4ed8;
        border: 1px solid rgba(29, 78, 216, 0.13);
        padding: 0 10px;
        font-size: 0.82rem;
        font-weight: 850;
      }

      .statusBadge.premium {
        background: rgba(15, 23, 42, 0.92);
        color: #ffffff;
      }

      .statusBadge.neutral {
        background: #f8fafc;
        border-color: rgba(148, 163, 184, 0.28);
        color: #334155;
      }

      .statusBadge.warning {
        background: #fff7ed;
        border-color: rgba(251, 146, 60, 0.28);
        color: #9a3412;
      }

      .badgeRow.refined {
        justify-content: flex-end;
      }

      .linkLine a,
      .socialLink {
        color: #1d4ed8;
        font-weight: 850;
        text-decoration: none;
      }

      .primaryButton,
      .ghostButton,
      .fullGhost,
      .tinySubmit {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        font-weight: 850;
        text-decoration: none;
        cursor: pointer;
      }

      .primaryButton {
        border: 0;
        background: linear-gradient(135deg, #1d4ed8, #2563eb);
        color: #ffffff;
        padding: 0 15px;
        box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
      }

      .ghostButton,
      .fullGhost,
      .tinySubmit {
        border: 1px solid rgba(29, 78, 216, 0.16);
        background: #ffffff;
        color: #0f172a;
        padding: 0 13px;
      }

      .primaryButton:hover,
      .ghostButton:hover,
      .fullGhost:hover,
      .coverAction:hover,
      .composerPills button:hover,
      .postCard footer button:hover {
        transform: translateY(-1px);
      }

      .iconButton {
        width: 40px;
        padding: 0;
      }

      .moreMenuWrap {
        position: relative;
      }

      .moreMenu {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        z-index: 30;
        width: 220px;
        display: grid;
        gap: 4px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 14px;
        background: #ffffff;
        padding: 8px;
        box-shadow: 0 22px 48px rgba(15, 23, 42, 0.16);
      }

      .moreMenu a,
      .moreMenu button {
        min-height: 36px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: #0f172a;
        font: inherit;
        font-weight: 800;
        text-decoration: none;
        padding: 0 10px;
        cursor: pointer;
      }

      .moreMenu a:hover,
      .moreMenu button:hover {
        background: #f8fafc;
      }

      .fullGhost {
        width: 100%;
      }

      .profileTabs {
        padding: 0 24px 14px;
        overflow-x: auto;
      }

      .profileTabs button {
        min-height: 36px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #475569;
        font-weight: 850;
        padding: 0 12px;
        cursor: pointer;
        white-space: nowrap;
      }

      .profileTabs button.active {
        background: #0f172a;
        color: #ffffff;
      }

      .profileLayout {
        width: min(1900px, 100%);
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr) 300px;
        gap: 16px;
        margin: 18px auto 0;
        align-items: start;
      }

      .leftRail,
      .rightRail,
      .mainColumn,
      .postStack,
      .timeline,
      .fileList,
      .contactStack {
        display: grid;
        gap: 14px;
      }

      .leftRail,
      .rightRail {
        position: sticky;
        top: 12px;
      }

      .infoCard,
      .composerPanel,
      .postCard,
      .editPanel,
      .authPanel {
        border-radius: 14px;
        padding: 14px;
      }

      .infoCard header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .infoCard > div {
        display: grid;
        gap: 10px;
      }

      .profileBio {
        color: #334155;
        line-height: 1.5;
      }

      .completionBlock {
        display: grid;
        gap: 8px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 14px;
        background: #f8fafc;
        padding: 10px;
      }

      .completionBlock > div {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: #64748b;
        font-size: 0.86rem;
        font-weight: 800;
      }

      .completionBlock strong {
        color: #0f172a;
      }

      .completionTrack {
        height: 7px;
        overflow: hidden;
        border-radius: 999px;
        background: #e2e8f0;
      }

      .completionTrack span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #0f172a, #2563eb);
      }

      .infoRow {
        display: grid;
        gap: 3px;
      }

      .infoRow strong,
      .miniEntry strong {
        font-size: 0.95rem;
      }

      .tagCloud {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .highlightGrid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .highlightGrid span {
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 12px;
        background: #ffffff;
        padding: 9px 10px;
        color: #334155;
        font-weight: 800;
      }

      .composerPanel,
      .editPanel {
        display: grid;
        gap: 14px;
      }

      .aboutEditor {
        padding: 0;
        overflow: hidden;
      }

      .aboutEditor > .panelTitle {
        padding: 16px 16px 0;
      }

      .aboutShell {
        display: grid;
        grid-template-columns: 250px minmax(0, 1fr);
        border-top: 1px solid rgba(148, 163, 184, 0.16);
      }

      .aboutMenu {
        display: grid;
        align-content: start;
        gap: 4px;
        padding: 14px;
        border-right: 1px solid rgba(148, 163, 184, 0.16);
        background: #f8fafc;
      }

      .aboutMenu a {
        min-height: 38px;
        display: flex;
        align-items: center;
        border-radius: 10px;
        color: #334155;
        font-weight: 850;
        text-decoration: none;
        padding: 0 11px;
      }

      .aboutMenu a:hover {
        background: #eaf2ff;
        color: #1d4ed8;
      }

      .aboutSections {
        display: grid;
        gap: 10px;
        padding: 14px;
      }

      .aboutSection {
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 14px;
        background: #ffffff;
        overflow: hidden;
      }

      .aboutSection summary {
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: #0f172a;
        font-weight: 900;
        list-style: none;
        padding: 0 14px;
        cursor: pointer;
      }

      .aboutSection summary::-webkit-details-marker {
        display: none;
      }

      .aboutSection[open] {
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
      }

      .aboutSection[open] summary {
        border-bottom: 1px solid rgba(148, 163, 184, 0.14);
      }

      .aboutSection > .wideField,
      .aboutSection > .formGrid,
      .aboutPreviewGrid,
      .privacyQuick {
        margin: 14px;
      }

      .aboutPreviewGrid {
        display: grid;
        gap: 8px;
      }

      .aboutPreviewGrid span {
        border-radius: 12px;
        background: #f8fafc;
        color: #475569;
        font-weight: 750;
        padding: 12px;
      }

      .privacyQuick {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .stickySave {
        position: sticky;
        bottom: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        border-top: 1px solid rgba(148, 163, 184, 0.16);
        background: rgba(255, 255, 255, 0.96);
        padding: 12px 16px;
      }

      .stickySave span {
        color: #64748b;
        font-size: 0.9rem;
        font-weight: 800;
      }

      .composerHead {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 10px;
      }

      .composerPrompt {
        min-height: 42px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        background: #f8fafc;
        color: #64748b;
        text-align: left;
        padding: 0 16px;
        font: inherit;
        font-weight: 800;
        cursor: text;
      }

      .composerPanel textarea,
      .wideField textarea,
      .field input,
      .field select,
      .composerControls select,
      .wideField input {
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 14px;
        background: #ffffff;
        color: #0f172a;
        font: inherit;
        outline: none;
      }

      .composerPanel textarea,
      .wideField textarea {
        min-height: 92px;
        resize: vertical;
        padding: 12px;
      }

      .composerPills {
        gap: 8px;
        border-top: 1px solid rgba(148, 163, 184, 0.16);
        padding-top: 10px;
      }

      .composerPills button {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 999px;
        background: #ffffff;
        color: #334155;
        font-weight: 850;
        padding: 0 11px;
        cursor: pointer;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      }

      .composerPills button.active {
        border-color: rgba(37, 99, 235, 0.34);
        background: rgba(37, 99, 235, 0.08);
        color: #1d4ed8;
      }

      .hiddenComposerFileInput {
        display: none;
      }

      .selectedPostAttachment {
        display: flex;
        align-items: center;
        gap: 10px;
        width: fit-content;
        max-width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        background: #f8fafc;
        padding: 6px 8px 6px 10px;
        color: #334155;
        font-weight: 850;
      }

      .selectedPostAttachment img {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        object-fit: cover;
      }

      .selectedPostAttachment span {
        min-width: 0;
        max-width: 320px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .selectedPostAttachment button {
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 999px;
        background: #e2e8f0;
        color: #0f172a;
        display: grid;
        place-items: center;
        cursor: pointer;
      }

      .field,
      .wideField,
      .composerControls label {
        display: grid;
        gap: 7px;
        color: #475569;
        font-size: 0.86rem;
        font-weight: 800;
      }

      .field input,
      .field select,
      .composerControls select,
      .wideField input {
        min-height: 42px;
        padding: 0 12px;
      }

      .composerControls {
        display: grid;
        grid-template-columns: minmax(130px, 180px) auto minmax(180px, 1fr);
        align-items: end;
      }

      .formGrid,
      .privacyGrid,
      .networkGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .smallCheck {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #475569;
        font-weight: 800;
      }

      .postCard {
        display: grid;
        gap: 12px;
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
      }

      .postCard:hover {
        transform: translateY(-1px);
        border-color: rgba(37, 99, 235, 0.2);
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
      }

      .postCard.pinned {
        border-color: rgba(29, 78, 216, 0.32);
      }

      .profilePostMedia {
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 18px;
        background: #ffffff;
      }

      .profilePostMedia.image,
      .profilePostMedia.video {
        display: grid;
        place-items: center;
      }

      .profilePostMedia img,
      .profilePostMedia video {
        display: block;
        width: 100%;
        max-height: min(70vh, 680px);
        object-fit: contain;
        background: #0f172a;
      }

      .profilePostMedia.image img {
        background: #ffffff;
      }

      .profilePostMedia a,
      .profilePostAttachment {
        min-height: 72px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px;
        color: inherit;
        text-decoration: none;
        font-weight: 850;
      }

      .profilePostAttachment {
        display: grid;
      }

      .profilePostAttachment span {
        color: #64748b;
        font-weight: 700;
      }

      .postCard header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .miniAvatar {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 13px;
        overflow: hidden;
        background: #0f172a;
        color: #ffffff;
        font-weight: 900;
      }

      .miniAvatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .miniAvatar.soft {
        background: linear-gradient(135deg, #dbeafe, #e0f2fe);
        color: #1d4ed8;
      }

      .profileCommentPanel {
        display: grid;
        gap: 12px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(148, 163, 184, 0.18);
      }

      .profileCommentList {
        display: grid;
        gap: 10px;
      }

      .profileCommentItem {
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr);
        gap: 10px;
        align-items: flex-start;
      }

      .profileCommentItem div {
        width: fit-content;
        max-width: 100%;
        border-radius: 16px;
        background: #f1f5f9;
        padding: 9px 12px;
      }

      .profileCommentItem strong {
        display: block;
        color: #0f172a;
        font-size: 0.86rem;
      }

      .profileCommentItem p {
        margin: 2px 0 0;
        color: #334155;
      }

      .profileCommentComposer {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }

      .profileCommentComposer input {
        min-height: 42px;
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        padding: 0 14px;
        background: #f8fafc;
        color: #0f172a;
        font: inherit;
        outline: none;
      }

      .postTools button,
      .iconOnly {
        width: 32px;
        height: 32px;
        display: inline-grid;
        place-items: center;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: #ffffff;
      }

      .postMeta {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .postCard footer button {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 0;
        border-radius: 999px;
        background: #f8fafc;
        color: #334155;
        padding: 0 10px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 160ms ease, background 160ms ease;
      }

      .metricInline {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .panelTitle {
        justify-content: space-between;
      }

      .panelTitle > span {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: rgba(29, 78, 216, 0.1);
        color: #1d4ed8;
      }

      .experienceForm {
        display: grid;
        gap: 12px;
      }

      .timeline article,
      .fileList a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 16px;
        background: #ffffff;
        color: inherit;
        padding: 12px;
        text-decoration: none;
      }

      .metricCard {
        display: grid;
        gap: 4px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 12px;
        background: #ffffff;
        padding: 10px;
      }

      .metricCard span {
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 800;
      }

      .metricCard strong {
        font-size: 1.05rem;
      }

      .suggestionItem,
      .eventItem {
        display: grid;
        gap: 8px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 14px;
        background: #ffffff;
        padding: 10px;
      }

      .suggestionItem {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .suggestionItem small,
      .eventItem small {
        display: block;
        margin-top: 3px;
        color: #64748b;
      }

      .suggestionActions {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-top: 8px;
      }

      .suggestionActions a,
      .suggestionActions button,
      .eventItem button,
      .compactAction {
        min-height: 30px;
        border: 1px solid rgba(37, 99, 235, 0.16);
        border-radius: 999px;
        background: #ffffff;
        color: #1d4ed8;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 850;
        text-decoration: none;
        padding: 0 10px;
        cursor: pointer;
      }

      .suggestionActions span {
        color: #64748b;
        font-size: 0.82rem;
        font-weight: 800;
      }

      .mediaGrid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }

      .mediaGrid a {
        position: relative;
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 16px;
        background: #eef2ff;
        color: #0f172a;
        text-decoration: none;
      }

      .mediaGrid span {
        position: absolute;
        left: 8px;
        bottom: 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        padding: 5px 9px;
        font-size: 0.8rem;
        font-weight: 850;
      }

      .emptyState {
        display: grid;
        gap: 6px;
        border: 1px dashed rgba(148, 163, 184, 0.35);
        border-radius: 16px;
        background: #f8fafc;
        padding: 18px;
      }

      .profileNotice {
        position: fixed;
        top: 106px;
        left: 50%;
        z-index: 80;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: #0f172a;
        color: #ffffff;
        padding: 10px 14px;
        box-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
      }

      .profileNotice button {
        border: 0;
        background: transparent;
        color: #ffffff;
        cursor: pointer;
      }

      .modalBackdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: grid;
        place-items: center;
        padding: 16px;
        background: rgba(15, 23, 42, 0.42);
        overflow: hidden;
      }

      .cropModal {
        width: min(520px, 100%);
        display: grid;
        gap: 14px;
        border-radius: 22px;
        background: #ffffff;
        padding: 18px;
      }

      .coverModal {
        width: min(760px, 100%);
        display: grid;
        gap: 14px;
        border-radius: 18px;
        background: #ffffff;
        padding: 18px;
      }

      .mediaCropModal {
        width: min(680px, calc(100vw - 32px));
        max-width: calc(100vw - 32px);
        max-height: calc(100dvh - 32px);
        display: grid;
        gap: 14px;
        border-radius: 20px;
        background: #ffffff;
        padding: 18px;
        overflow: auto;
        box-sizing: border-box;
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
      }

      .coverModal header,
      .mediaCropModal header,
      .modalActions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .coverModal header button {
        border: 0;
        background: transparent;
        cursor: pointer;
      }

      .mediaCropModal header button {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 50%;
        background: #e5e7eb;
        cursor: pointer;
      }

      .mediaCropModal label {
        display: grid;
        gap: 8px;
        color: #475569;
        font-weight: 800;
      }

      .mediaCropModal input[type='range'] {
        min-width: 0;
        width: 100%;
        accent-color: #2563eb;
      }

      .mediaCropPreview {
        width: 100%;
        min-height: 280px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background-repeat: no-repeat;
        background-color: #f8fafc;
        box-shadow: inset 0 0 0 999px rgba(15, 23, 42, 0.02);
      }

      .avatarCropPreview {
        width: min(360px, 72vw);
        min-height: 360px;
        justify-self: center;
        border-radius: 50%;
      }

      .coverCropPreview {
        aspect-ratio: 16 / 5;
        min-height: clamp(140px, 28vw, 220px);
        border-radius: 14px;
      }

      .coverPreview {
        min-height: 260px;
        border-radius: 14px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }

      .coverModal label {
        display: grid;
        gap: 8px;
        color: #475569;
        font-weight: 800;
      }

      .cropModal header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cropModal header button {
        border: 0;
        background: transparent;
      }

      .cropPreview {
        position: relative;
        height: 260px;
        overflow: hidden;
        border-radius: 18px;
        background: #e2e8f0;
      }

      .cropFrame {
        position: absolute;
        left: 50%;
        top: 50%;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 0 999px rgba(15, 23, 42, 0.38);
      }

      .authPanel {
        width: min(720px, 100%);
        display: grid;
        gap: 14px;
        margin: 60px auto;
        text-align: center;
      }

      @media (max-width: 1180px) {
        .profileLayout {
          grid-template-columns: 280px minmax(0, 1fr);
        }

        .rightRail {
          display: none;
        }
      }

      @media (max-width: 820px) {
        .profilePage {
          padding: 8px 6px 18px;
        }

        .heroBody,
        .profileLayout,
        .formGrid,
        .privacyGrid,
        .networkGrid,
        .composerControls,
        .metricInline {
          grid-template-columns: 1fr;
        }

        .leftRail,
        .rightRail {
          position: static;
        }

        .rightRail {
          display: grid;
        }

        .identityTop {
          align-items: flex-start;
        }

        .actionRow {
          align-items: stretch;
        }

        .actionRow .primaryButton,
        .actionRow .ghostButton {
          flex: 1 1 auto;
        }

        .avatarButton {
          width: 116px;
          height: 116px;
        }

        .avatarWrap {
          margin-top: -52px;
        }

        .identityBlock {
          padding-top: 6px;
        }

        .identityBlock h1 {
          font-size: clamp(1.65rem, 8vw, 2.15rem);
        }

        .cover {
          min-height: 170px;
        }

        .coverActions {
          left: 12px;
          right: 12px;
          bottom: 12px;
        }

        .coverAction {
          flex: 1 1 auto;
          justify-content: center;
        }

        .profileTabs,
        .heroBody {
          padding-left: 14px;
          padding-right: 14px;
        }

        .aboutShell {
          grid-template-columns: 1fr;
        }

        .aboutMenu {
          display: flex;
          overflow-x: auto;
          border-right: 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        }

        .aboutMenu a {
          white-space: nowrap;
        }

        .stickySave {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `}</style>
  );
}
