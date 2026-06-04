import { notFound } from 'next/navigation';
import LegalDocumentPage from '@/components/governance/LegalDocumentPage';
import { isLocale } from '@/i18n.config';

export default async function LegalTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <LegalDocumentPage locale={locale} mode="terms" />;
}
