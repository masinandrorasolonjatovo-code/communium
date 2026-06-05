'use client';

import Link from 'next/link';
import { useClerk, useSignUp } from '@clerk/nextjs';
import { Building2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import PageHero from '@/components/PageHero';
import { localizeHref } from '@/components/locale-path';
import {
  buildAuthQueryString,
  buildSignInHref,
  buildSignUpFormHref,
  type AccountType,
  type AuthFlowQuery,
} from '@/lib/auth-flow';
import { formatClerkError, startOAuthSignUp, toAbsoluteBrowserUrl } from './auth-helpers';

interface AccountTypeSelectionProps {
  locale: string;
  initialAccountType?: AccountType;
  redirectHref: string;
  query: AuthFlowQuery;
}

type OAuthRedirectStrategy = 'oauth_google' | 'oauth_github' | 'oauth_apple';

export default function AccountTypeSelection({
  locale,
  initialAccountType = 'personal',
  redirectHref,
  query,
}: AccountTypeSelectionProps) {
  const clerk = useClerk();
  const { signUp } = useSignUp();
  const [selectedType, setSelectedType] = useState<AccountType>(initialAccountType);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingProvider, setPendingProvider] = useState<'google' | 'github' | 'apple' | null>(null);
  const resetPendingTimerRef = useRef<number | null>(null);
  const isFrench = locale === 'fr';
  const isSpanish = locale === 'es';
  const tr = (fr: string, en: string, es: string) => (isFrench ? fr : isSpanish ? es : en);

  const nextQuery = useMemo<AuthFlowQuery>(
    () => ({
      ...query,
      accountType: selectedType,
    }),
    [query, selectedType]
  );

  const formHref = buildSignUpFormHref(locale, nextQuery);
  const signInHref = buildSignInHref(locale, query);
  const callbackPath = `${localizeHref(locale, '/auth/sign-up/sso-callback')}${buildAuthQueryString(nextQuery)}`;

  useEffect(() => {
    return () => {
      if (resetPendingTimerRef.current !== null) {
        window.clearTimeout(resetPendingTimerRef.current);
      }
    };
  }, []);

  function schedulePendingReset() {
    if (resetPendingTimerRef.current !== null) {
      window.clearTimeout(resetPendingTimerRef.current);
    }

    resetPendingTimerRef.current = window.setTimeout(() => {
      setPendingProvider(null);
    }, 4500);
  }

  async function handleOAuth(provider: 'google' | 'github' | 'apple') {
    if (!signUp) {
      setErrorMessage(
        tr(
          'La creation de compte est encore en chargement. Reessayez dans un instant.',
          'Account creation is still loading. Please try again in a moment.',
          'La creacion de cuenta sigue cargando. Intentalo de nuevo en un momento.',
        )
      );
      return;
    }

    setPendingProvider(provider);
    setErrorMessage('');
    schedulePendingReset();

    try {
      await startOAuthSignUp(clerk, signUp, {
        strategy:
          provider === 'google'
            ? 'oauth_google'
            : provider === 'github'
              ? 'oauth_github'
              : 'oauth_apple',
        redirectCallbackUrl: toAbsoluteBrowserUrl(callbackPath),
        redirectUrl: toAbsoluteBrowserUrl(redirectHref),
        unsafeMetadata: {
          accountType: selectedType,
        },
      });
    } catch (error) {
      if (resetPendingTimerRef.current !== null) {
        window.clearTimeout(resetPendingTimerRef.current);
      }
      setErrorMessage(formatOAuthError(error, isFrench, provider));
      setPendingProvider(null);
    }
  }

  const selectedTypeLabel =
    selectedType === 'business'
      ? tr('Compte business', 'Business account', 'Cuenta business')
      : tr('Compte personnel', 'Personal account', 'Cuenta personal');

  return (
    <div className="accountTypeShell">
      <PageHero
        label={tr('Inscription', 'Sign up', 'Registro')}
        title={tr('Choisissez le type de compte', 'Choose your account type', 'Elige el tipo de cuenta')}
        description={
          tr(
            'Selectionnez un espace personnel ou business avant d ouvrir le formulaire ou la connexion sociale.',
            'Choose a personal or business workspace before opening the form or social sign-up.',
            'Selecciona un espacio personal o business antes de abrir el formulario o el registro social.',
          )
        }
        variant="auth"
      />

      <div className="accountTypeGrid">
        <button
          type="button"
          className={selectedType === 'personal' ? 'accountTypeCard active' : 'accountTypeCard'}
          onClick={() => setSelectedType('personal')}
          aria-pressed={selectedType === 'personal'}
        >
          <span className="accountTypeIcon">
            <UserRound strokeWidth={2.1} />
          </span>
          <strong>{tr('Compte personnel', 'Personal account', 'Cuenta personal')}</strong>
          <small>
            {tr(
              'Pour votre profil, vos publications et votre presence professionnelle.',
              'For your profile, posts and professional presence.',
              'Para tu perfil, tus publicaciones y tu presencia profesional.',
            )}
          </small>
        </button>

        <button
          type="button"
          className={selectedType === 'business' ? 'accountTypeCard active' : 'accountTypeCard'}
          onClick={() => setSelectedType('business')}
          aria-pressed={selectedType === 'business'}
        >
          <span className="accountTypeIcon">
            <Building2 strokeWidth={2.1} />
          </span>
          <strong>{tr('Compte business', 'Business account', 'Cuenta business')}</strong>
          <small>
            {tr(
              'Pour une structure, une marque employeur ou une equipe visible.',
              'For a structure, employer brand or visible team presence.',
              'Para una empresa, una marca empleadora o un equipo visible.',
            )}
          </small>
        </button>
      </div>

      <div className="accountTypeFormEntry">
        <div className="formEntryContent">
          <p className="formEntryLabel">
            {tr('Formulaire classique', 'Standard form', 'Formulario clasico')}
          </p>
          <Link href={formHref} className="primaryAction">
            <span>
              {tr(
                `Continuer avec ${selectedTypeLabel.toLowerCase()}`,
                `Continue with ${selectedTypeLabel.toLowerCase()}`,
                `Continuar con ${selectedTypeLabel.toLowerCase()}`,
              )}
            </span>
          </Link>
        </div>
      </div>

      <div id="clerk-captcha" className="captchaSlot" />

      <div className="accountTypeActions">
        <button
          type="button"
          className="secondaryAction"
          onClick={() => void handleOAuth('google')}
          disabled={pendingProvider !== null || !signUp}
        >
          <GoogleIcon />
          <span>{pendingProvider === 'google' ? tr('Ouverture...', 'Opening...', 'Abriendo...') : 'Google'}</span>
        </button>

        <button
          type="button"
          className="secondaryAction"
          onClick={() => void handleOAuth('github')}
          disabled={pendingProvider !== null || !signUp}
        >
          <GitHubIcon />
          <span>
            {pendingProvider === 'github'
              ? tr('Ouverture...', 'Opening...', 'Abriendo...')
              : 'GitHub'}
          </span>
        </button>

        <button
          type="button"
          className="secondaryAction"
          onClick={() => void handleOAuth('apple')}
          disabled={pendingProvider !== null || !signUp}
        >
          <AppleIcon />
          <span>
            {pendingProvider === 'apple'
              ? tr('Ouverture...', 'Opening...', 'Abriendo...')
              : 'Apple'}
          </span>
        </button>
      </div>

      {errorMessage ? <p className="messageBanner messageError">{errorMessage}</p> : null}

      <p className="accountTypeFootnote">
        {tr('Vous avez deja un compte ?', 'Already have an account?', 'Ya tienes una cuenta?')}{' '}
        <Link href={signInHref}>{tr('Se connecter', 'Sign in', 'Iniciar sesion')}</Link>
      </p>

      <style>{`
        .accountTypeShell {
          width: min(100%, 840px);
          display: grid;
          gap: 22px;
        }

        .captchaSlot {
          min-height: 0;
        }

        .accountTypeLead {
          display: grid;
          gap: 10px;
          padding: 8px 4px 0;
        }

        .eyebrow {
          margin: 0;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 800;
          color: #1d4ed8;
        }

        .accountTypeLead h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .accountTypeLead p:last-child,
        .accountTypeFootnote {
          margin: 0;
          color: #64748b;
          line-height: 1.65;
        }

        .accountTypeGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .accountTypeCard {
          display: grid;
          gap: 12px;
          padding: 22px;
          border-radius: 26px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.92));
          box-shadow: 0 20px 48px rgba(15, 23, 42, 0.06);
          text-align: left;
          color: #0f172a;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .accountTypeCard.active,
        .accountTypeCard:hover {
          transform: translateY(-1px);
          border-color: rgba(37, 99, 235, 0.28);
          box-shadow: 0 24px 56px rgba(15, 23, 42, 0.08);
        }

        .accountTypeIcon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(219, 234, 254, 0.86);
          color: #1d4ed8;
        }

        .accountTypeCard strong {
          font-size: 1.15rem;
        }

        .accountTypeCard small {
          color: #64748b;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .accountTypeActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .accountTypeFormEntry {
          display: flex;
        }

        .formEntryContent {
          display: grid;
          gap: 10px;
        }

        .formEntryLabel {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          color: #475569;
        }

        .primaryAction,
        .secondaryAction {
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 18px;
          border-radius: 16px;
          font: inherit;
          font-weight: 800;
          text-decoration: none;
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
          cursor: pointer;
        }

        .primaryAction {
          border: 1px solid rgba(29, 78, 216, 0.2);
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
        }

        .secondaryAction {
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
        }

        .secondaryAction svg {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
        }

        .primaryAction:hover,
        .secondaryAction:hover {
          transform: translateY(-1px);
        }

        .primaryAction:disabled,
        .secondaryAction:disabled {
          opacity: 0.7;
          cursor: wait;
          transform: none;
        }

        .messageBanner {
          margin: 0;
          padding: 14px 16px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.55;
        }

        .messageError {
          border: 1px solid rgba(220, 38, 38, 0.15);
          background: rgba(254, 242, 242, 0.95);
          color: #991b1b;
        }

        .accountTypeFootnote a {
          color: #1d4ed8;
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .accountTypeGrid {
            grid-template-columns: 1fr;
          }

          .accountTypeFormEntry {
            display: grid;
          }

          .accountTypeActions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

function formatOAuthError(error: unknown, isFrench: boolean, provider: 'google' | 'github' | 'apple') {
  const providerLabel = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'Apple';

  return formatClerkError(
    error,
    isFrench,
    `La connexion ${providerLabel} n est pas disponible pour le moment.`,
    `${providerLabel} sign-up is not available right now.`,
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21.805 12.23c0-.75-.067-1.47-.19-2.161H12v4.089h5.498a4.707 4.707 0 0 1-2.042 3.09v2.567h3.307c1.936-1.783 3.042-4.412 3.042-7.584Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.754 0 5.064-.913 6.752-2.474l-3.307-2.567c-.913.613-2.083.975-3.445.975-2.65 0-4.894-1.79-5.696-4.194H2.887v2.648A9.998 9.998 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.304 13.74A5.996 5.996 0 0 1 6 12c0-.603.104-1.19.304-1.74V7.611H2.887A9.998 9.998 0 0 0 2 12c0 1.611.386 3.136 1.07 4.389l3.234-2.648Z"
        fill="#FBBC04"
      />
      <path
        d="M12 6.066c1.496 0 2.84.515 3.898 1.526l2.924-2.924C17.06 3.029 14.75 2 12 2 8.113 2 4.73 4.221 3.07 7.611l3.234 2.648c.802-2.404 3.046-4.193 5.696-4.193Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.589 2 12.25c0 4.528 2.865 8.37 6.839 9.727.5.096.682-.223.682-.494 0-.244-.009-.89-.014-1.747-2.782.62-3.37-1.39-3.37-1.39-.455-1.184-1.11-1.499-1.11-1.499-.908-.637.069-.624.069-.624 1.004.073 1.532 1.055 1.532 1.055.892 1.565 2.341 1.113 2.91.851.09-.666.35-1.114.636-1.37-2.221-.261-4.555-1.141-4.555-5.08 0-1.122.39-2.04 1.029-2.76-.103-.263-.446-1.322.098-2.756 0 0 .84-.276 2.75 1.053A9.303 9.303 0 0 1 12 6.86c.85.004 1.706.117 2.505.343 1.909-1.329 2.748-1.053 2.748-1.053.545 1.434.202 2.493.1 2.756.64.72 1.027 1.638 1.027 2.76 0 3.949-2.338 4.816-4.566 5.072.36.319.68.947.68 1.908 0 1.378-.012 2.489-.012 2.828 0 .273.18.594.688.493A10.27 10.27 0 0 0 22 12.25C22 6.589 17.523 2 12 2Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15.244 2c.106.828-.212 1.64-.72 2.246-.562.672-1.494 1.188-2.295 1.124-.102-.797.232-1.617.73-2.188.55-.644 1.496-1.124 2.285-1.182ZM19.3 17.256c-.47 1.081-.693 1.563-1.298 2.552-.844 1.378-2.036 3.096-3.516 3.11-1.317.012-1.656-.89-3.446-.882-1.79.01-2.163.9-3.48.888-1.482-.014-2.612-1.566-3.456-2.944-2.36-3.855-2.607-8.387-1.151-10.622 1.034-1.586 2.667-2.513 4.204-2.513 1.566 0 2.551.9 3.844.9 1.254 0 2.018-.9 3.832-.9 1.37 0 2.818.764 3.852 2.082-3.387 1.877-2.838 6.672.615 8.329Z" />
    </svg>
  );
}
