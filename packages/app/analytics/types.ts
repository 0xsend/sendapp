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
  from_token_address?: Address
  to_token_address?: Address
  amount?: string
}

interface TokenUpgradeCompletedProps extends TokenUpgradeProps {}

interface TokenUpgradeFailedProps extends TokenUpgradeProps {
  error_type: 'user_rejection' | 'network' | 'unknown'
}

interface WrapProps extends TransactionProps {
  token_address?: Address
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
  token_in_address: Address
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
  | { name: 'earn_withdraw_initiated'; properties: EarnWithdrawProps }
  | { name: 'earn_withdraw_submitted'; properties: EarnWithdrawProps }
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
  | { name: 'activity_item_opened'; properties: ActivityItemProps }
  | { name: 'referral_link_shared'; properties: ReferralSharedProps }
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
  | { name: 'leaderboard_viewed'; properties: Record<string, never> }
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
