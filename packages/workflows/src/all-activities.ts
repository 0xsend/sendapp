import { createTransferActivities } from './transfer-workflow/activities'
import { createDepositActivities } from './deposit-workflow/activities'
import { createUserOpActivities } from './userop-workflow/activities'
export function createMonorepoActivities(env: Record<string, string | undefined>) {
  return {
    ...createTransferActivities(env),
    ...createDepositActivities(env),
    // TODO: likely can remove since each workflow and activity should be self contained
    ...createUserOpActivities(env),
  }
}

export { createTransferActivities } from './transfer-workflow/activities'
export { createUserOpActivities } from './userop-workflow/activities'
export { createDepositActivities } from './deposit-workflow/activities'
// export { createDistributionActivities } from './distribution-workflow/activities'
