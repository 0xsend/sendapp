import { Worker, NativeConnection } from '@temporalio/worker'
import {
  createTransferActivities,
  createDistributionActivities,
} from '@my/workflows/all-activities'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dataConverter } from '@my/temporal/payload-converter'
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

  const worker = await Worker.create({
    connection,
    dataConverter: dataConverter,
    workflowsPath: require.resolve('@my/workflows'),
    activities: {
      ...createTransferActivities(process.env),
    },
    namespace: 'default',
    taskQueue: 'monorepo',
    bundlerOptions: {
      ignoreModules: ['@supabase/supabase-js'],
    },
  })

  await worker.run()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
