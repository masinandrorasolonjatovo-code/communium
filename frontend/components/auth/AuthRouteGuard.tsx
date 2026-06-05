'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { localizeHref } from '@/components/locale-path';
import type { Locale } from '@/i18n.config';
import { resolveAuthenticatedDestination } from './resolve-authenticated-destination';

interface AuthRouteGuardProps {
  locale: Locale;
  children: ReactNode;
}

export default function AuthRouteGuard({ locale, children }: AuthRouteGuardProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const fallbackDestination = localizeHref(locale, '/dashboard');

  useEffect(() => {
    if (!isLoaded || !user) {
      setRedirecting(false);
      return;
    }

    let cancelled = false;
    let completed = false;

    setRedirecting(true);

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !completed && pathname !== fallbackDestination) {
        window.location.replace(fallbackDestination);
      }
    }, 950);

    void resolveAuthenticatedDestination({
      locale,
      getToken,
      timeoutMs: 650,
    })
      .then((destination) => {
        completed = true;
        if (cancelled || !destination || pathname === destination) {
          return;
        }

        window.location.replace(destination);
      })
      .catch(() => {
        completed = true;
        if (!cancelled) {
          window.location.replace(fallbackDestination);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [fallbackDestination, getToken, isLoaded, locale, pathname, user]);

  if (isLoaded && user) {
    return (
      <div className="authRedirectState">
        <p className="authRedirectEyebrow">Communium</p>
        <h1>{locale === 'fr' ? 'Redirection en cours...' : 'Redirecting...'}</h1>
        <p>
          {locale === 'fr'
            ? 'Retour vers votre espace professionnel.'
            : 'Returning to your professional space.'}
        </p>

        {redirecting ? <span className="authRedirectPulse" aria-hidden="true" /> : null}

        <style>{`
          .authRedirectState {
            width: min(100%, 520px);
            display: grid;
            gap: 10px;
            text-align: center;
            padding: 18px 6px;
            justify-items: center;
          }

          .authRedirectEyebrow {
            margin: 0;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #1d4ed8;
          }

          .authRedirectState h1 {
            margin: 0;
            font-size: clamp(1.7rem, 4vw, 2.2rem);
            line-height: 1;
            letter-spacing: -0.04em;
            color: #0f172a;
          }

          .authRedirectState p:last-child {
            margin: 0;
            color: #64748b;
            line-height: 1.6;
          }

          .authRedirectPulse {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            border: 3px solid rgba(37, 99, 235, 0.16);
            border-top-color: rgba(37, 99, 235, 0.78);
            animation: authRedirectSpin 900ms linear infinite;
          }

          @keyframes authRedirectSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
