import {
  sendBaseMainnetBundlerClient,
  entryPointAddress,
  sendAccountAbi,
  sendTokenAbi,
  sendVerifierAbi,
  sendVerifierProxyAddress,
  tokenPaymasterAddress,
  usdcAddress,
} from '@my/wagmi'
import { queryOptions } from '@tanstack/react-query'
import { wMulDown } from 'app/utils/math'
import debugBase from 'debug'
import {
  getAccountNonce,
  PaymasterValidationRevertedError,
  SendUserOperationError,
  type UserOperation,
} from 'permissionless'
import { useMemo } from 'react'
import {
  concat,
  encodeFunctionData,
  getContract,
  InvalidParamsRpcError,
  isAddress,
  isHex,
  maxUint256,
  pad,
  parseUnits,
  RpcRequestError,
  toHex,
  type Address,
  type Hex,
} from 'viem'
import { useEstimateFeesPerGas } from 'wagmi'
import { useQuery as useWagmiQuery, type UseQueryReturnType } from 'wagmi/query'
import { assert } from './assert'
import { throwIf } from './throwIf'
import {
  defaultUserOp,
  ERR_MSG_NOT_ENOUGH_USDC,
  generateChallenge,
  USEROP_KEY_SLOT,
  USEROP_SALT,
  USEROP_VERSION,
} from './userOpConstants'
import { baseMainnetClient } from './viem'

const debug = debugBase('app:utils:userop')

export type SendAccountCall = {
  dest: `0x${string}`
  value: bigint
  data: `0x${string}`
}

/**
 * Verifies a signature against a challenge and public key onchain. Signature is encoded where the first byte is the
 * key-slot and the rest is the encoded signature struct.
 *
 * @param challenge - The challenge to verify the signature against
 * @param signature - The signature to verify
 * @param publicKey - The public key to verify the signature against
 * @returns A promise that resolves to a boolean indicating whether the signature is valid
 *
 * @see signChallenge
 */
export async function verifySignature(
  challenge: Hex,
  signature: Hex,
  publicKey: [Hex, Hex]
): Promise<boolean> {
  const x = BigInt(publicKey[0])
  const y = BigInt(publicKey[1])
  const verifier = getContract({
    abi: sendVerifierAbi,
    client: baseMainnetClient,
    address: sendVerifierProxyAddress[baseMainnetClient.chain.id],
  })
  return await verifier.read.verifySignature([challenge, signature, x, y])
}

// Export constants from userOpConstants
export { generateChallenge, USEROP_KEY_SLOT, USEROP_SALT, USEROP_VERSION }

export function getSendAccountCreateArgs(
  publicKey: [Hex, Hex]
): readonly [number, readonly [`0x${string}`, `0x${string}`], readonly SendAccountCall[], bigint] {
  const initCalls = [
    // approve USDC to paymaster
    {
      dest: usdcAddress[baseMainnetClient.chain.id],
      value: 0n,
      data: encodeFunctionData({
        abi: sendTokenAbi,
        functionName: 'approve',
        args: [tokenPaymasterAddress[baseMainnetClient.chain.id], maxUint256],
      }),
    },
  ]

  return [
    USEROP_KEY_SLOT, // key slot
    publicKey, // public key
    initCalls, // init calls
    USEROP_SALT, // salt
  ]
}

const useAccountNonceQueryKey = 'accountNonce'

export function useAccountNonce({
  sender,
}: {
  sender: Address | undefined
}): UseQueryReturnType<bigint, Error> {
  return useWagmiQuery({
    queryKey: [useAccountNonceQueryKey, sender],
    enabled: sender !== undefined,
    queryFn: async () => {
      assert(sender !== undefined, 'No sender found')
      const nonce = await getAccountNonce(baseMainnetClient, {
        sender,
        entryPoint: entryPointAddress[baseMainnetClient.chain.id],
      })
      return nonce
    },
    refetchInterval: 1000 * 60 * 1, // refetch every minute
  })
}

useAccountNonce.queryKey = useAccountNonceQueryKey

/**
 * Generates and prepares a UserOperation encoding the calls into the calldata.
 */
function userOpQueryOptions({
  sender,
  nonce,
  calls,
  callGasLimit,
  chainId,
  maxFeePerGas,
  maxPriorityFeePerGas,
  paymaster,
  paymasterVerificationGasLimit,
  paymasterPostOpGasLimit,
  paymasterData,
  skipGasEstimation,
}: {
  sender: Hex | undefined
  nonce: bigint | undefined
  calls: SendAccountCall[] | undefined
  callGasLimit: bigint | undefined
  chainId: number | undefined
  maxFeePerGas: bigint | undefined
  maxPriorityFeePerGas: bigint | undefined
  paymaster?: Hex
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
  paymasterData?: Hex
  skipGasEstimation?: boolean
}) {
  return queryOptions({
    queryKey: [
      'userop',
      {
        sender,
        nonce,
        calls,
        callGasLimit,
        chainId,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymaster,
        paymasterVerificationGasLimit,
        paymasterPostOpGasLimit,
        paymasterData,
        skipGasEstimation,
      },
    ] as const,
    retry(failureCount, error) {
      debug('userOpQueryOptions retry', `failureCount=${failureCount}`, error)
      if (error) {
        if (error.message === ERR_MSG_NOT_ENOUGH_USDC) {
          return false
        }
      }
      return failureCount < 3
    },
    queryFn: async ({
      queryKey: [
        ,
        {
          sender,
          nonce,
          calls,
          callGasLimit,
          chainId,
          maxFeePerGas,
          maxPriorityFeePerGas,
          paymaster,
          paymasterVerificationGasLimit,
          paymasterPostOpGasLimit,
          paymasterData,
          skipGasEstimation,
        },
      ],
    }) => {
      assert(sender !== undefined, 'No sender found')
      assert(nonce !== undefined, 'No nonce found')
      assert(calls !== undefined, 'No calls found')
      assert(chainId !== undefined, 'No chainId found')
      assert(maxFeePerGas !== undefined, 'No max fee per gas found')
      assert(maxPriorityFeePerGas !== undefined, 'No max priority fee per gas found')

      debug('useUserOpGasEstimate', {
        sender,
        nonce,
        calls,
        callGasLimit,
        chainId,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymaster,
        paymasterVerificationGasLimit,
        paymasterPostOpGasLimit,
        paymasterData,
      })

      const callData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [calls],
      })

      // For ERC-7677, skip paymaster defaults as they'll be provided by the paymaster
      const paymasterDefaults = skipGasEstimation
        ? {}
        : {
            paymaster: paymaster !== undefined ? paymaster : tokenPaymasterAddress[chainId],
            paymasterVerificationGasLimit:
              paymasterVerificationGasLimit !== undefined
                ? paymasterVerificationGasLimit
                : defaultUserOp.paymasterVerificationGasLimit,
            paymasterPostOpGasLimit:
              paymasterPostOpGasLimit !== undefined
                ? paymasterPostOpGasLimit
                : defaultUserOp.paymasterPostOpGasLimit,
            paymasterData:
              paymasterData !== undefined ? paymasterData : defaultUserOp.paymasterData,
          }

      // For ERC-7677, skip defaults - gas limits will be estimated by paymaster
      const userOp: UserOperation<'v0.7'> = skipGasEstimation
        ? {
            sender,
            nonce,
            callData,
            maxFeePerGas,
            maxPriorityFeePerGas,
            signature: '0x',
            // Provide minimal gas limits - ERC-7677 paymaster will replace these
            callGasLimit: 0n,
            verificationGasLimit: 0n,
            preVerificationGas: 0n,
          }
        : {
            ...defaultUserOp,
            ...paymasterDefaults,
            callGasLimit: callGasLimit ?? defaultUserOp.callGasLimit,
            maxFeePerGas,
            maxPriorityFeePerGas,
            sender,
            nonce,
            callData,
            signature: '0x',
          }

      if (!callGasLimit && !skipGasEstimation) {
        // only estimate the gas for the call
        await sendBaseMainnetBundlerClient
          .estimateUserOperationGas({
            userOperation: userOp,
          })
          .catch((e) => {
            throwNiceError(e)
          })
          .then(({ callGasLimit: cgl, preVerificationGas }) => {
            userOp.callGasLimit = cgl

            const preVerificationGasWithBuffer = wMulDown(
              preVerificationGas,
              parseUnits('1.25', 18)
            ) // 125%

            // if estimated preVerificationGas with buffers is higher than default, use it instead
            if (preVerificationGasWithBuffer > userOp.preVerificationGas) {
              userOp.preVerificationGas = preVerificationGasWithBuffer
            }
          })
      }

      debug('useUserOpGasEstimate', { userOp })

      return userOp
    },
  })
}

/**
 * Generates and prepares a UserOperation encoding the calls into the calldata. If no sender or calls are provided, it will
 * pause the query. It relies on the useAccountNonce hook to get the nonce and the useEstimateFeesPerGas hook to get the
 * gas fees.
 *
 * @param skipGasEstimation - Skip gas estimation for ERC-7677 paymaster operations (default: false)
 * TODO: add nonce to the userop params, until then you must manually invalidate the nonce query
 */
export function useUserOp({
  sender,
  calls,
  callGasLimit,
  paymaster,
  paymasterVerificationGasLimit,
  paymasterPostOpGasLimit,
  paymasterData,
  skipGasEstimation = false,
  chainId = baseMainnetClient.chain.id,
}: {
  sender: Address | undefined
  callGasLimit?: bigint | undefined
  calls: SendAccountCall[] | undefined
  paymaster?: Hex
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
  paymasterData?: Hex
  skipGasEstimation?: boolean
  chainId?: keyof typeof entryPointAddress
}): UseQueryReturnType<UserOperation<'v0.7'>, Error> {
  const { data: nonce, error: nonceError, isLoading: isLoadingNonce } = useAccountNonce({ sender })
  const {
    data: feesPerGas,
    error: gasFeesError,
    isLoading: isLoadingFeesPerGas,
  } = useEstimateFeesPerGas({
    chainId,
    query: {
      refetchInterval: 1000 * 60 * 1, // refetch every minute
    },
  })

  const enabled =
    sender !== undefined &&
    nonce !== undefined &&
    calls !== undefined &&
    !isLoadingNonce &&
    !isLoadingFeesPerGas
  const { maxFeePerGas, maxPriorityFeePerGas } = feesPerGas ?? {}
  const uopQo = useMemo(
    () =>
      userOpQueryOptions({
        sender,
        nonce,
        calls,
        callGasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        chainId,
        paymaster,
        paymasterVerificationGasLimit,
        paymasterPostOpGasLimit,
        paymasterData,
        skipGasEstimation,
      }),
    [
      sender,
      nonce,
      calls,
      callGasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      chainId,
      paymaster,
      paymasterVerificationGasLimit,
      paymasterPostOpGasLimit,
      paymasterData,
      skipGasEstimation,
    ]
  )
  const queryFn: typeof uopQo.queryFn = useMemo(
    () => async (args) => {
      throwIf(gasFeesError)
      throwIf(nonceError)
      assert(!!uopQo?.queryFn, 'No queryFn found')
      return uopQo?.queryFn(args)
    },
    [uopQo, gasFeesError, nonceError]
  )

  return useWagmiQuery({
    ...uopQo,
    enabled,
    queryFn,
  })
}

/**
 * User operation errors are not very helpful and confusing. This function converts them to something more helpful.
 */
export function throwNiceError(e: Error & { cause?: Error }): never {
  const cause = e.cause ?? e
  switch (true) {
    case cause instanceof SendUserOperationError: {
      switch (cause.details) {
        case 'Invalid UserOp signature or paymaster signature':
          throw new Error('Invalid Passkey Authorization')
        case 'already expired':
          throw new Error('User operation or paymaster has expired')
        default:
          throw e
      }
    }
    case cause instanceof PaymasterValidationRevertedError: {
      switch (cause.details) {
        case `FailedOpWithRevert(0,"AA33 reverted",Error(ERC20: transfer amount exceeds balance))`:
          throw new Error(ERR_MSG_NOT_ENOUGH_USDC)
        default:
          throw e
      }
    }
    case cause instanceof RpcRequestError: {
      const details = cause.details || ''

      if (details.toLowerCase().includes('return amount is not enough')) {
        throw new Error('Slippage exceeded, please try again or increase max slippage')
      }

      switch (details) {
        case 'execution reverted: ERC20: transfer amount exceeds balance':
          throw new Error('Not enough funds')
        case 'execution reverted: revert: ERC20: transfer amount exceeds balance':
          throw new Error('Not enough funds')
        case 'FailedOp(0,"AA25 invalid account nonce")':
          throw new Error('Invalid nonce, please try again')
        default:
          throw e
      }
    }
    case cause instanceof InvalidParamsRpcError: {
      switch (true) {
        case cause.details?.includes('preVerificationGas too low'):
          throw new Error('Trade failed, try again')
        default:
          throw e
      }
    }
    default:
      throw e
  }
}

export function packUserOp(uop: UserOperation<'v0.7'>): {
  sender: Address
  nonce: bigint
  initCode: Hex
  callData: Hex
  accountGasLimits: Hex
  preVerificationGas: bigint
  gasFees: Hex
  paymasterAndData: Hex
  signature: Hex
} {
  let paymasterAndData: Hex
  if (!uop.paymaster) {
    paymasterAndData = '0x'
  } else {
    if (!uop.paymasterVerificationGasLimit || !uop.paymasterPostOpGasLimit) {
      throw new Error('paymaster with no gas limits')
    }
    paymasterAndData = packPaymasterData({
      paymaster: uop.paymaster,
      paymasterVerificationGasLimit: uop.paymasterVerificationGasLimit,
      paymasterPostOpGasLimit: uop.paymasterPostOpGasLimit,
      paymasterData: uop.paymasterData,
    })
  }
  return {
    sender: uop.sender,
    nonce: BigInt(uop.nonce),
    initCode: uop.factory && uop.factoryData ? concat([uop.factory, uop.factoryData]) : '0x',
    callData: uop.callData,
    accountGasLimits: concat([
      pad(toHex(uop.verificationGasLimit), { size: 16 }),
      pad(toHex(uop.callGasLimit), { size: 16 }),
    ]),
    preVerificationGas: BigInt(uop.preVerificationGas),
    gasFees: concat([
      pad(toHex(uop.maxPriorityFeePerGas), { size: 16 }),
      pad(toHex(uop.maxFeePerGas), { size: 16 }),
    ]),
    paymasterAndData,
    signature: uop.signature,
  }
}

export function packPaymasterData({
  paymaster,
  paymasterVerificationGasLimit,
  paymasterPostOpGasLimit,
  paymasterData,
}: {
  paymaster: Hex
  paymasterVerificationGasLimit: bigint
  paymasterPostOpGasLimit: bigint
  paymasterData?: Hex
}): Hex {
  assert(isHex(paymaster), 'paymaster is not a valid hex string')
  return isAddress(paymaster)
    ? concat([
        paymaster,
        pad(toHex(paymasterVerificationGasLimit || 0n), { size: 16 }),
        pad(toHex(paymasterPostOpGasLimit || 0n), { size: 16 }),
        paymasterData ?? '0x',
      ])
    : '0x'
}
