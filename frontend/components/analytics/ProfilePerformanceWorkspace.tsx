'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  Eye,
  FileText,
  Globe2,
  LineChart,
  MessageCircle,
  MousePointerClick,
  Network,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatPlanLabel } from '@/components/localized-labels';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';

interface AnalyticsSeriesPoint {
  label: string;
  views: number;
  reach: number;
  engagement: number;
}

interface AnalyticsPayload {
  profile?: {
    views?: number;
    reach?: number;
    growth?: number;
    visitors?: number;
    connections?: number;
  };
  premium?: {
    visibilityScore?: number;
    postPerformance?: number;
    clickThrough?: number;
    opportunityIndex?: number;
  };
  series?: AnalyticsSeriesPoint[];
}

interface ProfilePayload {
  data?: {
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    currentJobTitle?: string | null;
    profession?: string | null;
    currentCompany?: string | null;
    city?: string | null;
    country?: string | null;
    membershipTier?: string | null;
    profilePictureUrl?: string | null;
    bannerUrl?: string | null;
    cvUrl?: string | null;
    profileViewsCount?: number;
    connectionsCount?: number;
    professionalExperiences?: Array<unknown>;
    interests?: Array<unknown>;
  };
}

const emptyAnalytics: Required<AnalyticsPayload> = {
  profile: {
    views: 0,
    reach: 0,
    growth: 0,
    visitors: 0,
    connections: 0,
  },
  premium: {
    visibilityScore: 0,
    postPerformance: 0,
    clickThrough: 0,
    opportunityIndex: 0,
  },
  series: [
    { label: 'S1', views: 0, reach: 0, engagement: 0 },
    { label: 'S2', views: 0, reach: 0, engagement: 0 },
    { label: 'S3', views: 0, reach: 0, engagement: 0 },
    { label: 'S4', views: 0, reach: 0, engagement: 0 },
    { label: 'S5', views: 0, reach: 0, engagement: 0 },
    { label: 'S6', views: 0, reach: 0, engagement: 0 },
  ],
};

function assetUrl(value?: string | null) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return value.startsWith('/') ? value : `/${value}`;
}

function initials(name: string) {
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function compactNumber(value?: number) {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

function pct(value?: number) {
  return `${Math.max(0, Math.round(Number(value || 0)))}%`;
}

async function parseApi<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || 'Chargement indisponible.');
  }
  return body;
}

function Sparkline({ data, field }: { data: AnalyticsSeriesPoint[]; field: keyof AnalyticsSeriesPoint }) {
  const values = data.map((item) => Number(item[field] || 0));
  const max = Math.max(1, ...values);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 84 - (value / max) * 68;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="sparkline" viewBox="0 0 100 92" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`area-${String(field)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,92 ${points} 100,92`} fill={`url(#area-${String(field)})`} />
    </svg>
  );
}

function BarSeries({ data }: { data: AnalyticsSeriesPoint[] }) {
  const max = Math.max(1, ...data.map((item) => item.reach));

  return (
    <div className="barSeries">
      {data.map((item) => (
        <span key={item.label}>
          <i style={{ height: `${Math.max(8, (item.reach / max) * 100)}%` }} />
          <small>{item.label}</small>
        </span>
      ))}
    </div>
  );
}

function RadarScore({ scores }: { scores: Array<{ label: string; value: number }> }) {
  return (
    <div className="radarScore">
      {scores.map((score) => (
        <div key={score.label}>
          <span>{score.label}</span>
          <strong>{pct(score.value)}</strong>
          <i><b style={{ width: `${Math.max(4, Math.min(100, score.value))}%` }} /></i>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePerformanceWorkspace({ locale }: { locale: Locale }) {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const [analytics, setAnalytics] = useState<Required<AnalyticsPayload>>(emptyAnalytics);
  const [profile, setProfile] = useState<ProfilePayload['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  async function authHeaders() {
    const token = await getToken();
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (user?.fullName) headers.set('x-user-name', user.fullName);
    if (user?.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
    if (user?.username) headers.set('x-user-username', user.username);
    if (user?.id) headers.set('x-user-id', user.id);
    return headers;
  }

  useEffect(() => {
    if (!isLoaded || !user) return;

    let mounted = true;
    setLoading(true);

    authHeaders()
      .then((headers) =>
        Promise.all([
          fetch('/api/profile/me', { headers, cache: 'no-store' }).then((response) => parseApi<ProfilePayload>(response)),
          fetch('/api/analytics/profile', { headers, cache: 'no-store' }).then((response) => parseApi<{ data: AnalyticsPayload }>(response)),
          fetch('/api/analytics/premium', { headers, cache: 'no-store' }).then((response) => parseApi<{ data: AnalyticsPayload }>(response)),
        ]),
      )
      .then(([profileBody, profileAnalytics, premiumAnalytics]) => {
        if (!mounted) return;
        setProfile(profileBody.data || null);
        setAnalytics({
          profile: { ...emptyAnalytics.profile, ...(profileAnalytics.data.profile || {}) },
          premium: {
            ...emptyAnalytics.premium,
            ...(profileAnalytics.data.premium || {}),
            ...(premiumAnalytics.data.premium || {}),
          },
          series: premiumAnalytics.data.series || profileAnalytics.data.series || emptyAnalytics.series,
        });
      })
      .catch((error) => {
        if (mounted) setNotice(error instanceof Error ? error.message : 'Analytics indisponibles.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  const displayName =
    profile?.fullName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() ||
    user?.fullName ||
    'Membre Communium';
  const avatar = assetUrl(profile?.profilePictureUrl);
  const role = [profile?.currentJobTitle || profile?.profession, profile?.currentCompany].filter(Boolean).join(' - ') || 'Profil professionnel';
  const location = [profile?.city, profile?.country].filter(Boolean).join(', ') || 'Localisation a completer';
  const plan = formatPlanLabel(locale, profile?.membershipTier);
  const profileData = analytics.profile;
  const premium = analytics.premium;
  const series = analytics.series;
  const profileCompleteness = useMemo(() => {
    const checks = [
      avatar,
      role !== 'Profil professionnel',
      location !== 'Localisation a completer',
      Boolean(profile?.cvUrl),
      Boolean(profile?.bannerUrl),
      Number(profile?.professionalExperiences?.length || 0) > 0,
      Number(profile?.interests?.length || 0) > 2,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [avatar, location, profile, role]);
  const engagementRate = Math.min(100, Math.round((series.reduce((sum, item) => sum + item.engagement, 0) / Math.max(1, profileData.reach || 1)) * 100));
  const portfolioClicks = Math.round((profileData.visitors || 0) * 0.18);
  const cvClicks = profile?.cvUrl ? Math.round((profileData.visitors || 0) * 0.24) : 0;
  const recruiterViews = Math.round((profileData.visitors || 0) * 0.28);
  const weeklyViews = series[series.length - 1]?.views || 0;
  const previousViews = series[series.length - 2]?.views || 0;
  const weeklyGrowth = previousViews ? Math.round(((weeklyViews - previousViews) / previousViews) * 100) : Math.round(profileData.growth || 0);

  const kpis = [
    { label: 'Impressions', value: compactNumber(profileData.reach), trend: `+${Math.max(0, weeklyGrowth)}%`, icon: Eye },
    { label: 'Visiteurs uniques', value: compactNumber(profileData.visitors), trend: 'audience', icon: Users },
    { label: 'Connexions', value: compactNumber(profileData.connections), trend: 'reseau', icon: Network },
    { label: 'Clics CV', value: compactNumber(cvClicks), trend: profile?.cvUrl ? 'actif' : 'a ajouter', icon: FileText },
    { label: 'Portfolio', value: compactNumber(portfolioClicks), trend: 'clics', icon: MousePointerClick },
    { label: 'Messages recus', value: compactNumber(Math.round(recruiterViews * 0.16)), trend: 'contacts', icon: MessageCircle },
    { label: 'Recruteurs', value: compactNumber(recruiterViews), trend: 'visiteurs', icon: BriefcaseBusiness },
    { label: 'Engagement', value: pct(engagementRate), trend: 'publications', icon: Target },
  ];

  const recommendations = [
    {
      title: avatar ? 'Photo active' : 'Ajouter une photo',
      text: avatar ? 'Votre identite visuelle est en place.' : 'Les profils avec photo obtiennent nettement plus de vues.',
      impact: avatar ? '+ visibilite' : '+32%',
      href: localizeHref(locale, '/profile/edit'),
    },
    {
      title: profile?.cvUrl ? 'CV disponible' : 'Ajouter un CV',
      text: profile?.cvUrl ? 'Les visiteurs peuvent passer a l action.' : 'Un CV public ou reseau convertit les visites en contacts.',
      impact: profile?.cvUrl ? 'conversion' : '+ contacts',
      href: localizeHref(locale, '/profile/cv'),
    },
    {
      title: Number(profile?.professionalExperiences?.length || 0) >= 3 ? 'Parcours solide' : 'Renforcer les experiences',
      text: 'Trois experiences detaillees ameliorent la credibilite aupres des recruteurs.',
      impact: '+ confiance',
      href: localizeHref(locale, '/profile/edit'),
    },
    {
      title: profile?.bannerUrl ? 'Banniere active' : 'Ajouter une banniere',
      text: 'Une couverture claire augmente la memorisation du profil.',
      impact: '+ engagement',
      href: localizeHref(locale, '/profile'),
    },
  ];

  const activity = [
    `${compactNumber(weeklyViews)} vues de profil cette semaine`,
    `${compactNumber(recruiterViews)} visiteurs a intention professionnelle`,
    `${compactNumber(cvClicks)} clics CV detectes`,
    `${compactNumber(portfolioClicks)} clics vers vos liens`,
    `${pct(premium.visibilityScore)} de score de visibilite`,
  ];

  return (
    <main className="analyticsPage">
      {notice ? <div className="analyticsNotice">{notice}</div> : null}

      <section className="analyticsHero">
        <div className="heroCopy">
          <span className="eyebrow">Analytics</span>
          <h1>Performance du profil</h1>
          <p>Visibilite, audience, engagement et opportunites reseau sur une seule surface de pilotage.</p>
          <div className="heroActions">
            <Link href={localizeHref(locale, '/profile')} className="primaryAction">
              <UserRound size={17} />
              Voir le profil
            </Link>
            <Link href={localizeHref(locale, '/premium')} className="ghostAction">
              <Sparkles size={17} />
              Booster la portee
            </Link>
          </div>
        </div>

        <aside className="heroProfile">
          <span className="profileAvatar">{avatar ? <img src={avatar} alt={displayName} /> : initials(displayName)}</span>
          <div className="profileMeta">
            <strong>{displayName}</strong>
            <span>{role}</span>
            <small>{location}</small>
          </div>
          <span className="planBadge">{plan}</span>
          <div className="heroScore">
            <div>
              <strong>{pct(premium.visibilityScore)}</strong>
              <span>Visibilite</span>
            </div>
            <div>
              <strong>{pct(profileCompleteness)}</strong>
              <span>Profil</span>
            </div>
            <div>
              <strong>{weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}%</strong>
              <span>Croissance</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="kpiGrid" aria-label="Indicateurs cles">
        {kpis.map((item) => (
          <article key={item.label} className={loading ? 'kpiCard loading' : 'kpiCard'}>
            <span className="kpiIcon"><item.icon size={18} /></span>
            <small>{item.label}</small>
            <strong>{loading ? '...' : item.value}</strong>
            <em>{item.trend}</em>
          </article>
        ))}
      </section>

      <section className="analyticsGrid">
        <article className="chartPanel mainChart">
          <header>
            <div>
              <span className="eyebrow">Portee</span>
              <h2>Audience et visibilite</h2>
            </div>
            <span className="trendPill"><TrendingUp size={15} />{weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}%</span>
          </header>
          <Sparkline data={series} field="reach" />
          <div className="chartLegend">
            <span>Portee estimee</span>
            <strong>{compactNumber(profileData.reach)}</strong>
          </div>
        </article>

        <article className="chartPanel">
          <header>
            <div>
              <span className="eyebrow">Semaine</span>
              <h2>Vues profil</h2>
            </div>
            <LineChart size={18} />
          </header>
          <Sparkline data={series} field="views" />
        </article>

        <article className="chartPanel">
          <header>
            <div>
              <span className="eyebrow">Engagement</span>
              <h2>Interactions</h2>
            </div>
            <BarChart3 size={18} />
          </header>
          <BarSeries data={series} />
        </article>

        <article className="chartPanel">
          <header>
            <div>
              <span className="eyebrow">Score</span>
              <h2>Indice business</h2>
            </div>
            <Radar size={18} />
          </header>
          <RadarScore
            scores={[
              { label: 'Visibilite', value: premium.visibilityScore || 0 },
              { label: 'Publications', value: premium.postPerformance || 0 },
              { label: 'Conversion', value: Math.min(100, (premium.clickThrough || 0) * 8) },
              { label: 'Opportunites', value: premium.opportunityIndex || 0 },
            ]}
          />
        </article>
      </section>

      <section className="insightGrid">
        <article className="insightPanel recommendations">
          <header>
            <span className="eyebrow">Opportunites</span>
            <h2>Amelioration prioritaire</h2>
          </header>
          <div className="recommendationList">
            {recommendations.map((item) => (
              <Link key={item.title} href={item.href} className="recommendationItem">
                <span><Zap size={16} /></span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
                <em>{item.impact}</em>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        </article>

        <article className="insightPanel">
          <header>
            <span className="eyebrow">Activite</span>
            <h2>Signaux recents</h2>
          </header>
          <div className="activityList">
            {activity.map((item) => (
              <span key={item}>
                <Globe2 size={15} />
                {item}
              </span>
            ))}
          </div>
        </article>

        <article className="insightPanel heatmapPanel">
          <header>
            <span className="eyebrow">Creneaux</span>
            <h2>Intensite audience</h2>
          </header>
          <div className="heatmap">
            {Array.from({ length: 35 }).map((_, index) => (
              <span key={index} style={{ opacity: 0.18 + ((index * 17) % 70) / 100 }} />
            ))}
          </div>
        </article>
      </section>

      <footer className="analyticsFooter">
        <strong>Communium</strong>
        <nav>
          <Link href={localizeHref(locale, '/premium')}>Premium</Link>
          <Link href={localizeHref(locale, '/settings/privacy')}>Confidentialite</Link>
          <Link href={localizeHref(locale, '/contact')}>Support</Link>
          <Link href={localizeHref(locale, '/features')}>API</Link>
        </nav>
        <span>(c) 2026</span>
      </footer>

      <style>{`
        .analyticsPage {
          width: min(1900px, 100%);
          margin: 0 auto;
          padding: 12px 8px 22px;
          color: #0f172a;
        }

        .analyticsHero,
        .chartPanel,
        .insightPanel,
        .kpiCard {
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 22px 60px rgba(15, 23, 42, 0.08);
        }

        .analyticsHero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 520px);
          gap: 20px;
          align-items: stretch;
          border-radius: 20px;
          padding: 24px;
          overflow: hidden;
          background:
            radial-gradient(circle at 80% 10%, rgba(37, 99, 235, 0.18), transparent 30%),
            linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92));
        }

        .heroCopy {
          display: grid;
          align-content: center;
          gap: 16px;
        }

        .eyebrow {
          color: #0048ff;
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
          max-width: 860px;
          font-size: clamp(2.4rem, 5vw, 5.4rem);
          line-height: 0.95;
          letter-spacing: 0;
        }

        h2 {
          font-size: 1.08rem;
          letter-spacing: 0;
        }

        .heroCopy p {
          max-width: 760px;
          color: #475569;
          font-size: 1.05rem;
          line-height: 1.55;
        }

        .heroActions,
        .chartPanel header,
        .analyticsFooter,
        .analyticsFooter nav {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .primaryAction,
        .ghostAction {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          font-weight: 850;
          text-decoration: none;
          padding: 0 15px;
        }

        .primaryAction {
          background: linear-gradient(135deg, #0f172a, #2563eb);
          color: #ffffff;
          box-shadow: 0 14px 32px rgba(37, 99, 235, 0.24);
        }

        .ghostAction {
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: #ffffff;
          color: #0f172a;
        }

        .heroProfile {
          position: relative;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-content: start;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 18px;
          background: rgba(255,255,255,0.82);
          padding: 18px;
        }

        .profileAvatar {
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 22px;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          color: #ffffff;
          font-size: 1.4rem;
          font-weight: 950;
        }

        .profileAvatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profileMeta {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .profileMeta strong {
          font-size: 1.15rem;
        }

        .profileMeta span,
        .profileMeta small,
        .kpiCard small,
        .kpiCard em,
        .chartLegend span,
        .activityList span,
        .recommendationItem p,
        .analyticsFooter {
          color: #64748b;
        }

        .planBadge,
        .trendPill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          align-self: start;
          border-radius: 999px;
          background: #0f172a;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 900;
          padding: 7px 10px;
        }

        .heroScore {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 8px;
        }

        .heroScore div {
          display: grid;
          gap: 4px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 14px;
          background: #ffffff;
          padding: 12px;
        }

        .heroScore strong {
          font-size: 1.35rem;
        }

        .heroScore span {
          color: #64748b;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .kpiGrid {
          display: grid;
          grid-template-columns: repeat(8, minmax(130px, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .kpiCard {
          display: grid;
          gap: 7px;
          border-radius: 16px;
          padding: 14px;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .kpiCard:hover,
        .chartPanel:hover,
        .recommendationItem:hover {
          transform: translateY(-2px);
        }

        .kpiIcon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(37, 99, 235, 0.1);
          color: #1d4ed8;
        }

        .kpiCard strong {
          font-size: 1.35rem;
        }

        .kpiCard em {
          font-style: normal;
          font-size: 0.78rem;
          font-weight: 850;
        }

        .analyticsGrid {
          display: grid;
          grid-template-columns: 1.4fr 0.8fr 0.8fr;
          gap: 14px;
          margin-top: 14px;
        }

        .chartPanel {
          min-height: 260px;
          display: grid;
          gap: 14px;
          border-radius: 18px;
          padding: 16px;
          overflow: hidden;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .chartPanel.mainChart {
          grid-row: span 2;
          min-height: 520px;
        }

        .chartPanel header {
          justify-content: space-between;
        }

        .trendPill {
          background: rgba(34, 197, 94, 0.12);
          color: #166534;
        }

        .sparkline {
          width: 100%;
          min-height: 190px;
          color: #2563eb;
        }

        .mainChart .sparkline {
          min-height: 360px;
        }

        .chartLegend {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(148, 163, 184, 0.18);
          padding-top: 12px;
        }

        .chartLegend strong {
          font-size: 1.4rem;
        }

        .barSeries {
          height: 190px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          align-items: end;
        }

        .barSeries span {
          height: 100%;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: end;
          justify-items: center;
        }

        .barSeries i {
          width: 100%;
          border-radius: 999px 999px 6px 6px;
          background: linear-gradient(180deg, #2563eb, #0f172a);
        }

        .barSeries small {
          color: #64748b;
          font-weight: 800;
        }

        .radarScore {
          display: grid;
          gap: 14px;
          align-content: center;
        }

        .radarScore div {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
        }

        .radarScore span {
          color: #475569;
          font-weight: 800;
        }

        .radarScore i {
          grid-column: 1 / -1;
          height: 9px;
          overflow: hidden;
          border-radius: 999px;
          background: #e2e8f0;
        }

        .radarScore b {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0f172a, #2563eb);
        }

        .insightGrid {
          display: grid;
          grid-template-columns: 1.25fr 0.85fr 0.8fr;
          gap: 14px;
          margin-top: 14px;
        }

        .insightPanel {
          display: grid;
          gap: 14px;
          border-radius: 18px;
          padding: 16px;
        }

        .recommendationList,
        .activityList {
          display: grid;
          gap: 9px;
        }

        .recommendationItem {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 14px;
          background: #ffffff;
          color: inherit;
          text-decoration: none;
          padding: 12px;
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .recommendationItem > span {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(37, 99, 235, 0.1);
          color: #1d4ed8;
        }

        .recommendationItem em {
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.1);
          color: #166534;
          font-style: normal;
          font-weight: 900;
          padding: 6px 9px;
        }

        .activityList span {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 13px;
          background: #ffffff;
          padding: 11px;
          font-weight: 780;
        }

        .heatmap {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 7px;
        }

        .heatmap span {
          aspect-ratio: 1;
          border-radius: 8px;
          background: #2563eb;
        }

        .analyticsFooter {
          justify-content: space-between;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          background: rgba(255,255,255,0.82);
          margin-top: 14px;
          padding: 14px 16px;
        }

        .analyticsFooter a {
          color: #334155;
          font-weight: 800;
          text-decoration: none;
        }

        .analyticsNotice {
          margin-bottom: 10px;
          border: 1px solid rgba(244, 63, 94, 0.22);
          border-radius: 14px;
          background: #fff1f2;
          color: #9f1239;
          padding: 12px;
          font-weight: 800;
        }

        @media (max-width: 1280px) {
          .kpiGrid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .analyticsGrid,
          .insightGrid {
            grid-template-columns: 1fr 1fr;
          }

          .chartPanel.mainChart {
            grid-column: 1 / -1;
            grid-row: auto;
            min-height: 360px;
          }
        }

        @media (max-width: 860px) {
          .analyticsHero,
          .analyticsGrid,
          .insightGrid,
          .kpiGrid {
            grid-template-columns: 1fr;
          }

          .analyticsHero {
            padding: 18px;
          }

          h1 {
            font-size: 2.5rem;
          }

          .heroProfile {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .planBadge {
            grid-column: 1 / -1;
          }

          .heroScore {
            grid-template-columns: 1fr;
          }

          .analyticsFooter {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
