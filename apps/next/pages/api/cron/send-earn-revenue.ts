import type { NextApiRequest, NextApiResponse } from 'next'
import { getTemporalClient } from '@my/temporal/client'
import { startWorkflow } from '@my/workflows/utils'
import debug from 'debug'

const log = debug('api:cron:send-earn-revenue')

/**
 * Manual trigger for Send Earn revenue collection workflow.
 *
 * POST /api/cron/send-earn-revenue
 * Body: { dryRun?: boolean }
 *
 * Returns: { workflowId: string }
 *
 * Note: This endpoint should be protected by authentication middleware
 * or a secret token for production use.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check for authorization header (simple bearer token check)
  const authHeader = req.headers.authorization
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    log('Unauthorized request to revenue collection endpoint')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { dryRun = false } = req.body ?? {}

    log('Starting revenue collection workflow', { dryRun })

    const client = await getTemporalClient()
    const handle = await startWorkflow({
      client,
      workflow: 'RevenueCollectionWorkflow',
      ids: ['manual', Date.now().toString()],
      args: [{ dryRun }],
    })

    log('Revenue collection workflow started', { workflowId: handle.workflowId })

    return res.status(200).json({ workflowId: handle.workflowId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    log('Failed to start revenue collection workflow', { error: message })
    return res.status(500).json({ error: message })
  }
}
