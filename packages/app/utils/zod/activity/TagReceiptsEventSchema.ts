import { z } from 'zod'
import { byteaToHexTxHash } from '../bytea'
import { decimalStrToBigInt } from '../bigint'
import { BaseEventSchema } from './BaseEventSchema'

/**
 * Tag receipt event data
 */
export const TagReceiptsDataSchema = z.object({
  /**
   * The sendtags that were confirmed in this transaction
   */
  tags: z.array(z.string()),
  /**
   * The value in ETH of the transaction
   */
  value: decimalStrToBigInt,
  /**
   * The transaction hash that included this event
   */
  tx_hash: byteaToHexTxHash,
})

export const TagReceiptsEventSchema = BaseEventSchema.extend({
  event_name: z.literal('tag_receipts'),
  data: TagReceiptsDataSchema,
})

export type TagReceiptsEvent = z.infer<typeof TagReceiptsEventSchema>
