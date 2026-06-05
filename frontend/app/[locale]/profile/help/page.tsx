import { notFound } from 'next/navigation';
import MemberAccountRoutePage from '@/components/member/MemberAccountRoutePage';
import { isLocale } from '@/i18n.config';

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <MemberAccountRoutePage locale={locale} pageKey="help" />;
}
