import type { Database } from '@my/supabase/database.types'
import { z } from 'zod'

export const LeaderboardEntrySchema = z.object({
  rewards_usdc: z.number(),
  referrals: z.number(),
  user: z.custom<Database['public']['CompositeTypes']['activity_feed_user']>(),
})

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>

export const LeaderboardSchema = z.object({
  referrals: z.array(LeaderboardEntrySchema),
  rewards: z.array(LeaderboardEntrySchema),
})

export type Leaderboard = z.infer<typeof LeaderboardSchema>
