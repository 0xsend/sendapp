// workflows.ts
import { proxyActivities, log, ApplicationFailure } from '@temporalio/workflow'
import type { createDistributionActivities } from './activities'

const {
  calculateDistributionSharesActivity,
  fetchDistributionActivity,
  fetchAllOpenDistributionsActivity,
} = proxyActivities<ReturnType<typeof createDistributionActivities>>({
  startToCloseTimeout: '30 seconds',
})

export async function distribution(distributionId: number): Promise<void> {
  const distribution = await fetchDistributionActivity(distributionId.toString())
  if (!distribution) throw new ApplicationFailure('Distribution not found')
  await calculateDistributionSharesActivity(distribution)
}

export async function distributions(): Promise<void> {
  // fetch all distributions in qualification period
  const distributions = await fetchAllOpenDistributionsActivity()
  if (!distributions) throw new ApplicationFailure('No distributions found')

  for (const d of distributions) {
    await distribution(d.id) // calculate one distribution at a time for now
  }
}
