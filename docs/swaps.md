# Swaps: form and API (dual-input quoting)

Goal
- Allow users to enter either the input amount (You Pay) or the output amount (You Receive) on the trade form.
- Use the existing Kyber routing API to compute the opposite side.
- Preserve the downstream data contract: summary page input and user-op building still rely on inToken, outToken, inAmount, slippage only.

Scope
- Frontend: packages/app/features/swap/form/screen.tsx
- API: packages/api/src/routers/swap/{types.ts,router.ts}
- Summary: packages/app/features/swap/summary/screen.tsx
- Constants: packages/app/features/swap/constants.ts

Current state (repo references)

- API request schema: exact-in only (requires amountIn)
```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/api/src/routers/swap/types.ts start=7
export const KyberGetSwapRouteRequestSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
})
```

- API router builds Kyber request with amountIn and fee params
```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/api/src/routers/swap/router.ts start=36
const fetchKyberSwapRoute = async ({ tokenIn, tokenOut, amountIn }: KyberGetSwapRouteRequest) => {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_KYBER_SWAP_BASE_URL}/${CHAIN}/api/v1/routes`)
    url.searchParams.append('tokenIn', adjustTokenIfNeed(tokenIn))
    url.searchParams.append('tokenOut', adjustTokenIfNeed(tokenOut))
    url.searchParams.append('amountIn', amountIn)
    url.searchParams.append('feeAmount', SWAP_FEE)
    url.searchParams.append('chargeFeeBy', 'currency_out')
    url.searchParams.append('isInBps', 'true')
    url.searchParams.append('feeReceiver', sendSwapsRevenueSafeAddress[baseMainnetClient.chain.id])

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    }).then((res) => res.json())

    const kyberGetSwapRouteResponse = KyberGetSwapRouteResponseSchema.parse(response)
```

- Route summary contains both amountIn and amountOut (so either side can be displayed after quoting)
```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/api/src/routers/swap/types.ts start=29
export const KyberRouteSummarySchema = z.object({
  tokenIn: addressLower,
  amountIn: z.string(),
  amountInUsd: z.string(),
  tokenOut: addressLower,
  amountOut: z.string(),
  amountOutUsd: z.string(),
  gas: z.string(),
  gasPrice: z.string(),
  gasUsd: z.string(),
  extraFee: z
    .object({
      feeAmount: z.string(),
      chargeFeeBy: z.string(),
      isInBps: z.boolean(),
      feeReceiver: z.string(),
    })
    .optional(),
  route: z.array(z.array(SwapRoutePoolSchema)),
  checksum: z.string(),
  timestamp: z.number(),
})
```

- Form: exact-in flow uses amountIn and derives outAmount via routeSummary.amountOut
```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/app/features/swap/form/screen.tsx start=61
const {
  data: swapRoute,
  error: swapRouteError,
  isFetching: isFetchingRoute,
} = api.swap.fetchSwapRoute.useQuery(
  {
    tokenIn: inCoin?.token || '',
    tokenOut: outCoin?.token || '',
    amountIn: inAmount || '',
  },
  {
    enabled: Boolean(inCoin && outCoin && inAmount),
    refetchInterval: 20_000,
  }
)
```

```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/app/features/swap/form/screen.tsx start=174
useEffect(() => {
  if (!swapRoute || !formInAmount) {
    return
  }

  form.setValue(
    'outAmount',
    localizeAmount(
      formatAmount(
        formatUnits(BigInt(swapRoute.routeSummary.amountOut), outCoin?.decimals || 0),
        12,
        outCoin?.formatDecimals
      )
    )
  )
}, [swapRoute, outCoin?.decimals, form.setValue, formInAmount, outCoin?.formatDecimals])
```

- Summary page contract (unchanged): reads cached SWAP_ROUTE_SUMMARY_QUERY_KEY and params.inAmount
```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/app/features/swap/summary/screen.tsx start=69
const routeSummary = queryClient.getQueryData<KyberRouteSummary>([SWAP_ROUTE_SUMMARY_QUERY_KEY])
const amountIn = localizeAmount(
  formatUnits(BigInt(routeSummary?.amountIn || 0), inCoin?.decimals || 0)
)
const amountOut = localizeAmount(
  formatAmount(
    formatUnits(BigInt(routeSummary?.amountOut || 0), outCoin?.decimals || 0),
    12,
    outCoin?.formatDecimals
  )
)
```

- Constants
```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/app/features/swap/constants.ts start=1
export const SWAP_ROUTE_SUMMARY_QUERY_KEY = 'swapRouteSummary'
export const DEFAULT_SLIPPAGE = 50
```

Repository patterns to reuse (no new patterns)

- Debounce + sanitize + write to URL params (we will mirror this for both fields):
```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/app/features/send/SendAmountForm.tsx start=56
const onFormChange = useDebounce(
  useCallback(
    (values) => {
      const { amount, token: _token, note } = values
      const sendToken = _token as allCoins[number]['token']
      const sanitizedAmount = sanitizeAmount(
        amount,
        allCoinsDict[sendToken]?.decimals
      )?.toString()

      const noteValidation = formFields.note.safeParse(note)
      if (noteValidation.error) {
        form.setError('note', { message: ... })
      } else {
        form.clearErrors('note')
      }
      setSendParams(
        {
          ...sendParams,
          amount: sanitizedAmount,
          sendToken,
          note: note.trim(),
        },
        { webBehavior: 'replace' }
      )
    },
    [setSendParams, sendParams, form]
  ),
  300,
  { leading: false },
  []
)
```

- Zod union/discriminatedUnion examples (for request shape update):
```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/app/utils/zod/activity/TemporalTransfersEventSchema.ts start=63
const TemporalTranfersDataSchema = z.union([
  TokenTemporalTransfersDataSchema,
  EthTemporalTransfersDataSchema,
])
```

```ts path=/Users/vict0xr/Documents/Send/sendapp/packages/app/utils/zod/activity/index.ts start=46
export const EventSchema = z
  .discriminatedUnion('event_name', [
    SendAccountTransfersEventSchema,
    TagReceiptsEventSchema,
    TagReceiptUSDCEventSchema,
    ReferralsEventSchema,
    SendAccountReceiveEventSchema,
    TemporalTransfersEventSchema,
    SendEarnDepositEventSchema,
    SendEarnWithdrawEventSchema,
    TemporalSendEarnDepositEventSchema,
    SendAccountSigningKeyAddedEventSchema,
    SendAccountSigningKeyRemovedEventSchema,
  ])
```

What is allowed today (from our API)
- Only exact-in quoting is supported in code: a request must include amountIn.
- The router passes amountIn to Kyber’s routes endpoint along with fee parameters.
- RouteSummary includes both amountIn and amountOut, enabling the UI to show the opposite side after quoting.

New plan: exact-in route + exact-out estimator (size‑aware)

Motivation
- Keep per‑keystroke UX responsive while supporting input on either column and fast token flips.
- Quotes should be size‑aware; for exact-out we only need a fast estimate of amountIn during typing.
- Preserve the downstream data contract; we still encode using the true swap route (exact‑in) and set the routeSummary in cache on submit.

How it works (per keystroke)
- Endpoints:
  - api.swap.fetchSwapRoute (EXACT_IN): swap Kyber quote with { tokenIn, tokenOut, amountIn } → { routerAddress, routeSummary }.
  - api.swap.estimateAmountInFromAmountOut (EXACT_OUT): estimator with { tokenIn, tokenOut, amountOut } → { estimatedAmountIn, amountInUsd, amountOutUsd }.
    - Implementation: probe swap with probeIn = 10^decimals(inToken) to get outProbe; compute estimatedAmountIn = amountOut × (probeIn / outProbe). USDs are scaled linearly from the probe quote.
- EXACT_IN (user edits inAmount): call fetchSwapRoute; use routeSummary.amountOut and routeSummary USDs to populate the form. Swap query is enabled only when quoteSide === 'EXACT_IN'.
- EXACT_OUT (user edits outAmount): call estimateAmountInFromAmountOut; set inAmount from estimatedAmountIn (display rounded); show USDs from the estimate; do not fetch swap on keystrokes.
- Flip: swap tokens/amounts and set quoteSide to EXACT_IN so outAmount recomputes from a swap route.

Math / formatting
- EXACT_IN: outWei = swap.routeSummary.amountOut; USDs from routeSummary.amountInUsd/amountOutUsd.
- EXACT_OUT: inWei = estimatedAmountIn; USDs from estimator (amountInUsd/amountOutUsd).
- We continue to format with formatUnits + formatAmount + localizeAmount and persist params.inAmount in wei for downstream steps.

Freshness and caching
- Keep staleTime at 10 seconds. Since queries are amount‑bound, successive keystrokes will naturally re‑issue queries.
- Optional: coalesce rapid keystrokes with 300ms debouncing in the form to limit request volume.

Flip UX (paired with the minimal change already documented)
- On flip, swap tokens and amounts as documented (state follows the token).
- Since base rates for both directions are cached, recomputations after flip are instantaneous—no visible stale value or spinners required.


Server endpoints
- File: packages/api/src/routers/swap/router.ts
- Procedures:
  - fetchSwapRoute({ tokenIn, tokenOut, amountIn }) → { routerAddress, routeSummary }
  - estimateAmountInFromAmountOut({ tokenIn, tokenOut, amountOut }) → { estimatedAmountIn, amountInUsd, amountOutUsd }
- Types: packages/api/src/routers/swap/types.ts
  - Zod schemas for both requests and responses as above.

Frontend integration
- Per‑keystroke:
  - EXACT_IN: api.swap.fetchSwapRoute.useQuery({ tokenIn, tokenOut, amountIn }); use routeSummary to set outAmount and USDs.
  - EXACT_OUT: api.swap.estimateAmountInFromAmountOut.useQuery({ tokenIn, tokenOut, amountOut }); set inAmount from estimatedAmountIn; USDs from estimator; do not fetch swap here.
  - Flip: swap tokens/amounts and set quoteSide to EXACT_IN.
- Debounce and gating:
  - Debounce input changes (300ms).
  - Gate swap route query to quoteSide === 'EXACT_IN'.
  - Write URL params (inAmount) from a single source in EXACT_OUT (debounced estimate writer) to avoid duplicate fetches.
- Submit-time swap fetch:
- On submit, always refetch the swap route with the current inAmount, set SWAP_ROUTE_SUMMARY_QUERY_KEY, then navigate to the summary page. This guarantees freshness even if a cached route exists from prior EXACT_IN edits.


UI logic around inputs
- inAmount (EXACT_IN): derive outAmount using outPerOneInWei; do not call the route API while typing.
- outAmount (EXACT_OUT): derive inAmount using inPerOneOutWei; do not call the route API while typing.
- On Review (summary): encode the route for the actual amount (existing flow) and show the true routeSummary.
- Error states (rates): if base rates are not yet available, show loading/disabled states for the Review button and avoid showing stale values.

Pros/Cons
- Pros:
  - Consistent UX with instant computations during typing and flipping.
  - Stable calls (two small calls per pair) decoupled from the user’s typed amounts.
  - Eliminates API thrash and update loops.
- Cons:
  - Uses small-amount quotes; for very large trades, price impact may differ. We mitigate by re-quoting at summary.

Testing plan
- Unit:
  - Rate math functions using BigInt for various decimals.
  - Conversions for EXACT_IN and EXACT_OUT with edge values.
- Integration (Playwright):
  - Load trade page → ensure two base rate queries fire and resolve.
  - Type in inAmount → outAmount updates instantly without extra calls.
  - Type in outAmount → inAmount updates instantly without extra calls.
  - Flip → tokens and amounts swap; no stale values; Review disabled until base rates loaded if needed.
  - After 10s stale threshold, rates refetch automatically or on focus.

Migration
- Replace previous exact-out approximation logic in the form with base-rate math.
- Keep existing summary flow: at confirmation time, encode and send the true route for exact amounts (includes slippage handling).

Assumption
- Kyber routes endpoint does not accept amountOut (exact-out) as an input. We will not change the API; we’ll approximate exact-out on the client by making one or two exact-in quotes and scaling the guess.

Implementation notes
- Inputs: inAmount and outAmount fields with localize/sanitize; maintain quoteSide ('EXACT_IN' | 'EXACT_OUT').
- EXACT_IN:
  - Call api.swap.fetchSwapRoute({ tokenIn, tokenOut, amountIn }) when inAmount is present.
  - Derive outAmount and USDs from routeSummary; gate the query to quoteSide === 'EXACT_IN'.
- EXACT_OUT:
  - Call api.swap.estimateAmountInFromAmountOut({ tokenIn, tokenOut, amountOut }).
  - Set inAmount from estimatedAmountIn; show USDs from estimator; do not fetch swap while typing.
- Debounce:
  - Debounce input changes by ~300ms to avoid excessive requests.
  - In EXACT_OUT, write URL params (inAmount) only from the debounced estimator to avoid duplicate swap queries.
- Flip:
  - Swap tokens/amounts and set quoteSide to EXACT_IN to recompute outAmount from a swap route.


C) Debounce and cancellation
- Debounce outAmount changes (300ms) using the same pattern as SendAmountForm (onFormChange + useDebounce) to avoid spamming quotes.
- If the user types again, newer debounced cycles supersede older ones; rely on react-query to drop stale responses.

D) Slippage and estimation
- The estimator does not re‑quote; it computes a linear estimate from a single probe. Slippage tolerance continues to apply at encode/submit time via Kyber’s encoding path.

E) Submission invariants
- Continue to gate canSubmit by swapParams.inAmount and balance checks.
- Ensure routeSummary is cached under SWAP_ROUTE_SUMMARY_QUERY_KEY before navigating (fetch swap route once if needed).
- Navigate to /trade/summary with { inToken, outToken, inAmount, slippage } only.

F) Edge cases and UX
- Clearing the active field clears the derived opposite field.
- Flip tokens: reset quoteSide to 'EXACT_IN' (and clear the opposite field) to avoid stale values.
- USD displays: prefer routeSummary.amountOutUsd/amountInUsd when available; while estimating, we can show placeholders/spinner.
- Rate limiting: by debouncing and limiting to one re-quote per change, we keep calls bounded.

UX and edge cases
- Clearing the active field clears the derived opposite field.
- Flip tokens: reset quoteSide to 'EXACT_IN' to prevent stale derived values.
- USD displays: keep using routeSummary.amountInUsd / amountOutUsd depending on which side is displayed.
- Keep refetchInterval to refresh quotes while the field is filled; pause implicitly if the active field is empty.

Risks and unknowns
- Kyber’s routes endpoint amountOut support: not present in the repo code. We must verify in dev.
  - If unsupported, exact-out will show a clear error in the form and keep submit disabled.
  - We avoid brittle client-side “reverse quoting” approximations.

Test plan
- Unit (API):
  - Validate estimator returns estimatedAmountIn, amountInUsd, amountOutUsd given a probe Kyber quote.
  - Validate swap route parsing remains correct.
- E2E (Playwright):
  - Exact-in: existing tests pass.
  - Exact-out: fill outAmount, wait for estimate, verify inAmount and USDs update; click review; swap route is fetched at submit (if needed) and summary renders using SWAP_ROUTE_SUMMARY_QUERY_KEY.

Rollout plan
- Sequence: API change → FE dual-input change → tests.
- No change to summary screen or useSwap hook interfaces.

Appendix: files referenced
- API
  - packages/api/src/routers/swap/types.ts
  - packages/api/src/routers/swap/router.ts
- App
  - packages/app/features/swap/form/screen.tsx
  - packages/app/features/swap/summary/screen.tsx
  - packages/app/features/swap/constants.ts
  - packages/app/features/send/SendAmountForm.tsx (debounce/sanitize/params pattern)
  - packages/app/utils/zod/activity/{TemporalTransfersEventSchema.ts,index.ts} (zod union patterns)


Minimal initial change: Flip semantics in the Swap form

Context
- Current handleFlipTokens in packages/app/features/swap/form/screen.tsx only swaps inToken and outToken.
- This loses the user’s entered amounts when switching sides and doesn’t preserve state per token.

Desired behavior
- Swap both tokens and their amounts so that state follows the token:
  - Before: inToken = A, inAmount = a, outToken = B, outAmount = b
  - After:  inToken = B, inAmount = b, outToken = A, outAmount = a
- In other words: Put the outToken and the outAmount into the inToken and inAmount. Then put the inToken into the outToken (and the inAmount into outAmount).

Implementation notes (no API changes)
- Read current form values (inToken, outToken, inAmount, outAmount).
- Set:
  - form.setValue('inToken', outToken)
  - form.setValue('inAmount', outAmount) // localize/sanitize for display if needed
  - form.setValue('outToken', inToken)
  - form.setValue('outAmount', inAmount)
- Update URL params via existing debounced onFormChange so swapParams.inAmount reflects the new inAmount (the previous outAmount) in wei.
- Do not trigger additional quoting logic in this step; keep the UI stable, relying on the next user action to request a route if desired.

Rationale
- Simple, predictable behavior that preserves user intent: amounts remain associated with their tokens.
- Avoids extra API calls or slippage complexities at this step.
- Lays groundwork for later enhancements to exact-out quoting without breaking basic UX.

---

Refactor (Sept 2025): exact-out estimator and submit-time swap fetch

Overview
- We simplified the dual-input flow by removing the prior "bidirectional" aggregator endpoint and replacing it with:
  - Exact-in: api.swap.fetchSwapRoute({ tokenIn, tokenOut, amountIn })
  - Exact-out: api.swap.estimateAmountInFromAmountOut({ tokenIn, tokenOut, amountOut }) → { estimatedAmountIn, amountInUsd, amountOutUsd }
- For submit, we guarantee SWAP_ROUTE_SUMMARY_QUERY_KEY is populated. If the swap route was not fetched during EXACT_IN editing, we fetch it once on submit and set it in the cache before navigating.

API details
- estimateAmountInFromAmountOut
  - Request: { tokenIn, tokenOut, amountOut }
  - Response: { estimatedAmountIn, amountInUsd, amountOutUsd }
  - Implementation notes:
    - Probe swap with probeIn = 10^decimals(tokenIn) and read outProbe from Kyber.
    - estimatedAmountIn = amountOut × (probeIn / outProbe) (rounded to wei, min 1).
    - USD values are scaled linearly from the probe quote.
    - Decimals come from app/data/coins.ts (no on-chain reads).

Form behavior
- EXACT_IN (user edits inAmount):
  - Calls fetchSwapRoute and uses routeSummary to set outAmount and USDs.
  - The swap query is enabled only when quoteSide === 'EXACT_IN'.
- EXACT_OUT (user edits outAmount):
  - Calls estimateAmountInFromAmountOut; sets inAmount from estimatedAmountIn.
  - USD displays use amountInUsd/amountOutUsd from the estimate.
  - The swap route is not fetched while typing.
  - URL writes for inAmount are driven by the debounced estimate writer to avoid duplicate swap fetches.
- Flip: Swap tokens/amounts and reset quoteSide to EXACT_IN so outAmount recomputes from a swap route.

Validation
- EXACT_IN: disable submit and highlight the input card when params.inAmount exceeds the inCoin balance.
- EXACT_OUT: disable submit and highlight the output card when estimatedAmountIn (from the estimator) exceeds the inCoin balance.
- Show a clear error message beneath the form in both cases.

Submit-time swap fetch (required by summary)
- Summary screen reads SWAP_ROUTE_SUMMARY_QUERY_KEY via React Query.
- On submit, always refetch the swap route using the current inAmount and set it into SWAP_ROUTE_SUMMARY_QUERY_KEY, then navigate.

Call count expectations
- EXACT_IN typing: swap route fetches with debounce; estimator not used.
- EXACT_OUT typing: exactly one estimator call per debounced change; zero swap calls while editing.
- Submit: at most one swap fetch if the cache isn’t already populated (EXACT_OUT path).
