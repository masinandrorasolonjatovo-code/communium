import { localizeHref } from '@/components/locale-path';

export type FlowPlanId = 'silver' | 'gold' | 'platinum';
export type FlowPaymentMethodId = 'card-maroc' | 'card-international' | 'paypal';

type SupportedCopyLocale = 'fr' | 'en';

interface PlanCatalogEntry {
  accent: 'silver' | 'gold' | 'platinum';
  monthlyMad: number;
  monthlyUsd: number;
  trialDays?: number;
  eyebrow: Record<SupportedCopyLocale, string>;
  title: Record<SupportedCopyLocale, string>;
  summary: Record<SupportedCopyLocale, string>;
  badge: Record<SupportedCopyLocale, string>;
  features: Record<SupportedCopyLocale, string[]>;
}

interface PaymentMethodCatalogEntry {
  id: FlowPaymentMethodId;
  processor: string;
  title: Record<SupportedCopyLocale, string>;
  subtitle: Record<SupportedCopyLocale, string>;
  detail: Record<SupportedCopyLocale, string>;
  isManual: boolean;
}

const planCatalog: Record<FlowPlanId, PlanCatalogEntry> = {
  silver: {
    accent: 'silver',
    monthlyMad: 100,
    monthlyUsd: 9.99,
    trialDays: 30,
    eyebrow: {
      fr: 'Pack Silver',
      en: 'Silver Pack',
    },
    title: {
      fr: 'Essai propre et pro',
      en: 'Clean professional start',
    },
    summary: {
      fr: '0 DH pendant 1 mois, puis abonnement mensuel pour rester visible et actif.',
      en: 'Free for one month, then a monthly subscription to stay visible and active.',
    },
    badge: {
      fr: '1 mois offert',
      en: '1 month free',
    },
    features: {
      fr: ['Essai gratuit 30 jours', 'Profil professionnel de base', 'Page membre et reseau essentiel'],
      en: ['30-day free trial', 'Professional base profile', 'Member page and essential network'],
    },
  },
  gold: {
    accent: 'gold',
    monthlyMad: 250,
    monthlyUsd: 24.99,
    eyebrow: {
      fr: 'Pack Gold',
      en: 'Gold Pack',
    },
    title: {
      fr: 'Visibilite renforcee',
      en: 'Stronger visibility',
    },
    summary: {
      fr: 'Plus de presence, plus de vues et une priorite plus forte dans le reseau.',
      en: 'More presence, more views, and stronger priority in the network.',
    },
    badge: {
      fr: 'Plus visible',
      en: 'More visible',
    },
    features: {
      fr: ['Plus de vues sur le profil', 'Mise en avant dans le reseau', 'Activation prioritaire des opportunites'],
      en: ['More profile views', 'Highlighted in the network', 'Priority opportunity activation'],
    },
  },
  platinum: {
    accent: 'platinum',
    monthlyMad: 500,
    monthlyUsd: 49.99,
    eyebrow: {
      fr: 'Pack Platinum',
      en: 'Platinum Pack',
    },
    title: {
      fr: 'Presence premium',
      en: 'Premium presence',
    },
    summary: {
      fr: 'Diffusion premium, traitement prioritaire et image haut de gamme.',
      en: 'Premium distribution, priority handling, and top-tier brand image.',
    },
    badge: {
      fr: 'Elite',
      en: 'Elite',
    },
    features: {
      fr: ['Diffusion premium du profil', 'Traitement ultra prioritaire', 'Accompagnement VIP et image elite'],
      en: ['Premium profile distribution', 'Ultra priority handling', 'VIP support and elite image'],
    },
  },
};

const paymentMethodCatalog: PaymentMethodCatalogEntry[] = [
  {
    id: 'card-maroc',
    processor: 'CMI',
    title: {
      fr: 'Carte bancaire marocaine',
      en: 'Moroccan bank card',
    },
    subtitle: {
      fr: 'Paiement local en MAD',
      en: 'Local payment in MAD',
    },
    detail: {
      fr: 'Parcours separe pour les cartes marocaines, connecte au flux CMI.',
      en: 'Dedicated flow for Moroccan cards, connected to the CMI path.',
    },
    isManual: false,
  },
  {
    id: 'card-international',
    processor: 'Stripe',
    title: {
      fr: 'Carte bancaire etrangere',
      en: 'International bank card',
    },
    subtitle: {
      fr: 'Paiement international via Stripe',
      en: 'International payment through Stripe',
    },
    detail: {
      fr: 'Pour Visa, Mastercard et cartes etrangeres avec un checkout separe.',
      en: 'For Visa, Mastercard and foreign cards with a dedicated checkout.',
    },
    isManual: false,
  },
  {
    id: 'paypal',
    processor: 'PayPal',
    title: {
      fr: 'PayPal',
      en: 'PayPal',
    },
    subtitle: {
      fr: 'Option secondaire a activer',
      en: 'Secondary option to activate',
    },
    detail: {
      fr: 'Le tunnel est prevu dans le site et peut etre branche des que le compte PayPal est configure.',
      en: 'The flow is integrated in the site and can be connected once the PayPal account is configured.',
    },
    isManual: true,
  },
];

function safeCopyLocale(locale?: string): SupportedCopyLocale {
  return locale === 'fr' ? 'fr' : 'en';
}

export function resolveFlowPlanId(value?: string | null): FlowPlanId | null {
  return value === 'silver' || value === 'gold' || value === 'platinum' ? value : null;
}

export function resolveFlowPaymentMethodId(value?: string | null): FlowPaymentMethodId | null {
  return value === 'card-maroc' || value === 'card-international' || value === 'paypal' ? value : null;
}

export function formatPlanAmount(planId: FlowPlanId, methodId: FlowPaymentMethodId, locale?: string) {
  const lang = safeCopyLocale(locale);
  const plan = planCatalog[planId];

  if (methodId === 'card-international') {
    return lang === 'fr' ? `${plan.monthlyUsd} USD / mois` : `${plan.monthlyUsd} USD / month`;
  }

  return lang === 'fr' ? `${plan.monthlyMad} DH / mois` : `${plan.monthlyMad} MAD / month`;
}

export function formatPlanMethodSummary(planId: FlowPlanId, methodId: FlowPaymentMethodId, locale?: string) {
  const lang = safeCopyLocale(locale);
  const plan = planCatalog[planId];
  const recurringAmount = formatPlanAmount(planId, methodId, locale);

  if (plan.trialDays) {
    return lang === 'fr'
      ? `1 mois gratuit puis ${recurringAmount}`
      : `1 month free then ${recurringAmount}`;
  }

  return recurringAmount;
}

export function formatPlanOffer(planId: FlowPlanId, locale?: string) {
  const lang = safeCopyLocale(locale);
  const plan = planCatalog[planId];

  if (plan.trialDays) {
    return lang === 'fr' ? `0 DH pendant ${plan.trialDays} jours` : `0 MAD for ${plan.trialDays} days`;
  }

  return `${plan.monthlyMad} DH`;
}

export function formatPlanRenewal(planId: FlowPlanId, locale?: string) {
  const lang = safeCopyLocale(locale);
  const plan = planCatalog[planId];

  if (plan.trialDays) {
    return lang === 'fr'
      ? `Puis ${plan.monthlyMad} DH / mois`
      : `Then ${plan.monthlyMad} MAD / month`;
  }

  return lang === 'fr' ? `Facturation mensuelle` : `Monthly billing`;
}

export function buildCheckoutHref(locale: string | undefined, planId: FlowPlanId, methodId?: FlowPaymentMethodId | null) {
  const href = localizeHref(locale, '/checkout');
  const search = new URLSearchParams({ plan: planId });

  if (methodId) {
    search.set('method', methodId);
  }

  return `${href}?${search.toString()}`;
}

export function buildAuthFlowHref(
  locale: string | undefined,
  target: 'sign-in' | 'sign-up',
  planId: FlowPlanId,
  methodId?: FlowPaymentMethodId | null
) {
  const href = localizeHref(locale, target === 'sign-in' ? '/auth/sign-in' : '/auth/select-account-type');
  const search = new URLSearchParams({
    flow: 'checkout',
    plan: planId,
  });

  if (methodId) {
    search.set('method', methodId);
  }

  return `${href}?${search.toString()}`;
}

export function getCheckoutFlowContent(locale?: string) {
  const lang = safeCopyLocale(locale);

  return {
    heroPrimaryCta: lang === 'fr' ? 'Voir les offres' : 'View offers',
    heroSecondaryCta: lang === 'fr' ? 'Creer un compte' : 'Create account',
    workflowSteps:
      lang === 'fr'
        ? ['Accueil', 'Voir les offres', 'Choisir abonnement', 'Creer compte', 'Paiement', 'Dashboard']
        : ['Home', 'View offers', 'Choose plan', 'Create account', 'Payment', 'Dashboard'],
    offersEyebrow: lang === 'fr' ? 'Abonnements' : 'Subscriptions',
    offersTitle:
      lang === 'fr'
        ? 'Un tunnel clair: offre, compte, paiement, dashboard.'
        : 'A clear flow: offer, account, payment, dashboard.',
    offersLead:
      lang === 'fr'
        ? 'Chaque pack te fait passer dans un parcours unique avec abonnement choisi avant la creation du compte puis paiement separe.'
        : 'Each plan follows one guided flow with plan choice before account creation and a dedicated payment step.',
    choosePlanCta: lang === 'fr' ? 'Choisir cet abonnement' : 'Choose this plan',
    signedInPlanCta: lang === 'fr' ? 'Continuer vers le paiement' : 'Continue to payment',
    paymentModesLabel: lang === 'fr' ? 'Modes de paiement' : 'Payment methods',
    paymentModes:
      lang === 'fr'
        ? ['Carte marocaine (CMI)', 'Carte etrangere (Stripe)', 'PayPal']
        : ['Moroccan card (CMI)', 'International card (Stripe)', 'PayPal'],
    checkoutEyebrow: lang === 'fr' ? 'Paiement' : 'Payment',
    checkoutTitle:
      lang === 'fr'
        ? 'Finalise ton abonnement avec un mode de paiement separe.'
        : 'Complete your subscription with a separated payment method.',
    checkoutLead:
      lang === 'fr'
        ? 'Choisis d abord le pack, puis le type de paiement adapte a la carte ou au portefeuille utilise.'
        : 'Choose the plan first, then the payment type that matches the card or wallet you want to use.',
    signedOutTitle: lang === 'fr' ? 'Compte requis avant paiement' : 'Account required before payment',
    signedOutLead:
      lang === 'fr'
        ? 'Le plan est memorise. Cree ton compte ou reconnecte-toi, puis tu reviendras directement ici.'
        : 'Your plan is preserved. Create your account or sign in, then you will come back here directly.',
    signUpCta: lang === 'fr' ? 'Creer mon compte' : 'Create my account',
    signInCta: lang === 'fr' ? 'J ai deja un compte' : 'I already have an account',
    payCta: lang === 'fr' ? 'Payer maintenant' : 'Pay now',
    dashboardCta: lang === 'fr' ? 'Aller au dashboard' : 'Go to dashboard',
    methodTitle: lang === 'fr' ? 'Choisis ton mode de paiement' : 'Choose your payment method',
    summaryTitle: lang === 'fr' ? 'Recapitulatif' : 'Summary',
    includedLabel: lang === 'fr' ? 'Inclus dans le pack' : 'Included in the plan',
    selectedMethodLabel: lang === 'fr' ? 'Mode choisi' : 'Selected method',
    nextStepLabel: lang === 'fr' ? 'Etape suivante' : 'Next step',
    manualLabel: lang === 'fr' ? 'Activation manuelle' : 'Manual activation',
    liveLabel: lang === 'fr' ? 'Pret a payer' : 'Ready to pay',
    plans: (Object.entries(planCatalog) as Array<[FlowPlanId, PlanCatalogEntry]>).map(([id, plan]) => ({
      id,
      accent: plan.accent,
      eyebrow: plan.eyebrow[lang],
      title: plan.title[lang],
      summary: plan.summary[lang],
      badge: plan.badge[lang],
      features: plan.features[lang],
      offerPrice: formatPlanOffer(id, lang),
      renewalLabel: formatPlanRenewal(id, lang),
      monthlyMadLabel: lang === 'fr' ? `${plan.monthlyMad} DH / mois` : `${plan.monthlyMad} MAD / month`,
      monthlyUsdLabel: `${plan.monthlyUsd} USD / ${lang === 'fr' ? 'mois' : 'month'}`,
    })),
    paymentMethods: paymentMethodCatalog.map((method) => ({
      ...method,
      title: method.title[lang],
      subtitle: method.subtitle[lang],
      detail: method.detail[lang],
    })),
  };
}
