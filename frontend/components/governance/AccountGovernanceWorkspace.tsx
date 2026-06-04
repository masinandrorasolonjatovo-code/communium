'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { AlertCircle, ArrowRight, CheckCircle2, Download, FileBadge2, Landmark, LockKeyhole, RefreshCcw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SiteFooter from '@/components/SiteFooter';
import { localizeHref } from '@/components/locale-path';
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

type SettingsMode = 'privacy' | 'data-rights' | 'security';
type BillingMode = 'overview' | 'invoices' | 'payment-methods' | 'checkout';

interface SettingsGovernanceWorkspaceProps {
  locale: Locale;
  mode: SettingsMode;
}

interface BusinessProfileWorkspaceProps {
  locale: Locale;
}

interface BillingWorkspaceProps {
  locale: Locale;
  mode: BillingMode;
  plan?: string;
}

interface DataRightsState {
  sensitiveFields: Record<string, string | null>;
  consents: Array<{ id: string; consentType: string; accepted: boolean; version: string; createdAt: string }>;
  accessLogs: Array<{ id: string; fieldName: string; reason: string; createdAt: string }>;
  requests: Array<{ id: string; requestType: string; status: string; details: Record<string, unknown>; createdAt: string }>;
}

interface SecurityLog {
  id: string;
  eventType: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

interface BillingOverviewState {
  currentSubscription: {
    id: string;
    plan: string;
    status: string;
    renewsAt?: string | null;
    expiresAt?: string | null;
  } | null;
  recentPayments: Array<{
    id: string;
    provider: string;
    amountHT: number;
    vatRate: number;
    vatAmount: number;
    amountTTC: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  businessProfile: {
    companyName?: string | null;
    ice?: string | null;
    ifNumber?: string | null;
  } | null;
  plans: Array<{
    id: string;
    plan: string;
    label: string;
    amountHT: number;
    vatRate: number;
    vatAmount: number;
    amountTTC: number;
  }>;
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  companyName?: string | null;
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  createdAt: string;
  legalMentions?: string | null;
}

interface BusinessProfileState {
  companyName: string;
  rc: string;
  ice: string;
  ifNumber: string;
  cnss: string;
  patente: string;
  legalAddress: string;
  sector: string;
  companySize: string;
  website: string;
}

const emptyBusinessProfile: BusinessProfileState = {
  companyName: '',
  rc: '',
  ice: '',
  ifNumber: '',
  cnss: '',
  patente: '',
  legalAddress: '',
  sector: '',
  companySize: '',
  website: '',
};

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
      <main className="opsPage" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <section className="opsHero">
          <span className="opsEyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </section>
        {children}
      </main>
      <SiteFooter locale={locale} variant="member" />
      <style jsx>{`
        .opsPage {
          width: min(1220px, calc(100vw - 32px));
          margin: 0 auto;
          padding: 44px 0 72px;
          display: grid;
          gap: 20px;
        }

        .opsHero,
        :global(.opsCard) {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.06);
        }

        .opsHero {
          padding: 34px;
          display: grid;
          gap: 14px;
        }

        .opsEyebrow {
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

        .opsHero h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.6rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .opsHero p {
          margin: 0;
          color: #475569;
          line-height: 1.72;
          max-width: 70ch;
        }

        @media (max-width: 720px) {
          .opsPage {
            width: min(100vw - 20px, 1220px);
            padding: 28px 0 56px;
          }

          .opsHero {
            padding: 24px;
            border-radius: 24px;
          }
        }

        html[data-theme='dark'] .opsHero,
        html[data-theme='dark'] :global(.opsCard) {
          background: linear-gradient(180deg, rgba(12, 18, 32, 0.98), rgba(15, 23, 42, 0.95));
          border-color: rgba(71, 85, 105, 0.36);
          box-shadow: 0 22px 60px rgba(2, 6, 23, 0.42);
        }

        html[data-theme='dark'] .opsHero h1 {
          color: #e2e8f0;
        }

        html[data-theme='dark'] .opsHero p {
          color: rgba(226, 232, 240, 0.72);
        }
      `}</style>
    </>
  );
}

function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return async function fetchAuthed(input: string, init: RequestInit = {}) {
    const token = await getToken();
    const headers = new Headers(init.headers || {});
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(`${apiBase}${input}`, {
      ...init,
      headers,
    });
  };
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
      <div className={`opsMessage ${tone}`}>{children}</div>
      <style jsx>{`
        .opsMessage {
          padding: 14px 16px;
          border-radius: 16px;
          line-height: 1.6;
          font-size: 0.94rem;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(248, 250, 252, 0.9);
          color: #334155;
        }

        .opsMessage.success {
          background: rgba(236, 253, 245, 0.96);
          color: #166534;
          border-color: rgba(34, 197, 94, 0.18);
        }

        .opsMessage.danger {
          background: rgba(254, 242, 242, 0.96);
          color: #991b1b;
          border-color: rgba(239, 68, 68, 0.18);
        }
      `}</style>
    </>
  );
}

export function SettingsGovernanceWorkspace({ locale, mode }: SettingsGovernanceWorkspaceProps) {
  const { isLoaded, isSignedIn } = useUser();
  const fetchAuthed = useAuthenticatedFetch();
  const [rightsData, setRightsData] = useState<DataRightsState | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'danger'>('neutral');
  const [requestReason, setRequestReason] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState('');

  const privacyManagerHref = localizeHref(locale, '/profile/settings/privacy');
  const verificationHref = localizeHref(locale, '/profile/settings/verification');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [rights, securityLogs] = await Promise.all([
          fetchAuthed('/user/data-rights').then(parseApiResponse),
          fetchAuthed('/security/logs?limit=12').then(parseApiResponse).catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        setRightsData(rights);
        setLogs(Array.isArray(securityLogs) ? securityLogs : []);
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Unable to load the workspace.');
          setMessageTone('danger');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchAuthed, isLoaded, isSignedIn]);

  async function handleExport() {
    setBusyAction('export');
    setMessage('');
    try {
      const response = await fetchAuthed('/user/export-data', { method: 'GET' });
      const data = await parseApiResponse(response);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `communium-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(tr(locale, 'Export genere avec succes.', 'Export generated successfully.', 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ØªØµØ¯ÙŠØ± Ø¨Ù†Ø¬Ø§Ø­.'));
      setMessageTone('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export failed.');
      setMessageTone('danger');
    } finally {
      setBusyAction('');
    }
  }

  async function submitDataRequest(kind: 'rectification' | 'delete-request') {
    setBusyAction(kind);
    setMessage('');
    try {
      await parseApiResponse(
        await fetchAuthed(`/user/${kind}`, {
          method: 'POST',
          body: JSON.stringify({
            reason: requestReason,
            requestedFields: ['email', 'phone', 'address', 'identity', 'businessProfile'],
          }),
        }),
      );
      setMessage(
        kind === 'delete-request'
          ? tr(locale, 'La demande de suppression a ete enregistree.', 'Deletion request has been recorded.', 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø·Ù„Ø¨ Ø§Ù„Ø­Ø°Ù.')
          : tr(locale, 'La demande de rectification a ete envoyee.', 'Rectification request has been sent.', 'ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„ØªØµØ­ÙŠØ­.'),
      );
      setMessageTone('success');
      setRequestReason('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed.');
      setMessageTone('danger');
    } finally {
      setBusyAction('');
    }
  }

  async function startTwoFactorSetup() {
    setBusyAction('setup-2fa');
    setMessage('');
    try {
      const data = await parseApiResponse(
        await fetchAuthed('/security/2fa/setup', {
          method: 'POST',
          body: JSON.stringify({}),
        }),
      );
      setSetupSecret(data.secret || '');
      setBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
      setMessage(tr(locale, 'Secret 2FA genere. Verifiez avec votre application.', '2FA secret generated. Verify it with your authenticator app.', 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø± 2FA. Ø£ÙƒÙ‘Ø¯ Ø§Ù„ØªÙØ¹ÙŠÙ„ Ù…Ù† ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©.'));
      setMessageTone('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to setup 2FA.');
      setMessageTone('danger');
    } finally {
      setBusyAction('');
    }
  }

  async function verifyTwoFactor(modeToUse: 'verify' | 'disable') {
    setBusyAction(modeToUse);
    setMessage('');
    try {
      await parseApiResponse(
        await fetchAuthed(`/security/2fa/${modeToUse}`, {
          method: 'POST',
          body: JSON.stringify({ code: totpCode }),
        }),
      );
      setMessage(
        modeToUse === 'verify'
          ? tr(locale, 'La double authentification est active.', 'Two-factor authentication is enabled.', 'ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©.')
          : tr(locale, 'La double authentification a ete desactivee.', 'Two-factor authentication has been disabled.', 'ØªÙ… ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©.'),
      );
      setMessageTone('success');
      setTotpCode('');
      if (modeToUse === 'disable') {
        setSetupSecret('');
        setBackupCodes([]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '2FA action failed.');
      setMessageTone('danger');
    } finally {
      setBusyAction('');
    }
  }

  const title =
    mode === 'privacy'
      ? tr(locale, 'Confidentialite et donnees', 'Privacy and data controls', 'Ø§Ù„Ø®ØµÙˆØµÙŠØ© ÙˆØ§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª')
      : mode === 'data-rights'
        ? tr(locale, 'Droits sur vos donnees', 'Your data rights', 'Ø­Ù‚ÙˆÙ‚Ùƒ ÙÙŠ Ø¨ÙŠØ§Ù†Ø§ØªÙƒ')
        : tr(locale, 'Securite du compte', 'Account security', 'Ø£Ù…Ø§Ù† Ø§Ù„Ø­Ø³Ø§Ø¨');
  const lead =
    mode === 'privacy'
      ? tr(locale, 'Parametres de visibilite, pieces sensibles et journal des acces dans une surface membre sobre.', 'Visibility rules, sensitive records and access history in one calm member surface.', 'Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø¸Ù‡ÙˆØ± ÙˆØ§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© ÙˆØ³Ø¬Ù„ Ø§Ù„ÙˆØµÙˆÙ„ Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø­Ø© Ø¹Ø¶Ùˆ Ù‡Ø§Ø¯Ø¦Ø©.')
      : mode === 'data-rights'
        ? tr(locale, 'Export, rectification et suppression avec historique des consentements et acces sensibles.', 'Export, rectification and deletion backed by consent history and sensitive access logs.', 'Ø§Ù„ØªØµØ¯ÙŠØ± ÙˆØ§Ù„ØªØµØ­ÙŠØ­ ÙˆØ§Ù„Ø­Ø°Ù Ù…Ø¹ Ø³Ø¬Ù„ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª ÙˆØ§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©.')
        : tr(locale, 'Journal de securite, double authentification et controle du compte.', 'Security logs, two-factor authentication and account control.', 'Ø³Ø¬Ù„ Ø§Ù„Ø£Ù…Ø§Ù† ÙˆØ§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ© ÙˆØ§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ø­Ø³Ø§Ø¨.');

  return (
    <WorkspaceShell
      locale={locale}
      eyebrow={tr(locale, 'Reglages', 'Settings', 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª')}
      title={title}
      lead={lead}
    >
      {message ? <MessageBanner tone={messageTone}>{message}</MessageBanner> : null}
      {!isSignedIn && !loading ? (
        <div className="opsCard simpleCard">
          <strong>{tr(locale, 'Connexion requise', 'Sign-in required', 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø·Ù„ÙˆØ¨')}</strong>
          <p>{tr(locale, 'Connectez-vous pour acceder a cet espace.', 'Sign in to access this workspace.', 'Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø³Ø§Ø­Ø©.')}</p>
        </div>
      ) : null}
      {loading ? (
        <div className="opsCard simpleCard">
          <p>{tr(locale, 'Chargement de l espace...', 'Loading workspace...', 'Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø³Ø§Ø­Ø©...')}</p>
        </div>
      ) : null}

      {!loading && isSignedIn ? (
        <>
          {mode === 'privacy' ? (
            <div className="opsGrid threeCols">
              <article className="opsCard actionCard">
                <div className="iconWrap blue"><LockKeyhole size={18} /></div>
                <strong>{tr(locale, 'Confidentialite par champ', 'Field-level privacy', 'Ø®ØµÙˆØµÙŠØ© Ø­Ø³Ø¨ Ø§Ù„Ø­Ù‚Ù„')}</strong>
                <p>{tr(locale, 'Continuez vers les regles de visibilite deja configurees sur le profil.', 'Continue into the visibility rules already configured on the profile.', 'Ø§Ù†ØªÙ‚Ù„ Ø¥Ù„Ù‰ Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø¸Ù‡ÙˆØ± Ø§Ù„Ù…Ø¶Ø¨ÙˆØ·Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù„Ù.')}</p>
                <Link href={privacyManagerHref}>{tr(locale, 'Gerer la confidentialite', 'Manage privacy', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©')}</Link>
              </article>
              <article className="opsCard actionCard">
                <div className="iconWrap mint"><ShieldCheck size={18} /></div>
                <strong>{tr(locale, 'Verification et pieces', 'Verification and documents', 'Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„ÙˆØ«Ø§Ø¦Ù‚')}</strong>
                <p>{tr(locale, 'Suivez les pieces KYC/KYB et leur statut depuis le dossier de verification.', 'Track KYC/KYB documents and status from the verification workspace.', 'ØªØ§Ø¨Ø¹ ÙˆØ«Ø§Ø¦Ù‚ KYC/KYB ÙˆØ­Ø§Ù„ØªÙ‡Ø§ Ù…Ù† Ù…Ø³Ø§Ø­Ø© Ø§Ù„ØªØ­Ù‚Ù‚.')}</p>
                <Link href={verificationHref}>{tr(locale, 'Voir la verification', 'Open verification', 'ÙØªØ­ Ø§Ù„ØªØ­Ù‚Ù‚')}</Link>
              </article>
              <article className="opsCard actionCard">
                <div className="iconWrap light"><FileBadge2 size={18} /></div>
                <strong>{tr(locale, 'Donnees sensibles recensees', 'Sensitive data inventory', 'Ø¬Ø±Ø¯ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©')}</strong>
                <p>{tr(locale, 'Email, telephone, adresse, identite et donnees business restent sous controle dans les espaces membres.', 'Email, phone, address, identity and business records remain controlled inside member surfaces.', 'ØªØ¸Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¨Ø±ÙŠØ¯ ÙˆØ§Ù„Ù‡Ø§ØªÙ ÙˆØ§Ù„Ø¹Ù†ÙˆØ§Ù† ÙˆØ§Ù„Ù‡ÙˆÙŠØ© ÙˆØ¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø±ÙƒØ© ØªØ­Øª Ø§Ù„Ø³ÙŠØ·Ø±Ø© Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø­Ø§Øª Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡.')}</p>
                <Link href={localizeHref(locale, '/settings/data-rights')}>{tr(locale, 'Voir mes droits', 'View my rights', 'Ø¹Ø±Ø¶ Ø­Ù‚ÙˆÙ‚ÙŠ')}</Link>
              </article>
            </div>
          ) : null}

          {mode === 'data-rights' ? (
            <>
              <div className="opsGrid twoCols">
                <section className="opsCard dataCard">
                  <h2>{tr(locale, 'Donnees sensibles enregistrees', 'Stored sensitive data', 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ø§Ù„Ù…Ø³Ø¬Ù„Ø©')}</h2>
                  <div className="dataList">
                    {Object.entries(rightsData?.sensitiveFields || {}).map(([key, value]) => (
                      <div key={key} className="dataItem">
                        <span>{key}</span>
                        <strong>{value || '-'}</strong>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="opsCard actionStack">
                  <h2>{tr(locale, 'Actions CNDP', 'CNDP actions', 'Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª CNDP')}</h2>
                  <button type="button" onClick={() => void handleExport()} disabled={busyAction === 'export'}>
                    <Download size={18} />
                    {busyAction === 'export'
                      ? tr(locale, 'Preparation...', 'Preparing...', 'Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ø¶ÙŠØ±...')
                      : tr(locale, 'Exporter mes donnees', 'Export my data', 'ØªØµØ¯ÙŠØ± Ø¨ÙŠØ§Ù†Ø§ØªÙŠ')}
                  </button>
                  <textarea
                    value={requestReason}
                    onChange={(event) => setRequestReason(event.target.value)}
                    placeholder={tr(locale, 'Motif ou precision de la demande', 'Reason or detail for the request', 'Ø³Ø¨Ø¨ Ø§Ù„Ø·Ù„Ø¨ Ø£Ùˆ ØªÙØ§ØµÙŠÙ„Ù‡')}
                  />
                  <div className="inlineActions">
                    <button type="button" onClick={() => void submitDataRequest('rectification')} disabled={busyAction === 'rectification'}>
                      <RefreshCcw size={16} />
                      {tr(locale, 'Demander rectification', 'Request rectification', 'Ø·Ù„Ø¨ Ø§Ù„ØªØµØ­ÙŠØ­')}
                    </button>
                    <button type="button" className="dangerButton" onClick={() => void submitDataRequest('delete-request')} disabled={busyAction === 'delete-request'}>
                      <Trash2 size={16} />
                      {tr(locale, 'Demander suppression', 'Request deletion', 'Ø·Ù„Ø¨ Ø§Ù„Ø­Ø°Ù')}
                    </button>
                  </div>
                </section>
              </div>
              <div className="opsGrid twoCols">
                <section className="opsCard simpleCard">
                  <h2>{tr(locale, 'Historique des consentements', 'Consent history', 'Ø³Ø¬Ù„ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª')}</h2>
                  <ul className="feedList">
                    {(rightsData?.consents || []).map((entry) => (
                      <li key={entry.id}>
                        <strong>{entry.consentType}</strong>
                        <span>{entry.version}</span>
                        <small>{new Date(entry.createdAt).toLocaleString()}</small>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="opsCard simpleCard">
                  <h2>{tr(locale, 'Acces sensibles recents', 'Recent sensitive access', 'Ø§Ù„ÙˆØµÙˆÙ„Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø©')}</h2>
                  <ul className="feedList">
                    {(rightsData?.accessLogs || []).map((entry) => (
                      <li key={entry.id}>
                        <strong>{entry.fieldName}</strong>
                        <span>{entry.reason || '-'}</span>
                        <small>{new Date(entry.createdAt).toLocaleString()}</small>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          ) : null}

          {mode === 'security' ? (
            <>
              <div className="opsGrid twoCols">
                <section className="opsCard actionStack">
                  <h2>{tr(locale, 'Double authentification', 'Two-factor authentication', 'Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©')}</h2>
                  <p>{tr(locale, 'Activez un secret TOTP et conservez les codes de secours dans un coffre sur. Les routes admin exigent cette activation quand elle est imposee.', 'Enable a TOTP secret and keep backup codes in a secure vault. Admin routes require it when enforced.', 'ÙØ¹Ù‘Ù„ Ø³Ø± TOTP ÙˆØ§Ø­ØªÙØ¸ Ø¨Ø±Ù…ÙˆØ² Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯ ÙÙŠ Ù…ÙƒØ§Ù† Ø¢Ù…Ù†. ÙˆØªÙØ±Ø¶ Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø°Ù„Ùƒ Ø¹Ù†Ø¯ ØªÙØ¹ÙŠÙ„Ù‡.')}</p>
                  <div className="inlineActions">
                    <button type="button" onClick={() => void startTwoFactorSetup()} disabled={busyAction === 'setup-2fa'}>
                      <ShieldCheck size={16} />
                      {tr(locale, 'Generer le secret', 'Generate secret', 'Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø³Ø±')}
                    </button>
                  </div>
                  {setupSecret ? (
                    <div className="secretPanel">
                      <strong>{tr(locale, 'Secret genere', 'Generated secret', 'Ø§Ù„Ø³Ø± Ø§Ù„Ù…ÙÙ†Ø´Ø£')}</strong>
                      <code>{setupSecret}</code>
                      <input
                        value={totpCode}
                        onChange={(event) => setTotpCode(event.target.value)}
                        placeholder={tr(locale, 'Code a 6 chiffres', '6-digit code', 'Ø±Ù…Ø² Ù…Ù† 6 Ø£Ø±Ù‚Ø§Ù…')}
                      />
                      <div className="inlineActions">
                        <button type="button" onClick={() => void verifyTwoFactor('verify')} disabled={busyAction === 'verify'}>
                          <CheckCircle2 size={16} />
                          {tr(locale, 'Verifier et activer', 'Verify and enable', 'Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„ØªÙØ¹ÙŠÙ„')}
                        </button>
                        <button type="button" className="dangerButton" onClick={() => void verifyTwoFactor('disable')} disabled={busyAction === 'disable'}>
                          <AlertCircle size={16} />
                          {tr(locale, 'Desactiver', 'Disable', 'ØªØ¹Ø·ÙŠÙ„')}
                        </button>
                      </div>
                      {backupCodes.length ? (
                        <div className="backupGrid">
                          {backupCodes.map((code) => (
                            <code key={code}>{code}</code>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>
                <section className="opsCard simpleCard">
                  <h2>{tr(locale, 'Journal du compte', 'Account log', 'Ø³Ø¬Ù„ Ø§Ù„Ø­Ø³Ø§Ø¨')}</h2>
                  <ul className="feedList">
                    {logs.map((entry) => (
                      <li key={entry.id}>
                        <strong>{entry.eventType}</strong>
                        <span>{entry.ipAddress}</span>
                        <small>{new Date(entry.createdAt).toLocaleString()}</small>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      <style jsx>{`
        .simpleCard,
        .dataCard,
        .actionCard,
        .actionStack {
          padding: 26px;
          display: grid;
          gap: 14px;
        }

        .opsGrid {
          display: grid;
          gap: 18px;
        }

        .opsGrid.threeCols {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .opsGrid.twoCols {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .simpleCard h2,
        .dataCard h2,
        .actionCard strong,
        .actionStack h2 {
          margin: 0;
          color: #0f172a;
        }

        .simpleCard p,
        .dataCard p,
        .actionCard p,
        .actionStack p {
          margin: 0;
          color: #475569;
          line-height: 1.7;
        }

        .actionCard a,
        .inlineActions button,
        .actionStack button {
          width: fit-content;
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 16px;
          border-radius: 15px;
          border: 1px solid rgba(37, 99, 235, 0.18);
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          text-decoration: none;
          font-weight: 700;
          cursor: pointer;
        }

        .actionStack textarea,
        .secretPanel input {
          width: 100%;
          min-height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(203, 213, 225, 0.9);
          background: rgba(255, 255, 255, 0.98);
          color: #0f172a;
          font: inherit;
          padding: 14px 16px;
          resize: vertical;
        }

        .dangerButton {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-color: rgba(220, 38, 38, 0.18);
        }

        .inlineActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .dataList,
        .feedList,
        .backupGrid {
          display: grid;
          gap: 12px;
        }

        .dataItem,
        .feedList li {
          display: grid;
          gap: 4px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(248, 250, 252, 0.84);
        }

        .dataItem span,
        .feedList li span,
        .feedList li small {
          color: #64748b;
        }

        .secretPanel {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(239, 246, 255, 0.9);
          border: 1px solid rgba(147, 197, 253, 0.32);
        }

        .secretPanel code,
        .backupGrid code {
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.06);
          color: #0f172a;
          word-break: break-all;
        }

        .backupGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .iconWrap {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
        }

        .iconWrap.blue {
          background: rgba(219, 234, 254, 0.84);
          color: #1d4ed8;
        }

        .iconWrap.mint {
          background: rgba(209, 250, 229, 0.84);
          color: #059669;
        }

        .iconWrap.light {
          background: rgba(241, 245, 249, 0.92);
          color: #334155;
        }

        @media (max-width: 960px) {
          .opsGrid.twoCols,
          .opsGrid.threeCols {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .simpleCard,
          .dataCard,
          .actionCard,
          .actionStack {
            padding: 22px;
          }

          .backupGrid {
            grid-template-columns: 1fr;
          }
        }

        html[data-theme='dark'] .simpleCard h2,
        html[data-theme='dark'] .dataCard h2,
        html[data-theme='dark'] .actionCard strong,
        html[data-theme='dark'] .actionStack h2,
        html[data-theme='dark'] .secretPanel code,
        html[data-theme='dark'] .backupGrid code,
        html[data-theme='dark'] .actionStack textarea,
        html[data-theme='dark'] .secretPanel input {
          color: #e2e8f0;
        }

        html[data-theme='dark'] .simpleCard p,
        html[data-theme='dark'] .dataCard p,
        html[data-theme='dark'] .actionCard p,
        html[data-theme='dark'] .actionStack p,
        html[data-theme='dark'] .dataItem span,
        html[data-theme='dark'] .feedList li span,
        html[data-theme='dark'] .feedList li small {
          color: rgba(226, 232, 240, 0.72);
        }

        html[data-theme='dark'] .dataItem,
        html[data-theme='dark'] .feedList li,
        html[data-theme='dark'] .secretPanel,
        html[data-theme='dark'] .actionStack textarea,
        html[data-theme='dark'] .secretPanel input,
        html[data-theme='dark'] .secretPanel code,
        html[data-theme='dark'] .backupGrid code {
          background: rgba(15, 23, 42, 0.78);
          border-color: rgba(71, 85, 105, 0.45);
        }
      `}</style>
    </WorkspaceShell>
  );
}

export function BusinessProfileWorkspace({ locale }: BusinessProfileWorkspaceProps) {
  const { isLoaded, isSignedIn } = useUser();
  const fetchAuthed = useAuthenticatedFetch();
  const [form, setForm] = useState<BusinessProfileState>(emptyBusinessProfile);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'danger'>('neutral');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await parseApiResponse(await fetchAuthed('/business/profile'));
        if (!cancelled && data) {
          setForm({
            companyName: data.companyName || '',
            rc: data.rc || '',
            ice: data.ice || '',
            ifNumber: data.ifNumber || '',
            cnss: data.cnss || '',
            patente: data.patente || '',
            legalAddress: data.legalAddress || '',
            sector: data.sector || '',
            companySize: data.companySize || '',
            website: data.website || '',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Unable to load business profile.');
          setMessageTone('danger');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchAuthed, isLoaded, isSignedIn]);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const data = await parseApiResponse(
        await fetchAuthed('/business/profile', {
          method: 'PUT',
          body: JSON.stringify(form),
        }),
      );
      setForm({
        companyName: data.companyName || '',
        rc: data.rc || '',
        ice: data.ice || '',
        ifNumber: data.ifNumber || '',
        cnss: data.cnss || '',
        patente: data.patente || '',
        legalAddress: data.legalAddress || '',
        sector: data.sector || '',
        companySize: data.companySize || '',
        website: data.website || '',
      });
      setMessage(tr(locale, 'Profil business enregistre.', 'Business profile saved.', 'ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ù„Ù Ø§Ù„ØªØ¬Ø§Ø±ÙŠ.'));
      setMessageTone('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save business profile.');
      setMessageTone('danger');
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      locale={locale}
      eyebrow={tr(locale, 'Entreprise', 'Business', 'Ø§Ù„Ø´Ø±ÙƒØ©')}
      title={tr(locale, 'Identifiants legaux business', 'Business legal identifiers', 'Ø§Ù„Ù…Ø¹Ø±Ù‘ÙØ§Øª Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠØ© Ù„Ù„Ø´Ø±ÙƒØ©')}
      lead={tr(locale, 'Cette fiche alimente la facturation, la verification KYB et les surfaces business marocaines du compte.', 'This form powers billing, KYB verification and Moroccan business surfaces for the account.', 'ØªØºØ°ÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ø¨Ø·Ø§Ù‚Ø© Ø§Ù„ÙÙˆØªØ±Ø© ÙˆØ§Ù„ØªØ­Ù‚Ù‚ KYB ÙˆØ§Ù„Ù…Ø³Ø§Ø­Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ© Ù„Ù„Ø­Ø³Ø§Ø¨.')}
    >
      {message ? <MessageBanner tone={messageTone}>{message}</MessageBanner> : null}
      {loading ? <div className="opsCard simpleBusinessCard"><p>{tr(locale, 'Chargement du profil business...', 'Loading business profile...', 'Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù„Ù Ø§Ù„ØªØ¬Ø§Ø±ÙŠ...')}</p></div> : null}
      {!loading && isSignedIn ? (
        <section className="opsCard businessForm">
          <div className="businessGrid">
            {Object.entries({
              companyName: tr(locale, 'Nom entreprise', 'Company name', 'Ø§Ø³Ù… Ø§Ù„Ø´Ø±ÙƒØ©'),
              rc: 'RC',
              ice: 'ICE',
              ifNumber: 'IF',
              cnss: 'CNSS',
              patente: tr(locale, 'Patente', 'Patente', 'Ø§Ù„Ø¨ØªØ§Ù†ØªØ§'),
              sector: tr(locale, 'Secteur', 'Sector', 'Ø§Ù„Ù‚Ø·Ø§Ø¹'),
              companySize: tr(locale, 'Taille entreprise', 'Company size', 'Ø­Ø¬Ù… Ø§Ù„Ø´Ø±ÙƒØ©'),
              website: tr(locale, 'Site web', 'Website', 'Ø§Ù„Ù…ÙˆÙ‚Ø¹'),
            }).map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  value={form[key as keyof BusinessProfileState] as string}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </label>
            ))}
            <label className="fullWidth">
              <span>{tr(locale, 'Adresse legale', 'Legal address', 'Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠ')}</span>
              <textarea
                value={form.legalAddress}
                onChange={(event) => setForm((current) => ({ ...current, legalAddress: event.target.value }))}
              />
            </label>
          </div>
          <div className="inlineActions">
            <button type="button" onClick={() => void handleSave()} disabled={saving}>
              <Landmark size={16} />
              {saving
                ? tr(locale, 'Enregistrement...', 'Saving...', 'Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸...')
                : tr(locale, 'Enregistrer', 'Save', 'Ø­ÙØ¸')}
            </button>
            <Link href={localizeHref(locale, '/verification')}>{tr(locale, 'Ouvrir la verification', 'Open verification', 'ÙØªØ­ Ø§Ù„ØªØ­Ù‚Ù‚')}</Link>
          </div>
        </section>
      ) : null}
      <style jsx>{`
        .simpleBusinessCard,
        .businessForm {
          padding: 26px;
        }

        .businessGrid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .businessGrid label {
          display: grid;
          gap: 8px;
        }

        .businessGrid label span {
          color: #0f172a;
          font-weight: 700;
        }

        .businessGrid input,
        .businessGrid textarea {
          width: 100%;
          min-height: 52px;
          padding: 0 14px;
          border-radius: 16px;
          border: 1px solid rgba(203, 213, 225, 0.9);
          background: rgba(255, 255, 255, 0.98);
          color: #0f172a;
          font: inherit;
        }

        .businessGrid textarea {
          min-height: 110px;
          padding: 14px;
          resize: vertical;
        }

        .businessGrid .fullWidth {
          grid-column: 1 / -1;
        }

        .inlineActions {
          margin-top: 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .inlineActions :global(a),
        .inlineActions button {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 16px;
          border-radius: 15px;
          border: 1px solid rgba(37, 99, 235, 0.18);
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          text-decoration: none;
          font-weight: 700;
        }

        @media (max-width: 720px) {
          .businessGrid {
            grid-template-columns: 1fr;
          }
        }

        html[data-theme='dark'] .businessGrid label span,
        html[data-theme='dark'] .businessGrid input,
        html[data-theme='dark'] .businessGrid textarea {
          color: #e2e8f0;
        }

        html[data-theme='dark'] .businessGrid input,
        html[data-theme='dark'] .businessGrid textarea {
          background: rgba(15, 23, 42, 0.82);
          border-color: rgba(71, 85, 105, 0.42);
        }
      `}</style>
    </WorkspaceShell>
  );
}

export function BillingWorkspace({ locale, mode, plan }: BillingWorkspaceProps) {
  const { isLoaded, isSignedIn } = useUser();
  const fetchAuthed = useAuthenticatedFetch();
  const [overview, setOverview] = useState<BillingOverviewState | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'danger'>('neutral');
  const [checkoutResult, setCheckoutResult] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (mode === 'invoices') {
          const data = await parseApiResponse(await fetchAuthed('/billing/invoices'));
          if (!cancelled) {
            setInvoices(Array.isArray(data) ? data : []);
          }
        } else {
          const data = await parseApiResponse(await fetchAuthed('/billing/subscription'));
          if (!cancelled) {
            setOverview(data);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Unable to load billing data.');
          setMessageTone('danger');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchAuthed, isLoaded, isSignedIn, mode]);

  async function startCheckout() {
    if (!plan) {
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const data = await parseApiResponse(
        await fetchAuthed('/payments/cmi/init', {
          method: 'POST',
          body: JSON.stringify({ plan }),
        }),
      );
      setCheckoutResult(data);
      if (typeof data?.redirectUrl === 'string' && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setMessage(
        typeof data?.message === 'string'
          ? data.message
          : tr(locale, 'Le checkout a ete prepare.', 'Checkout is prepared.', 'ØªÙ… ØªØ¬Ù‡ÙŠØ² Ø§Ù„Ø¯ÙØ¹.'),
      );
      setMessageTone(data?.configured ? 'success' : 'neutral');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
      setMessageTone('danger');
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === 'overview'
      ? tr(locale, 'Facturation et abonnement', 'Billing and subscription', 'Ø§Ù„ÙÙˆØªØ±Ø© ÙˆØ§Ù„Ø§Ø´ØªØ±Ø§Ùƒ')
      : mode === 'invoices'
        ? tr(locale, 'Factures en MAD', 'Invoices in MAD', 'Ø§Ù„ÙÙˆØ§ØªÙŠØ± Ø¨Ø§Ù„Ø¯Ø±Ù‡Ù…')
        : mode === 'payment-methods'
          ? tr(locale, 'Paiements et passerelle CMI', 'Payments and CMI gateway', 'Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ¨ÙˆØ§Ø¨Ø© CMI')
          : tr(locale, 'Checkout du plan', 'Plan checkout', 'Ø¯ÙØ¹ Ø§Ù„Ø®Ø·Ø©');
  const lead =
    mode === 'overview'
      ? tr(locale, 'Historique de paiements, TVA 20 %, statut d abonnement et preparation CMI dans un seul espace.', 'Payment history, 20% VAT, subscription state and CMI readiness in one workspace.', 'Ø³Ø¬Ù„ Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ¶Ø±ÙŠØ¨Ø© 20Ùª ÙˆØ­Ø§Ù„Ø© Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ÙˆØ¬Ù‡ÙˆØ²ÙŠØ© CMI ÙÙŠ Ù…Ø³Ø§Ø­Ø© ÙˆØ§Ø­Ø¯Ø©.')
      : mode === 'invoices'
        ? tr(locale, 'Les factures generees sont listees ici avec les mentions business associees.', 'Generated invoices are listed here with the linked business mentions.', 'ØªÙØ¹Ø±Ø¶ Ø§Ù„ÙÙˆØ§ØªÙŠØ± Ø§Ù„Ù…ÙˆÙ„Ø¯Ø© Ù‡Ù†Ø§ Ù…Ø¹ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø±ÙƒØ© Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©.')
        : mode === 'payment-methods'
          ? tr(locale, 'La couche de paiement marocaine est prete pour la passerelle CMI et la facturation en MAD.', 'The Moroccan payment layer is ready for CMI and MAD billing.', 'Ø·Ø¨Ù‚Ø© Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ© Ø¬Ø§Ù‡Ø²Ø© Ù„Ø¨ÙˆØ§Ø¨Ø© CMI ÙˆØ§Ù„ÙÙˆØªØ±Ø© Ø¨Ø§Ù„Ø¯Ø±Ù‡Ù….')
          : tr(locale, 'Validez la preparation du paiement CMI sans casser le style actuel du site.', 'Validate CMI payment preparation without changing the site style.', 'ØªØ­Ù‚Ù‚ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯ Ø¯ÙØ¹ CMI Ø¯ÙˆÙ† ÙƒØ³Ø± Ø£Ø³Ù„ÙˆØ¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø­Ø§Ù„ÙŠ.');

  return (
    <WorkspaceShell locale={locale} eyebrow={tr(locale, 'Facturation', 'Billing', 'Ø§Ù„ÙÙˆØªØ±Ø©')} title={title} lead={lead}>
      {message ? <MessageBanner tone={messageTone}>{message}</MessageBanner> : null}
      {loading ? <div className="opsCard billCard"><p>{tr(locale, 'Chargement de la facturation...', 'Loading billing...', 'Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙÙˆØªØ±Ø©...')}</p></div> : null}
      {!loading && isSignedIn ? (
        <>
          {mode === 'overview' && overview ? (
            <div className="billingLayout">
              <section className="opsCard billCard">
                <h2>{tr(locale, 'Abonnement actuel', 'Current subscription', 'Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ')}</h2>
                <div className="metricGrid">
                  <div><span>{tr(locale, 'Plan', 'Plan', 'Ø§Ù„Ø®Ø·Ø©')}</span><strong>{overview.currentSubscription?.plan || 'FREE'}</strong></div>
                  <div><span>{tr(locale, 'Statut', 'Status', 'Ø§Ù„Ø­Ø§Ù„Ø©')}</span><strong>{overview.currentSubscription?.status || 'DRAFT'}</strong></div>
                  <div><span>{tr(locale, 'Renouvellement', 'Renewal', 'Ø§Ù„ØªØ¬Ø¯ÙŠØ¯')}</span><strong>{overview.currentSubscription?.renewsAt ? new Date(overview.currentSubscription.renewsAt).toLocaleDateString() : '-'}</strong></div>
                </div>
              </section>
              <section className="opsCard billCard">
                <h2>{tr(locale, 'Offres disponibles', 'Available plans', 'Ø§Ù„Ø¹Ø±ÙˆØ¶ Ø§Ù„Ù…ØªØ§Ø­Ø©')}</h2>
                <div className="planGrid">
                  {overview.plans.map((entry) => (
                    <article key={entry.id} className="planCard">
                      <strong>{entry.label}</strong>
                      <span>{entry.amountTTC} MAD TTC</span>
                      <small>{entry.amountHT} MAD HT + {entry.vatAmount} MAD TVA</small>
                      <Link href={localizeHref(locale, `/checkout/${entry.id}`)}>
                        <ArrowRight size={16} />
                        {tr(locale, 'Ouvrir le checkout', 'Open checkout', 'ÙØªØ­ Ø§Ù„Ø¯ÙØ¹')}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {mode === 'invoices' ? (
            <section className="opsCard billCard">
              <h2>{tr(locale, 'Historique des factures', 'Invoice history', 'Ø³Ø¬Ù„ Ø§Ù„ÙÙˆØ§ØªÙŠØ±')}</h2>
              <div className="invoiceList">
                {invoices.map((invoice) => (
                  <article key={invoice.id} className="invoiceItem">
                    <strong>{invoice.invoiceNumber}</strong>
                    <span>{invoice.companyName || 'Communium'}</span>
                    <small>{invoice.amountTTC} MAD TTC</small>
                    <small>{new Date(invoice.createdAt).toLocaleDateString()}</small>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {mode === 'payment-methods' && overview ? (
            <section className="opsCard billCard">
              <h2>{tr(locale, 'Passerelle marocaine', 'Moroccan gateway', 'Ø§Ù„Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ©')}</h2>
              <div className="metricGrid">
                <div><span>CMI</span><strong>{tr(locale, 'Pret a connecter', 'Ready to connect', 'Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ø±Ø¨Ø·')}</strong></div>
                <div><span>{tr(locale, 'Devise', 'Currency', 'Ø§Ù„Ø¹Ù…Ù„Ø©')}</span><strong>MAD</strong></div>
                <div><span>{tr(locale, 'TVA', 'VAT', 'Ø§Ù„Ø¶Ø±ÙŠØ¨Ø©')}</span><strong>20%</strong></div>
              </div>
              <p>{tr(locale, 'Le flux initialise les montants HT / TVA / TTC, l abonnement et la facture. La redirection finale depend des identifiants bancaires de production.', 'The flow prepares HT / VAT / TTC totals, the subscription and the invoice. Final redirection depends on production banking credentials.', 'ÙŠÙ‚ÙˆÙ… Ø§Ù„ØªØ¯ÙÙ‚ Ø¨Ø¥Ø¹Ø¯Ø§Ø¯ Ù…Ø¨Ø§Ù„Øº HT / TVA / TTC ÙˆØ§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ÙˆØ§Ù„ÙØ§ØªÙˆØ±Ø©ØŒ Ø¨ÙŠÙ†Ù…Ø§ ØªØ¹ØªÙ…Ø¯ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªÙˆØ¬ÙŠÙ‡ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ© Ø¹Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¨Ù†Ùƒ Ø§Ù„Ø¥Ù†ØªØ§Ø¬ÙŠØ©.')}</p>
            </section>
          ) : null}

          {mode === 'checkout' ? (
            <section className="opsCard billCard">
              <h2>{tr(locale, 'Lancer le paiement CMI', 'Start CMI payment', 'Ø¨Ø¯Ø¡ Ø¯ÙØ¹ CMI')}</h2>
              <p>{tr(locale, 'Le checkout prepare l abonnement, le paiement et la facture en MAD avant redirection vers la passerelle.', 'The checkout prepares the subscription, payment and invoice in MAD before redirecting to the gateway.', 'ÙŠÙ‚ÙˆÙ… Ø§Ù„Ø¯ÙØ¹ Ø¨Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ÙˆØ§Ù„Ø¯ÙØ¹ ÙˆØ§Ù„ÙØ§ØªÙˆØ±Ø© Ø¨Ø§Ù„Ø¯Ø±Ù‡Ù… Ù‚Ø¨Ù„ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø©.')}</p>
              <div className="inlineActions">
                <button type="button" onClick={() => void startCheckout()} disabled={busy}>
                  <Sparkles size={16} />
                  {busy
                    ? tr(locale, 'Preparation...', 'Preparing...', 'Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ø¶ÙŠØ±...')
                    : tr(locale, 'Initialiser CMI', 'Initialize CMI', 'ØªÙ‡ÙŠØ¦Ø© CMI')}
                </button>
                <Link href={localizeHref(locale, '/billing')}>{tr(locale, 'Retour facturation', 'Back to billing', 'Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„ÙÙˆØªØ±Ø©')}</Link>
              </div>
              {checkoutResult ? (
                <pre className="checkoutPreview">{JSON.stringify(checkoutResult, null, 2)}</pre>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
      <style jsx>{`
        .billCard {
          padding: 26px;
          display: grid;
          gap: 14px;
        }

        .billingLayout,
        .planGrid,
        .metricGrid,
        .invoiceList {
          display: grid;
          gap: 16px;
        }

        .billingLayout {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .planGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .metricGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .metricGrid div,
        .planCard,
        .invoiceItem {
          display: grid;
          gap: 6px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.88);
          background: rgba(248, 250, 252, 0.84);
        }

        .metricGrid span,
        .planCard small,
        .invoiceItem small,
        .invoiceItem span {
          color: #64748b;
        }

        .planCard :global(a),
        .inlineActions :global(a),
        .inlineActions button {
          width: fit-content;
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 16px;
          border-radius: 15px;
          border: 1px solid rgba(37, 99, 235, 0.18);
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          text-decoration: none;
          font-weight: 700;
        }

        .inlineActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .checkoutPreview {
          margin: 0;
          padding: 16px;
          border-radius: 18px;
          overflow: auto;
          background: rgba(15, 23, 42, 0.92);
          color: #e2e8f0;
        }

        @media (max-width: 960px) {
          .billingLayout,
          .planGrid,
          .metricGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </WorkspaceShell>
  );
}
