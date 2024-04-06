import { toJSON } from '@indexsupply/shovel-config'
import { config } from '.'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    path: {
      type: 'string',
      default: 'shovel-config.json',
    },
  },
  strict: true,
  allowPositionals: true,
})

if (!values.path) {
  throw new Error('path is required')
}

Bun.write(values.path, toJSON(config, 2))
