import { notFound } from 'next/navigation';
import PremiumSaasWorkspace from '@/components/premium/PremiumSaasWorkspace';
import { isLocale } from '@/i18n.config';

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PremiumSaasWorkspace locale={locale} mode="dashboard" />;
}
