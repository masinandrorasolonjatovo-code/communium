import AuthSsoCallback from '@/components/auth/AuthSsoCallback';
import { defaultLocale, isLocale } from '@/i18n.config';
import { resolvePostAuthRedirect, type AuthFlowQuery } from '@/lib/auth-flow';

interface SignInSsoCallbackPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<AuthFlowQuery>;
}

export default async function SignInSsoCallbackPage({
  params,
  searchParams,
}: SignInSsoCallbackPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const redirectHref = resolvePostAuthRedirect(safeLocale, query, '/dashboard');

  return <AuthSsoCallback locale={safeLocale} redirectHref={redirectHref} />;
}
