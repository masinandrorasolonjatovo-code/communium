import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ClerkProvider } from '@clerk/nextjs';
import DevIndicatorDisabler from '@/components/DevIndicatorDisabler';
import Header from '@/components/Header';
import ProfileBootstrapSync from '@/components/ProfileBootstrapSync';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getInitialThemeScript } from '@/components/theme-config';
import { isLocale, isSupportedLocale, rtlLocales, supportedLocales } from '@/i18n.config';
import type { Metadata, Viewport } from 'next';
import './globals.css';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export async function generateStaticParams() {
  return supportedLocales.map((locale) => ({
    locale,
  }));
}

export const metadata: Metadata = {
  title: 'Communium',
  description: 'Connect, Learn, Grow',
  icons: {
    icon: [
      {
        url: '/communium_logo.svg',
        type: 'image/png',
      },
    ],
    shortcut: '/communium_logo.svg',
    apple: '/communium_logo.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale) || !isSupportedLocale(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = rtlLocales.includes(locale);
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || undefined;
  const signInUrl = `/${locale}/auth/sign-in`;
  const signUpUrl = `/${locale}/auth/select-account-type`;
  const afterSignOutUrl = `/${locale}`;

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          id="communium-initial-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: getInitialThemeScript() }}
        />
        <div className="siteAmbientLayer" aria-hidden="true">
          <span className="ambientGrid" />
          <span className="ambientOrb ambientOrbOne" />
          <span className="ambientOrb ambientOrbTwo" />
          <span className="ambientOrb ambientOrbThree" />
          <span className="ambientLine ambientLineOne" />
          <span className="ambientLine ambientLineTwo" />
        </div>

        <div className="siteChrome">
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            signInUrl={signInUrl}
            signUpUrl={signUpUrl}
            afterSignOutUrl={afterSignOutUrl}
          >
            <ThemeProvider>
              <NextIntlClientProvider messages={messages} locale={locale}>
                <DevIndicatorDisabler />
                <ProfileBootstrapSync />
                <Header locale={locale} />
                {children}
              </NextIntlClientProvider>
            </ThemeProvider>
          </ClerkProvider>
        </div>
      </body>
    </html>
  );
}
