import { z } from 'zod'
import { byteaToHexEthAddress } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { OnchainEventDataSchema } from './OnchainDataSchema'
import { hex } from '../evm'

export const SendAccountSigningKeyAddedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('send_account_signing_key_added'),
  data: OnchainEventDataSchema.extend({
    account: byteaToHexEthAddress,
    key_slot: z.number(),
    key: z.array(hex),
  }),
})
