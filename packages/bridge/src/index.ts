// Bridge XYZ API client and utilities
export { BridgeClient, createBridgeClient } from './client'
export { BridgeApiError, WebhookSignatureError, DuplicateWebhookEventError } from './errors'
export {
  verifyWebhookSignature,
  parseWebhookEvent,
  extractKycStatusFromEvent,
  extractTosStatusFromEvent,
  extractDepositStatusFromEvent,
  isKycEvent,
  isVirtualAccountActivityEvent,
} from './webhooks'
export * from './types'
