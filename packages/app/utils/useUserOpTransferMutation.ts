import { useMutation } from '@tanstack/react-query'
import { SendAccountQuery } from './send-accounts/useSendAccounts'
import { useSendAccountInitCode } from './useSendAccountInitCode'
import { assert } from './assert'
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  encodeFunctionData,
  isAddress,
  isHex,
} from 'viem'
import {
  baseMainnetBundlerClient,
  baseMainnetClient,
  daimoAccountAbi,
  entryPointAbi,
  entryPointAddress,
} from '@my/wagmi'
import { UserOperation, getUserOperationHash } from 'permissionless'
import { USEROP_VALID_UNTIL, USEROP_VERSION, signUserOp } from './userop'

/**
 * Given a Send Account, token, and amount, returns a mutation to send a user op ERC20 or native transfer.
 *
 * @note An undefined token value indicates the native currency.
 *
 * @param sendAccount The send account to use for the transfer.
 * @param token The token to transfer, or falsy value for the native currency.
 * @param amount The amount to transfer in the smallest unit of the token.
 * @param to The address to transfer to.
 * @param validUntil The valid until timestamp for the user op.
 */
export function useUserOpTransferMutation({
  sendAccount,
  token,
  amount,
  to,
  validUntil = USEROP_VALID_UNTIL,
}: {
  sendAccount: SendAccountQuery
  token: `0x${string}` | undefined
  amount: bigint
  to: `0x${string}`
  validUntil?: number
}) {
  // need init code in case this is a new account
  const { data: initCode, isSuccess: initCodeIsSuccess } = useSendAccountInitCode({ sendAccount })

  // GENERATE THE CALLDATA
  let callData: `0x${string}` | undefined
  if (!token) {
    callData = encodeFunctionData({
      abi: daimoAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          {
            dest: to,
            value: amount,
            data: '0x',
          },
        ],
      ],
    })
  } else {
    // @todo implement ERC20 transfer
  }

  return useMutation({
    mutationFn: async () => {
      assert(isAddress(sendAccount.address), 'Invalid send account address')
      assert(initCodeIsSuccess && isHex(initCode), 'Invalid init code')
      assert(isHex(callData), 'Invalid call data')
      assert(!!amount && amount > 0n, 'No amount')
      assert(isAddress(to), 'Invalid to address')

      // @todo lookup nonce
      // @todo implement gas estimation
      // @todo implement paymaster and data
      const userOp: UserOperation = {
        sender: sendAccount?.address,
        nonce: 0n,
        initCode,
        callData,
        callGasLimit: 300000n,
        verificationGasLimit: 700000n,
        preVerificationGas: 300000n,
        maxFeePerGas: 1000000n,
        maxPriorityFeePerGas: 1000000n,
        paymasterAndData: '0x',
        signature: '0x',
      }

      const chainId = baseMainnetClient.chain.id
      const entryPoint = entryPointAddress[chainId]
      const userOpHash = getUserOperationHash({
        userOperation: userOp,
        entryPoint,
        chainId,
      })

      const signature = await signUserOp({
        userOpHash,
        version: USEROP_VERSION,
        validUntil,
      })

      // [simulateValidation](https://github.com/eth-infinitism/account-abstraction/blob/187613b0172c3a21cf3496e12cdfa24af04fb510/contracts/interfaces/IEntryPoint.sol#L152)
      await baseMainnetClient
        .simulateContract({
          address: entryPoint,
          functionName: 'simulateValidation',
          abi: entryPointAbi,
          args: [userOp],
        })
        .catch((e: ContractFunctionExecutionError) => {
          const cause: ContractFunctionRevertedError = e.cause
          if (cause.data?.errorName === 'ValidationResult') {
            const data = cause.data
            if ((data.args?.[0] as { sigFailed: boolean }).sigFailed) {
              throw new Error('Signature failed')
            }
            // console.log('ValidationResult', data)
            return data
          }
          throw e
        })

      // [simulateHandleOp](https://github.com/eth-infinitism/account-abstraction/blob/187613b0172c3a21cf3496e12cdfa24af04fb510/contracts/interfaces/IEntryPoint.sol#L203)
      await baseMainnetClient
        .simulateContract({
          address: entryPoint,
          functionName: 'simulateHandleOp',
          abi: entryPointAbi,
          args: [
            userOp,
            '0x0000000000000000000000000000000000000000',
            '0x', // target calldata
          ],
        })
        .catch((e: ContractFunctionExecutionError) => {
          const cause: ContractFunctionRevertedError = e.cause
          if (cause.data?.errorName === 'ExecutionResult') {
            const data = cause.data
            if ((data.args?.[0] as { success: boolean }).success) {
              throw new Error('Handle op failed')
            }
            // console.log('ExecutionResult', data)
            // TODO: use to estimate gas
            return data
          }
          throw e
        })

      const hash = await baseMainnetBundlerClient.sendUserOperation({
        userOperation: userOp,
        entryPoint,
      })
      const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
      if (receipt.success !== true) {
        throw new Error('Failed to send userOp')
      }
      return receipt.success
    },
  })
}
