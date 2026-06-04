'use client';

import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import PageHero from '@/components/PageHero';
import { buildResetPasswordHref, type AuthFlowQuery } from '@/lib/auth-flow';
import { ensureNoClerkError, formatClerkError } from './auth-helpers';

interface ForgotPasswordFormProps {
  locale: string;
  signInHref: string;
  signUpHref: string;
  query: AuthFlowQuery;
}

export default function ForgotPasswordForm({
  locale,
  signInHref,
  signUpHref,
  query,
}: ForgotPasswordFormProps) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const [email, setEmail] = useState(query.email || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFrench = locale === 'fr';

  const nextHref = useMemo(
    () =>
      buildResetPasswordHref(locale, {
        ...query,
        email: email.trim(),
      }),
    [email, locale, query]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signIn) {
      return;
    }

    if (!email.trim()) {
      setErrorMessage(isFrench ? 'Entre votre adresse email.' : 'Enter your email address.');
      setInfoMessage('');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage(isFrench ? 'Saisis une adresse email valide.' : 'Enter a valid email address.');
      setInfoMessage('');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const createResult = await signIn.create({
        identifier: email.trim(),
      });
      ensureNoClerkError(createResult.error);

      const sendResult = await signIn.resetPasswordEmailCode.sendCode();
      ensureNoClerkError(sendResult.error);

      setInfoMessage(
        isFrench
          ? `Un code de reinitialisation a ete envoye a ${email.trim()}.`
          : `A reset code has been sent to ${email.trim()}.`
      );

      router.push(nextHref);
    } catch (error) {
      setErrorMessage(
        formatClerkError(
          error,
          isFrench,
          'Impossible de lancer la reinitialisation du mot de passe.',
          'Unable to start the password reset.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="forgotPasswordShell">
      <PageHero
        label={isFrench ? 'Mot de passe oublie' : 'Forgot password'}
        title={isFrench ? 'Recuperez l acces a votre compte' : 'Recover access to your account'}
        description={
          isFrench
            ? 'Saisissez votre email pour recevoir un code de reinitialisation securise.'
            : 'Enter your email to receive a secure password reset code.'
        }
        variant="auth"
      />

      {errorMessage ? <p className="messageBanner messageError">{errorMessage}</p> : null}
      {infoMessage ? <p className="messageBanner messageInfo">{infoMessage}</p> : null}

      <form className="forgotCard" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <div id="clerk-captcha" />

        <div className="actions">
          <button className="primaryAction" disabled={!signIn || isSubmitting} type="submit">
            {isSubmitting
              ? isFrench
                ? 'Envoi du code...'
                : 'Sending code...'
              : isFrench
                ? 'Envoyer le code'
                : 'Send code'}
          </button>

          <Link className="secondaryLink" href={signInHref}>
            {isFrench ? 'Retour connexion' : 'Back to sign in'}
          </Link>
        </div>
      </form>

      <p className="footnote">
        {isFrench ? 'Pas encore de compte ?' : "Don't have an account yet?"} <Link href={signUpHref}>{isFrench ? 'Creer un compte' : 'Create an account'}</Link>
      </p>

      <style>{`
        .forgotPasswordShell {
          width: min(100%, 560px);
          display: grid;
          gap: 22px;
        }

        .forgotLead {
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

        .forgotLead h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .forgotLead p,
        .footnote {
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

        .forgotCard {
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

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .primaryAction {
          min-height: 52px;
          border: 0;
          border-radius: 16px;
          padding: 0 18px;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        }

        .primaryAction:hover {
          transform: translateY(-1px);
        }

        .primaryAction:disabled {
          opacity: 0.7;
          cursor: wait;
          transform: none;
        }

        .secondaryLink,
        .footnote a {
          color: #1d4ed8;
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
