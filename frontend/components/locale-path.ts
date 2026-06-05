import { defaultLocale, isLocale } from '@/i18n.config';

function ensureLeadingSlash(path: string) {
  if (!path) {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function stripLocalePrefix(pathname: string) {
  const normalized = ensureLeadingSlash(pathname).split('?')[0];
  const segments = normalized.split('/').filter(Boolean);

  if (!segments.length) {
    return '/';
  }

  if (isLocale(segments[0])) {
    const rest = segments.slice(1).join('/');
    return rest ? `/${rest}` : '/';
  }

  return normalized;
}

export function localizeHref(locale: string | undefined, path: string) {
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const normalized = ensureLeadingSlash(path);

  return normalized === '/' ? `/${safeLocale}` : `/${safeLocale}${normalized}`;
}
