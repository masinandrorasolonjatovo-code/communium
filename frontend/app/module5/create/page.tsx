"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, Eye, ImagePlus, MapPin, Monitor, ShieldCheck, Ticket } from "lucide-react";
import { createEvent } from "../lib/module5-api";

const now = new Date();
const defaultStart = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
const defaultEnd = new Date(defaultStart.getTime() + 1000 * 60 * 60 * 3);

const formatLocal = (date: Date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
};

const fieldClass =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

const optionClass = (active: boolean) =>
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
    active ? "border-sky-600 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
  }`;

export default function CreateEventPage() {
  const [title, setTitle] = useState("Roundtable Business Maroc");
  const [organizer, setOrganizer] = useState("OLA Agency");
  const [description, setDescription] = useState(
    "Table ronde exclusive entre dirigeants, acheteurs et experts du commerce international."
  );
  const [bannerUrl, setBannerUrl] = useState("");
  const [virtualLink, setVirtualLink] = useState("");
  const [format, setFormat] = useState<"physical" | "virtual" | "hybrid">("physical");
  const [privacy, setPrivacy] = useState<"public" | "members_only">("public");
  const [type, setType] = useState("roundtable");
  const [locationName, setLocationName] = useState("Technopark Casablanca");
  const [locationAddress, setLocationAddress] = useState("4eme etage, bureau 452");
  const [locationCity, setLocationCity] = useState("Casablanca");
  const [startsAt, setStartsAt] = useState(formatLocal(defaultStart));
  const [endsAt, setEndsAt] = useState(formatLocal(defaultEnd));
  const [capacity, setCapacity] = useState(50);
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState(150);
  const [currency, setCurrency] = useState<"MAD" | "TKS">("MAD");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [eventLink, setEventLink] = useState<string | null>(null);

  const requiresPlace = format === "physical" || format === "hybrid";
  const requiresLink = format === "virtual" || format === "hybrid";
  const dateInvalid = new Date(endsAt) <= new Date(startsAt);

  const payload = useMemo(
    () => ({
      organizer_business_name: organizer,
      title: title.trim(),
      description: description.trim(),
      banner_url: bannerUrl.trim() || null,
      virtual_link: requiresLink ? virtualLink.trim() || null : null,
      type,
      format,
      privacy,
      status: "published",
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      timezone: "Africa/Casablanca",
      location_name: requiresPlace ? locationName.trim() : null,
      location_address: requiresPlace ? locationAddress.trim() : null,
      location_city: requiresPlace ? locationCity.trim() : null,
      location_country: "Maroc",
      capacity,
      waitlist_enabled: true,
      registration_opens_at: new Date().toISOString(),
      registration_closes_at: new Date(startsAt).toISOString(),
      is_free: isFree,
      price_amount: isFree ? 0 : price,
      currency,
      refund_policy: "Aucun remboursement automatique apres publication.",
      published_at: new Date().toISOString(),
      metadata: { organizer_business_name: organizer },
    }),
    [organizer, title, description, bannerUrl, requiresLink, virtualLink, type, format, privacy, startsAt, endsAt, requiresPlace, locationName, locationAddress, locationCity, capacity, isFree, price, currency]
  );

  const handleSubmit = async (eventSubmit: FormEvent<HTMLFormElement>) => {
    eventSubmit.preventDefault();
    setMessage(null);

    if (dateInvalid) {
      setMessage("La date de fin doit etre apres la date de debut.");
      return;
    }

    if (requiresLink && !virtualLink.trim()) {
      setMessage("Le lien en ligne est obligatoire pour un evenement virtuel ou hybride.");
      return;
    }

    setSubmitting(true);
    try {
      const createdEvent = await createEvent(payload);
      setEventLink(`/module5/${createdEvent.id}`);
      setMessage("Evenement publie avec succes. Il est pret a etre partage.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur lors de la creation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/module5" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300">
          <ArrowLeft size={16} />
          Retour
        </Link>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase text-sky-700">
          Etape 1 sur 3
        </span>
      </div>

      <form className="grid gap-6 lg:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <ImagePlus className="mt-1 text-sky-600" size={22} />
              <div>
                <p className="text-sm font-bold uppercase text-sky-700">Presentation de l'evenement</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Creer un evenement professionnel</h1>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Titre
                <input value={title} onChange={(e) => setTitle(e.target.value)} required className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Organisateur
                <input value={organizer} onChange={(e) => setOrganizer(e.target.value)} required className={fieldClass} />
              </label>
            </div>

            <label className="mt-4 block text-sm font-semibold text-slate-800">
              Image de banniere 16:9
              <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className={fieldClass} />
            </label>

            <label className="mt-4 block text-sm font-semibold text-slate-800">
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required className={fieldClass} />
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Monitor className="text-sky-600" size={21} />
              <h2 className="text-xl font-bold text-slate-950">Format, lieu et acces</h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => setFormat("physical")} className={optionClass(format === "physical")}>Physique</button>
              <button type="button" onClick={() => setFormat("virtual")} className={optionClass(format === "virtual")}>Virtuel</button>
              <button type="button" onClick={() => setFormat("hybrid")} className={optionClass(format === "hybrid")}>Hybride</button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Type
                <select value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>
                  <option value="networking">Networking</option>
                  <option value="roundtable">Table ronde</option>
                  <option value="workshop">Atelier</option>
                  <option value="conference">Conference</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Confidentialite
                <select value={privacy} onChange={(e) => setPrivacy(e.target.value as "public" | "members_only")} className={fieldClass}>
                  <option value="public">Public</option>
                  <option value="members_only">Reserve aux membres</option>
                </select>
              </label>
            </div>

            {requiresPlace ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-semibold text-slate-800">
                  Ville
                  <input value={locationCity} onChange={(e) => setLocationCity(e.target.value)} required={requiresPlace} className={fieldClass} />
                </label>
                <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
                  Adresse du lieu
                  <input value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} required={requiresPlace} className={fieldClass} />
                </label>
                <label className="text-sm font-semibold text-slate-800 sm:col-span-3">
                  Nom du lieu
                  <input value={locationName} onChange={(e) => setLocationName(e.target.value)} className={fieldClass} />
                </label>
              </div>
            ) : null}

            {requiresLink ? (
              <label className="mt-4 block text-sm font-semibold text-slate-800">
                Lien de connexion
                <input value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} placeholder="https://meet.example.com/room" required={requiresLink} className={fieldClass} />
              </label>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-sky-600" size={21} />
              <h2 className="text-xl font-bold text-slate-950">Planning et billetterie</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Debut
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Fin
                <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Places disponibles
                <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Math.max(1, Number(e.target.value)))} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Devise
                <select value={currency} onChange={(e) => setCurrency(e.target.value as "MAD" | "TKS")} disabled={isFree} className={fieldClass}>
                  <option value="MAD">MAD</option>
                  <option value="TKS">TKS</option>
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_220px]">
              <button type="button" onClick={() => setIsFree((v) => !v)} className={optionClass(isFree)}>
                <Ticket size={16} />
                {isFree ? "Entree gratuite" : "Entree payante"}
              </button>
              {!isFree ? (
                <input type="number" min={1} value={price} onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))} className={fieldClass.replace("mt-2 ", "")} />
              ) : null}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="sticky top-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sky-700">
              <Eye size={18} />
              <p className="text-sm font-bold uppercase">Apercu</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              {bannerUrl ? <img src={bannerUrl} alt="" className="h-40 w-full object-cover" /> : <div className="grid h-40 place-items-center bg-slate-100 text-sm text-slate-400">Banniere</div>}
              <div className="space-y-3 p-4">
                <p className="text-xs font-bold uppercase text-sky-700">{type} | {format}</p>
                <h2 className="text-xl font-black text-slate-950">{title || "Titre de l'evenement"}</h2>
                <p className="text-sm text-slate-600">{description || "Description de l'evenement."}</p>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="mt-0.5 text-slate-400" />
                  <span>{requiresPlace ? `${locationName}, ${locationCity}` : "En ligne"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 size={16} className="text-slate-400" />
                  <span>{organizer}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck size={16} />
                Validation
              </div>
              <p>Capacite, liste d'attente, paiement et billet QR sont connectes au serveur.</p>
            </div>

            <button type="submit" disabled={submitting || dateInvalid} className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Publication..." : "Publier l'evenement"}
            </button>

            {message ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>{message}</p>
                {eventLink ? <Link href={eventLink} className="mt-3 inline-flex font-bold text-sky-700">Voir l'evenement</Link> : null}
              </div>
            ) : null}
          </section>
        </aside>
      </form>
    </main>
  );
}
