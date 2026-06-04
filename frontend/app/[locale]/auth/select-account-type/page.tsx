import AccountTypeSelection from '@/components/auth/AccountTypeSelection';
import { defaultLocale, isLocale } from '@/i18n.config';
import { resolveAccountType, resolvePostAuthRedirect, type AuthFlowQuery } from '@/lib/auth-flow';

interface SelectAccountTypePageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<AuthFlowQuery>;
}

export default async function SelectAccountTypePage({ params, searchParams }: SelectAccountTypePageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const redirectHref = resolvePostAuthRedirect(safeLocale, query, '/dashboard/profile');

  return (
    <AccountTypeSelection
      locale={safeLocale}
      initialAccountType={resolveAccountType(query.accountType)}
      redirectHref={redirectHref}
      query={query}
    />
  );
}
