# TODO - PostHog Analytics Implementation

## Exception Handling Implementation

### Completed (Iteration 1)

#### Phase 1: Web Autocapture
- [x] Added `capture_exceptions` config with granular options to analytics.web.ts
- [x] Configured rate limiter (refillRate: 5, bucketSize: 20)
- [x] Added `before_send` filter for IGNORED_ERRORS array

#### Phase 2: RN JS Autocapture
- [x] Upgraded posthog-react-native to ^4.14.0 in apps/expo/package.json
- [x] Upgraded posthog-react-native to ^4.14.0 in packages/app/package.json (iteration 2)
- [x] Ran yarn install to update lockfile to 4.17.2 (iteration 2)
- [x] Added `errorTracking.autocapture` config to analytics.native.ts
- [x] Fixed PostHogEventProperties import to use @posthog/core (iteration 3)
- [x] Updated docs/posthog-exception-handling.md to reflect SDK reality (iteration 4)

**SDK Clarification**: The posthog-react-native v4.x `ErrorTrackingOptions` interface only supports `autocapture`. There is no `rateLimiter` option exposed in the public API. The original implementation plan was based on early documentation that didn't match the released SDK types. Rate limiting for RN error tracking is handled internally by the SDK.

#### Phase 3: Manual Capture API
- [x] Added ExceptionProperties interface to types.ts
- [x] Added captureException to AnalyticsService interface
- [x] Implemented captureException in analytics.web.ts with initialized check
- [x] Implemented captureException in analytics.native.ts with IGNORED_ERRORS filter
- [x] Exported ExceptionProperties from index.ts and index.native.ts

#### Phase 4: Error Boundaries
- [x] Created AnalyticsErrorBoundary component
- [x] Created ErrorFallback.tsx with @my/ui components (iteration 2)
- [x] Created ErrorFallback.native.tsx with React Native components (iteration 2)
- [x] Updated AnalyticsErrorBoundary with resetError and render prop support (iteration 2)
- [x] Integrated AnalyticsErrorBoundary in apps/next/pages/_app.tsx (iteration 2)
- [x] Integrated AnalyticsErrorBoundary in apps/expo/app/_layout.tsx (iteration 2)

### Skipped (Manual PostHog UI Tasks)
- Phase 5: Error Filtering and Grouping (dashboard configuration)
- Phase 6: Alerting and Monitoring (PostHog UI setup)

### Verification
- [x] TypeScript compiles without errors (iteration 2 - fixed undefined in captureException)
- [x] Biome linting passes

---

## Explicit Screen/Page Tracking

Screen and page views are tracked automatically:
- **Web**: PostHog's `capture_pageview: true` option handles `$pageview` events automatically
- **Native**: `analytics.screen()` in `apps/expo/components/layout/StackNavigator.tsx` using PostHog's dedicated `screen()` method (required for React Navigation v7+)

## Completed Events

### Core Auth & System Events
- [x] user_signed_up (sign-up/screen.tsx:316)
- [x] user_login_with_phone (loginWithPhone/screen.tsx:52)
- [x] user_login_succeeded (loginWithPhone/screen.tsx:60, sign-up/screen.tsx:456)
- [x] user_logged_out (AccountLinks.tsx:57)
- [x] phone_otp_sent (useAuthUserMutation.ts:37)
- [x] phone_otp_verified (VerifyCode.tsx:45)
- [x] onboarding_started (onboarding/screen.tsx:77)
- [x] onboarding_completed (onboarding/screen.tsx:343)
- [x] auth_error_occurred (sign-up/screen.tsx:375, loginWithPhone/screen.tsx:74)
- [x] passkey_integrity_failed (sign-up/screen.tsx:354)

### Send Transfers
- [x] send_transfer_initiated (send/confirm/screen.tsx:237)
- [x] send_transfer_submitted (send/confirm/screen.tsx:258)
- [x] send_transfer_failed (send/confirm/screen.tsx:294)

### Send Checks
- [x] send_check_created (SendCheckChat/index.tsx:429)
- [x] send_check_shared (SendCheckChat/index.tsx:502)
- [x] send_check_claim_started (check/claim/preview.tsx:81)
- [x] send_check_claimed (check/claim/preview.tsx:90)
- [x] send_check_revoked (check/screen.tsx:402)
- [x] send_check_failed (check/screen.tsx:412, check/claim/preview.tsx:101, SendCheckChat/index.tsx)

### Earn
- [x] earn_deposit_initiated (earn/deposit/screen.tsx:223)
- [x] earn_deposit_submitted (earn/deposit/screen.tsx:270)
- [x] earn_withdraw_initiated (earn/withdraw/screen.tsx:188)
- [x] earn_withdraw_submitted (earn/withdraw/screen.tsx:210)
- [x] earn_withdraw_completed (earn/withdraw/screen.tsx:258)

### Sendpot
- [x] sendpot_disclaimer_viewed (SendpotRiskDialog.tsx:42)
- [x] sendpot_disclaimer_accepted (SendpotRiskDialog.tsx:60)
- [x] sendpot_buy_tickets_started (BuyTicketsScreen.tsx:35)
- [x] sendpot_ticket_purchase_submitted (ConfirmBuyTicketsScreen.tsx:88)
- [x] sendpot_ticket_purchase_completed (ConfirmBuyTicketsScreen.tsx:101)
- [x] sendpot_ticket_purchase_failed (ConfirmBuyTicketsScreen.tsx:120)
- [x] sendpot_winnings_claimed (ClaimWinnings.tsx:51)
- [x] sendpot_winnings_claim_failed (ClaimWinnings.tsx:64)

### Rewards
- [x] rewards_claim_started (DistributionClaimButton.tsx:173)
- [x] rewards_claim_completed (DistributionClaimButton.tsx:200)
- [x] rewards_claim_failed (DistributionClaimButton.tsx:212)

### Sendtag
- [x] sendtag_added (AddSendtagsForm.tsx:72)
- [x] sendtag_checkout_started (checkout-confirm-button.tsx:175)
- [x] sendtag_checkout_completed (checkout-confirm-button.tsx:193)
- [x] sendtag_checkout_failed (checkout-confirm-button.tsx:219)

### Account Management
- [x] backup_passkey_created (backup/confirm.tsx:234)
- [x] account_deletion_started (AccountDeletionFlow.tsx:88)
- [x] account_deletion_completed (AccountDeletionFlow.tsx:143)
- [x] profile_updated (UploadProfileBanner.tsx:102, uploadProfileImage/screen.tsx:101)

### Activity & Sharing
- [x] activity_item_opened (ActivityDetailsProvider.tsx:22)
- [x] referral_link_shared (ReferralLink.tsx:57)

### Contacts
- [x] contact_added (useContactMutation.ts:80, with contact_type: 'sendtag' | 'address')
- [x] contact_favorited (useContactMutation.ts:178, with is_favorited boolean)
- [x] contact_archived (useContactMutation.ts:274, with contact_type)
- [x] contact_unarchived (useContactMutation.ts:322, with contact_type)

### Canton Verification
- [x] canton_verification_completed (CantonWalletVerification.tsx:716)
- [x] canton_verification_failed (CantonWalletVerification.tsx:728)

### Deposit
- [x] deposit_started (DepositCoinbase/screen.tsx:58)
- [x] deposit_completed (DepositCoinbase/screen.tsx:80)
- [x] deposit_failed (DepositCoinbase/screen.tsx:96)

### Maintenance & Updates
- [x] maintenance_viewed (maintenance-mode/screen.tsx:21)
- [x] ota_update_available (useExpoUpdates.ts:54)
- [x] ota_update_download_started (useExpoUpdates.ts:77)
- [x] ota_update_download_completed (useExpoUpdates.ts:88)
- [x] ota_update_download_failed (useExpoUpdates.ts:99)
- [x] ota_update_prompt_shown (OTAUpdateSheet.native.tsx:29)
- [x] ota_update_restart_clicked (OTAUpdateSheet.native.tsx:39)

### Token Upgrade
- [x] token_upgrade_started (send-token-upgrade/screen.tsx:210)
- [x] token_upgrade_completed (send-token-upgrade/screen.tsx:256)
- [x] token_upgrade_failed (send-token-upgrade/screen.tsx:277)

### Swap
- [x] swap_disclaimer_viewed (SwapRiskDialog.tsx:35)
- [x] swap_disclaimer_accepted (SwapRiskDialog.tsx:61)
- [x] swap_review_started (swap/summary/screen.tsx:157)
- [x] swap_submitted (swap/summary/screen.tsx:173)
- [x] swap_completed (swap/summary/screen.tsx:196)
- [x] swap_failed (swap/summary/screen.tsx:210)

## Removed from Types (Not Implementable Client-Side)

### No UI/Feature Exists
- force_update_prompted - No force update UI component exists
- paymaster_approval_started/completed/failed - No paymaster approval flow UI
- wrap_started/completed/failed - No wrap feature exists
- unwrap_started/completed/failed - No unwrap feature exists
- profile_verification_started/completed/failed - No profile verification UI
- contacts_sync_started/completed/failed - No contacts sync functionality
- contacts_permission_denied - No contacts permission flow
- sendtag_transferred - No sendtag transfer feature

### Backend Required
- earn_deposit_completed - Requires on-chain confirmation tracking (backend)
- earn_withdraw_completed - Requires on-chain confirmation tracking (backend)

### Removed `*_viewed` Events (Redundant with Automatic Tracking)
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
