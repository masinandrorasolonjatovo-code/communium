"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, Download, Mail, MapPin, QrCode, ShieldCheck, Ticket, Users, Wifi } from "lucide-react";
import {
  checkInTicket,
  emailTicket,
  fetchEventAttendees,
  fetchEventById,
  fetchPaymentProviders,
  registerForEvent,
  ticketPdfUrl,
  ticketQrUrl,
} from "../lib/module5-api";

interface PaymentProvider {
  id: string;
  code: string;
  display_name: string;
  provider_type: string;
  is_active: boolean;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  banner_url?: string | null;
  starts_at: string;
  ends_at: string;
  location_name?: string | null;
  location_address?: string | null;
  location_city?: string | null;
  location_country?: string | null;
  virtual_link?: string | null;
  is_free: boolean;
  price_amount: number | string;
  currency: string;
  format: string;
  privacy: string;
  type: string;
  capacity?: number;
  remaining_capacity?: number;
  confirmed_tickets?: number;
  waitlist_count?: number;
}

interface TicketData {
  id: string;
  event_id: string;
  ticket_code: string;
  attendee_name: string;
  attendee_email: string;
  status: string;
  payment_status: string;
  checked_in_at?: string | null;
}

interface PageProps {
  params: { eventId: string };
}

const fieldClass =
  "mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPrice = (isFree: boolean, amount: number | string, currency: string) => {
  if (isFree) return "Gratuit";
  const value = Number(amount);
  return Number.isNaN(value) ? `N/A ${currency || "MAD"}` : `${value.toFixed(2)} ${currency || "MAD"}`;
};

const eventFormatLabel = (format: string) => {
  if (format === "virtual") return "Virtuel";
  if (format === "hybrid") return "Hybride";
  return "Presentiel";
};

export default function EventDetailPage({ params }: PageProps) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [attendees, setAttendees] = useState<TicketData[]>([]);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProviderCode, setSelectedProviderCode] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [paymentIntentUrl, setPaymentIntentUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkinCode, setCheckinCode] = useState("");
  const [checkinMessage, setCheckinMessage] = useState<string | null>(null);

  const loadEvent = async () => {
    const [eventPayload, attendeesPayload] = await Promise.all([
      fetchEventById(params.eventId),
      fetchEventAttendees(params.eventId).catch(() => []),
    ]);
    setEvent(eventPayload);
    setAttendees(attendeesPayload || []);
  };

  useEffect(() => {
    setLoading(true);
    setMessage(null);
    loadEvent()
      .catch((err) => setMessage(err.message || "Impossible de charger l'evenement."))
      .finally(() => setLoading(false));
  }, [params.eventId]);

  useEffect(() => {
    if (!event || event.is_free) {
      setProviders([]);
      setSelectedProviderCode("");
      return;
    }

    fetchPaymentProviders()
      .then((list) => {
        const active = (list || []).filter((provider: PaymentProvider) => provider.is_active);
        setProviders(active);
        setSelectedProviderCode((current) => current || active[0]?.code || "");
      })
      .catch(() => setProviders([]));
  }, [event]);

  const canRegister = useMemo(() => {
    if (!event) return false;
    return event.is_free || Boolean(selectedProviderCode);
  }, [event, selectedProviderCode]);

  const handleRegister = async (eventSubmit: FormEvent<HTMLFormElement>) => {
    eventSubmit.preventDefault();
    if (!event) return;

    setSubmitting(true);
    setMessage(null);
    setPaymentIntentUrl(null);

    try {
      const response = await registerForEvent(event.id, {
        attendeeName,
        attendeeEmail,
        paymentProviderCode: event.is_free ? undefined : selectedProviderCode,
        providerReturnUrl: typeof window !== "undefined" ? window.location.href : undefined,
        providerCancelUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });

      if (response?.status === "waitlisted") {
        setMessage(`Liste d'attente confirmee. Position #${response.waitlist?.position || "-"}.`);
      } else if (response?.status === "pending_payment") {
        setTicketData(response.ticket);
        setPaymentIntentUrl(response.paymentIntent?.provider_checkout_url || null);
        setMessage("Reservation creee. Finalise le paiement pour recevoir ton billet.");
      } else {
        setTicketData(response.ticket || response);
        setMessage("Inscription confirmee. Ton billet QR est pret.");
      }

      await loadEvent();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckin = async (payload: { ticketId?: string; ticketCode?: string }) => {
    setCheckinMessage(null);
    try {
      const checkedTicket = await checkInTicket(payload);
      setCheckinMessage(`Check-in valide pour ${checkedTicket.attendee_name || checkedTicket.ticket_code}.`);
      setCheckinCode("");
      await loadEvent();
    } catch (err) {
      setCheckinMessage(err instanceof Error ? err.message : "Check-in impossible.");
    }
  };

  const handleEmailTicket = async () => {
    if (!ticketData) return;
    try {
      const result = await emailTicket(ticketData.id);
      setMessage(result?.previewUrl ? `Email envoye. Preview: ${result.previewUrl}` : "Email du billet envoye.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Envoi email impossible.");
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-6xl px-6 py-10"><div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">Chargement de l'evenement...</div></main>;
  }

  if (!event) {
    return <main className="mx-auto max-w-6xl px-6 py-10"><div className="rounded-lg border border-red-200 bg-red-50 p-12 text-red-700">{message || "Evenement introuvable."}</div></main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/module5" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300">
          <ArrowLeft size={16} />
          Retour
        </Link>
        <div className="flex gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase text-sky-700">{eventFormatLabel(event.format)}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{event.privacy === "public" ? "Public" : "Membres"}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <section className="relative min-h-[320px] bg-slate-100">
          {event.banner_url ? <img src={event.banner_url} alt={event.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-slate-400">Image de banniere</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="text-sm font-bold uppercase text-sky-200">{event.type}</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight">{event.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100">{event.description}</p>
          </div>
        </section>

        <div className="grid gap-8 p-6 lg:grid-cols-[1.35fr_0.9fr] lg:p-8">
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <Info icon={<CalendarDays size={18} />} label="Date" value={formatDate(event.starts_at)} sub={`Fin: ${formatDate(event.ends_at)}`} />
              <Info icon={<MapPin size={18} />} label="Lieu" value={event.location_name || "En ligne"} sub={`${event.location_address || ""} ${event.location_city || event.location_country || ""}`} />
              {event.virtual_link ? <Info icon={<Wifi size={18} />} label="Lien en ligne" value={event.virtual_link} sub="Visible selon les droits d'acces" /> : null}
              <Info icon={<Users size={18} />} label="Places" value={`${event.remaining_capacity ?? 0} restantes`} sub={`${event.confirmed_tickets ?? 0} inscrits, ${event.waitlist_count ?? 0} en attente`} />
            </section>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-950">Inscrits et check-in jour J</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
                <input value={checkinCode} onChange={(e) => setCheckinCode(e.target.value)} placeholder="Code billet ou scan QR" className={fieldClass.replace("mt-2 ", "")} />
                <button type="button" onClick={() => handleCheckin({ ticketCode: checkinCode })} disabled={!checkinCode.trim()} className="rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50">
                  Valider
                </button>
              </div>
              {checkinMessage ? <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700">{checkinMessage}</p> : null}

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Billet</th>
                      <th>Paiement</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.length === 0 ? (
                      <tr><td colSpan={5}>Aucun inscrit pour le moment.</td></tr>
                    ) : attendees.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.attendee_name}<br /><span className="text-xs text-slate-500">{ticket.attendee_email}</span></td>
                        <td>{ticket.ticket_code}</td>
                        <td>{ticket.payment_status}</td>
                        <td>{ticket.status}</td>
                        <td>
                          <button type="button" onClick={() => handleCheckin({ ticketId: ticket.id })} disabled={ticket.status === "checked_in"} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-sky-700 disabled:text-slate-400">
                            Check-in
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase text-slate-500">Prix d'entree</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatPrice(event.is_free, event.price_amount, event.currency)}</p>
              <div className="mt-4 grid gap-2 rounded-lg bg-white p-4 text-sm text-slate-600">
                <Feature text="Paiement securise via fournisseur actif" />
                <Feature text="Billet PDF avec QR code" />
                <Feature text="Liste d'attente automatique" />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">Inscription</h2>
              <form className="mt-4 space-y-4" onSubmit={handleRegister}>
                <label className="block text-sm font-semibold text-slate-800">
                  Nom complet
                  <input value={attendeeName} onChange={(e) => setAttendeeName(e.target.value)} required className={fieldClass} />
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Email
                  <input type="email" value={attendeeEmail} onChange={(e) => setAttendeeEmail(e.target.value)} required className={fieldClass} />
                </label>

                {!event.is_free ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-800">Paiement</p>
                    <div className="mt-3 grid gap-2">
                      {providers.length === 0 ? <p className="text-sm text-amber-700">Aucun fournisseur actif detecte.</p> : providers.map((provider) => (
                        <label key={provider.code} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                          <input type="radio" name="provider" checked={selectedProviderCode === provider.code} onChange={() => setSelectedProviderCode(provider.code)} />
                          <span>{provider.display_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button type="submit" disabled={!canRegister || submitting} className="inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50">
                  {submitting ? "Reservation..." : event.is_free ? "S'inscrire gratuitement" : "Payer et reserver"}
                </button>
              </form>

              {message ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p> : null}
              {paymentIntentUrl ? <a href={paymentIntentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex w-full justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white">Ouvrir le paiement</a> : null}
            </section>

            {ticketData ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase text-slate-500">Mon billet</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{event.title}</h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">{ticketData.payment_status}</span>
                </div>

                <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm">
                  <p><strong>Reference:</strong> {ticketData.ticket_code}</p>
                  <p><strong>Participant:</strong> {ticketData.attendee_name}</p>
                  <img src={ticketQrUrl(ticketData.id)} alt={`QR ${ticketData.ticket_code}`} className="mx-auto h-48 w-48 rounded-lg border border-slate-200 bg-white p-3" />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <a href={ticketPdfUrl(ticketData.id)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white">
                    <Download size={16} />
                    PDF
                  </a>
                  <button type="button" onClick={handleEmailTicket} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                    <Mail size={16} />
                    Email
                  </button>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Info({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <p className="text-xs font-bold uppercase">{label}</p>
      </div>
      <p className="mt-3 break-words font-semibold text-slate-950">{value}</p>
      {sub ? <p className="mt-1 text-sm text-slate-500">{sub}</p> : null}
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check size={16} className="text-sky-600" />
      <span>{text}</span>
    </div>
  );
}
