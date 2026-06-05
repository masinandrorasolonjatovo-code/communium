import { notFound } from 'next/navigation';
import PublicInformationPage from '@/components/public/PublicInformationPage';
import { isLocale } from '@/i18n.config';

interface PrivacyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PublicInformationPage locale={locale} pageKey="privacy" />;
}
