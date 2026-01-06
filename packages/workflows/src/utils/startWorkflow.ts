import type { Client } from '@temporalio/client'
import * as workflows from '../all-workflows'
import { version } from '../version'

type WorkflowType = typeof workflows
type WorkflowName = keyof WorkflowType

type WorkflowArgs<T extends WorkflowName> = Parameters<WorkflowType[T]>

type StartWorkflowParams<T extends WorkflowName> = {
  client: Client
  workflow: T
  ids: [string, ...string[]] // non empty array
  args: WorkflowArgs<T>
  /**
   * Optional explicit workflowId override.
   * When provided, this will be used as the Temporal workflowId instead of generating one.
   * Useful for intent-first workflows where the intent_id UUID is used as the workflowId.
   */
  workflowIdOverride?: string
}

/**
 * Starts a Temporal workflow with the given parameters.
 *
 * @param params - The workflow parameters
 * @param params.client - The Temporal client
 * @param params.workflow - The workflow name
 * @param params.ids - Array of IDs used to generate the workflowId (ignored if workflowIdOverride is provided)
 * @param params.args - Arguments to pass to the workflow
 * @param params.workflowIdOverride - Optional explicit workflowId (e.g., intent_id UUID for intent-first workflows)
 */
export async function startWorkflow<T extends WorkflowName>({
  client,
  workflow,
  ids,
  args,
  workflowIdOverride,
}: StartWorkflowParams<T>): Promise<ReturnType<Client['workflow']['start']>> {
  const workflowId = workflowIdOverride ?? `temporal/${workflow}/${ids.join('/')}`

  //@ts-expect-error Mad about args actually being typed
  return await client.workflow.start(workflows[workflow], {
    taskQueue: `monorepo@${version}`,
    workflowId,
    args,
  })
}
