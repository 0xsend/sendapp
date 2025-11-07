import { useReadBaseJackpotUsersInfo } from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { useMemo } from 'react'

export const useClaimableWinnings = () => {
  const { data: sendAccount, isLoading: isLoadingAccount } = useSendAccount()
  const userAddress = useMemo(() => sendAccount?.address, [sendAccount?.address])

  const {
    data: usersInfo,
    isLoading: isLoadingWinnings,
    error,
    refetch,
  } = useReadBaseJackpotUsersInfo(
    { userAddress: userAddress },
    {
      query: {
        enabled: !!userAddress,
      },
    }
  )

  const winningsClaimable = useMemo(() => {
    if (!usersInfo || !Array.isArray(usersInfo) || usersInfo.length < 2) {
      return 0n
    }
    return usersInfo[1] as bigint
  }, [usersInfo])

  const hasClaimableWinnings = useMemo(() => {
    return winningsClaimable > 0n
  }, [winningsClaimable])

  return {
    winningsClaimable,
    hasClaimableWinnings,
    isLoading: isLoadingAccount || isLoadingWinnings || !userAddress,
    error,
    refetch,
  }
}
