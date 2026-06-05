'use client';

import Link from 'next/link';
import { useSignIn, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import PageHero from '@/components/PageHero';
import PasswordStrengthMeter, { evaluatePasswordStrength } from './PasswordStrengthMeter';
import { ensureNoClerkError, formatClerkError } from './auth-helpers';

interface ResetPasswordFormProps {
  locale: string;
  redirectHref: string;
  signInHref: string;
  forgotPasswordHref: string;
  initialEmail?: string;
}

export default function ResetPasswordForm({
  locale,
  redirectHref,
  signInHref,
  forgotPasswordHref,
  initialEmail = '',
}: ResetPasswordFormProps) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { isLoaded: isUserLoaded, user } = useUser();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const isFrench = locale === 'fr';
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  useEffect(() => {
    if (!isUserLoaded || !user) {
      return;
    }

    router.replace(redirectHref);
  }, [isUserLoaded, redirectHref, router, user]);

  function validateForm() {
    if (!email.trim()) {
      return isFrench ? 'Entre votre adresse email.' : 'Enter your email address.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return isFrench ? 'Saisis une adresse email valide.' : 'Enter a valid email address.';
    }

    if (!code.trim()) {
      return isFrench ? 'Entre le code de reinitialisation.' : 'Enter the reset code.';
    }

    if (!password || password.length < 10) {
      return isFrench
        ? 'Le nouveau mot de passe doit contenir au moins 10 caracteres.'
        : 'The new password must contain at least 10 characters.';
    }

    if (/\s/.test(password)) {
      return isFrench
        ? 'Le mot de passe ne doit pas contenir d espaces.'
        : 'Password cannot contain spaces.';
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return isFrench
        ? 'Utilise au moins une minuscule, une majuscule et un chiffre.'
        : 'Use at least one lowercase letter, one uppercase letter and one number.';
    }

    if (passwordStrength.score < 3) {
      return isFrench
        ? 'Le mot de passe reste trop faible pour proteger le compte.'
        : 'The password is still too weak to protect the account.';
    }

    if (password !== confirmPassword) {
      return isFrench ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.';
    }

    return '';
  }

  async function finalizeSignIn() {
    if (!signIn || signIn.status !== 'complete') {
      throw new Error(
        isFrench
          ? 'Le mot de passe a ete mis a jour, mais la session reste incomplete.'
          : 'The password was updated, but the session remains incomplete.'
      );
    }

    const { error } = await signIn.finalize({
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signIn) {
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      setInfoMessage('');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (signIn.identifier !== email.trim() || signIn.status === null || signIn.status === 'needs_identifier') {
        setErrorMessage(
          isFrench
            ? 'Demande d abord un code de reinitialisation ou renvoyez-en un nouveau.'
            : 'Request a reset code first or resend a new one.'
        );
        return;
      }

      if (signIn.status !== 'needs_new_password') {
        const verifyResult = await signIn.resetPasswordEmailCode.verifyCode({
          code: code.trim(),
        });
        ensureNoClerkError(verifyResult.error);
        const verifiedStatus = signIn.status as string | null;

        if (verifiedStatus !== 'needs_new_password' && verifiedStatus !== 'complete') {
          setErrorMessage(
            isFrench
              ? 'Le code de verification est invalide ou expire.'
              : 'The verification code is invalid or expired.'
          );
          return;
        }
      }

      if (signIn.status !== 'complete') {
        const submitResult = await signIn.resetPasswordEmailCode.submitPassword({
          password,
          signOutOfOtherSessions: true,
        });
        ensureNoClerkError(submitResult.error);
        const submittedStatus = signIn.status as string | null;

        if (submittedStatus !== 'complete') {
          setErrorMessage(
            isFrench
              ? 'Le mot de passe n a pas pu etre mis a jour.'
              : 'The password could not be updated.'
          );
          return;
        }
      }

      setInfoMessage(
        isFrench ? 'Mot de passe mis a jour. Ouverture de votre espace...' : 'Password updated. Opening your workspace...'
      );
      await finalizeSignIn();
    } catch (error) {
      setErrorMessage(
        formatClerkError(
          error,
          isFrench,
          'Impossible de reinitialiser le mot de passe.',
          'Unable to reset the password.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (!signIn) {
      return;
    }

    if (!email.trim()) {
      setErrorMessage(isFrench ? 'Entre votre adresse email.' : 'Enter your email address.');
      setInfoMessage('');
      return;
    }

    setIsResending(true);
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
          ? `Un nouveau code a ete envoye a ${email.trim()}.`
          : `A new code has been sent to ${email.trim()}.`
      );
    } catch (error) {
      setErrorMessage(
        formatClerkError(
          error,
          isFrench,
          'Impossible de renvoyer le code de reinitialisation.',
          'Unable to resend the reset code.'
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
    <div className="resetShell">
      <PageHero
        label={isFrench ? 'Nouveau mot de passe' : 'New password'}
        title={isFrench ? 'Securisez a nouveau votre compte' : 'Secure your account again'}
        description={
          isFrench
            ? 'Entrez votre code et definissez un nouveau mot de passe plus solide.'
            : 'Enter your code and set a stronger new password.'
        }
        variant="auth"
      />

      {errorMessage ? <p className="messageBanner messageError">{errorMessage}</p> : null}
      {infoMessage ? <p className="messageBanner messageInfo">{infoMessage}</p> : null}

      <form className="resetCard" onSubmit={handleSubmit}>
        <div className="fieldGrid">
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

          <label className="field">
            <span>{isFrench ? 'Code de reinitialisation' : 'Reset code'}</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              name="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>{isFrench ? 'Nouveau mot de passe' : 'New password'}</span>
            <input
              autoComplete="new-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>{isFrench ? 'Confirmer le mot de passe' : 'Confirm password'}</span>
            <input
              autoComplete="new-password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
        </div>

        <PasswordStrengthMeter password={password} locale={locale} />

        <div id="clerk-captcha" />

        <div className="actions">
          <button className="primaryAction" disabled={!signIn || isSubmitting} type="submit">
            {isSubmitting
              ? isFrench
                ? 'Mise a jour...'
                : 'Updating...'
              : isFrench
                ? 'Mettre a jour le mot de passe'
                : 'Update password'}
          </button>

          <button className="secondaryAction" disabled={!signIn || isResending} onClick={handleResendCode} type="button">
            {isResending
              ? isFrench
                ? 'Renvoi...'
                : 'Resending...'
              : isFrench
                ? 'Renvoyer le code'
                : 'Resend code'}
          </button>
        </div>
      </form>

      <p className="footnote">
        <Link href={forgotPasswordHref}>{isFrench ? 'Recommencer la reinitialisation' : 'Restart password reset'}</Link>
        {' · '}
        <Link href={signInHref}>{isFrench ? 'Retour connexion' : 'Back to sign in'}</Link>
      </p>

      <style>{`
        .resetShell {
          width: min(100%, 620px);
          display: grid;
          gap: 22px;
        }

        .resetLead {
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

        .resetLead h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .resetLead p,
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

        .resetCard {
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

        .fieldGrid {
          display: grid;
          gap: 16px;
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

        .primaryAction,
        .secondaryAction {
          min-height: 52px;
          border-radius: 16px;
          padding: 0 18px;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        }

        .primaryAction {
          border: 0;
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
        }

        .secondaryAction {
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
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

        .footnote a {
          color: #1d4ed8;
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
