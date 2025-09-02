# CoinGecko Integration

This document outlines how the app integrates with CoinGecko, including the separation of Free vs Pro usage, transport and caching strategy, validation and typing, and operational considerations. File references are included inline for quick navigation.

## Goals
- Keep the CoinGecko Pro API key server-only and never expose it to clients or intermediaries.
- Reduce Pro API usage and cost via Vercel CDN caching on server GET endpoints.
- Fetch public market data from the Free API on the client when possible.
- Strong runtime validation and compile-time typing for supported coin IDs.
- Resilient client UX with adaptive polling and automatic price fallback.

## Responsibilities
- Client
  - Fetches market data (current prices) from CoinGecko Free API using GET without credentials.
  - Uses adaptive polling only when visible and online; conservative retries/backoff.
  - Converts token balances to USD using CoinGecko markets data; automatically falls back to DexScreener on errors.
- Server (tRPC + Vercel Functions)
  - Uses Pro API key for detailed coin data and historical charts.
  - Sets Cache-Control headers for Vercel CDN caching and serves identical responses to all users (no auth, no cookies).
  - Validates inputs strictly against supported coin IDs and allowed parameters.

Key files
- Client
  - packages/app/utils/coin-gecko/index.tsx (markets fetch, schemas, charts hook)
  - packages/app/utils/useTokenPrices.ts (USD price aggregation with DexScreener fallback)
  - packages/app/utils/api.ts (tRPC links and transport routing)
  - packages/app/features/home/charts/shared/useTokenChartData.ts (chart data consumption)
- Server
  - packages/api/src/routers/coingecko/router.ts (tRPC router for coin data and charts)
- Types/data
  - packages/app/data/coins.ts (COINGECKO_IDS, CoinGeckoId and coin metadata)

## Endpoints and data sources
- Client → CoinGecko Free
  - /api/v3/coins/markets
  - Notes: GET only, credentials omitted, publicly cacheable by CDN (not used via server to avoid Pro usage).
- Server (Pro when available, fallback to Free on some errors)
  - /api/v3/coins/{id}?market_data=true (used by getCoingeckoCoin)
  - /api/v3/coins/{id}/market_chart (used by getMarketChart)
  - Pro header: x-cg-pro-api-key: process.env.COINGECKO_PRO_KEY

## Transport and routing
- Client routes cacheable queries over GET without credentials using splitLink. Current routing is based on the “coinGecko.” prefix.

```ts path=/Users/vict0xr/documents/Send/sendapp/packages/app/utils/api.ts start=12
links: [
  splitLink({
    condition(op) {
      // Route public coin endpoints over GET to enable Vercel CDN caching
      return op.type === 'query' && op.path.startsWith('coinGecko.')
    },
    true: httpLink({
      url,
      transformer: SuperJSON,
      // Omit credentials so responses can be cached by CDN
      fetch(url, opts) {
        return fetch(url, { ...opts, credentials: 'omit' })
      },
    }),
    // All other procedures remain batched over POST
    false: httpBatchLink({ url, transformer: SuperJSON }),
  }),
]
```

Future improvement (recommended): route by a per-call context flag (e.g., publicGet) rather than a path prefix to fully decouple transport from router naming.

## Caching strategy (server)
- Only GET or HEAD requests with proper cache headers are cached by Vercel’s CDN.
- No Authorization header or cookies on these routes.
- Current TTLs:
  - getCoingeckoCoin (with market_data):
    - Cache-Control: public, s-maxage=120, stale-while-revalidate=600
  - getMarketChart:
    - s-maxage depends on days: 1 → 300s, 7/30/90 → 3600s, else → 86400s
    - stale-while-revalidate set to 6x the s-maxage

Router (excerpt):
```ts path=/Users/vict0xr/documents/Send/sendapp/packages/api/src/routers/coingecko/router.ts start=14
async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders() })
  if (!res.ok) {
    // If Pro request fails (e.g., 402/429), try Free API fallback
    if (COINGECKO_PRO_KEY && (res.status === 402 || res.status === 429)) {
      const freeUrl = url.replace('https://pro-api.coingecko.com', 'https://api.coingecko.com')
      const freeRes = await fetch(freeUrl, { headers: { accept: 'application/json' } })
      if (!freeRes.ok) throw new Error(`CoinGecko fallback failed: ${freeRes.status}`)
      return (await freeRes.json()) as T
    }
    throw new Error(`CoinGecko request failed: ${res.status}`)
  }
  return (await res.json()) as T
}
```

```ts path=/Users/vict0xr/documents/Send/sendapp/packages/api/src/routers/coingecko/router.ts start=64
const url = new URL(`${base}/coins/${id}/market_chart`)
url.searchParams.set('vs_currency', input.vsCurrency ?? 'usd')
url.searchParams.set('days', input.days)
url.searchParams.delete('interval')
url.searchParams.set('precision', 'full')
...
// Adjust TTL to match CG data cadence by days
const ttl = input.days === '1' ? 300 : ['7', '30', '90'].includes(input.days) ? 3600 : 86400
ctx.res?.setHeader?.(
  'Cache-Control',
  `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 6}`
)
```

Notes
- Use s-maxage for CDN (shared) caching; browsers ignore s-maxage and respect max-age (not used here).
- Avoid caching non-200 responses: ensure error cases are returned without cacheable headers.
- No Set-Cookie on these responses.

## Client markets fetching
- Markets fetch: CoinGecko Free /coins/markets via GET with credentials omitted.
- Adaptive polling: only when tab is visible and device online; interval depends on network quality.
- Conservative retry/backoff to avoid hammering during 429/5xx.

Excerpt (URL builder and query):
```ts path=/Users/vict0xr/documents/Send/sendapp/packages/app/utils/coin-gecko/index.tsx start=78
function buildCgMarketsUrl(params: {
  ids: readonly (typeof COINGECKO_IDS)[number][]
  vsCurrency: 'usd'
  priceChangePercentage: readonly ('24h' | '7d')[]
}) {
  const canonicalIds = Array.from(new Set(params.ids)).sort().join(',')
  const url = new URL('https://api.coingecko.com/api/v3/coins/markets')
  url.searchParams.set('ids', canonicalIds)
  url.searchParams.set('vs_currency', params.vsCurrency)
  url.searchParams.set('price_change_percentage', params.priceChangePercentage.join(','))
  return url
}
```

## Price aggregation and fallback
- useTokenPrices aggregates token → USD prices for holdings.
- Primary source: CoinGecko markets data.
- Automatic fallback: If CoinGecko Free returns 429/5xx/network errors, DexScreener is used as a fallback source.

References
- packages/app/utils/useTokenPrices.ts
- packages/app/utils/coin-gecko/index.tsx

## Validation and typing
- Supported IDs are centralized:
  - packages/app/data/coins.ts exports COINGECKO_IDS (const tuple) and CoinGeckoId (literal union).
- Client schemas validate IDs at runtime:
  - MarketDataSchema uses z.enum(COINGECKO_IDS) for id.
- Server validates inputs using a CoinGecko ID enum and restricts days, vsCurrency, and precision to an approved set.

## Security
- COINGECKO_PRO_KEY is read only on the server (Vercel function env).
- Pro requests include the header x-cg-pro-api-key; the key is never exposed to clients.
- Client markets requests never send Authorization or cookies; responses are publicly cacheable.

## Observability
- Monitor x-vercel-cache: HIT/MISS on server GET routes in preview/prod.
- Track upstream 429 and error rates from CoinGecko Free and Pro.
- Add logging/monitoring of schema parse failures (Zod) to catch shape drift.

## Deployment notes
- Verify GET routes in production omit cookies/auth headers and return cacheable responses.
- Confirm second request yields x-vercel-cache: HIT.
- Validate UI behavior under 429/5xx from CoinGecko Free; DexScreener fallback should engage automatically for prices.

## Future improvements
- Transport: switch splitLink condition to a per-call context flag (e.g., publicGet) to avoid path-prefix coupling.
- Caching resilience: consider adding jitter to s-maxage and single-flight coalescing on server routes to further reduce cache stampedes.
- Optional: add a small cron/worker cache warmer hitting the most common coins/timeframes with staggered jitter.

---

## Change record (for workers)

"Doc-comment" explaining why we include the record below, then the actual commits and PR link. This helps future workers quickly regain context and operate safely.

```ts path=null start=null
/**
 * Why keep a commit list and PR link here?
 *
 * - Atomic commits: Small, single-purpose commits make intent clear and rollback painless. When you scan this list,
 *   you can tell what changed without diff-diving the entire repo.
 * - Last updated: Knowing when this document was last touched helps you gauge freshness of the architecture notes.
 *   If it’s stale, prefer the code paths referenced above and plan to refresh this doc.
 * - Next-worker context: The bullets above summarize what matters operationally (Pro vs Free, caching, fallbacks).
 *   If you’re extending or debugging, you can jump straight to the right files and PR.
 *
 * Last updated: 2025-09-02T19:53:13Z
 */
```

Commits in this PR (base: origin/use_coingecko_pro):
- 3050edb6 docs: add CoinGecko integration (coingecko.md) and update investments-body to reference markets and fallback
- 1767d221 Use coingecko pro

PR links:
- GitHub: https://github.com/0xsend/sendapp/pull/1896
- Graphite: https://app.graphite.dev/github/pr/0xsend/sendapp/1896

