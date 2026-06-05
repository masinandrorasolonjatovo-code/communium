'use client';

import Link from 'next/link';
import { useSignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import PageHero from '@/components/PageHero';
import { ensureNoClerkError, formatClerkError } from './auth-helpers';

interface EmailVerificationFormProps {
  locale: string;
  redirectHref: string;
  signInHref: string;
  signUpHref: string;
  initialEmail?: string;
}

export default function EmailVerificationForm({
  locale,
  redirectHref,
  signInHref,
  signUpHref,
  initialEmail = '',
}: EmailVerificationFormProps) {
  const router = useRouter();
  const { signUp } = useSignUp();
  const { isLoaded: isUserLoaded, user } = useUser();
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const isFrench = locale === 'fr';

  useEffect(() => {
    if (!isUserLoaded || !user) {
      return;
    }

    router.replace(redirectHref);
  }, [isUserLoaded, redirectHref, router, user]);

  async function finalizeVerification() {
    if (!signUp || signUp.status !== 'complete') {
      throw new Error(
        isFrench
          ? 'La verification est terminee, mais la session n a pas pu etre finalisee.'
          : 'Verification is complete, but the session could not be finalized.'
      );
    }

    const { error } = await signUp.finalize({
      navigate: async ({ decorateUrl }) => {
        const destination = decorateUrl(redirectHref);

        if (destination.startsWith('http://') || destination.startsWith('https://')) {
          window.location.href = destination;
          return;
        }

        router.replace(destination);
      },
    });

    ensureNoClerkError(error);
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signUp) {
      setErrorMessage(
        isFrench
          ? 'La demande d inscription n est plus active. Recommence la creation du compte.'
          : 'The sign-up request is no longer active. Start the account creation again.'
      );
      return;
    }

    if (!verificationCode.trim()) {
      setErrorMessage(isFrench ? 'Entre le code recu par email.' : 'Enter the code received by email.');
      setInfoMessage('');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const verificationResult = await signUp.verifications.verifyEmailCode({
        code: verificationCode.trim(),
      });
      ensureNoClerkError(verificationResult.error);

      if (signUp.status !== 'complete') {
        setErrorMessage(
          isFrench
            ? 'Le code est invalide ou incomplet. Verifie l email puis recommence.'
            : 'The code is invalid or incomplete. Check the email and try again.'
        );
        return;
      }

      setInfoMessage(
        isFrench ? 'Adresse email confirmee. Ouverture de votre espace...' : 'Email confirmed. Opening your workspace...'
      );
      await finalizeVerification();
    } catch (error) {
      setErrorMessage(
        formatClerkError(
          error,
          isFrench,
          'Une erreur est survenue pendant la verification de l email.',
          'An error occurred while verifying the email.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (!signUp) {
      setErrorMessage(
        isFrench
          ? 'La demande d inscription n est plus active. Recommence la creation du compte.'
          : 'The sign-up request is no longer active. Start the account creation again.'
      );
      return;
    }

    setIsResending(true);
    setErrorMessage('');

    try {
      const verificationResult = await signUp.verifications.sendEmailCode();
      ensureNoClerkError(verificationResult.error);
      setInfoMessage(
        isFrench
          ? `Un nouveau code a ete envoye a ${initialEmail || 'votre adresse email'}.`
          : `A new code has been sent to ${initialEmail || 'your email address'}.`
      );
    } catch (error) {
      setErrorMessage(
        formatClerkError(
          error,
          isFrench,
          'Impossible de renvoyer le code pour le moment.',
          'Unable to resend the code right now.'
        )
      );
    } finally {
      setIsResending(false);
    }
  }

  if (isUserLoaded && user) {
    return null;
  }

  return (
    <div className="verificationShell">
      <PageHero
        label={isFrench ? 'Verification email' : 'Email verification'}
        title={isFrench ? 'Confirmez votre adresse email' : 'Confirm your email address'}
        description={
          isFrench
            ? 'Finalisez votre acces avec le code envoye sur votre adresse professionnelle.'
            : 'Finish your access with the code sent to your professional email address.'
        }
        variant="auth"
      />

      {errorMessage ? <p className="messageBanner messageError">{errorMessage}</p> : null}
      {infoMessage ? <p className="messageBanner messageInfo">{infoMessage}</p> : null}

      <form className="verificationCard" onSubmit={handleVerifyCode}>
        <div className="verificationCopy">
          <h2>{isFrench ? 'Code de verification' : 'Verification code'}</h2>
          <p>
            {initialEmail
              ? isFrench
                ? `Entrez le code envoye a ${initialEmail}.`
                : `Enter the code sent to ${initialEmail}.`
              : isFrench
                ? 'Entrez le code recu pour ouvrir completement votre espace.'
                : 'Enter the code received to fully unlock your workspace.'}
          </p>
        </div>

        <label className="field">
          <span>{isFrench ? 'Code email' : 'Email code'}</span>
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            name="verificationCode"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            placeholder={isFrench ? 'Entrez le code a 6 chiffres' : 'Enter the 6-digit code'}
            required
          />
        </label>

        <div id="clerk-captcha" />

        <div className="verificationActions">
          <button className="primaryAction" disabled={!signUp || isSubmitting} type="submit">
            {isSubmitting
              ? isFrench
                ? 'Verification...'
                : 'Verifying...'
              : isFrench
                ? 'Verifier mon email'
                : 'Verify my email'}
          </button>

          <button className="secondaryAction" disabled={!signUp || isResending} onClick={handleResendCode} type="button">
            {isResending
              ? isFrench
                ? 'Renvoi...'
                : 'Resending...'
              : isFrench
                ? 'Renvoyer le code'
                : 'Resend code'}
          </button>

          <Link className="textAction" href={signUpHref}>
            {isFrench ? 'Modifier mon inscription' : 'Edit my sign-up'}
          </Link>
        </div>
      </form>

      <p className="verificationFootnote">
        {isFrench ? 'Vous avez deja un compte ?' : 'Already have an account?'} <Link href={signInHref}>{isFrench ? 'Se connecter' : 'Sign in'}</Link>
      </p>

      <style>{`
        .verificationShell {
          width: min(100%, 620px);
          display: grid;
          gap: 22px;
        }

        .verificationLead {
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

        .verificationLead h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .verificationLead p,
        .verificationFootnote {
          margin: 0;
          color: #64748b;
          line-height: 1.65;
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

        .messageInfo {
          border: 1px solid rgba(29, 78, 216, 0.15);
          background: rgba(239, 246, 255, 0.96);
          color: #1d4ed8;
        }

        .verificationCard {
          display: grid;
          gap: 18px;
          padding: 24px;
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 34%);
          box-shadow: 0 16px 44px rgba(15, 23, 42, 0.08);
        }

        .verificationCopy {
          display: grid;
          gap: 6px;
        }

        .verificationCopy h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #0f172a;
        }

        .verificationCopy p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
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
          padding: 0 14px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(248, 250, 252, 0.94);
          color: #0f172a;
          font: inherit;
        }

        .field input:focus {
          outline: none;
          border-color: rgba(37, 99, 235, 0.75);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
          background: #ffffff;
        }

        .verificationActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .primaryAction,
        .secondaryAction {
          min-height: 52px;
          border: 0;
          border-radius: 16px;
          padding: 0 18px;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        }

        .primaryAction {
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
        }

        .secondaryAction {
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
          border: 1px solid rgba(148, 163, 184, 0.28);
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

        .textAction,
        .verificationFootnote a {
          color: #1d4ed8;
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 720px) {
          .verificationCard {
            padding: 18px;
            border-radius: 22px;
          }

          .verificationActions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
