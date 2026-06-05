import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { defaultLocale, isLocale } from '@/i18n.config';
import { buildSignInHref, buildSignUpEntryHref, type AuthFlowQuery } from '@/lib/auth-flow';

interface ForgotPasswordPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<AuthFlowQuery>;
}

export default async function ForgotPasswordPage({ params, searchParams }: ForgotPasswordPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  return (
    <ForgotPasswordForm
      locale={safeLocale}
      signInHref={buildSignInHref(safeLocale, query)}
      signUpHref={buildSignUpEntryHref(safeLocale, query)}
      query={query}
    />
  );
}
