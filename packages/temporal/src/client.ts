import { Client, Connection } from '@temporalio/client'
import type { NativeConnectionOptions } from '@temporalio/worker'
import debug from 'debug'

const {
  TEMPORAL_ADDR,
  TEMPORAL_NAMESPACE: envNamespace,
  TEMPORAL_MTLS_TLS_CERT,
  TEMPORAL_MTLS_TLS_KEY,
} = process.env

const log = debug('temporal:client')

/**
 * Gets the Temporal namespace from the environment variable TEMPORAL_NAMESPACE,
 * defaulting to 'default' if not set.
 * @returns The Temporal namespace string.
 */
export function getTemporalNamespace(): string {
  return envNamespace ?? 'default'
}

/**
 * Generates Temporal connection options based on environment variables.
 * Requires TEMPORAL_ADDR to be set.
 * Optionally configures TLS if TEMPORAL_MTLS_TLS_CERT and TEMPORAL_MTLS_TLS_KEY are provided.
 *
 * @returns Connection options compatible with both Client and NativeConnection.
 */
export function getTemporalConnectionOptions(): NativeConnectionOptions {
  if (!TEMPORAL_ADDR) {
    throw new Error('TEMPORAL_ADDR environment variable is not set.')
  }

  // Call the function to get the namespace for logging
  log(`connecting to temporal at ${TEMPORAL_ADDR} in namespace ${getTemporalNamespace()}`)

  // Explicitly type as NativeConnectionOptions to satisfy the worker's requirements
  const connectionOptions: NativeConnectionOptions = {
    address: TEMPORAL_ADDR,
    // Note: We are not setting 'metadata' here, avoiding the type conflict.
  }

  if (TEMPORAL_MTLS_TLS_CERT && TEMPORAL_MTLS_TLS_KEY) {
    log('configuring TLS for Temporal connection')
    connectionOptions.tls = {
      clientCertPair: {
        crt: Buffer.from(TEMPORAL_MTLS_TLS_CERT, 'base64'),
        key: Buffer.from(TEMPORAL_MTLS_TLS_KEY, 'base64'),
      },
    }
  } else {
    log('TLS not configured for Temporal connection (CERT or KEY missing)')
  }

  return connectionOptions
}

let client: Client | null = null

/**
 * Gets a singleton Temporal client instance.
 * Connects using options derived from environment variables.
 */
export async function getTemporalClient(): Promise<Client> {
  if (!client) {
    const connectionOptions = getTemporalConnectionOptions()
    const connection = await Connection.connect(connectionOptions)
    client = new Client({
      connection,
      namespace: getTemporalNamespace(),
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
