import type { SeedClientOptions, usersInputs } from '@snaplet/seed'
import { pravatar, tagName } from './utils'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import { copycat } from '@snaplet/copycat'

export const models: SeedClientOptions['models'] = {
  users: {
    data: {},
  },
  profiles: {
    data: {
      avatarUrl: (ctx) => pravatar(copycat.fullName(ctx.seed)),
    },
  },
  tags: {
    data: {
      name: (ctx) => tagName(copycat.username(ctx.seed)),
    },
  },
  sendAccounts: {
    data: {
      address: () => privateKeyToAddress(generatePrivateKey()),
    },
  },
}

export const userOnboarded: usersInputs = {
  profiles: [{}],
  tags: [
    {
      status: 'confirmed',
    },
  ],
  sendAccounts: [{}],
}
