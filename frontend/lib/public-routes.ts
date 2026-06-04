import { localizeHref } from '@/components/locale-path';

export function buildPublicRoutes(locale?: string) {
  const contact = localizeHref(locale, '/contact');

  const withQuery = (path: string, query: Record<string, string>) => {
    const params = new URLSearchParams(query);
    return `${path}?${params.toString()}`;
  };

  return {
    home: localizeHref(locale, '/'),
    discover: localizeHref(locale, '/discover'),
    features: localizeHref(locale, '/features'),
    premium: localizeHref(locale, '/premium'),
    about: localizeHref(locale, '/about'),
    privacy: localizeHref(locale, '/privacy'),
    terms: localizeHref(locale, '/terms'),
    contact,
    contactSupport: withQuery(contact, { topic: 'support' }),
    contactApi: withQuery(contact, { topic: 'api' }),
    contactEnterprise: withQuery(contact, { intent: 'enterprise' }),
    settings: localizeHref(locale, '/settings'),
    messages: localizeHref(locale, '/messages'),
    documentation: localizeHref(locale, '/about'),
    security: localizeHref(locale, '/features'),
    dashboard: localizeHref(locale, '/dashboard'),
    profile: localizeHref(locale, '/dashboard/profile'),
  };
}
