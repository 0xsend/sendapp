import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress, byteaToHexTxHash } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { CoinSchema, knownCoins } from 'app/data/coins'
import { isAddressEqual } from 'viem'
import { Events } from './events'
import type { Database } from '@my/supabase/database-generated.types'
/**
 * Base temporal transfers data
 */
const BaseTemporalTransfersDataSchema = z.object({
  status: z.enum([
    'initialized',
    'sent',
    'confirmed',
    'indexed',
    'failed',
  ] as const satisfies readonly Database['temporal']['Enums']['transfer_status'][]),
  user_op_hash: byteaToHexTxHash.optional(),
  tx_hash: byteaToHexTxHash.optional(),
  block_num: decimalStrToBigInt.optional(),
  tx_idx: decimalStrToBigInt.optional(),
  log_addr: byteaToHexEthAddress,
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

export const TemporalTransfersEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.TemporalSendAccountTransfers),
  data: z.union([TokenTemporalTransfersDataSchema, EthTemporalTransfersDataSchema]),
})

export type TemporalTransfersEvent = z.infer<typeof TemporalTransfersEventSchema>

export const isTemporalTransfersEvent = (event: {
  event_name: string
}): event is TemporalTransfersEvent => event.event_name === Events.TemporalSendAccountTransfers

export const isTemporalTokenTransfers = (event: {
  data?: unknown
  event_name: string
}): event is TemporalTransfersEvent & {
  data: z.infer<typeof TokenTemporalTransfersDataSchema>
} => {
  return isTemporalTransfersEvent(event) && event.data.coin?.token !== 'eth'
}

export const isTemporalEthTransfers = (event: {
  data?: unknown
  event_name: string
}): event is TemporalTransfersEvent & { data: z.infer<typeof EthTemporalTransfersDataSchema> } => {
  return isTemporalTransfersEvent(event) && event.data.coin?.token === 'eth'
}

export const temporalEventNameFromStatus = (
  status: Database['temporal']['Enums']['transfer_status']
) => {
  switch (status) {
    case 'initialized':
      return 'Sending'
    case 'sent':
      return 'Confirming'
    case 'confirmed':
      return ''
    case 'indexed':
      return 'Sent'
    case 'failed':
      return 'Failed'
    default:
      return ''
  }
}
