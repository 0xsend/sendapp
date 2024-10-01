import { Client, Connection } from '@temporalio/client'
import { dataConverter } from './payload-converter'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
import debug from 'debug'
import fs from 'node:fs/promises'
const { NODE_ENV = 'development' } = process.env
const isDeployed = ['production', 'staging'].includes(NODE_ENV)

const log = debug('api:temporal')
log(`connecting to temporal: ${process.env.TEMPORAL_NAMESPACE} with NODE_ENV: ${NODE_ENV}`)

let connectionOptions = {}
if (isDeployed) {
  connectionOptions = {
    address: `${process.env.TEMPORAL_NAMESPACE}.tmprl.cloud:7233`,
    tls: {
      clientCertPair: {
        crt: await fs.readFile(process.env.TEMPORAL_MTLS_TLS_CERT ?? '').catch((e) => {
          console.error(e)
          throw new Error('no cert found. Check the TEMPORAL_MTLS_TLS_CERT env var')
        }),
        key: await fs.readFile(process.env.TEMPORAL_MTLS_TLS_KEY ?? '').catch((e) => {
          console.error(e)
          throw new Error('no key found. Check the TEMPORAL_MTLS_TLS_KEY env var')
        }),
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
      dataConverter: dataConverter,
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
