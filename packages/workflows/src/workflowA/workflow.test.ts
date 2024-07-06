import { afterAll, beforeAll, expect, test } from '@jest/globals'
import { WorkflowCoverage } from '@temporalio/nyc-test-coverage'
import { TestWorkflowEnvironment } from '@temporalio/testing'
import { DefaultLogger, Runtime, Worker, type LogEntry } from '@temporalio/worker'
import crypto from 'node:crypto'
import { activityA } from './activities/activitiesA'
import { activityB } from './activities/activitiesB'
import { WorkflowA } from './workflow'

let testEnv: TestWorkflowEnvironment

const workflowCoverage = new WorkflowCoverage()

beforeAll(async () => {
  // Use console.log instead of console.error to avoid red output
  // Filter INFO log messages for clearer test output
  Runtime.install({
    logger: new DefaultLogger('WARN', (entry: LogEntry) =>
      console.log(`[${entry.level}]`, entry.message)
    ),
  })

  testEnv = await TestWorkflowEnvironment.createLocal()
})

afterAll(async () => {
  await testEnv?.teardown()
})

afterAll(() => {
  workflowCoverage.mergeIntoGlobalCoverage()
})

test('WorkflowA with mock activity', async () => {
  const { client, nativeConnection } = testEnv
  const worker = await Worker.create(
    workflowCoverage.augmentWorkerOptions({
      connection: nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('./workflow'),
      activities: {
        activityA,
        activityB,
      },
    })
  )

  await worker.runUntil(async () => {
    const uuid = crypto.randomUUID()
    const result = await client.workflow.execute(WorkflowA, {
      workflowId: `test-${uuid}`,
      taskQueue: 'test',
      args: ['Temporal'],
    })
    expect(result).toEqual('A: ActivityA result: A-Temporal! | B: ActivityB result: B-Temporal!')
  })
})
