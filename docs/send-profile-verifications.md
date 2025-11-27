# Send profile verifications

Source of truth is the Supabase schema; there is no app-side write to this field.

## Field
- Column: `profiles.verified_at` (timestamptz, nullable, indexed where non-null).
- Badge/flags are derived as `verified_at IS NOT NULL` (e.g., `is_verified` in SQL views and UI components).

## How it gets set
- On insert to `distribution_shares` for the **current active distribution** (now between `qualification_start` and `qualification_end`), trigger `update_profile_verified_at_on_insert` calls `update_profile_verified_at_on_share_insert` to `SET verified_at = NOW()` for that user if it was null.

## How it gets cleared
- On delete from `distribution_shares` for the current distribution, trigger `update_profile_verified_at_on_delete` calls `update_profile_verified_at_on_share_delete`; if the user has zero remaining shares in that distribution it sets `verified_at = NULL`.

## Bulk refresh / batch writes
- Service-role function `update_distribution_shares` (used to replace a distribution’s share set) calls `refresh_profile_verification_status` after writing the new shares.
- `refresh_profile_verification_status` logic:
  - If there is **no** active distribution: `verified_at` is nulled for all rows.
  - If there **is** an active distribution: sets `verified_at = NOW()` for users appearing in that distribution’s `distribution_shares` (and nulls it for everyone else).
- `refresh_profile_verification_status` is granted only to `service_role`; the insert/delete triggers are granted to anon/authenticated/service_role.

## Where it is used
- SQL views and queries compute `is_verified` as `verified_at IS NOT NULL` (e.g., `top_senders`, referrals, activity feed).
- App components gate badges/UI via `profile?.verified_at !== null` (see `packages/app/components/layout/MainLayout.tsx`, `packages/app/components/sidebar/HomeSideBar.tsx`, `packages/app/features/account/components/AccountHeader.tsx`).

## Operational notes
- To force a resync (e.g., after manual data fixes), call `refresh_profile_verification_status` with the service role or re-run `update_distribution_shares` for the active distribution.
- Verification status only tracks **current** distribution participation; when the qualification window closes and no distribution is active, all profiles revert to unverified.
