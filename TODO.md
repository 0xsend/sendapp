# TODO - PostHog Missing Events Implementation

## Completed (All Verified)

### Phase 1 - Core Auth & System Events
- [x] user_signup_started (sign-up/screen.tsx:237)
- [x] user_login_succeeded (loginWithPhone/screen.tsx:60, sign-up/screen.tsx:468)
- [x] user_logged_out (AccountLinks.tsx:57)
- [x] phone_otp_sent (useAuthUserMutation.ts:37) - country_code now optional
- [x] phone_otp_verified (VerifyCode.tsx:45) - country_code now optional
- [x] token_upgrade_started (send-token-upgrade/screen.tsx:210)
- [x] token_upgrade_completed (send-token-upgrade/screen.tsx:256)
- [x] token_upgrade_failed (send-token-upgrade/screen.tsx:277)
- [x] ota_update_available (useExpoUpdates.ts:54)
- [x] ota_update_download_started (useExpoUpdates.ts:77)
- [x] ota_update_download_completed (useExpoUpdates.ts:88)
- [x] ota_update_download_failed (useExpoUpdates.ts:99)
- [x] $screen (native) (StackNavigator.tsx:19)
- [x] onboarding_started (onboarding/screen.tsx)
- [x] onboarding_completed (onboarding/screen.tsx)

### Phase 2 - Sendpot
- [x] sendpot_buy_tickets_started (BuyTicketsScreen.tsx:35) - with ticket_count property

### Previously Completed
- [x] activity_feed_viewed (activity/screen.tsx:19)
- [x] leaderboard_viewed (leaderboard/screen.tsx:17)
- [x] invest_viewed (invest/screen.tsx:14)
- [x] explore_viewed (explore/screen.tsx:14)
- [x] sendpot_ticket_purchase_submitted, completed, failed (ConfirmBuyTicketsScreen.tsx)
- [x] user_signed_up (sign-up/screen.tsx:315)
- [x] earn_deposit_initiated, earn_deposit_submitted (earn/deposit/screen.tsx)

## Removed from Types (Not Implementable Client-Side)

The following events were removed from analytics/types.ts because they require backend integration or non-existent UI:

### Phase 1 - Backend Required
- onboarding_step_completed - Current onboarding is single-step
- earn_deposit_completed - Requires on-chain confirmation tracking (backend)
- earn_withdraw_completed - Requires on-chain confirmation tracking (backend)

### Phase 2 - UI/Backend Not Available
- referral_invite_accepted - Backend event when referral code is used
- referral_reward_earned - Backend event when rewards distributed
- activity_filter_applied - No filter UI exists
- invest_banner_clicked - LinkBanner doesn't support onPress
- explore_banner_clicked - LinkBanner doesn't support onPress
- promo_card_clicked - No promo cards in codebase
- leaderboard_filter_changed - No filter UI exists

## Verification

All checks pass:
- [x] TypeScript: `yarn tsc --noEmit` passes
- [x] Biome: `npx @biomejs/biome check packages/app` passes
