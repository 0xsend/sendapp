import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress, byteaToHexTxHash } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { CoinSchema, coins } from 'app/data/coins'
import { isAddressEqual } from 'viem'

/**
 * ERC-20 token transfer event data
 */

export const TransferDataSchema = z
  .object({
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
  .extend({
    coin: CoinSchema.optional(),
  })
  .transform((t) => ({
    ...t,
    coin: coins.find((c) => c.token !== 'eth' && isAddressEqual(c.token, t.log_addr)),
  }))

export const SendAccountTransfersEventSchema = BaseEventSchema.extend({
  event_name: z.literal('send_account_transfers'),
  data: TransferDataSchema,
})

export type SendAccountTransfersEvent = z.infer<typeof SendAccountTransfersEventSchema>

export const isSendAccountTransfersEvent = (event: {
  event_name: string
}): event is SendAccountTransfersEvent => event.event_name === 'send_account_transfers'
