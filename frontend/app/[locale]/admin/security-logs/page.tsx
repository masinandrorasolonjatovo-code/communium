import { notFound } from 'next/navigation';
import { AdminSecurityLogsWorkspace } from '@/components/governance/AdminGovernanceWorkspace';
import { isLocale } from '@/i18n.config';

export default async function AdminSecurityLogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AdminSecurityLogsWorkspace locale={locale} />;
}
