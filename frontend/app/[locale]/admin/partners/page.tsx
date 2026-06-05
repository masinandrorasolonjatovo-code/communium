import { notFound } from 'next/navigation';
import { AdminPartnersWorkspace } from '@/components/governance/AdminGovernanceWorkspace';
import { isLocale } from '@/i18n.config';

export default async function AdminPartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AdminPartnersWorkspace locale={locale} />;
}
