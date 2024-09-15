import { type Client, Connection } from '@temporalio/client'
import fs from 'fs-extra'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const { NODE_ENV = 'development' } = process.env
const isDeployed = ['production', 'staging'].includes(NODE_ENV)

const cert = await fs.readFile(process.env.TEMPORAL_MTLS_TLS_CERT ?? '')
const key = await fs.readFile(process.env.TEMPORAL_MTLS_TLS_KEY ?? '')

let connectionOptions = {}
if (isDeployed) {
  connectionOptions = {
    address: `${process.env.TEMPORAL_NAMESPACE}.temporal.cloud:7233`,
    tls: {
      clientCertPair: {
        crt: cert,
        key,
      },
    },
  }
}

const client: Client = makeClient()

function makeClient(): Client {
  const connection = Connection.lazy(connectionOptions)
  // In production, pass options to configure TLS and other settings.

  return new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    dataConverter: {
      payloadConverterPath: require.resolve('../build/payload-converter.cjs'),
    },
  })
}

export function getTemporalClient(): Client {
  return client
}

export async function close(client: Client) {
  await client.connection.close()
}
