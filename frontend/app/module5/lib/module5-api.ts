const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function handleResponse(response: Response) {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.error || response.statusText || "Erreur API");
  }

  return data;
}

export async function fetchEvents(query?: string) {
  const url = new URL(`${BASE_URL}/api/module5/events`);
  if (query) {
    url.searchParams.set("q", query);
  }
  return handleResponse(await fetch(url.toString()));
}

export async function fetchEventById(eventId: string) {
  return handleResponse(await fetch(`${BASE_URL}/api/module5/events/${encodeURIComponent(eventId)}`));
}

export async function createEvent(payload: Record<string, unknown>) {
  return handleResponse(
    await fetch(`${BASE_URL}/api/module5/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function fetchPaymentProviders() {
  return handleResponse(await fetch(`${BASE_URL}/api/module2/providers`));
}

export async function registerForEvent(eventId: string, payload: Record<string, unknown>) {
  return handleResponse(
    await fetch(`${BASE_URL}/api/module5/events/${encodeURIComponent(eventId)}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function fetchEventAttendees(eventId: string) {
  return handleResponse(await fetch(`${BASE_URL}/api/module5/events/${encodeURIComponent(eventId)}/attendees`));
}

export async function checkInTicket(payload: { ticketId?: string; ticketCode?: string; checkedInByUserId?: number }) {
  return handleResponse(
    await fetch(`${BASE_URL}/api/module5/tickets/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function emailTicket(ticketId: string, payload: Record<string, unknown> = {}) {
  return handleResponse(
    await fetch(`${BASE_URL}/api/module5/tickets/${encodeURIComponent(ticketId)}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export function ticketPdfUrl(ticketId: string) {
  return `${BASE_URL}/api/module5/tickets/${encodeURIComponent(ticketId)}/pdf`;
}

export function ticketQrUrl(ticketId: string) {
  return `${BASE_URL}/api/module5/tickets/${encodeURIComponent(ticketId)}/qr`;
}
