import { Worker, NativeConnection } from '@temporalio/worker'
import { createTransferActivities } from '@my/workflows/all-activities'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const { NODE_ENV = 'development' } = process.env
const isDeployed = ['production', 'test'].includes(NODE_ENV)

const workflowOption = () =>
  isDeployed
    ? {
        workflowBundle: {
          codePath: require.resolve('@my/workflows/workflow-bundle'),
        },
      }
    : { workflowsPath: require.resolve('@my/workflows/all-workflows') }

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
    dataConverter: {
      payloadConverterPath: require.resolve('@my/temporal/payload-converter'),
    },
    ...workflowOption(),
    activities: {
      ...createTransferActivities(process.env),
    },
    namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
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
