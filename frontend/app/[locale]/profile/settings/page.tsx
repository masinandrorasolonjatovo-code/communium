import { notFound } from 'next/navigation';
import SettingsCenter from '@/components/settings/SettingsCenter';
import { isLocale } from '@/i18n.config';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <SettingsCenter locale={locale} />;
}
