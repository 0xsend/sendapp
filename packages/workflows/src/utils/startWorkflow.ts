import type { Client } from '@temporalio/client'
import * as workflows from '../all-workflows'

type WorkflowType = typeof workflows
type WorkflowName = keyof WorkflowType

type WorkflowArgs<T extends WorkflowName> = Parameters<WorkflowType[T]>

type StartWorkflowParams<T extends WorkflowName> = {
  client: Client
  workflow: T
  ids: [string, ...string[]] // non empty array
  args: WorkflowArgs<T>
}

export async function startWorkflow<T extends WorkflowName>({
  client,
  workflow,
  ids,
  args,
}: StartWorkflowParams<T>): Promise<ReturnType<Client['workflow']['start']>> {
  //@ts-expect-error Mad about args actually being typed
  return await client.workflow.start(workflows[workflow], {
    taskQueue: 'monorepo',
    workflowId: `temporal/${workflow}/${ids.join('/')}`,
    args,
  })
}
