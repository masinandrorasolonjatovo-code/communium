import { notFound } from 'next/navigation';
import { AdminOverviewWorkspace } from '@/components/governance/AdminGovernanceWorkspace';
import { defaultLocale, isLocale } from '@/i18n.config';

export default async function AdminAliasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  if (!isLocale(safeLocale)) {
    notFound();
  }

  return <AdminOverviewWorkspace locale={safeLocale} />;
}
