import { Worker } from '@temporalio/worker'
import { createTransferActivities } from '@my/workflows/all-activities'

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

async function run() {
  // Step 1: Register Workflows and Activities with the Worker and connect to
  // the Temporal server.
  const worker = await Worker.create({
    workflowsPath: require.resolve('@my/workflows'),
    dataConverter: {
      payloadConverterPath: require.resolve(
        '../../../packages/temporal/build/payload-converter.cjs' //@Todo: figure out how to get this path from the temporal package and add build to Tilt deps
      ),
    },
    activities: {
      ...createTransferActivities(process.env),
    },
    namespace: 'default',
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
  await transferWorker.run()

  // You may create multiple Workers in a single process in order to poll on multiple task queues.
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
