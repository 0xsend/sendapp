# TODO - PostHog Analytics Implementation

## Explicit Screen/Page Tracking

Screen and page views are tracked via `usePageviewTracking()` hook (packages/app/analytics/):
- **Web**: `$pageview` with `$current_url` (usePageviewTracking.ts)
- **Native**: `$screen` with `$screen_name` (usePageviewTracking.native.ts)

Hook is called from:
- Web: `apps/next/pages/_app.tsx`
- Native: `apps/expo/components/layout/StackNavigator.tsx`

## Completed Events

### Core Auth & System Events
- [x] user_signup_started (sign-up/screen.tsx:237)
- [x] user_login_succeeded (loginWithPhone/screen.tsx:60, sign-up/screen.tsx:468)
- [x] user_logged_out (AccountLinks.tsx:57)
- [x] phone_otp_sent (useAuthUserMutation.ts:37)
- [x] phone_otp_verified (VerifyCode.tsx:45)
- [x] token_upgrade_started (send-token-upgrade/screen.tsx:210)
- [x] token_upgrade_completed (send-token-upgrade/screen.tsx:256)
- [x] token_upgrade_failed (send-token-upgrade/screen.tsx:277)
- [x] ota_update_available (useExpoUpdates.ts:54)
- [x] ota_update_download_started (useExpoUpdates.ts:77)
- [x] ota_update_download_completed (useExpoUpdates.ts:88)
- [x] ota_update_download_failed (useExpoUpdates.ts:99)
- [x] onboarding_started (onboarding/screen.tsx)
- [x] onboarding_completed (onboarding/screen.tsx)
- [x] user_signed_up (sign-up/screen.tsx:315)

### Sendpot
- [x] sendpot_buy_tickets_started (BuyTicketsScreen.tsx:35)
- [x] sendpot_ticket_purchase_submitted, completed, failed (ConfirmBuyTicketsScreen.tsx)

### Earn
- [x] earn_deposit_initiated, earn_deposit_submitted (earn/deposit/screen.tsx)

## Removed Events (Redundant with Automatic Tracking)

The following `*_viewed` events were removed because they duplicate automatic screen/page tracking:
- activity_feed_viewed → use `$screen`/`$pageview` with path `/activity`
- leaderboard_viewed → use `$screen`/`$pageview` with path `/leaderboard`
- invest_viewed → use `$screen`/`$pageview` with path `/invest`
- explore_viewed → use `$screen`/`$pageview` with path `/explore`
- home_viewed → use `$screen`/`$pageview` with path `/`
- profile_viewed → use `$screen`/`$pageview` with path `/profile`
- rewards_screen_viewed → use `$screen`/`$pageview` with path `/rewards`
- sendpot_viewed → use `$screen`/`$pageview` with path `/sendpot`
- canton_verification_viewed → use `$screen`/`$pageview` with path `/canton-wallet`
- splash_viewed → use `$screen`/`$pageview` with path `/splash`
- account_settings_viewed → use `$screen`/`$pageview` with path `/account`

## Removed from Types (Not Implementable Client-Side)

### Backend Required
- onboarding_step_completed - Current onboarding is single-step
- earn_deposit_completed - Requires on-chain confirmation tracking (backend)
- earn_withdraw_completed - Requires on-chain confirmation tracking (backend)

### UI/Backend Not Available
- referral_invite_accepted - Backend event when referral code is used
- referral_reward_earned - Backend event when rewards distributed
- activity_filter_applied - No filter UI exists
- invest_banner_clicked - LinkBanner doesn't support onPress
- explore_banner_clicked - LinkBanner doesn't support onPress
- promo_card_clicked - No promo cards in codebase
- leaderboard_filter_changed - No filter UI exists
