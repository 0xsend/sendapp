#!/usr/bin/env bun run
import { createSign, generateKeyPairSync, randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { createSupabaseAdminClient } from '../packages/app/utils/supabase/admin'

type FlowMode = 'kyc' | 'deposit' | 'all'

type BridgeCustomer = {
  id: string
  user_id: string
  kyc_link_id: string
  bridge_customer_id: string | null
  email: string
  kyc_status: string
  tos_status: string
}

type VirtualAccount = {
  id: string
  bridge_virtual_account_id: string
  bridge_customer_id: string
}

const DEFAULT_KYC_STATUSES = ['incomplete', 'under_review', 'approved']
const DEFAULT_DEPOSIT_STATUSES = [
  'funds_received',
  'funds_scheduled',
  'in_review',
  'payment_submitted',
  'payment_processed',
]

const DEFAULT_WEBHOOK_URL = 'http://localhost:3000/api/bridge/webhook'

function printUsage() {
  console.log(`Usage:
  bun run bin/bridge-webhook-events.ts --send-id <sendId> [options]

Options:
  --user-id <uuid>                Supabase auth user id
  --send-id <number>              Send ID (from profiles.send_id)
  --email <email>                 Email used when creating bridge customer
  --flow <kyc|deposit|all>        Which events to send (default: all)
  --kyc-statuses <csv>            Override KYC status sequence
  --deposit-statuses <csv>        Override deposit status sequence
  --amount <number>               Deposit amount (default: 100)
  --currency <code>               Deposit currency (default: usd)
  --webhook-url <url>             Webhook endpoint (default: ${DEFAULT_WEBHOOK_URL})
  --private-key <path|pem>        RSA private key used to sign requests
  --create-customer               Create bridge_customers row if missing
  --create-virtual-account        Create bridge_virtual_accounts row if missing
  --destination-address <0x..>    Destination address for seeded virtual account
  --cleanup                       Delete bridge customer + virtual account + deposit rows
  --cleanup-webhooks              Delete bridge_webhook_events related to this user
  --cleanup-only                  Cleanup and exit without sending events
  --delay-ms <number>             Delay between events (default: 0)
  --dry-run                       Print payloads without sending
  --help                          Show usage

Examples:
  bun run bin/bridge-webhook-events.ts --send-id 1234 --flow kyc --create-customer --email test@example.com
  bun run bin/bridge-webhook-events.ts --user-id <uuid> --flow deposit --create-virtual-account
`)
}

function loadPrivateKey(input?: string | null): string | null {
  if (!input) return null
  if (existsSync(input)) {
    return readFileSync(input, 'utf-8')
  }
  return input.replace(/\\n/g, '\n')
}

function createSignature(body: string, privateKey: string, timestamp: number): string {
  const signedPayload = `${timestamp}.${body}`
  const signature = createSign('RSA-SHA256').update(signedPayload).sign(privateKey, 'base64')
  return `t=${timestamp},v0=${signature}`
}

function parseCsv(input: string | undefined | null): string[] | null {
  if (!input) return null
  const parsed = input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return parsed.length ? parsed : null
}

async function delay(ms: number) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function resolveUserId(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string | undefined,
  sendId: string | undefined
) {
  if (userId) return userId
  if (!sendId) {
    throw new Error('Provide either --user-id or --send-id')
  }

  const numericSendId = Number(sendId)
  if (!Number.isInteger(numericSendId)) {
    throw new Error(`Invalid send_id: ${sendId}`)
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, send_id')
    .eq('send_id', numericSendId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load profile for send_id ${sendId}: ${error.message}`)
  }
  if (!data?.id) {
    throw new Error(`No profile found for send_id ${sendId}`)
  }

  return data.id
}

async function getUserEmail(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    if (error || !data?.user?.email) return null
    return data.user.email
  } catch {
    return null
  }
}

async function getBridgeCustomerForUser(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string
): Promise<BridgeCustomer | null> {
  const { data, error } = await supabase
    .from('bridge_customers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load bridge customer: ${error.message}`)
  }

  return (data as BridgeCustomer | null) ?? null
}

async function deleteWebhookEventsByPayload(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  label: string,
  payload: Record<string, unknown>
) {
  const { error, count } = await supabase
    .from('bridge_webhook_events')
    .delete({ count: 'exact' })
    .contains('payload', payload)

  if (error) {
    throw new Error(`Failed to delete webhook events for ${label}: ${error.message}`)
  }

  if (typeof count === 'number' && count > 0) {
    console.log(`Deleted ${count} webhook event(s) for ${label}`)
  }
}

async function cleanupWebhookEvents(params: {
  supabase: ReturnType<typeof createSupabaseAdminClient>
  kycLinkId?: string | null
  bridgeCustomerId?: string | null
  virtualAccountIds: string[]
  depositIds: string[]
}) {
  const { supabase, kycLinkId, bridgeCustomerId, virtualAccountIds, depositIds } = params

  if (kycLinkId) {
    await deleteWebhookEventsByPayload(supabase, `kyc_link_id ${kycLinkId}`, {
      event_object_id: kycLinkId,
    })
    await deleteWebhookEventsByPayload(supabase, `kyc_link_id ${kycLinkId}`, {
      event_object: { id: kycLinkId },
    })
  }

  if (bridgeCustomerId) {
    await deleteWebhookEventsByPayload(supabase, `bridge_customer_id ${bridgeCustomerId}`, {
      event_object: { customer_id: bridgeCustomerId },
    })
  }

  const uniqueVirtualAccountIds = Array.from(new Set(virtualAccountIds))
  for (const virtualAccountId of uniqueVirtualAccountIds) {
    await deleteWebhookEventsByPayload(supabase, `virtual_account_id ${virtualAccountId}`, {
      event_object_id: virtualAccountId,
    })
    await deleteWebhookEventsByPayload(supabase, `virtual_account_id ${virtualAccountId}`, {
      event_object: { virtual_account_id: virtualAccountId },
    })
  }

  const uniqueDepositIds = Array.from(new Set(depositIds))
  for (const depositId of uniqueDepositIds) {
    await deleteWebhookEventsByPayload(supabase, `deposit_id ${depositId}`, {
      event_object_id: depositId,
    })
    await deleteWebhookEventsByPayload(supabase, `deposit_id ${depositId}`, {
      event_object: { deposit_id: depositId },
    })
    await deleteWebhookEventsByPayload(supabase, `deposit_id ${depositId}`, {
      event_object: { id: depositId },
    })
  }
}

async function cleanupBridgeUser(params: {
  supabase: ReturnType<typeof createSupabaseAdminClient>
  userId: string
  cleanupWebhooks: boolean
}) {
  const { supabase, userId, cleanupWebhooks: shouldCleanupWebhooks } = params
  const bridgeCustomer = await getBridgeCustomerForUser(supabase, userId)

  if (!bridgeCustomer) {
    console.log('No bridge customer found; nothing to clean.')
    return
  }

  const { data: virtualAccounts, error: virtualAccountError } = await supabase
    .from('bridge_virtual_accounts')
    .select('id, bridge_virtual_account_id')
    .eq('bridge_customer_id', bridgeCustomer.id)

  if (virtualAccountError) {
    throw new Error(`Failed to load virtual accounts: ${virtualAccountError.message}`)
  }

  const virtualAccountIds = (virtualAccounts ?? []).map((va) => va.id)
  const virtualAccountBridgeIds = (virtualAccounts ?? []).map((va) => va.bridge_virtual_account_id)

  let depositIds: string[] = []
  if (virtualAccountIds.length > 0) {
    const { data: deposits, error: depositError } = await supabase
      .from('bridge_deposits')
      .select('bridge_transfer_id')
      .in('virtual_account_id', virtualAccountIds)

    if (depositError) {
      throw new Error(`Failed to load deposits: ${depositError.message}`)
    }

    depositIds = (deposits ?? [])
      .map((deposit) => deposit.bridge_transfer_id)
      .filter((depositId): depositId is string => Boolean(depositId))
  }

  if (shouldCleanupWebhooks) {
    await cleanupWebhookEvents({
      supabase,
      kycLinkId: bridgeCustomer.kyc_link_id,
      bridgeCustomerId: bridgeCustomer.bridge_customer_id,
      virtualAccountIds: virtualAccountBridgeIds,
      depositIds,
    })
  }

  const { error: deleteError } = await supabase
    .from('bridge_customers')
    .delete()
    .eq('user_id', userId)

  if (deleteError) {
    throw new Error(`Failed to delete bridge customer: ${deleteError.message}`)
  }

  console.log('Deleted bridge customer and related records.')
}

async function ensureBridgeCustomer(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  options: { create: boolean; email?: string }
): Promise<BridgeCustomer> {
  const { data, error } = await supabase
    .from('bridge_customers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load bridge customer: ${error.message}`)
  }

  if (data) return data as BridgeCustomer
  if (!options.create) {
    throw new Error('No bridge customer found. Re-run with --create-customer and --email')
  }

  const resolvedEmail = options.email ?? (await getUserEmail(supabase, userId))
  if (!resolvedEmail) {
    throw new Error('Email required to create bridge customer. Provide --email')
  }

  const kycLinkId = `kyc_${randomUUID()}`

  const { data: inserted, error: insertError } = await supabase
    .from('bridge_customers')
    .insert({
      user_id: userId,
      kyc_link_id: kycLinkId,
      email: resolvedEmail,
      kyc_status: 'not_started',
      tos_status: 'pending',
      bridge_customer_id: null,
    })
    .select('*')
    .single()

  if (insertError || !inserted) {
    throw new Error(`Failed to create bridge customer: ${insertError?.message ?? 'unknown error'}`)
  }

  return inserted as BridgeCustomer
}

async function ensureVirtualAccount(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  bridgeCustomer: BridgeCustomer,
  options: { create: boolean; destinationAddress?: string }
): Promise<VirtualAccount | null> {
  const { data, error } = await supabase
    .from('bridge_virtual_accounts')
    .select('*')
    .eq('bridge_customer_id', bridgeCustomer.id)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load virtual account: ${error.message}`)
  }

  if (data) return data as VirtualAccount
  if (!options.create) return null

  const virtualAccountId = `va_${randomUUID()}`
  const destinationAddress =
    options.destinationAddress ?? '0x0000000000000000000000000000000000000000'

  const { data: inserted, error: insertError } = await supabase
    .from('bridge_virtual_accounts')
    .insert({
      bridge_customer_id: bridgeCustomer.id,
      bridge_virtual_account_id: virtualAccountId,
      destination_address: destinationAddress,
      source_currency: 'usd',
      destination_currency: 'usdc',
      destination_payment_rail: 'base',
      status: 'active',
      source_deposit_instructions: {
        currency: 'usd',
        bank_name: 'Bridge Sandbox Bank',
        bank_routing_number: '021000021',
        bank_account_number: '9876543210',
        bank_beneficiary_name: 'Send Test User',
        bank_beneficiary_address: 'New York, NY',
        payment_rails: ['ach_push', 'wire'],
      },
    })
    .select('*')
    .single()

  if (insertError || !inserted) {
    throw new Error(
      `Failed to create bridge virtual account: ${insertError?.message ?? 'unknown error'}`
    )
  }

  return inserted as VirtualAccount
}

function buildKycEvent(params: {
  kycLinkId: string
  customerId: string
  kycStatus: string
  tosStatus: string
  rejectionReasons?: Array<Record<string, unknown>> | string[]
}) {
  return {
    api_version: '2024-01-01',
    event_id: `evt_${randomUUID()}`,
    event_category: 'kyc_link',
    event_type: `kyc_link.kyc_status.${params.kycStatus}`,
    event_object_id: params.kycLinkId,
    event_object_status: params.kycStatus,
    event_object: {
      id: params.kycLinkId,
      customer_id: params.customerId,
      kyc_status: params.kycStatus,
      tos_status: params.tosStatus,
      rejection_reasons: params.rejectionReasons ?? null,
    },
    event_created_at: new Date().toISOString(),
  }
}

function buildDepositEvent(params: {
  depositId: string
  virtualAccountId: string
  status: string
  amount: string
  currency: string
}) {
  return {
    api_version: '2024-01-01',
    event_id: `evt_${randomUUID()}`,
    event_category: 'virtual_account.activity',
    event_type: `virtual_account.${params.status}`,
    event_object_id: params.depositId,
    event_object: {
      type: params.status,
      id: params.depositId,
      deposit_id: params.depositId,
      virtual_account_id: params.virtualAccountId,
      currency: params.currency,
      amount: params.amount,
      subtotal_amount: params.amount,
      source: {
        payment_rail: 'ach_push',
        sender_bank_routing_number: '111000025',
        sender_name: 'Test Sender',
        trace_number: 'trace_test_123',
      },
      receipt: {
        final_amount: params.amount,
        destination_tx_hash: null,
      },
    },
    event_created_at: new Date().toISOString(),
  }
}

async function sendWebhookEvent(params: {
  event: Record<string, unknown>
  webhookUrl: string
  privateKey: string | null
  dryRun: boolean
}) {
  const body = JSON.stringify(params.event)
  if (params.dryRun) {
    console.log(body)
    return
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (params.privateKey) {
    const timestamp = Date.now()
    headers['X-Webhook-Signature'] = createSignature(body, params.privateKey, timestamp)
  }

  const response = await fetch(params.webhookUrl, {
    method: 'POST',
    headers,
    body,
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Webhook request failed (${response.status}): ${text}`)
  }

  if (text) {
    console.log(text)
  }
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      userId: { type: 'string' },
      sendId: { type: 'string' },
      email: { type: 'string' },
      flow: { type: 'string' },
      kycStatuses: { type: 'string' },
      depositStatuses: { type: 'string' },
      amount: { type: 'string' },
      currency: { type: 'string' },
      webhookUrl: { type: 'string' },
      privateKey: { type: 'string' },
      createCustomer: { type: 'boolean' },
      createVirtualAccount: { type: 'boolean' },
      destinationAddress: { type: 'string' },
      cleanup: { type: 'boolean' },
      cleanupWebhooks: { type: 'boolean' },
      cleanupOnly: { type: 'boolean' },
      delayMs: { type: 'string' },
      dryRun: { type: 'boolean' },
      help: { type: 'boolean' },
    },
    allowPositionals: true,
  })

  if (values.help) {
    printUsage()
    return
  }

  const flow = (values.flow ?? 'all') as FlowMode
  if (!['kyc', 'deposit', 'all'].includes(flow)) {
    throw new Error(`Invalid --flow value: ${values.flow}`)
  }

  const supabase = createSupabaseAdminClient()
  const userId = await resolveUserId(supabase, values.userId, values.sendId)

  if (values.cleanup || values.cleanupOnly) {
    await cleanupBridgeUser({
      supabase,
      userId,
      cleanupWebhooks: Boolean(values.cleanupWebhooks),
    })
  }

  if (values.cleanupOnly) {
    return
  }

  const bridgeCustomer = await ensureBridgeCustomer(supabase, userId, {
    create: Boolean(values.createCustomer),
    email: values.email,
  })

  const privateKey =
    loadPrivateKey(values.privateKey ?? process.env.BRIDGE_WEBHOOK_PRIVATE_KEY) ??
    (process.env.BRIDGE_WEBHOOK_PUBLIC_KEY
      ? null
      : (() => {
          const { privateKey: generatedPrivate, publicKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
          })
          const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString()
          console.log('Generated key pair for webhook signing.')
          console.log('Set BRIDGE_WEBHOOK_PUBLIC_KEY to:\n')
          console.log(publicKeyPem)
          return generatedPrivate.export({ type: 'pkcs1', format: 'pem' }).toString()
        })())

  if (!privateKey && !values.dryRun) {
    throw new Error(
      'Missing private key for webhook signing. Provide --private-key or set BRIDGE_WEBHOOK_PRIVATE_KEY.'
    )
  }

  const webhookUrl = values.webhookUrl ?? DEFAULT_WEBHOOK_URL
  const delayMs = Number(values.delayMs ?? '0')
  const amount = String(values.amount ?? '100')
  const currency = String(values.currency ?? 'usd')

  const kycStatuses = parseCsv(values.kycStatuses) ?? DEFAULT_KYC_STATUSES
  const depositStatuses = parseCsv(values.depositStatuses) ?? DEFAULT_DEPOSIT_STATUSES

  const events: Record<string, unknown>[] = []

  if (flow === 'kyc' || flow === 'all') {
    const customerId = bridgeCustomer.bridge_customer_id ?? `cust_${randomUUID()}`
    for (const status of kycStatuses) {
      const tosStatus = status === 'approved' ? 'approved' : 'pending'
      const rejectionReasons =
        status === 'rejected'
          ? [{ reason: 'document_invalid', developer_reason: 'Test rejection' }]
          : undefined
      events.push(
        buildKycEvent({
          kycLinkId: bridgeCustomer.kyc_link_id,
          customerId,
          kycStatus: status,
          tosStatus,
          rejectionReasons,
        })
      )
    }
  }

  let virtualAccount: VirtualAccount | null = null
  if (flow === 'deposit' || flow === 'all') {
    virtualAccount = await ensureVirtualAccount(supabase, bridgeCustomer, {
      create: Boolean(values.createVirtualAccount),
      destinationAddress: values.destinationAddress,
    })

    if (!virtualAccount) {
      throw new Error('No virtual account found. Re-run with --create-virtual-account')
    }

    const depositId = `dep_${randomUUID()}`
    for (const status of depositStatuses) {
      events.push(
        buildDepositEvent({
          depositId,
          virtualAccountId: virtualAccount.bridge_virtual_account_id,
          status,
          amount,
          currency,
        })
      )
    }
  }

  for (const event of events) {
    await sendWebhookEvent({
      event,
      webhookUrl,
      privateKey,
      dryRun: Boolean(values.dryRun),
    })
    await delay(delayMs)
  }

  console.log(`Sent ${events.length} event(s) for user ${userId}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  printUsage()
  process.exit(1)
})
