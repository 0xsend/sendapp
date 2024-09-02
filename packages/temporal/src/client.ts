import { Client, Connection } from '@temporalio/client'
import fs from 'fs-extra'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const { NODE_ENV = 'development' } = process.env
const isDeployed = ['production', 'staging'].includes(NODE_ENV)

// const cert = await fs.readFile('./path-to/your.pem')
// const key = await fs.readFile('./path-to/your.key')

const connectionOptions = {
  address: `${process.env.TEMPORAL_NAMESPACE}.tmprl.cloud:7233`,
  tls: {
    // clientCertPair: {
    //   crt: cert,
    //   key,
    // },
  },
}

const connection = await Connection.connect(isDeployed ? connectionOptions : {})

export const client = new Client({
  connection,
  namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
  dataConverter: {
    payloadConverterPath: require.resolve('../build/payload-converter.cjs'),
  },
})

export async function close(client: Client) {
  await client.connection.close()
}
