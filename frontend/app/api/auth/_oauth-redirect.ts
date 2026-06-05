import { NextRequest, NextResponse } from 'next/server';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale } from '@/i18n.config';
import { buildAuthQueryString, type AuthFlowQuery } from '@/lib/auth-flow';

type OAuthProvider = 'google' | 'github' | 'apple' | 'linkedin';

export function buildOAuthStartRedirect(request: NextRequest, provider: OAuthProvider) {
  const locale = request.nextUrl.searchParams.get('locale');
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const query: AuthFlowQuery = {
    flow: request.nextUrl.searchParams.get('flow'),
    plan: request.nextUrl.searchParams.get('plan'),
    method: request.nextUrl.searchParams.get('method'),
    redirect: request.nextUrl.searchParams.get('redirect'),
  };

  const signInHref = `${localizeHref(safeLocale, '/auth/sign-in')}${buildAuthQueryString(query)}`;
  const destination = new URL(signInHref, request.url);
  destination.searchParams.set('oauth', provider);

  return NextResponse.redirect(destination);
}
