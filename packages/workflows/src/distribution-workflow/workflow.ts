// workflows.ts
import { proxyActivities, log, ApplicationFailure } from '@temporalio/workflow'
import type { createActivities } from './activities'

const {
  calculateDistributionSharesActivity,
  fetchDistributionActivity,
  fetchAllOpenDistributionsActivity,
} = proxyActivities<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '30 seconds',
})

export async function DistributionWorkflow(distributionId: number): Promise<void> {
  const distribution = await fetchDistributionActivity(distributionId.toString())
  if (!distribution) throw new ApplicationFailure('Distribution not found')
  await calculateDistributionSharesActivity(distribution)
}

export async function DistributionsWorkflow(): Promise<void> {
  // fetch all distributions in qualification period
  const distributions = await fetchAllOpenDistributionsActivity()
  if (!distributions) throw new ApplicationFailure('No distributions found')

  for (const distribution of distributions) {
    await DistributionWorkflow(distribution.id) // calculate one distribution at a time for now
  }
}
