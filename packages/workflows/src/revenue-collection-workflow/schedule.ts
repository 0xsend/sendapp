import { version } from '../version'

/**
 * Temporal schedule configuration for automated revenue collection.
 * Runs monthly on the 1st at 6 AM UTC.
 */
export const REVENUE_COLLECTION_SCHEDULE = {
  scheduleId: 'send-earn-revenue-collection',
  spec: {
    cronExpressions: ['0 6 1 * *'], // 1st of month at 6 AM UTC
  },
  action: {
    type: 'startWorkflow' as const,
    workflowType: 'RevenueCollectionWorkflow',
    args: [{ dryRun: false }],
    taskQueue: `monorepo@${version}`, // Must match worker task queue
  },
}
