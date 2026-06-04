export type VerificationAccountType = 'PERSONAL' | 'BUSINESS';
export type VerificationStatus = 'NON_VERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type VerificationDocumentType =
  | 'CIN'
  | 'PASSPORT'
  | 'RC'
  | 'ICE'
  | 'IF'
  | 'COMPANY_STATUTES'
  | 'CIN_OR_PASSPORT';

export interface VerificationDocumentRecord {
  id: string;
  documentType: VerificationDocumentType;
  label: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt?: string | null;
  previewUrl?: string | null;
  downloadUrl?: string | null;
}

export interface VerificationNotificationRecord {
  id: string;
  status: VerificationStatus;
  title: string;
  message: string;
  createdAt?: string | null;
  readAt?: string | null;
}

export interface VerificationAuditRecord {
  id: string;
  action: string;
  actorUserId?: number | null;
  actorUsername?: string | null;
  createdAt?: string | null;
  details?: Record<string, unknown>;
}

export interface VerificationProgressRecord {
  uploaded: number;
  required: number;
  percent: number;
  missingDocumentTypes: VerificationDocumentType[];
  missingDocumentLabels: string[];
  isComplete: boolean;
}

export interface VerificationState {
  id?: string | null;
  type: VerificationAccountType;
  status: VerificationStatus;
  badgeLabel?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: number | null;
  rejectionReason?: string | null;
  progress: VerificationProgressRecord;
  requiredDocuments: string[];
  documents: VerificationDocumentRecord[];
  notifications: VerificationNotificationRecord[];
  auditLogs: VerificationAuditRecord[];
}

export function normalizeVerificationAccountType(value?: string | null): VerificationAccountType {
  return value === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL';
}

export function normalizeVerificationStatus(value?: string | null): VerificationStatus {
  switch (value) {
    case 'PENDING':
    case 'VERIFIED':
    case 'REJECTED':
      return value;
    default:
      return 'NON_VERIFIED';
  }
}

export function verificationStatusLabel(status: VerificationStatus, locale: string = 'fr') {
  const isFrench = locale === 'fr';

  switch (status) {
    case 'PENDING':
      return isFrench ? 'En attente' : 'Pending';
    case 'VERIFIED':
      return isFrench ? 'Verifie' : 'Verified';
    case 'REJECTED':
      return isFrench ? 'Rejete' : 'Rejected';
    default:
      return isFrench ? 'Non verifie' : 'Not verified';
  }
}

export function verificationTone(status: VerificationStatus) {
  switch (status) {
    case 'VERIFIED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'PENDING':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function verificationAccountLabel(type: VerificationAccountType, locale: string = 'fr') {
  const isFrench = locale === 'fr';
  return type === 'BUSINESS'
    ? isFrench
      ? 'Compte business'
      : 'Business account'
    : isFrench
      ? 'Compte personnel'
      : 'Personal account';
}

export function verificationDocumentLabel(type: VerificationDocumentType, locale: string = 'fr') {
  const isFrench = locale === 'fr';

  switch (type) {
    case 'PASSPORT':
      return isFrench ? 'Passeport' : 'Passport';
    case 'RC':
      return 'RC';
    case 'ICE':
      return 'ICE';
    case 'IF':
      return 'IF';
    case 'COMPANY_STATUTES':
      return isFrench ? 'Statuts societe' : 'Company statutes';
    case 'CIN_OR_PASSPORT':
      return isFrench ? 'CIN ou passeport' : 'National ID or passport';
    default:
      return 'CIN';
  }
}

export function verificationBadgeText(
  type: VerificationAccountType,
  status: VerificationStatus,
  locale: string = 'fr'
) {
  if (status !== 'VERIFIED') {
    return '';
  }

  const isFrench = locale === 'fr';
  if (type === 'BUSINESS') {
    return isFrench ? 'Entreprise verifiee' : 'Verified company';
  }

  return isFrench ? 'Profil verifie' : 'Verified profile';
}

export function formatVerificationFileSize(bytes?: number | null) {
  const safeBytes = Number(bytes || 0);

  if (!safeBytes) {
    return '0 Ko';
  }

  if (safeBytes >= 1024 * 1024) {
    return `${(safeBytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  return `${Math.max(1, Math.round(safeBytes / 1024))} Ko`;
}

export function emptyVerificationState(type: VerificationAccountType = 'PERSONAL'): VerificationState {
  return {
    type,
    status: 'NON_VERIFIED',
    badgeLabel: null,
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    progress: {
      uploaded: 0,
      required: type === 'BUSINESS' ? 4 : 1,
      percent: 0,
      missingDocumentTypes: type === 'BUSINESS' ? ['RC', 'ICE', 'IF', 'COMPANY_STATUTES'] : ['CIN_OR_PASSPORT'],
      missingDocumentLabels:
        type === 'BUSINESS'
          ? ['RC', 'ICE', 'IF', 'Statuts societe']
          : ['CIN ou passeport'],
      isComplete: false,
    },
    requiredDocuments:
      type === 'BUSINESS'
        ? ['RC', 'ICE', 'IF', 'Statuts societe']
        : ['CIN ou passeport'],
    documents: [],
    notifications: [],
    auditLogs: [],
  };
}
