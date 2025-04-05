import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress } from '../bytea'
import { Events } from './events'
import { OnchainEventDataSchema } from './OnchainDataSchema'
import { CoinSchema, ethCoin } from 'app/data/coins'
import { BaseEventSchema } from './BaseEventSchema'

export const SendAccountReceiveDataSchema = OnchainEventDataSchema.extend({
  /**
   * The amount of the transaction
   */
  value: decimalStrToBigInt,
  /**
   * The address of the sender
   */
  sender: byteaToHexEthAddress,
  /**
   * The coin of the transaction
   */
  coin: CoinSchema.optional().default(ethCoin),
  /**
   * The note attached to transaction, encoded as URI component
   */
  note: z.string().optional(),
})

export const SendAccountReceiveEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.SendAccountReceive),
  data: SendAccountReceiveDataSchema,
})

export type SendAccountReceiveEvent = z.infer<typeof SendAccountReceiveEventSchema>

export const isSendAccountReceiveEvent = (event: {
  event_name: string
}): event is SendAccountReceiveEvent => event.event_name === Events.SendAccountReceive
