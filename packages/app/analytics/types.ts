import type { Address } from 'viem'

// Transaction metadata for all onchain operations
interface TransactionMetadata {
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
  country_code?: string
}

interface PhoneOtpVerifiedProps {
  country_code?: string
}

interface OnboardingStartedProps {
  has_referral: boolean
}

interface OnboardingCompletedProps {
  sendtag: string
  has_referral: boolean
  send_account_id: string
}

interface SendTransferProps extends TransactionProps {
  token_address: Address | 'eth' | undefined
  amount: string | undefined
  recipient_type: string | undefined
  has_note: boolean
  is_contact: boolean
  is_favorite: boolean
}

// Contact events
interface ContactAddedProps {
  contact_type: 'sendtag' | 'address'
}

interface ContactArchivedProps {
  contact_type: 'sendtag' | 'address'
}

interface ContactUnarchivedProps {
  contact_type: 'sendtag' | 'address'
}

interface ContactFavoritedProps {
  is_favorited: boolean
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
  token_address: Address | undefined
  amount: string | undefined
  has_existing_deposit: boolean
}

interface EarnWithdrawProps extends TransactionProps {
  token_address: Address | undefined
  amount: string | undefined
}

interface EarnWithdrawCompletedProps {
  token_address: Address | undefined
  amount: string | undefined
}

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

interface ActivityItemProps {
  item_type: string
}

interface ReferralSharedProps {
  channel?: 'copy_link' | 'share_sheet' | 'qr' | 'unknown'
}

interface CantonVerificationProps {
  verification_type?: string
  distribution_number?: number
}

interface CantonVerificationFailedProps extends CantonVerificationProps {
  error_type: 'not_eligible' | 'network' | 'unknown'
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

interface MaintenanceViewedProps {
  reason?: string
}

interface OtaUpdateProps {
  runtime_version?: string
  update_id?: string
}

interface OtaUpdateFailedProps extends OtaUpdateProps {
  error_type: 'network' | 'unknown'
}

interface ProfileUpdatedProps {
  fields_updated: string[]
}

interface TokenUpgradeProps extends TransactionProps {
  from_token_address?: Address
  to_token_address?: Address
  amount?: string
}

interface TokenUpgradeCompletedProps extends TokenUpgradeProps {}

interface TokenUpgradeFailedProps extends TokenUpgradeProps {
  error_type: 'user_rejection' | 'network' | 'unknown'
}

interface SendtagCheckoutProps extends TransactionProps {
  tag_count: number
  total_price_usd: number
}

interface SendtagCheckoutFailedProps extends SendtagCheckoutProps {
  error_type: 'payment_failed' | 'user_cancelled' | 'unknown'
}

interface SwapReviewProps extends TransactionProps {
  token_in_address: Address | 'eth'
  token_out_address: Address | 'eth'
  amount_in?: string
  amount_out?: string
  slippage_bps?: number
}

interface SwapSubmittedProps extends SwapReviewProps {}

interface SwapCompletedProps extends SwapReviewProps {}

interface SwapFailedProps extends SwapReviewProps {
  error_type: 'user_rejection' | 'insufficient_funds' | 'network' | 'quote_expired' | 'unknown'
}

interface AuthErrorProps {
  error_message: string
  auth_type: 'sign_up' | 'login_with_phone' | 'passkey'
}

interface PasskeyIntegrityFailedProps {
  error_type: 'user_rejection' | 'verification_failed' | 'unknown'
}

// Discriminated union for type-safe events
export type AnalyticsEvent =
  // Auth & Onboarding
  | { name: 'user_signed_up'; properties: UserSignedUpProps }
  | { name: 'user_login_with_phone'; properties: UserLoginWithPhoneProps }
  | { name: 'user_login_succeeded'; properties: UserLoginSucceededProps }
  | { name: 'user_logged_out'; properties: Record<string, never> }
  | { name: 'phone_otp_sent'; properties: PhoneOtpSentProps }
  | { name: 'phone_otp_verified'; properties: PhoneOtpVerifiedProps }
  | { name: 'onboarding_started'; properties: OnboardingStartedProps }
  | { name: 'onboarding_completed'; properties: OnboardingCompletedProps }
  | { name: 'auth_error_occurred'; properties: AuthErrorProps }
  | { name: 'passkey_integrity_failed'; properties: PasskeyIntegrityFailedProps }
  // Send Transfers
  | { name: 'send_transfer_initiated'; properties: SendTransferProps & { workflow_id: string } }
  | { name: 'send_transfer_submitted'; properties: SendTransferProps & { workflow_id: string } }
  | { name: 'send_transfer_failed'; properties: SendTransferFailedProps }
  // Send Checks
  | { name: 'send_check_created'; properties: SendCheckCreatedProps }
  | { name: 'send_check_shared'; properties: SendCheckSharedProps }
  | { name: 'send_check_claim_started'; properties: SendCheckClaimProps }
  | { name: 'send_check_claimed'; properties: SendCheckClaimProps }
  | { name: 'send_check_revoked'; properties: SendCheckRevokeProps }
  | { name: 'send_check_failed'; properties: SendCheckFailedProps }
  // Earn
  | { name: 'earn_deposit_initiated'; properties: EarnDepositProps }
  | { name: 'earn_deposit_submitted'; properties: EarnDepositProps }
  | { name: 'earn_withdraw_initiated'; properties: EarnWithdrawProps }
  | { name: 'earn_withdraw_submitted'; properties: EarnWithdrawProps }
  | { name: 'earn_withdraw_completed'; properties: EarnWithdrawCompletedProps }
  // Sendpot
  | { name: 'sendpot_disclaimer_viewed'; properties: Record<string, never> }
  | { name: 'sendpot_disclaimer_accepted'; properties: Record<string, never> }
  | { name: 'sendpot_buy_tickets_started'; properties: SendpotTicketPurchaseProps }
  | { name: 'sendpot_ticket_purchase_submitted'; properties: SendpotTicketPurchaseProps }
  | { name: 'sendpot_ticket_purchase_completed'; properties: SendpotTicketPurchaseCompletedProps }
  | { name: 'sendpot_ticket_purchase_failed'; properties: SendpotTicketPurchaseFailedProps }
  | { name: 'sendpot_winnings_claimed'; properties: SendpotWinningsClaimedProps }
  | { name: 'sendpot_winnings_claim_failed'; properties: SendpotWinningsClaimFailedProps }
  // Rewards
  | { name: 'rewards_claim_started'; properties: RewardsClaimProps }
  | { name: 'rewards_claim_completed'; properties: RewardsClaimCompletedProps }
  | { name: 'rewards_claim_failed'; properties: RewardsClaimFailedProps }
  // Sendtag
  | { name: 'sendtag_added'; properties: SendtagAddedProps }
  | { name: 'sendtag_checkout_started'; properties: SendtagCheckoutProps }
  | { name: 'sendtag_checkout_completed'; properties: SendtagCheckoutProps }
  | { name: 'sendtag_checkout_failed'; properties: SendtagCheckoutFailedProps }
  // Account Management
  | { name: 'backup_passkey_created'; properties: Record<string, never> }
  | { name: 'account_deletion_started'; properties: AccountDeletionProps }
  | { name: 'account_deletion_completed'; properties: AccountDeletionProps }
  | { name: 'profile_updated'; properties: ProfileUpdatedProps }
  // Activity & Sharing
  | { name: 'activity_item_opened'; properties: ActivityItemProps }
  | { name: 'referral_link_shared'; properties: ReferralSharedProps }
  // Contacts
  | { name: 'contact_added'; properties: ContactAddedProps }
  | { name: 'contact_archived'; properties: ContactArchivedProps }
  | { name: 'contact_unarchived'; properties: ContactUnarchivedProps }
  | { name: 'contact_favorited'; properties: ContactFavoritedProps }
  // Canton Verification
  | { name: 'canton_verification_completed'; properties: CantonVerificationProps }
  | { name: 'canton_verification_failed'; properties: CantonVerificationFailedProps }
  // Deposit
  | { name: 'deposit_started'; properties: DepositProps }
  | { name: 'deposit_completed'; properties: DepositCompletedProps }
  | { name: 'deposit_failed'; properties: DepositFailedProps }
  // Maintenance & Updates
  | { name: 'maintenance_viewed'; properties: MaintenanceViewedProps }
  | { name: 'ota_update_available'; properties: OtaUpdateProps }
  | { name: 'ota_update_download_started'; properties: OtaUpdateProps }
  | { name: 'ota_update_download_completed'; properties: OtaUpdateProps }
  | { name: 'ota_update_download_failed'; properties: OtaUpdateFailedProps }
  | { name: 'ota_update_prompt_shown'; properties: OtaUpdateProps }
  | { name: 'ota_update_restart_clicked'; properties: OtaUpdateProps }
  // Token Upgrade
  | { name: 'token_upgrade_started'; properties: TokenUpgradeProps }
  | { name: 'token_upgrade_completed'; properties: TokenUpgradeCompletedProps }
  | { name: 'token_upgrade_failed'; properties: TokenUpgradeFailedProps }
  // Swap
  | { name: 'swap_disclaimer_viewed'; properties: Record<string, never> }
  | { name: 'swap_disclaimer_accepted'; properties: Record<string, never> }
  | { name: 'swap_review_started'; properties: SwapReviewProps }
  | { name: 'swap_submitted'; properties: SwapSubmittedProps }
  | { name: 'swap_completed'; properties: SwapCompletedProps }
  | { name: 'swap_failed'; properties: SwapFailedProps }

// User identification
export interface AnalyticsUserProperties {
  sendtag?: string
  has_referral?: boolean
  send_account_id?: string
}

// Exception tracking properties
export interface ExceptionProperties {
  /** Component or function where error occurred */
  source?: string
  /** Whether this was handled or unhandled */
  handled?: boolean
  /** Additional context to attach to the event */
  context?: Record<string, unknown>
}

// Analytics service interface
export interface AnalyticsService {
  init(): Promise<void>
  identify(distinctId: string, properties?: AnalyticsUserProperties): void
  capture<E extends AnalyticsEvent>(event: E): void
  /**
   * Track screen views on native platforms.
   * Uses PostHog's dedicated screen() method for React Navigation v7+ compatibility.
   * On web, this is a no-op as pageviews are handled automatically.
   */
  screen(name: string, properties?: Record<string, unknown>): void
  reset(): void
  isInitialized(): boolean
  /**
   * Get a feature flag value for the current user.
   */
  getFeatureFlag?(key: string): boolean | string | undefined
  /**
   * Subscribe to feature flag updates. Returns an unsubscribe function if supported.
   */
  onFeatureFlags?(callback: () => void): () => void
  /**
   * Capture exceptions and errors for error tracking.
   * Filters known/expected errors and sends to PostHog Error Tracking.
   */
  captureException(error: unknown, properties?: ExceptionProperties): void
}
