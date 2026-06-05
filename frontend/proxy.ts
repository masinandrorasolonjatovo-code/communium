import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { locales, defaultLocale, isLocale, isSupportedLocale } from './i18n.config';

const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
  '/:locale/messages(.*)',
  '/:locale/notifications(.*)',
  '/:locale/checkout(.*)',
  '/:locale/billing(.*)',
  '/:locale/business(.*)',
  '/:locale/settings(.*)',
  '/:locale/profile',
  '/:locale/profile/business(.*)',
  '/:locale/profile/edit(.*)',
  '/:locale/profile/studio(.*)',
  '/:locale/profile/privacy(.*)',
  '/:locale/profile/cv(.*)',
  '/:locale/profile/preview(.*)',
  '/:locale/profile/settings(.*)',
  '/:locale/profile/help(.*)',
  '/:locale/verification(.*)',
  '/:locale/admin(.*)',
]);

function resolveRequestLocale(pathname: string) {
  const localeSegment = pathname.split('/').filter(Boolean)[0];
  return isLocale(localeSegment) ? localeSegment : defaultLocale;
}

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Redirect root path to default locale
  if (request.nextUrl.pathname === '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(redirectUrl);
  }

  const locale = resolveRequestLocale(request.nextUrl.pathname);

  if (isLocale(locale) && !isSupportedLocale(locale)) {
    const redirectUrl = request.nextUrl.clone();
    const segments = redirectUrl.pathname.split('/').filter(Boolean);

    if (segments.length) {
      segments[0] = defaultLocale;
      redirectUrl.pathname = `/${segments.join('/')}`;
    } else {
      redirectUrl.pathname = `/${defaultLocale}`;
    }

    return NextResponse.redirect(redirectUrl);
  }

  if (isProtectedRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: new URL(`/${locale}/auth/sign-in`, request.url).toString(),
    });
  }

  return handleI18nRouting(request);
});

export const config = {
  matcher: [
    '/',
    '/api/auth/(.*)',
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ],
};
