import { notFound } from 'next/navigation';
import { BusinessProfileWorkspace } from '@/components/governance/AccountGovernanceWorkspace';
import { isLocale } from '@/i18n.config';

export default async function ProfileBusinessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <BusinessProfileWorkspace locale={locale} />;
}
