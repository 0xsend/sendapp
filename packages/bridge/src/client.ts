import debug from 'debug'
import { BridgeApiError } from './errors'
import type {
  CustomerResponse,
  KycLinkRequest,
  KycLinkResponse,
  VirtualAccountRequest,
  VirtualAccountResponse,
  WebhookResponse,
  BridgeApiErrorResponse,
} from './types'

const log = debug('bridge:client')

interface BridgeClientConfig {
  apiKey: string
  sandbox?: boolean
}

interface RequestOptions {
  idempotencyKey?: string
}

/**
 * Bridge XYZ API client for KYC and virtual account operations
 */
export class BridgeClient {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(config: BridgeClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.sandbox
      ? 'https://api.sandbox.bridge.xyz/v0'
      : 'https://api.bridge.xyz/v0'
    log('initialized client with baseUrl=%s sandbox=%s', this.baseUrl, !!config.sandbox)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Api-Key': this.apiKey,
    }

    if (method === 'POST' && options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey
    } else if (method === 'POST') {
      headers['Idempotency-Key'] = crypto.randomUUID()
    }

    log('%s %s', method, path)

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorBody = (await response.json()) as BridgeApiErrorResponse
      log('error response: %O', errorBody)
      throw new BridgeApiError(response.status, errorBody)
    }

    const data = (await response.json()) as T
    log('response: %O', data)
    return data
  }

  // KYC Links

  /**
   * Create a new KYC link for onboarding a customer
   */
  async createKycLink(data: KycLinkRequest, options?: RequestOptions): Promise<KycLinkResponse> {
    return this.request('POST', '/kyc_links', data, options)
  }

  /**
   * Get KYC link details by ID
   */
  async getKycLink(id: string): Promise<KycLinkResponse> {
    return this.request('GET', `/kyc_links/${id}`)
  }

  /**
   * Get KYC link for an existing customer
   */
  async getCustomerKycLink(customerId: string): Promise<{ kyc_link: string }> {
    return this.request('GET', `/customers/${customerId}/kyc_link`)
  }

  // Customers

  /**
   * Get customer details by ID
   */
  async getCustomer(id: string): Promise<CustomerResponse> {
    return this.request('GET', `/customers/${id}`)
  }

  // Virtual Accounts

  /**
   * Create a virtual account for a customer
   */
  async createVirtualAccount(
    customerId: string,
    data: VirtualAccountRequest,
    options?: RequestOptions
  ): Promise<VirtualAccountResponse> {
    return this.request('POST', `/customers/${customerId}/virtual_accounts`, data, options)
  }

  /**
   * List virtual accounts for a customer
   */
  async listVirtualAccounts(customerId: string): Promise<VirtualAccountResponse[]> {
    return this.request('GET', `/customers/${customerId}/virtual_accounts`)
  }

  // Webhooks

  /**
   * Create a webhook endpoint
   */
  async createWebhook(
    url: string,
    events: string[],
    options?: RequestOptions
  ): Promise<WebhookResponse> {
    return this.request('POST', '/webhooks', { url, enabled_events: events }, options)
  }
}

/**
 * Create a Bridge client from environment variables
 */
export function createBridgeClient(): BridgeClient {
  const apiKey = process.env.BRIDGE_API_KEY
  if (!apiKey) {
    throw new Error('BRIDGE_API_KEY environment variable is required')
  }

  const sandbox = process.env.BRIDGE_SANDBOX === 'true'
  return new BridgeClient({ apiKey, sandbox })
}
