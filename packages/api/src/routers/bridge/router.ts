import debug from 'debug'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../../trpc'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { createBridgeClient, BridgeApiError, type SourceDepositInstructions } from '@my/bridge'
import {
  CreateKycLinkInputSchema,
  GetKycStatusInputSchema,
  type CreateKycLinkOutput,
  type GetKycStatusOutput,
  type CreateVirtualAccountOutput,
  type CreateTransferTemplateOutput,
  type CreateStaticMemoOutput,
} from './types'

const log = debug('api:routers:bridge')

const MAX_KYC_REJECTION_ATTEMPTS = 3

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

type BankDetails = {
  bankName: string | null
  routingNumber: string | null
  accountNumber: string | null
  beneficiaryName: string | null
  beneficiaryAddress: string | null
  paymentRails: string[]
}

type BankDetailsWithMessage = BankDetails & {
  depositMessage: string | null
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
    beneficiaryName: instructions?.bank_beneficiary_name ?? null,
    beneficiaryAddress: instructions?.bank_beneficiary_address ?? null,
    paymentRails,
  }
}

function getBankDetailsWithMessageFromInstructions(
  instructions: SourceDepositInstructions | null | undefined
): BankDetailsWithMessage {
  const base = getBankDetailsFromInstructions(instructions)
  return {
    ...base,
    beneficiaryName:
      instructions?.bank_beneficiary_name ?? instructions?.account_holder_name ?? null,
    depositMessage: instructions?.deposit_message ?? null,
  }
}

function handleBridgeError(error: unknown): never {
  if (error instanceof BridgeApiError) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
      cause: error.details,
    })
  }
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  })
}

export const bridgeRouter = createTRPCRouter({
  /**
   * Create or retrieve a KYC link for the authenticated user
   */
  createKycLink: protectedProcedure
    .input(CreateKycLinkInputSchema)
    .mutation(async ({ input, ctx }): Promise<CreateKycLinkOutput> => {
      const userId = ctx.session.user.id
      log('initiating KYC for user', userId)

      try {
        const adminClient = createSupabaseAdminClient()

        const { data: profile, error: profileError } = await adminClient
          .from('profiles')
          .select('is_business, send_id')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          log('failed to fetch profile for KYC type: userId=%s error=%O', userId, profileError)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to load profile' })
        }

        if (!profile) {
          log('no profile found for KYC type: userId=%s', userId)
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' })
        }

        if (!profile.send_id) {
          log('no send_id found for KYC: userId=%s', userId)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Profile send_id is required for KYC',
          })
        }

        const customerType = profile.is_business ? 'business' : 'individual'

        // Check if user already has a bridge customer record for this profile type
        const { data: existingCustomer } = await adminClient
          .from('bridge_customers')
          .select('*')
          .eq('user_id', userId)
          .eq('type', customerType)
          .maybeSingle()

        if (existingCustomer) {
          log('user already has bridge customer', existingCustomer.kyc_link_id)

          // If already approved, return error
          if (existingCustomer.kyc_status === 'approved') {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'KYC already approved' })
          }

          // If max rejection attempts exceeded, return error
          const rejectionAttempts = existingCustomer.rejection_attempts ?? 0
          if (rejectionAttempts >= MAX_KYC_REJECTION_ATTEMPTS) {
            log('max rejection attempts exceeded: userId=%s attempts=%d', userId, rejectionAttempts)
            throw new TRPCError({
              code: 'FORBIDDEN',
              message:
                'Maximum verification attempts exceeded. If you believe this was a mistake, please contact support@send.app',
            })
          }

          const bridgeClient = createBridgeClient()

          if (existingCustomer.kyc_link_id) {
            const kycLink = await bridgeClient.getKycLink(existingCustomer.kyc_link_id)

            // If user is retrying after rejection, reset status to incomplete
            if (existingCustomer.kyc_status === 'rejected') {
              await adminClient
                .from('bridge_customers')
                .update({ kyc_status: 'incomplete' })
                .eq('user_id', userId)
              log('reset kyc_status from rejected to incomplete for retry: userId=%s', userId)
            }

            return {
              kycLink: kycLink.kyc_link,
              tosLink: kycLink.tos_link,
              kycLinkId: kycLink.id,
            }
          }

          if (existingCustomer.bridge_customer_id) {
            const kycLink = await bridgeClient.getCustomerKycLink(
              existingCustomer.bridge_customer_id
            )

            // If user is retrying after rejection, reset status to incomplete
            if (existingCustomer.kyc_status === 'rejected') {
              await adminClient
                .from('bridge_customers')
                .update({ kyc_status: 'incomplete' })
                .eq('user_id', userId)
              log('reset kyc_status from rejected to incomplete for retry: userId=%s', userId)
            }

            return {
              kycLink: kycLink.kyc_link,
              tosLink: '',
              kycLinkId: existingCustomer.kyc_link_id ?? '',
            }
          }
        }

        // Email is required when creating a new KYC link
        if (!input.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email is required to start verification',
          })
        }
        const email = input.email

        // Validate redirectUri against allowlist
        const validatedRedirectUri =
          input.redirectUri && isAllowedRedirectUri(input.redirectUri)
            ? input.redirectUri
            : undefined

        // Create new KYC link with Bridge
        const bridgeClient = createBridgeClient()
        const kycLinkResponse = await bridgeClient.createKycLink(
          {
            email,
            type: customerType,
            redirect_uri: validatedRedirectUri,
          },
          { idempotencyKey: `kyc-${profile.send_id}-${customerType}` }
        )

        log('created KYC link', kycLinkResponse.id)

        // Store the customer record
        const { error: insertError } = await adminClient.from('bridge_customers').insert({
          user_id: userId,
          kyc_link_id: kycLinkResponse.id,
          kyc_status: kycLinkResponse.kyc_status,
          tos_status: kycLinkResponse.tos_status,
          bridge_customer_id: kycLinkResponse.customer_id,
          type: customerType,
        })

        if (insertError) {
          log('failed to store bridge customer', insertError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to store customer record',
          })
        }

        return {
          kycLink: kycLinkResponse.kyc_link,
          tosLink: kycLinkResponse.tos_link,
          kycLinkId: kycLinkResponse.id,
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log('error initiating KYC', error)
        handleBridgeError(error)
      }
    }),

  /**
   * Poll KYC status from Bridge API directly (more responsive than webhooks)
   */
  getKycStatus: protectedProcedure
    .input(GetKycStatusInputSchema)
    .query(async ({ input, ctx }): Promise<GetKycStatusOutput> => {
      const userId = ctx.session.user.id
      const { kycLinkId } = input

      log('checking KYC status for user=%s kycLinkId=%s', userId, kycLinkId)

      try {
        const adminClient = createSupabaseAdminClient()

        // Verify user owns this KYC link and fetch current status
        const { data: existingCustomer, error: fetchError } = await adminClient
          .from('bridge_customers')
          .select('kyc_status, tos_status, rejection_attempts, bridge_customer_id')
          .eq('user_id', userId)
          .eq('kyc_link_id', kycLinkId)
          .maybeSingle()

        if (fetchError) {
          log('error fetching bridge customer', fetchError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch customer record',
          })
        }

        if (!existingCustomer) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'KYC link not found for user' })
        }

        // Fetch current status from Bridge API
        const bridgeClient = createBridgeClient()
        const kycLink = await bridgeClient.getKycLink(kycLinkId)

        log(
          'bridge API response: kycStatus=%s tosStatus=%s',
          kycLink.kyc_status,
          kycLink.tos_status
        )

        // Check if status changed - sync to DB
        const statusChanged =
          existingCustomer.kyc_status !== kycLink.kyc_status ||
          existingCustomer.tos_status !== kycLink.tos_status

        if (statusChanged) {
          log(
            'status changed: kyc %s→%s, tos %s→%s',
            existingCustomer.kyc_status,
            kycLink.kyc_status,
            existingCustomer.tos_status,
            kycLink.tos_status
          )

          const updates: Record<string, unknown> = {
            kyc_status: kycLink.kyc_status,
            tos_status: kycLink.tos_status,
            bridge_customer_id: kycLink.customer_id ?? existingCustomer.bridge_customer_id,
            rejection_reasons: kycLink.rejection_reasons,
            updated_at: new Date().toISOString(),
          }

          const { error: updateError } = await adminClient
            .from('bridge_customers')
            .update(updates)
            .eq('kyc_link_id', kycLinkId)

          if (updateError) {
            log('error updating bridge customer status', updateError)
            // Don't fail the request - still return current status
          }
        }

        const rejectionAttempts = existingCustomer.rejection_attempts ?? 0

        return {
          kycStatus: kycLink.kyc_status,
          tosStatus: kycLink.tos_status,
          rejectionReasons: kycLink.rejection_reasons,
          rejectionAttempts,
          customerId: kycLink.customer_id,
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log('error checking KYC status', error)
        handleBridgeError(error)
      }
    }),

  /**
   * Create a virtual account for the authenticated user after KYC approval
   */
  createVirtualAccount: protectedProcedure.mutation(
    async ({ ctx }): Promise<CreateVirtualAccountOutput> => {
      const userId = ctx.session.user.id
      log('creating virtual account for user', userId)

      try {
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
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Send account required' })
        }

        const destinationAddress = sendAccount.address

        const { data: profile, error: profileError } = await adminClient
          .from('profiles')
          .select('is_business')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          log('failed to fetch profile: userId=%s error=%O', userId, profileError)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to load profile' })
        }

        if (!profile) {
          log('no profile found: userId=%s', userId)
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' })
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
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Complete KYC first' })
        }

        if (customer.kyc_status !== 'approved') {
          log('KYC not approved', customer.kyc_status)
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'KYC must be approved first' })
        }

        if (!customer.bridge_customer_id) {
          log('bridge customer ID not found')
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bridge customer not created yet' })
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
          const existingInstructions = (existingAccount.source_deposit_instructions ??
            null) as SourceDepositInstructions | null
          return {
            virtualAccountId: existingAccount.bridge_virtual_account_id,
            bankDetails: getBankDetailsFromInstructions(existingInstructions),
          }
        }

        // Create virtual account with Bridge
        const bridgeClient = createBridgeClient()
        const vaResponse = await bridgeClient.createVirtualAccount(
          customer.bridge_customer_id,
          {
            source: {
              currency: 'usd',
            },
            destination: {
              currency: 'usdc',
              payment_rail: 'base',
              address: destinationAddress,
            },
          },
          { idempotencyKey: `va-${customer.bridge_customer_id}` }
        )

        log('created virtual account', vaResponse.id)

        // Store the virtual account
        const sourceInstructions = vaResponse.source_deposit_instructions
        const { error: insertError } = await adminClient.from('bridge_virtual_accounts').insert({
          bridge_customer_id: customer.id,
          bridge_virtual_account_id: vaResponse.id,
          source_currency: sourceInstructions.currency,
          destination_currency: vaResponse.destination.currency,
          destination_payment_rail: vaResponse.destination.payment_rail,
          destination_address: vaResponse.destination.address,
          source_deposit_instructions: sourceInstructions,
        })

        if (insertError) {
          log('failed to store virtual account', insertError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to store virtual account',
          })
        }

        return {
          virtualAccountId: vaResponse.id,
          bankDetails: getBankDetailsFromInstructions(sourceInstructions),
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log('error creating virtual account', error)
        handleBridgeError(error)
      }
    }
  ),

  /**
   * Create a static memo for the authenticated user after KYC approval
   */
  createStaticMemo: protectedProcedure.mutation(
    async ({ ctx }): Promise<CreateStaticMemoOutput> => {
      const userId = ctx.session.user.id
      log('creating static memo for user', userId)

      try {
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
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Send account required' })
        }

        const destinationAddress = sendAccount.address

        if (!destinationAddress) {
          log('send account address not found')
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Send account address required' })
        }

        const { data: profile, error: profileError } = await adminClient
          .from('profiles')
          .select('is_business')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          log('failed to fetch profile: userId=%s error=%O', userId, profileError)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to load profile' })
        }

        if (!profile) {
          log('no profile found: userId=%s', userId)
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' })
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
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Complete KYC first' })
        }

        if (customer.kyc_status !== 'approved') {
          log('KYC not approved', customer.kyc_status)
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'KYC must be approved first' })
        }

        if (!customer.bridge_customer_id) {
          log('bridge customer ID not found')
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bridge customer not created yet' })
        }

        // Check for existing active static memo
        const { data: existingMemo } = await adminClient
          .from('bridge_static_memos')
          .select('*')
          .eq('bridge_customer_id', customer.id)
          .eq('status', 'active')
          .maybeSingle()

        if (existingMemo) {
          log('user already has active static memo')
          const existingInstructions = (existingMemo.source_deposit_instructions ??
            null) as SourceDepositInstructions | null
          return {
            staticMemoId: existingMemo.bridge_static_memo_id,
            bankDetails: getBankDetailsWithMessageFromInstructions(existingInstructions),
          }
        }

        // Create static memo with Bridge
        const bridgeClient = createBridgeClient()
        const memoResponse = await bridgeClient.createStaticMemo(
          customer.bridge_customer_id,
          {
            source: {
              currency: 'usd',
              payment_rail: 'wire',
            },
            destination: {
              currency: 'usdc',
              payment_rail: 'base',
              address: destinationAddress,
            },
          },
          { idempotencyKey: `static-memo-${customer.bridge_customer_id}` }
        )

        log('created static memo', memoResponse.id)

        const sourceInstructions = memoResponse.source_deposit_instructions ?? null
        if (!sourceInstructions) {
          log('missing source deposit instructions on static memo', memoResponse.id)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Missing deposit instructions from Bridge',
          })
        }

        // Store the static memo
        const { error: insertError } = await adminClient.from('bridge_static_memos').insert({
          bridge_customer_id: customer.id,
          bridge_static_memo_id: memoResponse.id,
          source_currency: sourceInstructions.currency ?? 'usd',
          destination_currency: memoResponse.destination?.currency ?? 'usdc',
          destination_payment_rail: memoResponse.destination?.payment_rail ?? 'base',
          destination_address: memoResponse.destination?.address ?? destinationAddress,
          source_deposit_instructions: sourceInstructions,
        })

        if (insertError) {
          log('failed to store static memo', insertError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to store static memo',
          })
        }

        return {
          staticMemoId: memoResponse.id,
          bankDetails: getBankDetailsWithMessageFromInstructions(sourceInstructions),
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log('error creating static memo', error)
        handleBridgeError(error)
      }
    }
  ),

  /**
   * Create a static transfer template for the authenticated user after KYC approval
   */
  createTransferTemplate: protectedProcedure.mutation(
    async ({ ctx }): Promise<CreateTransferTemplateOutput> => {
      const userId = ctx.session.user.id
      log('creating transfer template for user', userId)

      try {
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
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Send account required' })
        }

        const destinationAddress = sendAccount.address

        if (!destinationAddress) {
          log('send account address not found')
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Send account address required' })
        }

        const { data: profile, error: profileError } = await adminClient
          .from('profiles')
          .select('is_business')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          log('failed to fetch profile: userId=%s error=%O', userId, profileError)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to load profile' })
        }

        if (!profile) {
          log('no profile found: userId=%s', userId)
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' })
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
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Complete KYC first' })
        }

        if (customer.kyc_status !== 'approved') {
          log('KYC not approved', customer.kyc_status)
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'KYC must be approved first' })
        }

        if (!customer.bridge_customer_id) {
          log('bridge customer ID not found')
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bridge customer not created yet' })
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
          return {
            templateId: existingTemplate.bridge_transfer_template_id,
            bankDetails: getBankDetailsWithMessageFromInstructions(existingInstructions),
          }
        }

        // Create static transfer template with Bridge
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
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Missing deposit instructions from Bridge',
          })
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
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to store transfer template',
          })
        }

        return {
          templateId: transferResponse.id,
          bankDetails: getBankDetailsWithMessageFromInstructions(sourceInstructions),
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log('error creating transfer template', error)
        handleBridgeError(error)
      }
    }
  ),
})
