import type { PostgrestError } from '@supabase/postgrest-js'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'

import { LeaderboardSchema, type Leaderboard } from 'app/utils/zod/leaderboard'
import type { ZodError } from 'zod'

export function useLeaderboard(params?: {
  refetchInterval?: number
  limit?: number
}): UseQueryResult<Leaderboard, PostgrestError | ZodError> {
  const { refetchInterval = 30_000, limit = 10 } = params || {}

  const supabase = useSupabase()

  async function fetchLeaderboardData(): Promise<Leaderboard> {
    // const { data: rewards, error: rewardsError } = await supabase
    //   .rpc('leaderboard_referrals_all_time')
    //   .order('rewards_usdc', { ascending: false })
    //   .limit(limit)
    // throwIf(rewardsError)

    const { data: referrals, error: referralsError } = await supabase
      .rpc('leaderboard_referrals_all_time')
      .order('referrals', { ascending: false })
      .limit(limit)
    throwIf(referralsError)

    return LeaderboardSchema.parse({ referrals, rewards: [] })
  }

  return useQuery({
    queryKey: ['leaderboard_feed'],
    queryFn: fetchLeaderboardData,
    refetchInterval,
  })
}
