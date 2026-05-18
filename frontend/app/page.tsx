"use client";

import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createPaymentMethod,
  createRefund,
  createSubscription,
  createTksOrder,
  createWallet,
  loadModule2Snapshot,
  markOrderPaid,
  Module2Snapshot,
  TksPackage,
  TksPurchaseOrder,
} from "@/lib/module2-api";

const tabs = [
  "Vue d'ensemble",
  "Paiements",
  "Wallet Tks",
  "Factures",
] as const;

type Tab = (typeof tabs)[number];

export default function Module2Dashboard() {
  const [snapshot, setSnapshot] = useState<Module2Snapshot | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Vue d'ensemble");
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeUser = useMemo(() => {
    if (!snapshot?.users.length) {
      return null;
    }

    return (
      snapshot.users.find((user) => user.id === selectedUserId) || snapshot.users[0]
    );
  }, [selectedUserId, snapshot]);

  async function refresh(userId = selectedUserId) {
    setIsLoading(true);
    setError(null);

    try {
      const data = await loadModule2Snapshot(userId);
      setSnapshot(data);

      if (!selectedUserId && data.users[0]) {
        setSelectedUserId(data.users[0].id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur inconnue.");
    } finally {
      setIsLoading(false);
    }
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    if (!activeUser) {
      return;
    }

    setIsMutating(true);
    setError(null);
    setNotice(null);

    try {
      await action();
      await refresh(activeUser.id);
      setNotice(successMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
    } finally {
      setIsMutating(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Banknote size={22} />
          </div>
          <div>
            <p className="eyebrow">The Communium</p>
            <h1>Module 2</h1>
          </div>
        </div>

        <nav className="tab-list" aria-label="Navigation Module 2">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab ? "tab-button active" : "tab-button"}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab === "Vue d'ensemble" && <Activity size={18} />}
              {tab === "Paiements" && <CreditCard size={18} />}
              {tab === "Wallet Tks" && <WalletCards size={18} />}
              {tab === "Factures" && <ReceiptText size={18} />}
              <span>{tab}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>API Module 2</p>
          <strong>{process.env.NEXT_PUBLIC_MODULE2_BACKEND_URL || "localhost:5001"}</strong>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Console paiements et économie Tks</p>
            <h2>{activeTab}</h2>
          </div>

          <div className="topbar-actions">
            <select
              aria-label="Utilisateur actif"
              className="select"
              disabled={!snapshot?.users.length || isLoading}
              value={activeUser?.id || ""}
              onChange={(event) => {
                const userId = Number(event.target.value);
                setSelectedUserId(userId);
                refresh(userId);
              }}
            >
              {snapshot?.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>

            <button className="icon-button" onClick={() => refresh()} type="button">
              {isLoading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            </button>
          </div>
        </header>

        {error && <div className="alert">{cleanError(error)}</div>}
        {notice && <div className="notice">{notice}</div>}

        {isLoading && !snapshot ? (
          <div className="loading-state">
            <Loader2 className="spin" size={24} />
            <span>Chargement du module 2</span>
          </div>
        ) : (
          <>
            {activeTab === "Vue d'ensemble" && snapshot && (
              <Overview
                snapshot={snapshot}
                activeUserId={activeUser?.id}
                isMutating={isMutating}
                onCreateWallet={() =>
                  activeUser &&
                  runAction(
                    () => createWallet(activeUser.id),
                    "Wallet créé et synchronisé avec la base."
                  )
                }
                onCreateSubscription={() =>
                  activeUser &&
                  runAction(
                    () => createSubscription(activeUser.id),
                    "Abonnement annuel activé."
                  )
                }
                onBuyPackage={(tksPackage) =>
                  activeUser &&
                  runAction(
                    () => createTksOrder(activeUser.id, tksPackage.id),
                    "Commande Tks créée. Elle attend maintenant l'encaissement."
                  )
                }
              />
            )}

            {activeTab === "Paiements" && snapshot && (
              <PaymentsPanel
                snapshot={snapshot}
                isMutating={isMutating}
                onCreatePaymentMethod={() =>
                  activeUser &&
                  runAction(
                    () => createPaymentMethod(activeUser.id),
                    "Moyen de paiement ajouté au profil utilisateur."
                  )
                }
                onCreateRefund={(paymentIntent) =>
                  runAction(
                    () => createRefund(paymentIntent),
                    "Demande de remboursement enregistrée."
                  )
                }
              />
            )}

            {activeTab === "Wallet Tks" && snapshot && (
              <WalletPanel
                snapshot={snapshot}
                isMutating={isMutating}
                onMarkPaid={(order) =>
                  runAction(
                    () => markOrderPaid(order.id),
                    "Commande encaissée, wallet crédité et facture générée."
                  )
                }
              />
            )}

            {activeTab === "Factures" && snapshot && <InvoicesPanel snapshot={snapshot} />}
          </>
        )}
      </section>
    </main>
  );
}

function Overview({
  snapshot,
  activeUserId,
  isMutating,
  onCreateWallet,
  onCreateSubscription,
  onBuyPackage,
}: {
  snapshot: Module2Snapshot;
  activeUserId?: number;
  isMutating: boolean;
  onCreateWallet: () => void;
  onCreateSubscription: () => void;
  onBuyPackage: (tksPackage: TksPackage) => void;
}) {
  const activeProviders = snapshot.providers.filter((provider) => provider.is_active);
  const paidOrders = snapshot.orders.filter((order) => order.status === "PAID");
  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.price_total || 0),
    0
  );

  return (
    <div className="content-stack">
      <section className="metric-grid">
        <Metric
          icon={<ShieldCheck size={20} />}
          label="Providers actifs"
          value={activeProviders.length}
          detail={activeProviders.map((provider) => provider.code).join(" / ") || "Aucun"}
        />
        <Metric
          icon={<WalletCards size={20} />}
          label="Solde wallet"
          value={`${formatAmount(snapshot.wallet?.balance_tks || "0")} Tks`}
          detail={snapshot.wallet ? formatStatus(snapshot.wallet.status) : "Wallet non initialisé"}
        />
        <Metric
          icon={<PackagePlus size={20} />}
          label="Commandes Tks"
          value={snapshot.orders.length}
          detail={`${snapshot.orders.filter((order) => order.status === "PENDING").length} en attente`}
        />
        <Metric
          icon={<ReceiptText size={20} />}
          label="CA encaissé"
          value={`${formatAmount(revenue)} MAD`}
          detail={`${snapshot.invoices.length} facture(s)`}
        />
      </section>

      <section className="action-band">
        <div>
          <p className="eyebrow">Utilisateur #{activeUserId || "-"}</p>
          <h3>Opérations Module 2</h3>
        </div>
        <div className="button-row">
          <button
            className="button secondary"
            disabled={Boolean(snapshot.wallet) || isMutating}
            onClick={onCreateWallet}
            type="button"
          >
            <WalletCards size={17} />
            Créer le wallet
          </button>
          <button
            className="button secondary"
            disabled={isMutating}
            onClick={onCreateSubscription}
            type="button"
          >
            <CreditCard size={17} />
            Activer l'abonnement annuel
          </button>
        </div>
      </section>

      <section>
        <SectionTitle
          kicker="Catalogue Tks"
          title="Packs disponibles"
          action={`${snapshot.packages.length} offres`}
        />
        <div className="package-grid">
          {snapshot.packages.map((tksPackage) => (
            <article className="package-card" key={tksPackage.id}>
              <div>
                <p className="package-code">{tksPackage.code}</p>
                <h4>{tksPackage.display_name}</h4>
              </div>
              <div className="package-amount">
                <strong>{formatAmount(tksPackage.base_tks)} Tks</strong>
                <span>+ {formatAmount(tksPackage.bonus_tks)} bonus</span>
              </div>
              <div className="price-line">
                <span>TVA incluse</span>
                <strong>
                  {formatAmount(tksPackage.price_total)} {tksPackage.currency_code}
                </strong>
              </div>
              <button
                className="button primary"
                disabled={isMutating}
                onClick={() => onBuyPackage(tksPackage)}
                type="button"
              >
                <PackagePlus size={17} />
                Commander
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PaymentsPanel({
  snapshot,
  isMutating,
  onCreatePaymentMethod,
  onCreateRefund,
}: {
  snapshot: Module2Snapshot;
  isMutating: boolean;
  onCreatePaymentMethod: () => void;
  onCreateRefund: (paymentIntent: Module2Snapshot["paymentIntents"][number]) => void;
}) {
  const refundablePayment = snapshot.paymentIntents.find(
    (paymentIntent) => paymentIntent.status === "SUCCEEDED"
  );

  return (
    <div className="content-stack">
      <section className="action-band">
        <div>
          <p className="eyebrow">Actions paiement</p>
          <h3>Gestion opérationnelle</h3>
        </div>
        <div className="button-row">
          <button
            className="button secondary"
            disabled={isMutating}
            onClick={onCreatePaymentMethod}
            type="button"
          >
            <CreditCard size={17} />
            Ajouter une carte
          </button>
          <button
            className="button secondary"
            disabled={isMutating || !refundablePayment}
            onClick={() => refundablePayment && onCreateRefund(refundablePayment)}
            type="button"
          >
            <RotateCcw size={17} />
            Demander un remboursement
          </button>
        </div>
      </section>

      <SectionTitle
        kicker="Providers"
        title="Configuration paiement"
        action={`${snapshot.providers.length} providers`}
      />
      <div className="data-grid two">
        {snapshot.providers.map((provider) => (
          <article className="data-card" key={provider.id}>
            <div className="card-heading">
              <CreditCard size={19} />
              <div>
                <h3>{provider.display_name}</h3>
                <p>{provider.provider_type}</p>
              </div>
              <StatusBadge value={provider.is_active ? "ACTIVE" : "INACTIVE"} />
            </div>
            <div className="mini-list">
              <span>Devises : {provider.supported_currency_codes.join(", ")}</span>
              <span>Cartes : {provider.supports_cards ? "Oui" : "Non"}</span>
              <span>Abonnements : {provider.supports_subscriptions ? "Oui" : "Non"}</span>
              <span>Remboursements : {provider.supports_refunds ? "Oui" : "Non"}</span>
            </div>
          </article>
        ))}
      </div>

      <Table
        title="Moyens de paiement"
        rows={snapshot.paymentMethods}
        empty="Aucun moyen de paiement enregistré."
        columns={[
          ["Provider", (row) => row.provider_code],
          ["Type", (row) => row.method_type],
          ["Carte", (row) => `${row.brand || "Carte"} ${row.last4 ? `•••• ${row.last4}` : ""}`],
          ["Statut", (row) => <StatusBadge value={row.status} />],
          ["Création", (row) => formatDate(row.created_at)],
        ]}
      />

      <Table
        title="Payment intents"
        rows={snapshot.paymentIntents}
        empty="Aucun paiement pour cet utilisateur."
        columns={[
          ["Objet", (row) => formatPurpose(row.purpose)],
          ["Statut", (row) => <StatusBadge value={row.status} />],
          ["Montant", (row) => `${formatAmount(row.amount_total)} ${row.currency_code}`],
          ["Provider", (row) => row.provider_code || "-"],
          ["Création", (row) => formatDate(row.created_at)],
        ]}
      />

      <Table
        title="Abonnements"
        rows={snapshot.subscriptions}
        empty="Aucun abonnement actif."
        columns={[
          ["Provider", (row) => row.provider_code],
          ["Statut", (row) => <StatusBadge value={row.status} />],
          ["Montant", (row) => `${formatAmount(row.amount_recurring)} ${row.currency_code}`],
          ["Intervalle", (row) => formatInterval(row.billing_interval)],
          ["Fin période", (row) => formatDate(row.current_period_end_at)],
        ]}
      />

      <Table
        title="Remboursements"
        rows={snapshot.refunds}
        empty="Aucune demande de remboursement enregistrée."
        columns={[
          ["Statut", (row) => <StatusBadge value={row.status} />],
          ["Montant", (row) => `${formatAmount(row.amount_refunded)} ${row.currency_code}`],
          ["Raison", (row) => row.reason || "-"],
          ["Demande", (row) => formatDate(row.requested_at)],
        ]}
      />

      {isMutating && <InlineBusy />}
    </div>
  );
}

function WalletPanel({
  snapshot,
  isMutating,
  onMarkPaid,
}: {
  snapshot: Module2Snapshot;
  isMutating: boolean;
  onMarkPaid: (order: TksPurchaseOrder) => void;
}) {
  const pendingOrders = snapshot.orders.filter((order) => order.status === "PENDING");

  return (
    <div className="content-stack">
      <section className="wallet-band">
        <div>
          <p className="eyebrow">Wallet</p>
          <h3>{snapshot.wallet?.wallet_code || "Non initialisé"}</h3>
        </div>
        <div className="wallet-balance">
          <strong>{formatAmount(snapshot.wallet?.balance_tks || "0")} Tks</strong>
          <span>{snapshot.wallet ? formatStatus(snapshot.wallet.status) : "Aucun wallet"}</span>
        </div>
      </section>

      <Table
        title="Commandes Tks"
        rows={snapshot.orders}
        empty="Aucune commande Tks."
        columns={[
          ["Pack", (row) => row.package_name || row.package_code || row.package_id],
          ["Statut", (row) => <StatusBadge value={row.status} />],
          ["Tks", (row) => formatAmount(row.total_tks)],
          ["Total", (row) => `${formatAmount(row.price_total)} ${row.currency_code}`],
          [
            "Action",
            (row) =>
              row.status === "PENDING" ? (
                <button
                  className="table-action"
                  disabled={isMutating}
                  onClick={() => onMarkPaid(row)}
                  type="button"
                >
                  <CheckCircle2 size={15} />
                  Encaisser
                </button>
              ) : (
                formatDate(row.paid_at)
              ),
          ],
        ]}
      />

      <Table
        title="Historique wallet"
        rows={snapshot.transactions}
        empty="Aucune transaction wallet."
        columns={[
          [
            "Sens",
            (row) => (
              <span className="direction">
                {row.direction === "CREDIT" ? (
                  <ArrowDownLeft size={15} />
                ) : (
                  <ArrowUpRight size={15} />
                )}
                {row.direction}
              </span>
            ),
          ],
          ["Type", (row) => formatTransactionType(row.transaction_type)],
          ["Montant", (row) => `${formatAmount(row.amount_tks)} Tks`],
          ["Solde après", (row) => `${formatAmount(row.balance_after)} Tks`],
          ["Date", (row) => formatDate(row.created_at)],
        ]}
      />

      {pendingOrders.length > 0 && (
        <div className="hint-line">
          {pendingOrders.length} commande(s) attendent une confirmation paiement.
        </div>
      )}
    </div>
  );
}

function InvoicesPanel({ snapshot }: { snapshot: Module2Snapshot }) {
  return (
    <div className="content-stack">
      <Table
        title="Factures"
        rows={snapshot.invoices}
        empty="Aucune facture générée."
        columns={[
          ["Numéro", (row) => row.invoice_number],
          ["Statut", (row) => <StatusBadge value={row.status} />],
          ["Client", (row) => row.buyer_name],
          ["TVA", (row) => `${formatAmount(row.vat_amount)} ${row.currency_code}`],
          ["Total", (row) => `${formatAmount(row.amount_total)} ${row.currency_code}`],
          ["Émission", (row) => formatDate(row.issued_at || row.created_at)],
        ]}
      />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SectionTitle({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h3>{title}</h3>
      </div>
      {action && <span>{action}</span>}
    </div>
  );
}

function Table<T>({
  title,
  rows,
  columns,
  empty,
}: {
  title: string;
  rows: T[];
  columns: [string, (row: T) => React.ReactNode][];
  empty: string;
}) {
  return (
    <section className="table-wrap">
      <div className="table-title">
        <h3>{title}</h3>
        <span>{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state">
          <FileText size={19} />
          <span>{empty}</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map(([label]) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {columns.map(([label, render]) => (
                    <td key={label}>{render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status ${value.toLowerCase()}`}>{formatStatus(value)}</span>;
}

function InlineBusy() {
  return (
    <div className="inline-busy">
      <Loader2 className="spin" size={18} />
      <span>Opération en cours</span>
    </div>
  );
}

function formatAmount(value: string | number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  const statuses: Record<string, string> = {
    ACTIVE: "Actif",
    INACTIVE: "Inactif",
    CREATED: "Créé",
    PENDING: "En attente",
    PAID: "Payé",
    SUCCEEDED: "Réussi",
    FAILED: "Échoué",
    CANCELLED: "Annulé",
    REFUNDED: "Remboursé",
    PARTIALLY_REFUNDED: "Remboursé partiel",
    INCOMPLETE: "Incomplet",
    TRIALING: "Essai",
    PAST_DUE: "Paiement en retard",
    UNPAID: "Impayé",
    PAUSED: "Suspendu",
    SUSPENDED: "Suspendu",
    CLOSED: "Fermé",
  };

  return statuses[value] || value;
}

function formatPurpose(value: string) {
  const purposes: Record<string, string> = {
    MEMBERSHIP: "Adhésion",
    TKS_PURCHASE: "Achat de Tks",
    EVENT: "Événement",
    MENTORING: "Mentorat",
    MARKETPLACE: "Marketplace",
    SERVICE_OFFER: "Offre de service",
  };

  return purposes[value] || value;
}

function formatInterval(value: string) {
  const intervals: Record<string, string> = {
    MONTHLY: "Mensuel",
    YEARLY: "Annuel",
  };

  return intervals[value] || value;
}

function formatTransactionType(value: string) {
  const transactionTypes: Record<string, string> = {
    PURCHASE: "Achat",
    EARNING: "Gain",
    SPEND: "Dépense",
    TRANSFER_IN: "Transfert reçu",
    TRANSFER_OUT: "Transfert envoyé",
    REFUND: "Remboursement",
    ADJUSTMENT: "Ajustement",
    REVERSAL: "Annulation",
  };

  return transactionTypes[value] || value;
}

function cleanError(error: string) {
  try {
    const parsed = JSON.parse(error) as { error?: string };
    return parsed.error || error;
  } catch {
    return error;
  }
}
