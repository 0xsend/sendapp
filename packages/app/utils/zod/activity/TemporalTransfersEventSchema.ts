import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress, byteaToHexTxHash } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { CoinSchema, knownCoins } from 'app/data/coins'
import { isAddressEqual } from 'viem'
import { Events } from './events'
import type { Database } from '@my/supabase/database-generated.types'

/** Temporal transfers status */
export const temporalTransferStatus = z.enum([
  'initialized',
  'submitted',
  'sent',
  'confirmed',
  'failed',
  'cancelled',
] as const satisfies readonly Database['temporal']['Enums']['transfer_status'][])

/**
 * Base temporal transfers data
 */
const BaseTemporalTransfersDataSchema = z.object({
  status: temporalTransferStatus,
  log_addr: byteaToHexEthAddress,
  user_op_hash: byteaToHexTxHash.nullable(),
  tx_hash: byteaToHexTxHash.nullable(),
  block_num: decimalStrToBigInt.nullable(),
  note: z.string().nullable(),
})

/**
 * Token temporal transfers data
 */
export const TokenTemporalTransfersDataSchema = BaseTemporalTransfersDataSchema.extend({
  f: byteaToHexEthAddress,
  t: byteaToHexEthAddress,
  v: decimalStrToBigInt,
})
  .extend({
    coin: CoinSchema.optional(),
  })
  .transform((t) => ({
    ...t,
    coin: knownCoins.find((c) => c.token !== 'eth' && isAddressEqual(c.token, t.log_addr)),
  }))

/**
 * ETH temporal transfers data
 */
export const EthTemporalTransfersDataSchema = BaseTemporalTransfersDataSchema.extend({
  sender: byteaToHexEthAddress,
  value: decimalStrToBigInt,
})
  .extend({
    coin: CoinSchema.optional(),
  })
  .transform((t) => ({
    ...t,
    coin: knownCoins.find((c) => c.token === 'eth'),
  }))

const TemporalTranfersDataSchema = z.union([
  TokenTemporalTransfersDataSchema,
  EthTemporalTransfersDataSchema,
])

export const TemporalTransfersEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.TemporalSendAccountTransfers),
  data: TemporalTranfersDataSchema,
})

export type TemporalTransfersEvent = z.infer<typeof TemporalTransfersEventSchema>

const isTemporalTransfersEvent = (event: {
  event_name: string
}): event is TemporalTransfersEvent => event.event_name === Events.TemporalSendAccountTransfers

export const isTemporalTokenTransfersEvent = (event: {
  data?: unknown
  event_name: string
}): event is TemporalTransfersEvent & {
  data: z.infer<typeof TokenTemporalTransfersDataSchema>
} => {
  return (
    isTemporalTransfersEvent(event) &&
    Boolean(knownCoins.find((c) => c.token === event.data.log_addr))
  )
}

export const isTemporalEthTransfersEvent = (event: {
  data?: unknown
  event_name: string
}): event is TemporalTransfersEvent & { data: z.infer<typeof EthTemporalTransfersDataSchema> } => {
  return isTemporalTransfersEvent(event) && !knownCoins.some((c) => c.token === event.data.log_addr)
}

export const temporalEventNameFromStatus = (
  status: Database['temporal']['Enums']['transfer_status']
) => {
  switch (status) {
    case 'initialized':
    case 'submitted':
      return 'Sending...'
    case 'sent':
      return 'Confirming...'
    case 'confirmed':
      return 'Sent'
    case 'failed':
    case 'cancelled':
      return 'Failed'
    default:
      return 'Initializing...'
  }
}
