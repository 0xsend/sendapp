import {
  baseMainnetBundlerClient,
  entryPointAddress,
  sendAccountAbi,
  sendTokenAbi,
  sendVerifierAbi,
  sendVerifierProxyAddress,
  tokenPaymasterAddress,
  usdcAddress,
} from '@my/wagmi'
import { queryOptions } from '@tanstack/react-query'
import {
  EstimateUserOperationGasError,
  getAccountNonce,
  PaymasterValidationRevertedError,
  SendUserOperationError,
  type UserOperation,
} from 'permissionless'
import {
  bytesToHex,
  concat,
  encodeFunctionData,
  getContract,
  hexToBytes,
  isHex,
  maxUint256,
  numberToBytes,
  RpcRequestError,
  type Address,
  type Hex,
} from 'viem'
import { useEstimateFeesPerGas } from 'wagmi'
import { useQuery as useWagmiQuery, type UseQueryReturnType } from 'wagmi/query'
import { assert } from './assert'
import { throwIf } from './throwIf'
import { defaultUserOp } from './useUserOpTransferMutation'
import { baseMainnetClient } from './viem'
import { useMemo } from 'react'
import debugBase from 'debug'

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

export const USEROP_VERSION = 1
export const USEROP_KEY_SLOT = 0
export const USEROP_SALT = 0n

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

/**
 * Generates a SendAccount challenge from a user operation hash.
 */
export function generateChallenge({
  userOpHash,
  version = USEROP_VERSION,
  validUntil,
}: { userOpHash: Hex; version?: number; validUntil: number }): {
  challenge: Hex
  versionBytes: Uint8Array
  validUntilBytes: Uint8Array
} {
  const opHash = hexToBytes(userOpHash)
  const versionBytes = numberToBytes(version, { size: 1 })
  const validUntilBytes = numberToBytes(validUntil, { size: 6 })
  // 1 byte version + 6 bytes validUntil + 32 bytes opHash
  const challenge = bytesToHex(concat([versionBytes, validUntilBytes, opHash]))
  assert(isHex(challenge) && challenge.length === 80, 'Invalid challenge')
  return {
    challenge,
    versionBytes,
    validUntilBytes,
  }
}

const useAccountNonceQueryKey = 'accountNonce'

export function useAccountNonce({
  sender,
}: { sender: Address | undefined }): UseQueryReturnType<bigint, Error> {
  return useWagmiQuery({
    queryKey: [useAccountNonceQueryKey, sender],
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
  chainId,
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  sender: Hex | undefined
  nonce: bigint | undefined
  calls: SendAccountCall[] | undefined
  chainId: number | undefined
  maxFeePerGas: bigint | undefined
  maxPriorityFeePerGas: bigint | undefined
}) {
  return queryOptions({
    queryKey: [
      'userop',
      { sender, nonce, calls, chainId, maxFeePerGas, maxPriorityFeePerGas },
    ] as const,
    queryFn: async ({
      queryKey: [, { sender, nonce, calls, chainId, maxFeePerGas, maxPriorityFeePerGas }],
    }) => {
      assert(sender !== undefined, 'No sender found')
      assert(nonce !== undefined, 'No nonce found')
      assert(calls !== undefined, 'No calls found')
      assert(chainId !== undefined, 'No chainId found')
      assert(maxFeePerGas !== undefined, 'No max fee per gas found')
      assert(maxPriorityFeePerGas !== undefined, 'No max priority fee per gas found')

      const callData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [calls],
      })

      const paymaster = tokenPaymasterAddress[chainId]
      const _userOp: UserOperation<'v0.7'> = {
        ...defaultUserOp,
        maxFeePerGas,
        maxPriorityFeePerGas,
        sender,
        nonce,
        callData,
        paymaster,
        paymasterData: '0x',
        signature: '0x',
      }

      // only estimate the gas for the call
      const { callGasLimit } = await baseMainnetBundlerClient
        .estimateUserOperationGas({
          userOperation: _userOp,
        })
        .catch((e) => {
          if (e instanceof EstimateUserOperationGasError) {
            throwNiceError(e)
          }
          throw e
        })

      const userOp = { ..._userOp, callGasLimit }
      // const userOp = { ..._userOp, callGasLimit: _userOp.callGasLimit }

      debug('useUserOpGasEstimate', { userOp, callGasLimit })

      return userOp
    },
  })
}

/**
 * Generates and prepares a UserOperation encoding the calls into the calldata. If no sender or calls are provided, it will
 * pause the query. It relies on the useAccountNonce hook to get the nonce and the useEstimateFeesPerGas hook to get the
 * gas fees.
 */
export function useUserOp({
  sender,
  calls,
}: { sender: Address | undefined; calls?: SendAccountCall[] | undefined }): UseQueryReturnType<
  UserOperation<'v0.7'>,
  Error
> {
  const chainId = baseMainnetClient.chain.id
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
    () => userOpQueryOptions({ sender, nonce, calls, maxFeePerGas, maxPriorityFeePerGas, chainId }),
    [sender, nonce, calls, maxFeePerGas, maxPriorityFeePerGas, chainId]
  )
  const queryFn: typeof uopQo.queryFn = useMemo(
    () => async (args) => {
      throwIf(gasFeesError)
      throwIf(nonceError)
      assert(!!uopQo?.queryFn, 'No queryFn found')
      return uopQo?.queryFn(args)
    },
    [uopQo?.queryFn, gasFeesError, nonceError]
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
export function throwNiceError(e: Error) {
  const cause = e.cause
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
          throw new Error('Not enough USDC to cover transaction fees')
        default:
          throw e
      }
    }
    case cause instanceof RpcRequestError: {
      switch (cause.details) {
        case 'execution reverted: revert: ERC20: transfer amount exceeds balance':
          throw new Error('Not enough funds')
        case 'FailedOp(0,"AA25 invalid account nonce")':
          throw new Error('Invalid nonce, please try again')
        default:
          throw e
      }
    }
    default:
      throw e
  }
}
