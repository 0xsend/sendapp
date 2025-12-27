#!/usr/bin/env node
/**
 * Script to create or update the Temporal schedule for account top-offs
 * Run this once to set up the recurring schedule, or run it again to update the schedule
 *
 * Usage:
 *   tsx packages/workflows/src/topoff-workflow/start-schedule.ts
 */

import { getTemporalClient } from '@my/temporal/client'
import { TOPOFF_SCHEDULE_INTERVAL } from './config'
import debug from 'debug'

const log = debug('workflows:topoff:schedule')

async function main() {
  const client = await getTemporalClient()

  const scheduleId = 'account-topoff-schedule'

  try {
    // Try to create the schedule
    const handle = await client.schedule.create({
      scheduleId,
      spec: {
        // Run every 15 minutes
        cronExpressions: [TOPOFF_SCHEDULE_INTERVAL],
      },
      action: {
        type: 'startWorkflow',
        workflowType: 'topOffAccounts',
        taskQueue: 'monorepo@latest', // Use the same task queue as other workflows
        args: [],
      },
      policies: {
        // Only allow one workflow execution at a time
        overlap: 'SKIP',
        // Keep schedule running even if workflow fails
        catchupWindow: '1 minute',
      },
    })

    log(`✓ Schedule created: ${scheduleId}`)
    console.log(`Schedule created successfully: ${scheduleId}`)
    console.log('Next 5 runs:')

    const description = await handle.describe()
    const nextRuns = description.info.nextActionTimes?.slice(0, 5) || []
    for (const run of nextRuns) {
      console.log(`  - ${run.toISOString()}`)
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('already exists')) {
      log(`Schedule ${scheduleId} already exists, updating...`)
      console.log(
        `Schedule ${scheduleId} already exists. You can delete it first if you want to recreate it.`
      )
      console.log(`To delete: temporal schedule delete --schedule-id ${scheduleId}`)
    } else {
      console.error('Error creating schedule:', error)
      throw error
    }
  }

  await client.connection.close()
}

main().catch((error) => {
  console.error('Failed to create schedule:', error)
  process.exit(1)
})
