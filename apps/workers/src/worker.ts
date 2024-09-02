import { Worker } from '@temporalio/worker'
import {
  createTransferActivities,
  createDistributionActivities,
} from '@my/workflows/all-activities'
import { URL, fileURLToPath } from 'node:url'
import path from 'node:path'

async function run() {
  // Step 1: Register Workflows and Activities with the Worker and connect to
  // the Temporal server.
  const transferWorker = await Worker.create({
    workflowsPath: fileURLToPath(workflowsPathUrl),
    activities: {
      ...createTransferActivities(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE
      ),
      // ...createDistributionActivities(
      //   process.env.NEXT_PUBLIC_SUPABASE_URL,
      //   process.env.SUPABASE_SERVICE_ROLE
      // ),
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
  await worker.run()

  // You may create multiple Workers in a single process in order to poll on multiple task queues.
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
