import { useMemo, useCallback } from 'react'
import { encodeFunctionData, erc20Abi, type Address, isAddress } from 'viem'
import { useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import {
  baseJackpotAbi,
  baseJackpotAddress,
  useReadBaseJackpotTicketPrice,
} from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserOp } from 'app/utils/userop'
import type { GetUserOperationReceiptReturnType } from 'permissionless'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { assert } from 'app/utils/assert'
import { useSendUserOpMutation, type SendUserOpArgs } from 'app/utils/sendUserOp'
import debug from 'debug'

const log = debug('app:play:usePurchaseJackpotTicket')

export type PurchaseJackpotTicketArgs = {
  tokenAddress?: Address
  quantity?: number
  referrer?: Address
  recipient?: Address
}

type PurchaseAsyncVariables = {
  webauthnCreds: SendUserOpArgs['webauthnCreds']
  version?: number
  validUntil?: number
}

function usePrepareInternal({
  tokenAddress,
  quantity = 1,
  referrer = '0x0000000000000000000000000000000000000000',
  recipient,
}: PurchaseJackpotTicketArgs) {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])

  const {
    data: ticketPrice,
    error: ticketPriceError,
    isLoading: isLoadingTicketPrice,
  } = useReadBaseJackpotTicketPrice()

  const calls = useMemo(() => {
    if (typeof ticketPrice !== 'bigint' || ticketPrice <= 0n) {
      log('Ticket price invalid or not loaded:', ticketPrice)
      return undefined
    }
    if (
      !tokenAddress ||
      !isAddress(tokenAddress) ||
      !(quantity > 0) ||
      !recipient ||
      !isAddress(recipient) ||
      !isAddress(referrer) ||
      !sender ||
      !isAddress(sender)
    ) {
      log('Missing or invalid dependencies for calls:', {
        tokenAddress,
        quantity,
        recipient,
        referrer,
        sender,
      })
      return undefined
    }

    const totalCost = ticketPrice * BigInt(quantity)
    log('Calculated total cost:', totalCost)

    const approveCallData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [baseJackpotAddress, totalCost],
    })

    const purchaseCallData = encodeFunctionData({
      abi: baseJackpotAbi,
      functionName: 'purchaseTickets',
      args: [referrer, totalCost, recipient],
    })

    log('Generated calls:', [
      { dest: tokenAddress, data: approveCallData },
      { dest: baseJackpotAddress, data: purchaseCallData },
    ])

    return [
      { dest: tokenAddress, value: 0n, data: approveCallData },
      { dest: baseJackpotAddress, value: 0n, data: purchaseCallData },
    ]
  }, [tokenAddress, ticketPrice, quantity, recipient, referrer, sender])

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

  const isPreparing = isLoadingUserOp || isLoadingUSDCFees || isLoadingTicketPrice
  const prepareError = userOpError || ticketPriceError || usdcFeesError

  log('Preparation state:', { isPreparing, prepareError, userOp, usdcFees, ticketPrice })

  return {
    userOp,
    usdcFees,
    calls,
    isPreparing,
    prepareError,
    ticketPrice,
    refetchPrepare: useCallback(async () => {
      await refetchUserOp()
      await refetchUSDCFees()
    }, [refetchUserOp, refetchUSDCFees]),
  }
}

export function usePurchaseJackpotTicket(
  args: PurchaseJackpotTicketArgs,
  options?: UseMutationOptions<GetUserOperationReceiptReturnType, Error, PurchaseAsyncVariables>
) {
  const queryClient = useQueryClient()
  const { userOp, usdcFees, calls, isPreparing, prepareError, ticketPrice, refetchPrepare } =
    usePrepareInternal(args)

  const {
    mutateAsync: sendUserOp,
    isPending: isPurchasing,
    error: purchaseError,
  } = useSendUserOpMutation()

  const purchaseAsync = useCallback(
    async ({ webauthnCreds, version, validUntil }: PurchaseAsyncVariables) => {
      log('Attempting purchase...')
      assert(!isPreparing, 'Preparation must complete before purchasing.')
      assert(!prepareError, `Preparation failed: ${prepareError?.message}`)
      assert(userOp !== undefined, 'UserOperation must be prepared before purchasing.')
      assert(
        typeof ticketPrice === 'bigint' && ticketPrice > 0n,
        `Invalid ticket price: ${ticketPrice}`
      )
      assert(calls !== undefined, 'Transaction calls not generated.')
      assert(webauthnCreds.length > 0, 'WebAuthn credentials are required.')

      log('Sending UserOperation:', userOp)
      try {
        const result = await sendUserOp(
          { userOp, webauthnCreds, version, validUntil },
          {
            ...options,
            onSuccess: (data, variables, context) => {
              log('Purchase successful:', data)
              queryClient.invalidateQueries({ queryKey: ['userJackpotSummary'] })
              queryClient.invalidateQueries({ queryKey: ['sendAccountBalances'] })
              options?.onSuccess?.(data, variables, context)
            },
            onError: (error, variables, context) => {
              log('Purchase failed:', error)
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
    [isPreparing, prepareError, userOp, ticketPrice, calls, sendUserOp, queryClient, options]
  )

  return {
    isPreparing,
    prepareError,
    usdcFees,
    ticketPrice,
    userOp,
    refetchPrepare,
    purchaseAsync,
    isPurchasing,
    purchaseError,
  }
}
