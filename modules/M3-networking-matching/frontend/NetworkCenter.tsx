'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Search,
  Shield,
  SlidersHorizontal,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const apiRoot = backendOrigin ? `${backendOrigin}/api` : '/api';

// MODULE M3 - Networking, connexions et matching.
// Sous-modules couverts: M3-01 connexions, M3-02 suggestions de matching.
interface NetworkProfile {
  id: number;
  userId?: number;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  country?: string | null;
  currentJobTitle?: string | null;
  currentCompany?: string | null;
  profilePictureUrl?: string | null;
  publicProfileUrl?: string | null;
  mutualCount?: number;
  connectionStatus?: string | null;
  matchScore?: number;
  matchReasons?: string[];
  requestMessage?: string | null;
}

interface NetworkEvent {
  id: number;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  type?: string | null;
  joined?: boolean;
}

type NetworkTab = 'home' | 'invitations' | 'suggestions' | 'friends';

const networkTabs: NetworkTab[] = ['home', 'invitations', 'suggestions', 'friends'];

function profileName(profile: NetworkProfile) {
  return profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Profil';
}

function initials(profile: NetworkProfile) {
  return profileName(profile)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
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

function Avatar({ profile }: { profile: NetworkProfile }) {
  const avatar = assetUrl(profile.profilePictureUrl);

  return (
    <span className="networkAvatar">
      {avatar ? <img src={avatar} alt={profileName(profile)} /> : initials(profile)}
    </span>
  );
}

export default function NetworkCenter({ locale }: { locale: Locale }) {
  const isFrench = locale === 'fr';
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<NetworkTab>('home');
  const [suggestions, setSuggestions] = useState<NetworkProfile[]>([]);
  const [invitations, setInvitations] = useState<NetworkProfile[]>([]);
  const [sent, setSent] = useState<NetworkProfile[]>([]);
  const [friends, setFriends] = useState<NetworkProfile[]>([]);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [notice, setNotice] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [requestMessages, setRequestMessages] = useState<Record<number, string>>({});
  const [matchingFilters, setMatchingFilters] = useState({ city: '', sector: '', level: '', lookingFor: '' });

  const navItems = useMemo(
    () => [
      { key: 'home' as const, label: isFrench ? 'Accueil' : 'Home', icon: UsersRound, count: suggestions.length },
      { key: 'invitations' as const, label: isFrench ? 'Invitations' : 'Invitations', icon: UserPlus, count: invitations.length },
      { key: 'suggestions' as const, label: isFrench ? 'Suggestions' : 'Suggestions', icon: Search, count: suggestions.length },
      { key: 'friends' as const, label: isFrench ? 'Connexions' : 'Connections', icon: UsersRound, count: friends.length },
    ],
    [friends.length, invitations.length, isFrench, suggestions.length],
  );

  const authHeaders = useCallback(async () => {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (user?.id) headers.set('x-user-id', user.id);
    if (user?.fullName) headers.set('x-user-name', user.fullName);
    if (user?.username) headers.set('x-user-username', user.username);
    if (user?.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
    return headers;
  }, [getToken, user]);

  const loadNetwork = useCallback(async () => {
    if (!user) return;
    setNotice('');

    try {
      const headers = await authHeaders();
      const suggestionParams = new URLSearchParams({ limit: '24' });
      Object.entries(matchingFilters).forEach(([key, value]) => {
        if (value.trim()) suggestionParams.set(key, value.trim());
      });
      const [suggestionsResponse, connectionsResponse, eventsResponse] = await Promise.all([
        fetch(`${apiRoot}/profiles/suggestions?${suggestionParams.toString()}`, { headers, cache: 'no-store' }),
        fetch(`${apiRoot}/connections`, { headers, cache: 'no-store' }),
        fetch(`${apiRoot}/events`, { headers, cache: 'no-store' }),
      ]);

      const suggestionsBody = await suggestionsResponse.json();
      const connectionsBody = await connectionsResponse.json();
      const eventsBody = await eventsResponse.json();

      if (suggestionsResponse.ok && suggestionsBody.success) setSuggestions(suggestionsBody.data || []);
      if (connectionsResponse.ok && connectionsBody.success) {
        setInvitations(connectionsBody.data?.invitations || []);
        setSent(connectionsBody.data?.sent || []);
        setFriends(connectionsBody.data?.friends || []);
      }
      if (eventsResponse.ok && eventsBody.success) setEvents(eventsBody.data || []);
    } catch {
      setNotice(isFrench ? 'Impossible de charger le reseau pour le moment.' : 'Unable to load the network right now.');
    }
  }, [authHeaders, isFrench, matchingFilters, user]);

  useEffect(() => {
    if (isLoaded && user) void loadNetwork();
  }, [isLoaded, loadNetwork, user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && networkTabs.includes(tab as NetworkTab)) {
      setActiveTab(tab as NetworkTab);
    }
  }, [searchParams]);

  async function requestConnection(profile: NetworkProfile) {
    const id = profile.userId || profile.id;
    if (!id || busyKey) return;

    if (profile.connectionStatus === 'pending') {
      setBusyKey(`request:${id}`);
      setSuggestions((current) => current.map((item) => (item.id === profile.id ? { ...item, connectionStatus: null } : item)));

      try {
        const response = await fetch(`${apiRoot}/connections/${id}`, {
          method: 'DELETE',
          headers: await authHeaders(),
        });
        if (!response.ok) throw new Error('cancel failed');
        setNotice(isFrench ? 'Demande annulee.' : 'Request cancelled.');
        await loadNetwork();
      } catch {
        setNotice(isFrench ? 'Impossible d annuler cette demande.' : 'Unable to cancel this request.');
        await loadNetwork();
      } finally {
        setBusyKey('');
      }
      return;
    }

    setBusyKey(`request:${id}`);
    setSuggestions((current) => current.map((item) => (item.id === profile.id ? { ...item, connectionStatus: 'pending' } : item)));

    try {
      const response = await fetch(`${apiRoot}/connections/request`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ userId: id, message: requestMessages[id] || '', source: 'matching' }),
      });
      if (!response.ok) throw new Error('request failed');
      setNotice(isFrench ? 'Demande envoyee.' : 'Request sent.');
      await loadNetwork();
    } catch {
      setNotice(isFrench ? 'Impossible d envoyer cette demande.' : 'Unable to send this request.');
      await loadNetwork();
    } finally {
      setBusyKey('');
    }
  }

  async function acceptInvitation(profile: NetworkProfile) {
    const id = profile.userId || profile.id;
    if (!id || busyKey) return;
    setBusyKey(`accept:${id}`);

    try {
      const response = await fetch(`${apiRoot}/connections/${id}/accept`, {
        method: 'POST',
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error('accept failed');
      setNotice(isFrench ? 'Connexion confirmee.' : 'Connection confirmed.');
      await loadNetwork();
    } catch {
      setNotice(isFrench ? 'Impossible de confirmer cette connexion.' : 'Unable to confirm this connection.');
    } finally {
      setBusyKey('');
    }
  }

  async function refuseInvitation(profile: NetworkProfile) {
    const id = profile.userId || profile.id;
    if (!id || busyKey) return;
    setBusyKey(`refuse:${id}`);

    try {
      const response = await fetch(`${apiRoot}/connections/${id}/refuse`, {
        method: 'POST',
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error('refuse failed');
      setNotice(isFrench ? 'Demande refusee.' : 'Request declined.');
      await loadNetwork();
    } catch {
      setNotice(isFrench ? 'Impossible de refuser cette demande.' : 'Unable to decline this request.');
    } finally {
      setBusyKey('');
    }
  }

  async function blockMember(profile: NetworkProfile) {
    const id = profile.userId || profile.id;
    if (!id || busyKey) return;
    setBusyKey(`block:${id}`);

    try {
      const response = await fetch(`${apiRoot}/connections/${id}/block`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ reason: 'Blocage depuis le reseau' }),
      });
      if (!response.ok) throw new Error('block failed');
      setNotice(isFrench ? 'Membre bloque.' : 'Member blocked.');
      await loadNetwork();
    } catch {
      setNotice(isFrench ? 'Impossible de bloquer ce membre.' : 'Unable to block this member.');
    } finally {
      setBusyKey('');
    }
  }

  async function removeConnection(profile: NetworkProfile) {
    const id = profile.userId || profile.id;
    if (!id || busyKey) return;
    setBusyKey(`remove:${id}`);

    try {
      await fetch(`${apiRoot}/connections/${id}`, {
        method: 'DELETE',
        headers: await authHeaders(),
      });
      setNotice(isFrench ? 'Connexion retiree.' : 'Connection removed.');
      await loadNetwork();
    } finally {
      setBusyKey('');
    }
  }

  async function toggleEvent(event: NetworkEvent) {
    if (busyKey) return;
    setBusyKey(`event:${event.id}`);
    setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, joined: !item.joined } : item)));

    try {
      const response = await fetch(`${apiRoot}/events/${event.id}/join`, {
        method: event.joined ? 'DELETE' : 'POST',
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error('event failed');
      setNotice(event.joined ? (isFrench ? 'Inscription annulee.' : 'Registration cancelled.') : isFrench ? 'Inscription confirmee.' : 'Registration confirmed.');
      await loadNetwork();
    } catch {
      setNotice(isFrench ? 'Impossible de modifier cette participation.' : 'Unable to update this participation.');
      await loadNetwork();
    } finally {
      setBusyKey('');
    }
  }

  const shownSuggestions = activeTab === 'home' ? suggestions.slice(0, 10) : suggestions;
  const shownInvitations = activeTab === 'home' ? invitations.slice(0, 8) : invitations;

  if (isLoaded && !user) {
    return (
      <main className="networkPage">
        <section className="networkSignedOut">
          <div className="signedOutCopy">
            <span>{isFrench ? 'Reseau prive' : 'Private network'}</span>
            <h1>{isFrench ? 'Acces membre requis' : 'Member access required'}</h1>
          </div>
          <Link href={localizeHref(locale, '/auth/sign-in')} className="primaryNetworkButton">
            {isFrench ? 'Se connecter' : 'Sign in'}
          </Link>
        </section>
        <style jsx>{networkStyles}</style>
      </main>
    );
  }

  return (
    <main className="networkPage">
      <aside className="networkSidebar">
        <h1>{isFrench ? 'Reseau professionnel' : 'Professional network'}</h1>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={activeTab === item.key ? 'networkNavItem active' : 'networkNavItem'}
              onClick={() => setActiveTab(item.key)}
            >
              <span><Icon size={18} />{item.label}</span>
              {item.count ? <strong>{item.count}</strong> : null}
            </button>
          );
        })}
      </aside>

      <section className="networkContent">
        {notice ? <div className="networkNotice">{notice}</div> : null}

        <section className="networkSummary" aria-label={isFrench ? 'Synthese reseau' : 'Network summary'}>
          <article>
            <span>{isFrench ? 'Demandes recues' : 'Received requests'}</span>
            <strong>{invitations.length}</strong>
          </article>
          <article>
            <span>{isFrench ? 'Demandes envoyees' : 'Sent requests'}</span>
            <strong>{sent.length}</strong>
          </article>
          <article>
            <span>{isFrench ? 'Connexions actives' : 'Active connections'}</span>
            <strong>{friends.length}</strong>
          </article>
          <article>
            <span>{isFrench ? 'Recommandations' : 'Recommendations'}</span>
            <strong>{suggestions.length}</strong>
          </article>
        </section>

        {(activeTab === 'home' || activeTab === 'invitations') ? (
          <section className="networkSection">
            <div className="networkSectionHead">
              <h2>{isFrench ? 'Demandes recues' : 'Received requests'}</h2>
              {invitations.length ? <button type="button" onClick={() => setActiveTab('invitations')}>{isFrench ? 'Tout afficher' : 'View all'}</button> : null}
            </div>
            {shownInvitations.length ? (
              <div className="networkCardGrid">
                {shownInvitations.map((profile) => (
                  <article key={`invite-${profile.id}`} className="networkProfileCard">
                    <Avatar profile={profile} />
                    <strong>{profileName(profile)}</strong>
                    <span>{profile.mutualCount ? `${profile.mutualCount} ${isFrench ? 'connexion(s) commune(s)' : 'mutual connection(s)'}` : profile.currentJobTitle || (isFrench ? 'Profil membre' : 'Member profile')}</span>
                    <button type="button" className="primaryNetworkButton" onClick={() => void acceptInvitation(profile)} disabled={busyKey === `accept:${profile.id}`}>
                      <Check size={16} />{isFrench ? 'Accepter' : 'Accept'}
                    </button>
                    <button type="button" className="softNetworkButton" onClick={() => void refuseInvitation(profile)} disabled={busyKey === `refuse:${profile.id}`}>
                      <X size={16} />{isFrench ? 'Refuser' : 'Decline'}
                    </button>
                    <button type="button" className="softNetworkButton danger" onClick={() => void blockMember(profile)} disabled={busyKey === `block:${profile.id}`}>
                      <Shield size={16} />{isFrench ? 'Bloquer' : 'Block'}
                    </button>
                    {profile.requestMessage ? <small className="networkRequestNote">{profile.requestMessage}</small> : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="networkEmpty">{isFrench ? 'Aucune demande recue.' : 'No received requests.'}</div>
            )}
          </section>
        ) : null}

        {(activeTab === 'home' || activeTab === 'suggestions') ? (
          <section className="networkSection">
            <div className="networkSectionHead">
              <h2>{isFrench ? 'Recommandations qualifiees' : 'Qualified recommendations'}</h2>
              {suggestions.length ? <button type="button" onClick={() => setActiveTab('suggestions')}>{isFrench ? 'Tout afficher' : 'View all'}</button> : null}
            </div>
            <div className="matchingFilters" aria-label={isFrench ? 'Filtres de matching' : 'Matching filters'}>
              <SlidersHorizontal size={18} />
              <input value={matchingFilters.city} onChange={(event) => setMatchingFilters((current) => ({ ...current, city: event.target.value }))} placeholder={isFrench ? 'Ville' : 'City'} />
              <input value={matchingFilters.sector} onChange={(event) => setMatchingFilters((current) => ({ ...current, sector: event.target.value }))} placeholder={isFrench ? 'Secteur' : 'Sector'} />
              <select value={matchingFilters.level} onChange={(event) => setMatchingFilters((current) => ({ ...current, level: event.target.value }))}>
                <option value="">{isFrench ? 'Niveau adhesion' : 'Membership level'}</option>
                <option value="Free">Free</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
              <input value={matchingFilters.lookingFor} onChange={(event) => setMatchingFilters((current) => ({ ...current, lookingFor: event.target.value }))} placeholder={isFrench ? 'Objectif' : 'Goal'} />
            </div>
            <div className="networkCardGrid">
              {shownSuggestions.map((profile) => (
                <article key={`suggestion-${profile.id}`} className="networkProfileCard">
                  <Avatar profile={profile} />
                  <strong>{profileName(profile)}</strong>
                  <span>{profile.currentJobTitle || profile.currentCompany || (isFrench ? 'Profil membre' : 'Member profile')}</span>
                  {[profile.city, profile.country].filter(Boolean).length ? <small>{[profile.city, profile.country].filter(Boolean).join(', ')}</small> : null}
                  {profile.matchScore ? <small className="networkScore">{profile.matchScore}% match</small> : null}
                  {profile.matchReasons?.length ? <small>{profile.matchReasons.slice(0, 2).join(' - ')}</small> : null}
                  <textarea
                    value={requestMessages[profile.userId || profile.id] || ''}
                    onChange={(event) => setRequestMessages((current) => ({ ...current, [profile.userId || profile.id]: event.target.value }))}
                    placeholder={isFrench ? 'Contexte de la demande' : 'Request context'}
                    maxLength={500}
                  />
                  <button
                    type="button"
                    className={profile.connectionStatus ? 'softNetworkButton active' : 'primaryNetworkButton'}
                    onClick={() => void requestConnection(profile)}
                    disabled={profile.connectionStatus === 'accepted' || busyKey === `request:${profile.userId || profile.id}`}
                  >
                    <UserPlus size={16} />{profile.connectionStatus === 'pending' ? (isFrench ? 'En attente' : 'Pending') : profile.connectionStatus ? (isFrench ? 'Connecte' : 'Connected') : isFrench ? 'Demander la connexion' : 'Request connection'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'friends' ? (
          <section className="networkSection">
            <h2>{isFrench ? 'Connexions' : 'Connections'}</h2>
            {friends.length ? (
              <div className="networkList">
                {friends.map((profile) => (
                  <article key={`friend-${profile.id}`} className="networkListRow">
                    <Avatar profile={profile} />
                    <div>
                      <strong>{profileName(profile)}</strong>
                      <span>{profile.currentJobTitle || profile.currentCompany || (isFrench ? 'Connexion Communium' : 'Communium connection')}</span>
                    </div>
                    <Link href={localizeHref(locale, `/u/${profile.publicProfileUrl || profile.id}`)}>{isFrench ? 'Voir le profil' : 'View profile'}</Link>
                  </article>
                ))}
              </div>
            ) : <div className="networkEmpty">{isFrench ? 'Aucune connexion active.' : 'No active connections.'}</div>}
          </section>
        ) : null}

        <section className="networkSection">
          <h2>{isFrench ? 'Opportunites' : 'Opportunities'}</h2>
          <div className="networkList">
            {events.map((event) => {
              const Icon = event.type === 'job' ? BriefcaseBusiness : CalendarDays;
              return (
                <article key={event.id} className="networkListRow">
                  <span className="networkEventIcon"><Icon size={18} /></span>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.subtitle || event.meta || (isFrench ? 'Opportunite reseau' : 'Network opportunity')}</span>
                  </div>
                  <button type="button" className={event.joined ? 'softNetworkButton active' : 'primaryNetworkButton'} onClick={() => void toggleEvent(event)}>
                    {event.joined ? (isFrench ? 'Inscription confirmee' : 'Registered') : isFrench ? 'S inscrire' : 'Register'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </section>
      <style jsx>{networkStyles}</style>
    </main>
  );
}

const networkStyles = `
  .networkPage {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 18px;
    min-height: 100vh;
    padding: 18px;
    background: var(--canvas);
    color: var(--text-primary);
  }

  .networkSidebar,
  .networkSection,
  .networkNotice,
  .networkSignedOut {
    border: 1px solid var(--line-soft);
    border-radius: 10px;
    background: var(--surface-2);
    box-shadow: var(--shadow-soft);
  }

  .networkSidebar {
    position: sticky;
    top: 112px;
    align-self: start;
    display: grid;
    gap: 8px;
    padding: 16px;
  }

  .networkSidebar h1,
  .networkSection h2 {
    margin: 0;
  }

  .networkNavItem,
  .networkSectionHead button,
  .primaryNetworkButton,
  .softNetworkButton {
    min-height: 40px;
    border: 0;
    border-radius: 8px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .networkNavItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 12px;
    background: transparent;
    color: var(--text-primary);
    text-align: left;
  }

  .networkNavItem span,
  .primaryNetworkButton,
  .softNetworkButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .networkNavItem.active {
    background: color-mix(in srgb, var(--brand-600) 12%, transparent);
    color: var(--brand-700);
  }

  .networkContent {
    display: grid;
    gap: 18px;
  }

  .networkSummary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .networkSummary article {
    display: grid;
    gap: 6px;
    min-height: 76px;
    padding: 14px;
    border: 1px solid var(--line-soft);
    border-radius: 8px;
    background: var(--surface-2);
  }

  .networkSummary span {
    color: var(--text-secondary);
    font-size: 0.82rem;
    font-weight: 800;
  }

  .networkSummary strong {
    font-size: 1.55rem;
    line-height: 1;
  }

  .networkSection,
  .networkSignedOut {
    display: grid;
    gap: 16px;
    padding: 18px;
  }

  .networkSignedOut {
    grid-column: 1 / -1;
    justify-self: center;
    align-self: start;
    width: min(100%, 560px);
    min-height: 0;
    margin: 36px auto;
    padding: 28px;
    grid-template-rows: auto auto;
  }

  .networkSignedOut .primaryNetworkButton {
    width: fit-content;
    min-width: 150px;
    justify-self: start;
    min-height: 44px;
  }

  .signedOutCopy {
    display: grid;
    gap: 10px;
  }

  .signedOutCopy span {
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-600) 12%, transparent);
    color: var(--brand-700);
    font-size: 0.78rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .signedOutCopy h1 {
    max-width: 430px;
    margin: 0;
    font-size: clamp(2rem, 5vw, 3.4rem);
    line-height: 1.05;
    color: var(--text-primary);
  }

  .signedOutCopy p {
    max-width: 460px;
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.65;
  }

  .networkSectionHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .networkSectionHead button {
    background: transparent;
    color: var(--brand-700);
  }

  .networkCardGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .networkProfileCard {
    display: grid;
    gap: 9px;
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--line-soft);
    border-radius: 8px;
    background: var(--surface-3);
  }

  .networkAvatar {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-600) 16%, transparent);
    color: var(--brand-700);
    font-weight: 900;
  }

  .networkAvatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .networkProfileCard strong,
  .networkListRow strong {
    overflow-wrap: anywhere;
  }

  .networkProfileCard span,
  .networkProfileCard small,
  .networkListRow span,
  .networkInfoGrid span {
    color: var(--text-secondary);
  }

  .matchingFilters {
    display: grid;
    grid-template-columns: auto repeat(4, minmax(120px, 1fr));
    gap: 10px;
    align-items: center;
    padding: 10px;
    border: 1px solid var(--line-soft);
    border-radius: 8px;
    background: var(--panel-inset);
  }

  .matchingFilters svg {
    color: var(--brand-700);
  }

  .matchingFilters input,
  .matchingFilters select,
  .networkProfileCard textarea {
    width: 100%;
    min-width: 0;
    border: 1px solid var(--line-soft);
    border-radius: 8px;
    background: var(--panel-inset);
    color: var(--text-primary);
    font: inherit;
    font-weight: 700;
  }

  .matchingFilters input,
  .matchingFilters select {
    min-height: 38px;
    padding: 0 10px;
  }

  .networkProfileCard textarea {
    min-height: 70px;
    resize: vertical;
    padding: 10px;
    line-height: 1.4;
  }

  .networkScore,
  .networkRequestNote {
    font-weight: 900;
    color: var(--brand-700) !important;
  }

  .primaryNetworkButton {
    background: var(--brand-600);
    color: #ffffff;
    text-decoration: none;
    padding: 0 12px;
  }

  .softNetworkButton {
    border: 1px solid var(--line-soft);
    background: transparent;
    color: var(--text-primary);
    padding: 0 12px;
  }

  .softNetworkButton.active {
    background: color-mix(in srgb, #22c55e 18%, transparent);
    color: #16a34a;
  }

  .softNetworkButton.danger {
    background: color-mix(in srgb, #ef4444 12%, transparent);
    color: #b91c1c;
  }

  .networkList {
    display: grid;
    gap: 10px;
  }

  .networkListRow {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--line-soft);
    border-radius: 8px;
    background: var(--surface-3);
  }

  .networkListRow a {
    color: var(--brand-700);
    font-weight: 800;
    text-decoration: none;
  }

  .networkEventIcon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-600) 14%, transparent);
    color: var(--brand-700);
  }

  .networkInfoGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .networkInfoGrid article,
  .networkEmpty {
    display: grid;
    gap: 6px;
    padding: 14px;
    border-radius: 8px;
    background: var(--panel-inset);
  }

  .networkNotice {
    padding: 12px 14px;
    color: var(--brand-700);
    font-weight: 800;
  }

  @media (max-width: 900px) {
    .networkPage {
      grid-template-columns: 1fr;
      padding: 12px;
    }

    .networkSidebar {
      position: static;
    }

    .networkListRow {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .networkListRow a,
    .networkListRow button {
      grid-column: 1 / -1;
    }

    .networkInfoGrid {
      grid-template-columns: 1fr;
    }

    .matchingFilters {
      grid-template-columns: 1fr;
    }

    .networkSummary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;
