import { redirect } from 'next/navigation';
import { defaultLocale, isLocale } from '@/i18n.config';
import { buildSignUpEntryHref, type AuthFlowQuery } from '@/lib/auth-flow';

export default async function RegisterDirectAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<AuthFlowQuery>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  redirect(buildSignUpEntryHref(safeLocale, query));
}
