import {
  baseMainnetClient,
  entryPointAddress,
  sendAccountAbi,
  sendCheckAbi,
  sendCheckAddress,
  sendVerifyingPaymasterAddress,
} from '@my/wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserOperation } from 'permissionless'
import { encodeFunctionData, type Hex, keccak256, encodePacked } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { assert } from './assert'
import { defaultUserOp } from './userOpConstants'
import { useSendAccount } from './send-accounts'
import { useAccountNonce } from './userop'
import { useSendUserOpMutation } from './sendUserOp'
import { decodeCheckCode, isValidCheckCodeFormat } from './checkCode'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import type { Database, PgBytea } from '@my/supabase/database.types'
import { byteaToHex } from './byteaToHex'
import { api } from 'app/utils/api'
import { CHECK_NOTE_ACCESS_MESSAGE } from '@my/api/src/routers/sendCheck'
import debug from 'debug'

const logger = debug('app:utils:useSendCheckClaim')

/**
 * Parse a chain string to a numeric chain ID.
 * Returns the number if parseable, null otherwise.
 */
export function parseChainId(chain: string): number | null {
  const parsed = Number.parseInt(chain, 10)
  return Number.isNaN(parsed) ? null : parsed
}

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

type GetCheckByEphemeralAddressRow =
  Database['public']['Functions']['get_check_by_ephemeral_address']['Returns'][number] & {
    note?: string | null
  }

export type CheckDetails = {
  ephemeralAddress: Hex
  from: Hex
  tokenAmounts: TokenAmount[]
  expiresAt: bigint
  isExpired: boolean
  isClaimed: boolean
  isActive: boolean
  isCanceled: boolean
  claimedBy: Hex | null
  claimedAt: bigint | null
  note: string | null
}

/**
 * Hook to fetch check details from the indexer database using a check code.
 * Returns null if check doesn't exist.
 * @param checkCode - The check code (base32 encoded)
 */
export function useCheckDetails(checkCode: string | null) {
  const supabase = useSupabase()
  const privateKey = checkCode ? parseCheckCode(checkCode) : null
  const chainId = baseMainnetClient.chain.id
  const trpcUtils = api.useUtils()

  return useQuery({
    queryKey: ['checkDetails', checkCode, chainId, privateKey],
    enabled: !!privateKey,
    queryFn: async (): Promise<CheckDetails | null> => {
      if (!privateKey) return null

      const ephemeralAccount = privateKeyToAccount(privateKey)

      // Convert address to bytea format for Supabase
      const addressBytes = `\\x${ephemeralAccount.address.slice(2).toLowerCase()}` as PgBytea

      const { data, error } = await supabase.rpc('get_check_by_ephemeral_address', {
        check_ephemeral_address: addressBytes,
        check_chain_id: chainId,
      })

      if (error) {
        throw new Error(error.message || 'Failed to fetch check details')
      }

      // Function returns an array, but should have at most one result
      const row = (data as GetCheckByEphemeralAddressRow[])?.[0]
      if (!row) {
        throw new Error('Check not found')
      }

      // Treat claimed or canceled checks as not found
      if (row.is_claimed || row.is_canceled) {
        throw new Error('Check not found')
      }

      // Parse tokens and amounts arrays into TokenAmount[]
      const tokenAmounts: TokenAmount[] = row.tokens.map((token, i) => ({
        token: byteaToHex(token as PgBytea),
        amount: BigInt(row.amounts[i] ?? 0),
      }))

      // Fetch the note by signing with the ephemeral key to prove ownership
      let note: string | null = null
      try {
        const signature = await ephemeralAccount.signMessage({
          message: CHECK_NOTE_ACCESS_MESSAGE,
        })
        const noteResult = await trpcUtils.sendCheck.getCheckNote.fetch({
          ephemeralAddress: ephemeralAccount.address,
          chainId,
          signature,
        })
        note = noteResult.note
      } catch (e) {
        // Note fetch failed - continue without note
        logger('Failed to fetch check note:', e)
      }

      return {
        ephemeralAddress: byteaToHex(row.ephemeral_address as PgBytea),
        from: byteaToHex(row.sender as PgBytea),
        tokenAmounts,
        expiresAt: BigInt(row.expires_at),
        isExpired: row.is_expired,
        isClaimed: row.is_claimed,
        isActive: row.is_active,
        isCanceled: row.is_canceled,
        claimedBy: row.claimed_by ? byteaToHex(row.claimed_by as PgBytea) : null,
        claimedAt: row.claimed_at ? BigInt(row.claimed_at) : null,
        note,
      }
    },
    staleTime: 10000, // 10 seconds
  })
}

export type SendCheckClaimArgs = {
  checkCode: string
  webauthnCreds: { raw_credential_id: PgBytea; name: string }[]
}

export type SendCheckClaimResult = {
  txHash: Hex
}

/**
 * Hook for claiming a SendCheck.
 * The claim URL contains the ephemeral private key needed to claim.
 * All tokens in the check are transferred to the claimer.
 * Gas is sponsored via the Send Verifying Paymaster.
 */
export function useSendCheckClaim() {
  const { data: sendAccount } = useSendAccount()
  const { data: nonce } = useAccountNonce({ sender: sendAccount?.address })
  const {
    mutateAsync: sendUserOpAsync,
    isPending: isSending,
    error: sendError,
  } = useSendUserOpMutation()
  const paymasterSignMutation = api.sendAccount.paymasterSign.useMutation()
  const queryClient = useQueryClient()

  const isPending = isSending || paymasterSignMutation.isPending
  const error = sendError || paymasterSignMutation.error

  const claimCheck = async ({
    checkCode,
    webauthnCreds,
  }: SendCheckClaimArgs): Promise<SendCheckClaimResult> => {
    // Decode the check code to get the ephemeral private key
    const privateKey = parseCheckCode(checkCode)
    assert(!!privateKey, 'Invalid check code')

    const chainId = baseMainnetClient.chain.id
    const checkAddress = getSendCheckAddress(chainId)
    const entryPoint = entryPointAddress[chainId]

    assert(!!sendAccount?.address, 'Send account not loaded')
    assert(checkAddress !== null, 'SendCheck contract not deployed on this chain')
    assert(nonce !== undefined, 'Account nonce not loaded')
    assert(webauthnCreds.length > 0, 'No webauthn credentials available')

    // TypeScript doesn't narrow after assert, so we need to cast
    const contractAddress = checkAddress as Hex

    const ephemeralAccount = privateKeyToAccount(privateKey)

    // Sign the claimer's address and chain ID with the ephemeral key
    // The contract expects a signature of keccak256(abi.encodePacked(msg.sender, block.chainid))
    const messageHash = keccak256(
      encodePacked(['address', 'uint256'], [sendAccount.address, BigInt(chainId)])
    )
    const signature = await ephemeralAccount.signMessage({
      message: { raw: messageHash },
    })

    // Create call data for claimCheck
    const innerCallData = encodeFunctionData({
      abi: sendCheckAbi,
      functionName: 'claimCheck',
      args: [ephemeralAccount.address, signature],
    })
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [[{ dest: contractAddress, value: 0n, data: innerCallData }]],
    })

    // Build base userOp with paymaster address (required for correct hash computation)
    // The paymaster's getHash includes gas limits from paymasterAndData, so paymaster must be set
    // before sending to the server for signing
    const baseUserOp: UserOperation<'v0.7'> = {
      ...defaultUserOp,
      sender: sendAccount.address,
      nonce,
      callData,
      signature: '0x',
      paymaster: sendVerifyingPaymasterAddress[chainId],
    }

    // Get paymaster signature from the server (sponsorship)
    const paymasterResult = await paymasterSignMutation.mutateAsync({
      userop: baseUserOp,
      entryPoint,
    })

    // Update userOp with paymaster signature data
    const sponsoredUserOp: UserOperation<'v0.7'> = {
      ...baseUserOp,
      paymasterData: paymasterResult.paymasterData,
    }

    // Submit the user operation (signing happens inside sendUserOpAsync)
    const receipt = await sendUserOpAsync({ userOp: sponsoredUserOp, webauthnCreds })

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
    isReady: !!sendAccount?.address && nonce !== undefined,
  }
}
