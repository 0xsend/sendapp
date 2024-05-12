import {
  baseMainnetBundlerClient,
  baseMainnetClient,
  entryPointAddress,
  sendAccountAbi,
  tokenPaymasterAbi,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  getRequiredPrefund,
  getUserOperationHash,
  type GetUserOperationReceiptReturnType,
  type UserOperation,
} from 'permissionless'
import { encodeFunctionData, erc20Abi, isAddress, type Hex, formatUnits } from 'viem'
import { assert } from './assert'
import { entrypoint, signUserOp } from './userop'

// default user op with preset gas values that work
export const defaultUserOp: Pick<
  UserOperation<'v0.7'>,
  | 'callGasLimit'
  | 'verificationGasLimit'
  | 'preVerificationGas'
  | 'maxFeePerGas'
  | 'maxPriorityFeePerGas'
  | 'paymasterVerificationGasLimit'
  | 'paymasterPostOpGasLimit'
> = {
  callGasLimit: 100000n,
  verificationGasLimit: 550000n,
  preVerificationGas: 70000n,
  maxFeePerGas: 10000000n,
  maxPriorityFeePerGas: 10000000n,
  paymasterVerificationGasLimit: 150000n,
  paymasterPostOpGasLimit: 50000n,
}

export type UseUserOpTransferMutationArgs = {
  userOp: UserOperation<'v0.7'>
  validUntil?: number
  version?: number
}

/**
 * Given a Send Account, token, and amount, returns a mutation to send a user op ERC20 or native transfer.
 *
 * @param userOp The user operation to send.
 * @param validUntil The valid until timestamp for the user op.
 */
export function useUserOpTransferMutation() {
  return useMutation({
    mutationFn: sendUserOpTransfer,
  })
}

export async function sendUserOpTransfer({
  userOp,
  version,
  validUntil,
}: UseUserOpTransferMutationArgs): Promise<GetUserOperationReceiptReturnType> {
  const chainId = baseMainnetClient.chain.id
  const entryPoint = entryPointAddress[chainId]
  const userOpHash = getUserOperationHash({
    userOperation: userOp,
    entryPoint,
    chainId,
  })

  userOp.signature = await signUserOp({
    userOpHash,
    version,
    validUntil,
  })

  const hash = await baseMainnetBundlerClient.sendUserOperation({
    userOperation: userOp,
  })
  const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
  assert(receipt.success === true, 'Failed to send userOp')
  return receipt
}

export function useUserOpGasEstimate({ userOp }: { userOp?: UserOperation<'v0.7'> }) {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- manually build query key since bigint values are not supported
    queryKey: ['userOpGasEstimate', ...Object.values(userOp ?? {}).map((v) => String(v))],
    enabled: !!userOp,
    queryFn: async () => {
      assert(!!userOp, 'User op is required')
      const feesPerGas = await baseMainnetClient.estimateFeesPerGas()

      console.log('feesPerGas', {
        maxFeePerGas: `${formatUnits(userOp.maxFeePerGas, 9)} gwei`,
        maxPriorityFeePerGas: `${formatUnits(userOp.maxPriorityFeePerGas, 9)} gwei`,
      })
      console.log('feesPerGas [network]', {
        maxFeePerGas: `${formatUnits(feesPerGas.maxFeePerGas ?? 0n, 9)} gwei`,
        maxPriorityFeePerGas: `${formatUnits(feesPerGas.maxPriorityFeePerGas ?? 0n, 9)} gwei`,
      })

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
      if ((feesPerGas.maxFeePerGas ?? 0n) > 0) {
        const maxFeePerGas = feesPerGas.maxFeePerGas ?? 0n
        const preChargeNative = requiredPreFund + BigInt(refundPostopCost) * maxFeePerGas
        const cachedPriceWithMarkup = (cachedPrice * BigInt(1e26)) / priceMarkup
        const requiredUsdcBalance = await baseMainnetClient.readContract({
          address: tokenPaymasterAddress[baseMainnetClient.chain.id],
          abi: tokenPaymasterAbi,
          functionName: 'weiToToken',
          args: [preChargeNative, cachedPriceWithMarkup],
        })
        console.log(
          'usdc for gas [network]',
          requiredUsdcBalance,
          formatUnits(requiredUsdcBalance, 6)
        )
        console.log(
          'total + base fee [network]',
          requiredUsdcBalance + BigInt(baseFee),
          formatUnits(requiredUsdcBalance + BigInt(baseFee), 6)
        )
      }

      return {
        userOp: {
          maxFeePerGas: userOp.maxFeePerGas,
          maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
        },
        networkGasEstimate: {
          maxFeePerGas: feesPerGas.maxFeePerGas,
          maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
        },
        preChargeNative,
        cachedPriceWithMarkup,
        requiredUsdcBalance,
      }
    },
  })
}

export function useGenerateTransferUserOp({
  sender,
  to,
  token,
  amount,
  nonce,
}: {
  sender?: Hex
  to?: Hex
  token?: Hex
  amount?: bigint
  nonce?: bigint
}): UseQueryResult<UserOperation<'v0.7'>> {
  return useQuery({
    queryKey: ['generateTransferUserOp', sender, to, token, String(amount), String(nonce)],
    enabled: !!sender && !!to && amount !== undefined && nonce !== undefined,
    queryFn: () => {
      assert(!!sender && isAddress(sender), 'Invalid send account address')
      assert(!!to && isAddress(to), 'Invalid to address')
      assert(!token || isAddress(token), 'Invalid token address')
      assert(typeof amount === 'bigint' && amount > 0n, 'Invalid amount')
      assert(typeof nonce === 'bigint' && nonce >= 0n, 'Invalid nonce')

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

      const chainId = baseMainnetClient.chain.id
      const paymaster = tokenPaymasterAddress[chainId]
      const userOp: UserOperation<'v0.7'> = {
        ...defaultUserOp,
        sender,
        nonce,
        callData,
        paymaster,
        paymasterData: '0x',
        signature: '0x',
      }
      return userOp
    },
  })
}
