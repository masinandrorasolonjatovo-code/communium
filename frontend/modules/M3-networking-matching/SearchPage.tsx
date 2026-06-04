'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Bell, Save, Search } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import SiteFooter from '@/components/SiteFooter';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale, type Locale } from '@/i18n.config';

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const apiRoot = backendOrigin ? `${backendOrigin}/api` : '/api';

// MODULE M3-03 - Recherche avancee de membres.
interface SearchProfile {
  id: number;
  fullName?: string;
  firstName?: string | null;
  lastName?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  city?: string | null;
  country?: string | null;
  currentIndustry?: string | null;
  membershipTier?: string | null;
  matchScore?: number;
  mutualCount?: number;
  profilePictureUrl?: string | null;
  publicProfileUrl?: string | null;
}

interface SearchPost {
  id: number;
  body?: string;
  type?: string;
  author?: {
    fullName?: string;
    username?: string;
  };
}

interface SearchResult {
  profiles: SearchProfile[];
  posts: SearchPost[];
  companies: Array<{ name: string; members: number }>;
  opportunities: Array<{ id: number; title: string; subtitle?: string | null; meta?: string | null }>;
}

interface SavedSearch {
  id: number;
  name: string;
  query: string;
  filters: Record<string, string>;
  sort: string;
  alertEnabled: boolean;
  newMatches: number;
}

function profileName(profile: SearchProfile) {
  return profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Profil';
}

function assetUrl(value?: string | null) {
  if (!value) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  return value.startsWith('/') ? value : `/${value}`;
}

function profileInitials(profile: SearchProfile) {
  return profileName(profile)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'CM';
}

export default function SearchPage() {
  const params = useParams<{ locale?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const locale: Locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const isFrench = locale === 'fr';
  const query = searchParams.get('q')?.trim() || '';
  const sort = searchParams.get('sort') || 'relevance';
  const [result, setResult] = useState<SearchResult>({ profiles: [], posts: [], companies: [], opportunities: [] });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(query);
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    sector: searchParams.get('sector') || '',
    role: searchParams.get('role') || '',
    level: searchParams.get('level') || '',
    interest: searchParams.get('interest') || '',
    lookingFor: searchParams.get('lookingFor') || '',
    sort,
  });
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setSearchText(query);
    setFilters({
      city: searchParams.get('city') || '',
      sector: searchParams.get('sector') || '',
      role: searchParams.get('role') || '',
      level: searchParams.get('level') || '',
      interest: searchParams.get('interest') || '',
      lookingFor: searchParams.get('lookingFor') || '',
      sort: searchParams.get('sort') || 'relevance',
    });
  }, [query, searchParams]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    const nextQuery = searchText.trim();
    if (nextQuery) next.set('q', nextQuery);
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim() && !(key === 'sort' && value === 'relevance')) next.set(key, value.trim());
    });
    const serialized = next.toString();
    router.push(serialized ? localizeHref(locale, `/search?${serialized}`) : localizeHref(locale, '/search'));
  }

  async function authHeaders() {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (user?.id) headers.set('x-user-id', user.id);
    if (user?.fullName) headers.set('x-user-name', user.fullName);
    if (user?.username) headers.set('x-user-username', user.username);
    if (user?.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
    return headers;
  }

  async function loadSavedSearches() {
    if (!user) return;
    const response = await fetch(`${apiRoot}/search/saved`, { headers: await authHeaders(), cache: 'no-store' });
    const body = await response.json();
    if (response.ok && body.success) setSavedSearches(body.data || []);
  }

  async function saveCurrentSearch() {
    if (!user) {
      setNotice(isFrench ? 'Connexion requise pour enregistrer la recherche.' : 'Sign in to save this search.');
      return;
    }

    const response = await fetch(`${apiRoot}/search/saved`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        name: searchText.trim() || (isFrench ? 'Recherche membres' : 'Member search'),
        q: searchText.trim(),
        ...filters,
        alertEnabled: true,
      }),
    });
    const body = await response.json();
    if (response.ok && body.success) {
      setNotice(isFrench ? 'Recherche enregistree.' : 'Search saved.');
      await loadSavedSearches();
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function runSearch() {
      const hasFilters = ['city', 'sector', 'role', 'level', 'interest', 'lookingFor'].some((key) => Boolean(searchParams.get(key)));
      if (!query && !hasFilters) {
        setResult({ profiles: [], posts: [], companies: [], opportunities: [] });
        return;
      }

      setLoading(true);
      try {
        const apiParams = new URLSearchParams(searchParams.toString());
        const response = await fetch(`${apiRoot}/search?${apiParams.toString()}`, { cache: 'no-store' });
        const body = await response.json();
        if (!cancelled && response.ok && body.success) {
          setResult({
            profiles: body.profiles || [],
            posts: body.posts || [],
            companies: body.companies || [],
            opportunities: body.opportunities || [],
          });
        }
      } catch {
        if (!cancelled) {
          setResult({ profiles: [], posts: [], companies: [], opportunities: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [query, searchParams]);

  useEffect(() => {
    if (isLoaded && user) void loadSavedSearches();
  }, [isLoaded, user]);

  const total = useMemo(
    () => result.profiles.length + result.posts.length + result.companies.length + result.opportunities.length,
    [result],
  );

  return (
    <>
      <main className="searchPage">
        <section className="searchShell">
          <div className="searchHead">
            <span className="eyebrow">{isFrench ? 'Recherche membres' : 'Member search'}</span>
            <h1>{query ? `${isFrench ? 'Resultats' : 'Results'} "${query}"` : isFrench ? 'Annuaire professionnel' : 'Professional directory'}</h1>
          </div>

          <form className="searchForm" onSubmit={handleSearchSubmit} role="search" aria-label={isFrench ? 'Recherche Communium' : 'Communium search'}>
            <Search size={19} strokeWidth={2.3} />
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={isFrench ? 'Nom, entreprise, competence' : 'Name, company, skill'}
              autoComplete="off"
            />
            <button type="submit">{isFrench ? 'Rechercher' : 'Search'}</button>
          </form>

          <section className="advancedSearchPanel">
            <div className="filterGrid">
              <input value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} placeholder={isFrench ? 'Ville' : 'City'} />
              <input value={filters.sector} onChange={(event) => setFilters((current) => ({ ...current, sector: event.target.value }))} placeholder={isFrench ? 'Secteur' : 'Sector'} />
              <input value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))} placeholder={isFrench ? 'Role' : 'Role'} />
              <input value={filters.interest} onChange={(event) => setFilters((current) => ({ ...current, interest: event.target.value }))} placeholder={isFrench ? 'Interet' : 'Interest'} />
              <input value={filters.lookingFor} onChange={(event) => setFilters((current) => ({ ...current, lookingFor: event.target.value }))} placeholder={isFrench ? 'Objectif' : 'Goal'} />
              <select value={filters.level} onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value }))}>
                <option value="">{isFrench ? 'Niveau adhesion' : 'Membership level'}</option>
                <option value="Free">Free</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
              <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
                <option value="relevance">{isFrench ? 'Pertinence' : 'Relevance'}</option>
                <option value="newest">{isFrench ? 'Inscription recente' : 'Newest'}</option>
                <option value="popular">{isFrench ? 'Popularite' : 'Popularity'}</option>
              </select>
              <button type="button" onClick={() => void saveCurrentSearch()}>
                <Save size={16} />{isFrench ? 'Enregistrer' : 'Save'}
              </button>
            </div>
            {notice ? <small className="searchNotice">{notice}</small> : null}
          </section>

          {savedSearches.length ? (
            <section className="savedSearchStrip">
              {savedSearches.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams();
                    if (item.query) next.set('q', item.query);
                    Object.entries(item.filters || {}).forEach(([key, value]) => {
                      if (value) next.set(key, String(value));
                    });
                    if (item.sort && item.sort !== 'relevance') next.set('sort', item.sort);
                    router.push(localizeHref(locale, `/search?${next.toString()}`));
                  }}
                >
                  <Bell size={15} />
                  <span>{item.name}</span>
                  {item.newMatches ? <strong>{item.newMatches}</strong> : null}
                </button>
              ))}
            </section>
          ) : null}

          {loading ? <div className="searchEmpty">{isFrench ? 'Recherche en cours...' : 'Searching...'}</div> : null}
          {!loading && query && total === 0 ? (
            <div className="searchEmpty">
              <Search size={20} />
              <strong>{isFrench ? 'Aucun profil trouve' : 'No profiles found'}</strong>
              <span>
                {isFrench
                  ? 'Ajustez les filtres ou elargissez la recherche.'
                  : 'Adjust the filters or broaden the search.'}
              </span>
            </div>
          ) : null}

          <div className="resultGrid">
            {result.profiles.length ? (
              <article className="resultCard">
                <h2>{isFrench ? 'Profils' : 'Profiles'}</h2>
                {result.profiles.map((profile) => (
                  <Link key={profile.id} href={localizeHref(locale, `/u/${profile.publicProfileUrl || profile.id}`)} className="resultRow">
                    <span className="resultAvatar">
                      {assetUrl(profile.profilePictureUrl) ? <img src={assetUrl(profile.profilePictureUrl)} alt={profileName(profile)} /> : <span>{profileInitials(profile)}</span>}
                    </span>
                    <span className="resultCopy">
                      <strong>{profileName(profile)}</strong>
                      <span>{[profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ') || (isFrench ? 'Profil membre' : 'Member profile')}</span>
                      <small>{[profile.city, profile.country, profile.currentIndustry, profile.membershipTier].filter(Boolean).join(' - ')}</small>
                      {profile.matchScore ? <small>{profile.matchScore}% match</small> : null}
                    </span>
                  </Link>
                ))}
              </article>
            ) : null}

            {result.posts.length ? (
              <article className="resultCard">
                <h2>{isFrench ? 'Publications' : 'Posts'}</h2>
                {result.posts.map((post) => (
                  <Link key={post.id} href={localizeHref(locale, `/feed?post=${post.id}`)} className="resultRow">
                    <strong>{post.author?.fullName || post.author?.username || 'Communium'}</strong>
                    <span>{post.body || post.type || 'Publication'}</span>
                  </Link>
                ))}
              </article>
            ) : null}

            {result.companies.length ? (
              <article className="resultCard">
                <h2>{isFrench ? 'Entreprises' : 'Companies'}</h2>
                {result.companies.map((company) => (
                  <div key={company.name} className="resultRow">
                    <strong>{company.name}</strong>
                    <span>{company.members} {isFrench ? 'membre(s)' : 'member(s)'}</span>
                  </div>
                ))}
              </article>
            ) : null}

            {result.opportunities.length ? (
              <article className="resultCard">
                <h2>{isFrench ? 'Opportunites' : 'Opportunities'}</h2>
                {result.opportunities.map((event) => (
                  <Link key={event.id} href={localizeHref(locale, '/feed')} className="resultRow">
                    <strong>{event.title}</strong>
                    <span>{event.subtitle || event.meta || (isFrench ? 'Opportunite reseau' : 'Network opportunity')}</span>
                  </Link>
                ))}
              </article>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
      <style jsx>{`
        .searchPage {
          min-height: 100vh;
          padding: 18px;
          background: #f7f8fa;
          color: #07122f;
        }

        .searchShell {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }

        .searchHead,
        .searchForm,
        .advancedSearchPanel,
        .savedSearchStrip,
        .resultCard,
        .searchEmpty {
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
          padding: 18px;
        }

        .advancedSearchPanel {
          display: grid;
          gap: 10px;
        }

        .filterGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .filterGrid input,
        .filterGrid select {
          min-width: 0;
          min-height: 42px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 8px;
          background: #f8fafc;
          color: #07122f;
          padding: 0 12px;
          font: inherit;
          font-weight: 700;
        }

        .filterGrid button,
        .savedSearchStrip button {
          min-height: 42px;
          border: 1px solid rgba(14, 116, 144, 0.22);
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f0f9ff;
          color: #075985;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }

        .searchNotice {
          color: #075985;
          font-weight: 800;
        }

        .savedSearchStrip {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px;
        }

        .savedSearchStrip strong {
          min-width: 22px;
          min-height: 22px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: #0b57d0;
          color: #fff;
          font-size: 0.75rem;
        }

        .searchForm {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
        }

        .searchForm svg {
          color: #0050d8;
        }

        .searchForm input {
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #07122f;
          font-size: 1rem;
          font-weight: 700;
        }

        .searchForm input::placeholder {
          color: #64748b;
        }

        .searchForm button {
          border: 0;
          border-radius: 8px;
          background: #0b57d0;
          color: #fff;
          min-height: 42px;
          padding: 0 18px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.2);
        }

        .searchForm button:hover,
        .searchForm button:focus-visible {
          background: #0847ac;
          outline: none;
        }

        .eyebrow {
          color: #0050d8;
          font-size: 0.72rem;
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
          margin-top: 8px;
          font-size: clamp(1.8rem, 3vw, 2.7rem);
          line-height: 1.08;
        }

        .resultGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .resultCard {
          display: grid;
          gap: 12px;
        }

        .resultRow {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 0;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
          color: inherit;
          text-decoration: none;
        }

        .resultAvatar {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          overflow: hidden;
          background: #0f172a;
          color: #fff;
          font-weight: 900;
          border: 1px solid rgba(148, 163, 184, 0.24);
        }

        .resultAvatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .resultCopy {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .resultRow span,
        .searchHead p,
        .searchEmpty span {
          color: #475569;
        }

        .searchEmpty {
          display: grid;
          gap: 8px;
          justify-items: start;
        }

        @media (max-width: 760px) {
          .resultGrid {
            grid-template-columns: 1fr;
          }

          .searchForm {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .filterGrid {
            grid-template-columns: 1fr;
          }

          .searchForm button {
            grid-column: 1 / -1;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
