import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { BaseEventSchema } from './BaseEventSchema'
import { CoinSchema, usdcCoin } from 'app/data/coins'
import { Events } from './events'
import { OnchainEventDataSchema } from './OnchainDataSchema'

/**
 * Sendtag receipt USDC event data
 */
export const TagReceiptUSDCDataSchema = OnchainEventDataSchema.extend({
  /**
   * The sendtags that were confirmed in this transaction
   */
  tags: z.array(z.string()),
  /**
   * The value in ETH of the transaction
   */
  value: decimalStrToBigInt,
  coin: CoinSchema.default(usdcCoin),
})

export const TagReceiptUSDCEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.TagReceiptUSDC),
  data: TagReceiptUSDCDataSchema,
})

export type TagReceiptUSDCEvent = z.infer<typeof TagReceiptUSDCEventSchema>

export const isTagReceiptUSDCEvent = (event: {
  event_name: string
}): event is TagReceiptUSDCEvent => event.event_name === Events.TagReceiptUSDC
