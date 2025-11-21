import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useUserPendingJackpotTickets } from './useUserPendingJackpotTickets'
import { useUserJackpotSummary } from './useUserJackpotSummary'
import { MAX_JACKPOT_HISTORY } from 'app/data/sendpot'

export const SENDPOT_DISCLAIMER_ACCEPTED_QUERY_KEY = 'sendpotDisclaimerAccepted'

export const useDidUserBuyTicket = () => {
  const queryClient = useQueryClient()
  const pendingJackpotTickets = useUserPendingJackpotTickets()
  const userJackpotSummary = useUserJackpotSummary(MAX_JACKPOT_HISTORY)

  return useQuery({
    queryKey: ['useDidUserBuyTicket', { userJackpotSummary, pendingJackpotTickets }] as const,
    enabled: pendingJackpotTickets.isSuccess && userJackpotSummary.isSuccess,
    queryFn: async () => {
      // Check if user has already accepted the disclaimer in this session
      const disclaimerAccepted = queryClient.getQueryData<boolean>([
        SENDPOT_DISCLAIMER_ACCEPTED_QUERY_KEY,
      ])
      if (disclaimerAccepted === true) {
        return true
      }

      if (pendingJackpotTickets.data === undefined || !userJackpotSummary.data) {
        return false
      }
      return (
        pendingJackpotTickets.data > 0 ||
        userJackpotSummary.data.find((s) => s.total_tickets > 0) !== undefined
      )
    },
  })
}
