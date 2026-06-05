import { notFound } from 'next/navigation';
import SettingsCenter from '@/components/settings/SettingsCenter';
import { isLocale } from '@/i18n.config';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <SettingsCenter locale={locale} />;
}
