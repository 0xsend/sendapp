import { encodeFunctionData, erc20Abi, type Hex } from 'viem'
import { useSendAccount } from 'app/utils/send-accounts'
import { useMemo } from 'react'
import { useUserOp } from 'app/utils/userop'
import { useUSDCFees } from 'app/utils/useUSDCFees'

export const useSwap = ({
  swapCallData,
  routerAddress,
  token,
  amount,
}: {
  token?: Hex | 'eth'
  amount?: bigint
  swapCallData?: Hex
  routerAddress?: Hex
}) => {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])

  const calls = useMemo(() => {
    if (!token || !amount || !swapCallData || !routerAddress) {
      return undefined
    }

    if (token === 'eth') {
      return [
        {
          dest: routerAddress,
          value: amount,
          data: swapCallData,
        },
      ]
    }

    return [
      {
        dest: token,
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [routerAddress, amount],
        }),
      },
      {
        dest: routerAddress,
        value: 0n,
        data: swapCallData,
      },
    ]
  }, [token, routerAddress, amount, swapCallData])

  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
  } = useUserOp({
    sender,
    calls,
    callGasLimit: 2000000n,
  })

  const {
    data: usdcFees,
    isLoading: isLoadingUSDCFees,
    error: usdcFeesError,
  } = useUSDCFees({
    userOp,
  })

  return {
    userOp,
    userOpError,
    isLoadingUserOp,
    usdcFees,
    usdcFeesError,
    isLoadingUSDCFees,
  }
}
