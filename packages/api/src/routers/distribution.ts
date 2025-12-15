import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { TRPCError } from '@trpc/server'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { selectAll } from 'app/utils/supabase/selectAll'
import debugBase from 'debug'

const debug = debugBase('api:distribution')

/**
 * Schema for validating stored merkle tree JSON from distributions.merkle_tree column.
 * Structure matches the format in packages/contracts/var/22-merkle.json
 */
const StoredMerkleTreeSchema = z.object({
  distributionId: z.number(),
  root: z.string(),
  total: z.string(),
  proofs: z.array(z.array(z.string())),
})

export const distributionRouter = createTRPCRouter({
  proof: protectedProcedure
    .input(
      z.object({
        distributionId: z.number(),
      })
    )
    .query(async ({ ctx: { session }, input: { distributionId } }) => {
      const supabaseAdmin = createSupabaseAdminClient()
      // lookup active distribution shares
      const { data: shares, error: sharesError } = await selectAll(
        supabaseAdmin
          .from('distribution_shares')
          .select('index, address, amount::text, user_id', { count: 'exact' })
          .eq('distribution_id', distributionId)
          .gt('amount', 0)
          .order('index', { ascending: true })
      )

      if (sharesError) {
        console.error('Error fetching distribution shares', sharesError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: sharesError.message,
        })
      }

      if (shares === null || shares.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No shares found for distribution ${distributionId}`,
        })
      }

      const myShare = shares.find(({ user_id }) => user_id === session?.user.id)

      if (!shares || shares.length === 0 || !myShare) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No shares found for distribution ${distributionId}`,
        })
      }

      // Check for pre-computed merkle tree in distributions table
      const { data: distribution, error: distributionError } = await supabaseAdmin
        .from('distributions')
        .select('merkle_tree')
        .eq('id', distributionId)
        .single()

      if (distributionError) {
        debug('Error fetching distribution merkle_tree', distributionError)
        // Continue to fallback - don't throw
      }

      // Try to use stored merkle tree if available
      if (distribution?.merkle_tree) {
        const parseResult = StoredMerkleTreeSchema.safeParse(distribution.merkle_tree)

        if (parseResult.success) {
          const storedTree = parseResult.data
          const proof = storedTree.proofs[myShare.index]

          if (proof) {
            debug('Using stored merkle tree for distribution', distributionId)
            return proof as `0x${string}`[]
          }
          debug(
            'Stored merkle tree missing proof for index',
            myShare.index,
            '- falling back to generation'
          )
        } else {
          debug(
            'Failed to parse stored merkle tree',
            parseResult.error.message,
            '- falling back to generation'
          )
        }
      } else {
        debug('No stored merkle tree found - generating fresh tree')
      }

      // Fallback: generate merkle tree from shares
      const tree = StandardMerkleTree.of(
        shares.map(({ index, address, amount }) => [index, address, BigInt(amount)]),
        ['uint256', 'address', 'uint256']
      )

      debug('Generated merkle tree', tree.root)

      // this is what the user will need to submit to claim their tokens
      return tree.getProof([
        myShare.index,
        myShare.address,
        BigInt(myShare.amount),
      ]) as `0x${string}`[]
    }),
})
