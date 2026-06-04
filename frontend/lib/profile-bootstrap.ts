export interface PendingProfileBootstrap {
  accountType?: 'personal' | 'business';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  city: string;
  address: string;
  currentJobTitle: string;
  currentCompany: string;
  currentIndustry: string;
  publicProfileUrl: string;
}

const storageKey = 'communium.pendingProfileBootstrap';

export function storePendingProfileBootstrap(payload: PendingProfileBootstrap) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
}

export function readPendingProfileBootstrap(): PendingProfileBootstrap | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PendingProfileBootstrap;
  } catch {
    return null;
  }
}

export function clearPendingProfileBootstrap() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(storageKey);
}
