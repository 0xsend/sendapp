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
import debug from 'debug'

const log = debug('api:bridge:webhook')

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
    rejection_reasons?: Array<Record<string, unknown>> | string[] | null
  }

  if (!kycStatus && !tosStatus) {
    log('no status to update from KYC event')
    return
  }

  const updates: Record<string, unknown> = {
    bridge_customer_id: data.customer_id ?? null,
    rejection_reasons: data.rejection_reasons ?? null,
  }

  if (kycStatus) updates.kyc_status = kycStatus
  if (tosStatus) updates.tos_status = tosStatus

  const kycLinkId = data.id
  log(
    'processing KYC event: kycLinkId=%s kycStatus=%s tosStatus=%s customerId=%s',
    kycLinkId,
    kycStatus,
    tosStatus,
    data.customer_id
  )

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('bridge_customers')
    .update(updates)
    .eq('kyc_link_id', kycLinkId)

  if (error) {
    log('failed to update bridge customer: %O', error)
    throw error
  }

  log(
    'updated bridge customer: kycLinkId=%s kycStatus=%s tosStatus=%s',
    kycLinkId,
    kycStatus,
    tosStatus
  )
}

/**
 * Handle deposit-related webhook events
 */
async function handleDepositEvent(event: WebhookEvent): Promise<void> {
  const depositStatus = extractDepositStatusFromEvent(event)
  if (!depositStatus) {
    log('could not extract deposit status from event type: %s', event.event_type)
    return
  }

  const data = event.event_object as {
    id: string
    deposit_id?: string | null
    virtual_account_id: string
    type: string
    amount: string
    currency: string
    subtotal_amount?: string
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
  if (!depositId) {
    log('no deposit_id in event data, skipping')
    return
  }

  const source = data.source ?? {}
  const receipt = data.receipt ?? {}

  // Default to 'ach_push' as it's the most common rail for USD deposits
  // DB constraint only allows 'ach_push' or 'wire'
  const paymentRail = source.payment_rail ?? 'ach_push'
  const senderRoutingNumber =
    source.sender_bank_routing_number ?? source.bank_routing_number ?? null
  const senderName = source.sender_name ?? source.originator_name ?? null
  const traceNumber = source.trace_number ?? source.imad ?? null
  const destinationTxHash = data.destination_tx_hash ?? receipt.destination_tx_hash ?? null

  const feePieces = [
    receipt.developer_fee ?? data.developer_fee_amount,
    receipt.exchange_fee ?? data.exchange_fee_amount,
    receipt.gas_fee ?? data.gas_fee,
  ].filter((value) => value != null)
  const feeAmount = feePieces.length
    ? feePieces.reduce((sum, value) => sum + Number(value), 0)
    : null
  const netAmount = receipt.final_amount ? Number(receipt.final_amount) : null
  const grossAmount = data.subtotal_amount ?? data.amount

  log(
    'processing deposit event: depositId=%s status=%s amount=%s',
    depositId,
    depositStatus,
    grossAmount
  )

  const supabase = createSupabaseAdminClient()

  // Look up the virtual account by bridge_virtual_account_id
  const { data: virtualAccount, error: vaError } = await supabase
    .from('bridge_virtual_accounts')
    .select('id')
    .eq('bridge_virtual_account_id', data.virtual_account_id)
    .single()

  if (vaError || !virtualAccount) {
    log(
      'virtual account not found: bridgeVirtualAccountId=%s error=%O',
      data.virtual_account_id,
      vaError
    )
    throw vaError ?? new Error('Virtual account not found')
  }

  // Upsert the deposit record
  const { error: depositError } = await supabase.from('bridge_deposits').upsert(
    {
      bridge_transfer_id: depositId,
      virtual_account_id: virtualAccount.id,
      status: depositStatus,
      payment_rail: paymentRail,
      amount: Number(grossAmount),
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

  if (depositError) {
    log('failed to upsert deposit: depositId=%s error=%O', depositId, depositError)
    throw depositError
  }

  log('updated deposit status: depositId=%s status=%s', depositId, depositStatus)
}

/**
 * Route webhook event to appropriate handler
 */
async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  if (isKycEvent(event)) {
    await handleKycEvent(event)
  } else if (isVirtualAccountActivityEvent(event)) {
    await handleDepositEvent(event)
  } else {
    log('unknown event category: %s', event.event_category)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signatureHeader = req.headers['x-webhook-signature'] as string | undefined
  const webhookPublicKey = process.env.BRIDGE_WEBHOOK_PUBLIC_KEY

  if (!webhookPublicKey) {
    log('BRIDGE_WEBHOOK_PUBLIC_KEY is not set')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  let rawBody: string
  try {
    rawBody = await getRawBody(req)
  } catch (err) {
    log('failed to read request body: %O', err)
    return res.status(400).json({ error: 'Failed to read request body' })
  }

  // Verify signature
  try {
    verifyWebhookSignature(rawBody, signatureHeader ?? '', webhookPublicKey)
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      log('webhook signature verification failed: %s', err.message)
      return res.status(400).json({ error: 'Invalid signature' })
    }
    throw err
  }

  // Parse the event
  let event: WebhookEvent
  try {
    event = parseWebhookEvent(rawBody)
  } catch (err) {
    log('failed to parse webhook event: %O', err)
    return res.status(400).json({ error: 'Invalid event payload' })
  }

  log('received webhook event: eventId=%s eventType=%s', event.event_id, event.event_type)

  const supabase = createSupabaseAdminClient()

  // Check for duplicate event (idempotency)
  const { data: existingEvent } = await supabase
    .from('bridge_webhook_events')
    .select('id')
    .eq('bridge_event_id', event.event_id)
    .maybeSingle()

  if (existingEvent) {
    log('duplicate event, skipping: eventId=%s', event.event_id)
    return res.status(200).json({ received: true, duplicate: true })
  }

  // Store the event with full raw payload for debugging
  const { error: insertError } = await supabase.from('bridge_webhook_events').insert({
    bridge_event_id: event.event_id,
    event_type: event.event_type,
    event_created_at: event.event_created_at,
    payload: JSON.parse(rawBody),
  })

  if (insertError) {
    // Check if it's a duplicate key error (race condition)
    if (insertError.code === '23505') {
      log('duplicate event (race condition), skipping: eventId=%s', event.event_id)
      return res.status(200).json({ received: true, duplicate: true })
    }
    log('failed to store webhook event: %O', insertError)
    return res.status(500).json({ error: 'Failed to store event' })
  }

  // Process the event
  try {
    await handleWebhookEvent(event)

    // Mark as processed
    await supabase
      .from('bridge_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('bridge_event_id', event.event_id)

    return res.status(200).json({ received: true, processed: true })
  } catch (err) {
    log('failed to process webhook event: eventId=%s error=%O', event.event_id, err)

    // Store error
    await supabase
      .from('bridge_webhook_events')
      .update({ error: String(err) })
      .eq('bridge_event_id', event.event_id)

    return res.status(500).json({ error: 'Failed to process event' })
  }
}
