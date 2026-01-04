import { z } from 'zod'

// KYC Status values from Bridge API
export const KycStatus = z.enum([
  'not_started',
  'incomplete',
  'under_review',
  'approved',
  'rejected',
  'paused',
  'offboarded',
  'awaiting_questionnaire',
  'awaiting_ubo',
])
export type KycStatus = z.infer<typeof KycStatus>

// TOS Status values
export const TosStatus = z.enum(['pending', 'approved'])
export type TosStatus = z.infer<typeof TosStatus>

// Customer type
export const CustomerType = z.enum(['individual', 'business'])
export type CustomerType = z.infer<typeof CustomerType>

// Payment rails supported
export const PaymentRail = z.enum(['ach_push', 'wire'])
export type PaymentRail = z.infer<typeof PaymentRail>

// Deposit status
export const DepositStatus = z.enum([
  'funds_received',
  'in_review',
  'payment_submitted',
  'payment_processed',
  'refund',
])
export type DepositStatus = z.infer<typeof DepositStatus>

// Virtual account status
export const VirtualAccountStatus = z.enum(['active', 'inactive', 'closed'])
export type VirtualAccountStatus = z.infer<typeof VirtualAccountStatus>

// KYC Link Request
export const KycLinkRequestSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  type: CustomerType.default('individual'),
  redirect_uri: z.string().url().optional(),
  endorsements: z.array(z.string()).optional(),
})
export type KycLinkRequest = z.infer<typeof KycLinkRequestSchema>

// KYC Link Response
export const KycLinkResponseSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
  type: CustomerType,
  kyc_link: z.string().url(),
  tos_link: z.string().url(),
  kyc_status: KycStatus,
  tos_status: TosStatus,
  customer_id: z.string().nullable(),
  rejection_reasons: z.array(z.string()).nullable(),
  created_at: z.string(),
})
export type KycLinkResponse = z.infer<typeof KycLinkResponseSchema>

// Source Deposit Instructions
export const SourceDepositInstructionsSchema = z.object({
  currency: z.string(),
  bank_name: z.string(),
  bank_routing_number: z.string(),
  bank_account_number: z.string(),
  bank_beneficiary_name: z.string(),
  bank_beneficiary_address: z.string().optional(),
  payment_rails: z.array(PaymentRail),
})
export type SourceDepositInstructions = z.infer<typeof SourceDepositInstructionsSchema>

// Virtual Account Request
export const VirtualAccountRequestSchema = z.object({
  source_currency: z.literal('usd'),
  destination_currency: z.literal('usdc'),
  destination_payment_rail: z.literal('base'),
  destination_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})
export type VirtualAccountRequest = z.infer<typeof VirtualAccountRequestSchema>

// Virtual Account Response
export const VirtualAccountResponseSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  source_deposit_instructions: SourceDepositInstructionsSchema,
  destination_currency: z.string(),
  destination_payment_rail: z.string(),
  destination_address: z.string(),
})
export type VirtualAccountResponse = z.infer<typeof VirtualAccountResponseSchema>

// Customer Response
export const CustomerResponseSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
  kyc_status: KycStatus,
  tos_status: TosStatus,
  created_at: z.string(),
})
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>

// Webhook Event Categories
export const WebhookEventCategory = z.enum(['kyc_link', 'virtual_account.activity'])
export type WebhookEventCategory = z.infer<typeof WebhookEventCategory>

// Webhook Event (Bridge uses event_* payload format)
export const WebhookEventSchema = z.object({
  api_version: z.string(),
  event_id: z.string(),
  event_category: z.string(),
  event_type: z.string(),
  event_object_id: z.string(),
  event_object_status: z.string().nullable().optional(),
  event_object: z.record(z.unknown()),
  event_object_changes: z.record(z.unknown()).optional(),
  event_created_at: z.string(),
})
export type WebhookEvent = z.infer<typeof WebhookEventSchema>

// Webhook Response
export const WebhookResponseSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  enabled_events: z.array(z.string()),
  created_at: z.string(),
})
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>

// API Error Response
export const BridgeApiErrorResponseSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
})
export type BridgeApiErrorResponse = z.infer<typeof BridgeApiErrorResponseSchema>
