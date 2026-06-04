import { notFound } from 'next/navigation';
import PremiumSaasWorkspace from '@/components/premium/PremiumSaasWorkspace';
import { isLocale } from '@/i18n.config';

interface PremiumPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PremiumPage({ params }: PremiumPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PremiumSaasWorkspace locale={locale} mode="marketing" />;
}
