import { notFound } from 'next/navigation';
import PublicInformationPage from '@/components/public/PublicInformationPage';
import { isLocale } from '@/i18n.config';

interface ContactPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PublicInformationPage locale={locale} pageKey="contact" />;
}
