import LoginForm from '@/components/auth/LoginForm';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale } from '@/i18n.config';
import {
  buildAuthQueryString,
  buildForgotPasswordHref,
  buildSignUpEntryHref,
  resolvePostAuthRedirect,
  type AuthFlowQuery,
} from '@/lib/auth-flow';

interface SignInSearchQuery extends AuthFlowQuery {
  oauth?: string | null;
}

interface SignInPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<SignInSearchQuery>;
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const dashboardFallbackHref = localizeHref(safeLocale, '/dashboard');
  const redirectHref = resolvePostAuthRedirect(safeLocale, query, '/dashboard');
  const hasCustomRedirect = redirectHref !== dashboardFallbackHref;
  const signUpHref = buildSignUpEntryHref(safeLocale, query);
  const forgotPasswordHref = buildForgotPasswordHref(safeLocale, query);
  const callbackPath = `${localizeHref(safeLocale, '/auth/sign-in/sso-callback')}${buildAuthQueryString(query)}`;

  return (
    <LoginForm
      locale={safeLocale}
      redirectHref={redirectHref}
      hasCustomRedirect={hasCustomRedirect}
      signUpHref={signUpHref}
      forgotPasswordHref={forgotPasswordHref}
      callbackPath={callbackPath}
      initialEmail={query.email || ''}
      oauthProvider={query.oauth || null}
    />
  );
}
