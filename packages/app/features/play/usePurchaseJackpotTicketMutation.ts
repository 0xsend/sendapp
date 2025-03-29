import {
  baseMainnetBundlerClient,
  baseMainnetClient,
  entryPointAddress,
  sendAccountAbi,
  tokenPaymasterAddress,
  // Assuming sendAccountAbi is exported from @my/wagmi
} from '@my/wagmi'
import { baseJackpotAbi, baseJackpotAddress } from '@my/wagmi/contracts/base-jackpot' // Import jackpot contract details
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import {
  getUserOperationHash,
  type UserOperation,
  type GetUserOperationReceiptReturnType,
} from 'permissionless'
import { encodeFunctionData, erc20Abi, type Hex, type Address, isAddress } from 'viem'
import { assert } from '../../utils/assert'
import { byteaToBase64 } from '../../utils/byteaToBase64'
import { throwNiceError } from '../../utils/userop'
import { signUserOpHash } from '../../utils/signUserOp'
import { defaultUserOp } from '../../utils/useUserOpTransferMutation' // Reuse default UserOp values

export type UsePurchaseJackpotTicketMutationArgs = {
  sender: Address // The user's SendAccount address
  tokenAddress: Address // Address of the token used for tickets (e.g., SEND)
  ticketPrice: bigint // Price of one ticket
  referrer?: Address // Optional referrer address
  recipient: Address // Address receiving the ticket (usually the sender)
  nonce: bigint // Nonce for the UserOperation
  version?: number // Signature version
  validUntil?: number // Signature validity
  webauthnCreds: { raw_credential_id: `\\x${string}`; name: string }[] // Credentials for signing
}

/**
 * Hook to purchase a jackpot ticket using Account Abstraction.
 * Handles approving the token spend and calling the purchaseTickets function
 * via a UserOperation using executeBatch.
 */
export function usePurchaseJackpotTicketMutation(): UseMutationResult<
  GetUserOperationReceiptReturnType | undefined,
  Error,
  UsePurchaseJackpotTicketMutationArgs,
  unknown
> {
  return useMutation({
    mutationFn: async ({
      sender,
      tokenAddress,
      ticketPrice,
      referrer = '0x0000000000000000000000000000000000000000', // Default referrer to address(0)
      recipient,
      nonce,
      version,
      validUntil,
      webauthnCreds,
    }: UsePurchaseJackpotTicketMutationArgs) => {
      assert(isAddress(sender), 'Invalid sender address')
      assert(isAddress(tokenAddress), 'Invalid token address')
      assert(ticketPrice > 0n, 'Invalid ticket price')
      assert(isAddress(recipient), 'Invalid recipient address')
      assert(isAddress(referrer), 'Invalid referrer address')
      assert(typeof nonce === 'bigint' && nonce >= 0n, 'Invalid nonce')

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

      // 3. Encode executeBatch call data containing approve and purchase
      const executeBatchCallData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [
          [
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
          ],
        ],
      })

      const chainId = baseMainnetClient.chain.id
      const paymaster = tokenPaymasterAddress[chainId]

      // 4. Construct the UserOperation using default gas limits and paymaster data structure
      // Note: The exact paymasterData format depends on the specific paymaster contract implementation.
      // Here, we assume it requires the token address being used for payment.
      const userOp: UserOperation<'v0.7'> = {
        ...defaultUserOp,
        sender,
        nonce,
        callData: executeBatchCallData,
        paymaster, // Use the token paymaster
        // Encode the token address into paymasterData. Adjust if the paymaster expects a different format.
        paymasterData: tokenAddress,
        signature: '0x', // Placeholder signature, will be replaced after signing
      }

      // 5. Get UserOperation hash
      const entryPoint = entryPointAddress[chainId]
      const userOpHash = getUserOperationHash({
        userOperation: userOp,
        entryPoint,
        chainId,
      })

      // 6. Sign the UserOperation hash
      userOp.signature = await signUserOpHash({
        userOpHash,
        version,
        validUntil,
        allowedCredentials:
          webauthnCreds?.map((c) => ({
            id: byteaToBase64(c.raw_credential_id),
            userHandle: c.name,
          })) ?? [],
      })

      // 7. Send the UserOperation
      try {
        console.log('Sending UserOperation:', userOp)
        const hash = await baseMainnetBundlerClient.sendUserOperation({
          userOperation: userOp,
        })
        console.log('UserOperation hash:', hash)

        // 8. Wait for the receipt
        const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
        console.log('UserOperation receipt:', receipt)
        assert(receipt.success === true, `Failed to purchase ticket. Receipt: ${receipt}`)
        return receipt
      } catch (e) {
        console.error('Error sending UserOperation:', e)
        throwNiceError(e) // Rethrow error after logging
      }
    },
  })
}
