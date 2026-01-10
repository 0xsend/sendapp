/**
 * Discriminated union types for activity feed rows.
 * Each type contains exactly the data needed for rendering - no computation at render time.
 */

// Base fields shared by all activity rows
interface BaseActivityRow {
  eventId: string
  title: string
  subtitle: string
  amount: string
  date: string
  isFirst: boolean
  isLast: boolean
  sectionIndex: number
  isPending?: boolean // For temporal transfers showing spinner instead of date
}

// User-to-user transfer (between Send app users)
export interface UserTransferRow extends BaseActivityRow {
  kind: 'user-transfer'
  avatarUrl: string
  isVerified: boolean
  isReceived: boolean
  counterpartSendId: number | null // send_id of the other user for onPress
}

// Swap/trade activity
export interface SwapRow extends BaseActivityRow {
  kind: 'swap'
  coinSymbol: string
  isBuy: boolean
}

// Sendpot ticket purchase or win
export interface SendpotRow extends BaseActivityRow {
  kind: 'sendpot'
}

// Sendcheck create or claim
export interface SendcheckRow extends BaseActivityRow {
  kind: 'sendcheck'
  isClaim: boolean
}

// Send Earn deposit or withdraw
export interface EarnRow extends BaseActivityRow {
  kind: 'earn'
  isDeposit: boolean
  isFailed: boolean
}

// External transfer (to/from non-Send addresses)
export interface ExternalRow extends BaseActivityRow {
  kind: 'external'
  avatarUrl: string
  coinSymbol: string
  isWithdraw: boolean
  isDeposit: boolean
}

// SEND token upgrade (v0 to v1)
export interface UpgradeRow extends BaseActivityRow {
  kind: 'upgrade'
}

// Sendtag registration
export interface TagReceiptRow extends BaseActivityRow {
  kind: 'tag-receipt'
}

// Referral activity
export interface ReferralRow extends BaseActivityRow {
  kind: 'referral'
  avatarUrl: string
  isVerified: boolean
  counterpartSendId: number | null // send_id of the other user for onPress
}

// Signing key added/removed
export interface SigningKeyRow extends BaseActivityRow {
  kind: 'signing-key'
}

// Section header
export interface HeaderRow {
  kind: 'header'
  title: string
  sectionIndex: number
}

// Union of all activity row types
export type ActivityRow =
  | UserTransferRow
  | SwapRow
  | SendpotRow
  | SendcheckRow
  | EarnRow
  | ExternalRow
  | UpgradeRow
  | TagReceiptRow
  | ReferralRow
  | SigningKeyRow
  | HeaderRow

// Type guard helpers
export const isHeaderRow = (row: ActivityRow): row is HeaderRow => row.kind === 'header'
