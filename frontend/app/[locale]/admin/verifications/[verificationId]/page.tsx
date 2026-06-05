import { notFound } from 'next/navigation';
import AdminVerificationWorkspace from '@/components/verification/AdminVerificationWorkspace';
import { isLocale } from '@/i18n.config';

export default async function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; verificationId: string }>;
}) {
  const { locale, verificationId } = await params;

  if (!isLocale(locale) || !verificationId) {
    notFound();
  }

  return <AdminVerificationWorkspace locale={locale} initialVerificationId={verificationId} />;
}
