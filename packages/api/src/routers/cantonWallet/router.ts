import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { createTRPCRouter, protectedProcedure } from '../../trpc'
import { isCantonIntegrationEnabled } from '../../utils/canton-config'
import { CantonEligibilityService } from '../../services/canton/eligibility-service'
import { CantonAPIClient } from '../../services/canton/api-client'
import { GeneratePriorityTokenInputSchema, type GeneratePriorityTokenOutput } from './types'

const log = debug('api:canton-wallet')

/**
 * Canton Wallet tRPC Router
 *
 * Provides endpoints for Canton Wallet integration:
 * - generatePriorityToken: Generate priority token for eligible users
 */
export const cantonWalletRouter = createTRPCRouter({
  /**
   * Generate Canton Wallet priority token
   *
   * Flow:
   * 1. Check if Canton integration is enabled
   * 2. Get user's main SendTag name
   * 3. Check eligibility (SendTag, $2K earn, 3K SEND)
   * 4. Generate label: sendapp:tag_{sendtag}
   * 5. Ensure priority token exists (idempotent)
   * 6. Build invite URL
   * 7. Return token, URL, and isNew flag
   */
  generatePriorityToken: protectedProcedure
    .input(GeneratePriorityTokenInputSchema)
    .mutation(async ({ ctx }): Promise<GeneratePriorityTokenOutput> => {
      const userId = ctx.session.user.id

      log('Generating priority token for user: %s', userId)

      try {
        // Step 1: Check if Canton integration is enabled
        if (!isCantonIntegrationEnabled()) {
          log('Canton integration is not enabled')
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Canton integration is not enabled',
          })
        }

        // Step 2: Get user's send account with main tag
        log('Looking up send account and main tag for user: %s', userId)
        const { data: sendAccount, error: sendAccountError } = await ctx.supabase
          .from('send_accounts')
          .select('id, main_tag_id, tags!send_accounts_main_tag_id_fkey(name)')
          .eq('user_id', userId)
          .maybeSingle()

        if (sendAccountError) {
          log('Error fetching send account: %o', sendAccountError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch send account: ${sendAccountError.message}`,
          })
        }

        if (!sendAccount) {
          log('No send account found for user: %s', userId)
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'No send account found for this user',
          })
        }

        // Step 3: Verify main tag exists
        const mainTag = sendAccount.tags as { name: string } | null
        if (!mainTag?.name) {
          log('No main SendTag found for user: %s', userId)
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'No main SendTag found for this user',
          })
        }

        const sendtag = mainTag.name
        log('Found main SendTag: %s', sendtag)

        // Step 4: Get active distribution to determine which chain to query
        log('Fetching active distribution')
        const now = new Date().toISOString()
        const { data: distribution, error: distError } = await ctx.supabase
          .from('distributions')
          .select('chain_id')
          .lte('qualification_start', now)
          .gte('qualification_end', now)
          .order('number', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (distError) {
          log('Error fetching distribution: %o', distError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch distribution: ${distError.message}`,
          })
        }

        if (!distribution) {
          log('No active distribution found')
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'No active distribution found',
          })
        }

        // Step 5: Create viem client for the distribution's chain
        log('Creating viem client for chain: %s', distribution.chain_id)
        const rpcUrl =
          distribution.chain_id === 8453
            ? process.env.BASE_MAINNET_RPC_URL
            : process.env.NEXT_PUBLIC_BASE_RPC_URL || 'http://localhost:8546'

        const localnetChain = {
          id: distribution.chain_id,
          name: 'localnet',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: [rpcUrl || 'http://localhost:8546'] },
          },
        }

        const viemClient = createPublicClient({
          chain: distribution.chain_id === 8453 ? base : localnetChain,
          transport: http(rpcUrl),
          // biome-ignore lint/suspicious/noExplicitAny: Viem client type inference issue
        }) as any

        // Step 6: Check eligibility
        log('Checking eligibility for user: %s', userId)
        const eligibilityService = new CantonEligibilityService(ctx.supabase, viemClient)
        const eligibility = await eligibilityService.checkEligibility(userId)

        if (!eligibility.eligible) {
          log('User %s is not eligible: %o', userId, eligibility.checks)
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User is not eligible for Canton Wallet priority token',
            cause: {
              checks: eligibility.checks,
            },
          })
        }

        log('User %s is eligible', userId)

        // Step 7: Generate label
        const label = `sendapp:tag_${sendtag}`
        log('Generated label: %s', label)

        // Step 8: Ensure priority token exists (idempotent)
        log('Ensuring priority token exists for label: %s', label)
        const apiClient = CantonAPIClient.getInstance()
        const tokenResult = await apiClient.ensurePriorityTokenWithStatus(label, {
          sendtag,
          userId,
          distributionId: distribution.chain_id,
        })
        log('Priority token ensured: %s (isNew: %s)', tokenResult.token, tokenResult.isNew)

        // Step 9: Build invite URL (mobile/client UIs only open HTTPS links)
        const url = apiClient.buildDeepLink(tokenResult.token)
        log('Invite URL built: %s', url)

        // Step 10: Return result
        const result: GeneratePriorityTokenOutput = {
          token: tokenResult.token,
          url,
          isNew: tokenResult.isNew,
        }

        log('Priority token generated successfully for user: %s', userId)
        return result
      } catch (error) {
        // Re-throw TRPC errors
        if (error instanceof TRPCError) {
          throw error
        }

        // Log and wrap unexpected errors
        log('Unexpected error generating priority token: %o', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? `Failed to generate priority token: ${error.message}`
              : 'Failed to generate priority token',
          cause: error,
        })
      }
    }),
})
