import { notFound } from 'next/navigation';
import { SettingsGovernanceWorkspace } from '@/components/governance/AccountGovernanceWorkspace';
import { isLocale } from '@/i18n.config';

export default async function SettingsPrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <SettingsGovernanceWorkspace locale={locale} mode="privacy" />;
}
