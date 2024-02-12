import { useMutation } from '@tanstack/react-query'
import { assert } from './assert'
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  Hex,
  encodeFunctionData,
  erc20Abi,
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

export type UseUserOpTransferMutationArgs = {
  sender: Hex
  token?: Hex
  amount: bigint
  to: Hex
  validUntil?: number
  initCode: Hex
  nonce: bigint
}

/**
 * Given a Send Account, token, and amount, returns a mutation to send a user op ERC20 or native transfer.
 *
 * @note An undefined token value indicates the native currency.
 * @todo split out the userop generation into a separate hook
 *
 * @param sender The sender of the transfer.
 * @param token The token to transfer, or falsy value for the native currency.
 * @param amount The amount to transfer in the smallest unit of the token.
 * @param to The address to transfer to.
 * @param validUntil The valid until timestamp for the user op.
 * @param initCode The init code for the send account or 0x if account is already initialized.
 * @param nonce The nonce for the user op.
 */
export function useUserOpTransferMutation() {
  return useMutation({
    mutationFn: async ({
      sender,
      token,
      amount,
      to,
      validUntil = USEROP_VALID_UNTIL,
      initCode,
      nonce,
    }: UseUserOpTransferMutationArgs) => {
      assert(isAddress(sender), 'Invalid send account address')
      assert(isAddress(to), 'Invalid to address')
      assert(!token || isAddress(token), 'Invalid token address')
      assert(isHex(initCode), 'Invalid init code')
      assert(typeof amount === 'bigint' && amount > 0n, 'Invalid amount')
      assert(typeof nonce === 'bigint' && nonce >= 0n, 'Invalid nonce')

      if (nonce === 0n) {
        assert(initCode.length > 2, 'Must provide init code for new account')
      }

      if (nonce > 0n) {
        assert(initCode === '0x', 'Init code must be 0x for existing account')
      }

      // GENERATE THE CALLDATA
      let callData: Hex | undefined
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
        callData = encodeFunctionData({
          abi: daimoAccountAbi,
          functionName: 'executeBatch',
          args: [
            [
              {
                dest: token,
                value: 0n,
                data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: 'transfer',
                  args: [to, amount],
                }),
              },
            ],
          ],
        })
      }

      // @todo implement gas estimation
      // @todo implement paymaster and data
      const userOp: UserOperation = {
        sender,
        nonce,
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

      userOp.signature = await signUserOp({
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
            // @todo use to estimate gas
            return data
          }
          throw e
        })

      const hash = await baseMainnetBundlerClient.sendUserOperation({
        userOperation: userOp,
        entryPoint,
      })
      const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
      assert(receipt.success === true, 'Failed to send userOp')
      return receipt
    },
  })
}
