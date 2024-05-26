import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress, byteaToHexTxHash } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'

/**
 * ERC-20 token transfer event data
 */

export const TransferDataSchema = z.object({
  /**
   * The address of the sender
   */
  f: byteaToHexEthAddress,
  /**
   * The address of the receiver
   */
  t: byteaToHexEthAddress,
  /**
   * The value of the transaction
   */
  v: decimalStrToBigInt,
  /**
   * The transaction hash that included this event
   */
  tx_hash: byteaToHexTxHash,
  /**
   * The token address that logged the event
   */
  log_addr: byteaToHexEthAddress,
})

export const SendAccountTransfersEventSchema = BaseEventSchema.extend({
  event_name: z.literal('send_account_transfers'),
  data: TransferDataSchema,
})

export type SendAccountTransfersEvent = z.infer<typeof SendAccountTransfersEventSchema>
