'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { AlertTriangle, CheckCircle2, Landmark, RefreshCcw, ShieldCheck, UserRound } from 'lucide-react';
import { localizeHref } from '@/components/locale-path';
import SiteFooter from '@/components/SiteFooter';
import type { Locale } from '@/i18n.config';

const apiBase = '/api';

function tr(locale: Locale, fr: string, en: string, ar: string) {
  if (locale === 'fr') {
    return fr;
  }

  if (locale === 'ar') {
    return ar;
  }

  return en;
}

async function parseApiResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || body?.message || 'Request failed');
  }
  return body?.data ?? body;
}

function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return async function fetchAuthed(input: string, init: RequestInit = {}) {
    const token = await getToken();
    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(`${apiBase}${input}`, {
      ...init,
      headers,
    });
  };
}

function WorkspaceShell({
  locale,
  eyebrow,
  title,
  lead,
  children,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="adminOpsPage" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <section className="adminHero">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </section>
        {children}
      </main>
      <SiteFooter locale={locale} variant="member" />
      <style jsx>{`
        .adminOpsPage {
          width: min(1220px, calc(100vw - 32px));
          margin: 0 auto;
          padding: 44px 0 72px;
          display: grid;
          gap: 20px;
        }

        .adminHero,
        :global(.adminCard),
        :global(.adminMessage) {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.06);
        }

        .adminHero {
          padding: 34px;
          display: grid;
          gap: 14px;
        }

        .eyebrow {
          width: fit-content;
          display: inline-flex;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(219, 234, 254, 0.84);
          color: #1d4ed8;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .adminHero h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.6rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .adminHero p {
          margin: 0;
          color: #475569;
          line-height: 1.72;
          max-width: 72ch;
        }

        @media (max-width: 720px) {
          .adminOpsPage {
            width: min(100vw - 20px, 1220px);
            padding: 28px 0 56px;
          }

          .adminHero {
            padding: 24px;
            border-radius: 24px;
          }
        }

        html[data-theme='dark'] .adminHero,
        html[data-theme='dark'] :global(.adminCard),
        html[data-theme='dark'] :global(.adminMessage) {
          background: linear-gradient(180deg, rgba(12, 18, 32, 0.98), rgba(15, 23, 42, 0.95));
          border-color: rgba(71, 85, 105, 0.36);
          box-shadow: 0 22px 60px rgba(2, 6, 23, 0.44);
        }

        html[data-theme='dark'] .adminHero h1 {
          color: #e2e8f0;
        }

        html[data-theme='dark'] .adminHero p {
          color: rgba(226, 232, 240, 0.72);
        }
      `}</style>
    </>
  );
}

function MessageBanner({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'danger';
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={`adminMessage ${tone}`}>{children}</div>
      <style jsx>{`
        .adminMessage {
          padding: 14px 16px;
          line-height: 1.6;
          color: #334155;
        }

        .adminMessage.success {
          background: rgba(236, 253, 245, 0.96);
          color: #166534;
          border-color: rgba(34, 197, 94, 0.18);
        }

        .adminMessage.danger {
          background: rgba(254, 242, 242, 0.96);
          color: #991b1b;
          border-color: rgba(239, 68, 68, 0.18);
        }
      `}</style>
    </>
  );
}

interface AuthSnapshot {
  authenticated?: boolean;
  data?: {
    email?: string | null;
    isAdmin?: boolean;
  };
}

export function AdminOverviewWorkspace({ locale }: { locale: Locale }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setLoading(false);
      setIsAdmin(false);
      setEmail('');
      return;
    }

    let cancelled = false;

    async function loadAdminStatus() {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const body = (await response.json().catch(() => ({}))) as AuthSnapshot;
        if (!cancelled) {
          setIsAdmin(Boolean(body?.authenticated && body.data?.isAdmin));
          setEmail(body.data?.email || user?.primaryEmailAddress?.emailAddress || '');
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setEmail(user?.primaryEmailAddress?.emailAddress || '');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAdminStatus();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user]);

  const adminLinks = [
    {
      title: tr(locale, 'Verification des identites', 'Identity verification', 'Identity verification'),
      detail: tr(locale, 'Traiter les dossiers KYC des particuliers et KYB des entreprises.', 'Review personal KYC and business KYB files.', 'Review personal KYC and business KYB files.'),
      href: localizeHref(locale, '/admin/verifications'),
    },
    {
      title: tr(locale, 'Moderation des signalements', 'Moderation reports', 'Moderation reports'),
      detail: tr(locale, 'Analyser les contenus signales et enregistrer une decision.', 'Review reported content and record a decision.', 'Review reported content and record a decision.'),
      href: localizeHref(locale, '/admin/reports'),
    },
    {
      title: tr(locale, 'Gestion des partenaires', 'Partner management', 'Partner management'),
      detail: tr(locale, 'Ajouter, modifier ou suspendre les partenaires visibles sur la plateforme.', 'Create, update or pause partners shown on the platform.', 'Create, update or pause partners shown on the platform.'),
      href: localizeHref(locale, '/admin/partners'),
    },
    {
      title: tr(locale, 'Logs de securite', 'Security logs', 'Security logs'),
      detail: tr(locale, 'Consulter les acces sensibles, les validations et les actions critiques.', 'Inspect sensitive access, validations and critical actions.', 'Inspect sensitive access, validations and critical actions.'),
      href: localizeHref(locale, '/admin/security-logs'),
    },
    {
      title: tr(locale, 'Abonnements et paiements', 'Subscriptions and payments', 'Subscriptions and payments'),
      detail: tr(locale, 'Superviser les plans, factures, paiements CMI/Stripe et statuts Premium.', 'Monitor plans, invoices, CMI/Stripe payments and Premium status.', 'Monitor plans, invoices, CMI/Stripe payments and Premium status.'),
      href: localizeHref(locale, '/billing'),
    },
  ];

  return (
    <WorkspaceShell
      locale={locale}
      eyebrow="Administration"
      title={tr(locale, 'Administration et gouvernance', 'Administration and governance', 'Administration and governance')}
      lead={tr(
        locale,
        'Espace de pilotage reserve aux comptes autorises pour controler les identites, les contenus, les partenaires, la securite et les paiements.',
        'Control space reserved for authorized accounts to manage identities, content, partners, security and payments.',
        'Control space reserved for authorized accounts to manage identities, content, partners, security and payments.',
      )}
    >
      {loading ? (
        <MessageBanner>{tr(locale, 'Verification du role administrateur...', 'Checking administrator role...', 'Checking administrator role...')}</MessageBanner>
      ) : null}

      {!loading && !isAdmin ? (
        <section className="adminCard accessCard">
          <div className="accessIcon"><UserRound size={22} /></div>
          <div>
            <h2>{tr(locale, 'Acces utilisateur standard', 'Standard user access', 'Standard user access')}</h2>
            <p>
              {tr(
                locale,
                'Le compte connecte n a pas le role admin. Il reste dirige vers les espaces utilisateur normaux.',
                'The connected account does not have the admin role. It stays on the standard user areas.',
                'The connected account does not have the admin role. It stays on the standard user areas.',
              )}
            </p>
            <small>{email || tr(locale, 'Email non disponible', 'Email unavailable', 'Email unavailable')}</small>
          </div>
          <Link className="primaryButton" href={localizeHref(locale, '/dashboard')}>
            {tr(locale, 'Aller au tableau de bord', 'Go to dashboard', 'Go to dashboard')}
          </Link>
        </section>
      ) : null}

      {!loading && isAdmin ? (
        <>
          <section className="adminCard flowCard">
            <div className="flowStep">
              <span>Email / compte connecte</span>
              <strong>{email}</strong>
            </div>
            <div className="flowArrow">↓</div>
            <div className="flowStep">
              <span>Verification Clerk ou PostgreSQL</span>
              <strong>{tr(locale, 'Regle admin appliquee', 'Admin rule applied', 'Admin rule applied')}</strong>
            </div>
            <div className="flowArrow">↓</div>
            <div className="flowStep">
              <span>Le compte a-t-il le role admin ?</span>
              <strong>{tr(locale, 'Oui, acces autorise', 'Yes, access authorized', 'Yes, access authorized')}</strong>
            </div>
          </section>

          <section className="adminGrid">
            {adminLinks.map((item) => (
              <Link key={item.href} href={item.href} className="adminCard adminEntry">
                <span className="entryIcon"><ShieldCheck size={18} /></span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </Link>
            ))}
          </section>
        </>
      ) : null}

      <style jsx>{`
        .accessCard {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          padding: 24px;
        }

        .accessIcon,
        .entryIcon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: var(--dropdown-icon-bg);
          color: var(--brand-700);
        }

        .accessCard h2,
        .accessCard p,
        .accessCard small,
        .flowStep span,
        .flowStep strong,
        .adminEntry strong,
        .adminEntry p {
          margin: 0;
          color: var(--ink-950);
        }

        .accessCard p,
        .adminEntry p {
          margin-top: 8px;
          color: var(--ink-600);
          line-height: 1.65;
        }

        .accessCard small {
          display: block;
          margin-top: 8px;
          color: var(--ink-500);
          font-weight: 700;
        }

        .flowCard {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 14px;
          align-items: center;
        }

        .flowStep {
          min-height: 118px;
          display: grid;
          align-content: center;
          gap: 8px;
          padding: 18px;
          border-radius: 18px;
          border: 1px solid var(--line-soft);
          background: var(--panel-inset);
        }

        .flowStep span {
          color: var(--ink-600);
          font-size: 0.9rem;
          font-weight: 700;
        }

        .flowArrow {
          color: var(--brand-700);
          font-size: 1.4rem;
          font-weight: 900;
        }

        .adminGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .adminEntry {
          display: grid;
          gap: 10px;
          padding: 22px;
          text-decoration: none;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }

        .adminEntry:hover {
          transform: translateY(-2px);
          border-color: var(--field-focus);
        }

        @media (max-width: 820px) {
          .accessCard,
          .flowCard,
          .adminGrid {
            grid-template-columns: 1fr;
          }

          .flowArrow {
            text-align: center;
          }
        }
      `}</style>
    </WorkspaceShell>
  );
}

interface PartnerRecord {
  id: string;
  name: string;
  type: string;
  city: string;
  website?: string | null;
  description?: string | null;
  active: boolean;
}

interface SecurityLogRecord {
  id: string;
  userId: number;
  eventType: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface ModerationReportRecord {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  resolutionNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

const partnerDraft = {
  name: '',
  type: 'UNIVERSITY',
  city: '',
  website: '',
  description: '',
  active: true,
};

export function AdminPartnersWorkspace({ locale }: { locale: Locale }) {
  const { isLoaded, isSignedIn } = useUser();
  const fetchAuthed = useAuthenticatedFetch();
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [draft, setDraft] = useState(partnerDraft);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'danger'>('neutral');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    void loadPartners();
  }, [isLoaded, isSignedIn]);

  async function loadPartners() {
    setLoading(true);
    setMessage('');
    try {
      const data = await parseApiResponse(await fetchAuthed('/partners?all=true'));
      setPartners(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load partners.');
      setMessageTone('danger');
    } finally {
      setLoading(false);
    }
  }

  async function savePartner() {
    setBusy('save');
    setMessage('');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const path = editingId ? `/admin/partners/${editingId}` : '/admin/partners';
      const data = await parseApiResponse(
        await fetchAuthed(path, {
          method,
          body: JSON.stringify(draft),
        }),
      );

      setMessage(
        editingId
          ? tr(locale, 'Partenaire mis a jour.', 'Partner updated.', 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø´Ø±ÙŠÙƒ.')
          : tr(locale, 'Partenaire ajoute.', 'Partner created.', 'ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø´Ø±ÙŠÙƒ.'),
      );
      setMessageTone('success');
      setDraft(partnerDraft);
      setEditingId('');
      await loadPartners();
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save partner.');
      setMessageTone('danger');
      return null;
    } finally {
      setBusy('');
    }
  }

  async function deletePartner(id: string) {
    const confirmed = window.confirm(
      tr(locale, 'Supprimer ce partenaire ?', 'Delete this partner?', 'Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ø´Ø±ÙŠÙƒØŸ'),
    );
    if (!confirmed) {
      return;
    }

    setBusy(`delete:${id}`);
    setMessage('');
    try {
      await parseApiResponse(await fetchAuthed(`/admin/partners/${id}`, { method: 'DELETE' }));
      setMessage(tr(locale, 'Partenaire supprime.', 'Partner deleted.', 'ØªÙ… Ø­Ø°Ù Ø§Ù„Ø´Ø±ÙŠÙƒ.'));
      setMessageTone('success');
      if (editingId === id) {
        setDraft(partnerDraft);
        setEditingId('');
      }
      await loadPartners();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete partner.');
      setMessageTone('danger');
    } finally {
      setBusy('');
    }
  }

  return (
    <WorkspaceShell
      locale={locale}
      eyebrow={tr(locale, 'Admin', 'Admin', 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©')}
      title={tr(locale, 'Partenaires locaux', 'Local partners', 'Ø§Ù„Ø´Ø±ÙƒØ§Ø¡ Ø§Ù„Ù…Ø­Ù„ÙŠÙˆÙ†')}
      lead={tr(locale, 'Activez, corrigez et pilotez les integrations locales sans casser le style public existant.', 'Activate, edit and manage local integrations without changing the existing public style.', 'Ù‚Ù… Ø¨ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø´Ø±Ø§ÙƒØ§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ© ÙˆØªØ¹Ø¯ÙŠÙ„Ù‡Ø§ ÙˆØ¥Ø¯Ø§Ø±ØªÙ‡Ø§ Ù…Ù† Ø¯ÙˆÙ† ÙƒØ³Ø± Ø§Ù„Ø£Ø³Ù„ÙˆØ¨ Ø§Ù„Ø¹Ø§Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ.')}
    >
      {message ? <MessageBanner tone={messageTone}>{message}</MessageBanner> : null}

      <section className="adminLayout">
        <article className="adminCard editorCard">
          <div className="cardHeader">
            <strong>{editingId ? tr(locale, 'Modifier le partenaire', 'Edit partner', 'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø´Ø±ÙŠÙƒ') : tr(locale, 'Ajouter un partenaire', 'Add a partner', 'Ø¥Ø¶Ø§ÙØ© Ø´Ø±ÙŠÙƒ')}</strong>
            <button type="button" className="ghostButton" onClick={() => void loadPartners()}>
              <RefreshCcw size={16} />
              {tr(locale, 'Actualiser', 'Refresh', 'ØªØ­Ø¯ÙŠØ«')}
            </button>
          </div>

          <div className="formGrid">
            {[
              ['name', tr(locale, 'Nom', 'Name', 'Ø§Ù„Ø§Ø³Ù…')],
              ['city', tr(locale, 'Ville', 'City', 'Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©')],
              ['website', tr(locale, 'Site web', 'Website', 'Ø§Ù„Ù…ÙˆÙ‚Ø¹')],
            ].map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  value={draft[key as keyof typeof draft] as string}
                  onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                />
              </label>
            ))}

            <label>
              <span>{tr(locale, 'Type', 'Type', 'Ø§Ù„Ù†ÙˆØ¹')}</span>
              <select
                value={draft.type}
                onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="UNIVERSITY">Universite</option>
                <option value="SCHOOL">Ecole</option>
                <option value="OFPPT">OFPPT</option>
                <option value="BUSINESS_DIRECTORY">Annuaire business</option>
                <option value="COMPANY">Entreprise</option>
                <option value="INCUBATOR">Incubateur</option>
              </select>
            </label>

            <label className="fullWidth">
              <span>{tr(locale, 'Description', 'Description', 'Ø§Ù„ÙˆØµÙ')}</span>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <label className="checkboxRow">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
              />
              <span>{tr(locale, 'Partenaire actif', 'Active partner', 'Ø´Ø±ÙŠÙƒ Ù†Ø´Ø·')}</span>
            </label>
          </div>

          <div className="actionRow">
            <button type="button" className="primaryButton" disabled={busy === 'save'} onClick={() => void savePartner()}>
              <Landmark size={16} />
              {busy === 'save'
                ? tr(locale, 'Enregistrement...', 'Saving...', 'Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸...')
                : editingId
                  ? tr(locale, 'Mettre a jour', 'Update', 'ØªØ­Ø¯ÙŠØ«')
                  : tr(locale, 'Ajouter', 'Create', 'Ø¥Ø¶Ø§ÙØ©')}
            </button>
            {editingId ? (
              <button type="button" className="ghostButton" onClick={() => { setEditingId(''); setDraft(partnerDraft); }}>
                {tr(locale, 'Annuler', 'Cancel', 'Ø¥Ù„ØºØ§Ø¡')}
              </button>
            ) : null}
          </div>
        </article>

        <article className="adminCard listCard">
          <div className="cardHeader">
            <strong>{tr(locale, 'Catalogue partenaires', 'Partner catalog', 'Ø¯Ù„ÙŠÙ„ Ø§Ù„Ø´Ø±ÙƒØ§Ø¡')}</strong>
            <span className="badge">{partners.length}</span>
          </div>

          <div className="stack">
            {loading ? <p>{tr(locale, 'Chargement...', 'Loading...', 'Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù…ÙŠÙ„...')}</p> : null}
            {!loading && !partners.length ? <p>{tr(locale, 'Aucun partenaire charge.', 'No partners loaded.', 'Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø´Ø±ÙƒØ§Ø¡ Ù…Ø­Ù…Ù‘Ù„ÙˆÙ†.')}</p> : null}
            {partners.map((partner) => (
              <article key={partner.id} className="rowCard">
                <div>
                  <strong>{partner.name}</strong>
                  <small>{partner.type} â€¢ {partner.city}</small>
                  <p>{partner.description || '-'}</p>
                </div>
                <div className="rowActions">
                  <button
                    type="button"
                    className="ghostButton"
                    onClick={() => {
                      setEditingId(partner.id);
                      setDraft({
                        name: partner.name,
                        type: partner.type,
                        city: partner.city,
                        website: partner.website || '',
                        description: partner.description || '',
                        active: partner.active,
                      });
                    }}
                  >
                    {tr(locale, 'Modifier', 'Edit', 'ØªØ¹Ø¯ÙŠÙ„')}
                  </button>
                  <button
                    type="button"
                    className="dangerButton"
                    disabled={busy === `delete:${partner.id}`}
                    onClick={() => void deletePartner(partner.id)}
                  >
                    {busy === `delete:${partner.id}`
                      ? tr(locale, 'Suppression...', 'Deleting...', 'Ø¬Ø§Ø±Ù Ø§Ù„Ø­Ø°Ù...')
                      : tr(locale, 'Supprimer', 'Delete', 'Ø­Ø°Ù')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <AdminWorkspaceStyles />
    </WorkspaceShell>
  );
}

export function AdminSecurityLogsWorkspace({ locale }: { locale: Locale }) {
  const { isLoaded, isSignedIn } = useUser();
  const fetchAuthed = useAuthenticatedFetch();
  const [logs, setLogs] = useState<SecurityLogRecord[]>([]);
  const [eventType, setEventType] = useState('');
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'danger'>('neutral');
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    setMessage('');
    try {
      const search = new URLSearchParams({ limit: '80' });
      if (eventType.trim()) {
        search.set('eventType', eventType.trim());
      }
      if (userId.trim()) {
        search.set('userId', userId.trim());
      }

      const data = await parseApiResponse(await fetchAuthed(`/security/logs?${search.toString()}`));
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load security logs.');
      setMessageTone('danger');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    void loadLogs();
  }, [isLoaded, isSignedIn]);

  return (
    <WorkspaceShell
      locale={locale}
      eyebrow={tr(locale, 'Admin', 'Admin', 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©')}
      title={tr(locale, 'Journal de securite', 'Security logs', 'Ø³Ø¬Ù„ Ø§Ù„Ø£Ù…Ø§Ù†')}
      lead={tr(locale, 'Surveillez les acces sensibles, la verification, les paiements et les changements critiques depuis une seule table.', 'Monitor sensitive access, verification, payments and critical changes from one table.', 'Ø±Ø§Ù‚Ø¨ Ø§Ù„ÙˆØµÙˆÙ„ Ø§Ù„Ø­Ø³Ø§Ø³ ÙˆØ§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ§Ù„ØªØºÙŠÙŠØ±Ø§Øª Ø§Ù„Ø­Ø±Ø¬Ø© Ù…Ù† Ø¬Ø¯ÙˆÙ„ ÙˆØ§Ø­Ø¯.')}
    >
      {message ? <MessageBanner tone={messageTone}>{message}</MessageBanner> : null}
      <section className="adminCard listCard">
        <div className="cardHeader">
          <strong>{tr(locale, 'Filtres', 'Filters', 'Ø§Ù„ÙÙ„Ø§ØªØ±')}</strong>
          <button type="button" className="ghostButton" onClick={() => void loadLogs()}>
            <RefreshCcw size={16} />
            {tr(locale, 'Actualiser', 'Refresh', 'ØªØ­Ø¯ÙŠØ«')}
          </button>
        </div>

        <div className="filterGrid">
          <label>
            <span>{tr(locale, 'Type evenement', 'Event type', 'Ù†ÙˆØ¹ Ø§Ù„Ø­Ø¯Ø«')}</span>
            <input value={eventType} onChange={(event) => setEventType(event.target.value)} placeholder="login_failed" />
          </label>
          <label>
            <span>{tr(locale, 'ID utilisateur', 'User ID', 'Ù…Ø¹Ø±Ù‘Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…')}</span>
            <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="42" />
          </label>
        </div>

        <div className="tableWrap">
          <table className="dataTable">
            <thead>
              <tr>
                <th>{tr(locale, 'Date', 'Date', 'Ø§Ù„ØªØ§Ø±ÙŠØ®')}</th>
                <th>{tr(locale, 'Evenement', 'Event', 'Ø§Ù„Ø­Ø¯Ø«')}</th>
                <th>{tr(locale, 'Utilisateur', 'User', 'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…')}</th>
                <th>IP</th>
                <th>{tr(locale, 'Agent', 'Agent', 'Ø§Ù„Ø¹Ù…ÙŠÙ„')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>{tr(locale, 'Chargement...', 'Loading...', 'Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù…ÙŠÙ„...')}</td></tr>
              ) : null}
              {!loading && !logs.length ? (
                <tr><td colSpan={5}>{tr(locale, 'Aucun evenement pour ce filtre.', 'No events for this filter.', 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø­Ø¯Ø§Ø« Ù„Ù‡Ø°Ø§ Ø§Ù„ÙÙ„ØªØ±.')}</td></tr>
              ) : null}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.eventType}</td>
                  <td>{log.userId}</td>
                  <td>{log.ipAddress || '-'}</td>
                  <td className="truncateCell">{log.userAgent || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminWorkspaceStyles />
    </WorkspaceShell>
  );
}

export function AdminReportsWorkspace({ locale }: { locale: Locale }) {
  const { isLoaded, isSignedIn } = useUser();
  const fetchAuthed = useAuthenticatedFetch();
  const [reports, setReports] = useState<ModerationReportRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'danger'>('neutral');

  async function loadReports() {
    setLoading(true);
    setMessage('');
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const data = await parseApiResponse(await fetchAuthed(`/admin/reports${query}`));
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load moderation reports.');
      setMessageTone('danger');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    void loadReports();
  }, [isLoaded, isSignedIn, statusFilter]);

  async function resolveReport(id: string, status: 'RESOLVED' | 'REJECTED') {
    setBusy(`${status}:${id}`);
    setMessage('');
    try {
      await parseApiResponse(
        await fetchAuthed(`/admin/reports/${id}/resolve`, {
          method: 'POST',
          body: JSON.stringify({
            status,
            resolutionNote: resolutionNotes[id] || '',
          }),
        }),
      );
      setMessage(
        status === 'RESOLVED'
          ? tr(locale, 'Signalement resolu.', 'Report resolved.', 'ØªÙ…Øª Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø¨Ù„Ø§Øº.')
          : tr(locale, 'Signalement rejete.', 'Report rejected.', 'ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø¨Ù„Ø§Øº.'),
      );
      setMessageTone('success');
      await loadReports();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to resolve the report.');
      setMessageTone('danger');
    } finally {
      setBusy('');
    }
  }

  const openReports = useMemo(() => reports.filter((report) => report.status === 'OPEN'), [reports]);

  return (
    <WorkspaceShell
      locale={locale}
      eyebrow={tr(locale, 'Admin', 'Admin', 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©')}
      title={tr(locale, 'Moderation et signalements', 'Moderation and reports', 'Ø§Ù„Ø¥Ø´Ø±Ø§Ù ÙˆØ§Ù„Ø¨Ù„Ø§ØºØ§Øª')}
      lead={tr(locale, 'Suivez les profils ou publications signales et tranchez proprement depuis une file discrete.', 'Track reported profiles or publications and resolve them from one calm queue.', 'ØªØ§Ø¨Ø¹ Ø§Ù„Ù…Ù„ÙØ§Øª Ø£Ùˆ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø§Ù„Ù…Ø¨Ù„Ù‘Øº Ø¹Ù†Ù‡Ø§ ÙˆØ§Ø­Ø³Ù…Ù‡Ø§ Ù…Ù† Ø·Ø§Ø¨ÙˆØ± Ù‡Ø§Ø¯Ø¦ ÙˆØ§Ø­Ø¯.')}
    >
      {message ? <MessageBanner tone={messageTone}>{message}</MessageBanner> : null}
      <section className="adminCard listCard">
        <div className="cardHeader">
          <strong>{tr(locale, 'Signalements', 'Reports', 'Ø§Ù„Ø¨Ù„Ø§ØºØ§Øª')}</strong>
          <div className="inlineMeta">
            <span className="badge">{openReports.length}</span>
            <button type="button" className="ghostButton" onClick={() => void loadReports()}>
              <RefreshCcw size={16} />
              {tr(locale, 'Actualiser', 'Refresh', 'ØªØ­Ø¯ÙŠØ«')}
            </button>
          </div>
        </div>

        <div className="filterRow">
          <button type="button" className={statusFilter === '' ? 'filterChip active' : 'filterChip'} onClick={() => setStatusFilter('')}>
            {tr(locale, 'Tous', 'All', 'Ø§Ù„ÙƒÙ„')}
          </button>
          <button type="button" className={statusFilter === 'OPEN' ? 'filterChip active' : 'filterChip'} onClick={() => setStatusFilter('OPEN')}>
            OPEN
          </button>
          <button type="button" className={statusFilter === 'RESOLVED' ? 'filterChip active' : 'filterChip'} onClick={() => setStatusFilter('RESOLVED')}>
            RESOLVED
          </button>
          <button type="button" className={statusFilter === 'REJECTED' ? 'filterChip active' : 'filterChip'} onClick={() => setStatusFilter('REJECTED')}>
            REJECTED
          </button>
        </div>

        <div className="stack">
          {loading ? <p>{tr(locale, 'Chargement...', 'Loading...', 'Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù…ÙŠÙ„...')}</p> : null}
          {!loading && !reports.length ? <p>{tr(locale, 'Aucun signalement.', 'No reports found.', 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨Ù„Ø§ØºØ§Øª.')}</p> : null}
          {reports.map((report) => (
            <article key={report.id} className="rowCard reportCard">
              <div className="reportHead">
                <div>
                  <strong>{report.targetType} â€¢ {report.reason}</strong>
                  <small>{new Date(report.createdAt).toLocaleString()}</small>
                </div>
                <span className={`statusPill ${report.status.toLowerCase()}`}>{report.status}</span>
              </div>
              <p>{report.targetId}</p>
              <textarea
                value={resolutionNotes[report.id] || report.resolutionNote || ''}
                onChange={(event) => setResolutionNotes((current) => ({ ...current, [report.id]: event.target.value }))}
                placeholder={tr(locale, 'Note de moderation', 'Moderation note', 'Ù…Ù„Ø§Ø­Ø¸Ø© Ø§Ù„Ø¥Ø´Ø±Ø§Ù')}
              />
              <div className="rowActions">
                <button
                  type="button"
                  className="successButton"
                  disabled={busy === `RESOLVED:${report.id}`}
                  onClick={() => void resolveReport(report.id, 'RESOLVED')}
                >
                  <CheckCircle2 size={16} />
                  {busy === `RESOLVED:${report.id}`
                    ? tr(locale, 'Validation...', 'Approving...', 'Ø¬Ø§Ø±Ù Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯...')
                    : tr(locale, 'Approuver', 'Approve', 'Ø§Ø¹ØªÙ…Ø§Ø¯')}
                </button>
                <button
                  type="button"
                  className="dangerButton"
                  disabled={busy === `REJECTED:${report.id}`}
                  onClick={() => void resolveReport(report.id, 'REJECTED')}
                >
                  <AlertTriangle size={16} />
                  {busy === `REJECTED:${report.id}`
                    ? tr(locale, 'Rejet...', 'Rejecting...', 'Ø¬Ø§Ø±Ù Ø§Ù„Ø±ÙØ¶...')
                    : tr(locale, 'Rejeter', 'Reject', 'Ø±ÙØ¶')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AdminWorkspaceStyles />
    </WorkspaceShell>
  );
}

function AdminWorkspaceStyles() {
  return (
    <style jsx>{`
      .adminLayout {
        display: grid;
        gap: 18px;
        grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      }

      .editorCard,
      .listCard {
        padding: 24px;
        display: grid;
        gap: 16px;
      }

      .cardHeader,
      .reportHead {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 14px;
      }

      .cardHeader strong,
      .rowCard strong {
        color: #0f172a;
        font-size: 1rem;
      }

      .formGrid,
      .filterGrid,
      .stack {
        display: grid;
        gap: 14px;
      }

      .formGrid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .formGrid label,
      .filterGrid label {
        display: grid;
        gap: 8px;
      }

      .formGrid .fullWidth {
        grid-column: 1 / -1;
      }

      .formGrid span,
      .filterGrid span {
        color: #0f172a;
        font-size: 0.92rem;
        font-weight: 700;
      }

      .formGrid input,
      .formGrid select,
      .formGrid textarea,
      .filterGrid input,
      .reportCard textarea {
        width: 100%;
        min-height: 50px;
        padding: 0 14px;
        border-radius: 16px;
        border: 1px solid rgba(203, 213, 225, 0.88);
        background: rgba(255, 255, 255, 0.98);
        color: #0f172a;
        font: inherit;
      }

      .formGrid textarea,
      .reportCard textarea {
        min-height: 110px;
        padding: 14px;
        resize: vertical;
      }

      .checkboxRow {
        grid-column: 1 / -1;
        display: flex !important;
        align-items: center;
        gap: 10px;
      }

      .checkboxRow input {
        width: 18px;
        min-height: 18px;
        padding: 0;
      }

      .actionRow,
      .rowActions,
      .inlineMeta,
      .filterRow {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }

      .rowCard {
        display: grid;
        gap: 10px;
        padding: 18px;
        border-radius: 22px;
        border: 1px solid rgba(226, 232, 240, 0.88);
        background: rgba(248, 250, 252, 0.88);
      }

      .rowCard small,
      .rowCard p {
        margin: 0;
        color: #64748b;
        line-height: 1.65;
      }

      .badge,
      .statusPill,
      .filterChip {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 12px;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 800;
      }

      .badge {
        background: rgba(219, 234, 254, 0.84);
        color: #1d4ed8;
      }

      .statusPill.open {
        background: rgba(255, 251, 235, 0.96);
        color: #b45309;
      }

      .statusPill.resolved {
        background: rgba(236, 253, 245, 0.96);
        color: #166534;
      }

      .statusPill.rejected {
        background: rgba(254, 242, 242, 0.96);
        color: #991b1b;
      }

      .filterChip {
        border: 1px solid rgba(203, 213, 225, 0.88);
        background: rgba(255, 255, 255, 0.9);
        color: #334155;
        cursor: pointer;
      }

      .filterChip.active {
        background: rgba(219, 234, 254, 0.92);
        border-color: rgba(37, 99, 235, 0.18);
        color: #1d4ed8;
      }

      .tableWrap {
        overflow: auto;
        border-radius: 20px;
        border: 1px solid rgba(226, 232, 240, 0.88);
        background: rgba(248, 250, 252, 0.88);
      }

      .dataTable {
        width: 100%;
        border-collapse: collapse;
      }

      .dataTable th,
      .dataTable td {
        padding: 14px 16px;
        text-align: left;
        border-bottom: 1px solid rgba(226, 232, 240, 0.88);
        color: #334155;
        font-size: 0.92rem;
      }

      .dataTable th {
        color: #0f172a;
        font-weight: 800;
        background: rgba(255, 255, 255, 0.76);
      }

      .truncateCell {
        max-width: 320px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .reportCard {
        gap: 12px;
      }

      .primaryButton,
      .ghostButton,
      .dangerButton,
      .successButton {
        min-height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 0 16px;
        border-radius: 15px;
        border: 1px solid rgba(37, 99, 235, 0.18);
        text-decoration: none;
        font-weight: 700;
        cursor: pointer;
      }

      .primaryButton {
        background: linear-gradient(135deg, #2563eb, #3b82f6);
        color: white;
      }

      .ghostButton {
        background: rgba(255, 255, 255, 0.9);
        color: #0f172a;
      }

      .dangerButton {
        background: rgba(254, 242, 242, 0.96);
        border-color: rgba(239, 68, 68, 0.18);
        color: #991b1b;
      }

      .successButton {
        background: rgba(236, 253, 245, 0.96);
        border-color: rgba(34, 197, 94, 0.18);
        color: #166534;
      }

      @media (max-width: 960px) {
        .adminLayout,
        .formGrid,
        .filterGrid {
          grid-template-columns: 1fr;
        }
      }

      html[data-theme='dark'] .cardHeader strong,
      html[data-theme='dark'] .rowCard strong,
      html[data-theme='dark'] .formGrid span,
      html[data-theme='dark'] .filterGrid span,
      html[data-theme='dark'] .dataTable th,
      html[data-theme='dark'] .ghostButton {
        color: #e2e8f0;
      }

      html[data-theme='dark'] .rowCard,
      html[data-theme='dark'] .tableWrap {
        background: rgba(15, 23, 42, 0.84);
        border-color: rgba(71, 85, 105, 0.42);
      }

      html[data-theme='dark'] .rowCard small,
      html[data-theme='dark'] .rowCard p,
      html[data-theme='dark'] .dataTable td {
        color: rgba(226, 232, 240, 0.72);
      }

      html[data-theme='dark'] .formGrid input,
      html[data-theme='dark'] .formGrid select,
      html[data-theme='dark'] .formGrid textarea,
      html[data-theme='dark'] .filterGrid input,
      html[data-theme='dark'] .reportCard textarea,
      html[data-theme='dark'] .ghostButton,
      html[data-theme='dark'] .filterChip {
        background: rgba(15, 23, 42, 0.82);
        border-color: rgba(71, 85, 105, 0.42);
        color: #e2e8f0;
      }

      html[data-theme='dark'] .dataTable th {
        background: rgba(15, 23, 42, 0.94);
      }
    `}</style>
  );
}
