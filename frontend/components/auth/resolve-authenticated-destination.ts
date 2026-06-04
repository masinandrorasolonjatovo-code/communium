import { localizeHref } from '@/components/locale-path';
import { buildVerifyEmailHref } from '@/lib/auth-flow';

const DEFAULT_DESTINATION_TIMEOUT_MS = 900;

interface ResolveAuthenticatedDestinationParams {
  locale: string;
  getToken: () => Promise<string | null>;
  preferredRedirectHref?: string;
  hasCustomRedirect?: boolean;
  emailHint?: string;
  timeoutMs?: number;
}

interface AuthMeResponse {
  authenticated?: boolean;
  data?: {
    email?: string | null;
    emailVerified?: boolean;
    accountType?: string | null;
    isAdmin?: boolean;
  };
}

interface VerificationResponse {
  success?: boolean;
  data?: {
    status?: string | null;
  };
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeout),
  };
}

async function loadAuthSnapshot(timeoutMs: number) {
  const timeout = createTimeoutSignal(timeoutMs);

  const response = await fetch('/api/auth/me', {
    cache: 'no-store',
    credentials: 'same-origin',
    signal: timeout.signal,
  });
  timeout.clear();

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as AuthMeResponse;
  if (!body?.authenticated) {
    return null;
  }

  return body.data || null;
}

async function loadVerificationStatus(getToken: () => Promise<string | null>, timeoutMs: number) {
  try {
    const token = await Promise.race([
      getToken(),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
    ]);

    if (!token) {
      return null;
    }

    const timeout = createTimeoutSignal(timeoutMs);
    const response = await fetch('/api/verification/me', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: timeout.signal,
    });
    timeout.clear();

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as VerificationResponse;
    return body?.success ? String(body.data?.status || '').toUpperCase() : null;
  } catch {
    return null;
  }
}

export async function resolveAuthenticatedDestination({
  locale,
  getToken,
  preferredRedirectHref,
  hasCustomRedirect = false,
  emailHint = '',
  timeoutMs = DEFAULT_DESTINATION_TIMEOUT_MS,
}: ResolveAuthenticatedDestinationParams) {
  const authSnapshot = await loadAuthSnapshot(timeoutMs).catch(() => null);
  const email = authSnapshot?.email || emailHint || '';

  if (authSnapshot?.emailVerified === false) {
    return buildVerifyEmailHref(locale, { email });
  }

  const verificationStatus = await loadVerificationStatus(getToken, timeoutMs);
  if (verificationStatus && verificationStatus !== 'VERIFIED') {
    return localizeHref(locale, '/verification');
  }

  if (authSnapshot?.isAdmin) {
    return localizeHref(locale, '/admin');
  }

  if (hasCustomRedirect && preferredRedirectHref) {
    return preferredRedirectHref;
  }

  if (String(authSnapshot?.accountType || '').toUpperCase() === 'BUSINESS') {
    return localizeHref(locale, '/business/dashboard');
  }

  return preferredRedirectHref || localizeHref(locale, '/dashboard');
}
