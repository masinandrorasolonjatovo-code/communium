import { redirect } from 'next/navigation';
import { defaultLocale, isLocale } from '@/i18n.config';
import { buildSignUpEntryHref, type AuthFlowQuery } from '@/lib/auth-flow';

interface RegisterAliasPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<AuthFlowQuery>;
}

export default async function RegisterAliasPage({ params, searchParams }: RegisterAliasPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  redirect(buildSignUpEntryHref(safeLocale, query));
}
