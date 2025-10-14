import { Button as ButtonOg, Spinner, type ButtonProps, YStack, useAppToast } from '@my/ui'
import { sendAccountAbi, sendMerkleDropAbi, type sendMerkleDropAddress } from '@my/wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useCoin } from 'app/provider/coins'
import { assert } from 'app/utils/assert'
import { byteaToHex } from 'app/utils/byteaToHex'
import {
  type UseDistributionsResultData,
  useSendMerkleDropIsClaimed,
  useSendMerkleDropsAreClaimed,
  useSendMerkleDropTrancheActive,
  useUserOpClaimMutation,
} from 'app/utils/distributions'

import { useSendAccount } from 'app/utils/send-accounts'
import { throwIf } from 'app/utils/throwIf'
import { toNiceError } from 'app/utils/toNiceError'
import { useAccountNonce } from 'app/utils/userop'
import { useUserOpWithPaymaster } from 'app/utils/useUserOpWithPaymaster'
import { api } from 'app/utils/api'
import { useEffect, useMemo, useState } from 'react'
import { encodeFunctionData, type Hex, isAddress } from 'viem'

interface DistributionsClaimButtonProps {
  distribution: UseDistributionsResultData[number]
}
export const DistributionClaimButton = ({ distribution }: DistributionsClaimButtonProps) => {
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const queryClient = useQueryClient()
  // Check if the user is eligible
  const share = distribution.distribution_shares?.[0]
  const isEligible = !!share && BigInt(share.amount) > 0
  const isClaimActive = distribution.qualification_end < new Date()
  const trancheId = BigInt(distribution.tranche_id)
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  const merkleDropAddress = distribution.merkle_drop_addr
    ? byteaToHex(distribution.merkle_drop_addr as `\\x${string}`)
    : undefined
  const [sentTxHash, setSentTxHash] = useState<Hex>()
  const [error, setError] = useState<Error>()
  const toast = useAppToast()

  const { coin: usdc, isLoading: isUSDCLoading } = useCoin('USDC')

  // find out if the tranche is active uasing SendMerkleDrop.trancheActive(uint256 _tranche)
  const {
    data: isTrancheActive,
    isLoading: isTrancheActiveLoading,
    error: isTrancheActiveError,
  } = useSendMerkleDropTrancheActive({
    address: merkleDropAddress,
    tranche: trancheId,
    chainId: chainId,
  })
  // find out if user is eligible onchain using SendMerkleDrop.isClaimed(uint256 _tranche, uint256 _index)
  const {
    data: isClaimed,
    isLoading: isClaimedLoading,
    error: isClaimedError,
    refetch: refetchIsClaimed,
  } = useSendMerkleDropIsClaimed({
    address: merkleDropAddress,
    chainId,
    tranche: trancheId,
    index: share?.index !== undefined ? BigInt(share.index) : undefined,
  })

  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

  // Get the merkle proof from the API
  const {
    data: merkleProof,
    isLoading: isLoadingProof,
    error: errorProof,
  } = api.distribution.proof.useQuery({ distributionId: distribution.id })

  // Build calls for claiming
  const calls = useMemo(() => {
    if (
      !sendAccount?.address ||
      !isAddress(sendAccount.address) ||
      !share?.address ||
      !share?.amount ||
      !share?.index ||
      !merkleDropAddress ||
      !merkleProof ||
      isClaimed
    ) {
      return undefined
    }

    return [
      {
        dest: merkleDropAddress as `0x${string}`,
        value: 0n,
        data: encodeFunctionData({
          abi: sendMerkleDropAbi,
          functionName: 'claimTranche',
          args: [
            sendAccount.address as `0x${string}`,
            trancheId,
            BigInt(share.index),
            BigInt(share.amount),
            merkleProof,
          ],
        }),
      },
    ]
  }, [
    sendAccount?.address,
    share?.address,
    share?.amount,
    share?.index,
    merkleDropAddress,
    merkleProof,
    isClaimed,
    trancheId,
  ])

  const {
    data: result,
    isLoading: isGeneratingUserOp,
    error: userOpError,
  } = useUserOpWithPaymaster({
    sender: sendAccount?.address,
    calls,
  })

  const userOp = useMemo(() => result?.userOp, [result?.userOp])
  const fees = useMemo(() => result?.fees, [result?.fees])

  const isFeesLoading = isGeneratingUserOp || isLoadingProof
  const feesError = userOpError || errorProof

  const {
    mutateAsync: sendUserOp,
    isPending: isClaimPending,
    isError: isClaimError,
    error: claimError,
  } = useUserOpClaimMutation()

  const hasEnoughGas = fees && (usdc?.balance ?? BigInt(0)) >= fees.totalFee
  const canClaim = isTrancheActive && isClaimActive && isEligible && hasEnoughGas
  useEffect(() => {
    if (feesError) {
      setError(feesError)
    }
    if (userOpError) {
      setError(userOpError)
    }
    if (isClaimError) {
      setError(claimError)
    }
    if (isTrancheActiveError) {
      setError(isTrancheActiveError)
    }
    if (isClaimedError) {
      setError(isClaimedError)
    }
  }, [feesError, claimError, isTrancheActiveError, isClaimedError, isClaimError, userOpError])

  useEffect(() => {
    if (error) {
      console.log(error)
      toast.error(toNiceError(error))
    }
  }, [error, toast])

  async function onSubmit() {
    try {
      assert(!!userOp, 'User op is required')
      throwIf(userOpError)

      const sender = sendAccount?.address as `0x${string}`
      assert(isAddress(sender), 'No sender address')

      const receipt = await sendUserOp({
        userOp,
        webauthnCreds,
      })
      assert(receipt.success, 'Failed to send user op')
      setSentTxHash(receipt.receipt.transactionHash)
      refetchIsClaimed()
      await queryClient.invalidateQueries({ queryKey: [useSendMerkleDropsAreClaimed.queryKey] })
    } catch (e) {
      console.error(e)
      setError(e)
      await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
    }
  }

  if (!isClaimActive) return null

  if (!isEligible) return null

  // If the user is eligible and the tranche is active, show the claim button
  return (
    <YStack>
      <Button
        theme={canClaim || isClaimed ? 'green' : error || !hasEnoughGas ? 'red_active' : 'alt1'}
        onPress={onSubmit}
        br={12}
        disabledStyle={{ opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' }}
        disabled={!canClaim || isClaimPending || !!sentTxHash || !!feesError || isClaimed}
        gap={4}
        maw={194}
        width={'100%'}
        height={'auto'}
      >
        {(() => {
          switch (true) {
            case isTrancheActiveLoading ||
              isClaimedLoading ||
              isFeesLoading ||
              isUSDCLoading ||
              isClaimPending ||
              isLoadingSendAccount:
              return (
                <ButtonOg.Icon>
                  <Spinner size="small" color="$color12" />
                </ButtonOg.Icon>
              )
            case isClaimed:
              return <ButtonOg.Text>$ Claimed</ButtonOg.Text>
            case !isTrancheActive:
              return (
                <ButtonOg.Text opacity={0.5} disabled>
                  Not yet claimable
                </ButtonOg.Text>
              )
            case !!isTrancheActiveError || !!isClaimedError || !!feesError:
              return <ButtonOg.Text opacity={0.5}>Error</ButtonOg.Text>
            case isClaimPending && !isClaimError:
              return (
                <>
                  <ButtonOg.Icon>
                    <Spinner size="small" color="$black" />
                  </ButtonOg.Icon>
                  <ButtonOg.Text>Claiming...</ButtonOg.Text>
                </>
              )
            case !hasEnoughGas:
              return <ButtonOg.Text>Insufficient Gas</ButtonOg.Text>
            default:
              return <ButtonOg.Text fontWeight={'500'}>$ Claim Reward</ButtonOg.Text>
          }
        })()}
      </Button>
    </YStack>
  )
}

function Button(props: ButtonProps) {
  return <ButtonOg py="$3.5" w={190} br={12} {...props} />
}
