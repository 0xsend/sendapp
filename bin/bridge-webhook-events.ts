#!/usr/bin/env bun run
import { createSign, generateKeyPairSync, randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { createSupabaseAdminClient } from '../packages/app/utils/supabase/admin'

type FlowMode = 'kyc' | 'deposit' | 'all'

type RejectionReason = {
  developer_reason: string
  reason: string
}

/**
 * All Bridge KYC rejection reasons from:
 * https://apidocs.bridge.xyz/platform/customers/customers/rejection_reasons
 */
const BRIDGE_REJECTION_REASONS: RejectionReason[] = [
  {
    developer_reason: 'ID cannot be verified against third-party databases',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Inconsistent or incomplete information',
    reason: 'Inconsistent or incomplete information',
  },
  {
    developer_reason: 'Cannot validate user age',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Missing or incomplete barcode on the ID',
    reason: 'Cannot validate ID — upload clear photo',
  },
  {
    developer_reason: 'Inconsistent information in barcode',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Submission is blurry',
    reason: 'Cannot validate ID - upload clear photo',
  },
  {
    developer_reason: 'Inconsistent ID format',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Compromised ID detected',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'ID from disallowed country',
    reason: 'Cannot accept provided ID',
  },
  {
    developer_reason: 'Incorrect ID type selected',
    reason: 'Incorrect ID type selected',
  },
  {
    developer_reason: 'Same side submitted as both front and back',
    reason: 'Same side submitted as both front and back',
  },
  {
    developer_reason: 'Electronic replica detected',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'No government ID found in submission',
    reason: 'No government ID found in submission',
  },
  {
    developer_reason: 'ID is expired',
    reason: 'ID is expired',
  },
  {
    developer_reason: 'Missing required ID details',
    reason: 'Cannot validate ID — upload clear photo',
  },
  {
    developer_reason: 'Inconsistent details in extraction',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Likely fabrication detected',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Glare detected in submission',
    reason: 'Cannot validate ID — upload clear photo',
  },
  {
    developer_reason: 'Identity cannot be verified',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Inconsistent details with previous submission',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Inconsistent details between submissions',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Machine readable zone not detected',
    reason: 'Cannot validate ID — upload clear photo',
  },
  {
    developer_reason: 'Inconsistent machine readable zone',
    reason: 'Cannot validate ID — upload clear photo',
  },
  {
    developer_reason: 'ID number format inconsistency',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Paper copy detected',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'PO box address detected',
    reason: 'PO box address detected',
  },
  {
    developer_reason: 'Blurry face portrait',
    reason: 'Cannot validate ID — upload clear photo',
  },
  {
    developer_reason: 'No face portrait found',
    reason: 'Cannot validate ID — upload clear photo',
  },
  {
    developer_reason: 'Face portrait matches public figure',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Not a U.S. REAL ID',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'ID details and face match previous submission',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Different faces in ID and selfie',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Tampering detected',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Submission cannot be processed',
    reason: 'Submission cannot be processed',
  },
  {
    developer_reason: 'Dates on ID are invalid',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Identity cannot be verified against third-party databases',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Person is deceased',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Document could not be verified',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Unsupported country',
    reason: 'Your region is not supported',
  },
  {
    developer_reason: 'No government ID detected',
    reason: 'Cannot validate ID — upload clear photo',
  },
  {
    developer_reason: 'No database check was performed',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Prohibited state/province',
    reason: 'Your region is not supported',
  },
  {
    developer_reason: 'Prohibited country',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Potential elder abuse',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Potential PEP',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Customer information could not be verified',
    reason: 'Your information could not be verified',
  },
  {
    developer_reason: 'Unsupported state/province',
    reason: 'Your region is not supported',
  },
  {
    developer_reason: 'Missing or invalid proof of address',
    reason: 'Missing or invalid proof of address',
  },
]

/**
 * Returns a random subset of rejection reasons (1-3 reasons)
 */
function getRandomRejectionReasons(): RejectionReason[] {
  const count = Math.floor(Math.random() * 3) + 1 // 1-3 reasons
  const shuffled = [...BRIDGE_REJECTION_REASONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

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
  --create-customer               Create bridge_customers row if missing
  --create-virtual-account        Create bridge_virtual_accounts row if missing
  --destination-address <0x..>    Destination address for seeded virtual account
  --cleanup                       Delete bridge customer + virtual account + deposit rows
  --cleanup-webhooks              Delete bridge_webhook_events related to this user
  --cleanup-only                  Cleanup and exit without sending events
  --interactive                   Guided prompt for local testing
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

async function printBridgeStatus(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string
) {
  const bridgeCustomer = await getBridgeCustomerForUser(supabase, userId)
  console.log('')
  console.log('Current status:')

  if (!bridgeCustomer) {
    console.log('- bridge_customers: none')
    return
  }

  console.log(
    `- bridge_customers: kyc_status=${bridgeCustomer.kyc_status} tos_status=${bridgeCustomer.tos_status} kyc_link_id=${bridgeCustomer.kyc_link_id}`
  )

  const { data: virtualAccounts } = await supabase
    .from('bridge_virtual_accounts')
    .select('id, bridge_virtual_account_id, status, created_at')
    .eq('bridge_customer_id', bridgeCustomer.id)

  if (!virtualAccounts?.length) {
    console.log('- bridge_virtual_accounts: none')
  } else {
    console.log(`- bridge_virtual_accounts: ${virtualAccounts.length}`)
    for (const account of virtualAccounts) {
      console.log(
        `  - id=${account.bridge_virtual_account_id} status=${account.status} created_at=${account.created_at}`
      )
    }
  }

  if (virtualAccounts?.length) {
    const { data: deposits } = await supabase
      .from('bridge_deposits')
      .select('bridge_transfer_id, status, amount, currency, created_at')
      .in(
        'virtual_account_id',
        virtualAccounts.map((account) => account.id)
      )

    if (!deposits?.length) {
      console.log('- bridge_deposits: none')
    } else {
      console.log(`- bridge_deposits: ${deposits.length}`)
      for (const deposit of deposits) {
        console.log(
          `  - id=${deposit.bridge_transfer_id} status=${deposit.status} amount=${deposit.amount} ${deposit.currency} created_at=${deposit.created_at}`
        )
      }
    }
  }
}

async function promptInteractive() {
  const rl = createInterface({ input, output })
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/bridge/webhook`

    const sendId = (await rl.question('Send ID: ')).trim()
    if (!sendId) {
      console.log('Send ID is required.')
      return
    }

    const supabase = createSupabaseAdminClient()
    const userId = await resolveUserId(supabase, undefined, sendId)

    const privateKey =
      loadPrivateKey(process.env.BRIDGE_WEBHOOK_PRIVATE_KEY_TESTING_ONLY) ??
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

    if (!privateKey) {
      console.log('Missing BRIDGE_WEBHOOK_PRIVATE_KEY_TESTING_ONLY.')
      return
    }

    while (true) {
      await printBridgeStatus(supabase, userId)
      console.log('')
      console.log('Choose an action:')
      console.log('1) Create bridge customer (if missing)')
      console.log('2) Send KYC status event')
      console.log('3) Create virtual account (if missing)')
      console.log('4) Send deposit status sequence')
      console.log('5) Cleanup bridge data (customer + accounts + deposits)')
      console.log('6) Cleanup bridge data + webhook events')
      console.log('7) Exit')

      const choice = (await rl.question('Select 1-7: ')).trim()
      if (choice === '7') break

      if (choice === '1') {
        const email = (await rl.question('Email (required if missing): ')).trim() || undefined
        await ensureBridgeCustomer(supabase, userId, { create: true, email })
        console.log('Bridge customer ensured.')
        continue
      }

      if (choice === '2') {
        const status = (await rl.question('KYC status (e.g. approved, incomplete): ')).trim()
        if (!status) {
          console.log('KYC status required.')
          continue
        }
        const bridgeCustomer = await ensureBridgeCustomer(supabase, userId, {
          create: false,
        })
        const customerId = bridgeCustomer.bridge_customer_id ?? `cust_${randomUUID()}`
        const tosStatus = status === 'approved' ? 'approved' : 'pending'
        const event = buildKycEvent({
          kycLinkId: bridgeCustomer.kyc_link_id,
          customerId,
          kycStatus: status,
          tosStatus,
        })
        try {
          await sendWebhookEvent({ event, webhookUrl, privateKey, dryRun: false })
        } catch (error) {
          console.log(
            `Failed to send webhook. Ensure the handler is running at ${webhookUrl} and reachable.`
          )
          throw error
        }
        console.log('Sent KYC webhook event.')
        continue
      }

      if (choice === '3') {
        const destinationAddress = (
          await rl.question('Destination address (0x.. or blank): ')
        ).trim()
        await ensureVirtualAccount(
          supabase,
          await ensureBridgeCustomer(supabase, userId, {
            create: false,
          }),
          {
            create: true,
            destinationAddress: destinationAddress || undefined,
          }
        )
        console.log('Virtual account ensured.')
        continue
      }

      if (choice === '4') {
        const depositStatuses = DEFAULT_DEPOSIT_STATUSES
        const bridgeCustomer = await ensureBridgeCustomer(supabase, userId, { create: false })
        const virtualAccount = await ensureVirtualAccount(supabase, bridgeCustomer, {
          create: false,
        })
        if (!virtualAccount) {
          console.log('No virtual account found. Create one first.')
          continue
        }
        const depositId = `dep_${randomUUID()}`
        for (const status of depositStatuses) {
          const event = buildDepositEvent({
            depositId,
            virtualAccountId: virtualAccount.bridge_virtual_account_id,
            status,
            amount: '100',
            currency: 'usd',
          })
          try {
            await sendWebhookEvent({ event, webhookUrl, privateKey, dryRun: false })
          } catch (error) {
            console.log(
              `Failed to send webhook. Ensure the handler is running at ${webhookUrl} and reachable.`
            )
            throw error
          }
        }
        console.log('Sent deposit status sequence.')
        continue
      }

      if (choice === '5') {
        await cleanupBridgeUser({ supabase, userId, cleanupWebhooks: false })
        continue
      }

      if (choice === '6') {
        await cleanupBridgeUser({ supabase, userId, cleanupWebhooks: true })
        continue
      }

      console.log('Unknown selection.')
    }
  } finally {
    rl.close()
  }
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
  rejectionReasons?: RejectionReason[]
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
      createCustomer: { type: 'boolean' },
      createVirtualAccount: { type: 'boolean' },
      destinationAddress: { type: 'string' },
      cleanup: { type: 'boolean' },
      cleanupWebhooks: { type: 'boolean' },
      cleanupOnly: { type: 'boolean' },
      interactive: { type: 'boolean' },
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

  if (values.interactive) {
    await promptInteractive()
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
    loadPrivateKey(process.env.BRIDGE_WEBHOOK_PRIVATE_KEY_TESTING_ONLY) ??
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
      'Missing private key for webhook signing. Set BRIDGE_WEBHOOK_PRIVATE_KEY_TESTING_ONLY.'
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
      const rejectionReasons = status === 'rejected' ? getRandomRejectionReasons() : undefined
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
