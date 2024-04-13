import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { TRPCError } from '@trpc/server'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { selectAll } from 'app/utils/supabase/selectAll'

export const distributionRouter = createTRPCRouter({
  proof: protectedProcedure
    .input(
      z.object({
        distributionId: z.number(),
      })
    )
    .query(async ({ ctx: { session }, input: { distributionId } }) => {
      // lookup active distribution shares
      const { data: shares, error: sharesError } = await selectAll(
        supabaseAdmin
          .from('distribution_shares')
          .select('index, address, amount, user_id', { count: 'exact' })
          .eq('distribution_id', distributionId)
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

      // could save some cycles and save this to the database
      const tree = StandardMerkleTree.of(
        shares.map(({ index, address, amount }) => [index, address, amount]),
        ['uint256', 'address', 'uint256']
      )

      // this is what the user will need to submit to claim their tokens
      return tree.getProof([myShare.index, myShare.address, myShare.amount]) as `0x${string}`[]
    }),
})
