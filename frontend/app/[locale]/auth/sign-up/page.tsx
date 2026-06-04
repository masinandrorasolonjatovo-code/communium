import { defaultLocale, isLocale } from '@/i18n.config';
import {
  buildSignInHref,
  buildVerifyEmailHref,
  resolveAccountType,
  resolvePostAuthRedirect,
  type AuthFlowQuery,
} from '@/lib/auth-flow';
import CompleteSignUpForm from './CompleteSignUpForm';

interface SignUpPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<AuthFlowQuery>;
}

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const redirectHref = resolvePostAuthRedirect(safeLocale, query, '/dashboard/profile');

  return (
    <CompleteSignUpForm
      locale={safeLocale}
      redirectHref={redirectHref}
      signInHref={buildSignInHref(safeLocale, query)}
      verifyEmailHref={buildVerifyEmailHref(safeLocale, {
        ...query,
        accountType: resolveAccountType(query.accountType),
        email: query.email || undefined,
      })}
      accountType={resolveAccountType(query.accountType)}
    />
  );
}
