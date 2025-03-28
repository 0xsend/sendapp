import { Client, Connection } from '@temporalio/client'
import debug from 'debug'
const {
  NODE_ENV = 'development',
  TEMPORAL_NAMESPACE = 'default',
  TEMPORAL_MTLS_TLS_CERT,
  TEMPORAL_MTLS_TLS_KEY,
} = process.env
const isDeployed = ['production', 'test'].includes(NODE_ENV) && !process.env.CI

const log = debug('api:temporal')
log(`connecting to temporal: ${TEMPORAL_NAMESPACE} with NODE_ENV: ${NODE_ENV}`)

let connectionOptions = {}

if (isDeployed) {
  if (!TEMPORAL_MTLS_TLS_CERT) {
    throw new Error('no cert found. Check the TEMPORAL_MTLS_TLS_CERT env var')
  }
  if (!TEMPORAL_MTLS_TLS_KEY) {
    throw new Error('no key found.  Check the TEMPORAL_MTLS_TLS_KEY env var')
  }
  connectionOptions = {
    address: `${process.env.TEMPORAL_NAMESPACE}.tmprl.cloud:7233`,
    tls: {
      clientCertPair: {
        crt: Buffer.from(TEMPORAL_MTLS_TLS_CERT, 'base64'),
        key: Buffer.from(TEMPORAL_MTLS_TLS_KEY, 'base64'),
      },
    },
  }
}

let client: Client | null = null

export async function getTemporalClient(): Promise<Client> {
  if (!client) {
    const connection = await Connection.connect(connectionOptions)
    client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
      dataConverter: {
        payloadConverterPath: new URL('../build/payload-converter.cjs', import.meta.url).pathname,
      },
    })
  }
  return client
}

export async function closeTemporalClient(): Promise<void> {
  if (client) {
    await client.connection.close()
    client = null
  }
}
