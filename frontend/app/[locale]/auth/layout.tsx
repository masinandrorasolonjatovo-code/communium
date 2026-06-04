import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AuthRouteGuard from '@/components/auth/AuthRouteGuard';
import SiteFooter from '@/components/SiteFooter';
import PublicExperienceFrame from '@/components/public/PublicExperienceFrame';
import { defaultLocale, isLocale } from '@/i18n.config';

export const metadata: Metadata = {
  title: 'Communium - Authentication',
};

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  return (
    <PublicExperienceFrame>
      <main className="authPage">
        <div className="pageGlow glowOne" />
        <div className="pageGlow glowTwo" />

        <div className="authShell">
          <section className="authCard">
            <AuthRouteGuard locale={safeLocale}>{children}</AuthRouteGuard>
          </section>
          <SiteFooter locale={safeLocale} variant="public" />
        </div>

        <style>{`
          .authPage {
            position: relative;
            min-height: 100vh;
            overflow: hidden;
            color: #0f172a;
            background: transparent;
            font-family: Manrope, 'Segoe UI', ui-sans-serif, system-ui, sans-serif;
          }

        .pageGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(96px);
          opacity: 0.68;
          pointer-events: none;
        }

        .glowOne {
          top: -120px;
          left: -100px;
          width: 340px;
          height: 340px;
          background: rgba(29, 78, 216, 0.18);
        }

        .glowTwo {
          right: -80px;
          top: 240px;
          width: 280px;
          height: 280px;
          background: rgba(14, 165, 233, 0.14);
        }

        .authShell {
          position: relative;
          z-index: 1;
          width: 100%;
          display: grid;
          gap: 18px;
          padding: 18px 12px 24px;
        }

        .authCard {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.92);
          border-radius: 30px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(18px);
          padding: 24px;
          display: flex;
          justify-content: center;
        }

        @media (max-width: 760px) {
          .authShell {
            padding: 14px;
          }

          .authCard {
            border-radius: 24px;
            padding: 18px;
          }
        }
        `}</style>
      </main>
    </PublicExperienceFrame>
  );
}
