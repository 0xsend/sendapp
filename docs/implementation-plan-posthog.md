# PostHog Implementation Plan

## Current State Analysis

### Issues Identified

#### 1. Web-Only Library in Shared Code (Critical)
The current implementation directly imports `posthog-js` in shared `packages/app/features/*` files:

```tsx
// packages/app/features/auth/sign-up/screen.tsx
import posthog from 'posthog-js'
```

`posthog-js` is a **web-only library** that requires browser APIs (`window`, `document`, `localStorage`). This will crash or fail silently on React Native.

**Affected files:**
- `packages/app/features/auth/sign-up/screen.tsx`
- `packages/app/features/auth/loginWithPhone/screen.tsx`
- `packages/app/features/auth/onboarding/screen.tsx`
- `packages/app/features/send/confirm/screen.tsx`
- `packages/app/features/earn/deposit/screen.tsx`
- `packages/app/features/earn/withdraw/screen.tsx`
- `packages/app/features/account/sendtag/checkout/components/checkout-confirm-button.tsx`

#### 2. No React Native Integration
- `posthog-react-native` is not installed in `apps/expo/package.json`
- No PostHog initialization exists for the native app
- Native users are not being tracked at all

#### 3. Scattered Platform Checks
Every file has fragile defensive checks:
```tsx
if (typeof window !== 'undefined') {
  posthog.capture('event_name', {...})
}
```

This is error-prone, verbose, and will silently skip analytics on native.

#### 4. No Abstraction Layer
- PostHog is used directly without a service layer
- No centralized configuration
- No typed event definitions
- No consistent event naming convention

#### 5. Fragmented User Identification
User identification happens in multiple places:
- `sign-up/screen.tsx`: `posthog.identify(createdSendAccount.id, {...})`
- `onboarding/screen.tsx`: `posthog.identify(createdSendAccount.id, {...})`

This creates race conditions and inconsistent user properties.

#### 6. Incomplete Error Tracking
- `captureException` is used but web-only
- Error context is inconsistent across files
- No centralized error boundary integration

---

## Proposed Architecture

### Design Principles
1. **Platform-agnostic interface**: Single analytics API that works across web and native
2. **Type-safe events**: Define event types upfront to prevent typos and ensure consistency
3. **Centralized initialization**: Single source of truth for configuration
4. **Provider pattern**: Integrate with existing provider composition in `packages/app/provider`
5. **Automatic user identification**: Handle identification in one place when auth state changes
6. **Privacy-aware data**: Avoid PII, provide an opt-out path, and sanitize error messages
7. **Consistent context**: Add shared properties (platform, app version, build, environment)

### Directory Structure

```
packages/app/
├── analytics/
│   ├── index.ts                    # Public API exports
│   ├── types.ts                    # Event types and interfaces
│   ├── events.ts                   # Event name constants and validators
│   ├── analytics.ts                # Platform-agnostic analytics service interface
│   ├── analytics.native.ts         # React Native implementation (posthog-react-native)
│   ├── analytics.web.ts            # Web implementation (posthog-js)
│   └── __tests__/
│       └── analytics.test.ts
├── provider/
│   ├── analytics/
│   │   ├── index.ts
│   │   ├── AnalyticsProvider.tsx   # Web provider
│   │   └── AnalyticsProvider.native.tsx  # Native provider
│   └── index.tsx                   # Add AnalyticsProvider to compose()
```

---

## Implementation Steps

### Phase 1: Core Analytics Service

#### Step 1.1: Define Event Types
Create `packages/app/analytics/types.ts`:

```typescript
import type { Address } from 'viem'

// Discriminated union for type-safe events
export type AnalyticsEvent =
  | { name: 'user_signup_started'; properties: UserSignupStartedProps }
  | { name: 'user_signed_up'; properties: UserSignedUpProps }
  | { name: 'user_login_with_phone'; properties: UserLoginWithPhoneProps }
  | { name: 'user_login_succeeded'; properties: UserLoginSucceededProps }
  | { name: 'user_logged_out'; properties: Record<string, never> }
  | { name: 'phone_otp_sent'; properties: PhoneOtpSentProps }
  | { name: 'phone_otp_verified'; properties: PhoneOtpVerifiedProps }
  | { name: 'onboarding_started'; properties: OnboardingStartedProps }
  | { name: 'onboarding_step_completed'; properties: OnboardingStepCompletedProps }
  | { name: 'onboarding_completed'; properties: OnboardingCompletedProps }
  | { name: 'send_transfer_initiated'; properties: SendTransferProps & { workflow_id: string } }
  | { name: 'send_transfer_completed'; properties: SendTransferProps & { workflow_id: string } }
  | { name: 'send_transfer_failed'; properties: SendTransferFailedProps }
  | { name: 'send_check_created'; properties: SendCheckCreatedProps }
  | { name: 'send_check_shared'; properties: SendCheckSharedProps }
  | { name: 'send_check_claim_started'; properties: SendCheckClaimProps }
  | { name: 'send_check_claimed'; properties: SendCheckClaimProps }
  | { name: 'send_check_revoked'; properties: SendCheckRevokeProps }
  | { name: 'send_check_failed'; properties: SendCheckFailedProps }
  | { name: 'earn_deposit_initiated'; properties: EarnDepositProps }
  | { name: 'earn_deposit_submitted'; properties: EarnDepositProps }
  | { name: 'earn_deposit_completed'; properties: EarnDepositConfirmedProps }
  | { name: 'earn_withdraw_initiated'; properties: EarnWithdrawProps }
  | { name: 'earn_withdraw_submitted'; properties: EarnWithdrawProps }
  | { name: 'earn_withdraw_completed'; properties: EarnWithdrawConfirmedProps }
  | { name: 'sendpot_viewed'; properties: Record<string, never> }
  | { name: 'sendpot_disclaimer_viewed'; properties: Record<string, never> }
  | { name: 'sendpot_disclaimer_accepted'; properties: Record<string, never> }
  | { name: 'sendpot_buy_tickets_started'; properties: SendpotTicketPurchaseProps }
  | { name: 'sendpot_ticket_purchase_submitted'; properties: SendpotTicketPurchaseProps }
  | { name: 'sendpot_ticket_purchase_completed'; properties: SendpotTicketPurchaseCompletedProps }
  | { name: 'sendpot_ticket_purchase_failed'; properties: SendpotTicketPurchaseFailedProps }
  | { name: 'sendpot_winnings_claimed'; properties: SendpotWinningsClaimedProps }
  | { name: 'sendpot_winnings_claim_failed'; properties: SendpotWinningsClaimFailedProps }
  | { name: 'rewards_screen_viewed'; properties: Record<string, never> }
  | { name: 'rewards_claim_started'; properties: RewardsClaimProps }
  | { name: 'rewards_claim_completed'; properties: RewardsClaimCompletedProps }
  | { name: 'rewards_claim_failed'; properties: RewardsClaimFailedProps }
  | { name: 'account_settings_viewed'; properties: Record<string, never> }
  | { name: 'sendtag_added'; properties: SendtagAddedProps }
  | { name: 'backup_passkey_created'; properties: Record<string, never> }
  | { name: 'account_deletion_started'; properties: AccountDeletionProps }
  | { name: 'account_deletion_completed'; properties: AccountDeletionProps }
  | { name: 'activity_feed_viewed'; properties: Record<string, never> }
  | { name: 'activity_filter_applied'; properties: ActivityFilterProps }
  | { name: 'activity_item_opened'; properties: ActivityItemProps }
  | { name: 'referral_link_shared'; properties: ReferralSharedProps }
  | { name: 'referral_invite_accepted'; properties: ReferralInviteProps }
  | { name: 'referral_reward_earned'; properties: ReferralRewardProps }
  | { name: 'canton_verification_viewed'; properties: Record<string, never> }
  | { name: 'canton_verification_completed'; properties: CantonVerificationProps }
  | { name: 'canton_verification_failed'; properties: CantonVerificationFailedProps }
  | { name: 'contacts_sync_started'; properties: ContactsSyncProps }
  | { name: 'contacts_sync_completed'; properties: ContactsSyncCompletedProps }
  | { name: 'contacts_sync_failed'; properties: ContactsSyncFailedProps }
  | { name: 'contacts_permission_denied'; properties: ContactsPermissionProps }
  | { name: 'deposit_started'; properties: DepositProps }
  | { name: 'deposit_completed'; properties: DepositCompletedProps }
  | { name: 'deposit_failed'; properties: DepositFailedProps }
  | { name: 'home_viewed'; properties: Record<string, never> }
  | { name: 'explore_viewed'; properties: Record<string, never> }
  | { name: 'invest_viewed'; properties: Record<string, never> }
  | { name: 'invest_banner_clicked'; properties: InvestBannerClickedProps }
  | { name: 'promo_card_clicked'; properties: PromoCardClickedProps }
  | { name: 'explore_banner_clicked'; properties: ExploreBannerClickedProps }
  | { name: 'leaderboard_viewed'; properties: Record<string, never> }
  | { name: 'leaderboard_filter_changed'; properties: LeaderboardFilterProps }
  | { name: 'splash_viewed'; properties: Record<string, never> }
  | { name: 'maintenance_viewed'; properties: MaintenanceViewedProps }
  | { name: 'force_update_prompted'; properties: ForceUpdateProps }
  | { name: 'ota_update_available'; properties: OtaUpdateProps }
  | { name: 'ota_update_download_started'; properties: OtaUpdateProps }
  | { name: 'ota_update_download_completed'; properties: OtaUpdateProps }
  | { name: 'ota_update_download_failed'; properties: OtaUpdateFailedProps }
  | { name: 'ota_update_prompt_shown'; properties: OtaUpdateProps }
  | { name: 'ota_update_restart_clicked'; properties: OtaUpdateProps }
  | { name: 'paymaster_approval_started'; properties: PaymasterApprovalProps }
  | { name: 'paymaster_approval_completed'; properties: PaymasterApprovalProps }
  | { name: 'paymaster_approval_failed'; properties: PaymasterApprovalFailedProps }
  | { name: 'profile_viewed'; properties: Record<string, never> }
  | { name: 'profile_updated'; properties: ProfileUpdatedProps }
  | { name: 'profile_verification_started'; properties: ProfileVerificationProps }
  | { name: 'profile_verification_completed'; properties: ProfileVerificationProps }
  | { name: 'profile_verification_failed'; properties: ProfileVerificationFailedProps }
  | { name: 'token_upgrade_started'; properties: TokenUpgradeProps }
  | { name: 'token_upgrade_completed'; properties: TokenUpgradeCompletedProps }
  | { name: 'token_upgrade_failed'; properties: TokenUpgradeFailedProps }
  | { name: 'wrap_started'; properties: WrapProps }
  | { name: 'wrap_completed'; properties: WrapCompletedProps }
  | { name: 'wrap_failed'; properties: WrapFailedProps }
  | { name: 'unwrap_started'; properties: WrapProps }
  | { name: 'unwrap_completed'; properties: WrapCompletedProps }
  | { name: 'unwrap_failed'; properties: WrapFailedProps }
  | { name: 'sendtag_checkout_started'; properties: SendtagCheckoutProps }
  | { name: 'sendtag_checkout_completed'; properties: SendtagCheckoutProps }
  | { name: 'sendtag_checkout_failed'; properties: SendtagCheckoutFailedProps }
  | { name: 'sendtag_transferred'; properties: SendtagTransferredProps }
  | { name: 'swap_disclaimer_viewed'; properties: Record<string, never> }
  | { name: 'swap_disclaimer_accepted'; properties: Record<string, never> }
  | { name: 'swap_review_started'; properties: SwapReviewProps }
  | { name: 'swap_submitted'; properties: SwapSubmittedProps }
  | { name: 'swap_completed'; properties: SwapCompletedProps }
  | { name: 'swap_failed'; properties: SwapFailedProps }
  | { name: 'auth_error_occurred'; properties: AuthErrorProps }
  | { name: 'passkey_integrity_failed'; properties: PasskeyIntegrityFailedProps }
  | { name: '$pageview'; properties: PageviewProps }
  | { name: '$screen'; properties: ScreenViewProps }

// Property interfaces
interface TransactionMetadata {
  // Filterable/breakdowns: chain_id, gas_sponsored, gas_payer, paymaster_flow, fee_token
  // Raw only (high-cardinality): tx_hash, userop_hash, paymaster_address
  chain_id?: number
  tx_hash?: string
  userop_hash?: string
  gas_sponsored?: boolean
  gas_payer?: 'paymaster' | 'user' | 'unknown'
  paymaster_address?: string
  paymaster_flow?: 'send' | 'erc7677' | 'unknown'
  fee_token?: 'usdc' | 'native' | 'unknown'
  gas_fee_quote_usdc?: string
  gas_fee_quote_native?: string
}

interface TransactionProps {
  tx?: TransactionMetadata
}

interface UserSignupStartedProps {
  has_referral: boolean
  auth_type: 'passkey' | 'phone' | 'unknown'
}

interface UserSignedUpProps {
  sendtag: string
  has_referral: boolean
  send_account_id: string
}

interface UserLoginWithPhoneProps {
  country_code: string
}

interface UserLoginSucceededProps {
  auth_type: 'phone' | 'passkey'
}

interface PhoneOtpSentProps {
  country_code: string
}

interface PhoneOtpVerifiedProps {
  country_code: string
}

interface OnboardingStartedProps {
  has_referral: boolean
}

interface OnboardingStepCompletedProps {
  step_name: string
  step_index?: number
}

interface OnboardingCompletedProps {
  sendtag: string
  has_referral: boolean
  send_account_id: string
}

interface SendTransferProps extends TransactionProps {
  token_address: Address | 'eth' | undefined  // Use token address, not symbol (symbols are not unique)
  amount: string | undefined
  recipient_type: string | undefined
  has_note: boolean
}

interface SendTransferFailedProps extends SendTransferProps {
  workflow_id: string
  error_type: 'user_rejection' | 'insufficient_funds' | 'network' | 'unknown'
}

interface SendCheckCreatedProps extends TransactionProps {
  token_count: number
  total_amount?: string
  has_note: boolean
  expires_in_days?: number
}

interface SendCheckSharedProps {
  share_channel?: 'copy_link' | 'share_sheet' | 'qr' | 'unknown'
}

interface SendCheckClaimProps extends TransactionProps {
  token_count: number
  total_amount?: string
}

interface SendCheckRevokeProps extends TransactionProps {
  token_count: number
  total_amount?: string
}

interface SendCheckFailedProps extends TransactionProps {
  step: 'create' | 'claim' | 'revoke' | 'share'
  error_type: 'user_rejection' | 'expired' | 'already_claimed' | 'network' | 'unknown'
}

interface EarnDepositProps extends TransactionProps {
  token_address: Address | undefined  // Use token address, not symbol (symbols are not unique)
  amount: string | undefined
  has_existing_deposit: boolean
}

interface EarnDepositConfirmedProps extends EarnDepositProps {}

interface EarnWithdrawProps extends TransactionProps {
  token_address: Address | undefined  // Use token address, not symbol (symbols are not unique)
  amount: string | undefined
}

interface EarnWithdrawConfirmedProps extends EarnWithdrawProps {}

interface SendpotTicketPurchaseProps extends TransactionProps {
  ticket_count: number
  total_amount?: string
}

interface SendpotTicketPurchaseCompletedProps extends SendpotTicketPurchaseProps {}

interface SendpotTicketPurchaseFailedProps extends SendpotTicketPurchaseProps {
  error_type: 'user_rejection' | 'insufficient_funds' | 'network' | 'unknown'
}

interface SendpotWinningsClaimedProps extends TransactionProps {
  amount?: string
}

interface SendpotWinningsClaimFailedProps extends SendpotWinningsClaimedProps {
  error_type: 'user_rejection' | 'network' | 'unknown'
}

interface RewardsClaimProps extends TransactionProps {
  distribution_number?: number
  amount?: string
}

interface RewardsClaimCompletedProps extends RewardsClaimProps {}

interface RewardsClaimFailedProps extends RewardsClaimProps {
  error_type: 'user_rejection' | 'network' | 'unknown'
}

interface SendtagAddedProps {
  sendtag: string
}

interface AccountDeletionProps {
  reason?: string
}

interface ActivityFilterProps {
  filter: string
}

interface ActivityItemProps {
  item_type: string
}

interface ReferralSharedProps {
  channel?: 'copy_link' | 'share_sheet' | 'qr' | 'unknown'
}

interface ReferralInviteProps {
  source?: 'link' | 'code' | 'unknown'
}

interface ReferralRewardProps {
  amount?: string
  currency?: string
}

interface CantonVerificationProps {
  verification_type?: string
  distribution_number?: number
}

interface CantonVerificationFailedProps extends CantonVerificationProps {
  error_type: 'not_eligible' | 'network' | 'unknown'
}

interface ContactsSyncProps {
  provider?: 'phone' | 'google' | 'apple' | 'unknown'
}

interface ContactsSyncCompletedProps extends ContactsSyncProps {
  contacts_count?: number
}

interface ContactsSyncFailedProps extends ContactsSyncProps {
  error_type: 'permission_denied' | 'network' | 'unknown'
}

interface ContactsPermissionProps {
  permission: 'contacts'
}

interface DepositProps extends TransactionProps {
  amount?: string
  currency?: string
  provider?: string
}

interface DepositCompletedProps extends DepositProps {}

interface DepositFailedProps extends DepositProps {
  error_type: 'user_rejection' | 'network' | 'provider_error' | 'unknown'
}

interface PromoCardClickedProps {
  promo_id?: string
}

interface ExploreBannerClickedProps {
  banner_id?: string
}

interface InvestBannerClickedProps {
  destination?: string
}

interface LeaderboardFilterProps {
  filter: string
}

interface MaintenanceViewedProps {
  reason?: string
}

interface ForceUpdateProps {
  minimum_version?: string
}

interface OtaUpdateProps {
  runtime_version?: string
  update_id?: string
}

interface OtaUpdateFailedProps extends OtaUpdateProps {
  error_type: 'network' | 'unknown'
}

interface PaymasterApprovalProps extends TransactionProps {
  chain_id?: number
}

interface PaymasterApprovalFailedProps extends PaymasterApprovalProps {
  error_type: 'user_rejection' | 'network' | 'unknown'
}

interface ProfileUpdatedProps {
  fields_updated: string[]
}

interface ProfileVerificationProps {
  method?: string
}

interface ProfileVerificationFailedProps extends ProfileVerificationProps {
  error_type: 'user_rejection' | 'network' | 'unknown'
}

interface TokenUpgradeProps extends TransactionProps {
  from_token_address?: Address  // Use token address, not symbol (symbols are not unique)
  to_token_address?: Address
  amount?: string
}

interface TokenUpgradeCompletedProps extends TokenUpgradeProps {}

interface TokenUpgradeFailedProps extends TokenUpgradeProps {
  error_type: 'user_rejection' | 'network' | 'unknown'
}

interface WrapProps extends TransactionProps {
  token_address?: Address  // Use token address, not symbol (symbols are not unique)
  amount?: string
}

interface WrapCompletedProps extends WrapProps {}

interface WrapFailedProps extends WrapProps {
  error_type: 'user_rejection' | 'network' | 'unknown'
}

interface SendtagCheckoutProps extends TransactionProps {
  tag_count: number
  total_price_usd: number
}

interface SendtagCheckoutFailedProps extends SendtagCheckoutProps {
  error_type: 'payment_failed' | 'user_cancelled' | 'unknown'
}

interface SendtagTransferredProps {
  sendtag: string
  direction: 'sent' | 'received'
  transfer_type: 'gift' | 'sale' | 'unknown'
}

interface SwapReviewProps extends TransactionProps {
  token_in_address: Address  // Use token address, not symbol (symbols are not unique)
  token_out_address: Address
  amount_in?: string
  amount_out?: string
  slippage_bps?: number
}

interface SwapSubmittedProps extends SwapReviewProps {}

interface SwapCompletedProps extends SwapReviewProps {}

interface SwapFailedProps extends SwapReviewProps {
  error_type: 'user_rejection' | 'insufficient_funds' | 'network' | 'quote_expired' | 'unknown'
}

interface PageviewProps {
  $current_url: string
}

interface ScreenViewProps {
  $screen_name: string
}

interface AuthErrorProps {
  error_message: string
  auth_type: 'sign_up' | 'login_with_phone' | 'passkey'
}

interface PasskeyIntegrityFailedProps {
  error_type: 'user_rejection' | 'verification_failed' | 'unknown'
}

// User identification
export interface AnalyticsUserProperties {
  sendtag?: string
  has_referral?: boolean
  send_account_id?: string
}

// Analytics service interface
export interface AnalyticsService {
  init(): Promise<void>
  identify(distinctId: string, properties?: AnalyticsUserProperties): void
  capture<E extends AnalyticsEvent>(event: E): void
  captureException(error: Error, context?: Record<string, unknown>): void
  reset(): void
  isInitialized(): boolean
}
```

#### Step 1.2: Create Platform-Specific Implementations

**Web implementation** (`packages/app/analytics/analytics.web.ts`):
```typescript
import posthog from 'posthog-js'
import type { AnalyticsService, AnalyticsEvent, AnalyticsUserProperties } from './types'

let initialized = false

export const analytics: AnalyticsService = {
  async init() {
    if (initialized) return

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key) {
      console.warn('[Analytics] PostHog key not configured')
      return
    }

    posthog.init(key, {
      api_host: host,
      defaults: '2025-05-24',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === 'development',
      persistence: 'localStorage+cookie',
    })

    initialized = true
  },

  identify(distinctId: string, properties?: AnalyticsUserProperties) {
    if (!initialized) return
    posthog.identify(distinctId, properties)
  },

  capture<E extends AnalyticsEvent>(event: E) {
    if (!initialized) return
    posthog.capture(event.name, event.properties)
  },

  captureException(error: Error, context?: Record<string, unknown>) {
    if (!initialized) return
    posthog.captureException(error, context)
  },

  reset() {
    if (!initialized) return
    posthog.reset()
  },

  isInitialized() {
    return initialized
  },
}
```

**Native implementation** (`packages/app/analytics/analytics.native.ts`):
```typescript
import PostHog from 'posthog-react-native'
import type { AnalyticsService, AnalyticsEvent, AnalyticsUserProperties } from './types'

let client: PostHog | null = null

export const analytics: AnalyticsService = {
  async init() {
    if (client) return

    const key = process.env.EXPO_PUBLIC_POSTHOG_KEY
    const host = process.env.EXPO_PUBLIC_POSTHOG_HOST

    if (!key) {
      console.warn('[Analytics] PostHog key not configured')
      return
    }

    client = new PostHog(key, {
      host,
      enableSessionReplay: false, // Can enable later if needed
    })

    await client.ready()
  },

  identify(distinctId: string, properties?: AnalyticsUserProperties) {
    client?.identify(distinctId, properties)
  },

  capture<E extends AnalyticsEvent>(event: E) {
    client?.capture(event.name, event.properties)
  },

  captureException(error: Error, context?: Record<string, unknown>) {
    client?.capture('$exception', {
      $exception_message: error.message,
      $exception_stack: error.stack,
      ...context,
    })
  },

  reset() {
    client?.reset()
  },

  isInitialized() {
    return client !== null
  },
}
```

#### Step 1.3: Create Analytics Provider

**Provider** (`packages/app/provider/analytics/AnalyticsProvider.tsx`):
```typescript
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { analytics } from 'app/analytics'
import { useUser } from 'app/utils/useUser'

const AnalyticsContext = createContext<typeof analytics | null>(null)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useUser()

  // Initialize on mount
  useEffect(() => {
    analytics.init()
  }, [])

  // Auto-identify when user changes
  useEffect(() => {
    if (!analytics.isInitialized()) return

    if (user?.id && profile?.send_id) {
      analytics.identify(profile.send_id, {
        send_account_id: profile.send_id,
        sendtag: profile.main_tag_name ?? undefined,
      })
    } else {
      analytics.reset()
    }
  }, [user?.id, profile?.send_id, profile?.main_tag_name])

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider')
  }
  return context
}
```
Notes:
- Use `send_account_id` as the stable `distinct_id`. Treat `sendtag` as a mutable property that can change or transfer.
- When the primary tag changes, call `identify` again with the same `distinct_id` and emit `sendtag_transferred` if it was a transfer.

### Phase 2: Install Dependencies

#### Step 2.1: Add posthog-react-native to Expo app
```bash
cd apps/expo
yarn add posthog-react-native
```

#### Step 2.2: Add environment variables for Expo
Add to `apps/expo/app.config.ts` or `.env`:
```
EXPO_PUBLIC_POSTHOG_KEY=phc_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Phase 3: Migrate Existing Code

#### Step 3.1: Remove Direct posthog-js Imports
Replace all direct imports with the analytics service:

**Before:**
```tsx
import posthog from 'posthog-js'

// In component
if (typeof window !== 'undefined') {
  posthog.identify(createdSendAccount.id, {...})
  posthog.capture('user_signed_up', {...})
}
```

**After:**
```tsx
import { useAnalytics } from 'app/provider/analytics'

// In component
const analytics = useAnalytics()

analytics.capture({
  name: 'user_signed_up',
  properties: {
    sendtag: validatedSendtag,
    has_referral: !!referralCode,
    send_account_id: createdSendAccount.id,
  },
})
```

#### Step 3.2: Remove instrumentation-client.ts
Delete `apps/next/instrumentation-client.ts` - initialization moves to the provider.

#### Step 3.3: Update Provider Composition
Add `AnalyticsProvider` to `packages/app/provider/index.tsx`:
```typescript
import { AnalyticsProvider } from './analytics'

const Providers = compose([
  AnalyticsProvider,  // Add near the top
  WagmiProvider,
  // ... rest
])
```

### Phase 4: Enhanced Features

#### Step 4.1: Add Screen Tracking Hook
```typescript
// packages/app/analytics/useScreenTracking.ts
import { useEffect, useRef } from 'react'
import { usePathname } from 'solito/router'
import { analytics } from 'app/analytics'

export function useScreenTracking() {
  const pathname = usePathname()
  const previousPathRef = useRef<string>()

  useEffect(() => {
    if (pathname && pathname !== previousPathRef.current) {
      analytics.capture({
        name: '$pageview',
        properties: { $current_url: pathname },
      })
      previousPathRef.current = pathname
    }
  }, [pathname])
}
```
Notes:
- If you are manually capturing `$pageview`, set `capture_pageview: false` in `posthog.init` to avoid double counts.

#### Step 4.2: Add Error Boundary Integration
```typescript
// packages/app/components/ErrorBoundary.tsx
import { analytics } from 'app/analytics'

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    analytics.captureException(error, {
      componentStack: errorInfo.componentStack,
    })
  }
}
```

#### Step 4.3: Add Native Screen Tracking (React Navigation)
```typescript
// apps/expo/App.tsx (or root navigation provider)
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { useRef } from 'react'
import { analytics } from 'app/analytics'

const navigationRef = useNavigationContainerRef()
const routeNameRef = useRef<string | undefined>()

<NavigationContainer
  ref={navigationRef}
  onReady={() => {
    routeNameRef.current = navigationRef.getCurrentRoute()?.name
  }}
  onStateChange={() => {
    const currentRouteName = navigationRef.getCurrentRoute()?.name
    if (currentRouteName && routeNameRef.current !== currentRouteName) {
      analytics.capture({
        name: '$screen',
        properties: { $screen_name: currentRouteName },
      })
      routeNameRef.current = currentRouteName
    }
  }}
>
  {/* ... */}
</NavigationContainer>
```
Notes:
- If the PostHog RN SDK exposes `screen()`, prefer it over `$screen` events for native.

#### Step 4.4: Add Identity Linking, Shared Properties, and Consent
- Call `alias(newUserId)` immediately after signup (before `identify`) to link anonymous pre-auth events.
- Register shared properties once (platform, app_version, build_number, environment, locale, chain_id).
- Web source: `/api/version` (git SHA) for `app_version` (this endpoint already returns the deploy commit hash). Treat git hash as raw only; once web releases are tagged/semvered, add a `release_version` string for breakdowns.
- Native source: `expo-application` (`nativeApplicationVersion`, `nativeBuildVersion`) for `app_version` / `build_number`.
- Native OTA source: `expo-updates` (`runtimeVersion`, `updateId`/`manifest.revisionId`) for `runtime_version` / `update_id` (raw only).
- Queue events until `init()` resolves to avoid dropping early captures.
- Flush on app background/close on native to reduce event loss.
- Respect user opt-out settings (`opt_out_capturing` / `optOut`) and sanitize error messages.
- If you want session replay/automatic capture parity with `instrumentation-client.ts`, re-enable them explicitly in the new init paths.
- Consider disabling capture in dev/test or for internal accounts to keep data clean.
- Choose a stable distinct ID (auth user id) and attach `send_account_id` as a property if it can change.
- Never use `sendtag` as identity; treat it as mutable and track updates/transfers.

#### Step 4.5: Standardize Transaction Metadata
Add a single `tx` object on all transactional events (`*_submitted`, `*_completed`, `*_failed`) so sponsorship and gas analysis are consistent across Send, Earn, Swap, Sendpot, Send Check, Rewards, and Wrap/Upgrade.

Recommended sources in this app:
- `userOp` / `userOpReceipt`: `userop_hash`, `tx_hash`, gas limits.
- Paymaster flows: `paymaster_address`, `paymaster_flow` (`send` vs `erc7677`).
- `useUSDCFees`: `gas_fee_quote_usdc` (baseFee + gasFees).
- Sponsorship signal: `gas_sponsored` and `gas_payer` derived from flow (ERC-7677 sponsor vs user-paid USDC paymaster).

#### Step 4.6: Track Native OTA Update Flow
This app uses Expo OTA updates (`expo-updates`) and a native prompt (`OTAUpdateSheet.native.tsx`). Track the lifecycle so you can see adoption and drop-off.
- `ota_update_available`: when `checkForUpdateAsync()` returns available.
- `ota_update_download_started` / `ota_update_download_completed` / `ota_update_download_failed`: wrap `fetchUpdateAsync()` and errors.
- `ota_update_prompt_shown`: when the update sheet becomes visible (`isDownloaded`).
- `ota_update_restart_clicked`: when the user taps "Update Now".
If you need to infer apply, look for a new `runtime_version`/`update_id` on the next session after `ota_update_restart_clicked`.
Include `runtime_version` (filterable) and `update_id` (raw only) on these events.

---

## Migration Checklist

### Phase 1: Core Setup
- [x] Create `packages/app/analytics/types.ts` with event types
- [x] Update token tracking to use `token_address` instead of `token_symbol` (symbols are not unique identifiers)
- [x] Create `packages/app/analytics/analytics.web.ts`
- [x] Create `packages/app/analytics/analytics.native.ts`
- [x] Create `packages/app/analytics/index.ts` (re-exports)
- [x] Create `packages/app/provider/analytics/AnalyticsProvider.tsx`
- [x] Create `packages/app/provider/analytics/AnalyticsProvider.native.tsx` (if needed) - not needed, shared implementation works
- [x] Add `AnalyticsProvider` to provider composition

### Phase 2: Dependencies
- [x] Install `posthog-react-native` in `apps/expo`
- [x] Configure environment variables for Expo (documented in plan)
- [x] Verify posthog-js version in `apps/next`

### Phase 3: Migration
- [x] Migrate `packages/app/features/auth/sign-up/screen.tsx`
- [x] Migrate `packages/app/features/auth/loginWithPhone/screen.tsx`
- [x] Migrate `packages/app/features/auth/onboarding/screen.tsx`
- [x] Migrate `packages/app/features/send/confirm/screen.tsx` (updated to use `token_address`)
- [x] Migrate `packages/app/features/earn/deposit/screen.tsx` (updated to use `token_address`)
- [x] Migrate `packages/app/features/earn/withdraw/screen.tsx` (updated to use `token_address`)
- [x] Migrate `packages/app/features/account/sendtag/checkout/components/checkout-confirm-button.tsx`
- [ ] Add analytics to swap feature (`packages/app/features/swap/summary/screen.tsx`)
- [ ] Add analytics to token upgrade feature (`packages/app/features/send-token-upgrade/screen.tsx`)
- [ ] Add analytics to wrap/unwrap feature (location TBD)
- [ ] Add missing event coverage (account, activity, affiliate, contacts, rewards, send checks, sendpot, invest, paymaster allowance, profile)
- [x] Remove PostHog usage from `packages/app/features/secret-shop/screen.tsx` (no tracking needed)
- [x] Remove `apps/next/instrumentation-client.ts`
- [x] Remove user identification from individual components (handled by provider)

### Phase 4: Testing
- [ ] Test analytics on web (Next.js)
- [ ] Test analytics on iOS (Expo)
- [ ] Test analytics on Android (Expo)
- [ ] Verify events appear in PostHog dashboard
- [ ] Verify user identification works correctly
- [ ] Verify aliasing links pre-auth events to the identified user
- [ ] Verify native screen tracking and `$screen` events

### Phase 5: Cleanup
- [ ] Remove `posthog-setup-report.md` (outdated)
- [ ] Update any documentation
- [ ] Add analytics section to CLAUDE.md if needed

---

## Event Naming Convention

Follow these conventions for all events:

| Pattern | Example | Description |
|---------|---------|-------------|
| `{noun}_{past_verb}` | `user_signed_up` | Completed actions |
| `{noun}_{verb}_{state}` | `send_transfer_initiated` | State transitions |
| `{noun}_{verb}_clicked` | `send_check_shared` | UI interactions |
| `{noun}_error_occurred` | `auth_error_occurred` | Errors |

Reserved PostHog events: `$pageview`, `$screen`, `$exception`.

## Event Property Improvements
- **Use `token_address` instead of `token_symbol`** - Token symbols are not unique identifiers (e.g., multiple tokens can have the same symbol). Always use the token's contract address for unambiguous tracking.
- Prefer numeric amounts (or string + `amount_usd`) for aggregation.
- Include `workflow_id` on all steps in multi-stage flows.
- Add chain/network context (`chain_id`, `network`, `token_address`) when applicable.
- Normalize errors (`error_type`, `error_code`) and avoid raw PII in `error_message`.
- Treat `sendtag` as a mutable property for context and funnel analysis, not as identity.
- Keep `tx_hash` as a raw property only (do not mark it filterable or use it for breakdowns).
- Attach `tx` metadata to all onchain operations (userOp/tx) to standardize sponsorship and gas analytics.
- Property indexing guidance (apply to all events):
  - Filterable/breakdowns: booleans and enums (`*_started`, `*_completed`, `error_type`, `chain_id`, `recipient_type`, `paymaster_flow`, `gas_sponsored`, `build_number`, `runtime_version`, `release_version`).
  - Raw only (high-cardinality): IDs/hashes/addresses (`workflow_id`, `userop_hash`, `tx_hash`, wallet addresses, `update_id`, `app_version` when it is a git hash), amounts, notes, `sendtag`.

---

## Environment Variables

### Web (Next.js)
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Native (Expo)
```env
EXPO_PUBLIC_POSTHOG_KEY=phc_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Use the same PostHog project for both platforms to unify analytics.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing analytics | Keep web implementation behavior identical initially |
| Native SDK issues | Test thoroughly on both iOS and Android simulators |
| Performance impact on native | PostHog React Native SDK is optimized; batch events |
| Missing events during migration | Migrate one file at a time; verify in dashboard |

---

## Success Criteria

1. All existing events continue to fire on web
2. Events fire correctly on iOS and Android
3. User identification is consistent across platforms
4. No `typeof window` checks remain in feature code
5. All events are type-safe with TypeScript
6. Analytics initialization is centralized in one provider
