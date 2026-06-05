'use client';

import { HandleSSOCallback } from '@clerk/react';
import { useRouter } from 'next/navigation';
import { buildSignInHref, buildSignUpEntryHref } from '@/lib/auth-flow';

interface AuthSsoCallbackProps {
  locale: string;
  redirectHref: string;
}

export default function AuthSsoCallback({ locale, redirectHref }: AuthSsoCallbackProps) {
  const router = useRouter();
  const signInHref = buildSignInHref(locale);
  const signUpHref = buildSignUpEntryHref(locale);

  return (
    <div className="authCallbackShell">
      <HandleSSOCallback
        navigateToApp={({ decorateUrl }) => {
          const destination = decorateUrl(redirectHref);

          if (destination.startsWith('http://') || destination.startsWith('https://')) {
            window.location.href = destination;
            return;
          }

          router.replace(destination);
        }}
        navigateToSignIn={() => router.replace(signInHref)}
        navigateToSignUp={() => router.replace(signUpHref)}
      />

      <div className="authCallbackCard">
        <p className="callbackEyebrow">Communium</p>
        <h1>Connexion en cours...</h1>
        <p>Nous finalisons la redirection securisee vers votre espace.</p>
      </div>

      <style>{`
        .authCallbackShell {
          width: min(100%, 520px);
          display: grid;
          place-items: center;
        }

        .authCallbackCard {
          width: 100%;
          display: grid;
          gap: 10px;
          padding: 26px;
          border-radius: 26px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
          text-align: center;
        }

        .callbackEyebrow {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #1d4ed8;
        }

        .authCallbackCard h1 {
          margin: 0;
          font-size: clamp(1.8rem, 5vw, 2.4rem);
          line-height: 1;
          letter-spacing: -0.05em;
          color: #0f172a;
        }

        .authCallbackCard p:last-child {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
