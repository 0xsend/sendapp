import { Connection, Client } from '@temporalio/client'
import { TransferWorkflow } from '@my/workflows/all-workflows'

// async function runDistributionWorkflow() {
//   const connection = await Connection.connect() // Connect to localhost with default ConnectionOptions.
//   // In production, pass options to the Connection constructor to configure TLS and other settings.
//   // This is optional but we leave this here to remind you there is a gRPC connection being established.

//   const client = new Client({
//     connection,
//     // In production you will likely specify `namespace` here; it is 'default' if omitted
//   })

//   // Invoke the `DistributionWorkflow` Workflow, only resolved when the workflow completes
//   const handle = await client.workflow.start(DistributionsWorkflow, {
//     taskQueue: 'dev',
//     workflowId: 'distributions-workflow', // TODO: remember to replace this with a meaningful business ID
//     args: [], // type inference works! args: [name: string]
//   })
//   console.log('Started handle', handle.workflowId)
//   // optional: wait for client result
//   const result = await handle.result()

//   return result
// }

export async function runTransferWorkflow(userId: string, userOpHash: `0x${string}`) {
  const connection = await Connection.connect()
  const client = new Client({
    connection,
  })

  const handle = await client.workflow.start(TransferWorkflow, {
    taskQueue: 'monorepo',
    workflowId: `transfers-workflow-${userId}-${userOpHash}`, // TODO: remember to replace this with a meaningful business ID
    args: [userOpHash],
  })
  console.log('Started handle', handle.workflowId)
  // optional: wait for client result
  const result = await handle.result()
  console.log('result: ', result)

  return result
}

// runDistributionWorkflow().catch((err) => {
//   console.error(err)
//   process.exit(1)
// })
