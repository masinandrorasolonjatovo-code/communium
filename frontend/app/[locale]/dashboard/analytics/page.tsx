import { redirect } from 'next/navigation';
import { localizeHref } from '@/components/locale-path';

interface DashboardAnalyticsRedirectProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DashboardAnalyticsRedirect({ params }: DashboardAnalyticsRedirectProps) {
  const { locale } = await params;
  redirect(localizeHref(locale, '/dashboard/statistics'));
}
