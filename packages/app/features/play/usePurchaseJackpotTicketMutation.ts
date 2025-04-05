import { useMemo } from 'react'
import { encodeFunctionData, erc20Abi, type Address, type Hex, isAddress } from 'viem'
import {
  baseJackpotAbi,
  baseJackpotAddress,
  useReadBaseJackpotTicketPrice,
} from '@my/wagmi/contracts/base-jackpot'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserOp } from 'app/utils/userop'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { assert } from 'app/utils/assert'

export type UsePurchaseJackpotTicketArgs = {
  tokenAddress?: Address // Address of the token used for tickets (e.g., SEND)
  // ticketPrice is now fetched via hook
  quantity?: number // Number of tickets to purchase
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
  // ticketPrice removed from args
  quantity = 1, // Default to purchasing 1 ticket if quantity is not provided
  // Default referrer to address(0) if not provided
  referrer = '0x0000000000000000000000000000000000000000',
  recipient,
}: UsePurchaseJackpotTicketArgs) {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])

  // Fetch the current ticket price from the contract
  const {
    data: ticketPrice,
    error: ticketPriceError,
    isLoading: isLoadingTicketPrice,
  } = useReadBaseJackpotTicketPrice()

  // Construct the calls array for approving the token and purchasing the ticket
  const calls = useMemo(() => {
    // Return undefined if ticketPrice is not yet loaded or invalid
    if (typeof ticketPrice !== 'bigint' || ticketPrice <= 0n) {
      return undefined
    }

    // Ensure other required parameters are valid before constructing calls
    assert(tokenAddress !== undefined, 'tokenAddress is required')
    assert(isAddress(tokenAddress), 'tokenAddress must be a valid address')
    assert(quantity > 0, 'quantity must be greater than 0')
    assert(recipient !== undefined, 'recipient is required')
    assert(isAddress(recipient), 'recipient must be a valid address')
    // referrer has a default, so no need to check for undefined
    assert(isAddress(referrer), 'referrer must be a valid address')
    assert(sender !== undefined, 'sender is required')
    assert(isAddress(sender), 'sender must be a valid address')

    // Calculate total cost based on ticket price and quantity
    // We've asserted ticketPrice is a valid bigint > 0n above
    const totalCost = ticketPrice * BigInt(quantity)

    // 1. Encode approve call data for the total cost
    const approveCallData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [baseJackpotAddress, totalCost], // Approve jackpot contract to spend totalCost
    })

    // 2. Encode purchaseTickets call data using the total cost
    // Assuming the contract's purchaseTickets function expects the total value/amount
    const purchaseCallData = encodeFunctionData({
      abi: baseJackpotAbi,
      functionName: 'purchaseTickets',
      args: [referrer, totalCost, recipient],
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
    // Add quantity and fetched ticketPrice to dependency array
  }, [tokenAddress, ticketPrice, quantity, recipient, referrer, sender])

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
  const isLoading = isLoadingUserOp || isLoadingUSDCFees || isLoadingTicketPrice

  // Combine errors - prioritize userOpError, then ticketPriceError
  const error = userOpError || ticketPriceError || usdcFeesError

  return {
    userOp, // The prepared UserOperation (unsigned)
    userOpError,
    isLoadingUserOp,
    usdcFees, // Estimated fees in USDC
    usdcFeesError,
    isLoadingUSDCFees,
    ticketPrice, // Expose fetched ticket price
    ticketPriceError,
    isLoadingTicketPrice,
    isLoading, // Combined loading state
    error, // Combined error state
    calls, // Expose calls for potential debugging or inspection
  }
}
