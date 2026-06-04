import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import NetworkCenter from '@/components/network/NetworkCenter';
import { isLocale } from '@/i18n.config';

interface DiscoverPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <NetworkCenter locale={locale} />
    </Suspense>
  );
}
