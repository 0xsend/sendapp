import type { BridgeApiErrorResponse } from './types'

/**
 * Error thrown when Bridge API returns an error response
 */
export class BridgeApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly details: Record<string, unknown> | undefined
  /** Full response body for cases where Bridge includes extra data (e.g., existing KYC link) */
  readonly responseBody: Record<string, unknown>

  constructor(status: number, response: BridgeApiErrorResponse & Record<string, unknown>) {
    super(response.message)
    this.name = 'BridgeApiError'
    this.status = status
    this.code = response.code
    this.details = response.details
    this.responseBody = response
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
    }
  }
}

/**
 * Error thrown when webhook signature verification fails
 */
export class WebhookSignatureError extends Error {
  constructor(message = 'Invalid webhook signature') {
    super(message)
    this.name = 'WebhookSignatureError'
  }
}

/**
 * Error thrown when a duplicate webhook event is received
 */
export class DuplicateWebhookEventError extends Error {
  readonly eventId: string

  constructor(eventId: string) {
    super(`Duplicate webhook event: ${eventId}`)
    this.name = 'DuplicateWebhookEventError'
    this.eventId = eventId
  }
}
