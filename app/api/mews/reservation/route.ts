import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";

const MEWS_BASE = process.env.MEWS_API_URL ?? "https://api.mews-demo.com";
const MEWS_CLIENT = process.env.MEWS_CLIENT ?? "My Client 1.0.0";
const MEWS_HOTEL_ID = process.env.MEWS_HOTEL_ID ?? "";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NATIONALITY_RE = /^[A-Z]{2}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;
const ALLOWED_CURRENCIES = new Set(["EUR", "USD", "CZK", "GBP", "NOK", "SEK", "DKK"]);

function isUUID(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function isString(v: unknown, minLen = 1, maxLen = 255): v is string {
  return typeof v === "string" && v.trim().length >= minLen && v.length <= maxLen;
}

function validationError(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function POST(req: NextRequest) {
  // Verify internal secret — rejects requests not originating from our own frontend.
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Strictest rate limit: 10 reservation attempts per hour per IP.
  // This prevents inventory bombing (creating fake reservations to block rooms).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(`reservation:${ip}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError("Invalid request");
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return validationError("Invalid request");
  }

  const b = body as Record<string, unknown>;

  // ── Dates ──────────────────────────────────────────────────────────────────
  if (typeof b.StartUtc !== "string" || !ISO_DATE_RE.test(b.StartUtc)) {
    return validationError("Invalid start date");
  }
  if (typeof b.EndUtc !== "string" || !ISO_DATE_RE.test(b.EndUtc)) {
    return validationError("Invalid end date");
  }
  if (new Date(b.StartUtc) >= new Date(b.EndUtc)) {
    return validationError("End date must be after start date");
  }
  if (new Date(b.StartUtc) < new Date(new Date().toISOString().slice(0, 10))) {
    return validationError("Start date cannot be in the past");
  }

  // ── Room & rate ────────────────────────────────────────────────────────────
  if (!isUUID(b.RoomCategoryId)) {
    return validationError("Invalid room selection");
  }
  // RateId is optional for prototype (may be empty string)
  if (b.RateId !== "" && !isUUID(b.RateId)) {
    return validationError("Invalid rate selection");
  }

  // ── Occupancy ──────────────────────────────────────────────────────────────
  if (
    typeof b.AdultCount !== "number" ||
    !Number.isInteger(b.AdultCount) ||
    b.AdultCount < 1 ||
    b.AdultCount > 20
  ) {
    return validationError("Invalid guest count");
  }

  // ── Products ───────────────────────────────────────────────────────────────
  if (!Array.isArray(b.ProductIds) || b.ProductIds.length > 20) {
    return validationError("Invalid products");
  }
  if (b.ProductIds.some((id: unknown) => typeof id !== "string" || !UUID_RE.test(id))) {
    return validationError("Invalid product selection");
  }

  // ── Currency ───────────────────────────────────────────────────────────────
  if (
    typeof b.CurrencyCode !== "string" ||
    !CURRENCY_RE.test(b.CurrencyCode) ||
    !ALLOWED_CURRENCIES.has(b.CurrencyCode)
  ) {
    return validationError("Invalid currency");
  }

  // ── Customer ───────────────────────────────────────────────────────────────
  const c = b.Customer;
  if (typeof c !== "object" || c === null || Array.isArray(c)) {
    return validationError("Missing customer details");
  }
  const customer = c as Record<string, unknown>;

  if (!isString(customer.FirstName, 1, 100)) return validationError("Invalid first name");
  if (!isString(customer.LastName, 1, 100))  return validationError("Invalid last name");
  if (!isString(customer.Email, 1, 254) || !EMAIL_RE.test(customer.Email as string)) {
    return validationError("Invalid email address");
  }
  if (!isString(customer.Phone, 1, 30)) return validationError("Invalid phone number");
  if (
    typeof customer.NationalityCode !== "string" ||
    !NATIONALITY_RE.test(customer.NationalityCode)
  ) {
    return validationError("Invalid nationality");
  }

  // ── Build outbound body — credentials injected server-side only ────────────
  const outboundBody = {
    Client: MEWS_CLIENT,
    HotelId: MEWS_HOTEL_ID,
    FullAmounts: true,
    StartUtc: b.StartUtc,
    EndUtc: b.EndUtc,
    RoomCategoryId: b.RoomCategoryId,
    RateId: b.RateId,
    AdultCount: b.AdultCount,
    ProductIds: b.ProductIds,
    CurrencyCode: b.CurrencyCode,
    Customer: {
      FirstName: (customer.FirstName as string).trim(),
      LastName:  (customer.LastName  as string).trim(),
      Email:     (customer.Email     as string).trim().toLowerCase(),
      Phone:     (customer.Phone     as string).trim(),
      NationalityCode: customer.NationalityCode,
    },
  };

  try {
    const res = await fetch(`${MEWS_BASE}/api/distributor/v1/reservationGroups/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outboundBody),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[mews/reservation]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 502 });
  }
}
