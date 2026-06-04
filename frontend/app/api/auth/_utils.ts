import type { User } from '@clerk/backend';

const DEFAULT_ADMIN_EMAILS = ['masinandrorasolonnjatovo@gmail.com'];

function parseDelimitedEnvSet(value?: string) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function parseEmailSet(value?: string) {
  return new Set(
    [...DEFAULT_ADMIN_EMAILS, ...Array.from(parseDelimitedEnvSet(value))].map((item) =>
      item.toLowerCase(),
    ),
  );
}

function isAuthAdmin(user: User | null) {
  if (!user) {
    return false;
  }

  const adminIds = parseDelimitedEnvSet(
    process.env.CLERK_ADMIN_IDS || process.env.VERIFICATION_ADMIN_IDS,
  );
  const adminEmails = parseEmailSet(
    process.env.CLERK_ADMIN_EMAILS || process.env.VERIFICATION_ADMIN_EMAILS,
  );

  if (adminIds.has(String(user.id))) {
    return true;
  }

  const primaryEmail = getPrimaryEmail(user)?.emailAddress || '';
  return adminEmails.has(primaryEmail.toLowerCase());
}

export function getPrimaryEmail(user: User | null) {
  if (!user) {
    return null;
  }

  const primary =
    user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId) ||
    user.emailAddresses[0];

  return primary || null;
}

export function isEmailVerified(user: User | null) {
  const primary = getPrimaryEmail(user);
  return primary?.verification?.status === 'verified';
}

export function resolveUnsafeAccountType(user: User | null) {
  const rawValue =
    typeof user?.unsafeMetadata?.accountType === 'string'
      ? user.unsafeMetadata.accountType
      : typeof user?.publicMetadata?.accountType === 'string'
        ? user.publicMetadata.accountType
        : null;

  return rawValue === 'business' || rawValue === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL';
}

export function buildAuthUserPayload(user: User | null) {
  const primary = getPrimaryEmail(user);

  return {
    clerkUserId: user?.id || null,
    email: primary?.emailAddress || null,
    emailVerified: isEmailVerified(user),
    firstName: user?.firstName || null,
    lastName: user?.lastName || null,
    fullName: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || null,
    username: user?.username || null,
    accountType: resolveUnsafeAccountType(user),
    isAdmin: isAuthAdmin(user),
    imageUrl: user?.imageUrl || null,
  };
}
