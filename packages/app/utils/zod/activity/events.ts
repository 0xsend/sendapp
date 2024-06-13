/**
 * the names of the events that can be found in the activity feed and are parsed by the EventSchema.
 */
export enum Events {
  /**
   * ERC-20 token transfer for a send account
   */
  SendAccountTransfers = 'send_account_transfers',
  /**
   * Sendtag receipt for a send account
   */
  TagReceipts = 'tag_receipts',
  /**
   * Sendtag referrals for a send account
   */
  Referrals = 'referrals',
  /**
   * Send account receives ETH
   */
  SendAccountReceive = 'send_account_receives',
}
