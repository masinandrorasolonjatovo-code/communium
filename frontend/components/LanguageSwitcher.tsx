'use client';

import { Globe2 } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { defaultLocale, isLocale, isSupportedLocale, localeNames, supportedLocales, type Locale } from '@/i18n.config';
import { localizeHref, stripLocalePrefix } from '@/components/locale-path';

const switcherLabels: Record<Locale, string> = {
  en: 'Choose language',
  fr: 'Choisir la langue',
  ar: '\u0627\u062e\u062a\u0631 \u0627\u0644\u0644\u063a\u0629',
  es: 'Elegir idioma',
  de: 'Sprache w\u00e4hlen',
  zh: '\u9009\u62e9\u8bed\u8a00',
  ja: '\u8a00\u8a9e\u3092\u9078\u629e',
  pt: 'Escolher idioma',
  ru: '\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u044f\u0437\u044b\u043a',
};

export default function LanguageSwitcher() {
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentLocale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const currentSupportedLocale = isSupportedLocale(currentLocale) ? currentLocale : defaultLocale;

  if (supportedLocales.length <= 1) {
    return null;
  }

  function handleChange(nextLocale: string) {
    if (!isSupportedLocale(nextLocale) || nextLocale === currentSupportedLocale) {
      return;
    }

    const nextPath = localizeHref(nextLocale, stripLocalePrefix(pathname || '/'));
    const query = searchParams.toString();
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const nextUrl = `${query ? `${nextPath}?${query}` : nextPath}${hash}`;

    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${nextLocale}; Max-Age=31536000; Path=/; SameSite=Lax`;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('communium-locale', nextLocale);
    }

    startTransition(() => {
      router.replace(nextUrl);
      router.refresh();
    });
  }

  return (
    <label className="languageField">
      <span className="srOnly">{switcherLabels[currentSupportedLocale]}</span>
      <span className="languageIcon" aria-hidden="true">
        <Globe2 className="languageIconSvg" strokeWidth={2.05} />
      </span>
      <select
        value={currentSupportedLocale}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        aria-label={switcherLabels[currentSupportedLocale]}
        title={switcherLabels[currentSupportedLocale]}
      >
        {supportedLocales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>

      <style>{`
        .languageField {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .srOnly {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        .languageIcon {
          position: absolute;
          left: 14px;
          z-index: 1;
          pointer-events: none;
          color: var(--brand-700);
        }

        .languageIconSvg {
          width: 18px;
          height: 18px;
        }

        .languageField select {
          min-height: 44px;
          border-radius: 16px;
          border: 1px solid var(--field-line);
          background: var(--panel-elevated);
          padding: 0 16px 0 40px;
          color: var(--ink-950);
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .languageField select option {
          background: var(--panel-elevated);
          color: var(--ink-950);
        }

        .languageField select:focus {
          border-color: var(--field-focus);
          box-shadow: 0 0 0 4px var(--field-focus-ring);
        }

        .languageField select:disabled {
          opacity: 0.72;
          cursor: wait;
        }

        [dir='rtl'] .languageIcon {
          left: auto;
          right: 14px;
        }

        [dir='rtl'] .languageField select {
          padding: 0 40px 0 16px;
        }
      `}</style>
    </label>
  );
}
