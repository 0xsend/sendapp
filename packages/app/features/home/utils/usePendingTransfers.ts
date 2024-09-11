import type { Address } from 'viem'
import type { coins } from 'app/data/coins'
import { api } from 'app/utils/api'

/**
 * Fetch Pending transfers by token and send account address
 */
export function usePendingTransfers(params: {
  address: Address
  token: coins[number]['token']
  refetchInterval?: number
  enabled?: boolean
}) {
  const { address, token, refetchInterval, enabled } = params
  return api.transfer.getPending.useQuery(
    { token, sender: address },
    {
      refetchInterval,
      enabled,
    }
  )
}
