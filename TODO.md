# TODO - PostHog Analytics Implementation

## Completed (Phase 1: Infrastructure)
- [x] Create packages/app/analytics/types.ts with all event types
- [x] Create packages/app/analytics/analytics.web.ts
- [x] Create packages/app/analytics/analytics.native.ts
- [x] Create packages/app/analytics/index.ts exports
- [x] Create packages/app/provider/analytics/AnalyticsProvider.tsx
- [x] Add AnalyticsProvider to packages/app/provider/index.tsx compose()
- [x] Add posthog-react-native dependency to apps/expo/package.json
- [x] Migrate sign-up/screen.tsx to useAnalytics()
- [x] Migrate loginWithPhone/screen.tsx to useAnalytics()
- [x] Migrate onboarding/screen.tsx to useAnalytics()
- [x] Migrate send/confirm/screen.tsx to useAnalytics()
- [x] Migrate earn/deposit/screen.tsx to useAnalytics()
- [x] Migrate earn/withdraw/screen.tsx to useAnalytics()
- [x] Migrate checkout-confirm-button.tsx to useAnalytics()
- [x] Remove posthog from secret-shop/screen.tsx
- [x] Delete apps/next/instrumentation-client.ts

## In Progress
- [ ] Implement all events from types.ts across features

## Pending (Phase 2: Event Implementation)

### Auth & Onboarding
- [ ] user_signup_started - sign-up/screen.tsx
- [ ] user_login_succeeded - loginWithPhone/screen.tsx + passkey flow
- [ ] user_logged_out - account logout flow
- [ ] phone_otp_sent - OTP sending logic
- [ ] phone_otp_verified - OTP verification logic
- [ ] onboarding_started - onboarding/screen.tsx
- [ ] onboarding_step_completed - onboarding steps

### Send & Transfers
- [ ] send_transfer_failed - send/confirm/screen.tsx error handling

### Send Checks
- [ ] send_check_created - check creation flow
- [ ] send_check_shared - check sharing
- [ ] send_check_claim_started - claim initiation
- [ ] send_check_claimed - successful claim
- [ ] send_check_revoked - revoke flow
- [ ] send_check_failed - error handling

### Earn
- [ ] earn_deposit_initiated - deposit/screen.tsx
- [ ] earn_deposit_completed - deposit success
- [ ] earn_withdraw_initiated - withdraw/screen.tsx
- [ ] earn_withdraw_completed - withdraw success

### Sendpot
- [ ] sendpot_viewed - sendpot/screen.tsx
- [ ] sendpot_disclaimer_viewed - disclaimer modal
- [ ] sendpot_disclaimer_accepted - disclaimer acceptance
- [ ] sendpot_buy_tickets_started - ticket purchase start
- [ ] sendpot_ticket_purchase_submitted - purchase submitted
- [ ] sendpot_ticket_purchase_completed - purchase success
- [ ] sendpot_ticket_purchase_failed - purchase error
- [ ] sendpot_winnings_claimed - winnings claim success
- [ ] sendpot_winnings_claim_failed - winnings claim error

### Rewards
- [ ] rewards_screen_viewed - rewards/activity/screen.tsx
- [ ] rewards_claim_started - claim initiation
- [ ] rewards_claim_completed - claim success
- [ ] rewards_claim_failed - claim error

### Account & Settings
- [ ] account_settings_viewed - account settings screen
- [ ] sendtag_added - sendtag addition
- [ ] backup_passkey_created - backup passkey flow
- [ ] account_deletion_started - deletion initiation
- [ ] account_deletion_completed - deletion success

### Activity
- [ ] activity_feed_viewed - activity/screen.tsx
- [ ] activity_filter_applied - filter changes
- [ ] activity_item_opened - item tap

### Referrals/Affiliate
- [ ] referral_link_shared - share link
- [ ] referral_invite_accepted - invite acceptance
- [ ] referral_reward_earned - reward earned

### Contacts
- [ ] contacts_sync_started - sync initiation
- [ ] contacts_sync_completed - sync success
- [ ] contacts_sync_failed - sync error
- [ ] contacts_permission_denied - permission denied

### Deposit (Fiat/Crypto)
- [ ] deposit_started - deposit/screen.tsx
- [ ] deposit_completed - deposit success
- [ ] deposit_failed - deposit error

### Screen Views
- [ ] home_viewed - home/screen.tsx
- [ ] explore_viewed - explore/screen.tsx
- [ ] invest_viewed - invest/screen.tsx
- [ ] leaderboard_viewed - leaderboard/screen.tsx
- [ ] splash_viewed - splash/screen.tsx
- [ ] profile_viewed - profile/screen.tsx
- [ ] maintenance_viewed - maintenance-mode/screen.tsx

### UI Interactions
- [ ] invest_banner_clicked - invest screen banner
- [ ] promo_card_clicked - promo cards
- [ ] explore_banner_clicked - explore banners
- [ ] leaderboard_filter_changed - leaderboard filters

### OTA Updates
- [ ] ota_update_available - OTAUpdateSheet detection
- [ ] ota_update_download_started - download start
- [ ] ota_update_download_completed - download complete
- [ ] ota_update_download_failed - download error
- [ ] ota_update_prompt_shown - prompt shown
- [ ] ota_update_restart_clicked - restart tapped

### Paymaster
- [ ] paymaster_approval_started - paymaster-allowance/screen.tsx
- [ ] paymaster_approval_completed - approval success
- [ ] paymaster_approval_failed - approval error

### Profile
- [ ] profile_updated - profile edit
- [ ] profile_verification_started - verification start
- [ ] profile_verification_completed - verification success
- [ ] profile_verification_failed - verification error

### Token Upgrade
- [ ] token_upgrade_started - send-token-upgrade/screen.tsx
- [ ] token_upgrade_completed - upgrade success
- [ ] token_upgrade_failed - upgrade error

### Wrap/Unwrap
- [ ] wrap_started - wrapped/screen.tsx
- [ ] wrap_completed - wrap success
- [ ] wrap_failed - wrap error
- [ ] unwrap_started - unwrap initiation
- [ ] unwrap_completed - unwrap success
- [ ] unwrap_failed - unwrap error

### Sendtag Checkout
- [ ] sendtag_checkout_started - checkout initiation
- [ ] sendtag_checkout_failed - checkout error
- [ ] sendtag_transferred - tag transfer

### Swap
- [ ] swap_disclaimer_viewed - disclaimer modal
- [ ] swap_disclaimer_accepted - disclaimer acceptance
- [ ] swap_review_started - swap/summary/screen.tsx
- [ ] swap_submitted - swap submitted
- [ ] swap_completed - swap success
- [ ] swap_failed - swap error

## Blocked
- [ ] None

## Notes
- Implementation approach: Work through features systematically
- Priority: Start with high-traffic flows (swap, sendpot, screen views)
- Each feature should get useAnalytics() hook and capture appropriate events
