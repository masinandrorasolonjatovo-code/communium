'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Crown,
  Gem,
  Globe2,
  LockKeyhole,
  Medal,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPlanLabel, formatSubscriptionStatus } from '@/components/localized-labels';
import { localizeHref } from '@/components/locale-path';
import PublicExperienceFrame from '@/components/public/PublicExperienceFrame';

type PremiumMode = 'marketing' | 'checkout' | 'dashboard' | 'success';
type PlanId = 'free' | 'silver' | 'gold' | 'platinum';
type PaymentProvider = 'CMI' | 'STRIPE' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY';
type BillingCycle = 'monthly' | 'annual';

interface CheckoutPaymentForm {
  email: string;
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  country: string;
  postalCode: string;
  verificationCode: string;
  saveMethod: boolean;
  termsAccepted: boolean;
}

interface PremiumSaasWorkspaceProps {
  locale: string;
  mode?: PremiumMode;
  initialPlan?: string;
}

interface SubscriptionState {
  currentSubscription?: {
    plan?: string;
    status?: string;
    renewsAt?: string | null;
    expiresAt?: string | null;
  } | null;
  plans?: Array<{ id: string; plan: string; amountTTC: number; currency?: string }>;
}

interface PaymentRow {
  id: string;
  provider: string;
  status: string;
  amountTTC: number;
  currency: string;
  createdAt?: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
}

interface AnalyticsPayload {
  profile?: {
    views: number;
    reach: number;
    growth: number;
    visitors: number;
    connections: number;
  };
  premium?: {
    visibilityScore: number;
    postPerformance: number;
    clickThrough: number;
    opportunityIndex: number;
  };
  series?: Array<{ label: string; views: number; reach: number; engagement: number }>;
}

const plans = [
  {
    id: 'free',
    icon: BadgeCheck,
    name: 'Gratuit',
    price: '0 DH',
    cadence: 'Toujours gratuit',
    badge: 'Base',
    summary: 'Profil basique, visibilite normale et reseau limite.',
    features: ['Profil basique', 'Visibilite normale', 'Reseau limite'],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'silver',
    icon: Medal,
    name: 'Silver',
    price: '100 DH',
    cadence: 'par mois',
    badge: 'Croissance',
    summary: 'Visibilite amelioree, acces reseau avance et badge membre.',
    features: ['Visibilite amelioree', 'Acces reseau avance', 'Badge membre'],
    cta: 'Choisir Silver',
  },
  {
    id: 'gold',
    icon: Crown,
    name: 'Gold',
    price: '250 DH',
    cadence: 'par mois',
    badge: 'Recommande',
    summary: 'Priorite dans les suggestions, statistiques avancees et boost profil.',
    features: ['Priorite suggestions', 'Statistiques avancees', 'Boost profil', 'Badge premium'],
    cta: 'Choisir Gold',
  },
  {
    id: 'platinum',
    icon: Gem,
    name: 'Platinum',
    price: '500 DH',
    cadence: 'par mois',
    badge: 'Business',
    summary: 'Compte entreprise, analytics, IA avancee et branding premium.',
    features: ['Compte entreprise', 'Diffusion prioritaire', 'Analytics', 'IA avancee', 'Branding premium'],
    cta: 'Choisir Platinum',
  },
] as const;

const paymentMethods = [
  {
    id: 'CMI',
    group: 'Carte bancaire locale',
    title: 'CMI Maroc',
    subtitle: 'Paiement local en MAD',
    meta: 'Cartes marocaines',
    icon: ShieldCheck,
  },
  {
    id: 'STRIPE',
    group: 'Carte internationale',
    title: 'Stripe',
    subtitle: 'Visa et Mastercard',
    meta: 'Paiement international',
    icon: CreditCard,
  },
  {
    id: 'PAYPAL',
    group: 'Wallets',
    title: 'PayPal',
    subtitle: 'Portefeuille numerique',
    meta: 'Wallet',
    icon: WalletCards,
  },
  {
    id: 'APPLE_PAY',
    group: 'Wallets',
    title: 'Apple Pay',
    subtitle: 'Paiement rapide',
    meta: 'Wallet',
    icon: WalletCards,
  },
  {
    id: 'GOOGLE_PAY',
    group: 'Wallets',
    title: 'Google Pay',
    subtitle: 'Paiement rapide',
    meta: 'Wallet',
    icon: WalletCards,
  },
] as const;

const comparisonRows = [
  ['Vues profil', 'Standard', 'Ameliorees', 'Boostees', 'Prioritaires'],
  ['Publications', 'Limitees', 'Standard', 'Prioritaires', 'Business'],
  ['Messages', 'Limites', 'Avances', 'Avances', 'Prioritaires'],
  ['Visibilite', 'Normale', 'Amelioree', 'Renforcee', 'Premium'],
  ['Statistiques', '-', 'Basique', 'Avancees', 'Analytics'],
  ['Verification', '-', 'Badge membre', 'Badge premium', 'Traitement prioritaire'],
  ['Priorite reseau', '-', 'Moyenne', 'Haute', 'Maximale'],
  ['Support', 'Standard', 'Standard', 'Prioritaire', 'Prioritaire'],
  ['IA', '-', '-', 'Suggestions', 'IA avancee'],
  ['Branding', '-', '-', 'Premium', 'Premium business'],
];

const fallbackAnalytics: AnalyticsPayload = {
  profile: { views: 0, reach: 0, growth: 0, visitors: 0, connections: 0 },
  premium: { visibilityScore: 0, postPerformance: 0, clickThrough: 0, opportunityIndex: 0 },
  series: [
    { label: 'S1', views: 0, reach: 0, engagement: 0 },
    { label: 'S2', views: 0, reach: 0, engagement: 0 },
    { label: 'S3', views: 0, reach: 0, engagement: 0 },
    { label: 'S4', views: 0, reach: 0, engagement: 0 },
  ],
};

function resolvePlan(value?: string | null): PlanId {
  return value === 'free' || value === 'silver' || value === 'gold' || value === 'platinum' ? value : 'gold';
}

function planName(plan: PlanId) {
  return plans.find((item) => item.id === plan)?.name || 'Gold';
}

function formatMoney(value?: number, currency = 'MAD') {
  return `${Number(value || 0).toLocaleString('fr-FR')} ${currency === 'MAD' ? 'DH' : currency}`;
}

function numericValue(value: string) {
  return value.replace(/\D/g, '');
}

function formatCardNumberInput(value: string) {
  return numericValue(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiryInput(value: string) {
  const digits = numericValue(value).slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function cardBrand(cardNumber: string) {
  const digits = numericValue(cardNumber);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Carte';
}

function planMonthlyAmount(plan: PlanId) {
  return plan === 'silver' ? 100 : plan === 'gold' ? 250 : plan === 'platinum' ? 500 : 0;
}

async function parseApi<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || 'Action indisponible pour le moment.');
  }
  return body as T;
}

function PremiumChart({ data }: { data: NonNullable<AnalyticsPayload['series']> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let chart: { destroy: () => void } | null = null;
    let mounted = true;

    void (async () => {
      const chartModule = await import('chart.js/auto');
      if (!mounted || !canvasRef.current) {
        return;
      }

      chart = new chartModule.default(canvasRef.current, {
        type: 'line',
        data: {
          labels: data.map((item) => item.label),
          datasets: [
            {
              label: 'Vues',
              data: data.map((item) => item.views),
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              tension: 0.42,
              fill: true,
            },
            {
              label: 'Portee',
              data: data.map((item) => item.reach),
              borderColor: '#0f172a',
              backgroundColor: 'rgba(15, 23, 42, 0.06)',
              tension: 0.42,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(148, 163, 184, 0.16)' } },
          },
        },
      });
    })();

    return () => {
      mounted = false;
      chart?.destroy();
    };
  }, [data]);

  return <canvas ref={canvasRef} aria-label="Evolution premium" />;
}

export default function PremiumSaasWorkspace({ locale, mode = 'checkout', initialPlan }: PremiumSaasWorkspaceProps) {
  const params = useParams<{ locale?: string }>();
  const searchParams = useSearchParams();
  const safeLocale = locale || params?.locale || 'fr';
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(resolvePlan(initialPlan || searchParams.get('plan')));
  const [selectedPayment, setSelectedPayment] = useState<PaymentProvider>('CMI');
  const [activeStep, setActiveStep] = useState(mode === 'success' ? 5 : mode === 'checkout' ? 1 : 0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [seats, setSeats] = useState(1);
  const [paymentForm, setPaymentForm] = useState<CheckoutPaymentForm>({
    email: '',
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    country: 'Maroc',
    postalCode: '',
    verificationCode: '',
    saveMethod: true,
    termsAccepted: false,
  });
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPayload>(fallbackAnalytics);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [devPaymentCode, setDevPaymentCode] = useState('');

  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan) || plans[2];
  const selectedPaymentData = paymentMethods.find((method) => method.id === selectedPayment) || paymentMethods[0];
  const monthlyAmount = planMonthlyAmount(selectedPlan);
  const subtotal = monthlyAmount * seats * (billingCycle === 'annual' ? 12 : 1);
  const discount = billingCycle === 'annual' ? Math.round(subtotal * 0.2) : 0;
  const amountDue = Math.max(0, subtotal - discount);
  const cardDigits = numericValue(paymentForm.cardNumber);
  const verificationComplete = numericValue(paymentForm.verificationCode).length === 6;
  const paymentFormReady =
    selectedPlan === 'free' ||
    (paymentForm.email.includes('@') &&
      paymentForm.cardholder.trim().length >= 3 &&
      cardDigits.length >= 13 &&
      paymentForm.expiry.length === 5 &&
      numericValue(paymentForm.cvc).length >= 3 &&
      verificationComplete &&
      paymentForm.termsAccepted);
  const dashboardHref = localizeHref(safeLocale, '/dashboard');
  const checkoutHref = localizeHref(safeLocale, `/checkout?plan=${selectedPlan}`);
  const successHref = localizeHref(safeLocale, `/checkout/success?plan=${selectedPlan}`);
  const currentMode: PremiumMode = searchParams.get('success') === '1' ? 'success' : mode;

  const groupedPayments = useMemo(
    () =>
      paymentMethods.reduce<Record<string, typeof paymentMethods[number][]>>((groups, method) => {
        groups[method.group] = [...(groups[method.group] || []), method];
        return groups;
      }, {}),
    [],
  );

  async function authHeaders() {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (user?.id) headers.set('x-user-id', user.id);
    if (user?.fullName) headers.set('x-user-name', user.fullName);
    if (user?.username) headers.set('x-user-username', user.username);
    if (user?.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
    return headers;
  }

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    setPaymentForm((current) => ({
      ...current,
      email: current.email || user.primaryEmailAddress?.emailAddress || '',
      cardholder: current.cardholder || user.fullName || '',
    }));

    void (async () => {
      try {
        const headers = await authHeaders();
        const [subscriptionBody, historyBody, profileAnalyticsBody, premiumAnalyticsBody] = await Promise.all([
          fetch('/api/subscriptions', { headers, cache: 'no-store' }).then((res) => parseApi<{ data: SubscriptionState }>(res)),
          fetch('/api/payments/history', { headers, cache: 'no-store' }).then((res) => parseApi<{ data: PaymentRow[] }>(res)),
          fetch('/api/analytics/profile', { headers, cache: 'no-store' }).then((res) => parseApi<{ data: AnalyticsPayload }>(res)),
          fetch('/api/analytics/premium', { headers, cache: 'no-store' }).then((res) => parseApi<{ data: AnalyticsPayload }>(res)),
        ]);
        setSubscription(subscriptionBody.data);
        setPayments(historyBody.data || []);
        setAnalytics({
          ...fallbackAnalytics,
          ...profileAnalyticsBody.data,
          premium: premiumAnalyticsBody.data.premium || profileAnalyticsBody.data.premium || fallbackAnalytics.premium,
          series: premiumAnalyticsBody.data.series || profileAnalyticsBody.data.series || fallbackAnalytics.series,
        });
      } catch {
        setAnalytics(fallbackAnalytics);
      }
    })();
  }, [isLoaded, user?.id]);

  async function selectPlan(plan: PlanId) {
    setSelectedPlan(plan);
    setActiveStep(plan === 'free' ? 5 : 2);

    if (!user || plan !== 'free') {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/select', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ plan }),
      });
      const body = await parseApi<{ data: SubscriptionState }>(response);
      setSubscription(body.data);
      setStatus('Plan gratuit actif.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Selection indisponible.');
    }
  }

  function updatePaymentForm<K extends keyof CheckoutPaymentForm>(key: K, value: CheckoutPaymentForm[K]) {
    setPaymentForm((current) => ({ ...current, [key]: value }));
    setActiveStep((step) => Math.max(step, 3));
    setStatus('');
    if (key === 'email') {
      setCodeExpiresAt(null);
      setDevPaymentCode('');
    }
  }

  async function resendVerificationCode() {
    if (!user) {
      setStatus('Connectez-vous pour recevoir le code de paiement.');
      return;
    }

    const email = paymentForm.email || user.primaryEmailAddress?.emailAddress || '';
    if (!email.includes('@')) {
      setStatus('Ajoutez une adresse e-mail valide avant de recevoir le code.');
      return;
    }

    try {
      setCodeSending(true);
      setStatus('');
      setDevPaymentCode('');
      setPaymentForm((current) => ({ ...current, verificationCode: '' }));
      const response = await fetch('/api/payments/verification-code', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          email,
          plan: selectedPlan,
          provider: selectedPayment,
          billingCycle,
          seats,
        }),
      });
      const body = await parseApi<{ data: { email: string; expiresAt: string; emailSent: boolean; devCode?: string } }>(response);
      setCodeExpiresAt(body.data.expiresAt);
      if (body.data.devCode) {
        setDevPaymentCode(body.data.devCode);
        setStatus(`Mode local: code de test ${body.data.devCode}. Configurez Resend pour l'envoi e-mail reel.`);
        return;
      }
      setStatus(
        body.data.emailSent
          ? `Code de paiement envoye a ${body.data.email}.`
          : `Code cree pour ${body.data.email}. Service e-mail non configure.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Impossible d'envoyer le code de paiement.");
    } finally {
      setCodeSending(false);
    }
  }

  async function createPayment() {
    if (!user) {
      setStatus('Connectez-vous pour finaliser le paiement.');
      return;
    }

    if (selectedPlan === 'free') {
      await selectPlan('free');
      return;
    }

    if (!paymentFormReady) {
      setStatus('Complete le formulaire de paiement, le code recu et les conditions avant de valider.');
      setActiveStep(3);
      return;
    }

    try {
      setBusy(true);
      setStatus('');
      setActiveStep(4);
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          plan: selectedPlan,
          provider: selectedPayment,
          locale: safeLocale,
          billingCycle,
          seats,
          cardBrand: cardBrand(paymentForm.cardNumber),
          cardLast4: cardDigits.slice(-4),
          billingEmail: paymentForm.email,
          verificationCode: numericValue(paymentForm.verificationCode),
        }),
      });
      const body = await parseApi<{ data: { redirectUrl?: string | null; configured?: boolean; paymentId?: string; message?: string } }>(response);

      if (body.data.redirectUrl) {
        window.location.href = body.data.redirectUrl;
        return;
      }

      setStatus(body.data.message || 'Paiement en attente de confirmation passerelle.');
      setActiveStep(3);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Paiement indisponible.');
      setActiveStep(2);
    } finally {
      setBusy(false);
    }
  }

  function renderPlanCards() {
    return (
      <section className="saasPanel plansPanel">
        <div className="sectionHead">
          <span className="eyebrow">Offres Premium</span>
          <h2>Choisis le niveau adapte a ta croissance</h2>
        </div>
        <div className="plansGrid">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const selected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                className={selected ? `planCard ${plan.id} selected` : `planCard ${plan.id}`}
                onClick={() => void selectPlan(plan.id)}
              >
                <div className="planTop">
                  <span className="planIcon"><Icon size={20} /></span>
                  <span className="planBadge">{plan.badge}</span>
                </div>
                <strong>{plan.name}</strong>
                <div className="priceLine"><span>{plan.price}</span><small>{plan.cadence}</small></div>
                <p>{plan.summary}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}><Check size={15} />{feature}</li>
                  ))}
                </ul>
                <span className="planCta">{selected ? 'Pack selectionne' : plan.cta}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  function renderComparison() {
    return (
      <section className="saasPanel comparisonPanel">
        <div className="sectionHead">
          <span className="eyebrow">Comparaison</span>
          <h2>Une lecture claire des limites et avantages</h2>
        </div>
        <div className="comparisonTable">
          <div className="comparisonRow header"><strong>Fonction</strong><strong>Gratuit</strong><strong>Silver</strong><strong>Gold</strong><strong>Platinum</strong></div>
          {comparisonRows.map((row) => (
            <div className="comparisonRow" key={row[0]}>
              {row.map((cell, index) => <span key={`${row[0]}-${index}`}>{cell}</span>)}
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderPayment() {
    return (
      <section className="saasPanel paymentPanel">
        <div className="sectionHead">
          <span className="eyebrow">Paiement securise</span>
          <h2>Choisis le rail de paiement</h2>
        </div>
        <div className="paymentGroups">
          {Object.entries(groupedPayments).map(([group, methods]) => (
            <div className="paymentGroup" key={group}>
              <h3>{group}</h3>
              <div className="methodGrid">
                {methods.map((method) => {
                  const Icon = method.icon;
                  const selected = selectedPayment === method.id;
                  return (
                    <button key={method.id} type="button" className={selected ? 'methodCard selected' : 'methodCard'} onClick={() => { setSelectedPayment(method.id); setActiveStep(3); }}>
                      <span><Icon size={18} />{method.meta}</span>
                      <strong>{method.title}</strong>
                      <small>{method.subtitle}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderPaymentForm() {
    if (selectedPlan === 'free') {
      return null;
    }

    return (
      <section className="saasPanel paymentFormPanel">
        <div className="sectionHead">
          <span className="eyebrow">Formulaire paiement</span>
          <h2>Complete les informations avant l'encaissement</h2>
        </div>

        <div className="paymentCheckoutGrid">
          <div className="paymentFormStack">
            <div className="billingToggle">
              <button type="button" className={billingCycle === 'monthly' ? 'selected' : ''} onClick={() => setBillingCycle('monthly')}>
                <strong>Facturation mensuelle</strong>
                <span>{formatMoney(monthlyAmount)} / mois</span>
              </button>
              <button type="button" className={billingCycle === 'annual' ? 'selected' : ''} onClick={() => setBillingCycle('annual')}>
                <strong>Facturation annuelle</strong>
                <span>Economisez 20%</span>
              </button>
            </div>

            <div className="seatStepper">
              <span>
                <strong>Postes</strong>
                <small>{seats} abonnement{seats > 1 ? 's' : ''}</small>
              </span>
              <div>
                <button type="button" onClick={() => setSeats((value) => Math.max(1, value - 1))}>-</button>
                <strong>{seats}</strong>
                <button type="button" onClick={() => setSeats((value) => Math.min(50, value + 1))}>+</button>
              </div>
            </div>

            <label className="paymentField">
              <span>E-mail</span>
              <input
                value={paymentForm.email}
                onChange={(event) => updatePaymentForm('email', event.target.value)}
                placeholder="vous@email.com"
                inputMode="email"
              />
            </label>

            <div className="savedInfoBox">
              <div>
                <strong>Utiliser vos informations enregistrees</strong>
                <span>
                  {codeExpiresAt
                    ? `Saisissez le code envoye a ${paymentForm.email || 'votre e-mail'}`
                    : `Demandez un code pour ${paymentForm.email || 'votre e-mail'}`}
                </span>
              </div>
              <div className="verificationCode">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    value={paymentForm.verificationCode[index] || ''}
                    onChange={(event) => {
                      const digits = numericValue(`${paymentForm.verificationCode.slice(0, index)}${event.target.value}${paymentForm.verificationCode.slice(index + 1)}`).slice(0, 6);
                      updatePaymentForm('verificationCode', digits);
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Code ${index + 1}`}
                  />
                ))}
              </div>
              {codeExpiresAt ? (
                <small className="verificationHint">Expire a {new Date(codeExpiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
              ) : null}
              {devPaymentCode ? <small className="verificationHint">Code local: {devPaymentCode}</small> : null}
              <button
                type="button"
                className="textButton"
                onClick={() => void resendVerificationCode()}
                disabled={codeSending || !paymentForm.email.includes('@')}
              >
                {codeSending ? 'Envoi...' : 'Renvoyer le code'}
              </button>
            </div>

            <label className="paymentField cardNumberField">
              <span>Numero de carte</span>
              <input
                value={paymentForm.cardNumber}
                onChange={(event) => updatePaymentForm('cardNumber', formatCardNumberInput(event.target.value))}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
              />
              <small>{cardBrand(paymentForm.cardNumber)} - Visa - Mastercard - Discover</small>
            </label>

            <div className="paymentFieldGrid">
              <label className="paymentField">
                <span>Date d'expiration</span>
                <input
                  value={paymentForm.expiry}
                  onChange={(event) => updatePaymentForm('expiry', formatExpiryInput(event.target.value))}
                  placeholder="MM/AA"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                />
              </label>
              <label className="paymentField">
                <span>Code de securite</span>
                <input
                  value={paymentForm.cvc}
                  onChange={(event) => updatePaymentForm('cvc', numericValue(event.target.value).slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                />
              </label>
            </div>

            <label className="paymentField">
              <span>Nom sur la carte</span>
              <input
                value={paymentForm.cardholder}
                onChange={(event) => updatePaymentForm('cardholder', event.target.value)}
                placeholder="Nom complet"
                autoComplete="cc-name"
              />
            </label>

            <div className="paymentFieldGrid">
              <label className="paymentField">
                <span>Pays</span>
                <input value={paymentForm.country} onChange={(event) => updatePaymentForm('country', event.target.value)} />
              </label>
              <label className="paymentField">
                <span>Code postal</span>
                <input value={paymentForm.postalCode} onChange={(event) => updatePaymentForm('postalCode', event.target.value)} />
              </label>
            </div>

            <label className="paymentCheckLine">
              <input
                type="checkbox"
                checked={paymentForm.saveMethod}
                onChange={(event) => updatePaymentForm('saveMethod', event.target.checked)}
              />
              Enregistrer ce mode pour les renouvellements.
            </label>
            <label className="paymentCheckLine">
              <input
                type="checkbox"
                checked={paymentForm.termsAccepted}
                onChange={(event) => updatePaymentForm('termsAccepted', event.target.checked)}
              />
              J'accepte les conditions commerciales et l'abonnement mensuel.
            </label>
          </div>

          <aside className="checkoutPackageCard">
            <span className="eyebrow">Forfait {selectedPlanData.name}</span>
            <h3>{selectedPlanData.name}</h3>
            <p>Principales fonctionnalites</p>
            <ul>
              {selectedPlanData.features.map((feature) => (
                <li key={feature}><Sparkles size={15} />{feature}</li>
              ))}
            </ul>
            <div className="checkoutTotals">
              <span><small>{seats}x abonnement {billingCycle === 'annual' ? 'Annuel' : 'Mensuel'}</small><strong>{formatMoney(subtotal)}</strong></span>
              <span><small>Reduction</small><strong>-{formatMoney(discount)}</strong></span>
              <span><small>Taxes estimees</small><strong>0 DH</strong></span>
              <span className="due"><small>Du aujourd'hui</small><strong>{formatMoney(amountDue)}</strong></span>
            </div>
            <button type="button" className="subscribeButton" onClick={() => void createPayment()} disabled={busy || !paymentFormReady}>
              {busy ? 'Validation...' : "S'abonner"}
            </button>
            {!paymentFormReady ? <small className="formHint">Complete le code, la carte et les conditions pour continuer.</small> : null}
          </aside>
        </div>
      </section>
    );
  }

  function renderSummary() {
    return (
      <aside className="summaryCard">
        <span className="eyebrow">Resume</span>
        <h3>{selectedPlanData.name}</h3>
        <div className="summaryPrice"><strong>{formatMoney(amountDue)}</strong><span>{billingCycle === 'annual' ? 'annuel' : selectedPlanData.cadence}</span></div>
        <div className="summaryLine"><span>Paiement</span><strong>{selectedPaymentData.title}</strong></div>
        <div className="summaryLine"><span>Carte</span><strong>{cardDigits ? `${cardBrand(paymentForm.cardNumber)} **** ${cardDigits.slice(-4)}` : 'A remplir'}</strong></div>
        <div className="summaryLine"><span>Devise</span><strong>MAD</strong></div>
        <ul>
          {selectedPlanData.features.slice(0, 4).map((feature) => <li key={feature}><CheckCircle2 size={15} />{feature}</li>)}
        </ul>
        {status ? <p className="notice">{status}</p> : null}
        <button type="button" className="primaryAction" disabled={busy || (selectedPlan !== 'free' && !paymentFormReady)} onClick={() => void createPayment()}>
          {busy ? 'Validation...' : selectedPlan === 'free' ? 'Activer gratuit' : 'Valider le paiement'}
          <ArrowRight size={17} />
        </button>
      </aside>
    );
  }

  function renderAnalytics() {
    const profile = analytics.profile || fallbackAnalytics.profile!;
    const premium = analytics.premium || fallbackAnalytics.premium!;
    const series = analytics.series || fallbackAnalytics.series!;
    return (
      <section className="saasPanel dashboardPanel">
        <div className="sectionHead">
          <span className="eyebrow">Tableau Premium</span>
          <h2>Performance de visibilite</h2>
        </div>
        <div className="metricGrid">
          <Metric label="Vues" value={profile.views} suffix="" />
          <Metric label="Portee" value={profile.reach} suffix="" />
          <Metric label="Croissance" value={profile.growth} suffix="%" />
          <Metric label="Connexions" value={profile.connections} suffix="" />
        </div>
        <div className="analyticsGrid">
          <div className="chartCard"><PremiumChart data={series} /></div>
          <div className="scoreGrid">
            <Score label="Visibilite" value={premium.visibilityScore} />
            <Score label="Publications" value={premium.postPerformance} />
            <Score label="Clics" value={premium.clickThrough} />
            <Score label="Opportunites" value={premium.opportunityIndex} />
          </div>
        </div>
      </section>
    );
  }

  function renderHistory() {
    return (
      <section className="saasPanel historyPanel">
        <div className="sectionHead">
          <span className="eyebrow">Facturation</span>
          <h2>Historique paiement</h2>
        </div>
        <div className="historyList">
          {payments.length ? payments.map((payment) => (
            <div className="historyRow" key={payment.id}>
              <span>{payment.provider}</span>
              <strong>{formatMoney(payment.amountTTC, payment.currency)}</strong>
              <span>{formatSubscriptionStatus(safeLocale, payment.status)}</span>
              <small>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('fr-FR') : 'Date indisponible'}</small>
            </div>
          )) : <p className="emptyText">Aucun paiement confirme pour le moment.</p>}
        </div>
      </section>
    );
  }

  function renderSuccess() {
    return (
      <section className="successPanel">
        <span className="successIcon"><CheckCircle2 size={28} /></span>
        <span className="eyebrow">Paiement confirme</span>
        <h1>Bienvenue dans Communium {planName(selectedPlan)}</h1>
        <p>Vos avantages premium sont prets dans votre espace membre.</p>
        <div className="successActions">
          <Link href={dashboardHref} className="primaryAction">Acceder au tableau de bord <ArrowRight size={17} /></Link>
          <Link href={localizeHref(safeLocale, '/settings')} className="secondaryAction">Historique paiement</Link>
        </div>
      </section>
    );
  }

  return (
    <PublicExperienceFrame>
      <main className="premiumSaas">
        <section className="premiumHero">
          <div className="heroCopy">
            <span className="eyebrow">Communium Premium</span>
            <h1>Passe au niveau superieur avec Communium Premium</h1>
            <p>Developpe ta visibilite, ton reseau et tes opportunites professionnelles.</p>
            <div className="trustBadges">
              <span><ShieldCheck size={15} />Paiement securise</span>
              <span><LockKeyhole size={15} />Donnees protegees</span>
              <span><Sparkles size={15} />Essai Silver disponible</span>
            </div>
          </div>
          <div className="heroPanel">
            <span className="heroMetric"><strong>{formatPlanLabel(safeLocale, subscription?.currentSubscription?.plan)}</strong><small>Plan actuel</small></span>
            <span className="heroMetric"><strong>{selectedPlanData.name}</strong><small>Pack choisi</small></span>
            <span className="heroMetric"><strong>{selectedPaymentData.title}</strong><small>Paiement</small></span>
          </div>
        </section>

        {currentMode === 'success' ? renderSuccess() : null}

        <div className="workflow">
          {['Choix abonnement', 'Choix paiement', 'Resume', 'Validation paiement', 'Succes'].map((step, index) => (
            <span key={step} className={activeStep >= index + 1 ? 'workflowStep active' : 'workflowStep'}>
              {index + 1}. {step}
            </span>
          ))}
        </div>

        {currentMode !== 'success' ? (
          <div className="contentGrid">
            <div className="mainStack">
              {renderPlanCards()}
              {renderPayment()}
              {renderPaymentForm()}
              {renderComparison()}
              {currentMode === 'dashboard' ? renderAnalytics() : null}
              {currentMode === 'dashboard' ? renderHistory() : null}
            </div>
            {renderSummary()}
          </div>
        ) : null}

        <footer className="compactFooter">
          <span>Communium Premium</span>
          <Link href={localizeHref(safeLocale, '/privacy')}>Confidentialite</Link>
          <Link href={localizeHref(safeLocale, '/terms')}>Conditions</Link>
          <Link href={dashboardHref}>Tableau de bord</Link>
        </footer>

        <PremiumStyles />
      </main>
    </PublicExperienceFrame>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return <article className="metricCard"><span>{label}</span><strong>{Number(value || 0).toLocaleString('fr-FR')}{suffix}</strong></article>;
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <article className="scoreCard">
      <div><span>{label}</span><strong>{value}</strong></div>
      <div className="scoreTrack"><span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
    </article>
  );
}

function PremiumStyles() {
  return (
    <style>{`
      html,
      body {
        overflow-x: hidden;
      }

      .siteHeader {
        overflow-x: clip;
      }

      .headerActions {
        min-width: 0;
        flex-shrink: 1;
      }

      .premiumSaas {
        min-height: 100vh;
        padding: 18px 12px 24px;
        color: #0f172a;
        overflow-x: hidden;
      }

      .premiumHero,
      .saasPanel,
      .summaryCard,
      .successPanel,
      .compactFooter {
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(255,255,255,0.94);
        box-shadow: 0 20px 56px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(18px);
      }

      .premiumHero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 20px;
        align-items: stretch;
        border-radius: 22px;
        padding: 28px;
      }

      .heroCopy,
      .heroPanel,
      .mainStack,
      .saasPanel,
      .summaryCard,
      .successPanel {
        display: grid;
        gap: 16px;
      }

      h1, h2, h3, p { margin: 0; letter-spacing: 0; }

      .eyebrow {
        color: #1d4ed8;
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .premiumHero h1 {
        max-width: 900px;
        font-size: clamp(2.2rem, 4.5vw, 4.8rem);
        line-height: 0.95;
        letter-spacing: 0;
      }

      .heroCopy p,
      .planCard p,
      .emptyText,
      .successPanel p {
        color: #475569;
        line-height: 1.65;
      }

      .trustBadges,
      .workflow,
      .successActions,
      .compactFooter {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }

      .trustBadges span,
      .workflowStep,
      .planBadge {
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border-radius: 999px;
        background: #f8fafc;
        border: 1px solid rgba(148, 163, 184, 0.22);
        color: #334155;
        padding: 0 11px;
        font-weight: 800;
        font-size: 0.82rem;
      }

      .heroPanel {
        border-radius: 18px;
        background: #0f172a;
        color: #fff;
        padding: 18px;
      }

      .premiumSaas .heroPanel,
      .premiumSaas .heroPanel :is(h1, h2, h3, strong, label, span, p, small) {
        color: #f8fafc !important;
      }

      .premiumSaas .heroPanel :is(p, small) {
        color: #cbd5e1 !important;
      }

      .heroMetric {
        display: grid;
        gap: 3px;
        padding: 12px;
        border-radius: 14px;
        background: rgba(255,255,255,0.08);
      }

      .heroMetric small { color: #cbd5e1 !important; }

      .workflow {
        margin: 16px 0;
      }

      .workflowStep.active {
        background: #dbeafe;
        border-color: rgba(37, 99, 235, 0.22);
        color: #1d4ed8;
      }

      .contentGrid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 350px;
        gap: 18px;
        align-items: start;
      }

      .saasPanel,
      .summaryCard,
      .successPanel {
        border-radius: 18px;
        padding: 20px;
      }

      .sectionHead {
        display: grid;
        gap: 6px;
      }

      .sectionHead h2 { font-size: 1.45rem; }

      .plansGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .planCard,
      .methodCard {
        width: 100%;
        display: grid;
        gap: 12px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 16px;
        background: #fff;
        color: #0f172a;
        text-align: left;
        padding: 16px;
        cursor: pointer;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
      }

      .premiumSaas .planCard :is(h1, h2, h3, strong, label, span),
      .premiumSaas .methodCard :is(h1, h2, h3, strong, label, span),
      .premiumSaas .summaryCard :is(h1, h2, h3, strong, label, span),
      .premiumSaas .saasPanel :is(h1, h2, h3, strong, label, span) {
        color: #0f172a !important;
      }

      .premiumSaas .planCard :is(p, small, em),
      .premiumSaas .methodCard :is(p, small, em),
      .premiumSaas .summaryCard :is(p, small, em),
      .premiumSaas .saasPanel :is(p, small, em) {
        color: #475569 !important;
      }

      .planCard:hover,
      .methodCard:hover { transform: translateY(-2px); }

      .planCard.selected,
      .methodCard.selected {
        border-color: rgba(37, 99, 235, 0.38);
        box-shadow: 0 16px 40px rgba(37, 99, 235, 0.13);
      }

      .planCard.gold.selected { box-shadow: 0 16px 42px rgba(245, 158, 11, 0.22); }
      .planCard.platinum.selected { box-shadow: 0 16px 42px rgba(124, 58, 237, 0.18); }

      .planTop,
      .priceLine,
      .summaryLine,
      .historyRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .planIcon {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        color: #fff;
        background: linear-gradient(135deg, #0f172a, #2563eb);
      }

      .priceLine span {
        font-size: 1.55rem;
        font-weight: 900;
      }

      .priceLine small { color: #64748b; font-weight: 800; }

      .planCard ul,
      .summaryCard ul {
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
        list-style: none;
      }

      .planCard li,
      .summaryCard li {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #334155;
        font-weight: 750;
      }

      .planCta {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #f8fafc;
        font-weight: 900;
      }

      .paymentGroups,
      .historyList {
        display: grid;
        gap: 14px;
      }

      .paymentGroup {
        display: grid;
        gap: 10px;
      }

      .paymentGroup h3 { font-size: 1rem; }

      .methodGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .methodCard span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #1d4ed8;
        font-weight: 900;
      }

      .methodCard small { color: #64748b; font-weight: 800; }

      .paymentCheckoutGrid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 380px;
        gap: 22px;
        align-items: start;
      }

      .paymentFormStack {
        display: grid;
        gap: 14px;
      }

      .billingToggle {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .billingToggle button,
      .seatStepper,
      .paymentField,
      .savedInfoBox,
      .checkoutPackageCard {
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 16px;
        background: #f8fafc;
      }

      .billingToggle button {
        min-height: 100px;
        display: grid;
        gap: 8px;
        align-content: center;
        text-align: left;
        padding: 14px;
        cursor: pointer;
        color: #0f172a;
      }

      .billingToggle button.selected {
        background: #ffffff;
        border-color: rgba(37, 99, 235, 0.35);
        box-shadow: 0 12px 28px rgba(37, 99, 235, 0.1);
      }

      .billingToggle span,
      .paymentField span,
      .savedInfoBox span,
      .seatStepper small,
      .formHint {
        color: #64748b;
        font-weight: 800;
      }

      .seatStepper {
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 14px;
      }

      .seatStepper > span {
        display: grid;
        gap: 3px;
      }

      .seatStepper div {
        display: inline-flex;
        align-items: center;
        gap: 12px;
      }

      .seatStepper button {
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 999px;
        background: #ffffff;
        color: #0f172a;
        font-size: 1.2rem;
        font-weight: 900;
        cursor: pointer;
      }

      .paymentField {
        min-height: 64px;
        display: grid;
        gap: 4px;
        padding: 11px 14px;
      }

      .paymentField input {
        width: 100%;
        border: 0;
        outline: none;
        background: transparent;
        color: #0f172a;
        font: inherit;
        font-size: 1rem;
        font-weight: 850;
      }

      .paymentField input::placeholder {
        color: #94a3b8;
      }

      .paymentField small {
        color: #334155;
        font-size: 0.76rem;
        font-weight: 850;
      }

      .paymentFieldGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .savedInfoBox {
        display: grid;
        gap: 14px;
        padding: 14px;
      }

      .savedInfoBox > div:first-child {
        display: grid;
        gap: 4px;
      }

      .verificationCode {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .verificationCode input {
        width: 36px;
        height: 42px;
        border: 1px solid rgba(148, 163, 184, 0.32);
        border-radius: 9px;
        background: #ffffff;
        text-align: center;
        font-size: 1.05rem;
        font-weight: 900;
        outline: none;
      }

      .verificationHint {
        color: #475569;
        font-weight: 850;
      }

      .textButton {
        justify-self: start;
        border: 0;
        background: transparent;
        color: #1d4ed8;
        font-weight: 900;
        cursor: pointer;
        padding: 0;
      }

      .textButton:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .paymentCheckLine {
        display: flex;
        align-items: center;
        gap: 9px;
        color: #334155;
        font-weight: 850;
      }

      .paymentCheckLine input {
        width: 18px;
        height: 18px;
      }

      .checkoutPackageCard {
        display: grid;
        gap: 16px;
        padding: 22px;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
      }

      .checkoutPackageCard h3 {
        font-size: 2rem;
      }

      .checkoutPackageCard p {
        color: #334155;
        font-weight: 850;
      }

      .checkoutPackageCard ul {
        margin: 0;
        padding: 0;
        display: grid;
        gap: 13px;
        list-style: none;
      }

      .checkoutPackageCard li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: #0f172a;
        line-height: 1.45;
      }

      .checkoutPackageCard li svg {
        color: #2563eb;
        margin-top: 2px;
        flex-shrink: 0;
      }

      .checkoutTotals {
        display: grid;
        gap: 8px;
        border-top: 1px solid rgba(148, 163, 184, 0.22);
        padding-top: 14px;
      }

      .checkoutTotals span {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .checkoutTotals small {
        color: #475569;
        font-weight: 750;
      }

      .checkoutTotals .due strong,
      .checkoutTotals .due small {
        color: #0f172a;
        font-size: 1rem;
        font-weight: 950;
      }

      .subscribeButton {
        min-height: 48px;
        border: 0;
        border-radius: 999px;
        background: #0f172a;
        color: #ffffff;
        font-weight: 950;
        cursor: pointer;
      }

      .subscribeButton:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .comparisonTable {
        display: grid;
        overflow: auto;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 14px;
      }

      .comparisonRow {
        min-width: 820px;
        display: grid;
        grid-template-columns: 1.2fr repeat(4, 1fr);
      }

      .comparisonRow > * {
        padding: 12px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        font-weight: 750;
      }

      .comparisonRow.header {
        background: #f8fafc;
      }

      .summaryCard {
        position: sticky;
        top: 14px;
      }

      .summaryPrice strong {
        display: block;
        font-size: 2rem;
      }

      .notice {
        padding: 12px;
        border-radius: 12px;
        background: #eff6ff;
        color: #1d4ed8;
        font-weight: 800;
      }

      .primaryAction,
      .secondaryAction {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        padding: 0 16px;
        border: 0;
        font-weight: 900;
        text-decoration: none;
        cursor: pointer;
      }

      .primaryAction {
        background: linear-gradient(135deg, #0f172a, #2563eb);
        color: white;
      }

      .secondaryAction {
        background: #f8fafc;
        color: #0f172a;
        border: 1px solid rgba(148, 163, 184, 0.2);
      }

      .primaryAction:disabled { opacity: .55; cursor: not-allowed; }

      .metricGrid,
      .analyticsGrid,
      .scoreGrid {
        display: grid;
        gap: 12px;
      }

      .metricGrid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .analyticsGrid { grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr); }

      .metricCard,
      .scoreCard,
      .chartCard {
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 14px;
        background: #fff;
        padding: 14px;
      }

      .metricCard span,
      .scoreCard span { color: #64748b; font-weight: 800; }
      .metricCard strong { display: block; margin-top: 6px; font-size: 1.55rem; }

      .chartCard { min-height: 280px; }

      .scoreCard {
        display: grid;
        gap: 10px;
      }

      .scoreCard > div:first-child {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .scoreTrack {
        height: 8px;
        border-radius: 999px;
        background: #e2e8f0;
        overflow: hidden;
      }

      .scoreTrack span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #2563eb, #0f172a);
      }

      .historyRow {
        padding: 12px;
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 12px;
        background: #fff;
      }

      .successPanel {
        margin: 18px 0;
        place-items: start;
        background: linear-gradient(135deg, #ffffff, #eff6ff);
      }

      .successIcon {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: #dcfce7;
        color: #15803d;
      }

      .compactFooter {
        justify-content: center;
        margin-top: 18px;
        border-radius: 16px;
        padding: 14px;
        color: #475569;
        font-weight: 750;
      }

      .compactFooter a {
        color: #0f172a;
        text-decoration: none;
      }

      html[data-theme='dark'] .premiumSaas {
        color: #e7eefb;
      }

      html[data-theme='dark'] .premiumHero,
      html[data-theme='dark'] .saasPanel,
      html[data-theme='dark'] .summaryCard,
      html[data-theme='dark'] .successPanel,
      html[data-theme='dark'] .compactFooter {
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 30%),
          linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(12, 21, 39, 0.98)) !important;
        border-color: rgba(148, 163, 184, 0.22) !important;
        color: #e7eefb !important;
        box-shadow: 0 24px 70px rgba(2, 6, 23, 0.42) !important;
      }

      html[data-theme='dark'] .planCard,
      html[data-theme='dark'] .methodCard,
      html[data-theme='dark'] .billingToggle button,
      html[data-theme='dark'] .seatStepper,
      html[data-theme='dark'] .paymentField,
      html[data-theme='dark'] .savedInfoBox,
      html[data-theme='dark'] .checkoutPackageCard,
      html[data-theme='dark'] .metricCard,
      html[data-theme='dark'] .scoreCard,
      html[data-theme='dark'] .chartCard,
      html[data-theme='dark'] .historyRow,
      html[data-theme='dark'] .comparisonTable,
      html[data-theme='dark'] .secondaryAction,
      html[data-theme='dark'] .planCta,
      html[data-theme='dark'] .trustBadges span,
      html[data-theme='dark'] .workflowStep,
      html[data-theme='dark'] .planBadge {
        background: rgba(30, 41, 59, 0.92) !important;
        border-color: rgba(148, 163, 184, 0.24) !important;
        color: #e7eefb !important;
      }

      html[data-theme='dark'] .planCard.selected,
      html[data-theme='dark'] .methodCard.selected,
      html[data-theme='dark'] .billingToggle button.selected,
      html[data-theme='dark'] .workflowStep.active {
        background: rgba(30, 58, 138, 0.34) !important;
        border-color: rgba(96, 165, 250, 0.48) !important;
        box-shadow: 0 18px 44px rgba(37, 99, 235, 0.24) !important;
      }

      html[data-theme='dark'] .heroPanel,
      html[data-theme='dark'] .heroMetric {
        background: rgba(2, 6, 23, 0.62) !important;
        border: 1px solid rgba(148, 163, 184, 0.16);
      }

      html[data-theme='dark'] .premiumSaas :is(h1, h2, h3, strong, label, li, dt, dd),
      html[data-theme='dark'] .premiumSaas :is(.priceLine span, .summaryPrice strong, .summaryLine strong, .checkoutTotals .due strong) {
        color: #f8fafc !important;
      }

      html[data-theme='dark'] .premiumSaas :is(p, small, em),
      html[data-theme='dark'] .premiumSaas :is(.heroCopy p, .planCard p, .emptyText, .successPanel p, .priceLine small, .methodCard small, .checkoutTotals small, .formHint, .verificationHint, .paymentField small, .checkoutPackageCard p, .metricCard span, .scoreCard span) {
        color: #cbd5e1 !important;
      }

      html[data-theme='dark'] .eyebrow,
      html[data-theme='dark'] .methodCard span,
      html[data-theme='dark'] .textButton {
        color: #60a5fa !important;
      }

      html[data-theme='dark'] .paymentField input,
      html[data-theme='dark'] .verificationCode input,
      html[data-theme='dark'] .paymentField textarea,
      html[data-theme='dark'] .paymentField select {
        background: rgba(15, 23, 42, 0.94) !important;
        border-color: rgba(148, 163, 184, 0.28) !important;
        color: #f8fafc !important;
      }

      html[data-theme='dark'] .seatStepper button {
        background: rgba(15, 23, 42, 0.96) !important;
        color: #f8fafc !important;
      }

      html[data-theme='dark'] .comparisonRow.header,
      html[data-theme='dark'] .scoreTrack {
        background: rgba(15, 23, 42, 0.9) !important;
      }

      html[data-theme='dark'] .notice {
        background: rgba(30, 58, 138, 0.36) !important;
        color: #dbeafe !important;
      }

      html[data-theme='dark'] .primaryAction,
      html[data-theme='dark'] .subscribeButton {
        color: #ffffff !important;
      }

      html[data-theme='dark'] .compactFooter a {
        color: #e7eefb !important;
      }

      html[data-theme='light'] .siteChrome .premiumSaas .heroPanel,
      html[data-theme='dark'] .siteChrome .premiumSaas .heroPanel {
        background:
          radial-gradient(circle at top right, rgba(96, 165, 250, 0.16), transparent 34%),
          linear-gradient(180deg, #0f172a, #111827) !important;
        border-color: rgba(148, 163, 184, 0.22) !important;
        color: #f8fafc !important;
      }

      html[data-theme='light'] .siteChrome .premiumSaas .heroPanel :is(h1, h2, h3, h4, strong, label, span, li),
      html[data-theme='dark'] .siteChrome .premiumSaas .heroPanel :is(h1, h2, h3, h4, strong, label, span, li) {
        color: #f8fafc !important;
      }

      html[data-theme='light'] .siteChrome .premiumSaas .heroPanel :is(p, small, em),
      html[data-theme='dark'] .siteChrome .premiumSaas .heroPanel :is(p, small, em) {
        color: #cbd5e1 !important;
      }

      html[data-theme='light'] .siteChrome .premiumSaas .heroMetric,
      html[data-theme='dark'] .siteChrome .premiumSaas .heroMetric {
        background: rgba(255, 255, 255, 0.07) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
      }

      @media (max-width: 1180px) {
        .premiumHero,
        .contentGrid,
        .analyticsGrid,
        .paymentCheckoutGrid {
          grid-template-columns: 1fr;
        }

        .summaryCard {
          position: static;
        }

        .plansGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .premiumSaas { padding: 10px; }
        .premiumHero, .saasPanel, .summaryCard { border-radius: 14px; padding: 16px; }
        .plansGrid, .methodGrid, .metricGrid, .billingToggle, .paymentFieldGrid { grid-template-columns: 1fr; }
        .premiumHero h1 { font-size: 2.45rem; }
        .verificationCode input {
          width: 31px;
          height: 38px;
        }
        .summaryCard {
          position: sticky;
          bottom: 10px;
          z-index: 20;
        }
      }
    `}</style>
  );
}
