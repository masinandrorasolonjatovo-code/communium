'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { useMemo, useState, DragEvent, ChangeEvent, useEffect, ReactNode, CSSProperties } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';
import {
  emptyVerificationState,
  formatVerificationFileSize,
  normalizeVerificationAccountType,
  normalizeVerificationStatus,
  verificationAccountLabel,
  verificationBadgeText,
  verificationDocumentLabel,
  verificationStatusLabel,
  verificationTone,
  type VerificationAccountType,
  type VerificationDocumentRecord,
  type VerificationDocumentType,
  type VerificationState,
} from '@/lib/verification';

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const verificationApiBase = backendOrigin ? `${backendOrigin}/api/verification` : '/api/verification';

function backendUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${backendOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

type PendingFiles = Partial<Record<'identityDocument' | 'passportDocument' | 'rcDocument' | 'iceDocument' | 'ifDocument' | 'statutesDocument', File | null>>;

const acceptedDocumentTypes = '.pdf,.jpg,.jpeg,.png,.webp';

export default function VerificationWorkspace({ locale }: { locale: Locale }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const isFrench = locale === 'fr';
  const dashboardHref = localizeHref(locale, '/dashboard');
  const profileHref = localizeHref(locale, '/dashboard/profile');
  const settingsHref = localizeHref(locale, '/profile/settings');

  const unsafeAccountType = normalizeVerificationAccountType(
    typeof user?.unsafeMetadata?.accountType === 'string' ? user.unsafeMetadata.accountType : null
  );

  const [verification, setVerification] = useState<VerificationState>(emptyVerificationState(unsafeAccountType));
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(isFrench ? 'Synchronisation du dossier...' : 'Syncing verification case...');
  const [pendingFiles, setPendingFiles] = useState<PendingFiles>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState('');
  const [markingNotificationId, setMarkingNotificationId] = useState('');
  const [personalDocumentType, setPersonalDocumentType] = useState<'CIN' | 'PASSPORT'>('CIN');
  const [personalDocumentNumber, setPersonalDocumentNumber] = useState('');

  const activeAccountType = verification.type || unsafeAccountType;
  const normalizedStatus = normalizeVerificationStatus(verification.status);
  const statusTone = verificationTone(normalizedStatus);
  const badgeText = verification.badgeLabel || verificationBadgeText(activeAccountType, verification.status, locale);
  const displayName = user?.fullName || user?.username || (isFrench ? 'Membre Communium' : 'Communium member');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';
  const trustScore =
    normalizedStatus === 'VERIFIED'
      ? 100
      : normalizedStatus === 'PENDING'
        ? Math.max(70, verification.progress.percent)
        : normalizedStatus === 'REJECTED'
          ? Math.max(35, verification.progress.percent)
          : Math.max(24, Math.round(verification.progress.percent * 0.7));
  const statusHeadline =
    normalizedStatus === 'VERIFIED'
      ? isFrench
        ? 'Badge confirme'
        : 'Badge confirmed'
      : normalizedStatus === 'PENDING'
        ? isFrench
          ? 'En revue'
          : 'In review'
        : normalizedStatus === 'REJECTED'
          ? isFrench
            ? 'Correction requise'
            : 'Needs correction'
          : isFrench
            ? 'Non verifie'
            : 'Not verified';

  const actorHeaders = useMemo(
    () => ({
      'x-user-email': user?.primaryEmailAddress?.emailAddress || '',
      'x-user-name': user?.fullName || user?.username || 'Membre Communium',
      'x-user-username': user?.username || '',
      'x-user-account-type': activeAccountType,
    }),
    [activeAccountType, user?.fullName, user?.primaryEmailAddress?.emailAddress, user?.username]
  );

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    void loadVerificationStatus();
  }, [getToken, isLoaded, user]);

  async function authorizedHeaders() {
    const token = await getToken();

    if (!token) {
      throw new Error(isFrench ? 'Session indisponible. Reconnecte-toi.' : 'Session unavailable. Sign in again.');
    }

    return {
      ...actorHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  async function loadVerificationStatus() {
    try {
      setLoading(true);
      setStatusMessage(isFrench ? 'Synchronisation du dossier...' : 'Syncing verification case...');
      const response = await fetch(`${verificationApiBase}/me`, {
        headers: await authorizedHeaders(),
        cache: 'no-store',
      });
      const body = (await response.json()) as { success?: boolean; data?: VerificationState; error?: string };

      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error || (isFrench ? 'Impossible de charger la verification.' : 'Unable to load verification.'));
      }

      setVerification(body.data);
      setStatusMessage(
        body.data.status === 'VERIFIED'
          ? isFrench
            ? 'Compte verifie.'
            : 'Account verified.'
          : body.data.status === 'PENDING'
            ? isFrench
              ? 'Dossier en attente de revue.'
              : 'Verification pending review.'
            : body.data.status === 'REJECTED'
              ? isFrench
                ? 'Le dossier doit etre corrige.'
                : 'Verification needs corrections.'
              : isFrench
                ? 'Ajoutez une piece pour lancer la revue du badge.'
                : 'Add a file to start badge review.'
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : isFrench ? 'Chargement impossible.' : 'Unable to load.');
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function setPendingFile(field: keyof PendingFiles, file: File | null) {
    setPendingFiles((current) => ({
      ...current,
      [field]: file,
    }));
  }

  function handleDrop(field: keyof PendingFiles, event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    setPendingFile(field, file);
    setStatusMessage(isFrench ? 'Document pret a etre envoye.' : 'Document ready to upload.');
  }

  function handleFileChange(field: keyof PendingFiles, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setPendingFile(field, file);
    if (file) {
      setStatusMessage(isFrench ? 'Document pret a etre envoye.' : 'Document ready to upload.');
    }
    event.target.value = '';
  }

  async function uploadSelectedDocuments(targetFields: Array<keyof PendingFiles>) {
    const filesToUpload = targetFields.filter((field) => pendingFiles[field]);

    if (!filesToUpload.length) {
      setStatusMessage(isFrench ? 'Ajoute d abord un document.' : 'Add a document first.');
      return;
    }

    const token = await getToken();
    if (!token) {
      setStatusMessage(isFrench ? 'Session indisponible.' : 'Session unavailable.');
      return;
    }

    const formData = new FormData();
    for (const field of filesToUpload) {
      const file = pendingFiles[field];
      if (file) {
        formData.append(field, file);
      }
    }

    formData.append('type', activeAccountType);
    if (activeAccountType === 'PERSONAL') {
      formData.append('documentType', personalDocumentType);
      formData.append('documentNumber', personalDocumentNumber.trim());
    }

    setUploading(true);
    setUploadProgress(8);
    setStatusMessage(isFrench ? 'Envoi des documents en cours...' : 'Uploading verification documents...');

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${verificationApiBase}/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      Object.entries(actorHeaders).forEach(([key, value]) => {
        if (value) {
          xhr.setRequestHeader(key, value);
        }
      });

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.max(8, Math.round((event.loaded / event.total) * 100)));
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setUploadProgress(0);
        setStatusMessage(isFrench ? 'Upload impossible.' : 'Upload failed.');
        resolve();
      };

      xhr.onload = async () => {
        try {
          const body = JSON.parse(xhr.responseText || '{}') as { success?: boolean; data?: VerificationState; error?: string };
          if (xhr.status >= 400 || !body.success || !body.data) {
            throw new Error(body.error || (isFrench ? 'Upload impossible.' : 'Upload failed.'));
          }

          setVerification(body.data);
          setPendingFiles({});
          setUploadProgress(100);
          setStatusMessage(
            isFrench
              ? 'Documents envoyes. Le dossier a ete mis a jour.'
              : 'Documents uploaded. Verification status updated.'
          );
        } catch (error) {
          setStatusMessage(error instanceof Error ? error.message : isFrench ? 'Upload impossible.' : 'Upload failed.');
        } finally {
          setUploading(false);
          window.setTimeout(() => setUploadProgress(0), 700);
          resolve();
        }
      };

      xhr.send(formData);
    });
  }

  async function deleteDocument(documentId: string) {
    const confirmed = window.confirm(
      isFrench
        ? 'Supprimer ce document du dossier de verification ?'
        : 'Remove this document from the verification file?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDocumentId(documentId);
      setStatusMessage(isFrench ? 'Suppression du document...' : 'Removing document...');
      const response = await fetch(`${verificationApiBase}/document/${documentId}`, {
        method: 'DELETE',
        headers: await authorizedHeaders(),
      });
      const body = (await response.json()) as { success?: boolean; data?: VerificationState; error?: string };

      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error || (isFrench ? 'Suppression impossible.' : 'Unable to remove the document.'));
      }

      setVerification(body.data);
      setStatusMessage(
        isFrench ? 'Le document a ete retire du dossier.' : 'The document has been removed from the verification file.',
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : isFrench ? 'Suppression impossible.' : 'Unable to remove the document.',
      );
    } finally {
      setDeletingDocumentId('');
    }
  }

  async function markNotificationRead(notificationId: string) {
    try {
      setMarkingNotificationId(notificationId);
      const response = await fetch(`${verificationApiBase}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: await authorizedHeaders(),
      });
      const body = (await response.json()) as { success?: boolean; data?: VerificationState['notifications'][number]; error?: string };

      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error || (isFrench ? 'Mise a jour impossible.' : 'Unable to update notification.'));
      }

      setVerification((current) => ({
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.id === notificationId ? { ...notification, readAt: body.data?.readAt || notification.readAt } : notification,
        ),
      }));
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : isFrench ? 'Mise a jour impossible.' : 'Unable to update notification.',
      );
    } finally {
      setMarkingNotificationId('');
    }
  }

  const progressLabel = `${verification.progress.uploaded}/${verification.progress.required}`;

  if (!isLoaded) {
    return (
      <main className="verificationPage">
        <div className="verificationShell">
          <section className="verificationHeroCard">
            <span className="verificationEyebrow">{isFrench ? 'Verification du compte' : 'Account verification'}</span>
            <h1>{isFrench ? 'Chargement du module KYC / KYB...' : 'Loading KYC / KYB workspace...'}</h1>
          </section>
          <VerificationStyles />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="verificationPage">
        <div className="verificationShell">
          <section className="verificationHeroCard">
            <span className="verificationEyebrow">{isFrench ? 'Acces membre' : 'Member access'}</span>
            <h1>{isFrench ? 'Connecte-toi pour lancer la verification du compte.' : 'Sign in to start account verification.'}</h1>
            <div className="heroActionRow">
              <Link href={localizeHref(locale, '/auth/sign-in')} className="primaryButton">
                {isFrench ? 'Se connecter' : 'Sign in'}
              </Link>
              <Link href={dashboardHref} className="ghostButton">
                {isFrench ? 'Retour dashboard' : 'Back to dashboard'}
              </Link>
            </div>
          </section>
          <VerificationStyles />
        </div>
      </main>
    );
  }

  return (
    <main className="verificationPage">
      <div className="verificationShell">
        <section className="verificationHeroCard">
          <div className="heroTop">
            <div>
              <span className="verificationEyebrow">{isFrench ? 'Trust & Safety' : 'Trust & Safety'}</span>
              <h1>{isFrench ? 'Securite et verification' : 'Security and verification'}</h1>
              <p>
                {isFrench
                  ? 'Confirmez votre identite, protegez votre compte et renforcez la credibilite de votre profil professionnel.'
                  : 'Confirm your identity, protect your account and strengthen the credibility of your professional profile.'}
              </p>
            </div>

            <div className="trustHeroPanel">
              <div className="trustHeroIdentity">
                <span className="trustAvatar">{user.imageUrl ? <img src={user.imageUrl} alt="" /> : initials}</span>
                <div>
                  <strong>{displayName}</strong>
                  <small>{verificationAccountLabel(activeAccountType, locale)}</small>
                </div>
                <span className={`statusPill ${statusTone}`}>{statusHeadline}</span>
              </div>
              <div className="trustScoreRow">
                <div>
                  <span>{isFrench ? 'Niveau de confiance' : 'Trust level'}</span>
                  <strong>{trustScore}%</strong>
                </div>
                <div className="trustRing" style={{ '--score': `${trustScore}%` } as CSSProperties}>
                  <ShieldCheck strokeWidth={2.2} />
                </div>
              </div>
              <div className="trustSignalGrid">
                <span><LockKeyhole strokeWidth={2} /> {isFrench ? 'Documents prives' : 'Private files'}</span>
                <span><ScanLine strokeWidth={2} /> {isFrench ? 'Revue securisee' : 'Secure review'}</span>
                <span><BadgeCheck strokeWidth={2} /> {badgeText || (isFrench ? 'Badge en attente' : 'Badge pending')}</span>
              </div>
            </div>
          </div>

          <div className="heroActionRow">
            <Link href={profileHref} className="ghostButton">
              <ArrowLeft className="buttonIcon" strokeWidth={2.1} />
              {isFrench ? 'Retour au profil' : 'Back to profile'}
            </Link>
            <Link href={settingsHref} className="ghostButton">
              <ShieldCheck className="buttonIcon" strokeWidth={2.1} />
              {isFrench ? 'Parametres' : 'Settings'}
            </Link>
            <button type="button" className="primaryButton" onClick={() => void loadVerificationStatus()}>
              <RefreshCw className="buttonIcon" strokeWidth={2.1} />
              {isFrench ? 'Actualiser' : 'Refresh'}
            </button>
          </div>

          <div className="verificationSummaryGrid">
            <MetricCard
              label={isFrench ? 'Type de compte' : 'Account type'}
              value={verificationAccountLabel(activeAccountType, locale)}
              helper={activeAccountType === 'BUSINESS' ? 'KYB' : 'KYC'}
              icon={activeAccountType === 'BUSINESS' ? <Building2 strokeWidth={2.1} /> : <UserRound strokeWidth={2.1} />}
            />
            <MetricCard
              label={isFrench ? 'Statut' : 'Status'}
              value={verificationStatusLabel(normalizedStatus, locale)}
              helper={badgeText || (isFrench ? 'Badge non actif' : 'Badge inactive')}
              icon={badgeText ? <BadgeCheck strokeWidth={2.1} /> : <ShieldCheck strokeWidth={2.1} />}
              tone={statusTone}
            />
            <MetricCard
              label={isFrench ? 'Pieces recues' : 'Uploaded files'}
              value={progressLabel}
              helper={`${verification.progress.percent}%`}
              icon={<FileCheck2 strokeWidth={2.1} />}
            />
            <MetricCard
              label={isFrench ? 'Dernier envoi' : 'Last submission'}
              value={verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString('fr-FR') : isFrench ? 'Pas encore' : 'Not yet'}
              helper={verification.reviewedAt ? (isFrench ? 'Revue terminee' : 'Reviewed') : isFrench ? 'Suivi actif' : 'Active tracking'}
              icon={<Clock3 strokeWidth={2.1} />}
            />
          </div>
        </section>

        <section className={`verificationStatusStrip ${statusTone}`}>
          <span className="statusDot" />
          <span>{statusMessage}</span>
        </section>

        <section className="verificationLayout">
          <div className="verificationMainColumn">
            <article className="panelCard">
              <div className="panelHead">
                <div>
                  <span className="panelEyebrow">{isFrench ? 'Verification identite' : 'Identity verification'}</span>
                  <h2>{isFrench ? 'Documents de confiance' : 'Trust documents'}</h2>
                  <p>
                    {isFrench
                      ? 'Ajoutez les pieces demandees. Le dossier reste prive, chiffre et reserve a la revue autorisee.'
                      : 'Add the required files. Your case stays private, encrypted and limited to authorized review.'}
                  </p>
                </div>
                {badgeText ? <span className="verifiedBadge">{badgeText}</span> : null}
              </div>

              <div className="progressBlock">
                <div className="progressCopy">
                  <strong>{isFrench ? 'Avancement du dossier' : 'Case progress'}</strong>
                  <span>{verification.progress.percent}%</span>
                </div>
                <div className="progressTrack" aria-hidden="true">
                  <span style={{ width: `${verification.progress.percent}%` }} />
                </div>
                {verification.progress.missingDocumentLabels.length ? (
                  <p className="progressHint">
                    {isFrench ? 'Pieces attendues :' : 'Still required:'}{' '}
                    <strong>{verification.progress.missingDocumentLabels.join(' / ')}</strong>
                  </p>
                ) : (
                  <p className="progressHint">
                    {isFrench ? 'Le dossier est complet pour la revue.' : 'The case is ready for review.'}
                  </p>
                )}
              </div>

              {activeAccountType === 'PERSONAL' ? (
                <div className="uploadStack">
                  <div className="fieldRow">
                    <label className="fieldShell">
                      <span>{isFrench ? 'Type de document' : 'Document type'}</span>
                      <select
                        value={personalDocumentType}
                        onChange={(event) => setPersonalDocumentType(event.target.value as 'CIN' | 'PASSPORT')}
                      >
                        <option value="CIN">CIN</option>
                        <option value="PASSPORT">{isFrench ? 'Passeport' : 'Passport'}</option>
                      </select>
                    </label>
                    <label className="fieldShell">
                      <span>{isFrench ? 'Reference du document' : 'Document reference'}</span>
                      <input
                        value={personalDocumentNumber}
                        onChange={(event) => setPersonalDocumentNumber(event.target.value)}
                        placeholder={isFrench ? 'Numero ou reference interne' : 'Number or internal reference'}
                      />
                    </label>
                  </div>

                  <DocumentDropZone
                    title={personalDocumentType === 'CIN' ? 'CIN' : isFrench ? 'Passeport' : 'Passport'}
                    hint={isFrench ? 'PDF, JPG, PNG ou WEBP. Controle de lisibilite inclus.' : 'PDF, JPG, PNG or WEBP. Readability checks included.'}
                    file={pendingFiles[personalDocumentType === 'CIN' ? 'identityDocument' : 'passportDocument'] || null}
                    accept={acceptedDocumentTypes}
                    onDrop={(event) =>
                      handleDrop(personalDocumentType === 'CIN' ? 'identityDocument' : 'passportDocument', event)
                    }
                    onChange={(event) =>
                      handleFileChange(personalDocumentType === 'CIN' ? 'identityDocument' : 'passportDocument', event)
                    }
                  />

                  <div className="actionRow">
                    <button
                      type="button"
                      className="primaryButton"
                      disabled={uploading}
                      onClick={() =>
                        void uploadSelectedDocuments([
                          personalDocumentType === 'CIN' ? 'identityDocument' : 'passportDocument',
                        ])
                      }
                    >
                      <UploadCloud className="buttonIcon" strokeWidth={2.1} />
                      {uploading ? (isFrench ? 'Envoi securise...' : 'Secure upload...') : isFrench ? 'Envoyer pour revue' : 'Send for review'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="uploadGrid">
                  <DocumentDropZone
                    title="RC"
                    hint={isFrench ? 'Registre de commerce' : 'Trade register'}
                    file={pendingFiles.rcDocument || null}
                    accept={acceptedDocumentTypes}
                    onDrop={(event) => handleDrop('rcDocument', event)}
                    onChange={(event) => handleFileChange('rcDocument', event)}
                  />
                  <DocumentDropZone
                    title="ICE"
                    hint={isFrench ? 'Identifiant commun' : 'Corporate ICE'}
                    file={pendingFiles.iceDocument || null}
                    accept={acceptedDocumentTypes}
                    onDrop={(event) => handleDrop('iceDocument', event)}
                    onChange={(event) => handleFileChange('iceDocument', event)}
                  />
                  <DocumentDropZone
                    title="IF"
                    hint={isFrench ? 'Identifiant fiscal' : 'Tax identifier'}
                    file={pendingFiles.ifDocument || null}
                    accept={acceptedDocumentTypes}
                    onDrop={(event) => handleDrop('ifDocument', event)}
                    onChange={(event) => handleFileChange('ifDocument', event)}
                  />
                  <DocumentDropZone
                    title={isFrench ? 'Statuts societe' : 'Company statutes'}
                    hint={isFrench ? 'PDF ou image nette' : 'PDF or high-quality image'}
                    file={pendingFiles.statutesDocument || null}
                    accept={acceptedDocumentTypes}
                    onDrop={(event) => handleDrop('statutesDocument', event)}
                    onChange={(event) => handleFileChange('statutesDocument', event)}
                  />

                  <div className="actionRow spanFull">
                    <button
                      type="button"
                      className="primaryButton"
                      disabled={uploading}
                      onClick={() =>
                        void uploadSelectedDocuments(['rcDocument', 'iceDocument', 'ifDocument', 'statutesDocument'])
                      }
                    >
                      <UploadCloud className="buttonIcon" strokeWidth={2.1} />
                      {uploading ? (isFrench ? 'Envoi securise...' : 'Secure upload...') : isFrench ? 'Envoyer le dossier entreprise' : 'Send business case'}
                    </button>
                  </div>
                </div>
              )}

              {uploadProgress > 0 ? (
                <div className="uploadProgressBlock">
                  <div className="progressTrack" aria-hidden="true">
                    <span style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <small>{uploadProgress}%</small>
                </div>
              ) : null}
            </article>

            <article className="panelCard">
              <div className="panelHead">
                <div>
                  <span className="panelEyebrow">{isFrench ? 'Dossier' : 'Case files'}</span>
                  <h2>{isFrench ? 'Documents transmis' : 'Submitted documents'}</h2>
                </div>
              </div>

              {verification.documents.length ? (
                <div className="documentList">
                  {verification.documents.map((document) => (
                    <DocumentCard
                      key={document.id}
                      locale={locale}
                      document={document}
                      isDeleting={deletingDocumentId === document.id}
                      onDelete={() => void deleteDocument(document.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyHint
                  title={isFrench ? 'Aucun document transmis' : 'No document submitted'}
                  text={isFrench ? 'Ajoutez une piece pour ouvrir la revue du badge.' : 'Add a file to start badge review.'}
                />
              )}
            </article>
          </div>

          <aside className="verificationAsideColumn">
            <article className="panelCard">
              <span className="panelEyebrow">{isFrench ? 'Protection' : 'Protection'}</span>
              <h3>{isFrench ? 'Securite du compte' : 'Account security'}</h3>
              <div className="securityChecklist">
                <span><CheckCircle2 strokeWidth={2} /> {isFrench ? 'Email confirme' : 'Email confirmed'}</span>
                <span><KeyRound strokeWidth={2} /> {isFrench ? 'Session protegee' : 'Protected session'}</span>
                <span><Smartphone strokeWidth={2} /> {isFrench ? 'Appareil reconnu' : 'Known device'}</span>
                <span><ShieldAlert strokeWidth={2} /> {isFrench ? '2FA recommandee' : '2FA recommended'}</span>
              </div>
            </article>

            <article className="panelCard accentPanel">
              <span className="panelEyebrow">{isFrench ? 'Conseils de securite' : 'Security tips'}</span>
              <h3>{isFrench ? 'Renforcer le badge' : 'Strengthen your badge'}</h3>
              <ul className="hintList">
                <li>{isFrench ? 'Confirmez votre telephone pour securiser les actions sensibles.' : 'Confirm your phone to secure sensitive actions.'}</li>
                <li>{isFrench ? 'Ajoutez un document complet, lisible et non coupe.' : 'Add a complete, readable and uncropped file.'}</li>
                <li>{isFrench ? 'Activez la double authentification dans les parametres.' : 'Enable two-factor authentication in settings.'}</li>
              </ul>
            </article>

            <article className="panelCard">
              <span className="panelEyebrow">{isFrench ? 'Suivi' : 'Tracking'}</span>
              <h3>{isFrench ? 'Mises a jour du dossier' : 'Case updates'}</h3>
              {verification.notifications.length ? (
                <div className="notificationStack">
                  {verification.notifications.slice(0, 6).map((notification) => (
                    <article key={notification.id} className={`notificationCard ${verificationTone(notification.status)}`}>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <div className="notificationMetaRow">
                        <small>
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleString('fr-FR')
                            : isFrench
                              ? 'Recemment'
                              : 'Recently'}
                        </small>
                        {!notification.readAt ? (
                          <button
                            type="button"
                            className="ghostButton compactButton"
                            disabled={markingNotificationId === notification.id}
                            onClick={() => void markNotificationRead(notification.id)}
                          >
                            {markingNotificationId === notification.id
                              ? isFrench
                                ? '...'
                                : '...'
                              : isFrench
                                ? 'Marquer comme lu'
                                : 'Mark as read'}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyHint
                  title={isFrench ? 'Aucune alerte pour le moment' : 'No notifications yet'}
                  text={isFrench ? 'Les decisions et demandes de revue apparaitront ici.' : 'Review decisions and requests will appear here.'}
                />
              )}
            </article>

            <article className="panelCard">
              <span className="panelEyebrow">{isFrench ? 'Historique' : 'History'}</span>
              <h3>{isFrench ? 'Activite de securite' : 'Security activity'}</h3>
              {verification.auditLogs.length ? (
                <div className="auditStack">
                  {verification.auditLogs.slice(0, 6).map((entry) => (
                    <article key={entry.id} className="auditItem">
                      <strong>{entry.action.replace(/_/g, ' ')}</strong>
                      <p>{entry.actorUsername || (isFrench ? 'Equipe Communium' : 'Communium team')}</p>
                      <small>{entry.createdAt ? new Date(entry.createdAt).toLocaleString('fr-FR') : ''}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyHint
                  title={isFrench ? 'Aucune revue encore' : 'No review yet'}
                  text={isFrench ? 'La chronologie apparaitra des la premiere action sensible.' : 'The timeline will appear after the first sensitive action.'}
                />
              )}
            </article>
          </aside>
        </section>

        <VerificationStyles />
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

function EmptyHint({ title, text }: { title: string; text: string }) {
  return (
    <div className="emptyHint">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function DocumentCard({
  locale,
  document,
  onDelete,
  isDeleting,
}: {
  locale: Locale;
  document: VerificationDocumentRecord;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isFrench = locale === 'fr';
  const previewHref = document.previewUrl ? backendUrl(document.previewUrl) : '';
  const downloadHref = document.downloadUrl ? backendUrl(document.downloadUrl) : '';

  return (
    <article className="verificationDocumentCard">
      <div>
        <small>{verificationDocumentLabel(document.documentType, locale)}</small>
        <strong>{document.fileName}</strong>
        <span>
          {formatVerificationFileSize(document.fileSize)} • {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : ''}
        </span>
      </div>

      <div className="cardActionRow">
        {previewHref ? (
          <a href={previewHref} className="ghostButton compactButton" target="_blank" rel="noreferrer">
            {isFrench ? 'Apercu' : 'Preview'}
          </a>
        ) : null}
        {downloadHref ? (
          <a href={downloadHref} className="primaryButton compactButton" target="_blank" rel="noreferrer">
            {isFrench ? 'Ouvrir' : 'Open'}
          </a>
        ) : null}
        <button type="button" className="ghostButton compactButton" onClick={onDelete} disabled={isDeleting}>
          {isDeleting ? (isFrench ? 'Suppression...' : 'Removing...') : isFrench ? 'Supprimer' : 'Remove'}
        </button>
      </div>
    </article>
  );
}

function DocumentDropZone({
  title,
  hint,
  file,
  accept,
  onDrop,
  onChange,
}: {
  title: string;
  hint: string;
  file: File | null;
  accept: string;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      className={file ? 'dropZone dropZoneReady' : 'dropZone'}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <UploadCloud className="dropZoneIcon" strokeWidth={2.1} />
      <strong>{title}</strong>
      <p>{hint}</p>
      <span>{file ? file.name : 'Deposer un fichier ou parcourir'}</span>
      <input className="hiddenInput" type="file" accept={accept} onChange={onChange} />
    </label>
  );
}

function VerificationStyles() {
  return (
    <style>{`
      .verificationPage {
        min-height: 100vh;
        padding: 14px;
        background:
          radial-gradient(circle at top left, rgba(29, 78, 216, 0.14), transparent 32%),
          radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.1), transparent 28%),
          linear-gradient(180deg, #f7fbff 0%, #eef4fb 52%, #e8f0fa 100%);
        color: #0f172a;
        font-family: Manrope, 'Segoe UI', ui-sans-serif, system-ui, sans-serif;
      }

      .verificationShell {
        display: grid;
        gap: 18px;
      }

      .verificationHeroCard,
      .verificationStatusStrip,
      .panelCard,
      .metricCard,
      .dropZone,
      .verificationDocumentCard,
      .notificationCard,
      .auditItem,
      .emptyHint {
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 22px 60px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(18px);
      }

      .verificationHeroCard,
      .panelCard {
        border-radius: 30px;
        padding: 24px;
      }

      .verificationHeroCard {
        display: grid;
        gap: 18px;
        overflow: hidden;
        position: relative;
      }

      .verificationEyebrow,
      .panelEyebrow {
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

      .verificationHeroCard h1,
      .panelCard h2,
      .panelCard h3 {
        margin: 0;
        color: #0f172a;
        letter-spacing: -0.04em;
      }

      .verificationHeroCard h1 {
        max-width: 16ch;
        font-size: clamp(2.2rem, 5vw, 4rem);
        line-height: 0.94;
      }

      .verificationHeroCard p,
      .panelCard p,
      .dropZone p,
      .emptyHint p,
      .notificationCard p,
      .auditItem p {
        margin: 0;
        color: #5b6b83;
        line-height: 1.7;
      }

      .heroTop {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(340px, 0.62fr);
        gap: 18px;
        align-items: start;
      }

      .trustHeroPanel {
        display: grid;
        gap: 16px;
        padding: 18px;
        border-radius: 26px;
        border: 1px solid rgba(37, 99, 235, 0.16);
        background:
          radial-gradient(circle at top right, rgba(37, 99, 235, 0.16), transparent 42%),
          linear-gradient(135deg, rgba(248, 250, 252, 0.94), rgba(239, 246, 255, 0.88));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 20px 54px rgba(15, 23, 42, 0.08);
      }

      .trustHeroIdentity,
      .trustScoreRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }

      .trustHeroIdentity > div,
      .trustScoreRow > div:first-child {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .trustHeroIdentity strong,
      .trustScoreRow strong {
        color: #0f172a;
      }

      .trustHeroIdentity small,
      .trustScoreRow span,
      .trustSignalGrid span {
        color: #64748b;
        font-size: 0.86rem;
      }

      .trustAvatar {
        width: 54px;
        height: 54px;
        flex: 0 0 auto;
        display: inline-grid;
        place-items: center;
        border-radius: 18px;
        background: linear-gradient(135deg, #0f172a, #2563eb);
        color: #ffffff;
        font-weight: 900;
        box-shadow: 0 18px 32px rgba(37, 99, 235, 0.22);
        overflow: hidden;
      }

      .trustAvatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .statusPill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 32px;
        padding: 0 11px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 900;
        white-space: nowrap;
        border: 1px solid rgba(148, 163, 184, 0.24);
        color: #334155;
        background: rgba(255, 255, 255, 0.78);
      }

      .statusPill.success {
        color: #047857;
        background: rgba(209, 250, 229, 0.72);
      }

      .statusPill.warning {
        color: #92400e;
        background: rgba(254, 243, 199, 0.78);
      }

      .statusPill.danger {
        color: #b91c1c;
        background: rgba(254, 226, 226, 0.76);
      }

      .trustRing {
        --score: 0%;
        width: 66px;
        height: 66px;
        display: inline-grid;
        place-items: center;
        border-radius: 999px;
        background:
          radial-gradient(circle, #ffffff 54%, transparent 56%),
          conic-gradient(#2563eb var(--score), rgba(203, 213, 225, 0.68) 0);
        color: #1d4ed8;
        box-shadow: 0 16px 32px rgba(37, 99, 235, 0.16);
      }

      .trustSignalGrid,
      .securityChecklist {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .trustSignalGrid span,
      .securityChecklist span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 36px;
        padding: 0 10px;
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.16);
        font-weight: 700;
      }

      .securityChecklist {
        grid-template-columns: 1fr;
      }

      .accentPanel {
        background:
          radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 40%),
          rgba(255, 255, 255, 0.94);
      }

      .trustSignalGrid svg,
      .securityChecklist svg {
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
        color: #1d4ed8;
      }

      .heroActionRow,
      .actionRow,
      .cardActionRow {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .heroActionRow {
        justify-content: flex-end;
      }

      .verificationSummaryGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .metricCard {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-radius: 24px;
      }

      .metricCard small,
      .verificationDocumentCard small,
      .auditItem small,
      .notificationCard small {
        color: #64748b;
      }

      .metricCard strong {
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

      .metricIcon {
        width: 42px;
        height: 42px;
        display: inline-grid;
        place-items: center;
        border-radius: 16px;
        background: rgba(219, 234, 254, 0.82);
        color: #1d4ed8;
      }

      .verificationStatusStrip {
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

      .verificationStatusStrip.success {
        color: #047857;
        background: rgba(236, 253, 245, 0.92);
      }

      .verificationStatusStrip.warning {
        color: #b45309;
        background: rgba(255, 251, 235, 0.94);
      }

      .verificationStatusStrip.danger {
        color: #b91c1c;
        background: rgba(254, 242, 242, 0.94);
      }

      .verificationStatusStrip.neutral {
        color: #334155;
      }

      .verificationLayout {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.92fr);
        gap: 18px;
      }

      .verificationMainColumn,
      .verificationAsideColumn {
        display: grid;
        gap: 18px;
      }

      .panelHead {
        display: grid;
        gap: 14px;
        margin-bottom: 18px;
      }

      .verifiedBadge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 14px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(29, 78, 216, 0.9));
        color: #f8fafc;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .progressBlock {
        display: grid;
        gap: 10px;
        margin-bottom: 18px;
      }

      .progressCopy {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .progressTrack {
        height: 10px;
        border-radius: 999px;
        background: rgba(191, 219, 254, 0.46);
        overflow: hidden;
      }

      .progressTrack span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #2563eb, #0ea5e9);
        box-shadow: 0 0 18px rgba(37, 99, 235, 0.32);
      }

      .progressHint {
        color: #475569;
      }

      .fieldRow,
      .uploadGrid {
        display: grid;
        gap: 14px;
      }

      .fieldRow {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-bottom: 14px;
      }

      .fieldShell {
        display: grid;
        gap: 8px;
      }

      .fieldShell span {
        font-size: 0.92rem;
        font-weight: 700;
        color: #0f172a;
      }

      .fieldShell input,
      .fieldShell select {
        width: 100%;
        min-height: 52px;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(255, 255, 255, 0.98);
        padding: 0 16px;
        color: #0f172a;
        font: inherit;
      }

      .uploadStack,
      .uploadGrid {
        display: grid;
        gap: 14px;
      }

      .uploadGrid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .spanFull {
        grid-column: 1 / -1;
      }

      .dropZone {
        display: grid;
        justify-items: start;
        gap: 10px;
        min-height: 190px;
        padding: 20px;
        border-radius: 24px;
        border-style: dashed;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
      }

      .dropZone:hover,
      .dropZoneReady {
        transform: translateY(-2px);
        border-color: rgba(37, 99, 235, 0.28);
        box-shadow: 0 28px 60px rgba(15, 23, 42, 0.1);
      }

      .dropZone strong {
        font-size: 1rem;
      }

      .dropZone span {
        color: #2563eb;
        font-weight: 700;
      }

      .dropZoneIcon {
        width: 28px;
        height: 28px;
        color: #1d4ed8;
      }

      .hiddenInput {
        display: none;
      }

      .uploadProgressBlock {
        display: grid;
        gap: 8px;
        margin-top: 14px;
      }

      .uploadProgressBlock small {
        color: #475569;
      }

      .documentList,
      .notificationStack,
      .auditStack {
        display: grid;
        gap: 12px;
      }

      .verificationDocumentCard,
      .notificationCard,
      .auditItem,
      .emptyHint {
        border-radius: 22px;
        padding: 18px;
      }

      .verificationDocumentCard {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
      }

      .notificationMetaRow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 10px;
      }

      .verificationDocumentCard strong,
      .notificationCard strong,
      .auditItem strong,
      .emptyHint strong {
        display: block;
        margin-bottom: 6px;
        color: #0f172a;
      }

      .notificationCard.success {
        border-color: rgba(16, 185, 129, 0.2);
      }

      .notificationCard.warning {
        border-color: rgba(245, 158, 11, 0.2);
      }

      .notificationCard.danger {
        border-color: rgba(239, 68, 68, 0.2);
      }

      .hintList {
        display: grid;
        gap: 10px;
        margin: 0;
        padding-left: 18px;
        color: #475569;
      }

      .primaryButton,
      .ghostButton {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 0 18px;
        border-radius: 16px;
        border: 1px solid rgba(37, 99, 235, 0.22);
        font-weight: 800;
        font-family: inherit;
        cursor: pointer;
        text-decoration: none;
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      }

      .primaryButton {
        background: linear-gradient(135deg, #1d4ed8, #3b82f6);
        color: #ffffff;
        box-shadow: 0 18px 32px rgba(37, 99, 235, 0.24);
      }

      .ghostButton {
        background: rgba(255, 255, 255, 0.9);
        color: #0f172a;
      }

      .primaryButton:hover,
      .ghostButton:hover {
        transform: translateY(-1px);
      }

      .compactButton {
        min-height: 42px;
        padding: 0 14px;
        border-radius: 14px;
      }

      .buttonIcon {
        width: 18px;
        height: 18px;
      }

      @media (max-width: 1100px) {
        .verificationSummaryGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .verificationLayout {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 820px) {
        .heroTop,
        .fieldRow,
        .uploadGrid,
        .verificationDocumentCard {
          grid-template-columns: 1fr;
        }

        .trustSignalGrid {
          grid-template-columns: 1fr;
        }

        .verificationPage {
          padding: 10px;
        }

        .verificationHeroCard,
        .panelCard {
          padding: 18px;
          border-radius: 24px;
        }

        .verificationSummaryGrid {
          grid-template-columns: 1fr;
        }
      }

      html[data-theme='dark'] .verificationPage {
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 32%),
          radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.16), transparent 28%),
          linear-gradient(180deg, #07111f 0%, #0b1526 54%, #0d182b 100%);
        color: #e2e8f0;
      }

      html[data-theme='dark'] .verificationHeroCard,
      html[data-theme='dark'] .verificationStatusStrip,
      html[data-theme='dark'] .panelCard,
      html[data-theme='dark'] .trustHeroPanel,
      html[data-theme='dark'] .metricCard,
      html[data-theme='dark'] .dropZone,
      html[data-theme='dark'] .verificationDocumentCard,
      html[data-theme='dark'] .notificationCard,
      html[data-theme='dark'] .auditItem,
      html[data-theme='dark'] .emptyHint {
        background: rgba(12, 18, 30, 0.92);
        border-color: rgba(71, 85, 105, 0.32);
        box-shadow: 0 24px 70px rgba(2, 6, 23, 0.38);
      }

      html[data-theme='dark'] .verificationHeroCard h1,
      html[data-theme='dark'] .panelCard h2,
      html[data-theme='dark'] .panelCard h3,
      html[data-theme='dark'] .trustHeroIdentity strong,
      html[data-theme='dark'] .trustScoreRow strong,
      html[data-theme='dark'] .metricCard strong,
      html[data-theme='dark'] .verificationDocumentCard strong,
      html[data-theme='dark'] .notificationCard strong,
      html[data-theme='dark'] .auditItem strong,
      html[data-theme='dark'] .emptyHint strong,
      html[data-theme='dark'] .fieldShell span {
        color: #f8fafc;
      }

      html[data-theme='dark'] .verificationHeroCard p,
      html[data-theme='dark'] .panelCard p,
      html[data-theme='dark'] .dropZone p,
      html[data-theme='dark'] .trustHeroIdentity small,
      html[data-theme='dark'] .trustScoreRow span,
      html[data-theme='dark'] .trustSignalGrid span,
      html[data-theme='dark'] .metricCard span,
      html[data-theme='dark'] .metricCard small,
      html[data-theme='dark'] .verificationDocumentCard span,
      html[data-theme='dark'] .verificationDocumentCard small,
      html[data-theme='dark'] .notificationCard small,
      html[data-theme='dark'] .auditItem small,
      html[data-theme='dark'] .hintList,
      html[data-theme='dark'] .progressHint,
      html[data-theme='dark'] .uploadProgressBlock small {
        color: #94a3b8;
      }

      html[data-theme='dark'] .fieldShell input,
      html[data-theme='dark'] .fieldShell select,
      html[data-theme='dark'] .trustSignalGrid span,
      html[data-theme='dark'] .securityChecklist span,
      html[data-theme='dark'] .ghostButton {
        background: rgba(15, 23, 42, 0.92);
        border-color: rgba(71, 85, 105, 0.35);
        color: #e2e8f0;
      }

      html[data-theme='dark'] .progressTrack {
        background: rgba(37, 99, 235, 0.18);
      }
    `}</style>
  );
}
