import { notFound } from 'next/navigation';
import { AdminReportsWorkspace } from '@/components/governance/AdminGovernanceWorkspace';
import { isLocale } from '@/i18n.config';

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AdminReportsWorkspace locale={locale} />;
}
