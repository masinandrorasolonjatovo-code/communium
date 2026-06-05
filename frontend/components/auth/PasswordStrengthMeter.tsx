'use client';

export interface PasswordStrengthState {
  score: number;
  labelFr: string;
  labelEn: string;
  labelEs: string;
  helperFr: string;
  helperEn: string;
  helperEs: string;
  checks: {
    minLength: boolean;
    lower: boolean;
    upper: boolean;
    digit: boolean;
    special: boolean;
    noSpaces: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthState {
  const checks = {
    minLength: password.length >= 10,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    noSpaces: !/\s/.test(password),
  };

  const passed = [
    checks.minLength,
    checks.lower,
    checks.upper,
    checks.digit,
    checks.special,
    checks.noSpaces,
  ].filter(Boolean).length;

  const score = Math.max(
    0,
    Math.min(
      4,
      passed >= 6 ? 4 : passed >= 5 ? 3 : passed >= 4 ? 2 : passed >= 3 ? 1 : 0,
    ),
  );

  if (score >= 4) {
    return {
      score,
      labelFr: 'Tres fort',
      labelEn: 'Very strong',
      labelEs: 'Muy fuerte',
      helperFr: 'Mot de passe robuste pour proteger le compte.',
      helperEn: 'Strong password for protecting the account.',
      helperEs: 'Contrasena solida para proteger la cuenta.',
      checks,
    };
  }

  if (score === 3) {
    return {
      score,
      labelFr: 'Fort',
      labelEn: 'Strong',
      labelEs: 'Fuerte',
      helperFr: 'Encore un symbole ou plus de longueur pour aller plus loin.',
      helperEn: 'Add a symbol or more length to improve it further.',
      helperEs: 'Anade un simbolo o mas longitud para mejorarla.',
      checks,
    };
  }

  if (score === 2) {
    return {
      score,
      labelFr: 'Moyen',
      labelEn: 'Medium',
      labelEs: 'Media',
      helperFr: 'Ajoutez majuscule, chiffre et longueur supplementaire.',
      helperEn: 'Add uppercase, digits and more length.',
      helperEs: 'Anade mayusculas, numeros y mas longitud.',
      checks,
    };
  }

  if (score === 1) {
    return {
      score,
      labelFr: 'Faible',
      labelEn: 'Weak',
      labelEs: 'Debil',
      helperFr: 'Le mot de passe reste trop simple pour un compte pro.',
      helperEn: 'The password is still too weak for a professional account.',
      helperEs: 'La contrasena sigue siendo demasiado simple para una cuenta profesional.',
      checks,
    };
  }

  return {
    score: 0,
    labelFr: 'A definir',
    labelEn: 'To define',
    labelEs: 'Por definir',
    helperFr: 'Utilisez au moins 10 caracteres avec majuscule, minuscule et chiffre.',
    helperEn: 'Use at least 10 characters with uppercase, lowercase and a digit.',
    helperEs: 'Usa al menos 10 caracteres con mayuscula, minuscula y un numero.',
    checks,
  };
}

export default function PasswordStrengthMeter({
  password,
  locale,
}: {
  password: string;
  locale: string;
}) {
  const strength = evaluatePasswordStrength(password);
  const isFrench = locale === 'fr';
  const isSpanish = locale === 'es';
  const label = isFrench ? strength.labelFr : isSpanish ? strength.labelEs : strength.labelEn;
  const helper = isFrench ? strength.helperFr : isSpanish ? strength.helperEs : strength.helperEn;

  return (
    <div className="passwordStrengthMeter" aria-live="polite">
      <div className="passwordStrengthHead">
        <strong>{isFrench ? 'Niveau du mot de passe' : isSpanish ? 'Nivel de contrasena' : 'Password strength'}</strong>
        <span>{label}</span>
      </div>
      <div className="passwordStrengthTrack" aria-hidden="true">
        {[0, 1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={segment < strength.score ? 'passwordStrengthSegment active' : 'passwordStrengthSegment'}
          />
        ))}
      </div>
      <p>{helper}</p>

      <style>{`
        .passwordStrengthMeter {
          display: grid;
          gap: 8px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(248, 250, 252, 0.9);
        }

        .passwordStrengthHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #0f172a;
        }

        .passwordStrengthHead strong {
          font-size: 0.9rem;
        }

        .passwordStrengthHead span {
          font-size: 0.82rem;
          font-weight: 700;
          color: #1d4ed8;
        }

        .passwordStrengthTrack {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
        }

        .passwordStrengthSegment {
          height: 8px;
          border-radius: 999px;
          background: rgba(203, 213, 225, 0.7);
        }

        .passwordStrengthSegment.active {
          background: linear-gradient(90deg, #2563eb, #38bdf8);
        }

        .passwordStrengthMeter p {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.55;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
