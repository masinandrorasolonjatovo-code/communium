import { notFound } from 'next/navigation';
import OnboardingCenter from '@/components/onboarding/OnboardingCenter';
import { isLocale } from '@/i18n.config';

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <OnboardingCenter locale={locale} />;
}
