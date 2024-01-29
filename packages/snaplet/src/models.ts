import type { SeedClientOptions } from '@snaplet/seed'
import { tagName } from './utils'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'

export const models: SeedClientOptions['models'] = {
  tags: {
    data: {
      name: (ctx) => tagName(ctx.seed),
    },
  },
  sendAccounts: {
    data: {
      address: () => privateKeyToAddress(generatePrivateKey()),
    },
  },
}
