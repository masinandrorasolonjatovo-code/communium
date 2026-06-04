'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ExternalLink, Landmark, MapPin, RefreshCcw } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';

interface PartnerRecord {
  id: string;
  name: string;
  type: string;
  city: string;
  website?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  active: boolean;
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

export default function PartnersWorkspace({ locale }: { locale: Locale }) {
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPartners() {
      setLoading(true);
      setMessage('');

      try {
        const response = await fetch('/api/partners', { cache: 'no-store' });
        const body = await response.json().catch(() => ({}));

        if (!response.ok || body?.success === false) {
          throw new Error(body?.error || 'Unable to load partners.');
        }

        if (!cancelled) {
          setPartners(Array.isArray(body?.data) ? body.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Unable to load partners.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPartners();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <main className="partnersPage" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <section className="partnersHero">
          <div>
            <span className="eyebrow">{tr(locale, 'Partenaires', 'Partners', 'الشركاء')}</span>
            <h1>
              {tr(
                locale,
                'Un reseau local utile, visible et credible.',
                'A local network designed to stay useful, visible and credible.',
                'شبكة محلية مصممة لتبقى مفيدة ومرئية وموثوقة.',
              )}
            </h1>
            <p>
              {tr(
                locale,
                'Universites, ecoles, incubateurs et acteurs business relies a Communium dans une surface publique sobre.',
                'Universities, schools, incubators and business actors connected to Communium in one calm public surface.',
                'جامعات ومدارس وحاضنات وفاعلون اقتصاديون مرتبطون بـ Communium داخل مساحة عامة هادئة.',
              )}
            </p>
          </div>

          <div className="heroActions">
            <Link href={localizeHref(locale, '/discover')} className="ghostButton">
              {tr(locale, 'Voir les profils', 'Browse profiles', 'عرض الملفات')}
            </Link>
            <button
              type="button"
              className="primaryButton"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw size={16} />
              {tr(locale, 'Actualiser', 'Refresh', 'تحديث')}
            </button>
          </div>
        </section>

        {message ? <div className="message danger">{message}</div> : null}

        <section className="partnersGrid">
          {loading ? (
            <article className="partnerCard emptyCard">
              <strong>{tr(locale, 'Chargement des partenaires...', 'Loading partners...', 'جارٍ تحميل الشركاء...')}</strong>
            </article>
          ) : null}

          {!loading && !partners.length ? (
            <article className="partnerCard emptyCard">
              <strong>{tr(locale, 'Aucun partenaire public pour le moment', 'No public partners yet', 'لا يوجد شركاء عامون حالياً')}</strong>
              <p>
                {tr(
                  locale,
                  'Les integrations locales apparaitront ici au fur et a mesure de leur activation.',
                  'Local integrations will appear here as they are activated.',
                  'ستظهر الشراكات المحلية هنا مع تفعيلها.',
                )}
              </p>
            </article>
          ) : null}

          {partners.map((partner) => (
            <article key={partner.id} className="partnerCard">
              <div className="partnerTop">
                <span className="iconWrap">
                  <Building2 size={18} />
                </span>
                <span className="partnerType">{partner.type}</span>
              </div>

              <div className="partnerCopy">
                <h2>{partner.name}</h2>
                <div className="metaRow">
                  <span>
                    <MapPin size={14} />
                    {partner.city}
                  </span>
                  {partner.website ? (
                    <a href={partner.website} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                      {tr(locale, 'Site', 'Website', 'الموقع')}
                    </a>
                  ) : null}
                </div>
                <p>{partner.description || tr(locale, 'Partenaire actif du reseau Communium.', 'Active partner inside the Communium network.', 'شريك نشط داخل شبكة Communium.')}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="partnersFooterCard">
          <div>
            <span className="eyebrow">{tr(locale, 'Raccordements', 'Integrations', 'الربط')}</span>
            <h2>{tr(locale, 'Des liens locaux, sans bruit inutile.', 'Local connections, without unnecessary noise.', 'روابط محلية من دون ضجيج غير ضروري.')}</h2>
            <p>
              {tr(
                locale,
                'Les partenariats soutiennent les profils, la verification et la diffusion business sans surcharger l espace public.',
                'Partnerships support profiles, verification and business visibility without overloading the public experience.',
                'تدعم الشراكات الملفات والتحقق والظهور التجاري من دون إثقال التجربة العامة.',
              )}
            </p>
          </div>

          <div className="footerActions">
            <Link href={localizeHref(locale, '/premium')} className="ghostButton">
              <Landmark size={16} />
              {tr(locale, 'Voir Premium', 'View Premium', 'عرض بريميوم')}
            </Link>
            <Link href={localizeHref(locale, '/contact')} className="primaryButton">
              {tr(locale, 'Contacter Communium', 'Contact Communium', 'الاتصال بـ Communium')}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} variant="public" />

      <style jsx>{`
        .partnersPage {
          width: min(1220px, calc(100vw - 32px));
          margin: 0 auto;
          padding: 44px 0 72px;
          display: grid;
          gap: 20px;
        }

        .partnersHero,
        .partnerCard,
        .partnersFooterCard,
        .message {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.06);
        }

        .partnersHero,
        .partnersFooterCard {
          padding: 34px;
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
        }

        .eyebrow {
          display: inline-flex;
          width: fit-content;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(219, 234, 254, 0.84);
          color: #1d4ed8;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .partnersHero h1,
        .partnersFooterCard h2 {
          margin: 0;
          color: #0f172a;
          letter-spacing: -0.05em;
          line-height: 0.98;
        }

        .partnersHero h1 {
          font-size: clamp(2.1rem, 4vw, 4rem);
        }

        .partnersHero p,
        .partnersFooterCard p,
        .partnerCard p {
          margin: 0;
          color: #475569;
          line-height: 1.7;
        }

        .heroActions,
        .footerActions,
        .metaRow {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .partnersGrid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .partnerCard {
          padding: 24px;
          display: grid;
          gap: 14px;
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }

        .partnerCard:hover {
          transform: translateY(-2px);
          border-color: rgba(37, 99, 235, 0.22);
          box-shadow: 0 28px 68px rgba(15, 23, 42, 0.08);
        }

        .partnerTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .iconWrap {
          width: 48px;
          height: 48px;
          display: inline-grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(219, 234, 254, 0.88);
          color: #1d4ed8;
        }

        .partnerType {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(241, 245, 249, 0.96);
          color: #475569;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .partnerCopy {
          display: grid;
          gap: 10px;
        }

        .partnerCopy h2 {
          margin: 0;
          font-size: 1.16rem;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        .metaRow span,
        .metaRow a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 0.92rem;
          text-decoration: none;
        }

        .primaryButton,
        .ghostButton {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid rgba(37, 99, 235, 0.18);
          text-decoration: none;
          font-weight: 700;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .primaryButton {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          box-shadow: 0 16px 36px rgba(37, 99, 235, 0.22);
        }

        .ghostButton {
          background: rgba(255, 255, 255, 0.92);
          color: #0f172a;
        }

        .primaryButton:hover,
        .ghostButton:hover {
          transform: translateY(-1px);
        }

        .message {
          padding: 16px 18px;
          color: #991b1b;
          background: rgba(254, 242, 242, 0.96);
          border-color: rgba(239, 68, 68, 0.18);
        }

        .emptyCard {
          grid-column: 1 / -1;
        }

        @media (max-width: 980px) {
          .partnersGrid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 760px) {
          .partnersPage {
            width: min(100vw - 20px, 1220px);
            padding: 28px 0 56px;
          }

          .partnersHero,
          .partnersFooterCard {
            grid-template-columns: 1fr;
            padding: 24px;
            border-radius: 24px;
          }

          .partnerCard {
            border-radius: 24px;
          }

          .partnersGrid {
            grid-template-columns: 1fr;
          }

          .heroActions,
          .footerActions {
            display: grid;
          }
        }

        html[data-theme='dark'] .partnersHero,
        html[data-theme='dark'] .partnerCard,
        html[data-theme='dark'] .partnersFooterCard {
          background: linear-gradient(180deg, rgba(12, 18, 32, 0.98), rgba(15, 23, 42, 0.95));
          border-color: rgba(71, 85, 105, 0.36);
          box-shadow: 0 22px 60px rgba(2, 6, 23, 0.44);
        }

        html[data-theme='dark'] .partnersHero h1,
        html[data-theme='dark'] .partnersFooterCard h2,
        html[data-theme='dark'] .partnerCopy h2,
        html[data-theme='dark'] .ghostButton {
          color: #e2e8f0;
        }

        html[data-theme='dark'] .partnersHero p,
        html[data-theme='dark'] .partnersFooterCard p,
        html[data-theme='dark'] .partnerCard p,
        html[data-theme='dark'] .metaRow span,
        html[data-theme='dark'] .metaRow a {
          color: rgba(226, 232, 240, 0.72);
        }

        html[data-theme='dark'] .ghostButton {
          background: rgba(15, 23, 42, 0.84);
          border-color: rgba(71, 85, 105, 0.45);
        }

        html[data-theme='dark'] .partnerType {
          background: rgba(30, 41, 59, 0.92);
          color: rgba(226, 232, 240, 0.88);
        }
      `}</style>
    </>
  );
}
