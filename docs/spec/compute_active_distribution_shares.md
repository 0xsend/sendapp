
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