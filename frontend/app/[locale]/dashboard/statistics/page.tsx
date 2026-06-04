import { notFound } from 'next/navigation';
import ProfilePerformanceWorkspace from '@/components/analytics/ProfilePerformanceWorkspace';
import { isLocale } from '@/i18n.config';

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <ProfilePerformanceWorkspace locale={locale} />;
}
