// workflows.ts
import { proxyActivities, log } from '@temporalio/workflow'
import type * as activities from './activities.js'
import { fetchDistribution } from './supabase.js'

const { calculateDistributionShares } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
})

export async function DistributionWorkflow(distributionId: number): Promise<void> {
  const { data: distribution, error } = await fetchDistribution(distributionId.toString())
  if (error) {
    log.error('Error fetching distribution.', { error: error.message, code: error.code })
    throw error
  }
  await calculateDistributionShares(distribution)
}
