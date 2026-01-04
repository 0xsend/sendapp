import type { NextApiRequest, NextApiResponse } from 'next'
import type { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { createBridgeClient, BridgeApiError } from '@my/bridge'
import { createClient } from '@supabase/supabase-js'
import debug from 'debug'

const log = debug('api:bridge:virtual-account:create')

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

interface CreateVirtualAccountRequest {
  destinationAddress: string
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
    const { destinationAddress } = req.body as CreateVirtualAccountRequest

    if (!destinationAddress || !/^0x[a-fA-F0-9]{40}$/.test(destinationAddress)) {
      return res.status(400).json({ error: 'Valid Ethereum address is required' })
    }

    log('creating virtual account for user', userId)

    // Get user's bridge customer record
    const adminClient = createSupabaseAdminClient()
    const { data: customer, error: customerError } = await adminClient
      .from('bridge_customers')
      .select('*')
      .eq('user_id', userId)
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

    // Check for existing active virtual account
    const { data: existingAccount } = await adminClient
      .from('bridge_virtual_accounts')
      .select('*')
      .eq('bridge_customer_id', customer.id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingAccount) {
      log('user already has active virtual account')
      return res.status(200).json({
        virtualAccountId: existingAccount.id,
        bankDetails: {
          bankName: existingAccount.bank_name,
          routingNumber: existingAccount.bank_routing_number,
          accountNumber: existingAccount.bank_account_number,
          beneficiaryName: existingAccount.bank_beneficiary_name,
          paymentRails: existingAccount.payment_rails,
        },
      })
    }

    // Create virtual account with Bridge
    const bridgeClient = createBridgeClient()
    const vaResponse = await bridgeClient.createVirtualAccount(
      customer.bridge_customer_id,
      {
        source_currency: 'usd',
        destination_currency: 'usdc',
        destination_payment_rail: 'base',
        destination_address: destinationAddress,
      },
      { idempotencyKey: `va-${customer.bridge_customer_id}` }
    )

    log('created virtual account', vaResponse.id)

    // Store the virtual account
    const sourceInstructions = vaResponse.source_deposit_instructions
    const { error: insertError } = await adminClient.from('bridge_virtual_accounts').insert({
      bridge_customer_id: customer.id,
      bridge_virtual_account_id: vaResponse.id,
      destination_address: destinationAddress,
      destination_currency: vaResponse.destination_currency,
      destination_payment_rail: vaResponse.destination_payment_rail,
      bank_name: sourceInstructions.bank_name,
      bank_routing_number: sourceInstructions.bank_routing_number,
      bank_account_number: sourceInstructions.bank_account_number,
      bank_beneficiary_name: sourceInstructions.bank_beneficiary_name,
      bank_beneficiary_address: sourceInstructions.bank_beneficiary_address,
      payment_rails: sourceInstructions.payment_rails,
      source_deposit_instructions: sourceInstructions,
    })

    if (insertError) {
      log('failed to store virtual account', insertError)
      return res.status(500).json({ error: 'Failed to store virtual account' })
    }

    return res.status(200).json({
      virtualAccountId: vaResponse.id,
      bankDetails: {
        bankName: sourceInstructions.bank_name,
        routingNumber: sourceInstructions.bank_routing_number,
        accountNumber: sourceInstructions.bank_account_number,
        beneficiaryName: sourceInstructions.bank_beneficiary_name,
        paymentRails: sourceInstructions.payment_rails,
      },
    })
  } catch (error) {
    log('error creating virtual account', error)

    if (error instanceof BridgeApiError) {
      return res.status(error.status).json({
        error: error.message,
        details: error.details,
      })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}
