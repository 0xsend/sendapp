import { createVerify } from 'node:crypto'
import debug from 'debug'
import { WebhookSignatureError } from './errors'
import { WebhookEventSchema, type DepositStatus, type WebhookEvent } from './types'

const log = debug('bridge:webhooks')

const DEFAULT_TOLERANCE_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Parse Bridge webhook signature header
 * Format: t=<timestamp>,v0=<signature>
 */
function parseSignatureHeader(signatureHeader: string): { timestamp: string; signature: string } {
  const parts = signatureHeader.split(',')
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2)
  const signature = parts.find((part) => part.startsWith('v0='))?.slice(3)

  if (!timestamp || !signature) {
    throw new WebhookSignatureError('Missing signature timestamp or value')
  }

  return { timestamp, signature }
}

/**
 * Verify Bridge webhook signature (RSA + SHA256)
 *
 * Bridge signs webhook payloads using RSA-SHA256 with a timestamped signature.
 * The signature header format is: t=<timestamp>,v0=<base64_signature>
 * The signed payload is: <timestamp>.<raw_body>
 *
 * @param rawBody - The raw request body as a string
 * @param signatureHeader - The signature from the X-Webhook-Signature header
 * @param publicKey - The webhook public key (PEM format)
 * @param options - Optional settings for tolerance and current time
 * @returns true if signature is valid
 * @throws WebhookSignatureError if signature is invalid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  publicKey: string,
  options: { toleranceMs?: number; nowMs?: number } = {}
): boolean {
  if (!signatureHeader) {
    throw new WebhookSignatureError('Missing signature header')
  }

  const { timestamp, signature } = parseSignatureHeader(signatureHeader)
  const timestampMs = Number(timestamp)
  if (!Number.isFinite(timestampMs)) {
    throw new WebhookSignatureError('Invalid signature timestamp')
  }

  const nowMs = options.nowMs ?? Date.now()
  const toleranceMs = options.toleranceMs ?? DEFAULT_TOLERANCE_MS

  if (Math.abs(nowMs - timestampMs) > toleranceMs) {
    throw new WebhookSignatureError('Signature timestamp outside tolerance')
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const verifier = createVerify('RSA-SHA256')
  verifier.update(signedPayload)
  verifier.end()

  let isValid: boolean
  try {
    isValid = verifier.verify(publicKey, signature, 'base64')
  } catch (err) {
    log('signature verification error: %O', err)
    throw new WebhookSignatureError('Invalid signature')
  }

  if (!isValid) {
    log('signature mismatch')
    throw new WebhookSignatureError('Invalid signature')
  }

  log('signature verified')
  return true
}

/**
 * Parse and validate a webhook event payload
 *
 * @param rawBody - The raw request body as a string
 * @returns Parsed webhook event
 */
export function parseWebhookEvent(rawBody: string): WebhookEvent {
  const payload = JSON.parse(rawBody) as unknown
  return WebhookEventSchema.parse(payload)
}

/**
 * Check if this is a KYC-related webhook event
 */
export function isKycEvent(event: WebhookEvent): boolean {
  return event.event_category === 'kyc_link'
}

/**
 * Check if this is a virtual account activity-related webhook event
 */
export function isVirtualAccountActivityEvent(event: WebhookEvent): boolean {
  return event.event_category === 'virtual_account.activity'
}

/**
 * Check if this is a transfer-related webhook event
 */
export function isTransferEvent(event: WebhookEvent): boolean {
  return event.event_category === 'transfer'
}

/**
 * Extract KYC status from webhook event
 *
 * @param event - The webhook event
 * @returns The KYC status or null if not a KYC event
 */
export function extractKycStatusFromEvent(event: WebhookEvent): string | null {
  if (!isKycEvent(event)) return null

  const data = event.event_object as { kyc_status?: string }
  return data.kyc_status ?? null
}

/**
 * Extract TOS status from webhook event
 *
 * @param event - The webhook event
 * @returns The TOS status or null if not a KYC event
 */
export function extractTosStatusFromEvent(event: WebhookEvent): string | null {
  if (!isKycEvent(event)) return null

  const data = event.event_object as { tos_status?: string }
  return data.tos_status ?? null
}

/**
 * Extract deposit status from webhook event
 *
 * @param event - The webhook event
 * @returns The deposit status or null if not a deposit event
 */
export function extractDepositStatusFromEvent(event: WebhookEvent): DepositStatus | null {
  if (isTransferEvent(event)) {
    const data = event.event_object as { state?: string }

    switch (data.state) {
      case 'awaiting_funds':
        return 'awaiting_funds'
      case 'awaiting_source_deposit':
        return 'awaiting_funds'
      case 'funds_received':
        return 'funds_received'
      case 'in_review':
        return 'in_review'
      case 'payment_submitted':
        return 'payment_submitted'
      case 'payment_processed':
        return 'payment_processed'
      case 'undeliverable':
        return 'undeliverable'
      case 'returned':
        return 'returned'
      case 'missing_return_policy':
        return 'missing_return_policy'
      case 'refunded':
        return 'refunded'
      case 'canceled':
        return 'canceled'
      case 'error':
        return 'error'
      default:
        return null
    }
  }

  if (isVirtualAccountActivityEvent(event)) {
    const data = event.event_object as { type?: string }

    switch (data.type) {
      case 'funds_received':
        return 'funds_received'
      case 'funds_scheduled':
        return 'funds_scheduled'
      case 'in_review':
        return 'in_review'
      case 'payment_submitted':
        return 'payment_submitted'
      case 'payment_processed':
        return 'payment_processed'
      case 'refunded':
        return 'refund'
      default:
        return null
    }
  }

  return null
}
