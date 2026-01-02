/**
 * Receipt Check Workflow
 *
 * A Temporal workflow that waits ~15 minutes after push notifications are sent,
 * then checks Expo receipts to verify delivery and handle any errors.
 *
 * This workflow is started as a child workflow from the main notification flow
 * when there are ticket IDs to check.
 */

import { proxyActivities, sleep, log } from '@temporalio/workflow'
import type { createNotificationActivities } from './activities'

// Default delay before checking receipts (Expo recommends ~15 minutes)
const RECEIPT_CHECK_DELAY_MS = 15 * 60 * 1000 // 15 minutes

const { checkPushReceiptsActivity, deactivateTokensActivity } = proxyActivities<
  ReturnType<typeof createNotificationActivities>
>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '10 seconds',
    maximumInterval: '2 minutes',
  },
})

export interface ReceiptCheckWorkflowInput {
  /** Ticket IDs from successful push sends */
  ticketIds: string[]
  /** User ID for logging context */
  userId: string
  /** Optional custom delay in ms (defaults to 15 minutes) */
  delayMs?: number
  /** Optional mapping from ticket ID -> push_tokens.id to allow receipt-based deactivation */
  ticketIdToTokenId?: Record<string, number>
}

export interface ReceiptCheckWorkflowResult {
  checked: number
  delivered: number
  failed: number
  tokensDeactivated: number
}

/**
 * Delayed receipt check workflow.
 *
 * Waits for a configured delay (default 15 minutes), then checks Expo push
 * notification receipts. If any receipts indicate DeviceNotRegistered errors,
 * the corresponding tokens are deactivated in the database.
 */
export async function receiptCheckWorkflow(
  input: ReceiptCheckWorkflowInput
): Promise<ReceiptCheckWorkflowResult> {
  const { ticketIds, userId, delayMs = RECEIPT_CHECK_DELAY_MS } = input

  if (ticketIds.length === 0) {
    log.info('No ticket IDs to check', { userId })
    return { checked: 0, delivered: 0, failed: 0, tokensDeactivated: 0 }
  }

  log.info('Starting receipt check workflow', {
    userId,
    ticketCount: ticketIds.length,
    delayMs,
  })

  // Wait before checking receipts
  await sleep(delayMs)

  log.info('Checking push receipts after delay', { userId, ticketCount: ticketIds.length })

  // Check receipts
  const result = await checkPushReceiptsActivity({
    ticketIds,
    userId,
  })

  let tokensDeactivated = 0

  // Deactivate any tokens that are no longer valid.
  // Receipts identify invalid devices via ticket IDs, so we need a mapping to push_tokens.id.
  if (result.ticketIdsToDeactivate && result.ticketIdsToDeactivate.length > 0) {
    log.info('Receipt check found invalid devices', {
      userId,
      count: result.ticketIdsToDeactivate.length,
    })

    const mapping = input.ticketIdToTokenId
    if (!mapping) {
      log.warn('Receipt-based token deactivation skipped (missing ticketIdToTokenId mapping)', {
        userId,
        ticketIds: result.ticketIdsToDeactivate,
      })
    } else {
      const tokenIds = new Set<number>()
      const unmappedTicketIds: string[] = []

      for (const ticketId of result.ticketIdsToDeactivate) {
        const tokenId = mapping[ticketId]
        if (typeof tokenId === 'number') {
          tokenIds.add(tokenId)
        } else {
          unmappedTicketIds.push(ticketId)
        }
      }

      if (unmappedTicketIds.length > 0) {
        log.warn('Some receipt ticket IDs did not map to token IDs', {
          userId,
          count: unmappedTicketIds.length,
          ticketIds: unmappedTicketIds,
        })
      }

      if (tokenIds.size > 0) {
        tokensDeactivated = await deactivateTokensActivity({
          tokenIds: [...tokenIds],
        })
      }
    }
  }

  log.info('Receipt check workflow complete', {
    userId,
    checked: result.checked,
    delivered: result.delivered,
    failed: result.failed,
    tokensDeactivated,
  })

  return {
    checked: result.checked,
    delivered: result.delivered,
    failed: result.failed,
    tokensDeactivated,
  }
}
