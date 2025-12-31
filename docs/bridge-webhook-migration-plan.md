# Bridge Webhook Migration Plan

## Overview

Migrate the Bridge webhook handler from the planned separate Express service (`apps/bridge-webhook/`) to a Next.js API route (`apps/next/pages/api/bridge/webhook.ts`).

This keeps the webhook logic co-located with other Bridge API routes and eliminates the need for a separate service deployment.

Bridge webhooks use the `event_*` payload format and the `X-Webhook-Signature` header (timestamped RSA signature). The handler must read the raw body and verify signatures using the per-endpoint public key provided by Bridge.

## Migration Summary

| Aspect | Original Plan | Migrated Approach |
|--------|---------------|-------------------|
| Location | `apps/bridge-webhook/` | `apps/next/pages/api/bridge/webhook.ts` |
| Runtime | Separate Express service | Next.js API route |
| Handlers | `src/handlers/kyc.ts`, `src/handlers/deposits.ts` | Inline in webhook.ts or `packages/bridge/src/handlers/` |
| Deployment | Separate K8s pod via Tilt | Part of Next.js deployment |
| Port | 3060 | Same as Next.js (3000) |

---

## Implementation Tasks

### Task 1: Create Next.js webhook API route

Create `apps/next/pages/api/bridge/webhook.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  WebhookSignatureError,
  type WebhookEvent,
  extractKycStatusFromEvent,
  extractTosStatusFromEvent,
  extractDepositStatusFromEvent,
  isKycEvent,
  isVirtualAccountActivityEvent,
} from '@my/bridge'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

/**
 * Read raw body from request stream
 */
async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

/**
 * Handle KYC-related webhook events
 */
async function handleKycEvent(event: WebhookEvent): Promise<void> {
  const kycStatus = extractKycStatusFromEvent(event)
  const tosStatus = extractTosStatusFromEvent(event)

  const data = event.event_object as {
    id: string
    customer_id?: string | null
    kyc_status?: string | null
    tos_status?: string | null
    rejection_reasons?: string[] | null
  }

  if (!kycStatus && !tosStatus) return

  const updates: Record<string, unknown> = {
    bridge_customer_id: data.customer_id ?? null,
    rejection_reasons: data.rejection_reasons ?? null,
  }

  if (kycStatus) updates.kyc_status = kycStatus
  if (tosStatus) updates.tos_status = tosStatus

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('bridge_customers')
    .update(updates)
    .eq('kyc_link_id', data.id)

  if (error) throw error
}

/**
 * Handle deposit-related webhook events
 */
async function handleDepositEvent(event: WebhookEvent): Promise<void> {
  const depositStatus = extractDepositStatusFromEvent(event)
  if (!depositStatus) return

  const data = event.event_object as {
    id: string
    deposit_id?: string | null
    virtual_account_id: string
    type: string
    amount: string
    currency: string
    destination_tx_hash?: string | null
    source?: {
      payment_rail?: string
      sender_bank_routing_number?: string
      bank_routing_number?: string
      sender_name?: string
      originator_name?: string
      trace_number?: string
      imad?: string
    }
    exchange_fee_amount?: string
    developer_fee_amount?: string
    gas_fee?: string
    receipt?: {
      developer_fee?: string
      exchange_fee?: string
      gas_fee?: string
      final_amount?: string
      destination_tx_hash?: string
    }
  }

  const depositId = data.deposit_id ?? null
  if (!depositId) return

  const source = data.source ?? {}
  const receipt = data.receipt ?? {}

  const paymentRail = source.payment_rail ?? null
  const senderRoutingNumber =
    source.sender_bank_routing_number ?? source.bank_routing_number ?? null
  const senderName = source.sender_name ?? source.originator_name ?? null
  const traceNumber = source.trace_number ?? source.imad ?? null
  const destinationTxHash = data.destination_tx_hash ?? receipt.destination_tx_hash ?? null

  const feePieces = [
    receipt.developer_fee ?? data.developer_fee_amount,
    receipt.exchange_fee ?? data.exchange_fee_amount,
    receipt.gas_fee ?? data.gas_fee,
  ].filter((value) => value !== undefined)
  const feeAmount = feePieces.length
    ? feePieces.reduce((sum, value) => sum + Number(value), 0)
    : null
  const netAmount = receipt.final_amount ? Number(receipt.final_amount) : null

  const supabase = createSupabaseAdminClient()

  // Look up virtual account
  const { data: virtualAccount, error: vaError } = await supabase
    .from('bridge_virtual_accounts')
    .select('id')
    .eq('bridge_virtual_account_id', data.virtual_account_id)
    .single()

  if (vaError || !virtualAccount) {
    throw vaError ?? new Error('Virtual account not found')
  }

  // Upsert deposit record
  const { error: depositError } = await supabase.from('bridge_deposits').upsert(
    {
      bridge_transfer_id: depositId,
      virtual_account_id: virtualAccount.id,
      status: depositStatus,
      payment_rail: paymentRail,
      amount: Number(data.amount),
      currency: data.currency,
      sender_name: senderName,
      sender_routing_number: senderRoutingNumber,
      trace_number: traceNumber,
      destination_tx_hash: destinationTxHash,
      fee_amount: feeAmount,
      net_amount: netAmount,
      last_event_id: event.event_id,
      last_event_type: event.event_type,
      event_data: data,
    },
    { onConflict: 'bridge_transfer_id' }
  )

  if (depositError) throw depositError
}

/**
 * Route webhook event to appropriate handler
 */
async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  if (isKycEvent(event)) {
    await handleKycEvent(event)
  } else if (isVirtualAccountActivityEvent(event)) {
    await handleDepositEvent(event)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signatureHeader = req.headers['x-webhook-signature'] as string | undefined
  const webhookPublicKey = process.env.BRIDGE_WEBHOOK_PUBLIC_KEY

  if (!webhookPublicKey) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // Read raw body
  let rawBody: string
  try {
    rawBody = await getRawBody(req)
  } catch {
    return res.status(400).json({ error: 'Failed to read request body' })
  }

  // Verify signature
  try {
    verifyWebhookSignature(rawBody, signatureHeader ?? '', webhookPublicKey)
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      return res.status(400).json({ error: 'Invalid signature' })
    }
    throw err
  }

  // Parse event
  let event: WebhookEvent
  try {
    event = parseWebhookEvent(rawBody)
  } catch {
    return res.status(400).json({ error: 'Invalid event payload' })
  }

  const supabase = createSupabaseAdminClient()

  // Check for duplicate (idempotency)
  const { data: existingEvent } = await supabase
    .from('bridge_webhook_events')
    .select('id')
    .eq('bridge_event_id', event.event_id)
    .single()

  if (existingEvent) {
    return res.status(200).json({ received: true, duplicate: true })
  }

  // Store event
  const { error: insertError } = await supabase.from('bridge_webhook_events').insert({
    bridge_event_id: event.event_id,
    event_type: event.event_type,
    event_created_at: event.event_created_at,
    payload: JSON.parse(rawBody),
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return res.status(200).json({ received: true, duplicate: true })
    }
    return res.status(500).json({ error: 'Failed to store event' })
  }

  // Process event
  try {
    await handleWebhookEvent(event)

    await supabase
      .from('bridge_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('bridge_event_id', event.event_id)

    return res.status(200).json({ received: true, processed: true })
  } catch (err) {
    await supabase
      .from('bridge_webhook_events')
      .update({ error: String(err) })
      .eq('bridge_event_id', event.event_id)

    return res.status(500).json({ error: 'Failed to process event' })
  }
}
```

---

### Task 2: Update webhook types + helpers in Bridge package

Update `packages/bridge/src/types.ts` to match Bridge's webhook event structure:

```typescript
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
```

Also extend `KycStatus` to include `awaiting_questionnaire` and `awaiting_ubo`, and ensure DB constraints allow those values.

Update `packages/bridge/src/webhooks.ts`:

```typescript
import { createVerify } from 'node:crypto'
import { WebhookSignatureError } from './errors'
import { WebhookEventSchema, type DepositStatus, type WebhookEvent } from './types'

const DEFAULT_TOLERANCE_MS = 10 * 60 * 1000

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

  const isValid = verifier.verify(publicKey, signature, 'base64')
  if (!isValid) {
    throw new WebhookSignatureError('Invalid signature')
  }

  return true
}

/**
 * Parse and validate webhook event payload
 */
export function parseWebhookEvent(rawBody: string): WebhookEvent {
  const payload = JSON.parse(rawBody) as unknown
  return WebhookEventSchema.parse(payload)
}

/**
 * Check if event is KYC-related
 */
export function isKycEvent(event: WebhookEvent): boolean {
  return event.event_category === 'kyc_link'
}

/**
 * Check if event is virtual account activity-related
 */
export function isVirtualAccountActivityEvent(event: WebhookEvent): boolean {
  return event.event_category === 'virtual_account.activity'
}

/**
 * Extract KYC status from event
 */
export function extractKycStatusFromEvent(event: WebhookEvent): string | null {
  if (!isKycEvent(event)) return null

  const data = event.event_object as { kyc_status?: string }
  return data.kyc_status ?? null
}

/**
 * Extract TOS status from event
 */
export function extractTosStatusFromEvent(event: WebhookEvent): string | null {
  if (!isKycEvent(event)) return null

  const data = event.event_object as { tos_status?: string }
  return data.tos_status ?? null
}

/**
 * Extract deposit status from event
 */
export function extractDepositStatusFromEvent(event: WebhookEvent): DepositStatus | null {
  if (!isVirtualAccountActivityEvent(event)) return null

  const data = event.event_object as { type?: string }

  switch (data.type) {
    case 'funds_received':
      return 'funds_received'
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
```

---

### Task 3: Add error class to Bridge package

Add to `packages/bridge/src/errors.ts`:

```typescript
export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookSignatureError'
  }
}
```

---

### Task 4: Export webhook utilities from Bridge package

Update `packages/bridge/src/index.ts`:

```typescript
export * from './client'
export * from './types'
export * from './errors'
export * from './webhooks'
```

---

### Task 5: Remove Tilt bridge-webhook service (if added)

If you added Tilt configuration for `bridge-webhook`, remove:

1. Docker build config in `Tiltfile`
2. K8s manifests in `k8s/bridge-webhook/`
3. Port forward configuration

---

### Task 6: Update environment variables

Ensure `.env.local` has:

```env
BRIDGE_WEBHOOK_PUBLIC_KEY="<webhook_public_key_pem>"
```

The Next.js app will use this for signature verification (per-endpoint public key from Bridge).

---

## Webhook Endpoint URL

After migration, configure Bridge dashboard webhook URL:

- **Local dev**: `https://<ngrok-or-tunnel>/api/bridge/webhook`
- **Production**: `https://send.app/api/bridge/webhook`

---

## Testing

### Unit Tests

Test webhook helpers in `packages/bridge/src/__tests__/webhooks.test.ts`:

```typescript
describe('verifyWebhookSignature', () => {
  it('verifies valid signature', () => {
    const body = '{"event_id":"wh_123"}'
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const timestamp = String(Date.now())
    const signedPayload = `${timestamp}.${body}`
    const signature = createSign('RSA-SHA256').update(signedPayload).sign(privateKey, 'base64')
    const header = `t=${timestamp},v0=${signature}`
    const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString()

    expect(() => verifyWebhookSignature(body, header, publicKeyPem)).not.toThrow()
  })

  it('rejects invalid signature', () => {
    const body = '{"event_id":"wh_123"}'
    const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString()
    const header = `t=${Date.now()},v0=invalid`

    expect(() => verifyWebhookSignature(body, header, publicKeyPem))
      .toThrow(WebhookSignatureError)
  })
})

describe('extractKycStatusFromEvent', () => {
  it('extracts approved status', () => {
    expect(
      extractKycStatusFromEvent({
        event_category: 'kyc_link',
        event_object: { kyc_status: 'approved' },
      } as WebhookEvent)
    ).toBe('approved')
  })
})
```

### Integration Tests

Test the API route with mocked signatures in Playwright (use `X-Webhook-Signature` and the `event_*` payload shape).

---

## Checklist

- [x] Create `apps/next/pages/api/bridge/webhook.ts`
- [x] Update webhook event types in `packages/bridge/src/types.ts`
- [x] Update `KycStatus` enum + DB constraints to include `awaiting_questionnaire`/`awaiting_ubo`
- [x] Add webhook helpers to `packages/bridge/src/webhooks.ts`
- [x] Add `WebhookSignatureError` to `packages/bridge/src/errors.ts`
- [x] Export webhook utilities from `packages/bridge/src/index.ts`
- [x] Add `BRIDGE_WEBHOOK_PUBLIC_KEY` to `.env.local`
- [x] Remove any Tilt/K8s config for separate webhook service (N/A - not added)
- [ ] Configure webhook URL in Bridge dashboard (out of scope - deployment/ops task)
- [x] Test webhook signature verification (unit tests)
- [ ] Test KYC status updates via webhook (out of scope - integration test)
- [ ] Test deposit event processing via webhook (out of scope - integration test)
