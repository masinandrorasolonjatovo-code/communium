'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, FileText, RefreshCcw, ShieldCheck, UserRound } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { localizeHref } from '@/components/locale-path';

interface Profile {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  profilePictureUrl?: string | null;
  bannerUrl?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  primarySkills?: string[];
  languages?: string[];
  education?: Array<Record<string, unknown>>;
  cvUrl?: string | null;
  publicProfileUrl?: string | null;
  verificationStatus?: string | null;
  professionalExperiences?: Array<Record<string, unknown>>;
  interests?: Array<Record<string, unknown>>;
  privacySettings?: {
    profileVisibility?: string;
    emailVisibility?: string;
    phoneVisibility?: string;
    cvVisibility?: string;
    allowNetworkingRequests?: boolean;
  };
}

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href: string;
}

const apiBase = '/api/profile';

export default function ProfileCompletionSettingsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || 'fr';
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const profileHref = localizeHref(locale, '/dashboard/profile');
  const verificationHref = localizeHref(locale, '/profile/settings/verification');
  const privacyHref = localizeHref(locale, '/profile/settings/privacy');
  const signInHref = localizeHref(locale, '/auth/sign-in');

  async function headers() {
    const token = await getToken();
    const result = new Headers();
    result.set('Content-Type', 'application/json');

    if (token) {
      result.set('Authorization', `Bearer ${token}`);
    }

    if (user?.fullName) {
      result.set('x-user-name', user.fullName);
    }

    if (user?.primaryEmailAddress?.emailAddress) {
      result.set('x-user-email', user.primaryEmailAddress.emailAddress);
    }

    if (user?.username) {
      result.set('x-user-username', user.username);
    }

    return result;
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/me`, {
        headers: await headers(),
        cache: 'no-store',
      });
      const body = (await response.json()) as { success: boolean; data?: Profile; error?: string };

      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error || 'Profil indisponible');
      }

      setProfile(body.data);
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  const checklist = useMemo<ChecklistItem[]>(() => {
    const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');

    return [
      {
        id: 'identity',
        label: 'Identite claire',
        detail: 'Nom complet, username et URL publique coherents.',
        done: Boolean(fullName && profile?.publicProfileUrl),
        href: profileHref,
      },
      {
        id: 'visuals',
        label: 'Photo et couverture',
        detail: 'Avatar net, couverture responsive et recadrage propre.',
        done: Boolean(profile?.profilePictureUrl && profile?.bannerUrl),
        href: profileHref,
      },
      {
        id: 'headline',
        label: 'Positionnement professionnel',
        detail: 'Titre, entreprise, localisation et secteur renseignes.',
        done: Boolean(profile?.currentJobTitle && profile?.currentCompany && profile?.city && profile?.country),
        href: profileHref,
      },
      {
        id: 'about',
        label: 'Resume et expertise',
        detail: 'Bio courte, competences, langues et domaines visibles.',
        done: Boolean(profile?.bio && profile?.primarySkills?.length && profile?.languages?.length),
        href: profileHref,
      },
      {
        id: 'experience',
        label: 'Parcours',
        detail: 'Experiences, formation et centres d interet structurent le profil.',
        done: Boolean(profile?.professionalExperiences?.length && profile?.education?.length && profile?.interests?.length),
        href: profileHref,
      },
      {
        id: 'documents',
        label: 'Documents',
        detail: 'CV ou portfolio PDF ajoute, avec une visibilite controlee.',
        done: Boolean(profile?.cvUrl),
        href: profileHref,
      },
      {
        id: 'privacy',
        label: 'Confidentialite',
        detail: 'Profil, email, telephone, CV et demandes reseau parametrables.',
        done: Boolean(profile?.privacySettings?.profileVisibility && profile?.privacySettings?.cvVisibility),
        href: privacyHref,
      },
      {
        id: 'verification',
        label: 'KYC / KYB',
        detail: 'Verification personnelle ou entreprise pour renforcer la confiance.',
        done: profile?.verificationStatus === 'VERIFIED',
        href: verificationHref,
      },
    ];
  }, [profile, profileHref, privacyHref, verificationHref]);

  const doneCount = checklist.filter((item) => item.done).length;
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;
  const nextItems = checklist.filter((item) => !item.done).slice(0, 3);

  if (!isLoaded || loading) {
    return (
      <main className="completionPage">
        <section className="loadingPanel">
          <h1>Completion du profil</h1>
          <p>Chargement des recommandations.</p>
        </section>
        <CompletionStyles />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="completionPage">
        <section className="loadingPanel">
          <h1>Completion du profil</h1>
          <p>Connectez-vous pour optimiser votre profil Communium.</p>
          <Link href={signInHref} className="primaryButton">Se connecter</Link>
        </section>
        <CompletionStyles />
      </main>
    );
  }

  return (
    <main className="completionPage">
      <section className="completionHeader">
        <div>
          <p className="eyebrow">Parametres profil</p>
          <h1>Completion du profil</h1>
          <p>Une checklist privee pour garder un profil public propre, credible et pret a etre partage.</p>
        </div>
        <div className="headerActions">
          <button type="button" className="softButton" onClick={loadProfile}>
            <RefreshCcw size={16} />
            Actualiser
          </button>
          <Link href={profileHref} className="primaryButton">
            <UserRound size={16} />
            Ouvrir le profil
          </Link>
        </div>
      </section>

      {notice ? <p className="notice">{notice}</p> : null}

      <section className="completionGrid">
        <article className="progressPanel">
          <div className="progressRing" style={{ '--progress': `${progress}%` } as CSSProperties}>
            <span>{progress}%</span>
          </div>
          <div>
            <h2>{doneCount} sur {checklist.length} elements prets</h2>
            <p>Cette progression reste privee et n apparait pas sur le profil public.</p>
          </div>
        </article>

        <article className="recommendPanel">
          <h2>Priorites</h2>
          {nextItems.length ? (
            <div className="priorityStack">
              {nextItems.map((item) => (
                <Link key={item.id} href={item.href}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p>Le profil est pret. Gardez vos publications, medias et documents a jour.</p>
          )}
        </article>
      </section>

      <section className="checklistPanel">
        <header>
          <h2>Checklist</h2>
          <div className="checkActions">
            <Link href={privacyHref} className="softButton">
              <ShieldCheck size={16} />
              Confidentialite
            </Link>
            <Link href={verificationHref} className="softButton">
              <FileText size={16} />
              Verification
            </Link>
          </div>
        </header>

        <div className="checklist">
          {checklist.map((item) => (
            <Link key={item.id} href={item.href} className={item.done ? 'checkItem done' : 'checkItem'}>
              <span>
                <CheckCircle2 size={18} />
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CompletionStyles />
    </main>
  );
}

function CompletionStyles() {
  return (
    <style>{`
      .completionPage {
        min-height: calc(100vh - 120px);
        color: #0f172a;
        padding: 18px 10px 36px;
      }

      .completionHeader,
      .completionGrid,
      .checklistPanel,
      .loadingPanel {
        width: min(1380px, 100%);
        margin: 0 auto;
      }

      .completionHeader,
      .progressPanel,
      .recommendPanel,
      .checklistPanel,
      .loadingPanel {
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
      }

      .completionHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 24px;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: #1d4ed8;
        font-size: 0.78rem;
        font-weight: 900;
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
        font-size: clamp(2rem, 4vw, 3.4rem);
      }

      .completionHeader p,
      .progressPanel p,
      .recommendPanel p,
      .checkItem p,
      .notice {
        color: #475569;
        line-height: 1.65;
      }

      .headerActions,
      .checkActions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .primaryButton,
      .softButton {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        padding: 0 16px;
        font-weight: 900;
        text-decoration: none;
        cursor: pointer;
      }

      .primaryButton {
        border: 0;
        background: #0f172a;
        color: #ffffff;
      }

      .softButton {
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: #ffffff;
        color: #0f172a;
      }

      .completionGrid {
        display: grid;
        grid-template-columns: 0.9fr 1.1fr;
        gap: 16px;
        margin-top: 16px;
      }

      .progressPanel,
      .recommendPanel,
      .checklistPanel,
      .loadingPanel {
        padding: 22px;
      }

      .progressPanel {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 18px;
      }

      .progressRing {
        --progress: 0%;
        width: 132px;
        height: 132px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: conic-gradient(#1d4ed8 var(--progress), #e2e8f0 0);
      }

      .progressRing span {
        width: 94px;
        height: 94px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #ffffff;
        font-size: 1.65rem;
        font-weight: 950;
      }

      .priorityStack,
      .checklist {
        display: grid;
        gap: 10px;
      }

      .priorityStack a,
      .checkItem {
        display: grid;
        gap: 4px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 16px;
        background: #f8fafc;
        color: #0f172a;
        padding: 14px;
        text-decoration: none;
      }

      .priorityStack span {
        color: #475569;
      }

      .checklistPanel {
        margin-top: 16px;
      }

      .checklistPanel header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .checkItem {
        grid-template-columns: auto minmax(0, 1fr);
        align-items: start;
      }

      .checkItem > span {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #e2e8f0;
        color: #64748b;
      }

      .checkItem.done {
        border-color: rgba(22, 163, 74, 0.28);
        background: #f0fdf4;
      }

      .checkItem.done > span {
        background: #16a34a;
        color: #ffffff;
      }

      .checkItem p {
        margin: 4px 0 0;
      }

      .notice {
        width: min(1380px, 100%);
        margin: 12px auto 0;
        border: 1px solid rgba(245, 158, 11, 0.24);
        border-radius: 14px;
        background: #fffbeb;
        padding: 12px 14px;
        font-weight: 800;
      }

      .loadingPanel {
        display: grid;
        gap: 12px;
        margin-top: 36px;
        text-align: center;
      }

      @media (max-width: 820px) {
        .completionHeader,
        .progressPanel,
        .checklistPanel header {
          align-items: stretch;
          flex-direction: column;
          grid-template-columns: 1fr;
        }

        .completionGrid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}
