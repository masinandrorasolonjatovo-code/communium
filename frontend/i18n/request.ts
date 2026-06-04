import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale, isSupportedLocale } from '../i18n.config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) && isSupportedLocale(requestedLocale)
    ? requestedLocale
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}/common.json`)).default,
  };
});
