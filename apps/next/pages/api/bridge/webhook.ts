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
  isTransferEvent,
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

  const kycLinkId = data.id
  const supabase = createSupabaseAdminClient()

  // Fetch current status to determine if this is a new rejection
  const { data: currentCustomer } = await supabase
    .from('bridge_customers')
    .select('kyc_status, rejection_attempts')
    .eq('kyc_link_id', kycLinkId)
    .maybeSingle()

  const updates: Record<string, unknown> = {
    bridge_customer_id: data.customer_id ?? null,
    rejection_reasons: data.rejection_reasons ?? null,
  }

  if (kycStatus) updates.kyc_status = kycStatus
  if (tosStatus) updates.tos_status = tosStatus

  // Increment rejection_attempts on each rejection event
  // Webhook deduplication by event_id prevents double-counting
  if (kycStatus === 'rejected') {
    updates.rejection_attempts = (currentCustomer?.rejection_attempts ?? 0) + 1
    log(
      'incrementing rejection_attempts: kycLinkId=%s newCount=%d',
      kycLinkId,
      updates.rejection_attempts
    )
  }

  log(
    'processing KYC event: kycLinkId=%s kycStatus=%s tosStatus=%s customerId=%s',
    kycLinkId,
    kycStatus,
    tosStatus,
    data.customer_id
  )

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
 * Handle deposit-related webhook events for virtual accounts
 */
async function handleVirtualAccountDepositEvent(event: WebhookEvent): Promise<void> {
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
  // Note: Full event data is stored in bridge_webhook_events for debugging
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
 * Handle deposit-related webhook events for transfers (static templates)
 */
async function handleTransferDepositEvent(event: WebhookEvent): Promise<void> {
  const depositStatus = extractDepositStatusFromEvent(event)
  if (!depositStatus) {
    log('could not extract transfer status from event type: %s', event.event_type)
    return
  }

  const data = event.event_object as {
    id?: string
    state?: string
    on_behalf_of?: string | null
    template_id?: string | null
    currency?: string
    amount?: string
    destination_tx_hash?: string | null
    features?: {
      static_template?: boolean
    }
    source?: {
      payment_rail?: string
      currency?: string
      sender_bank_routing_number?: string
      bank_routing_number?: string
      sender_name?: string
      originator_name?: string
      trace_number?: string
      imad?: string
    }
    receipt?: {
      developer_fee?: string
      exchange_fee?: string
      gas_fee?: string
      final_amount?: string
      destination_tx_hash?: string
    }
  }

  const transferId = data.id ?? null
  if (!transferId) {
    log('missing transfer id in event data, skipping')
    return
  }

  // Ignore events for the static template itself
  if (data.features?.static_template) {
    log('ignoring static template event: transferId=%s state=%s', transferId, data.state)
    return
  }

  const bridgeCustomerId = data.on_behalf_of ?? null
  if (!bridgeCustomerId) {
    log('missing on_behalf_of for transfer event: transferId=%s', transferId)
    return
  }

  const source = data.source ?? {}
  const receipt = data.receipt ?? {}

  const paymentRail = source.payment_rail ?? 'ach_push'
  const senderRoutingNumber =
    source.sender_bank_routing_number ?? source.bank_routing_number ?? null
  const senderName = source.sender_name ?? source.originator_name ?? null
  const traceNumber = source.trace_number ?? source.imad ?? null
  const destinationTxHash = data.destination_tx_hash ?? receipt.destination_tx_hash ?? null

  const feePieces = [receipt.developer_fee, receipt.exchange_fee, receipt.gas_fee].filter(
    (value) => value != null
  )
  const feeAmount = feePieces.length
    ? feePieces.reduce((sum, value) => sum + Number(value), 0)
    : null
  const netAmount = receipt.final_amount ? Number(receipt.final_amount) : null
  const grossAmount = data.amount ?? receipt.final_amount ?? null

  if (!grossAmount) {
    log('missing amount for transfer event: transferId=%s', transferId)
    return
  }

  const currency = data.currency ?? source.currency ?? 'usd'

  log(
    'processing transfer deposit event: transferId=%s status=%s amount=%s',
    transferId,
    depositStatus,
    grossAmount
  )

  const supabase = createSupabaseAdminClient()

  const { data: customer, error: customerError } = await supabase
    .from('bridge_customers')
    .select('id')
    .eq('bridge_customer_id', bridgeCustomerId)
    .single()

  if (customerError || !customer) {
    log(
      'bridge customer not found for transfer: bridgeCustomerId=%s error=%O',
      bridgeCustomerId,
      customerError
    )
    throw customerError ?? new Error('Bridge customer not found')
  }

  let templateRecord: {
    id: string
  } | null = null

  if (data.template_id) {
    const { data: templateById } = await supabase
      .from('bridge_transfer_templates')
      .select('id')
      .eq('bridge_transfer_template_id', data.template_id)
      .maybeSingle()
    templateRecord = templateById ?? null
  }

  if (!templateRecord) {
    const { data: templateByCustomer } = await supabase
      .from('bridge_transfer_templates')
      .select('id')
      .eq('bridge_customer_id', customer.id)
      .eq('status', 'active')
      .maybeSingle()
    templateRecord = templateByCustomer ?? null
  }

  if (!templateRecord) {
    log('transfer template not found: transferId=%s', transferId)
    throw new Error('Transfer template not found')
  }

  const { error: depositError } = await supabase.from('bridge_deposits').upsert(
    {
      bridge_transfer_id: transferId,
      transfer_template_id: templateRecord.id,
      status: depositStatus,
      payment_rail: paymentRail,
      amount: Number(grossAmount),
      currency,
      sender_name: senderName,
      sender_routing_number: senderRoutingNumber,
      trace_number: traceNumber,
      destination_tx_hash: destinationTxHash,
      fee_amount: feeAmount,
      net_amount: netAmount,
      last_event_id: event.event_id,
      last_event_type: event.event_type,
    },
    { onConflict: 'bridge_transfer_id' }
  )

  if (depositError) {
    log('failed to upsert transfer deposit: transferId=%s error=%O', transferId, depositError)
    throw depositError
  }

  log('updated transfer deposit status: transferId=%s status=%s', transferId, depositStatus)
}

/**
 * Handle virtual account lifecycle events (deactivation/reactivation)
 */
async function handleVirtualAccountStatusEvent(
  event: WebhookEvent,
  nextStatus: 'active' | 'inactive'
): Promise<void> {
  const data = event.event_object as { virtual_account_id?: string | null }
  const virtualAccountId = data.virtual_account_id ?? null

  if (!virtualAccountId) {
    log('missing virtual_account_id for virtual account status event: eventId=%s', event.event_id)
    throw new Error('Missing virtual_account_id for virtual account status event')
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('bridge_virtual_accounts')
    .update({ status: nextStatus })
    .eq('bridge_virtual_account_id', virtualAccountId)

  if (error) {
    log(
      'failed to update virtual account status: bridgeVirtualAccountId=%s error=%O',
      virtualAccountId,
      error
    )
    throw error
  }

  log(
    'updated virtual account status: bridgeVirtualAccountId=%s status=%s',
    virtualAccountId,
    nextStatus
  )
}

function getVirtualAccountActivityType(event: WebhookEvent): string | null {
  if (!isVirtualAccountActivityEvent(event)) return null
  const data = event.event_object as { type?: string | null }
  return data.type ?? null
}

/**
 * Route webhook event to appropriate handler
 */
async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  if (isKycEvent(event)) {
    await handleKycEvent(event)
  } else if (isTransferEvent(event)) {
    await handleTransferDepositEvent(event)
  } else if (isVirtualAccountActivityEvent(event)) {
    const activityType = getVirtualAccountActivityType(event)
    if (!activityType) {
      throw new Error('Missing virtual account activity type')
    }

    if (activityType === 'deactivation') {
      await handleVirtualAccountStatusEvent(event, 'inactive')
      return
    }

    if (activityType === 'reactivation') {
      await handleVirtualAccountStatusEvent(event, 'active')
      return
    }

    if (activityType === 'account_update' || activityType === 'microdeposit') {
      log('ignoring non-deposit virtual account activity: type=%s', activityType)
      return
    }

    await handleVirtualAccountDepositEvent(event)
  } else {
    log('unknown event category: %s', event.event_category)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signatureHeader = req.headers['x-webhook-signature'] as string | undefined
  const webhookPublicKey = process.env.BRIDGE_WEBHOOK_PUBLIC_KEY?.replace(/\\n/g, '\n')

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
