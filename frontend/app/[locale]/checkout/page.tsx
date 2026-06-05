import { notFound } from 'next/navigation';
import PremiumSaasWorkspace from '@/components/premium/PremiumSaasWorkspace';
import { isLocale } from '@/i18n.config';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PremiumSaasWorkspace locale={locale} mode="checkout" initialPlan={query.plan} />;
}
