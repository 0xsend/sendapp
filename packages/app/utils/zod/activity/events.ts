/**
 * The names of the events that can be found in the activity feed and are parsed by the EventSchema.
 *
 * This includes both database events (actual event_name values from the database)
 * and virtual events (client-side only, used for more accurate event classification).
 */
export enum Events {
  // Database events (actual event_name values from the database)
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

  // Virtual events (client-side only)
  /**
   * Virtual event for Send Earn deposits
   * This is not an actual event in the database, but a client-side processed event
   * that represents a send_account_transfer to a Send Earn vault
   */
  SendEarnDeposit = 'send_earn_deposit',
}
