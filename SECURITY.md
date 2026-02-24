# Security To-Do — Lynra Booking Engine

Last reviewed: 2026-02-24
Reviewer: Security audit (AI-assisted)
Status: Prototype — not yet cleared for production

---

## Legend

- [x] Fixed in current build
- [ ] Must fix before production
- [ ] Should fix before production
- [ ] Nice to have / post-launch

---

## Critical — Fix Before Any Production Deployment

### [ ] Authenticate API routes against Memberstack
**File:** `app/api/mews/*/route.ts`
**Risk:** The `/api/mews/*` routes are publicly accessible at the Vercel URL. Anyone who discovers the URL bypasses the Memberstack gate on the Webflow page entirely.
**Fix:** When Memberstack is integrated, pass the member JWT into the iframe (via URL param or `postMessage`) and verify it in each API route before proxying to Mews.
Example check to add at the top of each route:
```ts
const token = req.headers.get("x-memberstack-token");
const member = await verifyMemberstackJWT(token); // implement with Memberstack SDK
if (!member) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
```

---

### [ ] Restrict iframe embedding to your Webflow domain
**File:** `next.config.ts`, `.env.local`
**Risk:** `frame-ancestors *` in the CSP allows any website to embed the booking engine in an iframe. This enables clickjacking — an attacker embeds your booking flow in a transparent overlay and tricks users into interacting with it on a malicious page.
**Fix:** Set `ALLOWED_FRAME_ORIGIN` in your Vercel environment variables:
```
ALLOWED_FRAME_ORIGIN=https://yoursite.webflow.io
```
The `next.config.ts` already reads this variable and injects it into `frame-ancestors`.

---

### [ ] Add a PCI DSS-compliant CSP before enabling payment
**File:** `next.config.ts`
**Risk:** The current CSP uses `script-src 'unsafe-inline'`. PCI DSS v4 (enforced March 2025) explicitly prohibits `unsafe-inline` on any page that loads payment scripts. Magecart-style attacks inject scripts that exfiltrate card data — `unsafe-inline` makes this trivial.
**Fix:** Before integrating PCI Proxy, replace `unsafe-inline` with a per-request nonce:
- Next.js guide: https://nextjs.org/docs/app/guides/content-security-policy
- Add the PCI Proxy script origin explicitly: `script-src 'nonce-{nonce}' https://pay.datatrans.com`

---

### [ ] Replace in-memory rate limiter with Redis before scaling
**File:** `lib/rateLimit.ts`
**Risk:** The current rate limiter is in-memory and per-serverless-instance. Vercel spins up multiple isolated instances under load — they do not share state. A determined attacker can exhaust rate limit windows simply by routing requests across instances.
**Fix:** Add Upstash Redis (free tier available, native Vercel integration):
```bash
npm install @upstash/ratelimit @upstash/redis
```
Then replace `lib/rateLimit.ts` with the Upstash sliding window implementation.
Docs: https://github.com/upstash/ratelimit

---

## High — Fix Before Launch

### [ ] Implement PCI Proxy payment integration
**File:** `components/BookingFlow.tsx` — search for `PCI Proxy integration pending`
**Risk:** The confirmation step currently has a placeholder. No real payment is taken. This is intentional for the prototype but must be completed before the engine goes live.
**Steps:**
1. Sign up for a Datatrans/PCI Proxy merchant account
2. Register your merchant ID with Mews Support
3. Create a server-side route `app/api/payment/init/route.ts` to generate a `transactionId` (keeps Datatrans API key off the client)
4. Replace the placeholder card with the SecureFields hosted iframe
5. Pass the `transactionId` to Mews in `CreditCardData.PaymentGatewayData` on reservation creation
6. Verify `PaymentGateway` is non-null in the hotel config response before showing the payment form

---

### [ ] Add INTERNAL_API_SECRET to harden API routes pre-Memberstack
**File:** `.env.local`, `app/api/mews/*/route.ts`
**Risk:** While Memberstack JWT auth is being built, the API routes have zero authentication.
**Interim fix:** Generate a secret and require it as a header on all API calls:
```bash
openssl rand -hex 32
# Add to .env.local: INTERNAL_API_SECRET=<result>
# Add to Vercel environment variables (Production + Preview)
```
In each route, check:
```ts
const secret = req.headers.get("x-internal-secret");
if (secret !== process.env.INTERNAL_API_SECRET) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```
In `lib/mews.ts`, include it in all proxy requests:
```ts
headers: {
  "Content-Type": "application/json",
  "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
}
```
Note: this secret will be in the client bundle — it prevents casual abuse but not a determined attacker. Replace with Memberstack JWT as soon as possible.

---

### [ ] Validate Mews API responses before passing to the client
**File:** `app/api/mews/*/route.ts`
**Risk:** The proxy routes return the raw Mews response to the client without inspection. If Mews ever returns unexpected data (e.g. HTML error pages, malformed JSON), this propagates directly to the UI and could cause issues including unexpected data exposure.
**Fix:** Add basic response shape validation (e.g. with Zod) before returning to the client.

---

## Medium — Address Post-Launch

### [ ] Tighten Content Security Policy script-src
**File:** `next.config.ts`
**Risk:** `script-src 'unsafe-inline'` is broader than needed for production. It permits any inline script on the page, which weakens XSS defences.
**Fix:** Implement nonce-based CSP (see Critical section above). This is a meaningful XSS mitigation improvement.

---

### [ ] Add request logging and alerting
**Risk:** Currently errors are only logged to `console.error`. In production on Vercel, these appear in the function logs but there is no alerting. A sustained rate-limit bypass or inventory bombing attack would go unnoticed.
**Fix:** Integrate a logging service (e.g. Sentry, Axiom, or Vercel Log Drains) and set up an alert for:
- Repeated 429 responses from the reservation endpoint (inventory bombing indicator)
- Repeated 400 responses from the reservation endpoint (fuzzing indicator)
- 502 responses (Mews API availability)

---

### [ ] Add CORS origin allowlist to API routes
**File:** `app/api/mews/*/route.ts`
**Risk:** API routes respond to cross-origin requests from any domain. While this does not bypass authentication (once added), it allows other sites to probe the API's behaviour.
**Fix:** Add an explicit `Access-Control-Allow-Origin` response header restricted to your frontend domain, and handle `OPTIONS` preflight requests.

---

### [ ] Rotate the Mews Client string before production
**Risk:** The Client string (`My Client 1.0.0`) is shared with anyone who has accessed the demo environment. Before going live, register a unique client name with Mews Support and update `MEWS_CLIENT` in your production environment.
**Action:** Email Mews Support with: your chosen client name, team email, and target environment (Production). They will allowlist it.

---

### [ ] Set up Dependabot or equivalent for dependency updates
**Risk:** The project uses `next@16`, `react@19`, `@phosphor-icons/react@^2` with no automated update policy. Security patches in Next.js (which had several CVEs in 2024) would not be applied automatically.
**Fix:** Enable Dependabot in GitHub repository settings (`Settings → Code security → Dependabot`).

---

## Completed

- [x] Proxy routes reconstruct outbound body server-side — client cannot override HotelId or Client string
- [x] `MEWS_CLIENT`, `MEWS_HOTEL_ID`, `MEWS_API_URL` moved to server-only env vars (no `NEXT_PUBLIC_` prefix)
- [x] `HotelId` removed from client-side `ReservationRequest` — injected by server
- [x] Rate limiting: sliding window per IP (hotel 30/min, availability 20/min, reservation 10/hour)
- [x] Fetch timeouts on all outbound proxy requests (8–10s via `AbortSignal.timeout`)
- [x] Raw Mews error details no longer surface to the client — logged server-side only
- [x] Reservation route validates all fields server-side: dates, UUIDs, email, nationality, adult count
- [x] Input `maxLength` on all guest form fields matching server-side limits
- [x] Security headers: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- [x] `Cache-Control: no-store` on all API routes

---

## Pre-Launch Checklist

Before pointing a real Mews property at this engine, confirm:

- [ ] Memberstack JWT validation in all API routes
- [ ] `ALLOWED_FRAME_ORIGIN` set to production Webflow domain
- [ ] `unsafe-inline` removed from CSP, nonces implemented
- [ ] PCI Proxy integrated and tested end-to-end
- [ ] Redis-backed rate limiting deployed
- [ ] `INTERNAL_API_SECRET` set (interim measure)
- [ ] Mews Client string registered for production environment
- [ ] Sentry or equivalent error monitoring active
- [ ] Dependabot enabled on repository
- [ ] Penetration test or security review completed on staging
