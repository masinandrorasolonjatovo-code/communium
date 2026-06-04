import ProfessionalMessagesWorkspace from '@/components/messages/ProfessionalMessagesWorkspace';
import { defaultLocale, isLocale, type Locale } from '@/i18n.config';

interface MessagesPageProps {
  params: Promise<{
    locale?: string;
  }>;
}

export default async function MessagesPage({ params }: MessagesPageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return <ProfessionalMessagesWorkspace locale={locale} />;
}
