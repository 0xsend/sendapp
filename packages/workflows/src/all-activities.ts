import { sendBaseMainnetBundlerClient } from '@my/wagmi'
import { erc7677BundlerClient } from './utils/erc7677-bundler-client'
import { createTransferActivities } from './transfer-workflow/activities'
import { createDepositActivities } from './deposit-workflow/activities'
import { createUserOpActivities } from './userop-workflow/activities'
import * as topoffActivities from './topoff-workflow/activities'

export function createMonorepoActivities(env: Record<string, string | undefined>) {
  return {
    ...createTransferActivities(env),
    ...createDepositActivities(env),
    // TODO: likely can remove since each workflow and activity should be self contained
    ...createUserOpActivities(env, sendBaseMainnetBundlerClient, erc7677BundlerClient),
    ...topoffActivities,
  }
}

export { createTransferActivities } from './transfer-workflow/activities'
export { createUserOpActivities } from './userop-workflow/activities'
export { createDepositActivities } from './deposit-workflow/activities'
export * as topoffActivities from './topoff-workflow/activities'
// export { createDistributionActivities } from './distribution-workflow/activities'
