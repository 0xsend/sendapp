// workflows.ts
import { proxyActivities, log, ApplicationFailure } from '@temporalio/workflow'
import type { createActivities } from './activities'

const { calculateDistributionSharesActivity, fetchDistributionActivity } = proxyActivities<
  ReturnType<typeof createActivities>
>({
  startToCloseTimeout: '30 seconds',
})

export async function DistributionWorkflow(distributionId: number): Promise<void> {
  const distribution = await fetchDistributionActivity(distributionId.toString())
  if (!distribution) throw new ApplicationFailure('Distribution not found')
  await calculateDistributionSharesActivity(distribution)
}
