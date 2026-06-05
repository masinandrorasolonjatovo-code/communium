'use client';

import Link from 'next/link';
import { useSignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import PageHero from '@/components/PageHero';
import PasswordStrengthMeter, { evaluatePasswordStrength } from '@/components/auth/PasswordStrengthMeter';
import { storePendingProfileBootstrap } from '@/lib/profile-bootstrap';
import { ensureNoClerkError, formatClerkError } from '@/components/auth/auth-helpers';
import type { AccountType } from '@/lib/auth-flow';

interface CompleteSignUpFormProps {
  locale: string;
  redirectHref: string;
  signInHref: string;
  verifyEmailHref: string;
  accountType: AccountType;
}

interface SignUpFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  city: string;
  address: string;
  currentJobTitle: string;
  currentCompany: string;
  currentIndustry: string;
  publicProfileUrl: string;
  password: string;
  confirmPassword: string;
  legalAccepted: boolean;
}

const initialForm: SignUpFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  country: '',
  city: '',
  address: '',
  currentJobTitle: '',
  currentCompany: '',
  currentIndustry: '',
  publicProfileUrl: '',
  password: '',
  confirmPassword: '',
  legalAccepted: false,
};

export default function CompleteSignUpForm({
  locale,
  redirectHref,
  signInHref,
  verifyEmailHref,
  accountType,
}: CompleteSignUpFormProps) {
  const router = useRouter();
  const { signUp } = useSignUp();
  const { isLoaded: isUserLoaded, user } = useUser();
  const [form, setForm] = useState<SignUpFormState>(initialForm);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  const isFrench = locale === 'fr';
  const isSpanish = locale === 'es';
  const tr = (fr: string, en: string, es: string) => (isFrench ? fr : isSpanish ? es : en);
  const passwordStrength = useMemo(() => evaluatePasswordStrength(form.password), [form.password]);
  const fullName = useMemo(
    () => [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' ').trim(),
    [form.firstName, form.lastName]
  );

  useEffect(() => {
    if (!isUserLoaded || !user) {
      return;
    }

    router.replace(redirectHref);
  }, [isUserLoaded, redirectHref, router, user]);

  async function finalizeSignUp() {
    if (!signUp || signUp.status !== 'complete' || !signUp.createdUserId) {
      throw new Error(
        tr(
          'Le compte a ete cree, mais la session de connexion est incomplete.',
          'The account was created, but the sign-in session is incomplete.',
          'La cuenta se creo, pero la sesion de conexion esta incompleta.'
        )
      );
    }

    storePendingProfileBootstrap({
      accountType,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      dateOfBirth: form.dateOfBirth,
      country: form.country.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      currentJobTitle: form.currentJobTitle.trim(),
      currentCompany: form.currentCompany.trim(),
      currentIndustry: form.currentIndustry.trim(),
      publicProfileUrl: form.publicProfileUrl.trim(),
    });

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

  function validateForm() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return tr(
        'Le prenom et le nom sont obligatoires.',
        'First name and last name are required.',
        'El nombre y el apellido son obligatorios.'
      );
    }

    if (!form.email.trim() || !form.phone.trim()) {
      return tr('L email et le telephone sont obligatoires.', 'Email and phone are required.', 'El email y el telefono son obligatorios.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return tr('Saisis une adresse email valide.', 'Enter a valid email address.', 'Introduce una direccion email valida.');
    }

    if (!/^\+?[0-9][0-9\s().-]{7,19}$/.test(form.phone.trim())) {
      return tr('Saisis un numero de telephone valide.', 'Enter a valid phone number.', 'Introduce un numero de telefono valido.');
    }

    if (!form.dateOfBirth || !form.country.trim() || !form.city.trim() || !form.address.trim()) {
      return tr(
        'Complete la date de naissance, le pays, la ville et l adresse.',
        'Complete date of birth, country, city, and address.',
        'Completa la fecha de nacimiento, el pais, la ciudad y la direccion.'
      );
    }

    if (!form.currentJobTitle.trim() || !form.currentCompany.trim() || !form.currentIndustry.trim()) {
      return tr(
        'Le poste actuel, l entreprise et le secteur sont obligatoires.',
        'Current role, company, and industry are required.',
        'El puesto actual, la empresa y el sector son obligatorios.'
      );
    }

    if (!form.password || form.password.length < 10) {
      return tr(
        'Le mot de passe doit contenir au moins 10 caracteres.',
        'Password must contain at least 10 characters.',
        'La contrasena debe contener al menos 10 caracteres.'
      );
    }

    if (/\s/.test(form.password)) {
      return tr('Le mot de passe ne doit pas contenir d espaces.', 'Password cannot contain spaces.', 'La contrasena no puede contener espacios.');
    }

    if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
      return tr(
        'Utilise au moins une minuscule, une majuscule et un chiffre.',
        'Use at least one lowercase letter, one uppercase letter and one number.',
        'Usa al menos una minuscula, una mayuscula y un numero.'
      );
    }

    if (passwordStrength.score < 3) {
      return tr(
        'Le mot de passe reste trop faible pour proteger le compte.',
        'The password is still too weak to protect the account.',
        'La contrasena todavia es demasiado debil para proteger la cuenta.'
      );
    }

    if (form.password !== form.confirmPassword) {
      return tr('Les mots de passe ne correspondent pas.', 'Passwords do not match.', 'Las contrasenas no coinciden.');
    }

    if (form.publicProfileUrl.trim() && !/^[a-z0-9-]{3,30}$/i.test(form.publicProfileUrl.trim())) {
      return tr(
        'Le lien public doit contenir 3 a 30 caracteres, sans espace, avec lettres, chiffres ou tirets.',
        'The public link must contain 3 to 30 characters with letters, numbers or hyphens only.',
        'El enlace publico debe tener entre 3 y 30 caracteres, sin espacios, con letras, numeros o guiones.'
      );
    }

    if (!form.legalAccepted) {
      return tr(
        'Tu dois confirmer que les informations saisies sont correctes.',
        'You must confirm that the provided information is correct.',
        'Debes confirmar que la informacion introducida es correcta.'
      );
    }

    return '';
  }

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signUp) {
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      setInfoMessage('');
      return;
    }

    setIsSubmittingDetails(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      storePendingProfileBootstrap({
        accountType,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        country: form.country.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        currentJobTitle: form.currentJobTitle.trim(),
        currentCompany: form.currentCompany.trim(),
        currentIndustry: form.currentIndustry.trim(),
        publicProfileUrl: form.publicProfileUrl.trim(),
      });

      const { error } = await signUp.password({
        emailAddress: form.email.trim(),
        password: form.password,
        unsafeMetadata: {
          accountType,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          dateOfBirth: form.dateOfBirth,
          country: form.country.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          currentJobTitle: form.currentJobTitle.trim(),
          currentCompany: form.currentCompany.trim(),
          currentIndustry: form.currentIndustry.trim(),
          publicProfileUrl: form.publicProfileUrl.trim(),
        },
        legalAccepted: true,
        locale,
      });
      ensureNoClerkError(error);

      if (signUp.status === 'complete') {
        await finalizeSignUp();
        return;
      }

      const verificationResult = await signUp.verifications.sendEmailCode();
      ensureNoClerkError(verificationResult.error);
      setInfoMessage(
        tr(
          `Un code de verification a ete envoye a ${form.email.trim()}.`,
          `A verification code has been sent to ${form.email.trim()}.`,
          `Se envio un codigo de verificacion a ${form.email.trim()}.`
        )
      );
      const nextVerificationUrl = new URL(verifyEmailHref, window.location.origin);
      nextVerificationUrl.searchParams.set('email', form.email.trim());
      router.push(`${nextVerificationUrl.pathname}${nextVerificationUrl.search}`);
    } catch (error) {
      setErrorMessage(
        formatClerkError(
          error,
          isFrench,
          'Une erreur est survenue pendant la creation du compte.',
          isSpanish
            ? 'Se produjo un error al crear la cuenta.'
            : 'An error occurred while creating the account.'
        )
      );
    } finally {
      setIsSubmittingDetails(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signUp) {
      return;
    }

    if (!verificationCode.trim()) {
      setErrorMessage(tr('Entre le code recu par email.', 'Enter the code received by email.', 'Introduce el codigo recibido por email.'));
      setInfoMessage('');
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
          tr(
            'La verification n est pas encore terminee. Verifie le code et recommence.',
            'Verification is not complete yet. Check the code and try again.',
            'La verificacion aun no ha terminado. Revisa el codigo e intentalo de nuevo.'
          )
        );
        return;
      }

      setInfoMessage(
        tr(
          'Compte valide, finalisation du profil en cours...',
          'Account verified, finishing your profile...',
          'Cuenta verificada, finalizando tu perfil...'
        )
      );
      await finalizeSignUp();
    } catch (error) {
      setErrorMessage(
        formatClerkError(
          error,
          isFrench,
          'Une erreur est survenue pendant la verification de l email.',
          isSpanish
            ? 'Se produjo un error al verificar el email.'
            : 'An error occurred while verifying the email.'
        )
      );
    } finally {
      setIsSubmittingCode(false);
    }
  }

  async function handleResendCode() {
    if (!signUp) {
      return;
    }

    setErrorMessage('');

    try {
      const verificationResult = await signUp.verifications.sendEmailCode();
      ensureNoClerkError(verificationResult.error);
      setInfoMessage(
        tr(
          `Un nouveau code a ete envoye a ${form.email.trim()}.`,
          `A new code has been sent to ${form.email.trim()}.`,
          `Se envio un nuevo codigo a ${form.email.trim()}.`
        )
      );
    } catch (error) {
      setErrorMessage(
        formatClerkError(
          error,
          isFrench,
          'Impossible de renvoyer le code.',
          isSpanish ? 'No se puede reenviar el codigo.' : 'Unable to resend the code.'
        )
      );
    }
  }

  function updateField<FieldKey extends keyof SignUpFormState>(field: FieldKey, value: SignUpFormState[FieldKey]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  if (isUserLoaded && user) {
    return null;
  }

  return (
    <div className="customSignUpShell">
      <PageHero
        className="signUpTopbar"
        label={tr('Inscription', 'Sign up', 'Registro')}
        title={tr('Creez votre compte', 'Create your account', 'Crea tu cuenta')}
        description={
          tr(
            'Renseignez les informations essentielles pour ouvrir un espace professionnel complet.',
            'Fill in the essential information to open a complete professional workspace.',
            'Completa la informacion esencial para abrir un espacio profesional completo.'
          )
        }
        variant="auth"
        rightContent={
          <div className="stepPills" aria-label={tr('Etat de l inscription', 'Sign-up progress', 'Progreso del registro')}>
            <span className={`stepPill ${step === 'details' ? 'stepPillActive' : 'stepPillComplete'}`}>1. {tr('Informations', 'Details', 'Datos')}</span>
            <span className={`stepPill ${step === 'verify' ? 'stepPillActive' : ''}`}>2. {tr('Verification email', 'Email verification', 'Verificacion email')}</span>
          </div>
        }
      />

      {errorMessage ? <p className="messageBanner messageError">{errorMessage}</p> : null}
      {infoMessage ? <p className="messageBanner messageInfo">{infoMessage}</p> : null}
      <div id="clerk-captcha" className="captchaSlot" />

      {step === 'details' ? (
        <form className="signUpForm" onSubmit={handleCreateAccount}>
          <section className="formSection">
            <div className="sectionHeader">
              <h2>{tr('Identite', 'Identity', 'Identidad')}</h2>
              <p>{tr('Les informations personnelles visibles dans ton espace membre.', 'Personal details visible in your member workspace.', 'Datos personales visibles en tu espacio de miembro.')}</p>
            </div>

            <div className="fieldGrid twoColumns">
              <label className="field">
                <span>{tr('Prenom', 'First name', 'Nombre')}</span>
                <input
                  autoComplete="given-name"
                  name="firstName"
                  value={form.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Nom', 'Last name', 'Apellido')}</span>
                <input
                  autoComplete="family-name"
                  name="lastName"
                  value={form.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  autoComplete="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Telephone', 'Phone', 'Telefono')}</span>
                <input
                  autoComplete="tel"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Date de naissance', 'Date of birth', 'Fecha de nacimiento')}</span>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => updateField('dateOfBirth', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Pays', 'Country', 'Pais')}</span>
                <input
                  autoComplete="country-name"
                  name="country"
                  value={form.country}
                  onChange={(event) => updateField('country', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Ville', 'City', 'Ciudad')}</span>
                <input
                  autoComplete="address-level2"
                  name="city"
                  value={form.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  required
                />
              </label>

              <label className="field fieldWide">
                <span>{tr('Adresse complete', 'Full address', 'Direccion completa')}</span>
                <input
                  autoComplete="street-address"
                  name="address"
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  required
                />
              </label>
            </div>
          </section>

          <section className="formSection">
            <div className="sectionHeader">
              <h2>{tr('Position actuelle', 'Current position', 'Posicion actual')}</h2>
              <p>
                {tr(
                  'Ces champs servent a construire le profil public et le tableau de bord.',
                  'These fields are used to build the public profile and dashboard.',
                  'Estos campos sirven para construir el perfil publico y el panel.'
                )}
              </p>
            </div>

            <div className="fieldGrid twoColumns">
              <label className="field">
                <span>{tr('Poste actuel', 'Current role', 'Puesto actual')}</span>
                <input
                  name="currentJobTitle"
                  value={form.currentJobTitle}
                  onChange={(event) => updateField('currentJobTitle', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Entreprise actuelle', 'Current company', 'Empresa actual')}</span>
                <input
                  name="currentCompany"
                  value={form.currentCompany}
                  onChange={(event) => updateField('currentCompany', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Secteur', 'Industry', 'Sector')}</span>
                <input
                  name="currentIndustry"
                  value={form.currentIndustry}
                  onChange={(event) => updateField('currentIndustry', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Lien public souhaite (optionnel)', 'Preferred public link (optional)', 'Enlace publico preferido (opcional)')}</span>
                <input
                  name="publicProfileUrl"
                  placeholder={tr('ex: prenom-nom', 'e.g. first-last', 'ej: nombre-apellido')}
                  value={form.publicProfileUrl}
                  onChange={(event) => updateField('publicProfileUrl', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="formSection">
            <div className="sectionHeader">
              <h2>{tr('Securite du compte', 'Account security', 'Seguridad de la cuenta')}</h2>
              <p>
                {tr(
                  'La connexion restera sur la page simple. Ici, on prepare le compte complet une seule fois.',
                  'Sign-in remains on the simple page. Here, we prepare the complete account once.',
                  'El inicio de sesion sigue en la pagina simple. Aqui preparamos la cuenta completa una sola vez.'
                )}
              </p>
            </div>

            <div className="fieldGrid twoColumns">
              <label className="field">
                <span>{tr('Mot de passe', 'Password', 'Contrasena')}</span>
                <input
                  autoComplete="new-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{tr('Confirmer le mot de passe', 'Confirm password', 'Confirmar contrasena')}</span>
                <input
                  autoComplete="new-password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  required
                />
              </label>
            </div>

            <PasswordStrengthMeter password={form.password} locale={locale} />

            <label className="consentRow">
              <input
                checked={form.legalAccepted}
                onChange={(event) => updateField('legalAccepted', event.target.checked)}
                type="checkbox"
              />
              <span>
                {isFrench
                  ? 'Je confirme que ces informations sont exactes et j accepte de creer mon profil complet maintenant.'
                  : isSpanish
                    ? 'Confirmo que esta informacion es correcta y quiero crear mi perfil completo ahora.'
                    : 'I confirm that this information is accurate and I want to create my full profile now.'}
              </span>
            </label>
          </section>

          <div className="formFooter">
            <p>
              {tr('Tu as deja un compte ?', 'Already have an account?', 'Ya tienes una cuenta?')}{' '}
              <Link href={signInHref}>{tr('Se connecter', 'Sign in', 'Iniciar sesion')}</Link>
            </p>

            <button className="primaryAction" disabled={isSubmittingDetails} type="submit">
              {isSubmittingDetails
                ? isFrench
                  ? 'Preparation du compte...'
                  : isSpanish
                    ? 'Preparando cuenta...'
                    : 'Preparing account...'
                : isFrench
                  ? 'Continuer et verifier mon email'
                  : isSpanish
                    ? 'Continuar y verificar mi email'
                    : 'Continue and verify my email'}
            </button>
          </div>
        </form>
      ) : (
        <form className="verificationCard" onSubmit={handleVerifyCode}>
          <div className="verificationCopy">
            <h2>{tr('Verifie ton adresse email', 'Verify your email address', 'Verifica tu email')}</h2>
            <p>
              {tr(
                `Entre le code recu sur ${form.email.trim()} pour finaliser la creation du compte et de ton profil.`,
                `Enter the code sent to ${form.email.trim()} to finish creating your account and profile.`,
                `Introduce el codigo enviado a ${form.email.trim()} para terminar de crear tu cuenta y tu perfil.`
              )}
            </p>
          </div>

          <label className="field">
            <span>{tr('Code de verification', 'Verification code', 'Codigo de verificacion')}</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              name="verificationCode"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder={tr('Entre le code email', 'Enter the email code', 'Introduce el codigo email')}
              required
            />
          </label>

          <div className="verificationActions">
            <button className="primaryAction" disabled={isSubmittingCode} type="submit">
              {isSubmittingCode
                ? isFrench
                  ? 'Validation...'
                  : isSpanish
                    ? 'Verificando...'
                    : 'Verifying...'
                : isFrench
                  ? 'Valider et ouvrir mon espace'
                  : isSpanish
                    ? 'Verificar y abrir mi espacio'
                    : 'Verify and open my workspace'}
            </button>

            <button className="secondaryAction" onClick={handleResendCode} type="button">
              {tr('Renvoyer le code', 'Resend code', 'Reenviar codigo')}
            </button>

            <button
              className="textAction"
              onClick={() => {
                setStep('details');
                setErrorMessage('');
                setInfoMessage('');
              }}
              type="button"
            >
              {tr('Modifier mes informations', 'Edit my information', 'Editar mi informacion')}
            </button>
          </div>
        </form>
      )}

      <style>{`
        .customSignUpShell {
          width: min(100%, 1080px);
          display: grid;
          gap: 22px;
        }

        .signUpTopbar {
          display: grid;
          gap: 18px;
          padding: 8px 4px 0;
        }

        .eyebrow {
          margin: 0 0 8px;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 800;
          color: #1d4ed8;
        }

        .signUpTopbar h1 {
          margin: 0;
          max-width: 820px;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .introCopy {
          margin: 12px 0 0;
          max-width: 760px;
          font-size: 1rem;
          line-height: 1.65;
          color: #475569;
        }

        .stepPills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .stepPill {
          border-radius: 999px;
          padding: 10px 14px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: rgba(255, 255, 255, 0.74);
          color: #475569;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .stepPillActive {
          border-color: rgba(29, 78, 216, 0.35);
          background: linear-gradient(135deg, rgba(219, 234, 254, 0.92), rgba(239, 246, 255, 0.96));
          color: #1d4ed8;
        }

        .stepPillComplete {
          border-color: rgba(37, 99, 235, 0.18);
          color: #0f172a;
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

        .captchaSlot {
          min-height: 0;
        }

        .signUpForm,
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

        .formSection {
          display: grid;
          gap: 16px;
          padding: 20px;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: rgba(255, 255, 255, 0.82);
        }

        .sectionHeader {
          display: grid;
          gap: 6px;
        }

        .sectionHeader h2,
        .verificationCopy h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #0f172a;
        }

        .sectionHeader p,
        .verificationCopy p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }

        .fieldGrid {
          display: grid;
          gap: 16px;
        }

        .twoColumns {
          grid-template-columns: repeat(2, minmax(0, 1fr));
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
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .field input:focus {
          outline: none;
          border-color: rgba(37, 99, 235, 0.75);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
          background: #ffffff;
        }

        .fieldWide {
          grid-column: 1 / -1;
        }

        .consentRow {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          color: #334155;
          line-height: 1.55;
        }

        .consentRow input {
          margin-top: 3px;
          width: 18px;
          height: 18px;
          accent-color: #1d4ed8;
        }

        .formFooter {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          padding: 0 4px;
        }

        .formFooter p {
          margin: 0;
          color: #475569;
        }

        .formFooter a,
        .textAction {
          color: #1d4ed8;
          font-weight: 700;
          text-decoration: none;
        }

        .primaryAction,
        .secondaryAction,
        .textAction {
          border: 0;
          font: inherit;
          cursor: pointer;
        }

        .primaryAction,
        .secondaryAction {
          min-height: 52px;
          border-radius: 16px;
          padding: 0 20px;
          font-weight: 800;
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

        .verificationCard {
          max-width: 620px;
        }

        .verificationActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .textAction {
          background: transparent;
          padding: 0;
        }

        @media (max-width: 900px) {
          .twoColumns {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .customSignUpShell {
            gap: 18px;
          }

          .signUpForm,
          .verificationCard,
          .formSection {
            padding: 18px;
            border-radius: 22px;
          }

          .formFooter,
          .verificationActions {
            flex-direction: column;
            align-items: stretch;
          }

          .textAction {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
