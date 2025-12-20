import {
  baseMainnetClient,
  sendAccountAbi,
  sendCheckAbi,
  sendCheckAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserOperation } from 'permissionless'
import { encodeFunctionData, type Hex, keccak256, encodePacked, zeroAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { assert } from './assert'
import { defaultUserOp } from './userOpConstants'
import { useSendAccount } from './send-accounts'
import { useAccountNonce } from './userop'
import { useSendUserOpMutation } from './sendUserOp'
import { decodeCheckCode, isValidCheckCodeFormat } from './checkCode'

/**
 * Get the SendCheck contract address for the current chain.
 */
function getSendCheckAddress(chainId: number): Hex | null {
  return sendCheckAddress[chainId as keyof typeof sendCheckAddress] ?? null
}

/**
 * Parse check code input and return the private key.
 * Returns null if the code is invalid.
 */
export function parseCheckCode(input: string): Hex | null {
  const trimmed = input.trim()
  if (isValidCheckCodeFormat(trimmed)) {
    return decodeCheckCode(trimmed)
  }
  return null
}

export type TokenAmount = {
  token: Hex
  amount: bigint
}

export type CheckDetails = {
  ephemeralAddress: Hex
  from: Hex
  tokenAmounts: TokenAmount[]
  expiresAt: bigint
  isExpired: boolean
  isClaimed: boolean
}

/**
 * Hook to fetch check details from the contract using a check code.
 * Returns null if check doesn't exist or has been claimed.
 */
export function useCheckDetails(checkCode: string | null) {
  const chainId = baseMainnetClient.chain.id
  const checkAddress = getSendCheckAddress(chainId)

  const privateKey = checkCode ? parseCheckCode(checkCode) : null

  return useQuery({
    queryKey: ['checkDetails', checkCode],
    enabled: !!privateKey && !!checkAddress,
    queryFn: async (): Promise<CheckDetails | null> => {
      if (!privateKey || !checkAddress) return null

      const ephemeralAccount = privateKeyToAccount(privateKey)

      // Read check details from contract
      const result = await baseMainnetClient.readContract({
        address: checkAddress,
        abi: sendCheckAbi,
        functionName: 'checks',
        args: [ephemeralAccount.address],
      })

      const [ephemeralAddress, from, tokens, amounts, expiresAt] = result as [
        Hex,
        Hex,
        readonly Hex[],
        readonly bigint[],
        bigint,
      ]

      // Check if the check exists (from address is not zero)
      if (from === zeroAddress) {
        return null
      }

      const now = BigInt(Math.floor(Date.now() / 1000))
      const isExpired = expiresAt < now
      // A check is claimed if there are no tokens or all amounts are 0
      const isClaimed = tokens.length === 0 || amounts.every((a) => a === 0n)

      // Combine tokens and amounts into TokenAmount array
      const tokenAmounts: TokenAmount[] = tokens.map((token, i) => ({
        token,
        amount: amounts[i] ?? 0n,
      }))

      return {
        ephemeralAddress,
        from,
        tokenAmounts,
        expiresAt,
        isExpired,
        isClaimed,
      }
    },
    staleTime: 10000, // 10 seconds
  })
}

export type SendCheckClaimArgs = {
  checkCode: string
  webauthnCreds: { raw_credential_id: `\\x${string}`; name: string }[]
}

export type SendCheckClaimResult = {
  txHash: Hex
}

/**
 * Hook for claiming a SendCheck.
 * The claim URL contains the ephemeral private key needed to claim.
 * All tokens in the check are transferred to the claimer.
 */
export function useSendCheckClaim() {
  const { data: sendAccount } = useSendAccount()
  const { data: nonce } = useAccountNonce({ sender: sendAccount?.address })
  const { mutateAsync: sendUserOpAsync, isPending, error } = useSendUserOpMutation()
  const queryClient = useQueryClient()
  const chainId = baseMainnetClient.chain.id
  const checkAddress = getSendCheckAddress(chainId)

  const claimCheck = async ({
    checkCode,
    webauthnCreds,
  }: SendCheckClaimArgs): Promise<SendCheckClaimResult> => {
    assert(!!sendAccount?.address, 'Send account not loaded')
    assert(!!checkAddress, 'SendCheck contract not deployed on this chain')
    assert(nonce !== undefined, 'Account nonce not loaded')
    assert(webauthnCreds.length > 0, 'No webauthn credentials available')

    // Decode the check code to get the ephemeral private key
    const ephemeralPrivateKey = parseCheckCode(checkCode)
    assert(!!ephemeralPrivateKey, 'Invalid check code')

    const ephemeralAccount = privateKeyToAccount(ephemeralPrivateKey)

    // Sign the claimer's address with the ephemeral key
    // The contract expects a signature of keccak256(abi.encodePacked(msg.sender))
    const messageHash = keccak256(encodePacked(['address'], [sendAccount.address]))
    const signature = await ephemeralAccount.signMessage({
      message: { raw: messageHash },
    })

    // Create call data for claimCheck
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'execute',
      args: [
        checkAddress,
        0n,
        encodeFunctionData({
          abi: sendCheckAbi,
          functionName: 'claimCheck',
          args: [ephemeralAccount.address, signature],
        }),
      ],
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

    return {
      txHash: receipt.receipt.transactionHash,
    }
  }

  return {
    claimCheck,
    isPending,
    error,
    isReady: !!sendAccount?.address && !!checkAddress && nonce !== undefined,
    checkAddress,
  }
}
