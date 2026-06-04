'use client';

import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';

type LegalMode = 'privacy' | 'terms';

interface LegalDocumentPageProps {
  locale: Locale;
  mode: LegalMode;
}

interface LegalSection {
  title: string;
  text: string;
  bullets?: string[];
}

function tr(locale: Locale, fr: string, en: string, ar: string) {
  if (locale === 'fr') {
    return fr;
  }

  if (locale === 'ar') {
    return ar;
  }

  return en;
}

export default function LegalDocumentPage({ locale, mode }: LegalDocumentPageProps) {
  const isPrivacy = mode === 'privacy';
  const title = isPrivacy
    ? tr(
        locale,
        'Politique de confidentialite',
        'Privacy policy',
        'Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©',
      )
    : tr(
        locale,
        'Conditions d utilisation',
        'Terms of use',
        'Ø´Ø±ÙˆØ· Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…',
      );
  const eyebrow = isPrivacy
    ? tr(locale, 'Legal', 'Legal', 'Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†')
    : tr(locale, 'Conditions', 'Terms', 'Ø§Ù„Ø´Ø±ÙˆØ·');
  const intro = isPrivacy
    ? tr(
        locale,
        'Communium encadre la collecte, la visibilite et l acces aux donnees avec des regles compatibles avec un produit professionnel moderne et les attentes CNDP.',
        'Communium governs collection, visibility and access to data with rules designed for a modern professional product and CNDP-aligned expectations.',
        'ÙŠÙ†Ø¸Ù… Communium Ø¬Ù…Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ¸Ù‡ÙˆØ±Ù‡Ø§ ÙˆØ§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„ÙŠÙ‡Ø§ ÙˆÙÙ‚ Ù‚ÙˆØ§Ø¹Ø¯ Ù…Ù„Ø§Ø¦Ù…Ø© Ù„Ù…Ù†ØªØ¬ Ù…Ù‡Ù†ÙŠ Ø­Ø¯ÙŠØ« ÙˆÙ…ØªØ·Ù„Ø¨Ø§Øª Ù‚Ø±ÙŠØ¨Ø© Ù…Ù† Ù…Ø¹Ø§ÙŠÙŠØ± CNDP.',
      )
    : tr(
        locale,
        'Ces conditions cadrent l utilisation de la plateforme, des espaces membre, des modules premium et des outils de verification.',
        'These terms govern the use of the platform, member areas, premium modules and verification tools.',
        'ØªÙ†Ø¸Ù… Ù‡Ø°Ù‡ Ø§Ù„Ø´Ø±ÙˆØ· Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ù†ØµØ© ÙˆÙ…Ø³Ø§Ø­Ø§Øª Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ ÙˆÙˆØ­Ø¯Ø§Øª Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ… ÙˆØ£Ø¯ÙˆØ§Øª Ø§Ù„ØªØ­Ù‚Ù‚.',
      );

  const sections: LegalSection[] = isPrivacy
    ? [
        {
          title: tr(locale, 'Donnees collectees', 'Collected data', 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹Ø©'),
          text: tr(
            locale,
            'Le service traite les donnees de compte, les informations de profil, les documents de verification, les evenements de securite et les donnees de facturation necessaires au fonctionnement du produit.',
            'The service processes account data, profile information, verification documents, security events and billing data required to operate the product.',
            'ØªØ¹Ø§Ù„Ø¬ Ø§Ù„Ø®Ø¯Ù…Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆÙ…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…Ù„Ù ÙˆÙˆØ«Ø§Ø¦Ù‚ Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ£Ø­Ø¯Ø§Ø« Ø§Ù„Ø£Ù…Ø§Ù† ÙˆØ¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ù„Ø§Ø²Ù…Ø© Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬.',
          ),
          bullets: [
            tr(locale, 'Compte, profil et identite professionnelle', 'Account, profile and professional identity', 'Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ§Ù„Ù…Ù„Ù ÙˆØ§Ù„Ù‡ÙˆÙŠØ© Ø§Ù„Ù…Ù‡Ù†ÙŠØ©'),
            tr(locale, 'Pieces KYC / KYB et journaux de controle', 'KYC / KYB documents and control logs', 'Ù…Ø³ØªÙ†Ø¯Ø§Øª KYC / KYB ÙˆØ³Ø¬Ù„Ø§Øª Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø©'),
            tr(locale, 'Consentements, paiements et traces de securite', 'Consents, payments and security traces', 'Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ¢Ø«Ø§Ø± Ø§Ù„Ø£Ù…Ø§Ù†'),
          ],
        },
        {
          title: tr(locale, 'Droits de la personne concernee', 'Data subject rights', 'Ø­Ù‚ÙˆÙ‚ ØµØ§Ø­Ø¨ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª'),
          text: tr(
            locale,
            'Chaque membre peut demander l acces, la rectification, l export et la suppression de ses donnees depuis les pages de parametrage dediees.',
            'Each member can request access, rectification, export and deletion of their data from the dedicated settings surfaces.',
            'ÙŠÙ…ÙƒÙ† Ù„ÙƒÙ„ Ø¹Ø¶Ùˆ Ø·Ù„Ø¨ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§ØªÙ‡ Ø£Ùˆ ØªØµØ­ÙŠØ­Ù‡Ø§ Ø£Ùˆ ØªØµØ¯ÙŠØ±Ù‡Ø§ Ø£Ùˆ Ø­Ø°ÙÙ‡Ø§ Ù…Ù† Ø®Ù„Ø§Ù„ ØµÙØ­Ø§Øª Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø®ØµØµØ©.',
          ),
          bullets: [
            tr(locale, 'Export JSON des donnees conservees', 'JSON export of retained data', 'ØªØµØ¯ÙŠØ± JSON Ù„Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­ØªÙØ¸ Ø¨Ù‡Ø§'),
            tr(locale, 'Demande de suppression de compte', 'Account deletion request', 'Ø·Ù„Ø¨ Ø­Ø°Ù Ø§Ù„Ø­Ø³Ø§Ø¨'),
            tr(locale, 'Historique des consentements et acces sensibles', 'Consent history and sensitive access logs', 'Ø³Ø¬Ù„ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª ÙˆØ§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©'),
          ],
        },
        {
          title: tr(locale, 'Conservation et protection', 'Retention and protection', 'Ø§Ù„Ø§Ø­ØªÙØ§Ø¸ ÙˆØ§Ù„Ø­Ù…Ø§ÙŠØ©'),
          text: tr(
            locale,
            'Les donnees sensibles restent filtrees sur les API publiques et les champs critiques peuvent etre chiffres au repos. Les durees de conservation sont journalisees dans les politiques internes.',
            'Sensitive data remains filtered from public APIs and critical fields can be encrypted at rest. Retention windows are tracked in internal policies.',
            'ØªØ¸Ù„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ù…Ø³ØªØ¨Ø¹Ø¯Ø© Ù…Ù† Ø§Ù„ÙˆØ§Ø¬Ù‡Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆÙŠÙ…ÙƒÙ† ØªØ´ÙÙŠØ± Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ø­Ø±Ø¬Ø© Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªØ®Ø²ÙŠÙ†. ÙƒÙ…Ø§ ÙŠØªÙ… ØªØªØ¨Ø¹ Ù…Ø¯Ø¯ Ø§Ù„Ø§Ø­ØªÙØ§Ø¸ ÙÙŠ Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©.',
          ),
        },
      ]
    : [
        {
          title: tr(locale, 'Usage de la plateforme', 'Use of the platform', 'Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ù†ØµØ©'),
          text: tr(
            locale,
            'Communium met a disposition des espaces publics, membres, premium et administratifs. Chaque membre s engage a fournir des informations exactes et a respecter les regles de diffusion du reseau.',
            'Communium provides public, member, premium and administrative surfaces. Every member agrees to provide accurate information and follow the network distribution rules.',
            'ÙŠÙˆÙØ± Communium Ù…Ø³Ø§Ø­Ø§Øª Ø¹Ø§Ù…Ø© ÙˆØ¹Ø¶ÙˆÙŠØ© ÙˆØ¨Ø±ÙŠÙ…ÙŠÙˆÙ… ÙˆØ¥Ø¯Ø§Ø±ÙŠØ©. ÙˆÙŠÙ„ØªØ²Ù… ÙƒÙ„ Ø¹Ø¶Ùˆ Ø¨ØªÙ‚Ø¯ÙŠÙ… Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø¯Ù‚ÙŠÙ‚Ø© ÙˆØ§Ø­ØªØ±Ø§Ù… Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ù†Ø´Ø± Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©.',
          ),
        },
        {
          title: tr(locale, 'Verification et facturation', 'Verification and billing', 'Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„ÙÙˆØªØ±Ø©'),
          text: tr(
            locale,
            'Les modules premium, les paiements et la verification d identite ou d entreprise peuvent exiger des donnees supplementaires, des journaux de securite et des justificatifs documentaires.',
            'Premium modules, payments and identity or business verification may require additional data, security logs and documentary proof.',
            'Ù‚Ø¯ ØªØªØ·Ù„Ø¨ ÙˆØ­Ø¯Ø§Øª Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ… ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù‡ÙˆÙŠØ© Ø£Ùˆ Ø§Ù„Ø´Ø±ÙƒØ© Ø¨ÙŠØ§Ù†Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ© ÙˆØ³Ø¬Ù„Ø§Øª Ø£Ù…Ù†ÙŠØ© ÙˆÙˆØ«Ø§Ø¦Ù‚ Ø¥Ø«Ø¨Ø§Øª.',
          ),
        },
        {
          title: tr(locale, 'Comportements interdits', 'Prohibited behaviour', 'Ø§Ù„Ø³Ù„ÙˆÙƒÙŠØ§Øª Ø§Ù„Ù…Ø­Ø¸ÙˆØ±Ø©'),
          text: tr(
            locale,
            'La fraude, l usurpation, les contenus illicites, l acces non autorise aux donnees et les tentatives de contournement des protections techniques peuvent entrainer suspension, suppression ou signalement.',
            'Fraud, impersonation, illicit content, unauthorized data access and attempts to bypass technical safeguards may lead to suspension, deletion or reporting.',
            'Ù‚Ø¯ ØªØ¤Ø¯ÙŠ Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø§Ø­ØªÙŠØ§Ù„ Ø£Ùˆ Ø§Ù†ØªØ­Ø§Ù„ Ø§Ù„Ù‡ÙˆÙŠØ© Ø£Ùˆ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ ØºÙŠØ± Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø£Ùˆ Ø§Ù„ÙˆØµÙˆÙ„ ØºÙŠØ± Ø§Ù„Ù…ØµØ±Ø­ Ø¨Ù‡ Ø¥Ù„Ù‰ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø£Ùˆ Ù…Ø­Ø§ÙˆÙ„Ø§Øª ØªØ¬Ø§ÙˆØ² Ø§Ù„Ø­Ù…Ø§ÙŠØ§Øª Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ø¥Ù„Ù‰ Ø§Ù„ØªØ¹Ù„ÙŠÙ‚ Ø£Ùˆ Ø§Ù„Ø­Ø°Ù Ø£Ùˆ Ø§Ù„ØªØ¨Ù„ÙŠØº.',
          ),
        },
      ];

  const settingsHref = localizeHref(locale, '/settings/privacy');
  const rightsHref = localizeHref(locale, '/settings/data-rights');
  const securityHref = localizeHref(locale, '/settings/security');

  return (
    <>
      <main className="legalPage">
        <section className="legalHero">
          <span className="legalEyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <div className="legalActions">
            <Link href={settingsHref} className="legalPrimary">
              {tr(locale, 'Gerer la confidentialite', 'Manage privacy', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©')}
            </Link>
            <Link href={rightsHref} className="legalSecondary">
              {tr(locale, 'Voir mes droits', 'View my rights', 'Ø¹Ø±Ø¶ Ø­Ù‚ÙˆÙ‚ÙŠ')}
            </Link>
            <Link href={securityHref} className="legalSecondary">
              {tr(locale, 'Parametres securite', 'Security settings', 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø£Ù…Ø§Ù†')}
            </Link>
          </div>
        </section>

        <section className="legalGrid">
          {sections.map((section) => (
            <article key={section.title} className="legalCard">
              <h2>{section.title}</h2>
              <p>{section.text}</p>
              {section.bullets?.length ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      </main>

      <SiteFooter locale={locale} variant="public" />

      <style jsx>{`
        .legalPage {
          width: min(1200px, calc(100vw - 32px));
          margin: 0 auto;
          padding: 48px 0 72px;
          display: grid;
          gap: 24px;
        }

        .legalHero,
        .legalCard {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.06);
        }

        .legalHero {
          padding: 36px;
          display: grid;
          gap: 16px;
        }

        .legalEyebrow {
          display: inline-flex;
          width: fit-content;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(219, 234, 254, 0.8);
          color: #1d4ed8;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .legalHero h1 {
          margin: 0;
          font-size: clamp(2.1rem, 4vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.06em;
          color: #0f172a;
        }

        .legalHero p,
        .legalCard p,
        .legalCard li {
          margin: 0;
          color: #475569;
          line-height: 1.72;
        }

        .legalActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .legalPrimary,
        .legalSecondary {
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border-radius: 16px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }

        .legalPrimary {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          box-shadow: 0 16px 36px rgba(37, 99, 235, 0.22);
        }

        .legalSecondary {
          border: 1px solid rgba(203, 213, 225, 0.9);
          background: rgba(255, 255, 255, 0.86);
          color: #0f172a;
        }

        .legalPrimary:hover,
        .legalSecondary:hover {
          transform: translateY(-1px);
        }

        .legalGrid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .legalCard {
          padding: 28px;
          display: grid;
          gap: 14px;
        }

        .legalCard h2 {
          margin: 0;
          font-size: 1.2rem;
          line-height: 1.2;
          color: #0f172a;
        }

        .legalCard ul {
          margin: 0;
          padding-left: 18px;
          display: grid;
          gap: 8px;
        }

        @media (max-width: 960px) {
          .legalGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .legalPage {
            width: min(100vw - 20px, 1200px);
            padding: 28px 0 56px;
          }

          .legalHero,
          .legalCard {
            border-radius: 24px;
          }

          .legalHero {
            padding: 24px;
          }

          .legalCard {
            padding: 22px;
          }
        }

        html[data-theme='dark'] .legalHero,
        html[data-theme='dark'] .legalCard {
          background: linear-gradient(180deg, rgba(12, 18, 32, 0.98), rgba(15, 23, 42, 0.95));
          border-color: rgba(71, 85, 105, 0.36);
          box-shadow: 0 22px 60px rgba(2, 6, 23, 0.44);
        }

        html[data-theme='dark'] .legalHero h1,
        html[data-theme='dark'] .legalCard h2,
        html[data-theme='dark'] .legalSecondary {
          color: #e2e8f0;
        }

        html[data-theme='dark'] .legalHero p,
        html[data-theme='dark'] .legalCard p,
        html[data-theme='dark'] .legalCard li {
          color: rgba(226, 232, 240, 0.72);
        }

        html[data-theme='dark'] .legalSecondary {
          background: rgba(15, 23, 42, 0.84);
          border-color: rgba(71, 85, 105, 0.45);
        }
      `}</style>
    </>
  );
}
