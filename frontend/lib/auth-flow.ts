import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale, type Locale } from '@/i18n.config';
import {
  buildCheckoutHref,
  resolveFlowPaymentMethodId,
  resolveFlowPlanId,
} from '@/lib/checkout-flow';

export type AccountType = 'personal' | 'business';

export interface AuthFlowQuery {
  flow?: string | null;
  plan?: string | null;
  method?: string | null;
  accountType?: string | null;
  redirect?: string | null;
  email?: string | null;
}

function safeLocale(locale?: string): Locale {
  return isLocale(locale) ? locale : defaultLocale;
}

function sanitizeRedirect(value?: string | null) {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '';
  }

  return trimmed;
}

export function resolveAccountType(value?: string | null): AccountType {
  return value === 'business' ? 'business' : 'personal';
}

export function buildAuthQueryString(query: AuthFlowQuery) {
  const search = new URLSearchParams();

  if (query.flow) {
    search.set('flow', query.flow);
  }

  if (query.plan) {
    search.set('plan', query.plan);
  }

  if (query.method) {
    search.set('method', query.method);
  }

  if (query.accountType) {
    search.set('accountType', resolveAccountType(query.accountType));
  }

  if (query.email) {
    search.set('email', query.email);
  }

  const redirect = sanitizeRedirect(query.redirect);
  if (redirect) {
    search.set('redirect', redirect);
  }

  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

function appendQuery(href: string, query: AuthFlowQuery = {}) {
  return `${href}${buildAuthQueryString(query)}`;
}

export function buildSignInHref(locale: string | undefined, query: AuthFlowQuery = {}) {
  return appendQuery(localizeHref(locale, '/auth/sign-in'), query);
}

export function buildSignUpFormHref(locale: string | undefined, query: AuthFlowQuery = {}) {
  return appendQuery(localizeHref(locale, '/auth/sign-up'), query);
}

export function buildSignUpEntryHref(locale: string | undefined, query: AuthFlowQuery = {}) {
  return appendQuery(localizeHref(locale, '/auth/select-account-type'), query);
}

export function buildForgotPasswordHref(locale: string | undefined, query: AuthFlowQuery = {}) {
  return appendQuery(localizeHref(locale, '/auth/forgot-password'), query);
}

export function buildResetPasswordHref(locale: string | undefined, query: AuthFlowQuery = {}) {
  return appendQuery(localizeHref(locale, '/auth/reset-password'), query);
}

export function buildVerifyEmailHref(locale: string | undefined, query: AuthFlowQuery = {}) {
  return appendQuery(localizeHref(locale, '/auth/verify-email'), query);
}

export function resolvePostAuthRedirect(
  locale: string | undefined,
  query: Pick<AuthFlowQuery, 'flow' | 'plan' | 'method' | 'redirect'>,
  fallbackPath = '/dashboard',
) {
  const redirect = sanitizeRedirect(query.redirect);
  if (redirect) {
    return redirect;
  }

  const planId = resolveFlowPlanId(query.plan);
  const methodId = resolveFlowPaymentMethodId(query.method);

  if (query.flow === 'checkout' && planId) {
    return buildCheckoutHref(safeLocale(locale), planId, methodId);
  }

  return localizeHref(safeLocale(locale), fallbackPath);
}
