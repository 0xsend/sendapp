import {
  baseMainnetBundlerClient,
  baseMainnetClient,
  entryPointAddress,
  sendAccountAbi,
  tokenPaymasterAbi,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { useMutation } from '@tanstack/react-query'
import {
  getRequiredPrefund,
  getUserOperationHash,
  type GetUserOperationReceiptReturnType,
  type UserOperation,
} from 'permissionless'
import { encodeFunctionData, erc20Abi, isAddress, type Hex, formatUnits } from 'viem'
import { assert } from './assert'
import { USEROP_VALID_UNTIL, USEROP_VERSION, entrypoint, signUserOp } from './userop'

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

  const { verificationGasLimit, callGasLimit, preVerificationGas } =
    await baseMainnetBundlerClient.estimateUserOperationGas({
      userOperation: userOp,
    })

  const increaseBy5Percent = (gasLimit: bigint) => gasLimit + (gasLimit * 500n) / 10000n

  const userOpHash = getUserOperationHash({
    userOperation: {
      ...userOp,
      verificationGasLimit: increaseBy5Percent(verificationGasLimit),
      callGasLimit: increaseBy5Percent(callGasLimit),
      preVerificationGas: increaseBy5Percent(preVerificationGas),
    },
    entryPoint,
    chainId,
  })

  // @todo refactor to a new hook useUserOpGasEstimate
  // const gasPrices = await baseMainnetClient.getGasPrice()
  const requiredPreFund = getRequiredPrefund({
    userOperation: userOp,
    entryPoint: entrypoint.address,
  })
  // calculate the required usdc balance
  const [priceMarkup, , refundPostopCost, , baseFee] = await baseMainnetClient.readContract({
    address: tokenPaymasterAddress[baseMainnetClient.chain.id],
    abi: tokenPaymasterAbi,
    functionName: 'tokenPaymasterConfig',
    args: [],
  })
  const cachedPrice = await baseMainnetClient.readContract({
    address: tokenPaymasterAddress[baseMainnetClient.chain.id],
    abi: tokenPaymasterAbi,
    functionName: 'cachedPrice',
    args: [],
  })
  const preChargeNative = requiredPreFund + BigInt(refundPostopCost) * userOp.maxFeePerGas
  const cachedPriceWithMarkup = (cachedPrice * BigInt(1e26)) / priceMarkup
  const requiredUsdcBalance = await baseMainnetClient.readContract({
    address: tokenPaymasterAddress[baseMainnetClient.chain.id],
    abi: tokenPaymasterAbi,
    functionName: 'weiToToken',
    args: [preChargeNative, cachedPriceWithMarkup],
  })
  console.log('usdc for gas', requiredUsdcBalance, formatUnits(requiredUsdcBalance, 6))
  console.log(
    'total + base fee',
    requiredUsdcBalance + BigInt(baseFee),
    formatUnits(requiredUsdcBalance + BigInt(baseFee), 6)
  )
  // end

  userOp.signature = await signUserOp({
    userOpHash,
    version: USEROP_VERSION,
    validUntil,
  })

  const hash = await baseMainnetBundlerClient.sendUserOperation({
    userOperation: userOp,
  })
  const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
  assert(receipt.success === true, 'Failed to send userOp')
  return receipt
}
