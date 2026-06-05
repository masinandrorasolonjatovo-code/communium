"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Plus, Search, Ticket, Users } from "lucide-react";
import { fetchEvents } from "./lib/module5-api";

interface EventItem {
  id: string;
  title: string;
  description: string;
  banner_url?: string | null;
  starts_at: string;
  location_city?: string | null;
  location_country?: string | null;
  is_free: boolean;
  price_amount: number | string;
  currency: string;
  format: string;
  type: string;
  remaining_capacity?: number;
  confirmed_tickets?: number;
  waitlist_count?: number;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPrice = (isFree: boolean, amount: number | string, currency: string) => {
  if (isFree) return "Gratuit";
  const value = Number(amount);
  return Number.isNaN(value) ? `N/A ${currency || "MAD"}` : `${value.toFixed(2)} ${currency || "MAD"}`;
};

const labelFormat = (format: string) => {
  if (format === "virtual") return "Virtuel";
  if (format === "hybrid") return "Hybride";
  return "Presentiel";
};

export default function Module5Page() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetchEvents(query.trim())
        .then((result) => setEvents(result || []))
        .catch((err) => setError(err.message || "Impossible de charger les evenements."))
        .finally(() => setLoading(false));
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const stats = useMemo(
    () => ({
      total: events.length,
      places: events.reduce((sum, item) => sum + Number(item.remaining_capacity || 0), 0),
      attendees: events.reduce((sum, item) => sum + Number(item.confirmed_tickets || 0), 0),
    }),
    [events]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-sky-700">Module 5 | Evenements</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight text-slate-950">
              Catalogue, creation, inscription et billets QR.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Un espace operationnel pour publier des evenements, suivre les places, gerer les paiements et verifier les participants le jour J.
            </p>
          </div>
          <Link href="/module5/create" className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700">
            <Plus size={18} />
            Creer un evenement
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric icon={<Ticket size={18} />} label="Evenements" value={String(stats.total)} />
          <Metric icon={<Users size={18} />} label="Participants" value={String(stats.attendees)} />
          <Metric icon={<CalendarDays size={18} />} label="Places libres" value={String(stats.places)} />
        </div>

        <label className="relative mt-6 block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par titre, ville ou type"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </section>

      <section className="mt-6">
        {loading ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Chargement des evenements...</div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-red-700">{error}</div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-600">Aucun evenement trouve.</div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {events.map((event) => (
              <article key={event.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="grid min-h-[240px] md:grid-cols-[260px_1fr]">
                  <div className="relative min-h-[220px] bg-slate-100">
                    {event.banner_url ? <img src={event.banner_url} alt={event.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="grid h-full min-h-[220px] place-items-center text-slate-400">Image</div>}
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm">{labelFormat(event.format)}</span>
                  </div>

                  <div className="flex flex-col gap-4 p-5">
                    <div>
                      <p className="text-xs font-bold uppercase text-sky-700">{event.type}</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">{event.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{event.description || "Aucune description fournie."}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <SmallInfo icon={<CalendarDays size={16} />} label="Date" value={formatDate(event.starts_at)} />
                      <SmallInfo icon={<MapPin size={16} />} label="Ville" value={event.location_city || event.location_country || "Maroc"} />
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-lg font-black text-slate-950">{formatPrice(event.is_free, event.price_amount, event.currency)}</p>
                        <p className="text-sm text-slate-500">{event.remaining_capacity ?? 0} places restantes</p>
                      </div>
                      <Link href={`/module5/${event.id}`} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700">
                        Voir et s'inscrire
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function SmallInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
