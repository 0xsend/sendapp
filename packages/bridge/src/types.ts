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
  'awaiting_funds',
  'funds_received',
  'funds_scheduled',
  'in_review',
  'payment_submitted',
  'payment_processed',
  'undeliverable',
  'returned',
  'missing_return_policy',
  'refunded',
  'canceled',
  'error',
  'refund',
])
export type DepositStatus = z.infer<typeof DepositStatus>

// Transfer states (for orchestration transfers)
export const TransferState = z.enum([
  'awaiting_funds',
  'in_review',
  'funds_received',
  'payment_submitted',
  'payment_processed',
  'undeliverable',
  'returned',
  'missing_return_policy',
  'refunded',
  'canceled',
  'error',
])
export type TransferState = z.infer<typeof TransferState>

// Virtual account status
export const VirtualAccountStatus = z.enum(['activated', 'deactivated'])
export type VirtualAccountStatus = z.infer<typeof VirtualAccountStatus>

// KYC Link Request
export const KycLinkRequestSchema = z.object({
  full_name: z.string().min(1).optional(),
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
  rejection_reasons: z
    .array(
      z.union([
        z.string(),
        z
          .object({
            developer_reason: z.string().optional(),
            reason: z.string().optional(),
            sub_reasons: z.array(z.string()).optional(),
          })
          .passthrough(),
      ])
    )
    .nullable(),
  created_at: z.string(),
})
export type KycLinkResponse = z.infer<typeof KycLinkResponseSchema>

// Source Deposit Instructions
export const SourceDepositInstructionsSchema = z.object({
  amount: z.string().optional(),
  currency: z.string(),
  deposit_message: z.string().optional(),
  bank_name: z.string().optional(),
  bank_address: z.string().optional(),
  bank_routing_number: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_beneficiary_name: z.string().optional(),
  bank_beneficiary_address: z.string().optional(),
  account_holder_name: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  payment_rail: PaymentRail.optional(),
  payment_rails: z.array(PaymentRail).optional(),
})
export type SourceDepositInstructions = z.infer<typeof SourceDepositInstructionsSchema>

// Virtual Account Request
export const VirtualAccountRequestSchema = z.object({
  source: z.object({
    currency: z.literal('usd'),
  }),
  destination: z.object({
    currency: z.literal('usdc'),
    payment_rail: z.literal('base'),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  }),
  developer_fee_percent: z.union([z.number(), z.string()]).optional(),
})
export type VirtualAccountRequest = z.infer<typeof VirtualAccountRequestSchema>

// Virtual Account Response
export const VirtualAccountResponseSchema = z.object({
  id: z.string(),
  status: VirtualAccountStatus,
  customer_id: z.string(),
  created_at: z.string(),
  source_deposit_instructions: SourceDepositInstructionsSchema,
  destination: z.object({
    currency: z.string(),
    payment_rail: z.string(),
    address: z.string(),
  }),
  developer_fee_percent: z.union([z.number(), z.string()]).optional(),
})
export type VirtualAccountResponse = z.infer<typeof VirtualAccountResponseSchema>

// Static Memo Request
export const StaticMemoRequestSchema = z.object({
  source: z.object({
    currency: z.string(),
    payment_rail: z.string(),
  }),
  destination: z.object({
    currency: z.string(),
    payment_rail: z.string(),
    address: z.string(),
    blockchain_memo: z.string().optional(),
  }),
  developer_fee_percent: z.union([z.number(), z.string()]).optional(),
})
export type StaticMemoRequest = z.infer<typeof StaticMemoRequestSchema>

// Static Memo Response
export const StaticMemoResponseSchema = z.object({
  id: z.string(),
  status: z.string().optional(),
  customer_id: z.string().optional(),
  created_at: z.string().optional(),
  source_deposit_instructions: SourceDepositInstructionsSchema,
  destination: z.object({
    currency: z.string(),
    payment_rail: z.string(),
    address: z.string(),
    blockchain_memo: z.string().optional(),
  }),
  developer_fee_percent: z.union([z.number(), z.string()]).optional(),
})
export type StaticMemoResponse = z.infer<typeof StaticMemoResponseSchema>

// Transfer Request (Bridge orchestration transfers)
export const TransferRequestSchema = z.object({
  amount: z.union([z.string(), z.number()]).optional(),
  on_behalf_of: z.string().optional(),
  source: z.object({
    currency: z.string(),
    payment_rail: z.string().optional(),
    address: z.string().optional(),
  }),
  destination: z.object({
    currency: z.string(),
    payment_rail: z.string(),
    to_address: z.string().optional(),
  }),
  developer_fee: z.union([z.string(), z.number()]).optional(),
  developer_fee_percent: z.union([z.string(), z.number()]).optional(),
  features: z
    .object({
      static_template: z.boolean().optional(),
      flexible_amount: z.boolean().optional(),
      allow_any_from_address: z.boolean().optional(),
    })
    .optional(),
})
export type TransferRequest = z.infer<typeof TransferRequestSchema>

// Transfer Response
export const TransferResponseSchema = z.object({
  id: z.string(),
  state: TransferState,
  on_behalf_of: z.string().nullable().optional(),
  source: z.object({
    payment_rail: z.string().optional(),
    currency: z.string().optional(),
  }),
  destination: z
    .object({
      payment_rail: z.string().optional(),
      currency: z.string().optional(),
      to_address: z.string().optional(),
    })
    .optional(),
  source_deposit_instructions: SourceDepositInstructionsSchema.optional(),
  receipt: z
    .object({
      developer_fee: z.string().optional(),
      exchange_fee: z.string().optional(),
      gas_fee: z.string().optional(),
      final_amount: z.string().optional(),
      destination_tx_hash: z.string().optional(),
    })
    .optional(),
  template_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})
export type TransferResponse = z.infer<typeof TransferResponseSchema>

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
export const WebhookEventCategory = z.enum([
  'kyc_link',
  'virtual_account.activity',
  'transfer',
  'static_memo.activity',
])
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
  status: z.string(),
  url: z.string().url(),
  event_categories: z.array(z.string()),
  public_key: z.string(),
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
