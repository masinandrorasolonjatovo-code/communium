'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import type { Locale } from '@/i18n.config';

interface ThemeToggleProps {
  locale: Locale;
}

const labels: Record<Locale, { toggle: string; current: string; dark: string; light: string }> = {
  en: {
    toggle: 'Switch between light and dark mode',
    current: 'Theme',
    dark: 'dark',
    light: 'light',
  },
  fr: {
    toggle: 'Basculer entre le mode clair et le mode sombre',
    current: 'Theme',
    dark: 'sombre',
    light: 'clair',
  },
  ar: {
    toggle: '\u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0628\u064a\u0646 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0641\u0627\u062a\u062d \u0648\u0627\u0644\u062f\u0627\u0643\u0646',
    current: '\u0627\u0644\u0633\u0645\u0629',
    dark: '\u062f\u0627\u0643\u0646',
    light: '\u0641\u0627\u062a\u062d',
  },
  es: {
    toggle: 'Cambiar entre modo claro y oscuro',
    current: 'Tema',
    dark: 'oscuro',
    light: 'claro',
  },
  de: {
    toggle: 'Zwischen Hell- und Dunkelmodus wechseln',
    current: 'Thema',
    dark: 'dunkel',
    light: 'hell',
  },
  zh: {
    toggle: '\u5207\u6362\u6d45\u8272\u4e0e\u6df1\u8272\u6a21\u5f0f',
    current: '\u4e3b\u9898',
    dark: '\u6df1\u8272',
    light: '\u6d45\u8272',
  },
  ja: {
    toggle: '\u30e9\u30a4\u30c8\u30e2\u30fc\u30c9\u3068\u30c0\u30fc\u30af\u30e2\u30fc\u30c9\u3092\u5207\u308a\u66ff\u3048\u308b',
    current: '\u30c6\u30fc\u30de',
    dark: '\u30c0\u30fc\u30af',
    light: '\u30e9\u30a4\u30c8',
  },
  pt: {
    toggle: 'Alternar entre modo claro e escuro',
    current: 'Tema',
    dark: 'escuro',
    light: 'claro',
  },
  ru: {
    toggle: '\u041f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0441\u0432\u0435\u0442\u043b\u0443\u044e \u0438 \u0442\u0435\u043c\u043d\u0443\u044e \u0442\u0435\u043c\u0443',
    current: '\u0422\u0435\u043c\u0430',
    dark: '\u0442\u0435\u043c\u043d\u0430\u044f',
    light: '\u0441\u0432\u0435\u0442\u043b\u0430\u044f',
  },
};

export default function ThemeToggle({ locale }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const copy = labels[locale] || labels.en;
  const isDark = theme === 'dark';

  return (
    <>
      <button
        type="button"
        data-communium-theme-toggle="true"
        className={isDark ? 'themeToggle dark' : 'themeToggle'}
        onClick={toggleTheme}
        aria-label={copy.toggle}
        title={copy.toggle}
      >
        <span className="srOnly">
          {copy.current}: {isDark ? copy.dark : copy.light}
        </span>

        <span className="themeTrack" aria-hidden="true">
          <MoonStar className="themeGlyph themeMoonGlyph" strokeWidth={2.05} />
          <SunMedium className="themeGlyph themeSunGlyph" strokeWidth={2.05} />
        </span>

        <span className="themeThumb" aria-hidden="true">
          {isDark ? (
            <MoonStar className="themeThumbIcon" strokeWidth={2.1} />
          ) : (
            <SunMedium className="themeThumbIcon" strokeWidth={2.1} />
          )}
        </span>
      </button>
      <style>{`
        .themeToggle {
          position: relative;
          width: 78px;
          height: 44px;
          padding: 0;
          border: 1.5px solid var(--theme-track-border);
          border-radius: 999px;
          background: var(--theme-track-bg);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
          cursor: pointer;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease,
            color 0.18s ease;
        }

        .themeToggle:hover {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 12px 24px rgba(15, 23, 42, 0.12);
        }

        .themeToggle:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 4px var(--field-focus-ring),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }

        .themeTrack {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
        }

        .themeGlyph {
          width: 15px;
          height: 15px;
          color: var(--theme-icon-passive);
          transition: opacity 0.18s ease, color 0.18s ease;
        }

        .themeMoonGlyph {
          opacity: 0.7;
        }

        .themeSunGlyph {
          opacity: 0.9;
        }

        .themeThumb {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: var(--theme-thumb-bg);
          color: var(--theme-thumb-ink);
          box-shadow: var(--theme-thumb-shadow);
          transition:
            transform 0.22s ease,
            background 0.18s ease,
            box-shadow 0.18s ease,
            color 0.18s ease;
        }

        .themeToggle.dark .themeThumb {
          transform: translateX(34px);
        }

        .themeThumbIcon {
          width: 16px;
          height: 16px;
        }

        .srOnly {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </>
  );
}
