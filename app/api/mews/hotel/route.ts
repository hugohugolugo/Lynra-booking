import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";

const MEWS_BASE = process.env.MEWS_API_URL ?? "https://api.mews-demo.com";
const MEWS_CLIENT = process.env.MEWS_CLIENT ?? "My Client 1.0.0";
const MEWS_HOTEL_ID = process.env.MEWS_HOTEL_ID ?? "";

export async function POST(req: NextRequest) {
  // Verify internal secret — rejects requests not originating from our own frontend.
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit: 30 requests per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(`hotel:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Body is ignored — all credentials come from server-side env vars only.
  const outboundBody = {
    Client: MEWS_CLIENT,
    HotelId: MEWS_HOTEL_ID,
    FullAmounts: true,
  };

  try {
    const res = await fetch(`${MEWS_BASE}/api/distributor/v1/hotels/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outboundBody),
      signal: AbortSignal.timeout(8_000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[mews/hotel]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 502 });
  }
}
