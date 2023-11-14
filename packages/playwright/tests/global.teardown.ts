import { test } from '@playwright/test'
import debug from 'debug'

const log = debug('test:global.setup')

// eslint-disable-next-line no-empty-pattern
test('global teardown', async ({}) => {
  log('global teardown')
})
