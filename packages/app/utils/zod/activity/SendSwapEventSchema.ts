import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { CoinSchema, type CoinWithBalance, ethCoin, knownCoins } from 'app/data/coins'
import { isAddressEqual } from 'viem'
import { Events } from './events'
import { OnchainEventDataSchema } from './OnchainDataSchema'

export const SwapDataSchema = OnchainEventDataSchema.extend({
  /**
   * The address of the router
   */
  f: byteaToHexEthAddress,
  /**
   * The value of the transaction
   */
  v: decimalStrToBigInt,
  log_addr: byteaToHexEthAddress.or(z.literal('eth')),
})
  .extend({
    coin: CoinSchema.optional(),
  })
  .transform((t) => {
    if (t.log_addr === 'eth') {
      return { ...t, coin: ethCoin as CoinWithBalance }
    }

    return {
      ...t,
      coin: knownCoins.find(
        (c) => c.token !== 'eth' && isAddressEqual(c.token, t.log_addr as `0x${string}`)
      ),
    }
  })

export const SendSwapEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.SendSwap),
  data: SwapDataSchema,
})

export type SendSwapEvent = z.infer<typeof SendSwapEventSchema>

export const isSendSwapEvent = (event: { event_name: string }): event is SendSwapEvent =>
  event.event_name === Events.SendSwap
