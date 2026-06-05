import { notFound } from 'next/navigation';
import AdminVerificationWorkspace from '@/components/verification/AdminVerificationWorkspace';
import { isLocale } from '@/i18n.config';

export default async function AdminVerificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AdminVerificationWorkspace locale={locale} />;
}
