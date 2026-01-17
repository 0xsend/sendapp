import nock from 'nock'

// Disable external network connections in tests (except Anvil fork)
nock.disableNetConnect()
// Allow localhost for Anvil
nock.enableNetConnect((host) => host.includes('127.0.0.1') || host.includes('localhost'))
