import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { BaseEventSchema } from './BaseEventSchema'
import { CoinSchema, allCoins } from 'app/data/coins'
import { assert } from 'app/utils/assert'
import { Events } from './events'
import { OnchainEventDataSchema } from './OnchainDataSchema'

const eth = allCoins.find((c) => c.symbol === 'ETH')
assert(!!eth, 'ETH coin not found')

/**
 * Tag receipt event data
 */
export const TagReceiptsDataSchema = OnchainEventDataSchema.extend({
  /**
   * The sendtags that were confirmed in this transaction
   */
  tags: z.array(z.string()),
  /**
   * The value in ETH of the transaction
   */
  value: decimalStrToBigInt,
  coin: CoinSchema.default(eth),
})

export const TagReceiptsEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.TagReceipts),
  data: TagReceiptsDataSchema,
})

export type TagReceiptsEvent = z.infer<typeof TagReceiptsEventSchema>

export const isTagReceiptsEvent = (event: { event_name: string }): event is TagReceiptsEvent =>
  event.event_name === Events.TagReceipts
