import { notFound } from 'next/navigation';
import PremiumSaasWorkspace from '@/components/premium/PremiumSaasWorkspace';
import { isLocale } from '@/i18n.config';

export default async function CheckoutPlanPage({
  params,
}: {
  params: Promise<{ locale: string; plan: string }>;
}) {
  const { locale, plan } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PremiumSaasWorkspace locale={locale} mode="checkout" initialPlan={plan} />;
}
