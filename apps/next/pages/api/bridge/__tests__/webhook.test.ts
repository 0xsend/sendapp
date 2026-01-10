/** @jest-environment node */
import { Readable } from 'node:stream'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../webhook'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { verifyWebhookSignature, WebhookSignatureError } from '@my/bridge'

jest.mock('app/utils/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}))

jest.mock('@my/bridge', () => {
  class WebhookSignatureError extends Error {}

  const isKycEvent = (event: { event_category?: string }) => event.event_category === 'kyc_link'
  const isVirtualAccountActivityEvent = (event: { event_category?: string }) =>
    event.event_category === 'virtual_account.activity'
  const isTransferEvent = (event: { event_category?: string }) =>
    event.event_category === 'transfer'
  const isStaticMemoActivityEvent = (event: { event_category?: string }) =>
    event.event_category === 'static_memo.activity'

  const extractKycStatusFromEvent = (event: { event_object?: { kyc_status?: string } }) =>
    isKycEvent(event) ? (event.event_object?.kyc_status ?? null) : null
  const extractTosStatusFromEvent = (event: { event_object?: { tos_status?: string } }) =>
    isKycEvent(event) ? (event.event_object?.tos_status ?? null) : null

  const extractDepositStatusFromEvent = (event: {
    event_object?: { type?: string; state?: string }
  }) => {
    if (isTransferEvent(event)) {
      switch (event.event_object?.state) {
        case 'funds_received':
          return 'funds_received'
        case 'payment_processed':
          return 'payment_processed'
        default:
          return null
      }
    }
    if (isVirtualAccountActivityEvent(event)) {
      switch (event.event_object?.type) {
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
    if (isStaticMemoActivityEvent(event)) {
      switch (event.event_object?.type) {
        case 'funds_received':
          return 'funds_received'
        case 'payment_processed':
          return 'payment_processed'
        default:
          return null
      }
    }
  }

  return {
    WebhookSignatureError,
    verifyWebhookSignature: jest.fn(),
    parseWebhookEvent: (rawBody: string) => JSON.parse(rawBody),
    extractKycStatusFromEvent,
    extractTosStatusFromEvent,
    extractDepositStatusFromEvent,
    isKycEvent,
    isStaticMemoActivityEvent,
    isVirtualAccountActivityEvent,
    isTransferEvent,
  }
})

type SupabaseTableMocks = {
  bridge_webhook_events: {
    select: jest.Mock
    insert: jest.Mock
    update: jest.Mock
  }
  bridge_customers: {
    update: jest.Mock
    select: jest.Mock
  }
  bridge_virtual_accounts: {
    select: jest.Mock
    update: jest.Mock
  }
  bridge_static_memos: {
    select: jest.Mock
  }
  bridge_transfer_templates: {
    select: jest.Mock
  }
  bridge_deposits: {
    upsert: jest.Mock
  }
}

function createSupabaseMock(options?: {
  existingEvent?: { id: string } | null
  virtualAccount?: { id: string } | null
  staticMemo?: { id: string } | null
  transferTemplate?: { id: string } | null
  bridgeCustomer?: { id: string } | null
  insertError?: { code?: string } | null
  virtualAccountError?: { message?: string } | null
}) {
  const webhookEventsSelectEq = jest.fn().mockReturnValue({
    maybeSingle: jest.fn().mockResolvedValue({ data: options?.existingEvent ?? null }),
  })
  const webhookEventsUpdateEq = jest.fn().mockResolvedValue({ error: null })
  const webhookEvents = {
    select: jest.fn().mockReturnValue({ eq: webhookEventsSelectEq }),
    insert: jest.fn().mockResolvedValue({ error: options?.insertError ?? null }),
    update: jest.fn().mockReturnValue({ eq: webhookEventsUpdateEq }),
  }

  const bridgeCustomersSelectEq = jest.fn().mockReturnValue({
    single: jest
      .fn()
      .mockResolvedValue({ data: options?.bridgeCustomer ?? { id: 'bc_local' }, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: options?.bridgeCustomer ?? { id: 'bc_local' },
      error: null,
    }),
  })
  const bridgeCustomersUpdateEq = jest.fn().mockResolvedValue({ error: null })
  const bridgeCustomers = {
    update: jest.fn().mockReturnValue({ eq: bridgeCustomersUpdateEq }),
    select: jest.fn().mockReturnValue({ eq: bridgeCustomersSelectEq }),
  }

  const virtualAccountSelectEq = jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({
      data: options?.virtualAccount ?? { id: 'va_local' },
      error: options?.virtualAccountError ?? null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: options?.virtualAccount ?? { id: 'va_local' },
      error: options?.virtualAccountError ?? null,
    }),
  })
  const virtualAccountUpdateEq = jest.fn().mockResolvedValue({ error: null })
  const bridgeVirtualAccounts = {
    select: jest.fn().mockReturnValue({ eq: virtualAccountSelectEq }),
    update: jest.fn().mockReturnValue({ eq: virtualAccountUpdateEq }),
  }

  const staticMemoSelectEq = jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({
      data: options?.staticMemo ?? { id: 'sm_local' },
      error: null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: options?.staticMemo ?? { id: 'sm_local' },
      error: null,
    }),
  })
  const bridgeStaticMemos = {
    select: jest.fn().mockReturnValue({ eq: staticMemoSelectEq }),
  }

  const transferTemplateSelectEq = jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({
      data: options?.transferTemplate ?? { id: 'tmpl_local' },
      error: null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: options?.transferTemplate ?? { id: 'tmpl_local' },
      error: null,
    }),
  })
  const bridgeTransferTemplates = {
    select: jest.fn().mockReturnValue({ eq: transferTemplateSelectEq }),
  }

  const bridgeDeposits = {
    upsert: jest.fn().mockResolvedValue({ error: null }),
  }

  const tables: SupabaseTableMocks = {
    bridge_webhook_events: webhookEvents,
    bridge_customers: bridgeCustomers,
    bridge_virtual_accounts: bridgeVirtualAccounts,
    bridge_static_memos: bridgeStaticMemos,
    bridge_transfer_templates: bridgeTransferTemplates,
    bridge_deposits: bridgeDeposits,
  }

  const from = jest.fn((table: keyof SupabaseTableMocks) => {
    const target = tables[table]
    if (!target) {
      throw new Error(`Unexpected table: ${table}`)
    }
    return target
  })

  return {
    supabase: { from },
    tables,
    fns: {
      webhookEventsSelectEq,
      webhookEventsUpdateEq,
      bridgeCustomersUpdateEq,
      bridgeCustomersSelectEq,
      virtualAccountSelectEq,
      virtualAccountUpdateEq,
      staticMemoSelectEq,
      transferTemplateSelectEq,
    },
  }
}

function createMockReq(body: string, headers: Record<string, string> = {}): NextApiRequest {
  const req = new Readable() as NextApiRequest
  req.method = 'POST'
  req.headers = headers
  req.push(body)
  req.push(null)
  return req
}

function createMockRes(): NextApiResponse & { statusCode: number; body?: unknown } {
  const res: NextApiResponse & { statusCode: number; body?: unknown } = {
    statusCode: 200,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(payload: unknown) {
      res.body = payload
      return res
    },
  } as NextApiResponse & { statusCode: number; body?: unknown }

  return res
}

beforeEach(() => {
  jest.resetAllMocks()
  process.env.BRIDGE_WEBHOOK_PUBLIC_KEY = 'test_public_key'
})

afterEach(() => {
  process.env.BRIDGE_WEBHOOK_PUBLIC_KEY = undefined
})

describe('Bridge webhook handler', () => {
  it('stores event and upserts deposit for funds_received', async () => {
    const { supabase, tables } = createSupabaseMock()
    ;(createSupabaseAdminClient as jest.Mock).mockReturnValue(supabase)
    ;(verifyWebhookSignature as jest.Mock).mockReturnValue(true)

    const rawBody = JSON.stringify({
      api_version: '2024-01-01',
      event_id: 'evt_1',
      event_category: 'transfer',
      event_type: 'updated.status_transitioned',
      event_object_id: 'tr_1',
      event_object: {
        state: 'funds_received',
        id: 'tr_1',
        on_behalf_of: 'cus_1',
        template_id: 'tmpl_1',
        currency: 'usd',
        amount: '100',
        source: {
          payment_rail: 'ach_push',
          sender_bank_routing_number: '111000025',
          sender_name: 'Alice',
          trace_number: 'trace_123',
        },
      },
      event_created_at: '2024-01-01T00:00:00Z',
    })

    const req = createMockReq(rawBody, { 'x-webhook-signature': 't=1,v0=abc' })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, processed: true })
    expect(tables.bridge_webhook_events.insert).toHaveBeenCalled()
    expect(tables.bridge_deposits.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        bridge_transfer_id: 'tr_1',
        transfer_template_id: 'tmpl_local',
        status: 'funds_received',
        payment_rail: 'ach_push',
        amount: 100,
        currency: 'usd',
        sender_name: 'Alice',
        sender_routing_number: '111000025',
        trace_number: 'trace_123',
      }),
      { onConflict: 'bridge_transfer_id' }
    )
  })

  it('stores event and upserts deposit for static memo funds_received', async () => {
    const { supabase, tables } = createSupabaseMock()
    ;(createSupabaseAdminClient as jest.Mock).mockReturnValue(supabase)
    ;(verifyWebhookSignature as jest.Mock).mockReturnValue(true)

    const rawBody = JSON.stringify({
      api_version: '2024-01-01',
      event_id: 'evt_sm_1',
      event_category: 'static_memo.activity',
      event_type: 'static_memo.activity.updated',
      event_object_id: 'sm_1',
      event_object: {
        type: 'funds_received',
        static_memo_id: 'sm_1',
        deposit_id: 'dep_1',
        currency: 'usd',
        amount: '250',
        source: {
          payment_rail: 'wire',
          bank_routing_number: '011000015',
          bank_beneficiary_name: 'ACME Corp',
          imad: 'imad_123',
        },
      },
      event_created_at: '2024-01-01T00:00:00Z',
    })

    const req = createMockReq(rawBody, { 'x-webhook-signature': 't=1,v0=abc' })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, processed: true })
    expect(tables.bridge_webhook_events.insert).toHaveBeenCalled()
    expect(tables.bridge_deposits.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        bridge_transfer_id: 'dep_1',
        static_memo_id: 'sm_local',
        status: 'funds_received',
        payment_rail: 'wire',
        amount: 250,
        currency: 'usd',
        sender_name: 'ACME Corp',
        sender_routing_number: '011000015',
        trace_number: 'imad_123',
      }),
      { onConflict: 'bridge_transfer_id' }
    )
  })

  it('updates virtual account status on deactivation events', async () => {
    const { supabase, tables } = createSupabaseMock()
    ;(createSupabaseAdminClient as jest.Mock).mockReturnValue(supabase)
    ;(verifyWebhookSignature as jest.Mock).mockReturnValue(true)

    const rawBody = JSON.stringify({
      api_version: '2024-01-01',
      event_id: 'evt_deactivate',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.activity.updated',
      event_object_id: 'va_bridge_2',
      event_object: {
        type: 'deactivation',
        virtual_account_id: 'va_bridge_2',
      },
      event_created_at: '2024-01-01T00:00:00Z',
    })

    const req = createMockReq(rawBody, { 'x-webhook-signature': 't=1,v0=abc' })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, processed: true })
    expect(tables.bridge_virtual_accounts.update).toHaveBeenCalledWith({ status: 'inactive' })
    expect(tables.bridge_deposits.upsert).not.toHaveBeenCalled()
  })

  it('short-circuits duplicate events', async () => {
    const { supabase, tables } = createSupabaseMock({ existingEvent: { id: 'evt_1' } })
    ;(createSupabaseAdminClient as jest.Mock).mockReturnValue(supabase)
    ;(verifyWebhookSignature as jest.Mock).mockReturnValue(true)

    const rawBody = JSON.stringify({
      api_version: '2024-01-01',
      event_id: 'evt_1',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.activity.updated',
      event_object_id: 'vat_1',
      event_object: { type: 'funds_received' },
      event_created_at: '2024-01-01T00:00:00Z',
    })

    const req = createMockReq(rawBody, { 'x-webhook-signature': 't=1,v0=abc' })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, duplicate: true })
    expect(tables.bridge_webhook_events.insert).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid signatures', async () => {
    const { supabase } = createSupabaseMock()
    ;(createSupabaseAdminClient as jest.Mock).mockReturnValue(supabase)
    ;(verifyWebhookSignature as jest.Mock).mockImplementation(() => {
      throw new WebhookSignatureError('Invalid signature')
    })

    const rawBody = JSON.stringify({
      api_version: '2024-01-01',
      event_id: 'evt_bad_sig',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.activity.updated',
      event_object_id: 'vat_1',
      event_object: { type: 'funds_received' },
      event_created_at: '2024-01-01T00:00:00Z',
    })

    const req = createMockReq(rawBody, { 'x-webhook-signature': 't=1,v0=bad' })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid signature' })
  })

  it('skips non-rejection KYC events (status handled via polling)', async () => {
    const { supabase, tables } = createSupabaseMock()
    ;(createSupabaseAdminClient as jest.Mock).mockReturnValue(supabase)
    ;(verifyWebhookSignature as jest.Mock).mockReturnValue(true)

    const rawBody = JSON.stringify({
      api_version: '2024-01-01',
      event_id: 'evt_kyc_1',
      event_category: 'kyc_link',
      event_type: 'kyc_link.updated',
      event_object_id: 'kyc_link_1',
      event_object: {
        id: 'kyc_link_1',
        kyc_status: 'approved',
        tos_status: 'approved',
        customer_id: 'cus_1',
      },
      event_created_at: '2024-01-01T00:00:00Z',
    })

    const req = createMockReq(rawBody, { 'x-webhook-signature': 't=1,v0=abc' })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, processed: true })
    // Non-rejection KYC events should be stored but NOT update bridge_customers
    expect(tables.bridge_webhook_events.insert).toHaveBeenCalled()
    expect(tables.bridge_customers.update).not.toHaveBeenCalled()
  })

  it('tracks rejection_attempts on KYC rejection events', async () => {
    const { supabase, tables, fns } = createSupabaseMock()
    ;(createSupabaseAdminClient as jest.Mock).mockReturnValue(supabase)
    ;(verifyWebhookSignature as jest.Mock).mockReturnValue(true)

    const rawBody = JSON.stringify({
      api_version: '2024-01-01',
      event_id: 'evt_kyc_rejected',
      event_category: 'kyc_link',
      event_type: 'kyc_link.updated',
      event_object_id: 'kyc_link_1',
      event_object: {
        id: 'kyc_link_1',
        kyc_status: 'rejected',
        tos_status: 'approved',
        customer_id: 'cus_1',
        rejection_reasons: [{ reason: 'Invalid document' }],
      },
      event_created_at: '2024-01-01T00:00:00Z',
    })

    const req = createMockReq(rawBody, { 'x-webhook-signature': 't=1,v0=abc' })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, processed: true })
    // KYC rejection events should update rejection_attempts
    expect(tables.bridge_webhook_events.insert).toHaveBeenCalled()
    expect(tables.bridge_customers.update).toHaveBeenCalledWith({ rejection_attempts: 1 })
  })
})
