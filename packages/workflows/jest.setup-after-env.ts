import nock from 'nock'

nock.disableNetConnect()

// Define __DEV__ global for test environment
// biome-ignore lint/suspicious/noExplicitAny: global declaration
;(global as any).__DEV__ = false
