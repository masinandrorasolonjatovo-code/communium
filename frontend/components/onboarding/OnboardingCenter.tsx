'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe2,
  Image as ImageIcon,
  Mail,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';

type TaskStatus = 'completed' | 'in_progress' | 'pending';
type TaskCategory = 'profile' | 'privacy' | 'publishing' | 'network' | 'security';

interface OnboardingTask {
  key: string;
  category: TaskCategory;
  title: string;
  description: string;
  icon: keyof typeof iconMap;
  href: string;
  actionLabel: string;
  priority: number;
  progress: number;
  completed: boolean;
  dismissed: boolean;
  status: TaskStatus;
}

interface OnboardingSection {
  key: TaskCategory;
  title: string;
  progress: number;
  completed: number;
  total: number;
}

interface OnboardingProgress {
  user: {
    id: number;
    username?: string | null;
    email?: string | null;
  };
  profile: {
    id: number;
    fullName: string;
    currentRole: string;
    city?: string | null;
    country?: string | null;
    avatarUrl?: string | null;
    publicProfileUrl?: string | null;
    membershipTier: string;
    visibility: string;
    cvUrl?: string | null;
    verificationStatus: string;
  };
  progress: number;
  progressScale: number[];
  completedTasks: number;
  totalTasks: number;
  recommendedAction?: OnboardingTask;
  tasks: OnboardingTask[];
  sections: OnboardingSection[];
  workspace: {
    profileProgress: number;
    visibility: string;
    publicProfileActive: boolean;
    posts: number;
    visiblePosts: number;
    connections: number;
    unreadNotifications: number;
    documents: number;
    security: {
      twoFactorEnabled: boolean;
      loginAlerts: boolean;
    };
    education: number;
    languages: number;
  };
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

interface OnboardingCenterProps {
  locale: Locale;
}

const iconMap = {
  camera: Camera,
  image: ImageIcon,
  briefcase: BriefcaseBusiness,
  map: MapPin,
  shield: ShieldCheck,
  file: FileText,
  globe: Globe2,
  post: Send,
  sparkles: Sparkles,
  mail: Mail,
  bell: Bell,
};

const categoryLabels: Record<TaskCategory | 'all', string> = {
  all: 'Tout',
  profile: 'Profil',
  privacy: 'Confidentialite',
  publishing: 'Publication',
  network: 'Reseau',
  security: 'Securite',
};

function localized(locale: Locale, href: string) {
  return href.startsWith('/') ? localizeHref(locale, href) : href;
}

function unwrap<T>(payload: ApiEnvelope<T>): T {
  if (payload?.data !== undefined) {
    return payload.data;
  }

  return payload as T;
}

function initials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return 'CM';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function profileLevel(progress: number) {
  if (progress >= 85) {
    return 'Avance';
  }

  if (progress >= 65) {
    return 'Solide';
  }

  if (progress >= 40) {
    return 'En progression';
  }

  if (progress >= 15) {
    return 'A structurer';
  }

  return 'Initial';
}

function visibilityLabel(value: string) {
  if (value === 'Private') {
    return 'Prive';
  }

  if (value === 'ContactsOnly') {
    return 'Reseau';
  }

  return 'Public';
}

function statusLabel(task: OnboardingTask) {
  if (task.completed) {
    return 'Termine';
  }

  if (task.progress > 0) {
    return 'En cours';
  }

  return 'A faire';
}

function TaskIcon({ task }: { task: OnboardingTask }) {
  const Icon = (iconMap[task.icon] || Sparkles) as LucideIcon;

  return (
    <span className={task.completed ? 'taskIcon completed' : 'taskIcon'}>
      <Icon size={18} />
    </span>
  );
}

export default function OnboardingCenter({ locale }: OnboardingCenterProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [data, setData] = useState<OnboardingProgress | null>(null);
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const signInHref = localizeHref(locale, '/auth/sign-in');

  const requestOnboarding = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const token = await getToken();
      const headers = new Headers(init?.headers);

      if (!(init?.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(`/api/${path}`, {
        ...init,
        headers,
      });
      const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || 'Impossible de charger la configuration');
      }

      return unwrap<T>(payload);
    },
    [getToken]
  );

  const loadProgress = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextData = await requestOnboarding<OnboardingProgress>('onboarding/progress');
      setData(nextData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, requestOnboarding]);

  useEffect(() => {
    if (isLoaded) {
      void loadProgress();
    }
  }, [isLoaded, loadProgress]);

  async function dismissTask(taskKey: string) {
    setSavingKey(taskKey);
    setError(null);

    try {
      const nextData = await requestOnboarding<OnboardingProgress>('onboarding/task', {
        method: 'PATCH',
        body: JSON.stringify({ taskKey, dismissed: true }),
      });
      setData(nextData);
    } catch (dismissError) {
      setError(dismissError instanceof Error ? dismissError.message : 'Action impossible');
    } finally {
      setSavingKey(null);
    }
  }

  const visibleTasks = useMemo(() => {
    const tasks = data?.tasks.filter((task) => !task.dismissed) || [];

    if (activeCategory === 'all') {
      return tasks;
    }

    return tasks.filter((task) => task.category === activeCategory);
  }, [activeCategory, data?.tasks]);

  const categories = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        key: 'all' as const,
        title: categoryLabels.all,
        completed: data.completedTasks,
        total: data.totalTasks,
        progress: data.progress,
      },
      ...data.sections.map((section) => ({
        key: section.key,
        title: section.title,
        completed: section.completed,
        total: section.total,
        progress: section.progress,
      })),
    ];
  }, [data]);

  const avatarUrl = data?.profile.avatarUrl || user?.imageUrl || '';
  const memberName = data?.profile.fullName || user?.fullName || user?.username || 'Membre Communium';
  const recommendedAction = data?.recommendedAction;

  if (isLoaded && !isSignedIn) {
    return (
      <main className="onboardingPage">
        <section className="onboardingAuthCard">
          <span className="onboardingAuthIcon">
            <UserRound size={24} />
          </span>
          <div>
            <p className="sectionKicker">Configuration du compte</p>
            <h1>Connectez-vous pour continuer</h1>
            <p>Votre progression Communium est liee a votre compte.</p>
          </div>
          <Link href={signInHref} className="primaryAction">
            Se connecter
            <ChevronRight size={16} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="onboardingPage">
        <section className="onboardingHeader">
          <div className="headerCopy">
            <p className="sectionKicker">Compte</p>
            <h1>Configuration du compte</h1>
            <p>Completez votre profil et activez les fonctionnalites importantes de votre espace Communium.</p>
          </div>

          <aside className="profileStatusPanel">
            <div className="profileStatusTop">
              <div className="avatarFrame">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials(memberName)}</span>}
              </div>
              <div>
                <strong>{memberName}</strong>
                <span>{data?.profile.currentRole || 'Profil professionnel en cours'}</span>
              </div>
            </div>
            <div className="profileStatusGrid">
              <span>
                Statut
                <strong>{data?.profile.verificationStatus === 'APPROVED' ? 'Verifie' : 'A verifier'}</strong>
              </span>
              <span>
                Niveau
                <strong>{profileLevel(data?.progress || 0)}</strong>
              </span>
              <span>
                Progression
                <strong>{data?.progress || 0}%</strong>
              </span>
            </div>
            <div className="progressBar" aria-label={`Progression ${data?.progress || 0}%`}>
              <span style={{ width: `${data?.progress || 0}%` }} />
            </div>
          </aside>
        </section>

        {error ? (
          <div className="inlineNotice error">
            <span>{error}</span>
            <button type="button" onClick={loadProgress}>
              Reessayer
            </button>
          </div>
        ) : null}

        {loading ? (
          <section className="onboardingSkeleton" aria-label="Chargement">
            <span />
            <span />
            <span />
            <span />
          </section>
        ) : data ? (
          <section className="onboardingLayout">
            <aside className="onboardingSidebar">
              <div className="sidebarPanel">
                <p className="sectionKicker">Sections</p>
                {categories.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    className={activeCategory === category.key ? 'categoryButton active' : 'categoryButton'}
                    onClick={() => setActiveCategory(category.key)}
                  >
                    <span>
                      <strong>{category.title}</strong>
                      <small>
                        {category.completed}/{category.total}
                      </small>
                    </span>
                    <em>{category.progress}%</em>
                  </button>
                ))}
              </div>

              <div className="sidebarPanel compact">
                <p className="sectionKicker">Priorite</p>
                <strong>{recommendedAction?.title || 'Profil a jour'}</strong>
                <p>{recommendedAction?.description || 'Les actions principales sont terminees.'}</p>
                {recommendedAction ? (
                  <Link href={localized(locale, recommendedAction.href)} className="secondaryAction">
                    {recommendedAction.actionLabel}
                    <ChevronRight size={15} />
                  </Link>
                ) : null}
              </div>
            </aside>

            <section className="checklistPanel">
              <div className="panelHeader">
                <div>
                  <p className="sectionKicker">Checklist</p>
                  <h2>Progression utilisateur</h2>
                </div>
                <button type="button" className="refreshButton" onClick={loadProgress}>
                  <RefreshCw size={15} />
                  Actualiser
                </button>
              </div>

              <div className="milestoneTrack" aria-label="Echelle de progression">
                {data.progressScale.map((step) => (
                  <span key={step} className={data.progress >= step ? 'active' : ''}>
                    {step}%
                  </span>
                ))}
              </div>

              <div className="taskList">
                {visibleTasks.length ? (
                  visibleTasks.map((task) => (
                    <article key={task.key} className={task.completed ? 'taskRow completed' : 'taskRow'}>
                      <TaskIcon task={task} />
                      <div className="taskContent">
                        <div className="taskTitleRow">
                          <strong>{task.title}</strong>
                          <span className={`statusPill ${task.status}`}>{statusLabel(task)}</span>
                        </div>
                        <p>{task.description}</p>
                        <div className="taskProgress">
                          <span style={{ width: `${task.progress}%` }} />
                        </div>
                      </div>
                      <div className="taskActions">
                        <Link href={localized(locale, task.href)} className="taskActionLink">
                          {task.actionLabel}
                        </Link>
                        {!task.completed ? (
                          <button
                            type="button"
                            aria-label={`Masquer ${task.title}`}
                            className="dismissButton"
                            onClick={() => dismissTask(task.key)}
                            disabled={savingKey === task.key}
                          >
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="emptyState">
                    <CheckCircle2 size={28} />
                    <strong>Tout est pret dans cette section.</strong>
                    <p>Les prochaines actions apparaitront quand votre activite evoluera.</p>
                  </div>
                )}
              </div>
            </section>

            <aside className="workspacePanel">
              <div className="panelHeader small">
                <div>
                  <p className="sectionKicker">Votre espace</p>
                  <h2>Etat actuel</h2>
                </div>
              </div>

              <div className="workspaceStats">
                <span>
                  Progression profil
                  <strong>{data.workspace.profileProgress}%</strong>
                </span>
                <span>
                  Visibilite
                  <strong>{visibilityLabel(data.workspace.visibility)}</strong>
                </span>
                <span>
                  Profil public
                  <strong>{data.workspace.publicProfileActive ? 'Actif' : 'Inactif'}</strong>
                </span>
                <span>
                  Publications
                  <strong>{data.workspace.posts}</strong>
                </span>
                <span>
                  Connexions
                  <strong>{data.workspace.connections}</strong>
                </span>
                <span>
                  Notifications
                  <strong>{data.workspace.unreadNotifications}</strong>
                </span>
                <span>
                  Documents
                  <strong>{data.workspace.documents}</strong>
                </span>
                <span>
                  Securite
                  <strong>{data.workspace.security.twoFactorEnabled ? '2FA activee' : 'Standard'}</strong>
                </span>
              </div>

              <div className="quickLinks">
                <Link href={localizeHref(locale, '/profile/edit')}>Modifier le profil</Link>
                <Link href={localizeHref(locale, '/settings/privacy')}>Confidentialite</Link>
                <Link href={localizeHref(locale, '/profile/cv')}>Documents</Link>
                <Link href={localizeHref(locale, '/premium')}>Premium</Link>
              </div>
            </aside>
          </section>
        ) : null}
      </main>
      <SiteFooter locale={locale} />

      <style jsx>{`
        .onboardingPage {
          width: min(1840px, calc(100% - 24px));
          margin: 16px auto 0;
          color: #07112f;
        }

        .onboardingHeader,
        .onboardingLayout,
        .onboardingAuthCard {
          border: 1px solid rgba(128, 149, 178, 0.28);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 22px 55px rgba(15, 35, 70, 0.1);
        }

        .onboardingHeader {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 520px;
          gap: 24px;
          align-items: stretch;
          border-radius: 24px;
          padding: 26px;
        }

        .headerCopy {
          display: flex;
          min-height: 210px;
          flex-direction: column;
          justify-content: center;
        }

        .sectionKicker {
          margin: 0 0 8px;
          color: #0648d9;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          max-width: 820px;
          font-size: clamp(2.25rem, 4vw, 4.6rem);
          line-height: 0.98;
          letter-spacing: 0;
        }

        h2 {
          font-size: 1.45rem;
          line-height: 1.1;
          letter-spacing: 0;
        }

        .headerCopy > p:last-child {
          max-width: 760px;
          margin-top: 16px;
          color: #2d4363;
          font-size: 1rem;
          line-height: 1.6;
        }

        .profileStatusPanel,
        .sidebarPanel,
        .checklistPanel,
        .workspacePanel {
          border: 1px solid rgba(132, 151, 178, 0.28);
          border-radius: 18px;
          background: #fff;
        }

        .profileStatusPanel {
          display: flex;
          min-height: 210px;
          flex-direction: column;
          justify-content: space-between;
          padding: 22px;
        }

        .profileStatusTop {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .avatarFrame {
          display: grid;
          width: 74px;
          height: 74px;
          flex: 0 0 auto;
          place-items: center;
          overflow: hidden;
          border-radius: 22px;
          background: linear-gradient(145deg, #6c35ff, #0b62f4);
          color: #fff;
          font-size: 1.4rem;
          font-weight: 900;
        }

        .avatarFrame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profileStatusTop strong {
          display: block;
          font-size: 1.08rem;
        }

        .profileStatusTop span {
          display: block;
          margin-top: 4px;
          color: #304765;
          font-size: 0.95rem;
        }

        .profileStatusGrid,
        .workspaceStats {
          display: grid;
          gap: 10px;
        }

        .profileStatusGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .profileStatusGrid span,
        .workspaceStats span {
          border: 1px solid rgba(132, 151, 178, 0.25);
          border-radius: 14px;
          padding: 12px;
          color: #536782;
          font-size: 0.8rem;
        }

        .profileStatusGrid strong,
        .workspaceStats strong {
          display: block;
          margin-top: 5px;
          color: #07112f;
          font-size: 0.98rem;
        }

        .progressBar,
        .taskProgress {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9eff7;
        }

        .progressBar span,
        .taskProgress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #111c4e, #2469f3, #5bb5ff);
        }

        .inlineNotice {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 14px;
          border: 1px solid #f4c6c6;
          border-radius: 16px;
          background: #fff5f5;
          padding: 14px 16px;
          color: #8a1212;
        }

        .inlineNotice button,
        .refreshButton,
        .dismissButton {
          cursor: pointer;
          border: 1px solid rgba(132, 151, 178, 0.35);
          background: #fff;
          color: #07112f;
          font: inherit;
          font-weight: 800;
        }

        .inlineNotice button {
          border-radius: 999px;
          padding: 8px 12px;
        }

        .onboardingLayout {
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr) 330px;
          gap: 18px;
          margin-top: 18px;
          border-radius: 24px;
          padding: 18px;
        }

        .onboardingSidebar,
        .workspacePanel {
          align-self: start;
          position: sticky;
          top: 150px;
        }

        .sidebarPanel,
        .checklistPanel,
        .workspacePanel {
          padding: 18px;
        }

        .sidebarPanel + .sidebarPanel {
          margin-top: 14px;
        }

        .sidebarPanel.compact p {
          margin-top: 8px;
          color: #465d7d;
          line-height: 1.5;
        }

        .categoryButton {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 8px;
          cursor: pointer;
          border: 1px solid rgba(132, 151, 178, 0.25);
          border-radius: 14px;
          background: #fff;
          padding: 11px 12px;
          color: #07112f;
          text-align: left;
          font: inherit;
        }

        .categoryButton.active {
          border-color: rgba(36, 105, 243, 0.45);
          background: #f4f8ff;
        }

        .categoryButton strong,
        .categoryButton small,
        .categoryButton em {
          display: block;
        }

        .categoryButton small {
          margin-top: 3px;
          color: #60728d;
          font-size: 0.78rem;
        }

        .categoryButton em {
          color: #0648d9;
          font-size: 0.82rem;
          font-style: normal;
          font-weight: 900;
        }

        .primaryAction,
        .secondaryAction,
        .taskActionLink,
        .quickLinks a,
        .refreshButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 12px;
          text-decoration: none;
        }

        .primaryAction,
        .secondaryAction {
          margin-top: 14px;
          padding: 11px 14px;
          font-weight: 900;
        }

        .primaryAction {
          background: linear-gradient(135deg, #111c4e, #2469f3);
          color: #fff;
        }

        .secondaryAction {
          border: 1px solid rgba(36, 105, 243, 0.25);
          color: #0648d9;
        }

        .panelHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .refreshButton {
          padding: 9px 12px;
        }

        .milestoneTrack {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          margin: 10px 0 16px;
        }

        .milestoneTrack span {
          border: 1px solid rgba(132, 151, 178, 0.25);
          border-radius: 999px;
          padding: 7px 8px;
          color: #61738b;
          font-size: 0.78rem;
          font-weight: 900;
          text-align: center;
        }

        .milestoneTrack span.active {
          border-color: rgba(36, 105, 243, 0.35);
          background: #edf5ff;
          color: #0648d9;
        }

        .taskList {
          display: grid;
          gap: 10px;
        }

        .taskRow {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          border: 1px solid rgba(132, 151, 178, 0.28);
          border-radius: 16px;
          background: #fff;
          padding: 14px;
        }

        .taskRow.completed {
          background: #fbfdff;
        }

        .taskIcon {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: 14px;
          background: #edf4ff;
          color: #0648d9;
        }

        .taskIcon.completed {
          background: #eaf8ee;
          color: #0f8a46;
        }

        .taskTitleRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .taskContent p {
          margin-top: 5px;
          color: #405878;
          line-height: 1.45;
        }

        .taskProgress {
          margin-top: 10px;
          height: 6px;
        }

        .statusPill {
          border-radius: 999px;
          padding: 5px 9px;
          background: #f3f5f8;
          color: #526682;
          font-size: 0.72rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .statusPill.completed {
          background: #eaf8ee;
          color: #0f7b40;
        }

        .statusPill.in_progress {
          background: #edf5ff;
          color: #0648d9;
        }

        .taskActions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .taskActionLink {
          min-width: 96px;
          border: 1px solid rgba(36, 105, 243, 0.28);
          padding: 9px 12px;
          color: #0648d9;
          font-weight: 900;
        }

        .dismissButton {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 11px;
        }

        .workspaceStats {
          grid-template-columns: 1fr;
        }

        .quickLinks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 14px;
        }

        .quickLinks a {
          border: 1px solid rgba(132, 151, 178, 0.28);
          padding: 10px;
          color: #07112f;
          font-weight: 900;
        }

        .emptyState,
        .onboardingAuthCard,
        .onboardingSkeleton {
          border-radius: 18px;
          padding: 26px;
        }

        .emptyState {
          display: grid;
          place-items: center;
          border: 1px solid rgba(132, 151, 178, 0.25);
          color: #3d536f;
          text-align: center;
        }

        .emptyState strong {
          margin-top: 8px;
          color: #07112f;
        }

        .onboardingAuthCard {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .onboardingAuthIcon {
          display: grid;
          width: 54px;
          height: 54px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 17px;
          background: #edf5ff;
          color: #0648d9;
        }

        .onboardingSkeleton {
          display: grid;
          gap: 12px;
          margin-top: 18px;
          background: rgba(255, 255, 255, 0.9);
        }

        .onboardingSkeleton span {
          height: 76px;
          border-radius: 16px;
          background: linear-gradient(90deg, #eef3fa, #f8fbff, #eef3fa);
          background-size: 220% 100%;
          animation: shimmer 1.35s infinite;
        }

        @keyframes shimmer {
          from {
            background-position: 100% 0;
          }
          to {
            background-position: -100% 0;
          }
        }

        @media (max-width: 1180px) {
          .onboardingHeader,
          .onboardingLayout {
            grid-template-columns: 1fr;
          }

          .onboardingSidebar,
          .workspacePanel {
            position: static;
          }

          .onboardingSidebar {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 14px;
          }

          .sidebarPanel + .sidebarPanel {
            margin-top: 0;
          }
        }

        @media (max-width: 760px) {
          .onboardingPage {
            width: min(100% - 16px, 1840px);
            margin-top: 10px;
          }

          .onboardingHeader,
          .onboardingLayout {
            border-radius: 18px;
            padding: 14px;
          }

          .headerCopy {
            min-height: 0;
          }

          h1 {
            font-size: 2.25rem;
          }

          .profileStatusGrid,
          .onboardingSidebar,
          .milestoneTrack,
          .quickLinks {
            grid-template-columns: 1fr;
          }

          .taskRow {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .taskActions {
            grid-column: 1 / -1;
            justify-content: flex-end;
          }

          .taskTitleRow {
            align-items: flex-start;
            flex-direction: column;
          }

          .onboardingAuthCard {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
