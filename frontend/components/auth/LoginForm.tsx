'use client';

import Link from 'next/link';
import { useAuth, useClerk, useSignIn } from '@clerk/nextjs';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import PageHero from '@/components/PageHero';
import { formatClerkError, startOAuthSignIn, toAbsoluteBrowserUrl } from './auth-helpers';
import { resolveAuthenticatedDestination } from './resolve-authenticated-destination';

type OAuthProvider = 'google' | 'github' | 'apple';
type OAuthStrategy = 'oauth_google' | 'oauth_github' | 'oauth_apple';

type ToastState = {
  tone: 'success' | 'error';
  message: string;
} | null;

interface LoginFormProps {
  locale: string;
  redirectHref: string;
  hasCustomRedirect: boolean;
  signUpHref: string;
  forgotPasswordHref: string;
  callbackPath: string;
  initialEmail?: string;
  oauthProvider?: string | null;
}

function isOAuthProvider(value?: string | null): value is OAuthProvider {
  return value === 'google' || value === 'github' || value === 'apple';
}

function providerLabel(provider: OAuthProvider, isFrench: boolean) {
  if (provider === 'google') {
    return isFrench ? 'Google' : 'Google';
  }

  return provider === 'github' ? 'GitHub' : 'Apple';
}

function invalidCredentialsMessage(isFrench: boolean) {
  return isFrench
    ? 'Email ou mot de passe invalide. Verifiez vos informations et recommencez.'
    : 'Invalid email or password. Check your credentials and try again.';
}

function normalizeLoginError(error: unknown, isFrench: boolean) {
  const genericMessage = invalidCredentialsMessage(isFrench);
  const formatted = formatClerkError(
    error,
    isFrench,
    genericMessage,
    genericMessage,
  );

  if (/password|identifier|credential|invalid|not found|match|incorrect/iu.test(formatted)) {
    return genericMessage;
  }

  return formatted;
}

function shouldTryNextOAuthStrategy(error: unknown) {
  const message =
    typeof error === 'object' && error !== null && 'errors' in error
      ? JSON.stringify((error as { errors?: unknown }).errors || '')
      : error instanceof Error
        ? error.message
        : String(error || '');

  return /strategy|unsupported|unknown|oauth_linkedin/iu.test(message);
}

function oauthUnavailableMessage(provider: OAuthProvider, isFrench: boolean) {
  const label = providerLabel(provider, isFrench);

  return isFrench
    ? `La connexion ${label} n est pas disponible dans Clerk pour ce projet. Activez ${label} dans Clerk ou utilisez email et mot de passe.`
    : `${label} sign-in is not available in Clerk for this project. Enable ${label} in Clerk or use email and password.`;
}

export default function LoginForm({
  locale,
  redirectHref,
  hasCustomRedirect,
  signUpHref,
  forgotPasswordHref,
  callbackPath,
  initialEmail = '',
  oauthProvider = null,
}: LoginFormProps) {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { getToken } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [inlineError, setInlineError] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const autoStartRef = useRef(false);
  const pendingResetRef = useRef<number | null>(null);
  const isFrench = locale === 'fr';

  const resolvedRedirectHref = useMemo(() => toAbsoluteBrowserUrl(redirectHref), [redirectHref]);
  const resolvedCallbackPath = useMemo(() => toAbsoluteBrowserUrl(callbackPath), [callbackPath]);
  const activeOAuthProvider = isOAuthProvider(oauthProvider) ? oauthProvider : null;
  const isSignInLoaded = Boolean(signIn);

  useEffect(() => {
    if (!toast?.message) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (pendingResetRef.current !== null) {
        window.clearTimeout(pendingResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeOAuthProvider || autoStartRef.current || !signIn) {
      return;
    }

    autoStartRef.current = true;
    void beginOAuth(activeOAuthProvider);
  }, [activeOAuthProvider, signIn]);

  async function beginOAuth(provider: OAuthProvider) {
    if (!signIn) {
      setToast({
        tone: 'error',
        message: isFrench
          ? 'Les methodes OAuth sont encore en chargement. Reessayez dans un instant.'
          : 'OAuth methods are still loading. Please try again in a moment.',
      });
      return;
    }

    setPendingProvider(provider);
    setInlineError('');
    setToast(null);
    if (pendingResetRef.current !== null) {
      window.clearTimeout(pendingResetRef.current);
    }
    pendingResetRef.current = window.setTimeout(() => {
      setPendingProvider(null);
      setToast({
        tone: 'error',
        message: isFrench
          ? `La redirection ${providerLabel(provider, isFrench)} ne s est pas lancee. Verifiez que ${providerLabel(provider, isFrench)} est active dans Clerk, puis reessayez.`
          : `${providerLabel(provider, isFrench)} redirect did not start. Make sure ${providerLabel(provider, isFrench)} is enabled in Clerk, then try again.`,
      });
    }, 7000);

    const strategies: OAuthStrategy[] =
      provider === 'google' ? ['oauth_google'] : provider === 'github' ? ['oauth_github'] : ['oauth_apple'];

    let capturedError: unknown = null;

    for (let index = 0; index < strategies.length; index += 1) {
      const strategy = strategies[index];

      try {
        await startOAuthSignIn(clerk, signIn, {
          strategy,
          redirectCallbackUrl: resolvedCallbackPath,
          redirectUrl: resolvedRedirectHref,
        });
        if (pendingResetRef.current !== null) {
          window.clearTimeout(pendingResetRef.current);
        }
        return;
      } catch (error) {
        capturedError = error;

        if (index < strategies.length - 1 && shouldTryNextOAuthStrategy(error)) {
          continue;
        }

        break;
      }
    }

    setPendingProvider(null);
    if (pendingResetRef.current !== null) {
      window.clearTimeout(pendingResetRef.current);
    }
    setToast({
      tone: 'error',
      message: formatClerkError(
        capturedError,
        isFrench,
        oauthUnavailableMessage(provider, true),
        oauthUnavailableMessage(provider, false),
      ),
    });
  }

  function handleOAuthClick(provider: OAuthProvider) {
    void beginOAuth(provider);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalizedEmail)) {
      const message = isFrench ? 'Saisissez une adresse email valide.' : 'Enter a valid email address.';
      setInlineError(message);
      setToast({ tone: 'error', message });
      return;
    }

    if (!password) {
      const message = isFrench ? 'Le mot de passe est obligatoire.' : 'Password is required.';
      setInlineError(message);
      setToast({ tone: 'error', message });
      return;
    }

    if (!signIn || !isSignInLoaded) {
      const message = isFrench
        ? 'Le module de connexion est encore en chargement. Reessayez dans un instant.'
        : 'The sign-in module is still loading. Please try again in a moment.';
      setInlineError(message);
      setToast({ tone: 'error', message });
      return;
    }

    setIsSubmitting(true);
    setInlineError('');
    setToast(null);

    try {
      const validationResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const validationBody = (await validationResponse.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!validationResponse.ok || !validationBody?.success) {
        throw new Error(validationBody?.error || invalidCredentialsMessage(isFrench));
      }

      const createResult = await signIn.create({
        identifier: normalizedEmail,
      });
      const createError =
        typeof createResult === 'object' && createResult !== null && 'error' in createResult
          ? (createResult as { error?: unknown }).error
          : null;
      if (createError) {
        throw createError;
      }

      const passwordResult = await signIn.password({
        password,
      });
      const passwordError =
        typeof passwordResult === 'object' && passwordResult !== null && 'error' in passwordResult
          ? (passwordResult as { error?: unknown }).error
          : null;
      if (passwordError) {
        throw passwordError;
      }

      if (signIn.status !== 'complete') {
        if (signIn.status === 'needs_second_factor') {
          throw new Error(
            isFrench
              ? 'Une verification supplementaire est requise pour terminer la connexion.'
              : 'An additional verification step is required to finish signing in.',
          );
        }

        throw new Error(invalidCredentialsMessage(isFrench));
      }

      const finalizeResult = await signIn.finalize();
      const finalizeError =
        typeof finalizeResult === 'object' && finalizeResult !== null && 'error' in finalizeResult
          ? (finalizeResult as { error?: unknown }).error
          : null;
      if (finalizeError) {
        throw finalizeError;
      }

      setToast({
        tone: 'success',
        message: isFrench
          ? 'Connexion reussie. Ouverture de votre espace...'
          : 'Signed in successfully. Opening your workspace...',
      });

      const destination = await resolveAuthenticatedDestination({
        locale,
        getToken,
        preferredRedirectHref: redirectHref,
        hasCustomRedirect,
        emailHint: normalizedEmail,
      });

      window.location.assign(destination);
    } catch (error) {
      const message = normalizeLoginError(error, isFrench);
      setInlineError(message);
      setToast({ tone: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="loginShell">
      <div className="loginHeader">
        <div className="loginBrandMark" aria-hidden="true">
          <img src="/communium_logo.svg" alt="" width={40} height={40} decoding="async" />
        </div>
        <PageHero
          label={isFrench ? 'Connexion' : 'Sign in'}
          title={isFrench ? 'Connectez-vous a Communium' : 'Connect to Communium'}
          description={
            isFrench
              ? 'Accedez a votre espace professionnel, vos profils et vos interactions.'
              : 'Access your professional workspace, profiles and interactions.'
          }
          variant="auth"
        />
      </div>

      {toast ? (
        <div
          className={toast.tone === 'success' ? 'loginToast toastSuccess' : 'loginToast toastError'}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}

      <div className="oauthGroup" aria-label={isFrench ? 'Connexion sociale' : 'Social sign-in'}>
        <button
          type="button"
          className="oauthButton"
          onClick={() => handleOAuthClick('google')}
          disabled={pendingProvider !== null || isSubmitting}
        >
          <span className="oauthIcon" aria-hidden="true">
            <GoogleIcon />
          </span>
          <span>
            {pendingProvider === 'google'
              ? isFrench
                ? 'Ouverture Google...'
                : 'Opening Google...'
              : isFrench
                ? 'Continuer avec Google'
                : 'Continue with Google'}
          </span>
        </button>

        {(['github', 'apple'] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            className="oauthButton"
            onClick={() => handleOAuthClick(provider)}
            disabled={pendingProvider !== null || isSubmitting}
          >
            <span className="oauthIcon" aria-hidden="true">
              {provider === 'github' ? <GitHubIcon /> : <AppleIcon />}
            </span>
            <span>
              {pendingProvider === provider
                ? isFrench
                  ? `Ouverture ${providerLabel(provider, isFrench)}...`
                  : `Opening ${providerLabel(provider, isFrench)}...`
                : isFrench
                  ? `Continuer avec ${providerLabel(provider, isFrench)}`
                  : `Continue with ${providerLabel(provider, isFrench)}`}
            </span>
          </button>
        ))}
      </div>

      <div className="separatorRow" aria-hidden="true">
        <span />
        <em>{isFrench ? 'ou' : 'or'}</em>
        <span />
      </div>

      <form className="loginForm" onSubmit={handleSubmit}>
        <label className="field">
          <span>{isFrench ? 'Email' : 'Email'}</span>
          <input
            autoComplete="email"
            inputMode="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={isFrench ? 'vous@entreprise.com' : 'you@company.com'}
            disabled={isSubmitting || pendingProvider !== null}
            required
          />
        </label>

        <label className="field">
          <span>{isFrench ? 'Mot de passe' : 'Password'}</span>
          <div className="passwordField">
            <input
              autoComplete="current-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isFrench ? 'Votre mot de passe' : 'Your password'}
              disabled={isSubmitting || pendingProvider !== null}
              required
            />

            <button
              type="button"
              className="togglePasswordButton"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? (isFrench ? 'Masquer le mot de passe' : 'Hide password') : isFrench ? 'Afficher le mot de passe' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} strokeWidth={2.1} /> : <Eye size={18} strokeWidth={2.1} />}
            </button>
          </div>
        </label>

        {inlineError ? <p className="inlineError">{inlineError}</p> : null}

        <button
          type="submit"
          className="submitButton"
          disabled={isSubmitting || pendingProvider !== null || !isSignInLoaded}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="spinIcon" size={18} strokeWidth={2.1} />
              <span>{isFrench ? 'Connexion...' : 'Signing in...'}</span>
            </>
          ) : (
            <span>{isFrench ? 'Se connecter' : 'Sign in'}</span>
          )}
        </button>
      </form>

      <div className="loginLinks">
        <Link href={forgotPasswordHref}>{isFrench ? 'Mot de passe oublie ?' : 'Forgot password?'}</Link>
        <span className="loginLinksDivider" aria-hidden="true">
          ·
        </span>
        <Link href={signUpHref}>{isFrench ? 'Creer un compte' : 'Create account'}</Link>
      </div>

      <style>{`
        .loginShell {
          width: min(100%, 460px);
          display: grid;
          gap: 18px;
        }

        .loginHeader {
          display: grid;
          gap: 14px;
        }

        .loginBrandMark {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          border: 1px solid rgba(191, 219, 254, 0.9);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
        }

        .loginBrandMark img {
          width: 38px;
          height: 38px;
          display: block;
          object-fit: contain;
        }

        .loginToast {
          padding: 13px 15px;
          border-radius: 16px;
          border: 1px solid transparent;
          font-size: 0.94rem;
          line-height: 1.6;
        }

        .toastSuccess {
          border-color: rgba(34, 197, 94, 0.18);
          background: rgba(240, 253, 244, 0.98);
          color: #166534;
        }

        .toastError {
          border-color: rgba(220, 38, 38, 0.18);
          background: rgba(254, 242, 242, 0.98);
          color: #991b1b;
        }

        .oauthGroup {
          display: grid;
          gap: 10px;
        }

        .oauthButton {
          min-height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid rgba(191, 219, 254, 0.92);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
          color: #0f172a;
          font: inherit;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, opacity 160ms ease;
          cursor: pointer;
        }

        .oauthButton:hover {
          transform: translateY(-1px);
          border-color: rgba(37, 99, 235, 0.3);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        .oauthButton:disabled {
          opacity: 0.72;
          cursor: wait;
          transform: none;
        }

        .oauthIcon {
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          color: #0f172a;
        }

        .oauthIcon svg {
          width: 18px;
          height: 18px;
          display: block;
        }

        .separatorRow {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
        }

        .separatorRow span {
          height: 1px;
          background: rgba(203, 213, 225, 0.82);
        }

        .separatorRow em {
          font-style: normal;
          color: #64748b;
          font-size: 0.88rem;
        }

        .loginForm {
          display: grid;
          gap: 14px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field span {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
        }

        .field input {
          width: 100%;
          min-height: 52px;
          padding: 0 16px;
          border-radius: 16px;
          border: 1px solid rgba(191, 219, 254, 0.92);
          background: rgba(255, 255, 255, 0.96);
          color: #0f172a;
          font: inherit;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .field input:focus {
          outline: none;
          border-color: rgba(37, 99, 235, 0.54);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .field input:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .passwordField {
          position: relative;
        }

        .passwordField input {
          padding-inline-end: 52px;
        }

        .togglePasswordButton {
          position: absolute;
          top: 50%;
          inset-inline-end: 10px;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: color 160ms ease, background 160ms ease;
        }

        .togglePasswordButton:hover {
          color: #0f172a;
          background: rgba(241, 245, 249, 0.9);
        }

        .inlineError {
          margin: 0;
          color: #991b1b;
          font-size: 0.91rem;
          line-height: 1.55;
        }

        .submitButton {
          min-height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 0 18px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(135deg, #1d4ed8, #2563eb 48%, #3b82f6);
          color: #ffffff;
          font: inherit;
          font-weight: 800;
          box-shadow: 0 18px 34px rgba(37, 99, 235, 0.26);
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
          cursor: pointer;
        }

        .submitButton:hover {
          transform: translateY(-1px);
          box-shadow: 0 20px 38px rgba(37, 99, 235, 0.32);
        }

        .submitButton:disabled {
          opacity: 0.72;
          cursor: wait;
          transform: none;
        }

        .spinIcon {
          animation: loginSpin 900ms linear infinite;
        }

        .loginLinks {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #64748b;
          font-size: 0.95rem;
        }

        .loginLinks a {
          color: #1d4ed8;
          font-weight: 700;
          text-decoration: none;
        }

        .loginLinksDivider {
          color: rgba(100, 116, 139, 0.72);
        }

        @keyframes loginSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 540px) {
          .loginShell {
            gap: 16px;
          }

          .loginHeader {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .loginBrandCopy h1 {
            font-size: 1.95rem;
          }
        }
      `}</style>
    </div>
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
