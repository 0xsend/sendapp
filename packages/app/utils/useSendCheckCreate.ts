import {
  baseMainnetClient,
  sendAccountAbi,
  sendCheckAbi,
  sendCheckAddress,
  tokenPaymasterAddress,
  baseMainnet,
} from '@my/wagmi'
import { useQuery, useMutation, type UseQueryResult, useQueryClient } from '@tanstack/react-query'
import type { UserOperation } from 'permissionless'
import { encodeFunctionData, type Hex, isAddress, erc20Abi } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { assert } from './assert'
import { defaultUserOp } from './userOpConstants'
import { useSendAccount } from './send-accounts'
import { useAccountNonce } from './userop'
import { useSendUserOpMutation } from './sendUserOp'
import { encodeCheckCode } from './checkCode'

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
  const privateKey = generatePrivateKey()
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

export type UseGenerateSendCheckUserOpArgs = {
  sender?: Hex
  tokenAmounts?: TokenAmount[]
  expiresAt?: bigint
  ephemeralAddress?: Hex
  nonce?: bigint
}

/**
 * Generates a user operation for creating a SendCheck with multiple tokens.
 * The user operation includes:
 * 1. Approve the SendCheck contract to spend each token
 * 2. Call createCheck on the SendCheck contract with token arrays
 */
export function useGenerateSendCheckUserOp({
  sender,
  tokenAmounts,
  expiresAt,
  ephemeralAddress,
  nonce,
}: UseGenerateSendCheckUserOpArgs): UseQueryResult<UserOperation<'v0.7'>> {
  const chainId = baseMainnetClient.chain.id
  const checkAddress = getSendCheckAddress(chainId)

  return useQuery({
    queryKey: [
      'generateSendCheckUserOp',
      sender,
      tokenAmounts?.map((ta) => `${ta.token}:${ta.amount}`).join(','),
      String(expiresAt),
      ephemeralAddress,
      String(nonce),
    ],
    enabled:
      !!sender &&
      !!tokenAmounts &&
      tokenAmounts.length > 0 &&
      !!checkAddress &&
      expiresAt !== undefined &&
      !!ephemeralAddress &&
      nonce !== undefined,
    queryFn: (): UserOperation<'v0.7'> => {
      assert(!!sender && isAddress(sender), 'Invalid sender address')
      assert(!!tokenAmounts && tokenAmounts.length > 0, 'No tokens provided')
      assert(tokenAmounts.length <= 5, 'Too many tokens (max 5)')
      assert(!!checkAddress && isAddress(checkAddress), 'SendCheck contract not deployed')
      assert(typeof expiresAt === 'bigint' && expiresAt > 0n, 'Invalid expiration')
      assert(!!ephemeralAddress && isAddress(ephemeralAddress), 'Invalid ephemeral address')
      assert(typeof nonce === 'bigint' && nonce >= 0n, 'Invalid nonce')

      // Validate each token
      for (const ta of tokenAmounts) {
        assert(!!ta.token && isAddress(ta.token), 'Invalid token address')
        assert(typeof ta.amount === 'bigint' && ta.amount > 0n, 'Invalid amount')
      }

      // Build batch calls: approve each token, then createCheck
      const batchCalls: { dest: Hex; value: bigint; data: Hex }[] = []

      // Add approve calls for each token
      for (const ta of tokenAmounts) {
        batchCalls.push({
          dest: ta.token,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [checkAddress, ta.amount],
          }),
        })
      }

      // Extract tokens and amounts arrays
      const tokens = tokenAmounts.map((ta) => ta.token)
      const amounts = tokenAmounts.map((ta) => ta.amount)

      // Add createCheck call with arrays
      batchCalls.push({
        dest: checkAddress,
        value: 0n,
        data: encodeFunctionData({
          abi: sendCheckAbi,
          functionName: 'createCheck',
          args: [tokens, ephemeralAddress, amounts, expiresAt],
        }),
      })

      const callData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [batchCalls],
      })

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

/**
 * Encodes the ephemeral private key and check details into a shareable URL.
 * The recipient can use this URL to claim the check.
 */
export function createSendCheckClaimUrl({
  ephemeralPrivateKey,
  chainId,
}: {
  ephemeralPrivateKey: Hex
  chainId: number
}): string {
  // Encode the private key in base64 for URL safety
  const encodedKey = Buffer.from(ephemeralPrivateKey.slice(2), 'hex').toString('base64url')

  // Create the claim URL - this should point to a claim page
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://send.app'
  const claimUrl = new URL('/check/claim', baseUrl)
  claimUrl.searchParams.set('k', encodedKey)
  claimUrl.searchParams.set('c', chainId.toString())

  return claimUrl.toString()
}

/**
 * Decodes a claim URL back to the ephemeral private key.
 */
export function decodeSendCheckClaimUrl(url: string): {
  ephemeralPrivateKey: Hex
  chainId: number
} | null {
  try {
    const parsedUrl = new URL(url)
    const encodedKey = parsedUrl.searchParams.get('k')
    const chainIdStr = parsedUrl.searchParams.get('c')

    if (!encodedKey || !chainIdStr) return null

    const privateKeyBytes = Buffer.from(encodedKey, 'base64url')
    const ephemeralPrivateKey = `0x${privateKeyBytes.toString('hex')}` as Hex
    const chainId = Number.parseInt(chainIdStr, 10)

    return { ephemeralPrivateKey, chainId }
  } catch {
    return null
  }
}

export type SendCheckCreateArgs = {
  tokenAmounts: TokenAmount[]
  expiresAt: bigint
  webauthnCreds: { raw_credential_id: `\\x${string}`; name: string }[]
}

export type SendCheckCreateResult = {
  claimUrl: string
  checkCode: string
  ephemeralKeyPair: EphemeralKeyPair
  txHash: Hex
}

/**
 * Hook for creating a SendCheck with multiple tokens.
 * Handles ephemeral keypair generation, user operation creation, signing, and submission.
 */
export function useSendCheckCreate() {
  const { data: sendAccount } = useSendAccount()
  const { data: nonce } = useAccountNonce({ sender: sendAccount?.address })
  const { mutateAsync: sendUserOpAsync, isPending, error } = useSendUserOpMutation()
  const queryClient = useQueryClient()
  const chainId = baseMainnetClient.chain.id
  const checkAddress = getSendCheckAddress(chainId)

  const createCheck = async ({
    tokenAmounts,
    expiresAt,
    webauthnCreds,
  }: SendCheckCreateArgs): Promise<SendCheckCreateResult> => {
    assert(!!sendAccount?.address, 'Send account not loaded')
    assert(!!checkAddress, 'SendCheck contract not deployed on this chain')
    assert(nonce !== undefined, 'Account nonce not loaded')
    assert(webauthnCreds.length > 0, 'No webauthn credentials available')
    assert(tokenAmounts.length > 0, 'No tokens provided')
    assert(tokenAmounts.length <= 5, 'Too many tokens (max 5)')

    // Generate ephemeral keypair for the check
    const ephemeralKeyPair = generateEphemeralKeyPair()

    // Build batch calls: approve each token, then createCheck
    const batchCalls: { dest: Hex; value: bigint; data: Hex }[] = []

    // Add approve calls for each token
    for (const ta of tokenAmounts) {
      batchCalls.push({
        dest: ta.token,
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [checkAddress, ta.amount],
        }),
      })
    }

    // Extract tokens and amounts arrays
    const tokens = tokenAmounts.map((ta) => ta.token)
    const amounts = tokenAmounts.map((ta) => ta.amount)

    // Add createCheck call with arrays
    batchCalls.push({
      dest: checkAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: sendCheckAbi,
        functionName: 'createCheck',
        args: [tokens, ephemeralKeyPair.address, amounts, expiresAt],
      }),
    })

    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [batchCalls],
    })

    const paymaster = tokenPaymasterAddress[chainId]
    const userOp: UserOperation<'v0.7'> = {
      ...defaultUserOp,
      sender: sendAccount.address,
      nonce,
      callData,
      paymaster,
      paymasterData: '0x',
      signature: '0x',
    }

    // Submit the user operation
    const receipt = await sendUserOpAsync({ userOp, webauthnCreds })

    // Invalidate nonce query
    await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })

    // Generate claim URL and check code
    const claimUrl = createSendCheckClaimUrl({
      ephemeralPrivateKey: ephemeralKeyPair.privateKey,
      chainId,
    })
    const checkCode = encodeCheckCode(ephemeralKeyPair.privateKey)

    return {
      claimUrl,
      checkCode,
      ephemeralKeyPair,
      txHash: receipt.receipt.transactionHash,
    }
  }

  return {
    createCheck,
    isPending,
    error,
    isReady: !!sendAccount?.address && !!checkAddress && nonce !== undefined,
    checkAddress,
  }
}
