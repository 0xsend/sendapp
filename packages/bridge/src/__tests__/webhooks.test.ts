import { generateKeyPairSync, createSign } from 'node:crypto'
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  isKycEvent,
  isVirtualAccountActivityEvent,
  extractKycStatusFromEvent,
  extractTosStatusFromEvent,
  extractDepositStatusFromEvent,
} from '../webhooks'
import { WebhookSignatureError } from '../errors'
import type { WebhookEvent } from '../types'

describe('verifyWebhookSignature', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString()

  function createSignature(body: string, timestamp: number): string {
    const signedPayload = `${timestamp}.${body}`
    const signature = createSign('RSA-SHA256').update(signedPayload).sign(privateKey, 'base64')
    return `t=${timestamp},v0=${signature}`
  }

  it('verifies a valid signature', () => {
    const body = '{"event_id":"wh_123"}'
    const timestamp = Date.now()
    const header = createSignature(body, timestamp)

    expect(() =>
      verifyWebhookSignature(body, header, publicKeyPem, { nowMs: timestamp })
    ).not.toThrow()
  })

  it('returns true for valid signature', () => {
    const body = '{"event_id":"wh_123"}'
    const timestamp = Date.now()
    const header = createSignature(body, timestamp)

    const result = verifyWebhookSignature(body, header, publicKeyPem, { nowMs: timestamp })
    expect(result).toBe(true)
  })

  it('throws WebhookSignatureError for missing signature header', () => {
    const body = '{"event_id":"wh_123"}'

    expect(() => verifyWebhookSignature(body, '', publicKeyPem)).toThrow(WebhookSignatureError)
    expect(() => verifyWebhookSignature(body, '', publicKeyPem)).toThrow('Missing signature header')
  })

  it('throws WebhookSignatureError for malformed signature header', () => {
    const body = '{"event_id":"wh_123"}'

    expect(() => verifyWebhookSignature(body, 'invalid', publicKeyPem)).toThrow(
      WebhookSignatureError
    )
    expect(() => verifyWebhookSignature(body, 'invalid', publicKeyPem)).toThrow(
      'Missing signature timestamp or value'
    )
  })

  it('throws WebhookSignatureError for invalid timestamp', () => {
    const body = '{"event_id":"wh_123"}'
    const header = 't=not-a-number,v0=somesignature'

    expect(() => verifyWebhookSignature(body, header, publicKeyPem)).toThrow(WebhookSignatureError)
    expect(() => verifyWebhookSignature(body, header, publicKeyPem)).toThrow(
      'Invalid signature timestamp'
    )
  })

  it('throws WebhookSignatureError for expired timestamp', () => {
    const body = '{"event_id":"wh_123"}'
    const oldTimestamp = Date.now() - 15 * 60 * 1000 // 15 minutes ago
    const header = createSignature(body, oldTimestamp)

    expect(() => verifyWebhookSignature(body, header, publicKeyPem)).toThrow(WebhookSignatureError)
    expect(() => verifyWebhookSignature(body, header, publicKeyPem)).toThrow(
      'Signature timestamp outside tolerance'
    )
  })

  it('accepts timestamp within custom tolerance', () => {
    const body = '{"event_id":"wh_123"}'
    const timestamp = Date.now() - 5 * 60 * 1000 // 5 minutes ago
    const header = createSignature(body, timestamp)

    expect(() =>
      verifyWebhookSignature(body, header, publicKeyPem, { toleranceMs: 10 * 60 * 1000 })
    ).not.toThrow()
  })

  it('throws WebhookSignatureError for invalid signature', () => {
    const body = '{"event_id":"wh_123"}'
    const timestamp = Date.now()
    const header = `t=${timestamp},v0=invalidsignature`

    expect(() => verifyWebhookSignature(body, header, publicKeyPem, { nowMs: timestamp })).toThrow(
      WebhookSignatureError
    )
    expect(() => verifyWebhookSignature(body, header, publicKeyPem, { nowMs: timestamp })).toThrow(
      'Invalid signature'
    )
  })

  it('throws WebhookSignatureError when body is tampered', () => {
    const originalBody = '{"event_id":"wh_123"}'
    const tamperedBody = '{"event_id":"wh_456"}'
    const timestamp = Date.now()
    const header = createSignature(originalBody, timestamp)

    expect(() =>
      verifyWebhookSignature(tamperedBody, header, publicKeyPem, { nowMs: timestamp })
    ).toThrow(WebhookSignatureError)
  })
})

describe('parseWebhookEvent', () => {
  it('parses a valid webhook event', () => {
    const rawBody = JSON.stringify({
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'kyc_link',
      event_type: 'kyc_link.kyc_status.approved',
      event_object_id: 'kyc_456',
      event_object_status: 'approved',
      event_object: { id: 'kyc_456', kyc_status: 'approved' },
      event_created_at: '2024-01-01T00:00:00Z',
    })

    const event = parseWebhookEvent(rawBody)
    expect(event.event_id).toBe('evt_123')
    expect(event.event_category).toBe('kyc_link')
    expect(event.event_type).toBe('kyc_link.kyc_status.approved')
  })

  it('throws for invalid JSON', () => {
    expect(() => parseWebhookEvent('not json')).toThrow()
  })

  it('throws for missing required fields', () => {
    const rawBody = JSON.stringify({ event_id: 'evt_123' })
    expect(() => parseWebhookEvent(rawBody)).toThrow()
  })
})

describe('isKycEvent', () => {
  it('returns true for kyc_link events', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'kyc_link',
      event_type: 'kyc_link.kyc_status.approved',
      event_object_id: 'kyc_456',
      event_object: {},
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(isKycEvent(event)).toBe(true)
  })

  it('returns false for non-kyc events', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.funds_received',
      event_object_id: 'va_456',
      event_object: {},
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(isKycEvent(event)).toBe(false)
  })
})

describe('isVirtualAccountActivityEvent', () => {
  it('returns true for virtual_account.activity events', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.funds_received',
      event_object_id: 'va_456',
      event_object: {},
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(isVirtualAccountActivityEvent(event)).toBe(true)
  })

  it('returns false for non-virtual-account events', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'kyc_link',
      event_type: 'kyc_link.kyc_status.approved',
      event_object_id: 'kyc_456',
      event_object: {},
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(isVirtualAccountActivityEvent(event)).toBe(false)
  })
})

describe('extractKycStatusFromEvent', () => {
  it('extracts kyc_status from KYC event', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'kyc_link',
      event_type: 'kyc_link.kyc_status.approved',
      event_object_id: 'kyc_456',
      event_object: { kyc_status: 'approved' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractKycStatusFromEvent(event)).toBe('approved')
  })

  it('returns null for non-KYC event', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.funds_received',
      event_object_id: 'va_456',
      event_object: { kyc_status: 'approved' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractKycStatusFromEvent(event)).toBe(null)
  })

  it('returns null when kyc_status is missing', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'kyc_link',
      event_type: 'kyc_link.tos_status.approved',
      event_object_id: 'kyc_456',
      event_object: {},
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractKycStatusFromEvent(event)).toBe(null)
  })
})

describe('extractTosStatusFromEvent', () => {
  it('extracts tos_status from KYC event', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'kyc_link',
      event_type: 'kyc_link.tos_status.approved',
      event_object_id: 'kyc_456',
      event_object: { tos_status: 'approved' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractTosStatusFromEvent(event)).toBe('approved')
  })

  it('returns null for non-KYC event', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.funds_received',
      event_object_id: 'va_456',
      event_object: { tos_status: 'approved' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractTosStatusFromEvent(event)).toBe(null)
  })

  it('returns null when tos_status is missing', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'kyc_link',
      event_type: 'kyc_link.kyc_status.approved',
      event_object_id: 'kyc_456',
      event_object: { kyc_status: 'approved' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractTosStatusFromEvent(event)).toBe(null)
  })
})

describe('extractDepositStatusFromEvent', () => {
  it('extracts funds_received status', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.funds_received',
      event_object_id: 'va_456',
      event_object: { type: 'funds_received' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractDepositStatusFromEvent(event)).toBe('funds_received')
  })

  it('extracts in_review status', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.in_review',
      event_object_id: 'va_456',
      event_object: { type: 'in_review' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractDepositStatusFromEvent(event)).toBe('in_review')
  })

  it('extracts payment_submitted status', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.payment_submitted',
      event_object_id: 'va_456',
      event_object: { type: 'payment_submitted' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractDepositStatusFromEvent(event)).toBe('payment_submitted')
  })

  it('extracts payment_processed status', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.payment_processed',
      event_object_id: 'va_456',
      event_object: { type: 'payment_processed' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractDepositStatusFromEvent(event)).toBe('payment_processed')
  })

  it('maps refunded to refund status', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.refunded',
      event_object_id: 'va_456',
      event_object: { type: 'refunded' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractDepositStatusFromEvent(event)).toBe('refund')
  })

  it('returns null for non-virtual-account event', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'kyc_link',
      event_type: 'kyc_link.kyc_status.approved',
      event_object_id: 'kyc_456',
      event_object: { type: 'funds_received' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractDepositStatusFromEvent(event)).toBe(null)
  })

  it('returns null for unknown type', () => {
    const event: WebhookEvent = {
      api_version: '2024-01-01',
      event_id: 'evt_123',
      event_category: 'virtual_account.activity',
      event_type: 'virtual_account.unknown',
      event_object_id: 'va_456',
      event_object: { type: 'unknown_type' },
      event_created_at: '2024-01-01T00:00:00Z',
    }

    expect(extractDepositStatusFromEvent(event)).toBe(null)
  })
})
