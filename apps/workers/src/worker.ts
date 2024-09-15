import { Worker, NativeConnection } from '@temporalio/worker'
import { createTransferActivities } from '@my/workflows/all-activities'
import fs from 'node:fs/promises'

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const { NODE_ENV = 'development' } = process.env
const isDeployed = ['production', 'staging'].includes(NODE_ENV)

async function run() {
  const connection = isDeployed
    ? await NativeConnection.connect({
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
      })
    : undefined

  // Step 1: Register Workflows and Activities with the Worker and connect to
  // the Temporal server.
  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('@my/workflows'),
    dataConverter: {
      payloadConverterPath: require.resolve(
        '../../../packages/temporal/build/payload-converter.cjs' //@Todo: figure out how to get this path from the temporal package and add build to Tilt deps
      ),
    },
    activities: {
      ...createTransferActivities(process.env),
    },
    namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    taskQueue: 'monorepo',
    bundlerOptions: {
      ignoreModules: ['@supabase/supabase-js'],
    },
  })

  // Worker connects to localhost by default and uses console.error for logging.
  // Customize the Worker by passing more options to create():
  // https://typescript.temporal.io/api/classes/worker.Worker

  // If you need to configure server connection parameters, see the mTLS example:
  // https://github.com/temporalio/samples-typescript/tree/main/hello-world-mtls

  // Step 2: Start accepting tasks on the `monorepo` queue
  await worker.run()

  // You may create multiple Workers in a single process in order to poll on multiple task queues.
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
