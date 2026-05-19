export type ApiUser = {
  id: number;
  username: string;
  email: string;
  created_at: string;
};

export type Provider = {
  id: string;
  code: string;
  display_name: string;
  provider_type: string;
  supported_currency_codes: string[];
  supports_cards: boolean;
  supports_subscriptions: boolean;
  supports_refunds: boolean;
  is_active: boolean;
};

export type TksPackage = {
  id: string;
  code: string;
  display_name: string;
  base_tks: string;
  bonus_tks: string;
  price_subtotal: string;
  vat_amount: string;
  price_total: string;
  vat_rate: string;
  currency_code: string;
  is_active: boolean;
};

export type Wallet = {
  id: string;
  user_id: number;
  wallet_code: string;
  currency_code: string;
  balance_tks: string;
  reserved_tks: string;
  status: string;
  opened_at: string;
  created_at: string;
  updated_at: string;
};

export type WalletTransaction = {
  id: string;
  wallet_id: string;
  user_id: number;
  direction: "CREDIT" | "DEBIT";
  transaction_type: string;
  amount_tks: string;
  balance_before: string;
  balance_after: string;
  reference_type: string;
  reference_id: string | null;
  created_at: string;
};

export type PaymentIntent = {
  id: string;
  user_id: number;
  provider_code?: string;
  purpose: string;
  status: string;
  amount_subtotal: string;
  amount_tax: string;
  amount_total: string;
  currency_code: string;
  provider_checkout_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: number;
  provider_id: string;
  provider_code: string;
  provider_name: string;
  method_type: string;
  brand: string | null;
  last4: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  holder_name: string | null;
  country_code: string | null;
  is_default: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: number;
  provider_code: string;
  status: string;
  amount_recurring: string;
  currency_code: string;
  billing_interval: string;
  current_period_start_at: string | null;
  current_period_end_at: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type TksPurchaseOrder = {
  id: string;
  user_id: number;
  wallet_id: string;
  package_id: string;
  package_code?: string;
  package_name?: string;
  payment_intent_id: string;
  status: string;
  base_tks: string;
  bonus_tks: string;
  total_tks: string;
  price_subtotal: string;
  vat_amount: string;
  price_total: string;
  currency_code: string;
  wallet_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  status: string;
  buyer_name: string;
  buyer_email: string;
  amount_subtotal: string;
  vat_amount: string;
  amount_total: string;
  currency_code: string;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export type Refund = {
  id: string;
  payment_intent_id: string;
  provider_id: string;
  user_id: number;
  provider_refund_ref: string | null;
  status: string;
  amount_refunded: string;
  currency_code: string;
  reason: string | null;
  requested_at: string;
  created_at: string;
  updated_at: string;
};

export type Module2Snapshot = {
  users: ApiUser[];
  providers: Provider[];
  packages: TksPackage[];
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  paymentMethods: PaymentMethod[];
  paymentIntents: PaymentIntent[];
  subscriptions: Subscription[];
  orders: TksPurchaseOrder[];
  invoices: Invoice[];
  refunds: Refund[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_MODULE2_BACKEND_URL ||
  "http://localhost:5000";

export async function loadModule2Snapshot(userId?: number): Promise<Module2Snapshot> {
  const users = await request<ApiUser[]>("/api/users");
  const activeUserId = userId || users[0]?.id;
  const [providers, packages] = await Promise.all([
    request<Provider[]>("/api/module2/providers"),
    request<TksPackage[]>("/api/module2/tks-packages"),
  ]);

  if (!activeUserId) {
    return {
      users,
      providers,
      packages,
      wallet: null,
      transactions: [],
      paymentMethods: [],
      paymentIntents: [],
      subscriptions: [],
      orders: [],
      invoices: [],
      refunds: [],
    };
  }

  const [
    wallet,
    transactions,
    paymentMethods,
    paymentIntents,
    subscriptions,
    orders,
    invoices,
    refunds,
  ] =
    await Promise.all([
      request<Wallet | null>(`/api/module2/users/${activeUserId}/wallet`, {
        allow404: true,
      }),
      request<WalletTransaction[]>(
        `/api/module2/users/${activeUserId}/wallet/transactions`
      ),
      request<PaymentMethod[]>(
        `/api/module2/users/${activeUserId}/payment-methods`
      ),
      request<PaymentIntent[]>(`/api/module2/users/${activeUserId}/payment-intents`),
      request<Subscription[]>(`/api/module2/users/${activeUserId}/subscriptions`),
      request<TksPurchaseOrder[]>(
        `/api/module2/users/${activeUserId}/tks-purchase-orders`
      ),
      request<Invoice[]>(`/api/module2/users/${activeUserId}/invoices`),
      request<Refund[]>("/api/module2/refunds"),
    ]);

  return {
    users,
    providers,
    packages,
    wallet,
    transactions,
    paymentMethods,
    paymentIntents,
    subscriptions,
    orders,
    invoices,
    refunds: refunds.filter((refund) => refund.user_id === activeUserId),
  };
}

export async function createWallet(userId: number) {
  return request<Wallet>(`/api/module2/users/${userId}/wallet`, {
    method: "POST",
  });
}

export async function createTksOrder(userId: number, packageId: string) {
  return request<{ order: TksPurchaseOrder; paymentIntent: PaymentIntent }>(
    `/api/module2/users/${userId}/tks-purchase-orders`,
    {
      method: "POST",
      body: {
        packageId,
        providerCode: "STRIPE",
      },
    }
  );
}

export async function createPaymentMethod(userId: number) {
  const last4 = String(Math.floor(1000 + Math.random() * 9000));

  return request<PaymentMethod>(`/api/module2/users/${userId}/payment-methods`, {
    method: "POST",
    body: {
      providerCode: "STRIPE",
      providerCustomerRef: `cus_${userId}`,
      providerPaymentMethodRef: `pm_${userId}_${Date.now()}`,
      methodType: "CARD",
      brand: "Visa",
      last4,
      expiryMonth: 12,
      expiryYear: 2028,
      holderName: "Utilisateur Communium",
      countryCode: "MA",
      isDefault: false,
    },
  });
}

export async function markOrderPaid(orderId: string) {
  return request<{
    order: TksPurchaseOrder;
    walletTransaction: WalletTransaction;
    invoice: Invoice;
  }>(`/api/module2/tks-purchase-orders/${orderId}/mark-paid`, {
    method: "POST",
  });
}

export async function createRefund(paymentIntent: PaymentIntent) {
  return request<Refund>("/api/module2/refunds", {
    method: "POST",
    body: {
      paymentIntentId: paymentIntent.id,
      amountRefunded: paymentIntent.amount_total,
      providerRefundRef: `rf_${Date.now()}`,
      reason: "Demande de remboursement traçable depuis le back-office Module 2.",
    },
  });
}

export async function createSubscription(userId: number) {
  return request<Subscription>(`/api/module2/users/${userId}/subscriptions`, {
    method: "POST",
    body: {
      providerCode: "STRIPE",
      amountRecurring: 500,
      billingInterval: "YEARLY",
      membershipSubscriptionRef: crypto.randomUUID(),
    },
  });
}

async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    allow404?: boolean;
  } = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (response.status === 404 && options.allow404) {
    return null as T;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
