# Send profile verifications

Source of truth is the Supabase schema; there is no app-side write to this field.

## Field
- Column: `profiles.verified_at` (timestamptz, nullable, indexed where non-null).
- Badge/flags are derived as `verified_at IS NOT NULL` (e.g., `is_verified` in SQL views and UI components).

## How it gets set
- On insert to `distribution_shares` for the **current active distribution** (now between `qualification_start` and `qualification_end`), trigger `update_profile_verified_at_on_insert` calls `update_profile_verified_at_on_share_insert` to `SET verified_at = NOW()` for that user if it was null.

## How it gets cleared
- **It doesn't.** Once a user is verified, they stay verified permanently.
- The `update_profile_verified_at_on_share_delete` trigger is a no-op.
- This design ensures users don't lose their verification badge if their distribution shares drop to zero.

## Bulk refresh / batch writes
- Service-role function `update_distribution_shares` (used to replace a distribution's share set) calls `refresh_profile_verification_status` after writing the new shares.
- `refresh_profile_verification_status` logic:
  - Only sets `verified_at = NOW()` for users appearing in the current distribution's `distribution_shares` who are not already verified.
  - Never clears `verified_at` - once verified, always verified.
- `refresh_profile_verification_status` is granted only to `service_role`; the insert/delete triggers are granted to anon/authenticated/service_role.

## Where it is used
- SQL views and queries compute `is_verified` as `verified_at IS NOT NULL` (e.g., `top_senders`, referrals, activity feed).
- App components gate badges/UI via `profile?.verified_at !== null` (see `packages/app/components/layout/MainLayout.tsx`, `packages/app/components/sidebar/HomeSideBar.tsx`, `packages/app/features/account/components/AccountHeader.tsx`).

## Operational notes
- To verify new users in bulk, call `refresh_profile_verification_status` with the service role or re-run `update_distribution_shares` for the active distribution.
- To manually clear a user's verification (if ever needed), directly update `profiles.verified_at = NULL` with service role.
