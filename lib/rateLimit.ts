/**
 * In-memory sliding-window rate limiter.
 *
 * Works reliably within a single warm serverless instance. On Vercel, multiple
 * concurrent instances do NOT share state, so this is best-effort rather than
 * absolute. For production, replace with Upstash Redis + @upstash/ratelimit.
 */

interface Window {
  timestamps: number[];
}

const store = new Map<string, Window>();

// Prune stale entries every 5 minutes to avoid unbounded memory growth.
setInterval(() => {
  const cutoff = Date.now() - 60 * 60_000; // 1 hour
  for (const [key, win] of store.entries()) {
    win.timestamps = win.timestamps.filter((t) => t > cutoff);
    if (win.timestamps.length === 0) store.delete(key);
  }
}, 5 * 60_000).unref?.(); // .unref() prevents keeping the process alive in tests

/**
 * Returns true if the key has exceeded the limit within the window.
 * @param key      Typically `${endpoint}:${ip}`
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const win = store.get(key) ?? { timestamps: [] };
  win.timestamps = win.timestamps.filter((t) => t > cutoff);

  if (win.timestamps.length >= limit) {
    store.set(key, win);
    return true;
  }

  win.timestamps.push(now);
  store.set(key, win);
  return false;
}
