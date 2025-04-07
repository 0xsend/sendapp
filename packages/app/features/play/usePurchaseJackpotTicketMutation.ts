import { useMemo, useState, useCallback } from 'react'
import { encodeFunctionData, erc20Abi, type Address, type Hex, isAddress } from 'viem'
import { useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import {
  baseJackpotAbi,
  baseJackpotAddress,
  useReadBaseJackpotTicketPrice,
} from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserOp } from 'app/utils/userop'
import type { UserOperation, GetUserOperationReceiptReturnType } from 'permissionless'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { assert } from 'app/utils/assert'
import { useSendUserOpMutation, type SendUserOpArgs } from 'app/utils/sendUserOp'
import debug from 'debug'

const log = debug('app:play:usePurchaseJackpotTicket')

// --- Types ---

export type PurchaseJackpotTicketArgs = {
  tokenAddress?: Address // Address of the token used for tickets (e.g., SEND)
  quantity?: number // Number of tickets to purchase
  referrer?: Address // Optional referrer address
  recipient?: Address // Address receiving the ticket (usually the sender)
}

type PurchaseAsyncVariables = {
  webauthnCreds: SendUserOpArgs['webauthnCreds'] // Use the type from SendUserOpArgs
  version?: number // Optional, defaults in sendUserOp
  validUntil?: number // Optional, defaults in sendUserOp
}

// --- Internal Preparation Hook ---

/**
 * @internal
 * Prepares the UserOperation and calculates fees for purchasing a jackpot ticket.
 * This hook is primarily for internal use by `usePurchaseJackpotTicket`.
 *
 * @returns The prepared UserOperation, estimated USDC fees, and loading/error states.
 */
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
    refetch: refetchUserOp, // Expose refetch if needed
  } = useUserOp({ sender, calls }) // Removed options: { enabled: !!calls }

  const {
    data: usdcFees,
    isLoading: isLoadingUSDCFees,
    error: usdcFeesError,
    refetch: refetchUSDCFees, // Expose refetch if needed
  } = useUSDCFees({ userOp }) // Removed options: { enabled: !!userOp }

  const isPreparing = isLoadingUserOp || isLoadingUSDCFees || isLoadingTicketPrice
  const prepareError = userOpError || ticketPriceError || usdcFeesError

  log('Preparation state:', { isPreparing, prepareError, userOp, usdcFees, ticketPrice })

  return {
    userOp,
    usdcFees,
    calls, // Keep calls for potential validation before mutation
    isPreparing,
    prepareError,
    ticketPrice, // Needed for validation/assertions
    refetchPrepare: useCallback(async () => {
      // Add a way to refetch preparation steps if needed
      await refetchUserOp()
      await refetchUSDCFees()
    }, [refetchUserOp, refetchUSDCFees]),
  }
}

// --- Combined Hook ---

/**
 * Hook to handle purchasing jackpot tickets.
 * It manages both the preparation (calculating fees, building UserOperation)
 * and the execution (sending the UserOperation via WebAuthn).
 *
 * @param args - Arguments needed for preparing the purchase (token, quantity, etc.).
 * @param options - Optional TanStack Query mutation options for the execution phase.
 * @returns An object containing preparation state, execution function, and execution state.
 */
export function usePurchaseJackpotTicket(
  args: PurchaseJackpotTicketArgs,
  options?: UseMutationOptions<
    GetUserOperationReceiptReturnType,
    Error,
    PurchaseAsyncVariables // Variables for the purchaseAsync function
  >
) {
  const queryClient = useQueryClient()
  const { userOp, usdcFees, calls, isPreparing, prepareError, ticketPrice, refetchPrepare } =
    usePrepareInternal(args)

  // useSendUserOpMutation *is* the mutation hook
  const {
    mutateAsync: sendUserOp,
    isPending: isPurchasing,
    error: purchaseError,
  } = useSendUserOpMutation() // Call without arguments

  const purchaseAsync = useCallback(
    async ({ webauthnCreds, version, validUntil }: PurchaseAsyncVariables) => {
      log('Attempting purchase...')
      assert(!isPreparing, 'Preparation must complete before purchasing.')
      assert(!prepareError, `Preparation failed: ${prepareError?.message}`)
      assert(!!userOp, 'UserOperation must be prepared before purchasing.')
      // Add explicit type check for ticketPrice before comparison
      assert(
        typeof ticketPrice === 'bigint' && ticketPrice > 0n,
        `Invalid ticket price: ${ticketPrice}`
      )
      assert(!!calls, 'Transaction calls not generated.')
      assert(!!webauthnCreds && webauthnCreds.length > 0, 'WebAuthn credentials are required.')

      log('Sending UserOperation:', userOp)
      try {
        // Pass mutation options when calling sendUserOp
        const result = await sendUserOp(
          { userOp, webauthnCreds, version, validUntil },
          {
            // Ensure options passed to the main hook are included here
            ...options,
            onSuccess: (data, variables, context) => {
              log('Purchase successful:', data)
              // Invalidate relevant queries on success
              // Correct syntax for invalidateQueries
              queryClient.invalidateQueries({ queryKey: ['userJackpotSummary'] })
              queryClient.invalidateQueries({ queryKey: ['sendAccountBalances'] })
              // Call original onSuccess if provided
              options?.onSuccess?.(data, variables, context)
            },
            onError: (error, variables, context) => {
              log('Purchase failed:', error)
              // Call original onError if provided
              options?.onError?.(error, variables, context)
            },
          }
        )
        log('UserOperation sent, receipt:', result)
        return result
      } catch (err) {
        log('Error during sendUserOp call:', err)
        // Error is already captured by useSendUserOpMutation's state, re-throwing might be redundant
        // unless specific handling is needed here.
        throw err // Re-throw to allow caller's catch blocks
      }
    },
    // Add queryClient and options to dependency array
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
