import type { NextApiRequest, NextApiResponse } from 'next'
import type { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { createBridgeClient, BridgeApiError } from '@my/bridge'
import { createClient } from '@supabase/supabase-js'
import debug from 'debug'

const log = debug('api:bridge:kyc:initiate')

const MAX_KYC_REJECTION_ATTEMPTS = 3

/**
 * Get user session from either cookies or Authorization header (for native clients)
 */
async function getSession(req: NextApiRequest, res: NextApiResponse) {
  // First try cookie-based auth (web clients)
  const supabase = createPagesServerClient<Database>({ req, res })
  const { data: cookieSession } = await supabase.auth.getSession()

  if (cookieSession.session) {
    return { session: cookieSession.session, error: null }
  }

  // Fall back to Authorization header (native clients)
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { session: null, error: new Error('Supabase configuration missing') }
    }

    const tokenClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data, error } = await tokenClient.auth.getUser(token)
    if (error || !data.user) {
      return { session: null, error: error || new Error('Invalid token') }
    }

    // Return a minimal session object with user info
    return {
      session: { user: data.user, access_token: token },
      error: null,
    }
  }

  return { session: null, error: new Error('No authentication provided') }
}

interface InitiateKycRequest {
  redirectUri?: string
}

// Allowed redirect URI patterns for KYC completion
const ALLOWED_REDIRECT_PATTERNS = [
  /^https:\/\/send\.app(\/.*)?$/, // Production web
  /^https:\/\/dev\.send\.app(\/.*)?$/, // Staging/dev web
  /^http:\/\/localhost(:\d+)?(\/.*)?$/, // Local development
  /^send:\/\/.*$/, // Native app deep link
]

function isAllowedRedirectUri(uri: string): boolean {
  return ALLOWED_REDIRECT_PATTERNS.some((pattern) => pattern.test(uri))
}

interface InitiateKycResponse {
  kycLink: string
  tosLink: string
  kycLinkId: string
}

interface ErrorResponse {
  error: string
  details?: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitiateKycResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authenticate user (supports both cookie and Bearer token auth)
    const { session, error: authError } = await getSession(req, res)

    if (!session || authError) {
      log('unauthorized request', authError?.message)
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    log('initiating KYC for user', userId)

    // Check if user already has a bridge customer record
    const adminClient = createSupabaseAdminClient()
    const { data: existingCustomer } = await adminClient
      .from('bridge_customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingCustomer) {
      log('user already has bridge customer', existingCustomer.kyc_link_id)

      // If already approved, return error
      if (existingCustomer.kyc_status === 'approved') {
        return res.status(400).json({ error: 'KYC already approved' })
      }

      // If max rejection attempts exceeded, return error
      const rejectionAttempts = existingCustomer.rejection_attempts ?? 0
      if (rejectionAttempts >= MAX_KYC_REJECTION_ATTEMPTS) {
        log('max rejection attempts exceeded: userId=%s attempts=%d', userId, rejectionAttempts)
        return res.status(403).json({
          error:
            'Maximum verification attempts exceeded. If you believe this was a mistake, please contact support@send.app',
          code: 'MAX_ATTEMPTS_EXCEEDED',
        })
      }

      // Get KYC link from Bridge
      // Prefer kyc_link_id endpoint as it reliably returns the KYC link URL
      const bridgeClient = createBridgeClient()

      if (existingCustomer.kyc_link_id) {
        const kycLink = await bridgeClient.getKycLink(existingCustomer.kyc_link_id)

        // If user is retrying after rejection, reset status to incomplete
        // so the webhook can properly track the next rejection attempt
        if (existingCustomer.kyc_status === 'rejected') {
          await adminClient
            .from('bridge_customers')
            .update({ kyc_status: 'incomplete' })
            .eq('user_id', userId)
          log('reset kyc_status from rejected to incomplete for retry: userId=%s', userId)
        }

        return res.status(200).json({
          kycLink: kycLink.kyc_link,
          tosLink: kycLink.tos_link,
          kycLinkId: kycLink.id,
        })
      }

      if (existingCustomer.bridge_customer_id) {
        const kycLink = await bridgeClient.getCustomerKycLink(existingCustomer.bridge_customer_id)

        // If user is retrying after rejection, reset status to incomplete
        if (existingCustomer.kyc_status === 'rejected') {
          await adminClient
            .from('bridge_customers')
            .update({ kyc_status: 'incomplete' })
            .eq('user_id', userId)
          log('reset kyc_status from rejected to incomplete for retry: userId=%s', userId)
        }

        return res.status(200).json({
          kycLink: kycLink.kyc_link,
          tosLink: '',
          kycLinkId: existingCustomer.kyc_link_id ?? '',
        })
      }
    }

    // Use email from authenticated session - never trust user-provided email
    const email = session.user.email?.trim()

    if (!email) {
      return res.status(400).json({ error: 'User email is required' })
    }

    // Validate redirectUri against allowlist
    const { redirectUri } = req.body as InitiateKycRequest
    const validatedRedirectUri =
      redirectUri && isAllowedRedirectUri(redirectUri) ? redirectUri : undefined

    // Create new KYC link with Bridge
    const bridgeClient = createBridgeClient()
    const kycLinkResponse = await bridgeClient.createKycLink(
      {
        email,
        type: 'individual',
        redirect_uri: validatedRedirectUri,
      },
      { idempotencyKey: `kyc-${userId}` }
    )

    log('created KYC link', kycLinkResponse.id)

    // Store the customer record
    const { error: insertError } = await adminClient.from('bridge_customers').insert({
      user_id: userId,
      kyc_link_id: kycLinkResponse.id,
      email,
      kyc_status: kycLinkResponse.kyc_status,
      tos_status: kycLinkResponse.tos_status,
      bridge_customer_id: kycLinkResponse.customer_id,
    })

    if (insertError) {
      log('failed to store bridge customer', insertError)
      return res.status(500).json({ error: 'Failed to store customer record' })
    }

    return res.status(200).json({
      kycLink: kycLinkResponse.kyc_link,
      tosLink: kycLinkResponse.tos_link,
      kycLinkId: kycLinkResponse.id,
    })
  } catch (error) {
    log('error initiating KYC', error)

    if (error instanceof BridgeApiError) {
      return res.status(error.status).json({
        error: error.message,
        details: error.details,
      })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}
