import { useMemo } from 'react'
import { encodeFunctionData, erc20Abi, type Address, type Hex, isAddress } from 'viem'
import { baseJackpotAbi, baseJackpotAddress } from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserOp } from 'app/utils/userop'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { assert } from 'app/utils/assert'

export type UsePurchaseJackpotTicketArgs = {
  tokenAddress?: Address // Address of the token used for tickets (e.g., SEND)
  ticketPrice?: bigint // Price of one ticket
  referrer?: Address // Optional referrer address
  recipient?: Address // Address receiving the ticket (usually the sender)
}

/**
 * Prepares the UserOperation and calculates fees for purchasing a jackpot ticket.
 *
 * @returns The prepared UserOperation, estimated USDC fees, and loading/error states.
 *          The actual signing and sending should be handled by `useSendUserOpMutation`.
 */
export function usePurchaseJackpotTicket({
  tokenAddress,
  ticketPrice,
  // Default referrer to address(0) if not provided
  referrer = '0x0000000000000000000000000000000000000000',
  recipient,
}: UsePurchaseJackpotTicketArgs) {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])

  // Construct the calls array for approving the token and purchasing the ticket
  const calls = useMemo(() => {
    // Ensure all required parameters are valid before constructing calls
    if (
      !tokenAddress ||
      !ticketPrice ||
      ticketPrice <= 0n ||
      !recipient ||
      !sender ||
      !isAddress(tokenAddress) ||
      !isAddress(recipient) ||
      !isAddress(referrer) ||
      !isAddress(sender)
    ) {
      return undefined
    }

    // 1. Encode approve call data
    const approveCallData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [baseJackpotAddress, ticketPrice], // Approve jackpot contract to spend ticketPrice
    })

    // 2. Encode purchaseTickets call data
    const purchaseCallData = encodeFunctionData({
      abi: baseJackpotAbi,
      functionName: 'purchaseTickets',
      args: [referrer, ticketPrice, recipient],
    })

    // Return the batch calls
    return [
      // First call: approve
      {
        dest: tokenAddress,
        value: 0n,
        data: approveCallData,
      },
      // Second call: purchaseTickets
      {
        dest: baseJackpotAddress,
        value: 0n, // Value is transferred via the token approval
        data: purchaseCallData,
      },
    ]
  }, [tokenAddress, ticketPrice, recipient, referrer, sender])

  // Use useUserOp hook to estimate the UserOperation based on the sender and calls
  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
  } = useUserOp({
    sender,
    calls,
    // Explicitly pass the token address for paymaster data if required by useUserOp's internal logic
    // This assumes useUserOp handles paymaster selection and data encoding based on context or inputs.
    // If useUserOp needs the token address specifically for paymasterData, pass it here.
    // Example: paymasterContext: { tokenAddress }
    // Adjust based on how useUserOp determines paymaster data.
    // For now, assuming useUserOp handles it based on the calls or other context.
  })

  // Use useUSDCFees hook to calculate the fees based on the estimated UserOperation
  const {
    data: usdcFees,
    isLoading: isLoadingUSDCFees,
    error: usdcFeesError,
  } = useUSDCFees({
    userOp,
  })

  // Combine loading states
  const isLoading = isLoadingUserOp || isLoadingUSDCFees

  // Combine errors - prioritize userOpError if both exist
  const error = userOpError || usdcFeesError

  return {
    userOp, // The prepared UserOperation (unsigned)
    userOpError,
    isLoadingUserOp,
    usdcFees, // Estimated fees in USDC
    usdcFeesError,
    isLoadingUSDCFees,
    isLoading, // Combined loading state
    error, // Combined error state
    calls, // Expose calls for potential debugging or inspection
  }
}
