import { notFound } from 'next/navigation';
import { BillingWorkspace } from '@/components/governance/AccountGovernanceWorkspace';
import { isLocale } from '@/i18n.config';

export default async function BillingInvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <BillingWorkspace locale={locale} mode="invoices" />;
}
