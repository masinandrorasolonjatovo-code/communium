export const locales = ['en', 'fr', 'ar', 'es', 'de', 'zh', 'ja', 'pt', 'ru'] as const;

export type Locale = (typeof locales)[number];

export const supportedLocales = ['fr', 'en', 'es'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'fr';

export const rtlLocales: Locale[] = ['ar'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Fran\u00e7ais',
  ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
  es: 'Espa\u00f1ol',
  de: 'Deutsch',
  zh: '\u4e2d\u6587',
  ja: '\u65e5\u672c\u8a9e',
  pt: 'Portugu\u00eas',
  ru: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
};

export function isLocale(value?: string | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function isSupportedLocale(value?: string | null): value is SupportedLocale {
  return Boolean(value && supportedLocales.includes(value as SupportedLocale));
}
