'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { buildPublicRoutes } from '@/lib/public-routes';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale, rtlLocales, type Locale } from '@/i18n.config';

type FooterVariant = 'member' | 'public';

interface SiteFooterProps {
  locale?: string;
  variant?: FooterVariant;
}

interface FooterColumnTitle {
  product: string;
  trust: string;
  access: string;
}

interface FooterLinkLabels {
  features: string;
  profiles: string;
  network: string;
  premium: string;
  privacy: string;
  security: string;
  terms: string;
  settings: string;
  api?: string;
  contact: string;
  support: string;
  documentation: string;
  enterprise: string;
}

interface PremiumFooterCopy {
  slogan: string;
  miniDescription: string;
  closingLine: string;
  columns: FooterColumnTitle;
  links: FooterLinkLabels;
  copyright: string;
  rights: string;
  navProduct: string;
  navTrust: string;
  navAccess: string;
}

const enCopy: PremiumFooterCopy = {
  slogan: 'Professional presence, engineered.',
  miniDescription:
    'Identity, visibility, and trust signals in one calm surface - built for people who ship credibility, not noise.',
  closingLine: 'A clear presence. A credible network.',
  columns: {
    product: 'Product',
    trust: 'Trust',
    access: 'Access',
  },
  links: {
    features: 'Features',
    profiles: 'Profiles',
    network: 'Network',
    premium: 'Premium',
    privacy: 'Privacy',
    security: 'Security',
    terms: 'Terms',
    settings: 'Settings',
    api: 'API',
    contact: 'Contact',
    support: 'Support',
    documentation: 'Documentation',
    enterprise: 'Enterprise',
  },
  copyright: '(c) 2026 Communium',
  rights: 'All rights reserved.',
  navProduct: 'Product navigation',
  navTrust: 'Trust and policies',
  navAccess: 'Contact and resources',
};

const frCopy: PremiumFooterCopy = {
  slogan: 'Une presence professionnelle, calibree.',
  miniDescription:
    'Identite, visibilite et signaux de confiance sur une surface unique - pour ceux qui livrent de la credibilite, pas du bruit.',
  closingLine: 'Une presence claire. Un reseau credible.',
  columns: {
    product: 'Produit',
    trust: 'Confiance',
    access: 'Acces',
  },
  links: {
    features: 'Fonctionnalites',
    profiles: 'Profils',
    network: 'Reseau',
    premium: 'Premium',
    privacy: 'Confidentialite',
    security: 'Securite',
    terms: 'Conditions',
    settings: 'Parametres',
    contact: 'Contact',
    support: 'Support',
    documentation: 'Documentation',
    enterprise: 'Acces entreprise',
  },
  copyright: '(c) 2026 Communium',
  rights: 'Tous droits reserves.',
  navProduct: 'Navigation produit',
  navTrust: 'Politiques et confiance',
  navAccess: 'Contact et ressources',
};

const arCopy: PremiumFooterCopy = {
  slogan: 'Ø­Ø¶ÙˆØ± Ù…Ù‡Ù†ÙŠ Ø¨Ù…Ø¹Ø§ÙŠÙŠØ± Ø¹Ø§Ù„ÙŠØ©.',
  miniDescription:
    'Ù‡ÙˆÙŠØ© ÙˆÙˆØ¶ÙˆØ­ ÙˆØ¥Ø´Ø§Ø±Ø§Øª Ø«Ù‚Ø© ÙÙŠ Ø³Ø·Ø­ ÙˆØ§Ø­Ø¯ Ù‡Ø§Ø¯Ø¦ - Ù„Ù…Ù† ÙŠØ¨Ù†ÙŠ Ù…ØµØ¯Ø§Ù‚ÙŠØ© Ø¨Ù„Ø§ Ø¶Ø¬ÙŠØ¬.',
  closingLine: 'Ø­Ø¶ÙˆØ± ÙˆØ§Ø¶Ø­. Ø´Ø¨ÙƒØ© Ù…ÙˆØ«ÙˆÙ‚Ø©.',
  columns: {
    product: 'Ø§Ù„Ù…Ù†ØªØ¬',
    trust: 'Ø§Ù„Ø«Ù‚Ø©',
    access: 'Ø§Ù„ÙˆØµÙˆÙ„',
  },
  links: {
    features: 'Ø§Ù„Ù…ÙŠØ²Ø§Øª',
    profiles: 'Ø§Ù„Ù…Ù„ÙØ§Øª',
    network: 'Ø§Ù„Ø´Ø¨ÙƒØ©',
    premium: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
    privacy: 'Ø§Ù„Ø®ØµÙˆØµÙŠØ©',
    security: 'Ø§Ù„Ø£Ù…Ø§Ù†',
    terms: 'Ø§Ù„Ø´Ø±ÙˆØ·',
    settings: 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',
    contact: 'Ø§ØªØµÙ„',
    support: 'Ø§Ù„Ø¯Ø¹Ù…',
    documentation: 'Ø§Ù„ØªÙˆØ«ÙŠÙ‚',
    enterprise: 'Ø§Ù„Ø´Ø±ÙƒØ§Øª',
  },
  copyright: '(c) 2026 Communium',
  rights: 'Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ‚ Ù…Ø­ÙÙˆØ¸Ø©.',
  navProduct: 'ØªÙ†Ù‚Ù„ Ø§Ù„Ù…Ù†ØªØ¬',
  navTrust: 'Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª ÙˆØ§Ù„Ø«Ù‚Ø©',
  navAccess: 'Ø§Ù„ØªÙˆØ§ØµÙ„ ÙˆØ§Ù„Ù…ÙˆØ§Ø±Ø¯',
};

const normalizedArCopy: PremiumFooterCopy = {
  slogan: 'Ø­Ø¶ÙˆØ± Ù…Ù‡Ù†ÙŠ Ø¨Ù…Ø¹Ø§ÙŠÙŠØ± Ø¹Ø§Ù„ÙŠØ©.',
  miniDescription: 'Ù‡ÙˆÙŠØ© ÙˆÙˆØ¶ÙˆØ­ ÙˆØ¥Ø´Ø§Ø±Ø§Øª Ø«Ù‚Ø© ÙÙŠ Ù…Ø³Ø§Ø­Ø© ÙˆØ§Ø­Ø¯Ø© Ù‡Ø§Ø¯Ø¦Ø©ØŒ Ù„Ù…Ù† ÙŠØ¨Ù†ÙŠ Ø§Ù„Ù…ØµØ¯Ø§Ù‚ÙŠØ© Ø¨Ù„Ø§ Ø¶Ø¬ÙŠØ¬.',
  closingLine: 'Ø­Ø¶ÙˆØ± ÙˆØ§Ø¶Ø­. Ø´Ø¨ÙƒØ© Ù…ÙˆØ«ÙˆÙ‚Ø©.',
  columns: {
    product: 'Ø§Ù„Ù…Ù†ØªØ¬',
    trust: 'Ø§Ù„Ø«Ù‚Ø©',
    access: 'Ø§Ù„ÙˆØµÙˆÙ„',
  },
  links: {
    features: 'Ø§Ù„Ù…ÙŠØ²Ø§Øª',
    profiles: 'Ø§Ù„Ù…Ù„ÙØ§Øª',
    network: 'Ø§Ù„Ø´Ø¨ÙƒØ©',
    premium: 'Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
    privacy: 'Ø§Ù„Ø®ØµÙˆØµÙŠØ©',
    security: 'Ø§Ù„Ø£Ù…Ø§Ù†',
    terms: 'Ø§Ù„Ø´Ø±ÙˆØ·',
    settings: 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',
    contact: 'Ø§ØªØµÙ„',
    support: 'Ø§Ù„Ø¯Ø¹Ù…',
    documentation: 'Ø§Ù„ØªÙˆØ«ÙŠÙ‚',
    enterprise: 'Ø§Ù„Ø´Ø±ÙƒØ§Øª',
  },
  copyright: '(c) 2026 Communium',
  rights: 'Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ‚ Ù…Ø­ÙÙˆØ¸Ø©.',
  navProduct: 'ØªÙ†Ù‚Ù„ Ø§Ù„Ù…Ù†ØªØ¬',
  navTrust: 'Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª ÙˆØ§Ù„Ø«Ù‚Ø©',
  navAccess: 'Ø§Ù„ØªÙˆØ§ØµÙ„ ÙˆØ§Ù„Ù…ÙˆØ§Ø±Ø¯',
};

const copyByLocale: Record<Locale, PremiumFooterCopy> = {
  en: enCopy,
  fr: frCopy,
  ar: normalizedArCopy,
  es: enCopy,
  de: enCopy,
  zh: enCopy,
  ja: enCopy,
  pt: enCopy,
  ru: enCopy,
};

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="pf-link">
      <span>{children}</span>
    </Link>
  );
}

export default function SiteFooter({ locale, variant = 'public' }: SiteFooterProps) {
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const copy = copyByLocale[safeLocale];
  const routes = buildPublicRoutes(safeLocale);
  const isRtl = rtlLocales.includes(safeLocale);
  const settingsHref = localizeHref(safeLocale, '/settings');

  const productColumn = [
    { href: routes.features, label: copy.links.features },
    { href: routes.discover, label: copy.links.profiles },
    { href: routes.messages, label: copy.links.network },
    { href: routes.premium, label: copy.links.premium },
  ];

  const trustColumn = [
    { href: routes.privacy, label: copy.links.privacy },
    { href: routes.security, label: copy.links.security },
    { href: routes.terms, label: copy.links.terms },
    { href: settingsHref, label: copy.links.settings },
  ];

  const accessColumn = [
    { href: routes.contactApi, label: copy.links.api ?? 'API' },
    { href: routes.contact, label: copy.links.contact },
    { href: routes.contactSupport, label: copy.links.support },
    { href: routes.documentation, label: copy.links.documentation },
    { href: routes.contactEnterprise, label: copy.links.enterprise },
  ];

  return (
    <footer className="siteFooter premium-footer" dir={isRtl ? 'rtl' : 'ltr'} data-footer-variant={variant}>
      <div className="premium-footer-ambient" aria-hidden />
      <div className="premium-footer-grid" aria-hidden />

      <div className="premium-footer-shell">
        <div className="premium-footer-main">
          <div className="premium-footer-brand">
            <div className="premium-footer-logo-wrap" aria-hidden>
              <img src="/communium_logo.svg" alt="" width={40} height={40} decoding="async" />
            </div>
            <p className="premium-footer-brand-name">Communium</p>
            <p className="premium-footer-slogan">{copy.slogan}</p>
            <p className="premium-footer-desc">{copy.miniDescription}</p>
          </div>

          <nav className="premium-footer-col" aria-label={copy.navProduct}>
            <p className="premium-footer-col-title">{copy.columns.product}</p>
            <ul>
              {productColumn.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="premium-footer-col" aria-label={copy.navTrust}>
            <p className="premium-footer-col-title">{copy.columns.trust}</p>
            <ul>
              {trustColumn.map((item) => (
                <li key={item.href + item.label}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="premium-footer-col" aria-label={copy.navAccess}>
            <p className="premium-footer-col-title">{copy.columns.access}</p>
            <ul>
              {accessColumn.map((item, index) => (
                <li key={`${item.href}-${item.label}-${index}`}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="premium-footer-rule" aria-hidden />

        <div className="premium-footer-bottom">
          <p className="premium-footer-tagline">{copy.closingLine}</p>
          <div className="premium-footer-meta">
            <span>{copy.copyright}</span>
            <span className="premium-footer-dot" aria-hidden />
            <span>{copy.rights}</span>
          </div>
        </div>
      </div>

      <FooterStyles />
    </footer>
  );
}

function FooterStyles() {
  return (
    <style>{`
      .premium-footer {
        --pf-void: #eef4fb;
        --pf-deep: #f8fbff;
        --pf-surface: rgba(255, 255, 255, 0.92);
        --pf-glass: linear-gradient(155deg, rgba(255, 255, 255, 0.96), rgba(241, 247, 255, 0.92));
        --pf-line: rgba(203, 213, 225, 0.92);
        --pf-line-strong: rgba(96, 165, 250, 0.22);
        --pf-ink: #0f172a;
        --pf-muted: #475569;
        --pf-faint: #64748b;
        --pf-glow: rgba(56, 189, 248, 0.1);
        --pf-glow-deep: rgba(59, 130, 246, 0.1);
        position: relative;
        width: 100%;
        max-width: 100%;
        margin-top: clamp(2rem, 4vw, 3rem);
        color: var(--pf-ink);
        isolation: isolate;
        overflow-x: clip;
      }

      .premium-footer-ambient {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(ellipse 90% 55% at 50% -10%, var(--pf-glow-deep), transparent 55%),
          radial-gradient(ellipse 70% 50% at 100% 80%, var(--pf-glow), transparent 50%),
          radial-gradient(ellipse 60% 45% at 0% 60%, rgba(14, 165, 233, 0.06), transparent 48%),
          linear-gradient(180deg, #f8fbff 0%, var(--pf-void) 42%, #edf4ff 100%);
      }

      .premium-footer-grid {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        opacity: 0.35;
        background-image:
          linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: linear-gradient(180deg, black 0%, transparent 88%);
      }

      .premium-footer-shell {
        position: relative;
        z-index: 1;
        width: min(100%, calc(100% - 24px));
        max-width: none;
        margin: 0 auto;
        box-sizing: border-box;
        padding: clamp(1.75rem, 3vw, 2.35rem) clamp(1.4rem, 3vw, 2.4rem) clamp(1.35rem, 2.4vw, 1.65rem);
        border-radius: clamp(18px, 2vw, 24px);
        border: 1px solid var(--pf-line);
        background: var(--pf-glass);
        backdrop-filter: blur(20px) saturate(1.35);
        -webkit-backdrop-filter: blur(20px) saturate(1.35);
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.72) inset,
          0 1px 0 rgba(255, 255, 255, 0.9) inset,
          0 20px 56px rgba(15, 23, 42, 0.08);
      }

      .premium-footer-main {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) repeat(3, minmax(0, 1fr));
        gap: clamp(1.5rem, 3vw, 2.5rem);
        align-items: start;
      }

      .premium-footer-brand {
        display: grid;
        gap: 0.65rem;
        min-width: 0;
      }

      .premium-footer-logo-wrap {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.94));
        border: 1px solid rgba(96, 165, 250, 0.18);
        box-shadow:
          0 12px 26px rgba(59, 130, 246, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      .premium-footer-logo-wrap img {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }

      .premium-footer-brand-name {
        margin: 0;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #64748b;
      }

      .premium-footer-slogan {
        margin: 0;
        font-size: clamp(1.02rem, 1.1vw + 0.85rem, 1.2rem);
        font-weight: 700;
        letter-spacing: -0.035em;
        line-height: 1.25;
        color: #0f172a;
      }

      .premium-footer-desc {
        margin: 0;
        font-size: 0.88rem;
        line-height: 1.58;
        color: var(--pf-muted);
        max-width: 34ch;
      }

      .premium-footer-col-title {
        margin: 0 0 0.75rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--pf-faint);
      }

      .premium-footer-col ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.35rem;
      }

      .pf-link {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.28rem 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #1e293b;
        text-decoration: none;
        border-radius: 8px;
        transition: color 0.16s ease, opacity 0.16s ease;
      }

      .pf-link:hover {
        color: #2563eb;
      }

      .premium-footer-rule {
        height: 1px;
        margin: clamp(1.25rem, 2vw, 1.65rem) 0 clamp(1rem, 1.6vw, 1.25rem);
        background: linear-gradient(
          90deg,
          transparent,
          var(--pf-line-strong) 18%,
          rgba(56, 189, 248, 0.25) 50%,
          var(--pf-line-strong) 82%,
          transparent
        );
        opacity: 0.85;
      }

      .premium-footer-bottom {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem 1.25rem;
      }

      .premium-footer-tagline {
        margin: 0;
        font-size: clamp(0.95rem, 0.5vw + 0.88rem, 1.05rem);
        font-weight: 600;
        letter-spacing: -0.02em;
        color: #0f172a;
        max-width: min(36ch, 100%);
      }

      .premium-footer-meta {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.78rem;
        font-weight: 500;
        color: var(--pf-faint);
      }

      .premium-footer-dot {
        width: 3px;
        height: 3px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.55);
      }

      @media (max-width: 960px) {
        .premium-footer-main {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .premium-footer-brand {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 560px) {
        .premium-footer-main {
          grid-template-columns: 1fr;
        }

        .premium-footer-bottom {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `}</style>
  );
}
