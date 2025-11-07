import { useCallback, useMemo } from 'react'
import { encodeFunctionData, isAddress } from 'viem'
import { type UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { baseJackpotAbi, baseJackpotAddress } from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserOp } from 'app/utils/userop'
import type { GetUserOperationReceiptReturnType } from 'permissionless'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { assert } from 'app/utils/assert'
import { type SendUserOpArgs, useSendUserOpMutation } from 'app/utils/sendUserOp'
import debug from 'debug'

const log = debug('app:sendpot:useWithdrawWinnings')

type WithdrawAsyncVariables = {
  webauthnCreds: SendUserOpArgs['webauthnCreds']
  version?: number
  validUntil?: number
}

function usePrepareInternal() {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])

  const calls = useMemo(() => {
    if (!sender || !isAddress(sender)) {
      log('Missing or invalid sender:', sender)
      return undefined
    }

    const withdrawCallData = encodeFunctionData({
      abi: baseJackpotAbi,
      functionName: 'withdrawWinnings',
      args: [],
    })

    log('Generated withdraw call:', { dest: baseJackpotAddress, data: withdrawCallData })

    return [{ dest: baseJackpotAddress, value: 0n, data: withdrawCallData }]
  }, [sender])

  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
    refetch: refetchUserOp,
  } = useUserOp({ sender, calls })

  const {
    data: usdcFees,
    isLoading: isLoadingUSDCFees,
    error: usdcFeesError,
    refetch: refetchUSDCFees,
  } = useUSDCFees({ userOp })

  const isPreparing = isLoadingUserOp || isLoadingUSDCFees
  const prepareError = userOpError || usdcFeesError

  log('Preparation state:', { isPreparing, prepareError, userOp, usdcFees })

  return {
    userOp,
    usdcFees,
    calls,
    isPreparing,
    prepareError,
    refetchPrepare: useCallback(async () => {
      await refetchUserOp()
      await refetchUSDCFees()
    }, [refetchUserOp, refetchUSDCFees]),
  }
}

export function useWithdrawWinnings(
  options?: UseMutationOptions<GetUserOperationReceiptReturnType, Error, WithdrawAsyncVariables>
) {
  const queryClient = useQueryClient()
  const { userOp, usdcFees, calls, isPreparing, prepareError, refetchPrepare } =
    usePrepareInternal()

  const {
    mutateAsync: sendUserOp,
    isPending: isWithdrawing,
    error: withdrawError,
  } = useSendUserOpMutation()

  const withdrawAsync = useCallback(
    async ({ webauthnCreds, version, validUntil }: WithdrawAsyncVariables) => {
      log('Attempting withdrawal...')
      assert(!isPreparing, 'Preparation must complete before withdrawing.')
      assert(!prepareError, `Preparation failed: ${prepareError?.message}`)
      assert(userOp !== undefined, 'UserOperation must be prepared before withdrawing.')
      assert(calls !== undefined, 'Transaction calls not generated.')
      assert(webauthnCreds.length > 0, 'WebAuthn credentials are required.')

      log('Sending UserOperation:', userOp)
      try {
        const result = await sendUserOp(
          { userOp, webauthnCreds, version, validUntil },
          {
            ...options,
            onSuccess: (data, variables, context) => {
              log('Withdrawal successful:', data)
              queryClient.invalidateQueries({ queryKey: ['userJackpotSummary'] })
              queryClient.invalidateQueries({ queryKey: ['sendAccountBalances'] })
              queryClient.invalidateQueries({ queryKey: ['activity_feed'], exact: false })
              options?.onSuccess?.(data, variables, context)
            },
            onError: (error, variables, context) => {
              log('Withdrawal failed:', error)
              options?.onError?.(error, variables, context)
            },
          }
        )
        log('UserOperation sent, receipt:', result)
        return result
      } catch (err) {
        log('Error during sendUserOp call:', err)
        throw err
      }
    },
    [isPreparing, prepareError, userOp, calls, sendUserOp, queryClient, options]
  )

  return {
    isPreparing,
    prepareError,
    usdcFees,
    userOp,
    refetchPrepare,
    withdrawAsync,
    isWithdrawing,
    withdrawError,
  }
}
