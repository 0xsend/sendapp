# ADR: Real-time DB-driven distribution_shares (active distribution only)

Status: Proposed
Date: 2025-10-06

Context
- We now track state we need in the DB in real time: token_balances (Temporal), distribution_verifications (triggers), send_scores (views + MV), referrals, and verified_at/is_verified.
- DistributorV2 currently recalculates hourly and uses RPC and on-the-fly math; it also updates referral verifications as a side effect.
- Goal: compute distribution_shares in real time in the DB for the active distribution only, using fixed-point arithmetic (18 decimals) and the existing weighting formulae, including the exact ease-in-out hodler curve.

Prior art in this repo (why this correlates)
- Heavy real-time SQL with windowing/aggregates: supabase/schemas/views/send_scores.sql and supabase/schemas/send_scores.sql
- Per-event verification triggers and idempotent upserts: supabase/schemas/distribution_verifications.sql (insert_verification_sends, insert_send_streak_verification, insert_verification_send_ceiling)
- Persistence contract: apps/distributor/src/supabase.ts uses update_distribution_shares and update_referral_verifications to snapshot results
- Weighting logic and exact curve spec: apps/distributor/src/weights.ts and apps/distributor/src/distributorv2.ts

Decision
- Add a SQL function that computes live shares for the active distribution only, with parameters to pick the weighting mode (linear | logarithmic | square_root | exponential | ease_in_out). Default ease_in_out, and the curve must exactly match apps/distributor/src/weights.ts (cubic Bezier with control points 0.10 and 0.90).
- Include send slash via send_scores (score, send_ceiling) and send_slash (minimum_sends, scaling_divisor), mapping slashPercentage = LEAST(1, score / (send_ceiling * minimum_sends)).
- Compute fixed amounts from distribution_verification_values + distribution_verifications, plus referral fixed-values gated by verified_at (only count referred users that are verified). Multipliers (e.g., send_streak, total_tag_referrals) are applied per the same min/max/step rule; the product of multipliers is applied to the fixed base.
- Cap fixed by hodler cap = initial_hodler_share(time-adjusted via full dist amount) + score.
- Remaining hodler pool = total amount - fixed_allocated; apply time adjustment against the remaining pool and distribute by selected weighting mode (default ease_in_out).
- Bonus pool is 0 in V2.
- Expose convenience views for the active distribution and the current user.
- Keep distributorv2 to persist from the DB function and to generate merkle roots. No deletion of working code.

Out of scope
- Historical distributions in real time (too expensive). Only active distribution is supported for live compute.

Rollout
- Use the new live values in the UI and downstream. Keep legacy shares as a backup only.
- Place all schema changes in supabase/schemas and generate migrations with `yarn supabase migration:diff <name>`. Check for schema drift. Rebuild DB types. Run `yarn lint` and fix any issues.

Consequences
- Removes RPC math from the hot path. The UI can show rewards and referral impacts immediately.
- The DB function/view must be carefully indexed (existing indexes on transfers, scores, token_balances are reused). Only per-user reads should be hot; admin scans are occasional.

---

Specification: compute_active_distribution_shares(mode)

Purpose
- Compute live distribution shares for the active distribution only, using fixed-point arithmetic (18 decimals), with exact ease-in-out hodler curve and selectable modes.

Signature
- Function: public.compute_active_distribution_shares(mode text DEFAULT 'ease_in_out')
- Returns table: (distribution_id int, user_id uuid, address citext, hodler_pool_amount numeric, fixed_pool_amount numeric, bonus_pool_amount numeric, amount numeric)
- Convenience views:
  - public.active_distribution_shares = compute_active_distribution_shares('ease_in_out')
  - public.user_active_distribution_share = compute_active_distribution_shares('ease_in_out') filtered by auth.uid()

Inputs and sources
- Hodler set: distribution_hodler_addresses(distribution_id)
- Balances: public.token_balances (Temporal-driven)
- Earn gating: public.send_earn_balances_timeline when earn_min > 0
- Send slash & ceiling: public.send_scores (score, send_ceiling) and public.send_slash (minimum_sends, scaling_divisor)
- Verifications and values: public.distribution_verifications and public.distribution_verification_values
- Verified referrals: public.referrals joined with public.verified_at(p) is not null

Rules
- Active only: distribution_id = active_distribution_id() (qual_start <= now < qual_end)
- Eligibility: balance >= hodler_min AND (earn_min == 0 OR earn assets >= earn_min at/before now)
- Slash ratio: ratio = min(1, score / (send_ceiling * minimum_sends))
- Slashed balances: balance * ratio (skip 0)
- Weighting mode: one of linear, logarithmic, square_root, exponential, ease_in_out
  - ease_in_out: exact cubic Bezier multiplier rank-based per apps/distributor/src/weights.ts (P1=0.10, P2=0.90)
- Time-adjusted proportion: current month progress (capped at qualification_end)
- Fixed rewards:
  - Base from fixed_value verifications (e.g., tag_registration, create_passkey, send_ten, send_one_hundred)
  - tag_referral counts only for verified referred users (verified_at not null)
  - Multipliers by type using min/max/step, combine as product
  - Apply slash ratio to fixed; Cap fixed by (init_hodler_share from FULL dist amount time-adjusted) + score
- Hodler pool: (dist_amt - fixed_allocated) time-adjusted and distributed by weights
- Bonus pool: 0

Determinism and rounding
- Use numeric with scale 18, avoid division by zero (NULLIF guards)
- Deterministic ordering by (amount desc, address asc)

References (in-repo examples)
- send_scores views: supabase/schemas/views/send_scores.sql (complex windowing, ceilings, earn gating)
- verification triggers: supabase/schemas/distribution_verifications.sql (send_ten, send_one_hundred, streak, send_ceiling)
- distributor persistence RPCs: apps/distributor/src/supabase.ts (update_distribution_shares, update_referral_verifications)
- exact curve implementation: apps/distributor/src/weights.ts

---

Appendix A — Inventory: current system and RPC call sites (informational)
- Distributor worker
  - apps/distributor/src/distributorv2.ts
    - On-chain RPCs (to be removed from hot-path compute):
      - fetchAllBalances → apps/distributor/src/wagmi.ts → baseMainnetClient.multicall balanceOf (ERC20)
      - isMerkleDropActive → wagmi readContract trancheActive (guard for persistence)
    - DB reads already in place:
      - fetchAllVerifications (distribution_verifications)
      - fetchAllHodlers via RPC function distribution_hodler_addresses
      - fetchAllEarnBalancesTimeline (send_earn_balances_timeline)
      - fetchSendScores (send_scores view)
      - fetchSendSlash (send_slash table)
    - DB writes (persistence side effects):
      - createDistributionShares → RPC update_distribution_shares
      - updateReferralVerifications → RPC update_referral_verifications
- UI
  - packages/app/utils/distributions.ts
    - useDistributions → distributions + distribution_shares
    - useDistributionVerifications → distribution_verification_values + nested distribution_verifications aggregations
  - packages/app/features/rewards/activity/screen.tsx
    - Displays verifications/multipliers today
    - Will additionally read user_active_distribution_share for immediate pending rewards

Appendix B — Performance and indexing envelope (proposal)
- Hot-path tables/views used by compute_active_distribution_shares:
  - token_balances: ensure composite indexes exist and used
    - UNIQUE (user_id, token_key) [exists]
    - (address, chain_id) [exists]
  - distribution_verifications:
    - (distribution_id, user_id, type) [exists composite]
  - distribution_verification_values:
    - PK (type, distribution_id) [exists]
  - referrals:
    - UNIQUE (referred_id) [exists]
    - Add/confirm indexes: (referrer_id), (created_at)
  - send_scores (views/MV chain): relies on send_token_transfers and materialized history — already heavily indexed
  - distributions:
    - (qualification_start, qualification_end) index [exists]
    - PK (id)
  - send_slash: (distribution_id) index
  - send_earn_balances_timeline: confirm (owner, block_time) and filters on assets — present in existing migrations
- Verified gating cost (verified_at):
  - verified_at(p) is STABLE and queries DV/EBT; in practice we join verified referrals only for users present in holder set; cardinality is limited.
  - If needed, consider caching verified_at results into a lightweight cache table updated by triggers (future optimization; out of scope now).
- Expected envelope:
  - Per-user reads: p50 < 150ms, p95 < 400ms under normal load
  - Active distribution scan for admin: batched/paginated; use simple ORDER BY amount DESC

Appendix C — Temporal sequencing plan (persistence/backfill)
- Real-time stays DB-first (no Temporal involvement)
- At cut-off or on-demand snapshot:
  1) Temporal workflow reads rows from compute_active_distribution_shares('ease_in_out')
  2) Persist snapshot via update_distribution_shares RPC (single call)
  3) Run update_referral_verifications to reconcile verification weights dependent on shares
  4) Trigger merkle generation route (existing distributor endpoint) to produce proofs/root
- Backfill:
  - Iterate distributions where claim period not started/ended (policy-driven), persist from the same function to ensure parity

Appendix D — API and UI consumer outlines
- API (if applicable to your server endpoints):
  - GET /distributions/active/share (auth required) → SELECT * FROM public.user_active_distribution_share
  - Admin listing (if needed): SELECT * FROM public.active_distribution_shares LIMIT/OFFSET with sane caps
- UI (ActivityRewardsScreen):
  - Add a hook/useQuery for user_active_distribution_share alongside useDistributionVerifications
  - Display immediate pending reward amount and continue to show verification tasks and multiplier cards
  - Progress card logic can incorporate send_scores-based progress as it does today

Appendix E — Data correctness checks and SLO/observability
- Correctness
  - Shadow compare at cut-off: compute_active_distribution_shares vs freshly persisted distribution_shares by (user_id,address)
  - Tolerance: exact match on numeric with canonical cast (no rounding loss expected if NUMERIC is used end-to-end)
  - Ensure total sum of amount ≤ distribution.amount before persistence
- Observability/SLOs
  - Metrics: function execution time (SQL), rows scanned/returned, slow query logs, RPC success/error counts
  - Alerts: sustained p95 > 600ms on user_active_distribution_share, or repeated snapshot mismatches
  - Dashboards: time from inbound event → verifications updated → share visible in UI (proxy via timestamps)  
