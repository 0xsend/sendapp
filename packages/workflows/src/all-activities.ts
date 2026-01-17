import { sendBaseMainnetBundlerClient } from '@my/wagmi'
import { erc7677BundlerClient } from './utils/erc7677-bundler-client'
import { createTransferActivities } from './transfer-workflow/activities'
import { createDepositActivities } from './deposit-workflow/activities'
import { createUserOpActivities } from './userop-workflow/activities'
import { createNotificationActivities } from './notification-workflow/activities'
import { createImageActivities } from './image-workflow/activities'

export function createMonorepoActivities(env: Record<string, string | undefined>) {
  return {
    ...createTransferActivities(env),
    ...createDepositActivities(env),
    ...createNotificationActivities(env),
    ...createImageActivities(env),
    // TODO: likely can remove since each workflow and activity should be self contained
    ...createUserOpActivities(env, sendBaseMainnetBundlerClient, erc7677BundlerClient),
  }
}

export { createTransferActivities } from './transfer-workflow/activities'
export { createUserOpActivities } from './userop-workflow/activities'
export { createDepositActivities } from './deposit-workflow/activities'
export { createNotificationActivities } from './notification-workflow/activities'
export { createImageActivities } from './image-workflow/activities'
// export { createDistributionActivities } from './distribution-workflow/activities'
