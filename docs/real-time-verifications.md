# Real-time verifications

This document explains how Send computes and exposes a profile’s verification state in real time.

## Summary
- Verified status requires all three conditions simultaneously (for the active distribution):
  1) tag_registration verification present with weight > 0
  2) send_token_hodler verification weight >= distributions.hodler_min_balance
  3) Earn balance condition: any address owned by the user has send_earn balance >= distributions.earn_min_balance
- We expose two computed values:
  - verified_at(profiles) -> timestamptz: the timestamp when the user became currently verified. NULL if not verified now.
  - is_verified(profiles) -> boolean: derived as (verified_at IS NOT NULL)

## Active distribution
Both functions first locate the active distribution using the current UTC time:
- qualification_start <= now() <= qualification_end (UTC)
- If multiple windows match, we choose the latest by qualification_start.

## verified_at semantics
- If the user is currently verified, verified_at returns the latest time at which all required conditions were satisfied:
  - tag_at: earliest tag_registration DV for the active distribution
  - hodler_at: earliest send_token_hodler DV meeting the min balance for the active distribution
  - earn_at:
    - If earn_min_balance = 0, no earn requirement is enforced (earn_at = qualification_start of the active distribution)
    - Otherwise, the earliest send_earn_balances_timeline row where assets >= earn_min_balance for any of the user’s addresses
- verified_at = GREATEST(tag_at, hodler_at, earn_at)
- If any required timestamp is NULL, verified_at returns NULL and the user is not currently verified.

## is_verified
is_verified(profiles) simply returns (verified_at(profiles) IS NOT NULL). This avoids duplicated logic and guarantees consistency.

## Query points and usage
- profile_lookup returns is_verified (and verified_at is available separately via public.verified_at(p)).
- UI can:
  - Show a badge when is_verified = true
  - Show the time since verification began using verified_at

## Edge cases
- Missing any one of the conditions -> verified_at = NULL, is_verified = false
- Earn threshold set to 0 -> earn condition is bypassed, so tag + hodler alone determine verification
- When a condition is later lost (e.g., token holdings drop below hodler_min_balance), verified_at returns NULL again, and is_verified becomes false

## Performance notes
- The functions operate within a single SELECT using a single active distribution row and narrowly scoped subqueries.
- The logic avoids repeated full scans by joining against specific user- and distribution-scoped data.

## Testing
- See supabase/tests/verification_status_test.sql for coverage of the happy path and key edge cases (no DVs, single DV, both DVs, and losing a condition).