import type { NextApiRequest, NextApiResponse } from 'next'
import type { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { createBridgeClient, BridgeApiError } from '@my/bridge'
import type { SourceDepositInstructions } from '@my/bridge'
import { createClient } from '@supabase/supabase-js'
import debug from 'debug'

const log = debug('api:bridge:transfer-template:create')

type BankDetails = {
  bankName: string | null
  routingNumber: string | null
  accountNumber: string | null
  beneficiaryName: string | null
  beneficiaryAddress: string | null
  depositMessage: string | null
  paymentRails: string[]
}

function getBankDetailsFromInstructions(
  instructions: SourceDepositInstructions | null | undefined
): BankDetails {
  const paymentRails = instructions?.payment_rails?.length
    ? instructions.payment_rails
    : instructions?.payment_rail
      ? [instructions.payment_rail]
      : []

  return {
    bankName: instructions?.bank_name ?? null,
    routingNumber: instructions?.bank_routing_number ?? null,
    accountNumber: instructions?.bank_account_number ?? null,
    beneficiaryName:
      instructions?.bank_beneficiary_name ?? instructions?.account_holder_name ?? null,
    beneficiaryAddress: instructions?.bank_beneficiary_address ?? null,
    depositMessage: instructions?.deposit_message ?? null,
    paymentRails,
  }
}

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

interface ErrorResponse {
  error: string
  details?: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<unknown | ErrorResponse>
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

    log('creating transfer template for user', userId)

    const adminClient = createSupabaseAdminClient()

    // Get user's send account (verified destination address)
    const { data: sendAccount, error: sendAccountError } = await adminClient
      .from('send_accounts')
      .select('address')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single()

    if (sendAccountError || !sendAccount) {
      log('send account not found', sendAccountError)
      return res.status(400).json({ error: 'Send account required' })
    }

    const destinationAddress = sendAccount.address

    if (!destinationAddress) {
      log('send account address not found', sendAccountError)
      return res.status(400).json({ error: 'Send account address required' })
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('is_business')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      log('failed to fetch profile for transfer template: userId=%s error=%O', userId, profileError)
      return res.status(500).json({ error: 'Failed to load profile' })
    }

    if (!profile) {
      log('no profile found for transfer template: userId=%s', userId)
      return res.status(404).json({ error: 'Profile not found' })
    }

    const customerType = profile.is_business ? 'business' : 'individual'

    // Get user's bridge customer record
    const { data: customer, error: customerError } = await adminClient
      .from('bridge_customers')
      .select('*')
      .eq('user_id', userId)
      .eq('type', customerType)
      .single()

    if (customerError || !customer) {
      log('bridge customer not found', customerError)
      return res.status(400).json({ error: 'Complete KYC first' })
    }

    if (customer.kyc_status !== 'approved') {
      log('KYC not approved', customer.kyc_status)
      return res.status(400).json({ error: 'KYC must be approved first' })
    }

    if (!customer.bridge_customer_id) {
      log('bridge customer ID not found')
      return res.status(400).json({ error: 'Bridge customer not created yet' })
    }

    // Check for existing active template
    const { data: existingTemplate } = await adminClient
      .from('bridge_transfer_templates')
      .select('*')
      .eq('bridge_customer_id', customer.id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingTemplate) {
      log('user already has active transfer template')
      const existingInstructions = (existingTemplate.source_deposit_instructions ??
        null) as SourceDepositInstructions | null
      return res.status(200).json({
        templateId: existingTemplate.bridge_transfer_template_id,
        bankDetails: getBankDetailsFromInstructions(existingInstructions),
      })
    }

    // Create static transfer template with Bridge (replaces virtual accounts)
    const bridgeClient = createBridgeClient()
    const transferResponse = await bridgeClient.createTransfer(
      {
        on_behalf_of: customer.bridge_customer_id,
        source: {
          currency: 'usd',
          payment_rail: 'ach_push',
        },
        destination: {
          currency: 'usdc',
          payment_rail: 'base',
          to_address: destinationAddress,
        },
        features: {
          static_template: true,
          flexible_amount: true,
          allow_any_from_address: true,
        },
      },
      { idempotencyKey: `transfer-template-${customer.bridge_customer_id}` }
    )

    log('created transfer template', transferResponse.id)

    const sourceInstructions = transferResponse.source_deposit_instructions ?? null
    if (!sourceInstructions) {
      log('missing source deposit instructions on transfer template', transferResponse.id)
      return res.status(500).json({ error: 'Missing deposit instructions from Bridge' })
    }

    // Store the template
    const { error: insertError } = await adminClient.from('bridge_transfer_templates').insert({
      bridge_customer_id: customer.id,
      bridge_transfer_template_id: transferResponse.id,
      source_currency: sourceInstructions.currency ?? 'usd',
      destination_currency: transferResponse.destination?.currency ?? 'usdc',
      destination_payment_rail: transferResponse.destination?.payment_rail ?? 'base',
      destination_address: transferResponse.destination?.to_address ?? destinationAddress,
      source_deposit_instructions: sourceInstructions,
    })

    if (insertError) {
      log('failed to store transfer template', insertError)
      return res.status(500).json({ error: 'Failed to store transfer template' })
    }

    return res.status(200).json({
      templateId: transferResponse.id,
      bankDetails: getBankDetailsFromInstructions(sourceInstructions),
    })
  } catch (error) {
    log('error creating transfer template', error)

    if (error instanceof BridgeApiError) {
      return res.status(error.status).json({
        error: error.message,
        details: error.details,
      })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}
