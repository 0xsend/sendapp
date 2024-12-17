import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { CoinSchema, allCoins } from 'app/data/coins'
import { isAddressEqual } from 'viem'
import { Events } from './events'
import { OnchainEventDataSchema } from './OnchainDataSchema'

/**
 * ERC-20 token transfer event data
 */
export const TransferDataSchema = OnchainEventDataSchema.extend({
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
})
  .extend({
    coin: CoinSchema.optional(),
  })
  .transform((t) => ({
    ...t,
    coin: allCoins.find((c) => c.token !== 'eth' && isAddressEqual(c.token, t.log_addr)),
  }))

export const SendAccountTransfersEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.SendAccountTransfers),
  data: TransferDataSchema,
})

export type SendAccountTransfersEvent = z.infer<typeof SendAccountTransfersEventSchema>

export const isSendAccountTransfersEvent = (event: {
  event_name: string
}): event is SendAccountTransfersEvent => event.event_name === Events.SendAccountTransfers
