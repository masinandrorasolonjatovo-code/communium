import { notFound } from 'next/navigation';
import PartnersWorkspace from '@/components/governance/PartnersWorkspace';
import { isLocale } from '@/i18n.config';

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PartnersWorkspace locale={locale} />;
}
