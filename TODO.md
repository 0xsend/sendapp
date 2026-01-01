# TODO - PostHog Missing Events Implementation

## Completed (All Verified)

### Phase 1 - Core Auth & System Events
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
- [x] $screen (native) (StackNavigator.tsx:19)

### Phase 2 - Sendpot
- [x] sendpot_buy_tickets_started (BuyTicketsScreen.tsx:35) - with ticket_count property

### Previously Completed
- [x] Types defined for all events in analytics/types.ts
- [x] activity_feed_viewed (activity/screen.tsx:19)
- [x] leaderboard_viewed (leaderboard/screen.tsx:17)
- [x] invest_viewed (invest/screen.tsx:14)
- [x] explore_viewed (explore/screen.tsx:14)
- [x] sendpot_ticket_purchase_submitted, completed, failed (ConfirmBuyTicketsScreen.tsx)
- [x] onboarding_started, onboarding_completed (onboarding/screen.tsx)
- [x] user_signed_up (sign-up/screen.tsx:315)
- [x] earn_deposit_initiated, earn_deposit_submitted (earn/deposit/screen.tsx)

## Not Applicable (UI/Backend Not Available)

These events are defined in types but cannot be implemented client-side because the required UI or backend integration does not exist:

### Phase 1 - Requires Backend Integration
- [ ] onboarding_step_completed - Current onboarding is single-step (create sendtag + passkey). No multi-step wizard exists.
- [ ] earn_deposit_completed - Requires on-chain transaction confirmation tracking, which happens in the backend Temporal workflow.

### Phase 2 - Requires UI Changes or Backend
- [ ] referral_invite_accepted - Backend event: triggered when someone uses a referral code (happens in onboarding)
- [ ] referral_reward_earned - Backend event: triggered when referral rewards are distributed
- [ ] activity_filter_applied - No user-controlled filter UI exists on the activity screen (filtering is automatic/internal)
- [ ] invest_banner_clicked - LinkBanner component doesn't support onPress callback; would require UI component modification
- [ ] explore_banner_clicked - Same as invest_banner_clicked
- [ ] promo_card_clicked - No promo cards found in the codebase
- [ ] leaderboard_filter_changed - No filter UI exists on the leaderboard screen

## Verification

All checks pass:
- [x] TypeScript: `yarn tsc --noEmit` passes
- [x] Biome: `npx @biomejs/biome check packages/app` passes
- [x] All implemented events verified via grep
