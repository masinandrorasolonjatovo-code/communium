import { redirect } from 'next/navigation';
import { defaultLocale, isLocale } from '@/i18n.config';
import { buildSignInHref, type AuthFlowQuery } from '@/lib/auth-flow';

interface LoginAliasPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<AuthFlowQuery>;
}

export default async function LoginAliasPage({ params, searchParams }: LoginAliasPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  redirect(buildSignInHref(safeLocale, query));
}
