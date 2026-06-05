import { notFound } from 'next/navigation';
import PublicInformationPage from '@/components/public/PublicInformationPage';
import { isLocale } from '@/i18n.config';

interface TermsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PublicInformationPage locale={locale} pageKey="terms" />;
}
