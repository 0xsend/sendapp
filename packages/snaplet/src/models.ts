import type { SeedClientOptions } from '@snaplet/seed'
import { tagName } from './utils'

export const models: SeedClientOptions['models'] = {
  tags: {
    data: {
      name: (ctx) => tagName(ctx.seed),
    },
  },
}
