import {
  baseMainnetBundlerClient,
  baseMainnetClient,
  entryPointAddress,
  sendAccountAbi,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { useMutation } from '@tanstack/react-query'
import {
  getUserOperationHash,
  type GetUserOperationReceiptReturnType,
  type UserOperation,
} from 'permissionless'
import { encodeFunctionData, erc20Abi, isAddress, type Hex } from 'viem'
import { assert } from './assert'
import { USEROP_VALID_UNTIL, USEROP_VERSION, signUserOp } from './userop'

export type UseUserOpTransferMutationArgs = {
  sender: Hex
  token?: Hex
  amount: bigint
  to: Hex
  validUntil?: number
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
 * @param nonce The nonce for the user op.
 */
export function useUserOpTransferMutation() {
  return useMutation({
    mutationFn: sendUserOpTransfer,
  })
}

export async function sendUserOpTransfer({
  sender,
  token,
  amount,
  to,
  validUntil = USEROP_VALID_UNTIL,
  nonce,
}: UseUserOpTransferMutationArgs): Promise<GetUserOperationReceiptReturnType> {
  assert(isAddress(sender), 'Invalid send account address')
  assert(isAddress(to), 'Invalid to address')
  assert(!token || isAddress(token), 'Invalid token address')
  assert(typeof amount === 'bigint' && amount > 0n, 'Invalid amount')
  assert(typeof nonce === 'bigint' && nonce >= 0n, 'Invalid nonce')

  // GENERATE THE CALLDATA
  let callData: Hex | undefined
  if (!token) {
    callData = encodeFunctionData({
      abi: sendAccountAbi,
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
      abi: sendAccountAbi,
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

  const gasPrices = await baseMainnetClient.getGasPrice()

  // @todo implement gas estimation
  // @todo implement paymaster and data
  const chainId = baseMainnetClient.chain.id
  const entryPoint = entryPointAddress[chainId]
  const paymaster = tokenPaymasterAddress[chainId]
  const userOp: UserOperation<'v0.7'> = {
    sender,
    nonce,
    callData,
    callGasLimit: 100000n,
    verificationGasLimit: 550000n,
    preVerificationGas: 70000n,
    maxFeePerGas: 10000000n,
    maxPriorityFeePerGas: 10000000n,
    paymaster,
    paymasterVerificationGasLimit: 150000n,
    paymasterPostOpGasLimit: 50000n,
    paymasterData: '0x',
    signature: '0x',
  }

  const gasEstimate = await baseMainnetBundlerClient.estimateUserOperationGas({
    userOperation: userOp,
  })

  console.log('userOp', userOp)
  console.log('gasPrices', gasPrices)
  console.log('gasEstimate', gasEstimate)

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

  // const gasParameters = await baseMainnetBundlerClient.estimateUserOperationGas({
  //   userOperation: userOp,
  // })

  // console.log('gasParameters', gasParameters)

  // [simulateValidation](https://github.com/eth-infinitism/account-abstraction/blob/187613b0172c3a21cf3496e12cdfa24af04fb510/contracts/interfaces/IEntryPoint.sol#L152)
  // await baseMainnetClient
  //   .simulateContract({
  //     address: entryPoint,
  //     functionName: 'simulateValidation',
  //     abi: entryPointAbi,
  //     args: [userOp],
  //   })
  //   .catch((e: ContractFunctionExecutionError) => {
  //     const cause: ContractFunctionRevertedError = e.cause
  //     if (cause.data?.errorName === 'ValidationResult') {
  //       const data = cause.data
  //       if ((data.args?.[0] as { sigFailed: boolean }).sigFailed) {
  //         throw new Error('Signature failed')
  //       }
  //       // console.log('ValidationResult', data)
  //       return data
  //     }
  //     throw e
  //   })

  // [simulateHandleOp](https://github.com/eth-infinitism/account-abstraction/blob/187613b0172c3a21cf3496e12cdfa24af04fb510/contracts/interfaces/IEntryPoint.sol#L203)
  // await baseMainnetClient
  //   .simulateContract({
  //     address: entryPoint,
  //     functionName: 'simulateHandleOp',
  //     abi: entryPointAbi,
  //     args: [
  //       userOp,
  //       '0x0000000000000000000000000000000000000000',
  //       '0x', // target calldata
  //     ],
  //   })
  //   .catch((e: ContractFunctionExecutionError) => {
  //     const cause: ContractFunctionRevertedError = e.cause
  //     if (cause.data?.errorName === 'ExecutionResult') {
  //       const data = cause.data
  //       if ((data.args?.[0] as { success: boolean }).success) {
  //         throw new Error('Handle op failed')
  //       }
  //       // console.log('ExecutionResult', data)
  //       // @todo use to estimate gas
  //       return data
  //     }
  //     throw e
  //   })

  const hash = await baseMainnetBundlerClient.sendUserOperation({
    userOperation: userOp,
  })
  const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
  assert(receipt.success === true, 'Failed to send userOp')
  return receipt
}
