import { baseMainnetClient, sendCheckAbi, sendCheckAddress } from '@my/wagmi'
import { secp256k1 } from '@noble/curves/secp256k1'
import { useQueryClient } from '@tanstack/react-query'
import { getRandomBytes } from 'expo-crypto'
import { bytesToHex, encodeFunctionData, type Hex, isAddress, erc20Abi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { assert } from './assert'
import { useSendAccount } from './send-accounts'
import { useAccountNonce, useUserOp, type SendAccountCall } from './userop'
import { useSendUserOpMutation } from './sendUserOp'
import { encodeCheckCode } from './checkCode'
import { useUSDCFees } from './useUSDCFees'
import { useMemo, useState, useCallback } from 'react'
import type { PgBytea } from '@my/supabase/database.types'

/**
 * Get the SendCheck contract address for the current chain.
 */
export function getSendCheckAddress(chainId: number): `0x${string}` | null {
  return sendCheckAddress[chainId as keyof typeof sendCheckAddress] ?? null
}

export type EphemeralKeyPair = {
  privateKey: Hex
  address: Hex
}

/**
 * Generates an ephemeral keypair for creating a SendCheck.
 * The private key should be shared with the recipient to claim the check.
 */
export function generateEphemeralKeyPair(): EphemeralKeyPair {
  const privateKeyBytes = getRandomBytes(32)
  // Validate the key is in the valid range for secp256k1 (1 to n-1).
  // While the probability of an invalid key is ~2^-128, we validate for correctness.
  if (!secp256k1.utils.isValidPrivateKey(privateKeyBytes)) {
    return generateEphemeralKeyPair()
  }
  const privateKey = bytesToHex(privateKeyBytes) as Hex
  const account = privateKeyToAccount(privateKey)
  return {
    privateKey,
    address: account.address,
  }
}

export type TokenAmount = {
  token: Hex
  amount: bigint
}

/**
 * Builds the calls for creating a SendCheck with multiple tokens.
 * Used for both fee estimation and actual transaction submission.
 */
function buildSendCheckCalls({
  tokenAmounts,
  ephemeralAddress,
  expiresAt,
  checkAddress,
}: {
  tokenAmounts: TokenAmount[]
  ephemeralAddress: Hex
  expiresAt: bigint
  checkAddress: Hex
}): SendAccountCall[] {
  const calls: SendAccountCall[] = []

  // Add approve calls for each token
  for (const ta of tokenAmounts) {
    calls.push({
      dest: ta.token,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [checkAddress, ta.amount],
      }),
    })
  }

  // Build CheckAmount[] array for the new contract format
  const checkAmounts = tokenAmounts.map((ta) => ({
    token: ta.token,
    amount: ta.amount,
  }))

  // Add createCheck call with CheckAmount[] struct array
  calls.push({
    dest: checkAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: sendCheckAbi,
      functionName: 'createCheck',
      args: [checkAmounts, ephemeralAddress, expiresAt],
    }),
  })

  return calls
}

/**
 * Creates a shareable public preview URL with the check code.
 * @param checkCode - The base32 encoded check code
 */
export function createSendCheckClaimUrl(checkCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://send.app'
  return `${baseUrl}/check/public/${checkCode}`
}

export type SendCheckCreateArgs = {
  webauthnCreds: { raw_credential_id: PgBytea; name: string }[]
}

export type SendCheckCreateResult = {
  claimUrl: string
  checkCode: string
  ephemeralKeyPair: EphemeralKeyPair
  txHash: Hex
}

export type UseSendCheckCreateArgs = {
  tokenAmounts?: TokenAmount[]
  expiresAt?: bigint
}

/**
 * Hook for creating a SendCheck with multiple tokens.
 * Prepares the UserOp upfront to calculate fees, then submits when createCheck is called.
 */
export function useSendCheckCreate({ tokenAmounts, expiresAt }: UseSendCheckCreateArgs = {}) {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])
  const { mutateAsync: sendUserOpAsync, isPending, error } = useSendUserOpMutation()
  const queryClient = useQueryClient()
  const chainId = baseMainnetClient.chain.id
  const checkAddress = getSendCheckAddress(chainId)

  // Generate ephemeral keypair once and keep it stable for fee estimation
  const [ephemeralKeyPair] = useState<EphemeralKeyPair>(() => generateEphemeralKeyPair())

  // Build calls for fee estimation
  const calls = useMemo(() => {
    if (
      !tokenAmounts ||
      tokenAmounts.length === 0 ||
      !checkAddress ||
      expiresAt === undefined ||
      !ephemeralKeyPair
    ) {
      return undefined
    }

    // Validate inputs
    for (const ta of tokenAmounts) {
      if (!ta.token || !isAddress(ta.token) || typeof ta.amount !== 'bigint' || ta.amount <= 0n) {
        return undefined
      }
    }

    return buildSendCheckCalls({
      tokenAmounts,
      ephemeralAddress: ephemeralKeyPair.address,
      expiresAt,
      checkAddress,
    })
  }, [tokenAmounts, checkAddress, expiresAt, ephemeralKeyPair])

  // Prepare UserOp for fee estimation
  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
    refetch: refetchUserOp,
  } = useUserOp({ sender, calls })

  // Calculate USDC fees
  const {
    data: usdcFees,
    error: usdcFeesError,
    isLoading: isLoadingFees,
    refetch: refetchFees,
  } = useUSDCFees({ userOp })

  const isPreparing = isLoadingUserOp || isLoadingFees
  const prepareError = userOpError || usdcFeesError

  const refetchPrepare = useCallback(async () => {
    await refetchUserOp()
    await refetchFees()
  }, [refetchUserOp, refetchFees])

  const createCheck = useCallback(
    async ({ webauthnCreds }: SendCheckCreateArgs): Promise<SendCheckCreateResult> => {
      assert(!!sender, 'Send account not loaded')
      assert(!!checkAddress, 'SendCheck contract not deployed on this chain')
      assert(!!userOp, 'UserOp not prepared')
      assert(webauthnCreds.length > 0, 'No webauthn credentials available')
      assert(!!tokenAmounts && tokenAmounts.length > 0, 'No tokens provided')
      assert(tokenAmounts.length <= 5, 'Too many tokens (max 5)')

      // Submit the user operation
      const receipt = await sendUserOpAsync({ userOp, webauthnCreds })

      // Invalidate nonce query
      await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })

      // Generate check code and claim URL
      const checkCode = encodeCheckCode(ephemeralKeyPair.privateKey)
      const claimUrl = createSendCheckClaimUrl(checkCode)

      return {
        claimUrl,
        checkCode,
        ephemeralKeyPair,
        txHash: receipt.receipt.transactionHash,
      }
    },
    [sender, checkAddress, userOp, tokenAmounts, sendUserOpAsync, queryClient, ephemeralKeyPair]
  )

  return {
    createCheck,
    isPending,
    error,
    isPreparing,
    prepareError,
    userOp,
    usdcFees,
    refetchPrepare,
    isReady: !!sender && !!checkAddress && !!userOp,
    checkAddress,
  }
}
