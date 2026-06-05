import { notFound } from 'next/navigation';
import PublicInformationPage from '@/components/public/PublicInformationPage';
import { isLocale } from '@/i18n.config';

interface FeaturesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function FeaturesPage({ params }: FeaturesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PublicInformationPage locale={locale} pageKey="features" />;
}
