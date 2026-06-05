import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  Globe2,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Share2,
  UserPlus,
  Users,
} from 'lucide-react';
import { localizeHref } from '@/components/locale-path';

export interface PublicInterest {
  id: number;
  name: string;
  category?: string | null;
}

export interface PublicExperience {
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

export interface PublicEducationItem {
  school?: string;
  degree?: string;
  years?: string;
  certificate?: string;
}

export interface PublicProfile {
  id: number;
  user?: {
    username?: string | null;
    role?: string | null;
  } | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  bio?: string | null;
  country?: string | null;
  city?: string | null;
  hometown?: string | null;
  profilePictureUrl?: string | null;
  bannerUrl?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  currentIndustry?: string | null;
  profession?: string | null;
  currentPosition?: string | null;
  establishment?: string | null;
  experienceLevel?: string | null;
  memberStatus?: string | null;
  availability?: string | null;
  websiteUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  behanceUrl?: string | null;
  xUrl?: string | null;
  instagramUrl?: string | null;
  languages?: string[];
  education?: PublicEducationItem[];
  primarySkills?: string[];
  membershipTier?: 'Free' | 'Silver' | 'Gold' | 'Platinum' | null;
  verificationStatus?: string | null;
  verificationBadgeLabel?: string | null;
  publicProfileUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  professionalExperiences?: PublicExperience[];
  interests?: PublicInterest[];
  cvDownloadUrl?: string | null;
  allowNetworkingRequests?: boolean;
  updatedAt?: string | null;
}

export interface PublicProfilePost {
  id: number;
  type: string;
  body: string;
  visibility?: string;
  showOnProfile?: boolean;
  pinned?: boolean;
  attachments?: Array<{ title?: string; url?: string; type?: string }>;
  stats?: {
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PublicProfileMedia {
  photos?: Array<Record<string, unknown>>;
  videos?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  cover?: string | null;
  avatar?: string | null;
}

export interface PublicProfileDocument {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  visibility?: string;
}

interface PublicProfessionalProfileProps {
  locale: string;
  profile: PublicProfile;
  posts?: PublicProfilePost[];
  media?: PublicProfileMedia;
  documents?: PublicProfileDocument[];
  browserBackendUrl: string;
  sourcePath: string;
}

function assetUrl(fileUrl: string | null | undefined, browserBackendUrl: string) {
  if (!fileUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  return `${browserBackendUrl}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
}

function externalHref(value?: string | null) {
  const cleaned = (value || '').trim();
  if (!cleaned) {
    return '';
  }

  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
  }).format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function valueList(items: Array<string | null | undefined>) {
  return items.map((item) => (item || '').trim()).filter(Boolean);
}

function socialLinks(profile: PublicProfile) {
  return [
    { label: 'Site web', href: profile.websiteUrl },
    { label: 'Portfolio', href: profile.portfolioUrl },
    { label: 'GitHub', href: profile.githubUrl },
    { label: 'LinkedIn', href: profile.linkedinUrl },
    { label: 'Behance', href: profile.behanceUrl },
    { label: 'X', href: profile.xUrl },
    { label: 'Instagram pro', href: profile.instagramUrl },
  ].filter((item) => externalHref(item.href));
}

export default function PublicProfessionalProfile({
  locale,
  profile,
  posts = [],
  media = {},
  documents = [],
  browserBackendUrl,
  sourcePath,
}: PublicProfessionalProfileProps) {
  const name =
    profile.fullName ||
    valueList([profile.firstName, profile.lastName]).join(' ') ||
    profile.user?.username ||
    'Membre Communium';
  const username = profile.user?.username || profile.publicProfileUrl || '';
  const location = valueList([profile.city, profile.country]).join(', ');
  const role = valueList([profile.currentJobTitle || profile.profession || profile.currentPosition, profile.currentCompany]).join(' - ');
  const headline = role || profile.currentIndustry || 'Membre du reseau Communium';
  const avatar = assetUrl(profile.profilePictureUrl, browserBackendUrl);
  const cover = assetUrl(profile.bannerUrl, browserBackendUrl);
  const signInHref = `${localizeHref(locale, '/auth/sign-in')}?redirect=${encodeURIComponent(localizeHref(locale, sourcePath))}`;
  const messageHref = `${localizeHref(locale, '/messages')}${username ? `?to=${encodeURIComponent(username)}` : ''}`;
  const networkHref = `${localizeHref(locale, '/discover')}${username ? `?profile=${encodeURIComponent(username)}` : ''}`;
  const contactLinks = [
    profile.email ? { label: 'Email', href: `mailto:${profile.email}` } : null,
    profile.phone ? { label: 'Telephone', href: `tel:${profile.phone}` } : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>;
  const links = socialLinks(profile);
  const experiences = profile.professionalExperiences || [];
  const skills = valueList([...(profile.primarySkills || []), ...(profile.interests || []).map((item) => item.name)]);
  const education = profile.education || [];
  const infoItems = [
    { label: 'Profession', value: profile.profession || profile.currentJobTitle || profile.currentPosition },
    { label: 'Entreprise', value: profile.currentCompany },
    { label: 'Secteur', value: profile.currentIndustry },
    { label: 'Ville / pays', value: location },
    { label: 'Origine', value: profile.hometown },
    { label: 'Disponibilite', value: profile.availability },
  ].filter((item) => item.value);
  const gallery = [
    cover ? { title: 'Couverture', url: cover, kind: 'Photo' } : null,
    avatar ? { title: 'Photo', url: avatar, kind: 'Photo' } : null,
    ...(media.photos || []).map((item, index) => ({
      title: String(item.title || `Photo ${index + 1}`),
      url: assetUrl(String(item.url || item.fileUrl || ''), browserBackendUrl),
      kind: 'Photo',
    })),
    ...(media.videos || []).map((item, index) => ({
      title: String(item.title || `Video ${index + 1}`),
      url: assetUrl(String(item.url || item.fileUrl || ''), browserBackendUrl),
      kind: 'Video',
    })),
    ...(media.projects || []).map((item, index) => ({
      title: String(item.title || `Projet ${index + 1}`),
      url: assetUrl(String(item.url || item.fileUrl || ''), browserBackendUrl),
      kind: 'Projet',
    })),
  ].filter((item): item is { title: string; url: string; kind: string } => Boolean(item?.url));
  const hasDocuments = documents.length > 0 || Boolean(profile.cvDownloadUrl);
  const hasRightRail = contactLinks.length > 0 || hasDocuments || gallery.length > 0;

  return (
    <main className="publicProfilePage">
      <section className="publicHero">
        <div
          className="publicCover"
          style={
            cover
              ? {
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.12), rgba(29, 78, 216, 0.22)), url(${cover})`,
                }
              : undefined
          }
        >
          <div className="coverMesh" />
        </div>

        <div className="publicHeroBody">
          <div className="publicAvatar">
            {avatar ? <img src={avatar} alt={name} /> : <span>{initials(name) || 'CM'}</span>}
          </div>

          <div className="publicIdentity">
            <h1>{name}</h1>
            <p className="publicHeadline">{headline}</p>
            <div className="publicMeta">
              {username ? <span>@{username}</span> : null}
              {location ? (
                <span>
                  <MapPin size={14} />
                  {location}
                </span>
              ) : null}
              {profile.verificationBadgeLabel || profile.verificationStatus === 'VERIFIED' ? (
                <span>
                  <BadgeCheck size={14} />
                  Verifie
                </span>
              ) : null}
              {profile.membershipTier ? <span>{profile.membershipTier}</span> : null}
              {profile.availability ? <span>{profile.availability}</span> : null}
            </div>
            {profile.bio ? <p className="bioText">{profile.bio}</p> : null}
          </div>

          <div className="publicActions">
            <Link href={signInHref} className="primaryAction">
              Se connecter
            </Link>
            <Link href={networkHref} className="softAction">
              <UserPlus size={15} />
              Suivre
            </Link>
            <Link href={messageHref} className="softAction">
              <MessageCircle size={15} />
              Message
            </Link>
            <Link href={networkHref} className="softAction">
              <Users size={15} />
              Ajouter reseau
            </Link>
          </div>
        </div>

        <nav className="publicTabs" aria-label="Sections du profil">
          {posts.length ? <a href="#posts">Publications</a> : null}
          <a href="#about">A propos</a>
          {experiences.length ? <a href="#experience">Experiences</a> : null}
          {education.length ? <a href="#education">Formation</a> : null}
          {gallery.length ? <a href="#media">Medias</a> : null}
          {hasDocuments ? <a href="#documents">Documents</a> : null}
        </nav>
      </section>

      <section className={hasRightRail ? 'publicProfileGrid' : 'publicProfileGrid noRight'}>
        <aside className="publicLeft">
          {infoItems.length ? (
            <ProfileCard title="Informations">
              {infoItems.map((item) => (
                <InfoLine key={item.label} label={item.label} value={item.value} />
              ))}
            </ProfileCard>
          ) : null}

          {skills.length ? (
            <ProfileCard title="Competences">
              <TagList items={skills.slice(0, 18)} />
            </ProfileCard>
          ) : null}

          {profile.languages?.length ? (
            <ProfileCard title="Langues">
              <TagList items={profile.languages} />
            </ProfileCard>
          ) : null}

          {links.length ? (
            <ProfileCard title="Liens">
              <div className="linkStack">
                {links.map((item) => (
                  <a key={item.label} href={externalHref(item.href)} target="_blank" rel="noreferrer">
                    <LinkIcon size={15} />
                    {item.label}
                  </a>
                ))}
              </div>
            </ProfileCard>
          ) : null}
        </aside>

        <div className="publicMain">
          {posts.length ? (
            <section id="posts" className="profileSection">
              <SectionTitle icon={<Share2 size={18} />} title="Publications" />
              <div className="postFeed">
                {posts.map((post) => (
                  <article key={post.id} className={post.pinned ? 'publicPost pinned' : 'publicPost'}>
                    <header>
                      <div>
                        <strong>{name}</strong>
                        <small>{formatDate(post.createdAt)} - {post.type}</small>
                      </div>
                      {post.pinned ? <span>Epingle</span> : null}
                    </header>
                    <p>{post.body}</p>
                    <footer>
                      <span>{post.stats?.likes || 0} likes</span>
                      <span>{post.stats?.comments || 0} commentaires</span>
                      <span>{post.stats?.shares || 0} partages</span>
                      <span>{post.stats?.saves || 0} sauvegardes</span>
                    </footer>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section id="about" className="profileSection">
            <SectionTitle icon={<Globe2 size={18} />} title="A propos" />
            <p className="aboutCopy">
              {profile.bio ||
                valueList([profile.currentJobTitle || profile.profession, profile.currentCompany, profile.currentIndustry]).join(' - ') ||
                'Ce membre construit son identite professionnelle sur Communium.'}
            </p>
          </section>

          {experiences.length ? (
            <section id="experience" className="profileSection">
              <SectionTitle icon={<BriefcaseBusiness size={18} />} title="Experiences" />
              <div className="timeline">
                {experiences.map((experience) => (
                  <article key={experience.id}>
                    <div>
                      <strong>{experience.jobTitle}</strong>
                      <span>{valueList([experience.company, experience.location]).join(' - ')}</span>
                      <small>
                        {formatDate(experience.startDate)}
                        {experience.isCurrent ? ' - aujourd hui' : experience.endDate ? ` - ${formatDate(experience.endDate)}` : ''}
                      </small>
                    </div>
                    {experience.description ? <p>{experience.description}</p> : null}
                    {experience.skillsUsed?.length ? <TagList items={experience.skillsUsed} /> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {education.length ? (
            <section id="education" className="profileSection">
              <SectionTitle icon={<BadgeCheck size={18} />} title="Formation" />
              <div className="educationGrid">
                {education.map((item) => (
                  <article key={`${item.school}-${item.degree}-${item.years}`}>
                    <strong>{item.school || 'Formation'}</strong>
                    <span>{valueList([item.degree, item.years]).join(' - ')}</span>
                    {item.certificate ? <small>{item.certificate}</small> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {hasRightRail ? (
          <aside className="publicRight">
            {contactLinks.length ? (
              <ProfileCard title="Contact">
              <div className="linkStack">
                {contactLinks.map((item) => (
                  <a key={item.label} href={item.href}>{item.label}</a>
                ))}
              </div>
              </ProfileCard>
            ) : null}

            {hasDocuments ? (
              <ProfileCard title="Documents" id="documents">
                {documents.length ? (
              <div className="documentStack">
                {documents.map((document) => (
                  <a key={document.id} href={assetUrl(document.fileUrl, browserBackendUrl)} target="_blank" rel="noreferrer">
                    <FileText size={16} />
                    <span>{document.title}</span>
                  </a>
                ))}
              </div>
                ) : profile.cvDownloadUrl ? (
              <a className="documentLink" href={assetUrl(profile.cvDownloadUrl, browserBackendUrl)} target="_blank" rel="noreferrer">
                <FileText size={16} />
                CV
              </a>
                ) : null}
              </ProfileCard>
            ) : null}

            {gallery.length ? (
              <ProfileCard title="Medias" id="media">
              <div className="miniGallery">
                {gallery.slice(0, 6).map((item) => (
                  <a key={`${item.kind}-${item.title}`} href={item.url} target="_blank" rel="noreferrer">
                    <img src={item.url} alt={item.title} />
                    <span>{item.kind}</span>
                  </a>
                ))}
              </div>
              </ProfileCard>
            ) : null}
          </aside>
        ) : null}
      </section>

      <PublicProfileStyles />
    </main>
  );
}

function ProfileCard({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className="profileCard" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <header className="sectionTitle">
      <span>{icon}</span>
      <h2>{title}</h2>
    </header>
  );
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <p className="infoLine">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="tagList">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function PublicProfileStyles() {
  return (
    <style>{`
      .publicProfilePage {
        color: #0f172a;
        padding: 16px 8px 40px;
      }

      .publicHero,
      .profileCard,
      .profileSection {
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
      }

      .publicHero {
        width: min(1540px, 100%);
        margin: 0 auto 18px;
        overflow: hidden;
        border-radius: 24px;
      }

      .publicCover {
        position: relative;
        min-height: 250px;
        background:
          linear-gradient(120deg, rgba(15, 23, 42, 0.96), rgba(29, 78, 216, 0.88)),
          linear-gradient(90deg, rgba(255, 255, 255, 0.16), transparent);
        background-size: cover;
        background-position: center;
      }

      .coverMesh {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
        background-size: 48px 48px;
        opacity: 0.5;
      }

      .publicHeroBody {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 18px;
        align-items: end;
        padding: 0 24px 22px;
        margin-top: -74px;
        position: relative;
      }

      .publicAvatar {
        width: 150px;
        height: 150px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 50%;
        border: 6px solid #ffffff;
        background: #0f172a;
        color: #ffffff;
        box-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
        font-size: 2.4rem;
        font-weight: 900;
      }

      .publicAvatar img,
      .miniGallery img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .publicIdentity {
        min-width: 0;
        padding-top: 78px;
      }

      .publicIdentity h1 {
        margin: 0;
        font-size: clamp(2rem, 3.3vw, 3.8rem);
        line-height: 1;
        letter-spacing: 0;
      }

      .publicHeadline {
        margin: 8px 0 0;
        color: #334155;
        font-size: 1.02rem;
        font-weight: 800;
      }

      .publicMeta,
      .publicActions,
      .publicTabs,
      .tagList,
      .publicPost footer {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .publicMeta {
        margin-top: 12px;
      }

      .publicMeta span,
      .tagList span,
      .publicPost header span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        background: #f8fafc;
        color: #334155;
        padding: 6px 10px;
        font-size: 0.84rem;
        font-weight: 850;
      }

      .bioText,
      .aboutCopy,
      .quietText,
      .emptySurface p,
      .timeline p {
        color: #475569;
        line-height: 1.7;
      }

      .bioText {
        max-width: 760px;
        margin: 14px 0 0;
      }

      .publicActions {
        justify-content: flex-end;
        align-self: end;
        max-width: 330px;
      }

      .primaryAction,
      .softAction,
      .linkStack a,
      .documentStack a,
      .documentLink {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        font-weight: 900;
        text-decoration: none;
      }

      .primaryAction {
        background: #0f172a;
        color: #ffffff;
        padding: 0 18px;
      }

      .softAction {
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: #ffffff;
        color: #0f172a;
        padding: 0 14px;
      }

      .publicTabs {
        border-top: 1px solid rgba(148, 163, 184, 0.18);
        padding: 0 24px;
        overflow-x: auto;
      }

      .publicTabs a {
        color: #334155;
        padding: 16px 4px;
        font-weight: 900;
        text-decoration: none;
        white-space: nowrap;
      }

      .publicProfileGrid {
        width: min(1540px, 100%);
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr) 300px;
        gap: 16px;
        align-items: start;
        margin: 0 auto;
      }

      .publicProfileGrid.noRight {
        grid-template-columns: 300px minmax(0, 1fr);
      }

      .publicLeft,
      .publicRight {
        display: grid;
        gap: 14px;
        position: sticky;
        top: 120px;
      }

      .publicMain {
        display: grid;
        gap: 16px;
      }

      .profileCard,
      .profileSection {
        border-radius: 18px;
        padding: 18px;
      }

      .profileCard h2,
      .sectionTitle h2 {
        margin: 0;
        font-size: 1rem;
      }

      .sectionTitle {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }

      .sectionTitle > span {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: rgba(29, 78, 216, 0.1);
        color: #1d4ed8;
      }

      .infoLine {
        display: grid;
        gap: 4px;
        margin: 12px 0 0;
      }

      .infoLine span,
      .publicPost small,
      .timeline small,
      .educationGrid small {
        color: #64748b;
        font-size: 0.84rem;
        font-weight: 750;
      }

      .linkStack,
      .documentStack,
      .postFeed,
      .timeline,
      .educationGrid {
        display: grid;
        gap: 10px;
      }

      .linkStack a,
      .documentStack a,
      .documentLink {
        justify-content: flex-start;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: #f8fafc;
        color: #0f172a;
        padding: 0 12px;
      }

      .publicPost,
      .timeline article,
      .educationGrid article,
      .emptySurface {
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 16px;
        background: #ffffff;
        padding: 15px;
      }

      .publicPost.pinned {
        border-color: rgba(29, 78, 216, 0.32);
      }

      .publicPost header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .publicPost p {
        white-space: pre-line;
        line-height: 1.7;
      }

      .publicPost footer span {
        color: #64748b;
        font-size: 0.84rem;
        font-weight: 800;
      }

      .timeline article,
      .educationGrid article {
        display: grid;
        gap: 8px;
      }

      .timeline article > div,
      .educationGrid article {
        display: grid;
        gap: 4px;
      }

      .miniGallery {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .miniGallery a {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: 14px;
        background: #e2e8f0;
      }

      .miniGallery span {
        position: absolute;
        left: 7px;
        bottom: 7px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        color: #0f172a;
        padding: 4px 8px;
        font-size: 0.72rem;
        font-weight: 900;
      }

      .mediaEmpty {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        font-weight: 800;
      }

      @media (max-width: 1180px) {
        .publicProfileGrid {
          grid-template-columns: 280px minmax(0, 1fr);
        }

        .publicRight {
          position: static;
          grid-column: 1 / -1;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 820px) {
        .publicHeroBody,
        .publicProfileGrid,
        .publicRight {
          grid-template-columns: 1fr;
        }

        .publicHeroBody {
          align-items: start;
          padding: 0 16px 18px;
        }

        .publicIdentity {
          padding-top: 0;
        }

        .publicActions {
          justify-content: flex-start;
          max-width: none;
        }

        .publicAvatar {
          width: 126px;
          height: 126px;
        }

        .publicLeft,
        .publicRight {
          position: static;
        }

        .publicCover {
          min-height: 210px;
        }
      }
    `}</style>
  );
}
