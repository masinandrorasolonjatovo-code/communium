import { notFound } from 'next/navigation';
import VerificationWorkspace from '@/components/verification/VerificationWorkspace';
import { isLocale } from '@/i18n.config';

export default async function VerificationSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <VerificationWorkspace locale={locale} />;
}
