import { redirect } from 'next/navigation';
import { localizeHref } from '@/components/locale-path';

interface DashboardPostsRedirectProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DashboardPostsRedirect({ params }: DashboardPostsRedirectProps) {
  const { locale } = await params;
  redirect(localizeHref(locale, '/feed'));
}
