import EmailVerificationForm from '@/components/auth/EmailVerificationForm';
import { defaultLocale, isLocale } from '@/i18n.config';
import {
  buildSignInHref,
  buildSignUpFormHref,
  resolvePostAuthRedirect,
  type AuthFlowQuery,
} from '@/lib/auth-flow';

interface VerifyEmailPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<AuthFlowQuery>;
}

export default async function VerifyEmailPage({ params, searchParams }: VerifyEmailPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  return (
    <EmailVerificationForm
      locale={safeLocale}
      redirectHref={resolvePostAuthRedirect(safeLocale, query, '/dashboard/profile')}
      signInHref={buildSignInHref(safeLocale, query)}
      signUpHref={buildSignUpFormHref(safeLocale, query)}
      initialEmail={query.email || ''}
    />
  );
}
