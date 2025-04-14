import { getTemporalConnectionOptions, getTemporalNamespace } from '@my/temporal/client'
import { createMonorepoActivities } from '@my/workflows/all-activities'
import { version } from '@my/workflows/version'
import { NativeConnection, Worker } from '@temporalio/worker'
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
  // Get connection options using the shared function from @my/temporal/client
  const connectionOptions = getTemporalConnectionOptions()
  // Establish the native connection using the shared options
  const connection = await NativeConnection.connect(connectionOptions)

  const worker = await Worker.create({
    connection,
    dataConverter: {
      payloadConverterPath: require.resolve('@my/temporal/payload-converter'),
    },
    ...workflowOption(),
    activities: createMonorepoActivities(process.env),
    namespace: getTemporalNamespace(),
    taskQueue: `monorepo@${version}`,
  })

  await worker.run()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
