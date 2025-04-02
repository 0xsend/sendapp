import { createTransferActivities } from './transfer-workflow/activities'
import { createDepositActivities } from './deposit-workflow/activities'
export function createMonorepoActivities(env: Record<string, string | undefined>) {
  return {
    ...createTransferActivities(env),
    ...createDepositActivities(env),
  }
}

export { createTransferActivities } from './transfer-workflow/activities'
export { createDepositActivities } from './deposit-workflow/activities'
// export { createDistributionActivities } from './distribution-workflow/activities'
