'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';
import {
  formatVerificationFileSize,
  normalizeVerificationAccountType,
  normalizeVerificationStatus,
  verificationAccountLabel,
  verificationDocumentLabel,
  verificationStatusLabel,
  verificationTone,
  type VerificationDocumentRecord,
  type VerificationStatus,
} from '@/lib/verification';

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const adminVerificationApiBase = backendOrigin ? `${backendOrigin}/api/admin/verifications` : '/api/admin/verifications';

function backendUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${backendOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

interface AdminVerificationItem {
  id: string;
  userId: number;
  username?: string | null;
  email?: string | null;
  accountType: 'PERSONAL' | 'BUSINESS';
  status: VerificationStatus;
  badgeLabel?: string | null;
  fullName?: string | null;
  role?: string | null;
  company?: string | null;
  location?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  documentCount: number;
  progress: {
    uploaded: number;
    required: number;
    percent: number;
    missingDocumentLabels: string[];
  };
  documents: VerificationDocumentRecord[];
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
  }>;
  auditLogs?: Array<{
    id: string;
    action: string;
    actorUsername?: string | null;
    createdAt?: string | null;
  }>;
}

interface AdminVerificationResponse {
  success?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  stats?: Record<string, number>;
  data?: AdminVerificationItem[];
  error?: string;
}

type StatusFilter = 'ALL' | VerificationStatus;
type AccountTypeFilter = 'ALL' | 'PERSONAL' | 'BUSINESS';

export default function AdminVerificationWorkspace({
  locale,
  initialVerificationId,
}: {
  locale: Locale;
  initialVerificationId?: string;
}) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const isFrench = locale === 'fr';
  const dashboardHref = localizeHref(locale, '/dashboard');
  const verificationHref = localizeHref(locale, '/profile/settings/verification');

  const [items, setItems] = useState<AdminVerificationItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<AccountTypeFilter>('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(
    isFrench ? 'Chargement des demandes de verification...' : 'Loading verification requests...'
  );
  const [selectedId, setSelectedId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submittingId, setSubmittingId] = useState('');

  const actorHeaders = useMemo(
    () => ({
      'x-user-email': user?.primaryEmailAddress?.emailAddress || '',
      'x-user-name': user?.fullName || user?.username || 'Communium admin',
      'x-user-username': user?.username || '',
      'x-user-account-type': normalizeVerificationAccountType(
        typeof user?.unsafeMetadata?.accountType === 'string' ? user.unsafeMetadata.accountType : null
      ),
    }),
    [user?.fullName, user?.primaryEmailAddress?.emailAddress, user?.unsafeMetadata?.accountType, user?.username]
  );

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    if (initialVerificationId) {
      void loadVerificationDetail(initialVerificationId);
      return;
    }

    void loadVerifications();
  }, [getToken, initialVerificationId, isLoaded, page, search, statusFilter, typeFilter, user]);

  async function authorizedHeaders(json = true) {
    const token = await getToken();

    if (!token) {
      throw new Error(isFrench ? 'Session admin indisponible.' : 'Admin session unavailable.');
    }

    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...actorHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  async function loadVerifications() {
    try {
      setLoading(true);
      setStatusMessage(isFrench ? 'Chargement des demandes de verification...' : 'Loading verification requests...');
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      if (typeFilter !== 'ALL') {
        params.set('type', typeFilter);
      }

      const response = await fetch(`${adminVerificationApiBase}?${params.toString()}`, {
        headers: await authorizedHeaders(false),
        cache: 'no-store',
      });
      const body = (await response.json()) as AdminVerificationResponse;

      if (!response.ok || !body.success) {
        throw new Error(
          body.error ||
            (response.status === 403
              ? isFrench
                ? 'Acces admin requis pour la verification.'
                : 'Admin access is required for verification.'
              : isFrench
                ? 'Impossible de charger les verifications.'
                : 'Unable to load verifications.')
        );
      }

      setItems(body.data || []);
      setStats(body.stats || {});
      setTotal(body.total || 0);
      setStatusMessage(
        body.total
          ? isFrench
            ? `${body.total} dossier(s) disponibles.`
            : `${body.total} request(s) available.`
          : isFrench
            ? 'Aucune demande de verification pour le moment.'
            : 'No verification request yet.'
      );
    } catch (error) {
      setItems([]);
      setStats({});
      setTotal(0);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : isFrench
            ? 'Chargement admin impossible.'
            : 'Unable to load admin requests.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadVerificationDetail(verificationId: string) {
    try {
      setLoading(true);
      setStatusMessage(isFrench ? 'Chargement du dossier cible...' : 'Loading verification request...');
      const response = await fetch(`${adminVerificationApiBase}/${verificationId}`, {
        headers: await authorizedHeaders(false),
        cache: 'no-store',
      });
      const body = (await response.json()) as { success?: boolean; data?: AdminVerificationItem; error?: string };

      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error || (isFrench ? 'Impossible de charger le dossier cible.' : 'Unable to load the selected request.'));
      }

      setItems([body.data]);
      setStats({
        NON_VERIFIED: body.data.status === 'NON_VERIFIED' ? 1 : 0,
        PENDING: body.data.status === 'PENDING' ? 1 : 0,
        VERIFIED: body.data.status === 'VERIFIED' ? 1 : 0,
        REJECTED: body.data.status === 'REJECTED' ? 1 : 0,
      });
      setTotal(1);
      setStatusMessage(
        isFrench
          ? 'Dossier de verification charge.'
          : 'Verification request loaded.'
      );
    } catch (error) {
      setItems([]);
      setStats({});
      setTotal(0);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : isFrench
            ? 'Chargement admin impossible.'
            : 'Unable to load admin request.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function approve(item: AdminVerificationItem) {
    try {
      setSubmittingId(item.id);
      setStatusMessage(isFrench ? 'Validation en cours...' : 'Approving verification...');
      const response = await fetch(`${adminVerificationApiBase}/${item.id}/approve`, {
        method: 'POST',
        headers: await authorizedHeaders(),
      });
      const body = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !body.success) {
        throw new Error(body.error || (isFrench ? 'Validation impossible.' : 'Approval failed.'));
      }

      setStatusMessage(isFrench ? 'Le dossier a ete approuve.' : 'Verification approved.');
      await loadVerifications();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : isFrench ? 'Validation impossible.' : 'Approval failed.');
    } finally {
      setSubmittingId('');
    }
  }

  async function reject(item: AdminVerificationItem) {
    if (!rejectReason.trim()) {
      setStatusMessage(isFrench ? 'Ajoute une raison du rejet.' : 'Add a rejection reason.');
      return;
    }

    try {
      setSubmittingId(item.id);
      setStatusMessage(isFrench ? 'Rejet du dossier en cours...' : 'Rejecting verification...');
      const response = await fetch(`${adminVerificationApiBase}/${item.id}/reject`, {
        method: 'POST',
        headers: await authorizedHeaders(),
        body: JSON.stringify({
          rejectionReason: rejectReason.trim(),
        }),
      });
      const body = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !body.success) {
        throw new Error(body.error || (isFrench ? 'Rejet impossible.' : 'Rejection failed.'));
      }

      setStatusMessage(isFrench ? 'Le dossier a ete rejete.' : 'Verification rejected.');
      setRejectReason('');
      setSelectedId('');
      await loadVerifications();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : isFrench ? 'Rejet impossible.' : 'Rejection failed.');
    } finally {
      setSubmittingId('');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const statusTone = statusMessage.toLowerCase().includes('rejet') || statusMessage.toLowerCase().includes('impossible')
    ? 'danger'
    : statusMessage.toLowerCase().includes('approuv') || statusMessage.toLowerCase().includes('disponible')
      ? 'success'
      : 'neutral';

  if (!isLoaded) {
    return (
      <main className="adminVerificationPage">
        <div className="adminShell">
          <section className="heroCard">
            <span className="eyebrow">{isFrench ? 'Verification admin' : 'Admin verification'}</span>
            <h1>{isFrench ? 'Chargement de l espace de revue...' : 'Loading review workspace...'}</h1>
          </section>
          <AdminVerificationStyles />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="adminVerificationPage">
        <div className="adminShell">
          <section className="heroCard">
            <span className="eyebrow">{isFrench ? 'Acces membre' : 'Member access'}</span>
            <h1>{isFrench ? 'Connecte-toi pour ouvrir la revue KYC / KYB.' : 'Sign in to open the KYC / KYB review desk.'}</h1>
            <div className="heroActionRow">
              <Link href={localizeHref(locale, '/auth/sign-in')} className="primaryButton">
                {isFrench ? 'Se connecter' : 'Sign in'}
              </Link>
            </div>
          </section>
          <AdminVerificationStyles />
        </div>
      </main>
    );
  }

  return (
    <main className="adminVerificationPage">
      <div className="adminShell">
        <section className="heroCard">
          <div className="heroTop">
            <div>
              <span className="eyebrow">{isFrench ? 'Verification admin' : 'Admin verification'}</span>
              <h1>{isFrench ? 'Relire les dossiers sans casser le rythme du produit.' : 'Review trust files without breaking product flow.'}</h1>
              <p>
                {isFrench
                  ? 'Cet espace permet de valider ou rejeter les dossiers KYC / KYB dans le style actuel de Communium, avec des statuts clairs et des documents proteges.'
                  : "This workspace lets you approve or reject KYC / KYB files inside Communium's current style, with clear states and protected files."}
              </p>
            </div>

            <div className="heroActionRow">
              <Link href={dashboardHref} className="ghostButton">
                <ArrowLeft className="buttonIcon" strokeWidth={2.1} />
                {isFrench ? 'Retour dashboard' : 'Back to dashboard'}
              </Link>
              <Link href={verificationHref} className="ghostButton">
                <ShieldCheck className="buttonIcon" strokeWidth={2.1} />
                {isFrench ? 'Vue membre' : 'Member view'}
              </Link>
              <button
                type="button"
                className="primaryButton"
                onClick={() =>
                  void (initialVerificationId ? loadVerificationDetail(initialVerificationId) : loadVerifications())
                }
              >
                <RefreshCw className="buttonIcon" strokeWidth={2.1} />
                {isFrench ? 'Actualiser' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="summaryGrid">
            <MetricCard
              label={isFrench ? 'Total' : 'Total'}
              value={String(total)}
              helper={isFrench ? 'Demandes visibles' : 'Visible requests'}
              icon={<FileText strokeWidth={2.1} />}
            />
            <MetricCard
              label={isFrench ? 'En attente' : 'Pending'}
              value={String(stats.PENDING || 0)}
              helper={isFrench ? 'A relire' : 'To review'}
              icon={<ShieldCheck strokeWidth={2.1} />}
              tone="warning"
            />
            <MetricCard
              label={isFrench ? 'Verifies' : 'Verified'}
              value={String(stats.VERIFIED || 0)}
              helper={isFrench ? 'Badges actifs' : 'Active badges'}
              icon={<BadgeCheck strokeWidth={2.1} />}
              tone="success"
            />
            <MetricCard
              label={isFrench ? 'Rejetes' : 'Rejected'}
              value={String(stats.REJECTED || 0)}
              helper={isFrench ? 'A corriger' : 'Needs corrections'}
              icon={<XCircle strokeWidth={2.1} />}
              tone="danger"
            />
          </div>
        </section>

        <section className={`statusStrip ${statusTone}`}>
          <span className="statusDot" />
          <span>{statusMessage}</span>
        </section>

        {!initialVerificationId ? (
        <section className="toolbarCard">
          <label className="searchField">
            <Search className="searchIcon" strokeWidth={2.1} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={isFrench ? 'Rechercher un membre, une entreprise ou un email' : 'Search a member, company or email'}
            />
          </label>

          <div className="toolbarActions">
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as StatusFilter);
              }}
            >
              <option value="ALL">{isFrench ? 'Tous les statuts' : 'All statuses'}</option>
              <option value="NON_VERIFIED">{isFrench ? 'Non verifie' : 'Not verified'}</option>
              <option value="PENDING">{isFrench ? 'En attente' : 'Pending'}</option>
              <option value="VERIFIED">{isFrench ? 'Verifie' : 'Verified'}</option>
              <option value="REJECTED">{isFrench ? 'Rejete' : 'Rejected'}</option>
            </select>
            <select
              value={typeFilter}
              onChange={(event) => {
                setPage(1);
                setTypeFilter(event.target.value as AccountTypeFilter);
              }}
            >
              <option value="ALL">{isFrench ? 'Tous les comptes' : 'All account types'}</option>
              <option value="PERSONAL">{isFrench ? 'Personnel' : 'Personal'}</option>
              <option value="BUSINESS">{isFrench ? 'Business' : 'Business'}</option>
            </select>
            <button
              type="button"
              className="ghostButton compactButton"
              onClick={() => {
                setPage(1);
                setSearch(searchInput);
              }}
            >
              {isFrench ? 'Filtrer' : 'Filter'}
            </button>
          </div>
        </section>
        ) : null}

        <section className="listSection">
          {loading ? (
            <article className="emptyCard">
              <strong>{isFrench ? 'Chargement des dossiers...' : 'Loading files...'}</strong>
              <p>{isFrench ? 'Les demandes de verification arrivent dans quelques secondes.' : 'Verification requests will appear in a few seconds.'}</p>
            </article>
          ) : items.length ? (
            <div className="requestStack">
              {items.map((item) => {
                const tone = verificationTone(normalizeVerificationStatus(item.status));
                const isRejecting = selectedId === item.id;
                return (
                  <article key={item.id} className="requestCard">
                    <div className="requestHead">
                      <div className="identityBlock">
                        <span className={`identityIcon ${item.accountType === 'BUSINESS' ? 'business' : 'personal'}`}>
                          {item.accountType === 'BUSINESS' ? <Building2 strokeWidth={2.1} /> : <UserRound strokeWidth={2.1} />}
                        </span>
                        <div>
                          <div className="titleRow">
                            <h3>{item.fullName || item.username || (isFrench ? 'Compte Communium' : 'Communium account')}</h3>
                            <span className={`statusPill ${tone}`}>{verificationStatusLabel(item.status, locale)}</span>
                            {item.badgeLabel ? <span className="verifiedBadge">{item.badgeLabel}</span> : null}
                          </div>
                          <p>
                            {verificationAccountLabel(item.accountType, locale)}
                            {item.email ? ` · ${item.email}` : ''}
                            {item.location ? ` · ${item.location}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="actionCluster">
                        <button
                          type="button"
                          className="primaryButton compactButton"
                          disabled={submittingId === item.id}
                          onClick={() => void approve(item)}
                        >
                          {submittingId === item.id ? (isFrench ? 'En cours...' : 'Working...') : isFrench ? 'Approuver' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          className="ghostButton compactButton"
                          disabled={submittingId === item.id}
                          onClick={() => {
                            setSelectedId((current) => (current === item.id ? '' : item.id));
                            setRejectReason(item.rejectionReason || '');
                          }}
                        >
                          {isFrench ? 'Rejeter' : 'Reject'}
                        </button>
                        {!initialVerificationId ? (
                          <Link href={localizeHref(locale, `/admin/verifications/${item.id}`)} className="ghostButton compactButton">
                            {isFrench ? 'Detail' : 'Detail'}
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className="requestMetaGrid">
                      <InfoCell
                        label={isFrench ? 'Dossier' : 'File'}
                        value={`${item.progress.uploaded}/${item.progress.required}`}
                        helper={item.progress.percent ? `${item.progress.percent}%` : isFrench ? 'En preparation' : 'Preparing'}
                      />
                      <InfoCell
                        label={isFrench ? 'Envoi' : 'Submitted'}
                        value={item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('fr-FR') : isFrench ? 'Pas encore' : 'Not yet'}
                        helper={item.reviewedAt ? (isFrench ? 'Relu' : 'Reviewed') : isFrench ? 'En attente' : 'Pending'}
                      />
                      <InfoCell
                        label={isFrench ? 'Documents' : 'Documents'}
                        value={String(item.documentCount)}
                        helper={item.progress.missingDocumentLabels.length ? item.progress.missingDocumentLabels.join(' / ') : isFrench ? 'Complet' : 'Complete'}
                      />
                      <InfoCell
                        label={isFrench ? 'Role' : 'Role'}
                        value={item.role || item.company || (isFrench ? 'Profil en cours' : 'Profile in progress')}
                        helper={item.username ? `@${item.username}` : isFrench ? 'Compte interne' : 'Internal account'}
                      />
                    </div>

                    {item.documents.length ? (
                      <div className="documentRow">
                        {item.documents.map((document) => {
                          const previewHref = document.previewUrl ? backendUrl(document.previewUrl) : '';
                          return (
                            <a
                              key={document.id}
                              href={previewHref || (document.downloadUrl ? backendUrl(document.downloadUrl) : '')}
                              target="_blank"
                              rel="noreferrer"
                              className="documentPill"
                            >
                              <span>{verificationDocumentLabel(document.documentType, locale)}</span>
                              <strong>{formatVerificationFileSize(document.fileSize)}</strong>
                            </a>
                          );
                        })}
                      </div>
                    ) : null}

                    {item.rejectionReason ? (
                      <div className="noticeCard warning">
                        <strong>{isFrench ? 'Motif actuel' : 'Current reason'}</strong>
                        <p>{item.rejectionReason}</p>
                      </div>
                    ) : null}

                    {isRejecting ? (
                      <div className="rejectPanel">
                        <label className="reasonField">
                          <span>{isFrench ? 'Raison du rejet' : 'Rejection reason'}</span>
                          <textarea
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            placeholder={isFrench ? 'Document incomplet, photo illisible, piece manquante...' : 'Incomplete document, unreadable image, missing file...'}
                          />
                        </label>
                        <div className="actionCluster">
                          <button type="button" className="ghostButton compactButton" onClick={() => setSelectedId('')}>
                            {isFrench ? 'Annuler' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            className="dangerButton compactButton"
                            disabled={submittingId === item.id}
                            onClick={() => void reject(item)}
                          >
                            {submittingId === item.id ? (isFrench ? 'En cours...' : 'Working...') : isFrench ? 'Confirmer le rejet' : 'Confirm rejection'}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {item.auditLogs?.length ? (
                      <div className="auditStrip">
                        {item.auditLogs.slice(0, 3).map((entry) => (
                          <span key={entry.id}>
                            {entry.action.replace(/_/g, ' ')}
                            {entry.actorUsername ? ` · ${entry.actorUsername}` : ''}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <article className="emptyCard">
              <strong>{isFrench ? 'Aucune demande trouvee' : 'No request found'}</strong>
              <p>{isFrench ? 'Ajuste les filtres ou attends les prochaines soumissions KYC / KYB.' : 'Adjust the filters or wait for the next KYC / KYB submissions.'}</p>
            </article>
          )}
        </section>

        <section className="paginationRow">
          <button type="button" className="ghostButton compactButton" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            {isFrench ? 'Precedent' : 'Previous'}
          </button>
          <span>
            {isFrench ? 'Page' : 'Page'} {page} / {totalPages}
          </span>
          <button type="button" className="ghostButton compactButton" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            {isFrench ? 'Suivant' : 'Next'}
          </button>
        </section>

        <AdminVerificationStyles />
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  tone?: 'neutral' | 'warning' | 'success' | 'danger';
}) {
  return (
    <article className={`metricCard ${tone}`}>
      <span className="metricIcon">{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{helper}</span>
    </article>
  );
}

function InfoCell({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="infoCell">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{helper}</span>
    </article>
  );
}

function AdminVerificationStyles() {
  return (
    <style>{`
      .adminVerificationPage {
        min-height: 100vh;
        padding: 14px;
        background:
          radial-gradient(circle at top left, rgba(29, 78, 216, 0.14), transparent 32%),
          radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.1), transparent 28%),
          linear-gradient(180deg, #f7fbff 0%, #eef4fb 52%, #e8f0fa 100%);
        color: #0f172a;
        font-family: Manrope, 'Segoe UI', ui-sans-serif, system-ui, sans-serif;
      }

      .adminShell {
        display: grid;
        gap: 18px;
      }

      .heroCard,
      .statusStrip,
      .toolbarCard,
      .requestCard,
      .metricCard,
      .emptyCard,
      .infoCell,
      .noticeCard {
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 22px 60px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(18px);
      }

      .heroCard,
      .toolbarCard,
      .requestCard,
      .emptyCard {
        border-radius: 30px;
        padding: 24px;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #1d4ed8;
      }

      .heroCard h1,
      .requestCard h3,
      .toolbarCard h2,
      .emptyCard strong {
        margin: 0;
        color: #0f172a;
        letter-spacing: -0.04em;
      }

      .heroCard h1 {
        max-width: 18ch;
        font-size: clamp(2.2rem, 4.9vw, 3.8rem);
        line-height: 0.95;
      }

      .heroCard p,
      .requestCard p,
      .emptyCard p,
      .noticeCard p,
      .infoCell span {
        margin: 0;
        color: #5b6b83;
        line-height: 1.7;
      }

      .heroTop,
      .requestHead {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 18px;
        align-items: start;
      }

      .heroActionRow,
      .toolbarActions,
      .actionCluster {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .summaryGrid,
      .requestMetaGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .metricCard,
      .infoCell {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-radius: 24px;
      }

      .metricCard small,
      .infoCell small {
        color: #64748b;
      }

      .metricCard strong,
      .infoCell strong {
        font-size: 1.08rem;
      }

      .metricCard.success {
        border-color: rgba(16, 185, 129, 0.2);
      }

      .metricCard.warning {
        border-color: rgba(245, 158, 11, 0.2);
      }

      .metricCard.danger {
        border-color: rgba(239, 68, 68, 0.2);
      }

      .metricIcon,
      .identityIcon {
        width: 42px;
        height: 42px;
        display: inline-grid;
        place-items: center;
        border-radius: 16px;
        background: rgba(219, 234, 254, 0.82);
        color: #1d4ed8;
      }

      .identityIcon.business {
        background: rgba(254, 249, 195, 0.8);
        color: #b45309;
      }

      .statusStrip {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        border-radius: 999px;
      }

      .statusDot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: currentColor;
      }

      .statusStrip.success {
        color: #047857;
        background: rgba(236, 253, 245, 0.92);
      }

      .statusStrip.danger {
        color: #b91c1c;
        background: rgba(254, 242, 242, 0.94);
      }

      .statusStrip.neutral {
        color: #334155;
      }

      .searchField {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 54px;
        padding: 0 16px;
        border-radius: 20px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(255, 255, 255, 0.98);
      }

      .searchField input,
      .toolbarActions select,
      .reasonField textarea {
        width: 100%;
        border: 0;
        outline: none;
        background: transparent;
        font: inherit;
        color: #0f172a;
      }

      .toolbarCard {
        display: grid;
        grid-template-columns: minmax(260px, 1fr) auto;
        gap: 14px;
        align-items: center;
      }

      .searchIcon {
        color: #64748b;
      }

      .toolbarActions select {
        min-width: 170px;
        min-height: 52px;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(255, 255, 255, 0.98);
        padding: 0 14px;
      }

      .listSection,
      .requestStack {
        display: grid;
        gap: 16px;
      }

      .identityBlock {
        display: flex;
        gap: 14px;
        align-items: start;
      }

      .titleRow {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .statusPill,
      .verifiedBadge,
      .documentPill {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 14px;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 800;
      }

      .statusPill.success,
      .verifiedBadge {
        background: rgba(220, 252, 231, 0.82);
        color: #166534;
      }

      .statusPill.warning {
        background: rgba(254, 249, 195, 0.88);
        color: #b45309;
      }

      .statusPill.danger {
        background: rgba(254, 226, 226, 0.92);
        color: #b91c1c;
      }

      .statusPill.neutral {
        background: rgba(226, 232, 240, 0.92);
        color: #334155;
      }

      .documentRow,
      .auditStrip {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .documentPill {
        text-decoration: none;
        background: rgba(238, 244, 255, 0.94);
        color: #1d4ed8;
        border: 1px solid rgba(29, 78, 216, 0.14);
      }

      .documentPill strong {
        font-size: 0.82rem;
      }

      .noticeCard,
      .rejectPanel {
        display: grid;
        gap: 10px;
        padding: 16px;
        border-radius: 22px;
        background: rgba(248, 250, 252, 0.84);
        border: 1px solid rgba(148, 163, 184, 0.14);
      }

      .noticeCard.warning {
        border-color: rgba(245, 158, 11, 0.18);
      }

      .reasonField {
        display: grid;
        gap: 8px;
      }

      .reasonField span {
        font-size: 0.92rem;
        font-weight: 700;
        color: #0f172a;
      }

      .reasonField textarea {
        min-height: 110px;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(255, 255, 255, 0.98);
        padding: 14px 16px;
        resize: vertical;
      }

      .auditStrip span {
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(248, 250, 252, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.14);
        color: #475569;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .paginationRow {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
      }

      .primaryButton,
      .ghostButton,
      .dangerButton {
        min-height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 0 18px;
        border-radius: 18px;
        text-decoration: none;
        border: 1px solid transparent;
        font-weight: 800;
        font: inherit;
        cursor: pointer;
      }

      .compactButton {
        min-height: 40px;
        padding: 0 14px;
        border-radius: 14px;
      }

      .primaryButton {
        background: linear-gradient(135deg, #1d4ed8, #2563eb);
        color: #fff;
      }

      .ghostButton {
        background: rgba(255, 255, 255, 0.86);
        color: #0f172a;
        border-color: rgba(29, 78, 216, 0.14);
      }

      .dangerButton {
        background: rgba(185, 28, 28, 0.92);
        color: #fff;
      }

      .buttonIcon {
        width: 18px;
        height: 18px;
      }

      @media (max-width: 1120px) {
        .summaryGrid,
        .requestMetaGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .toolbarCard,
        .heroTop,
        .requestHead {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .adminVerificationPage {
          padding: 12px;
        }

        .heroCard,
        .toolbarCard,
        .requestCard,
        .emptyCard {
          padding: 18px;
          border-radius: 24px;
        }

        .summaryGrid,
        .requestMetaGrid {
          grid-template-columns: 1fr;
        }

        .toolbarActions,
        .heroActionRow,
        .actionCluster,
        .paginationRow {
          justify-content: stretch;
        }

        .toolbarActions > *,
        .heroActionRow > *,
        .actionCluster > *,
        .paginationRow > * {
          width: 100%;
        }
      }

      html[data-theme='dark'] .adminVerificationPage {
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 34%),
          radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 30%),
          linear-gradient(180deg, #07111f 0%, #0b1425 48%, #0f172a 100%);
        color: #e5eefc;
      }

      html[data-theme='dark'] .heroCard,
      html[data-theme='dark'] .statusStrip,
      html[data-theme='dark'] .toolbarCard,
      html[data-theme='dark'] .requestCard,
      html[data-theme='dark'] .metricCard,
      html[data-theme='dark'] .emptyCard,
      html[data-theme='dark'] .infoCell,
      html[data-theme='dark'] .noticeCard,
      html[data-theme='dark'] .rejectPanel {
        background: rgba(10, 18, 34, 0.9);
        border-color: rgba(96, 165, 250, 0.14);
        box-shadow: 0 28px 80px rgba(2, 8, 23, 0.5);
      }

      html[data-theme='dark'] .heroCard h1,
      html[data-theme='dark'] .requestCard h3,
      html[data-theme='dark'] .emptyCard strong,
      html[data-theme='dark'] .metricCard strong,
      html[data-theme='dark'] .infoCell strong,
      html[data-theme='dark'] .reasonField span {
        color: #f8fbff;
      }

      html[data-theme='dark'] .heroCard p,
      html[data-theme='dark'] .requestCard p,
      html[data-theme='dark'] .emptyCard p,
      html[data-theme='dark'] .metricCard span,
      html[data-theme='dark'] .infoCell span,
      html[data-theme='dark'] .metricCard small,
      html[data-theme='dark'] .infoCell small,
      html[data-theme='dark'] .auditStrip span {
        color: rgba(226, 232, 240, 0.78);
      }

      html[data-theme='dark'] .ghostButton,
      html[data-theme='dark'] .searchField,
      html[data-theme='dark'] .toolbarActions select,
      html[data-theme='dark'] .reasonField textarea {
        background: rgba(15, 23, 42, 0.92);
        border-color: rgba(96, 165, 250, 0.18);
        color: #f8fbff;
      }

      html[data-theme='dark'] .documentPill {
        background: rgba(15, 23, 42, 0.92);
        color: #93c5fd;
        border-color: rgba(96, 165, 250, 0.18);
      }
    `}</style>
  );
}
