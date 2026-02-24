import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";

const MEWS_BASE = process.env.MEWS_API_URL ?? "https://api.mews-demo.com";
const MEWS_CLIENT = process.env.MEWS_CLIENT ?? "My Client 1.0.0";
const MEWS_HOTEL_ID = process.env.MEWS_HOTEL_ID ?? "";

const ALLOWED_CURRENCIES = new Set(["EUR", "USD", "CZK", "GBP", "NOK", "SEK", "DKK"]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(`availability:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Extract and validate only the fields the client is allowed to control.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { StartUtc, EndUtc, CurrencyCode } = body as Record<string, unknown>;

  if (typeof StartUtc !== "string" || !ISO_DATE_RE.test(StartUtc)) {
    return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
  }
  if (typeof EndUtc !== "string" || !ISO_DATE_RE.test(EndUtc)) {
    return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
  }
  if (new Date(StartUtc) >= new Date(EndUtc)) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  const currency =
    typeof CurrencyCode === "string" && ALLOWED_CURRENCIES.has(CurrencyCode)
      ? CurrencyCode
      : "EUR";

  // Reconstruct outbound body — credentials injected server-side only.
  const outboundBody = {
    Client: MEWS_CLIENT,
    HotelId: MEWS_HOTEL_ID,
    FullAmounts: true,
    StartUtc,
    EndUtc,
    CurrencyCode: currency,
  };

  try {
    const res = await fetch(`${MEWS_BASE}/api/distributor/v1/hotels/getAvailability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outboundBody),
      signal: AbortSignal.timeout(8_000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[mews/availability]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 502 });
  }
}
