import { useQuery } from '@tanstack/react-query'

import { useUserPendingJackpotTickets } from './useUserPendingJackpotTickets'
import { useUserJackpotSummary } from './useUserJackpotSummary'
import { MAX_JACKPOT_HISTORY } from 'app/data/sendpot'

export const useDidUserBuyTicket = () => {
  const pendingJackpotTickets = useUserPendingJackpotTickets()
  const userJackpotSummary = useUserJackpotSummary(MAX_JACKPOT_HISTORY)

  return useQuery({
    queryKey: ['useDidUserBuyTicket', { userJackpotSummary, pendingJackpotTickets }] as const,
    enabled: pendingJackpotTickets.isSuccess && userJackpotSummary.isSuccess,
    queryFn: async () => {
      if (!pendingJackpotTickets.data || !userJackpotSummary.data) {
        return false
      }
      return (
        pendingJackpotTickets.data > 0 || userJackpotSummary?.data?.find((s) => s.total_tickets > 0)
      )
    },
  })
}
