import { redirect } from 'next/navigation';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale } from '@/i18n.config';

export default async function BusinessDashboardAliasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  redirect(localizeHref(safeLocale, '/dashboard'));
}
