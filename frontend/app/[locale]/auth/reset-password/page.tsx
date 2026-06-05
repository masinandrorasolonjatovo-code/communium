import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { defaultLocale, isLocale } from '@/i18n.config';
import {
  buildForgotPasswordHref,
  buildSignInHref,
  resolvePostAuthRedirect,
  type AuthFlowQuery,
} from '@/lib/auth-flow';

interface ResetPasswordPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<AuthFlowQuery>;
}

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  return (
    <ResetPasswordForm
      locale={safeLocale}
      redirectHref={resolvePostAuthRedirect(safeLocale, query, '/dashboard')}
      signInHref={buildSignInHref(safeLocale, query)}
      forgotPasswordHref={buildForgotPasswordHref(safeLocale, query)}
      initialEmail={query.email || ''}
    />
  );
}
