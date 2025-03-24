import { z } from 'zod'
import { byteaToHexEthAddress } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { OnchainEventDataSchema } from './OnchainDataSchema'
import { hex } from '../evm'

export const SendAccountSigningKeyRemovedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('send_account_signing_key_removed'),
  data: OnchainEventDataSchema.extend({
    account: byteaToHexEthAddress,
    key_slot: z.number(),
    key: z.array(hex),
  }),
})
