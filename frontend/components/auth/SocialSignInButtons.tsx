'use client';

import { useClerk, useSignIn } from '@clerk/nextjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatClerkError, startOAuthSignIn, toAbsoluteBrowserUrl } from './auth-helpers';

type SocialProvider = 'google' | 'github' | 'apple';

interface SocialSignInButtonsProps {
  locale: string;
  callbackPath: string;
  redirectHref: string;
}

const PROVIDERS: Array<{
  id: SocialProvider;
  label: string;
  strategy: 'oauth_google' | 'oauth_github' | 'oauth_apple';
}> = [
  { id: 'google', label: 'Google', strategy: 'oauth_google' },
  { id: 'github', label: 'GitHub', strategy: 'oauth_github' },
  { id: 'apple', label: 'Apple', strategy: 'oauth_apple' },
];

export default function SocialSignInButtons({
  locale,
  callbackPath,
  redirectHref,
}: SocialSignInButtonsProps) {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const resetPendingTimerRef = useRef<number | null>(null);
  const isFrench = locale === 'fr';
  const resolvedRedirectHref = useMemo(() => toAbsoluteBrowserUrl(redirectHref), [redirectHref]);
  const resolvedCallbackPath = useMemo(() => toAbsoluteBrowserUrl(callbackPath), [callbackPath]);

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

  async function handleProvider(provider: (typeof PROVIDERS)[number]) {
    setPendingProvider(provider.id);
    setErrorMessage('');

    if (!signIn) {
      setPendingProvider(null);
      setErrorMessage(
        isFrench
          ? 'La connexion sociale est en cours de chargement. Reessayez dans un instant.'
          : 'Social sign-in is still loading. Please try again in a moment.',
      );
      return;
    }

    try {
      schedulePendingReset();

      await startOAuthSignIn(clerk, signIn, {
        strategy: provider.strategy,
        redirectCallbackUrl: resolvedCallbackPath,
        redirectUrl: resolvedRedirectHref,
      });
    } catch (error) {
      if (resetPendingTimerRef.current !== null) {
        window.clearTimeout(resetPendingTimerRef.current);
      }
      setPendingProvider(null);
      setErrorMessage(formatOAuthError(error, isFrench, provider.label));
    }
  }

  return (
    <div className="socialSignInShell">
      <div className="socialSignInGrid">
        {PROVIDERS.map((provider) => {
          const isPending = pendingProvider === provider.id;

          return (
            <button
              key={provider.id}
              type="button"
              className="socialSignInButton"
              onClick={() => void handleProvider(provider)}
              disabled={pendingProvider !== null || !signIn}
            >
              <span className="socialProviderIcon" aria-hidden="true">
                {provider.id === 'google' ? <GoogleIcon /> : null}
                {provider.id === 'github' ? <GitHubIcon /> : null}
                {provider.id === 'apple' ? <AppleIcon /> : null}
              </span>
              <span>
                {isPending
                  ? isFrench
                    ? `Ouverture ${provider.label}...`
                    : `Opening ${provider.label}...`
                  : isFrench
                    ? `Continuer avec ${provider.label}`
                    : `Continue with ${provider.label}`}
              </span>
            </button>
          );
        })}
      </div>

      {errorMessage ? <p className="socialSignInError">{errorMessage}</p> : null}

      <style>{`
        .socialSignInShell {
          display: grid;
          gap: 10px;
        }

        .socialSignInGrid {
          display: grid;
          gap: 10px;
        }

        .socialSignInButton {
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid rgba(203, 213, 225, 0.92);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
          color: #0f172a;
          font: inherit;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, opacity 160ms ease;
          cursor: pointer;
        }

        .socialSignInButton:hover {
          transform: translateY(-1px);
          border-color: rgba(37, 99, 235, 0.28);
          box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
        }

        .socialSignInButton:disabled {
          opacity: 0.72;
          cursor: wait;
          transform: none;
        }

        .socialProviderIcon {
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          flex: 0 0 auto;
        }

        .socialProviderIcon svg {
          width: 18px;
          height: 18px;
          display: block;
        }

        .socialSignInError {
          margin: 0;
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid rgba(220, 38, 38, 0.14);
          background: rgba(254, 242, 242, 0.96);
          color: #991b1b;
          font-size: 0.92rem;
          line-height: 1.55;
        }
      `}</style>
    </div>
  );
}

function formatOAuthError(error: unknown, isFrench: boolean, provider: string) {
  return formatClerkError(
    error,
    isFrench,
    `La connexion ${provider} n est pas disponible dans Clerk pour ce projet. Activez ${provider} dans Clerk ou utilisez email et mot de passe.`,
    `${provider} sign-in is not available in Clerk for this project. Enable ${provider} in Clerk or use email and password.`,
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
