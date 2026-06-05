'use client';

import Link from 'next/link';
import { useSignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  readPendingProfileBootstrap,
  storePendingProfileBootstrap,
} from '@/lib/profile-bootstrap';

interface EmailVerificationPanelProps {
  locale: string;
  redirectHref: string;
  signInHref: string;
  editHref: string;
  email?: string;
}

export default function EmailVerificationPanel({
  locale,
  redirectHref,
  signInHref,
  editHref,
  email,
}: EmailVerificationPanelProps) {
  const router = useRouter();
  const { signUp } = useSignUp();
  const { isLoaded: isUserLoaded, user } = useUser();
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const isFrench = locale === 'fr';
  const storedEmail = useMemo(() => readPendingProfileBootstrap()?.email || '', []);
  const targetEmail = email || storedEmail;

  useEffect(() => {
    if (!isUserLoaded || !user) {
      return;
    }

    router.replace(redirectHref);
  }, [isUserLoaded, redirectHref, router, user]);

  async function finalizeVerification() {
    if (!signUp || signUp.status !== 'complete' || !signUp.createdUserId) {
      throw new Error(
        isFrench
          ? 'La verification est terminee, mais la session n est pas encore complete.'
          : 'Verification is complete, but the sign-in session is not complete yet.'
      );
    }

    const pendingBootstrap = readPendingProfileBootstrap();
    if (pendingBootstrap) {
      storePendingProfileBootstrap(pendingBootstrap);
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
      return;
    }

    if (!verificationCode.trim()) {
      setErrorMessage(isFrench ? 'Entrez le code recu par email.' : 'Enter the code received by email.');
      return;
    }

    setIsSubmittingCode(true);
    setErrorMessage('');

    try {
      const verificationResult = await signUp.verifications.verifyEmailCode({
        code: verificationCode.trim(),
      });
      ensureNoClerkError(verificationResult.error);

      if (signUp.status !== 'complete') {
        setErrorMessage(
          isFrench
            ? 'Le code est encore attendu. Verifiez l email et recommencez.'
            : 'The code is still expected. Check your email and try again.'
        );
        return;
      }

      setInfoMessage(
        isFrench ? 'Email confirme, ouverture de votre espace...' : 'Email confirmed, opening your workspace...'
      );
      await finalizeVerification();
    } catch (error) {
      setErrorMessage(formatClerkError(error, isFrench));
    } finally {
      setIsSubmittingCode(false);
    }
  }

  async function handleResendCode() {
    if (!signUp) {
      return;
    }

    setIsResending(true);
    setErrorMessage('');

    try {
      const verificationResult = await signUp.verifications.sendEmailCode();
      ensureNoClerkError(verificationResult.error);
      setInfoMessage(
        isFrench
          ? `Un nouveau code a ete envoye a ${targetEmail || 'votre email'}.`
          : `A new code has been sent to ${targetEmail || 'your email'}.`
      );
    } catch (error) {
      setErrorMessage(formatClerkError(error, isFrench));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="verifyShell">
      <div className="verifyLead">
        <p className="eyebrow">{isFrench ? 'Verification email' : 'Email verification'}</p>
        <h1>{isFrench ? 'Confirmez votre adresse email' : 'Confirm your email address'}</h1>
        <p>
          {isFrench
            ? `Entrez le code envoye a ${targetEmail || 'votre boite email'} pour finaliser l activation du compte.`
            : `Enter the code sent to ${targetEmail || 'your inbox'} to finish activating the account.`}
        </p>
      </div>

      {errorMessage ? <p className="messageBanner messageError">{errorMessage}</p> : null}
      {infoMessage ? <p className="messageBanner messageInfo">{infoMessage}</p> : null}

      <form className="verificationCard" onSubmit={handleVerifyCode}>
        <label className="field">
          <span>{isFrench ? 'Code de verification' : 'Verification code'}</span>
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            name="verificationCode"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            placeholder={isFrench ? 'Entrez le code email' : 'Enter the email code'}
            required
          />
        </label>

        <div className="verificationActions">
          <button className="primaryAction" disabled={isSubmittingCode} type="submit">
            {isSubmittingCode
              ? isFrench
                ? 'Validation...'
                : 'Verifying...'
              : isFrench
                ? 'Valider et ouvrir mon espace'
                : 'Verify and open my workspace'}
          </button>

          <button className="secondaryAction" disabled={isResending} onClick={handleResendCode} type="button">
            {isResending
              ? isFrench
                ? 'Envoi...'
                : 'Sending...'
              : isFrench
                ? 'Renvoyer l email'
                : 'Resend email'}
          </button>
        </div>

        <div className="verificationLinks">
          <Link href={editHref}>{isFrench ? 'Modifier mes informations' : 'Edit my information'}</Link>
          <Link href={signInHref}>{isFrench ? 'Retour a la connexion' : 'Back to sign in'}</Link>
        </div>
      </form>

      <style>{`
        .verifyShell {
          width: min(100%, 620px);
          display: grid;
          gap: 20px;
        }

        .verifyLead {
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

        .verifyLead h1 {
          margin: 0;
          font-size: clamp(1.95rem, 4vw, 2.8rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .verifyLead p:last-child,
        .verificationLinks a {
          color: #64748b;
        }

        .messageBanner {
          margin: 0;
          padding: 14px 16px;
          border-radius: 18px;
          font-size: 0.96rem;
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

        .verificationActions,
        .verificationLinks {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .verificationLinks {
          justify-content: space-between;
        }

        .verificationLinks a {
          text-decoration: none;
          font-weight: 700;
        }

        .primaryAction,
        .secondaryAction {
          min-height: 52px;
          border-radius: 16px;
          padding: 0 20px;
          border: 0;
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

        @media (max-width: 720px) {
          .verificationCard {
            padding: 18px;
            border-radius: 22px;
          }

          .verificationActions,
          .verificationLinks {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

function formatClerkError(error: unknown, isFrench: boolean) {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const nestedErrors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;

    if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
      return nestedErrors
        .map((item) => item.longMessage || item.message)
        .filter(Boolean)
        .join(' ');
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return isFrench ? 'La verification a echoue.' : 'Verification failed.';
}

function ensureNoClerkError(error: unknown) {
  if (error) {
    throw error;
  }
}
