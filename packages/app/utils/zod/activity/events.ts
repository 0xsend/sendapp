/**
 * Database events that can be found in the activity feed.
 * These are the actual event_name values from the database.
 */
export enum DatabaseEvents {
  /**
   * ERC-20 token transfer for a send account
   */
  SendAccountTransfers = 'send_account_transfers',
  /**
   * Sendtag receipt for a send account in ETH.
   * @see TagReceiptUSDC instead, we do not accept ETH for sendtags anymore
   */
  TagReceipts = 'tag_receipts',
  /**
   * Sendtag receipt for a send account in USDC
   */
  TagReceiptUSDC = 'tag_receipt_usdc',
  /**
   * Sendtag referrals for a send account
   */
  Referrals = 'referrals',
  /**
   * Send account receives ETH
   */
  SendAccountReceive = 'send_account_receives',
  /**
   * Temporal send account transfers
   */
  TemporalSendAccountTransfers = 'temporal_send_account_transfers',
  /**
   * Send Earn deposit
   */
  SendEarnDeposit = 'send_earn_deposit',
  /**
   * Send Earn withdraw
   */
  SendEarnWithdraw = 'send_earn_withdraw',
}

/**
 * Virtual events used for client-side processing.
 * These are not actual events in the database, but are created client-side
 * to represent specific contexts or scenarios.
 */
export enum VirtualEvents {}

/**
 * Union type of all events that can be found in the activity feed.
 * This includes both database events and virtual events.
 */
export type Events = DatabaseEvents | VirtualEvents

/**
 * Legacy enum for backward compatibility.
 * @deprecated Use DatabaseEvents or VirtualEvents directly, or the Events type.
 */
export const Events = {
  ...DatabaseEvents,
  ...VirtualEvents,
} as const
