import Link from 'next/link';
import { notFound } from 'next/navigation';
import { localizeHref } from '@/components/locale-path';
import PublicExperienceFrame from '@/components/public/PublicExperienceFrame';
import PublicProfessionalProfile, {
  type PublicProfile,
  type PublicProfileDocument,
  type PublicProfileMedia,
  type PublicProfilePost,
} from '@/components/profile/PublicProfessionalProfile';

interface PublicProfilePageProps {
  params: Promise<{
    locale: string;
    profileUrl: string;
  }>;
}

const backendInternalUrl =
  process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || 'http://localhost:5000';
const browserBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

async function fetchApi<T>(path: string, fallback: T) {
  try {
    const response = await fetch(`${backendInternalUrl}${path}`, {
      cache: 'no-store',
    });
    const body = (await response.json()) as { success: boolean; data?: T };

    if (!response.ok || !body.success || body.data === undefined) {
      return fallback;
    }

    return body.data;
  } catch {
    return fallback;
  }
}

function query(value: string) {
  return encodeURIComponent(value);
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { locale, profileUrl } = await params;
  if (['public', 'preview'].includes(profileUrl.toLowerCase())) {
    notFound();
  }

  const profile = await fetchApi<PublicProfile | null>(`/api/profile/public/${query(profileUrl)}`, null);
  const homeHref = localizeHref(locale, '/');
  const profileEditorHref = localizeHref(locale, '/dashboard/profile');

  if (!profile) {
    return (
      <PublicExperienceFrame>
        <main className="profileUnavailable">
          <section>
            <h1>Profil indisponible</h1>
            <p>Ce profil est introuvable ou son acces public est ferme.</p>
            <div>
              <Link href={homeHref}>Accueil</Link>
              <Link href={profileEditorHref}>Mon profil</Link>
            </div>
          </section>
          <UnavailableStyles />
        </main>
      </PublicExperienceFrame>
    );
  }

  const [posts, media, documents] = await Promise.all([
    fetchApi<PublicProfilePost[]>(`/api/profile/posts?profileUrl=${query(profileUrl)}`, []),
    fetchApi<PublicProfileMedia>(`/api/profile/media?profileUrl=${query(profileUrl)}`, { photos: [], videos: [], projects: [] }),
    fetchApi<PublicProfileDocument[]>(`/api/profile/documents?profileUrl=${query(profileUrl)}`, []),
  ]);

  return (
    <PublicExperienceFrame>
      <PublicProfessionalProfile
        locale={locale}
        profile={profile}
        posts={posts}
        media={media}
        documents={documents}
        browserBackendUrl={browserBackendUrl}
        sourcePath={`/profile/${profileUrl}`}
      />
    </PublicExperienceFrame>
  );
}

function UnavailableStyles() {
  return (
    <style>{`
      .profileUnavailable {
        min-height: calc(100vh - 160px);
        display: grid;
        place-items: center;
        padding: 24px;
        color: #0f172a;
      }

      .profileUnavailable section {
        width: min(620px, 100%);
        display: grid;
        gap: 14px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.95);
        padding: 28px;
        text-align: center;
        box-shadow: 0 20px 55px rgba(15, 23, 42, 0.09);
      }

      .profileUnavailable h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3rem);
        letter-spacing: 0;
      }

      .profileUnavailable p {
        margin: 0;
        color: #475569;
      }

      .profileUnavailable div {
        display: flex;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .profileUnavailable a {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #0f172a;
        color: #ffffff;
        padding: 0 16px;
        font-weight: 900;
        text-decoration: none;
      }

      .profileUnavailable a + a {
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: #ffffff;
        color: #0f172a;
      }
    `}</style>
  );
}
