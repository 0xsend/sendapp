import { Connection, Client } from '@temporalio/client'
import { TransferWorkflow } from '@my/workflows/all-workflows'
import type { UserOperation } from 'permissionless'

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

export async function runTransferWorkflow(userOp: UserOperation<'v0.7'>) {
  const connection = await Connection.connect()
  const client = new Client({
    connection,
  })

  const handle = await client.workflow.start(TransferWorkflow, {
    taskQueue: 'monorepo',
    workflowId: `transfers-workflow-${userOp.sender}-${userOp.nonce.toString()}`, // TODO: remember to replace this with a meaningful business ID
    args: [userOp],
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

runTransferWorkflow({
  callData:
    '0x34fcd5be000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000713ddc85a615beaec95333736d80c406732f6d7600000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000',
  callGasLimit: 100000n,
  maxFeePerGas: 1000000110n,
  maxPriorityFeePerGas: 1000000000n,
  nonce: 1n,
  paymaster: '0x592e1224D203Be4214B15e205F6081FbbaCFcD2D',
  paymasterData: '0x',
  paymasterPostOpGasLimit: 100000n,
  paymasterVerificationGasLimit: 150000n,
  preVerificationGas: 70000n,
  sender: '0x713ddC85a615BEaec95333736D80C406732f6d76',
  signature:
    '0x01000066ce986500000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000193e778a488b82629b608dabe2a0979742f065662e670ca4b3e365162bff5457e6fd8931f1d72ab0ba388a92725cf7dba903799639c4cffb45bc232ef9dcb1da2000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008f7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22415141415a7336595a66796251683649754d4d6a4e774f35657171626f3930573058594f644b714d33345742314e4c35484c4250222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a33303030222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000',
  verificationGasLimit: 550000n,
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
