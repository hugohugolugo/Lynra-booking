/**
 * Client-side Mews API helpers.
 *
 * These functions call /api/mews/* proxy routes which run server-side.
 * Credentials (Client string, HotelId) are NEVER present here — they live
 * in server-only env vars (no NEXT_PUBLIC_ prefix) and are injected by the
 * route handlers.
 */
import type {
  HotelConfig,
  AvailabilityResponse,
  ReservationRequest,
  ReservationResponse,
} from "./types";

async function mewsProxy<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`/api/mews/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Do not surface raw error detail to the UI — route handlers log it server-side.
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function getHotel(): Promise<HotelConfig> {
  // No body needed — the route handler constructs the full Mews request.
  return mewsProxy<HotelConfig>("hotel", {});
}

export async function getAvailability(params: {
  startUtc: string;
  endUtc: string;
  currencyCode?: string;
}): Promise<AvailabilityResponse> {
  return mewsProxy<AvailabilityResponse>("availability", {
    StartUtc: params.startUtc,
    EndUtc: params.endUtc,
    CurrencyCode: params.currencyCode ?? "EUR",
  });
}

export async function createReservation(
  params: Omit<ReservationRequest, "HotelId">
): Promise<ReservationResponse> {
  return mewsProxy<ReservationResponse>("reservation", {
    StartUtc: params.StartUtc,
    EndUtc: params.EndUtc,
    RoomCategoryId: params.RoomCategoryId,
    RateId: params.RateId,
    AdultCount: params.AdultCount,
    ProductIds: params.ProductIds,
    Customer: params.Customer,
    CurrencyCode: params.CurrencyCode,
  });
}

export function buildImageUrl(baseUrl: string, imageId: string): string {
  return `${baseUrl}/${imageId}?Mode=Contain&Width=600&Height=400`;
}

export function extractPricing(
  availability: import("./types").RoomCategoryAvailability,
  rates: import("./types").Rate[],
  currencyCode: string,
  nightCount: number
): { rate: import("./types").Rate | null; perNight: number; total: number } | null {
  const occ = availability.RoomOccupancyAvailabilities?.[0];
  if (!occ) return null;

  const pricingItem = occ.Pricing?.[0];
  if (!pricingItem) return null;

  const avgPerNight = pricingItem.Price?.AveragePerNight?.[currencyCode]?.GrossValue;
  const totalPrice  = pricingItem.Price?.Total?.[currencyCode]?.GrossValue;

  if (avgPerNight == null) return null;

  const rate = rates.find((r) => r.Id === pricingItem.RateId) ?? rates[0] ?? null;

  return {
    rate,
    perNight: avgPerNight,
    total: totalPrice ?? avgPerNight * nightCount,
  };
}
