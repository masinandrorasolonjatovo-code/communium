export function formatClerkError(error: unknown, isFrench: boolean, fallbackFrench: string, fallbackEnglish: string) {
  const fallback = isFrench ? fallbackFrench : fallbackEnglish;
  const normalize = (message?: string | null) => {
    if (!message) {
      return fallback;
    }

    if (
      /does not match one of the allowed values|parameter strategy|unsupported|unknown strategy|not enabled|not configured|redirect did not start/iu.test(
        message,
      )
    ) {
      return fallback;
    }

    return message;
  };

  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const nestedErrors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;

    if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
      return normalize(
        nestedErrors
        .map((item) => item.longMessage || item.message)
        .filter(Boolean)
          .join(' '),
      );
    }
  }

  if (error instanceof Error && error.message) {
    return normalize(error.message);
  }

  return fallback;
}

export function ensureNoClerkError(error: unknown) {
  if (error) {
    throw error;
  }
}

export function toAbsoluteBrowserUrl(url: string) {
  if (typeof window === 'undefined') {
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return new URL(url, window.location.origin).toString();
}

type OAuthStartParams = {
  strategy: string;
  redirectCallbackUrl: string;
  redirectUrl: string;
  unsafeMetadata?: Record<string, unknown>;
};

type ClerkClientLike = {
  client?: {
    signIn?: {
      authenticateWithRedirect?: (params: Record<string, unknown>) => Promise<void>;
    };
    signUp?: {
      authenticateWithRedirect?: (params: Record<string, unknown>) => Promise<void>;
    };
  };
};

type FutureSignInLike = {
  create?: (params: Record<string, unknown>) => Promise<{ error?: unknown } | void>;
  sso?: (params: Record<string, unknown>) => Promise<{ error?: unknown } | void>;
  authenticateWithRedirect?: (params: Record<string, unknown>) => Promise<void>;
};

type FutureSignUpLike = {
  sso?: (params: Record<string, unknown>) => Promise<{ error?: unknown } | void>;
  authenticateWithRedirect?: (params: Record<string, unknown>) => Promise<void>;
};

function findRedirectUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directUrl =
    record.externalVerificationRedirectURL ||
    record.externalVerificationRedirectUrl ||
    record.redirectUrl ||
    record.redirectURL;

  if (typeof directUrl === 'string' && directUrl) {
    return directUrl;
  }

  for (const nestedValue of Object.values(record)) {
    const nestedUrl = findRedirectUrl(nestedValue);
    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return null;
}

function redirectToOAuthUrl(url: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.assign(url);
}

function readOAuthResult(result: { error?: unknown } | void) {
  if (result && typeof result === 'object' && 'error' in result) {
    ensureNoClerkError(result.error);
  }

  const redirectUrl = findRedirectUrl(result);
  if (redirectUrl) {
    redirectToOAuthUrl(redirectUrl);
    return true;
  }

  return false;
}

export async function startOAuthSignIn(
  clerk: unknown,
  signIn: unknown,
  params: OAuthStartParams,
) {
  const legacySignIn = (clerk as ClerkClientLike)?.client?.signIn;
  const futureSignIn = signIn as FutureSignInLike | null | undefined;

  if (typeof futureSignIn?.authenticateWithRedirect === 'function') {
    await futureSignIn.authenticateWithRedirect({
      strategy: params.strategy,
      redirectUrl: params.redirectCallbackUrl,
      redirectUrlComplete: params.redirectUrl,
    });
    return;
  }

  if (typeof futureSignIn?.sso === 'function') {
    const result = await futureSignIn.sso({
      strategy: params.strategy,
      redirectCallbackUrl: params.redirectCallbackUrl,
      redirectUrl: params.redirectUrl,
    });
    if (!readOAuthResult(result)) {
      throw new Error('OAuth redirect did not start.');
    }
    return;
  }

  if (typeof futureSignIn?.create === 'function') {
    const result = await futureSignIn.create({
      strategy: params.strategy,
      redirectUrl: params.redirectCallbackUrl,
      actionCompleteRedirectUrl: params.redirectUrl,
    });
    if (!readOAuthResult(result)) {
      throw new Error('OAuth redirect did not start.');
    }
    return;
  }

  if (typeof legacySignIn?.authenticateWithRedirect === 'function') {
    await legacySignIn.authenticateWithRedirect({
      strategy: params.strategy,
      redirectUrl: params.redirectCallbackUrl,
      redirectUrlComplete: params.redirectUrl,
    });
    return;
  }

  throw new Error('OAuth sign-in is not available right now.');
}

export async function startOAuthSignUp(
  clerk: unknown,
  signUp: unknown,
  params: OAuthStartParams,
) {
  const legacySignUp = (clerk as ClerkClientLike)?.client?.signUp;
  const futureSignUp = signUp as FutureSignUpLike | null | undefined;

  if (typeof futureSignUp?.authenticateWithRedirect === 'function') {
    await futureSignUp.authenticateWithRedirect({
      strategy: params.strategy,
      redirectUrl: params.redirectCallbackUrl,
      redirectUrlComplete: params.redirectUrl,
      legalAccepted: true,
      unsafeMetadata: params.unsafeMetadata,
    });
    return;
  }

  if (typeof futureSignUp?.sso === 'function') {
    const result = await futureSignUp.sso({
      strategy: params.strategy,
      redirectCallbackUrl: params.redirectCallbackUrl,
      redirectUrl: params.redirectUrl,
      unsafeMetadata: params.unsafeMetadata,
    });
    if (!readOAuthResult(result)) {
      throw new Error('OAuth redirect did not start.');
    }
    return;
  }

  if (typeof legacySignUp?.authenticateWithRedirect === 'function') {
    await legacySignUp.authenticateWithRedirect({
      strategy: params.strategy,
      redirectUrl: params.redirectCallbackUrl,
      redirectUrlComplete: params.redirectUrl,
      legalAccepted: true,
      unsafeMetadata: params.unsafeMetadata,
    });
    return;
  }

  throw new Error('OAuth sign-up is not available right now.');
}
