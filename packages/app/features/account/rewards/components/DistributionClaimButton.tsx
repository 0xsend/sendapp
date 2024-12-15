import { Button as ButtonOg, Spinner, type ButtonProps, YStack, useToastController } from '@my/ui'
import { baseMainnet, type sendMerkleDropAddress } from '@my/wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { IconDollar } from 'app/components/icons'
import { useCoin } from 'app/provider/coins'
import { assert } from 'app/utils/assert'
import {
  type UseDistributionsResultData,
  useGenerateClaimUserOp,
  useSendMerkleDropIsClaimed,
  useSendMerkleDropTrancheActive,
  useUserOpClaimMutation,
} from 'app/utils/distributions'

import { useSendAccount } from 'app/utils/send-accounts'
import { throwIf } from 'app/utils/throwIf'
import { useAccountNonce } from 'app/utils/userop'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useEffect, useState } from 'react'
import { type Hex, isAddress } from 'viem'
import { useEstimateFeesPerGas } from 'wagmi'

interface DistributionsClaimButtonProps {
  distribution: UseDistributionsResultData[number]
}
export const DistributionClaimButton = ({ distribution }: DistributionsClaimButtonProps) => {
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const queryClient = useQueryClient()
  // Check if the user is eligible
  const share = distribution.distribution_shares?.[0]
  const isEligible = !!share && share.amount_after_slash > 0
  const isClaimActive = distribution.qualification_end < new Date()
  const trancheId = BigInt(distribution.number - 1) // tranches are 0-indexed
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  const [sentTxHash, setSentTxHash] = useState<Hex>()
  const [error, setError] = useState<Error>()
  const toast = useToastController()

  const { coin: usdc, isLoading: isUSDCLoading } = useCoin('USDC')

  // find out if the tranche is active uasing SendMerkleDrop.trancheActive(uint256 _tranche)
  const {
    data: isTrancheActive,
    isLoading: isTrancheActiveLoading,
    error: isTrancheActiveError,
  } = useSendMerkleDropTrancheActive({
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
    chainId,
    tranche: trancheId,
    index: share?.index !== undefined ? BigInt(share.index) : undefined,
  })

  const {
    data: nonce,
    error: nonceError,
    isLoading: isNonceLoading,
  } = useAccountNonce({
    sender: sendAccount?.address,
  })

  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

  const { data: userOp } = useGenerateClaimUserOp({
    distribution,
    share,
    nonce,
  })

  const {
    data: usdcFees,
    isLoading: isFeesLoading,
    error: usdcFeesError,
  } = useUSDCFees({
    userOp,
  })

  const {
    data: feesPerGas,
    isLoading: isGasLoading,
    error: feesPerGasError,
  } = useEstimateFeesPerGas({
    chainId: baseMainnet.id,
  })

  const {
    mutateAsync: sendUserOp,
    isPending: isClaimPending,
    isError: isClaimError,
    error: claimError,
  } = useUserOpClaimMutation()

  const hasEnoughGas =
    usdcFees && (usdc?.balance ?? BigInt(0)) >= usdcFees.baseFee + usdcFees.gasFees

  const canClaim = isTrancheActive && isClaimActive && isEligible && hasEnoughGas
  useEffect(() => {
    if (usdcFeesError) {
      setError(usdcFeesError)
    }
    if (feesPerGasError) {
      setError(feesPerGasError)
    }
    if (isClaimError) {
      setError(claimError)
    }
    if (nonceError) {
      setError(nonceError)
    }
    if (isTrancheActiveError) {
      setError(isTrancheActiveError)
    }
    if (isClaimedError) {
      setError(isClaimedError)
    }
  }, [
    usdcFeesError,
    feesPerGasError,
    claimError,
    nonceError,
    isTrancheActiveError,
    isClaimedError,
    isClaimError,
  ])

  useEffect(() => {
    if (error) {
      console.log(error)
      if (!error.message) {
        toast.show(error.name, {
          preset: 'error',
          isUrgent: true,
          duration: 10000000,
        })
      } else {
        toast.show(error.message.split('.').at(0) ?? error.name, {
          preset: 'error',
          isUrgent: true,
          duration: 10000000,
        })
      }
    }
  }, [error, toast])

  async function onSubmit() {
    try {
      assert(!!userOp, 'User op is required')
      assert(nonceError === null, `Failed to get nonce: ${nonceError}`)
      assert(nonce !== undefined, 'Nonce is not available')
      throwIf(feesPerGasError)
      assert(!!feesPerGas, 'Fees per gas is not available')

      const sender = sendAccount?.address as `0x${string}`
      assert(isAddress(sender), 'No sender address')
      const _userOp = {
        ...userOp,
        maxFeePerGas: feesPerGas.maxFeePerGas,
        maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
      }

      console.log('gasEstimate', usdcFees)
      console.log('feesPerGas', feesPerGas)
      console.log('userOp', _userOp)
      const receipt = await sendUserOp({
        userOp: _userOp,
        webauthnCreds,
      })
      assert(receipt.success, 'Failed to send user op')
      setSentTxHash(receipt.receipt.transactionHash)
      refetchIsClaimed()
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
        disabled={
          !canClaim ||
          isClaimPending ||
          !!sentTxHash ||
          !!feesPerGasError ||
          !!usdcFeesError ||
          isClaimed
        }
        gap={4}
        maw={194}
        width={'100%'}
      >
        {(() => {
          switch (true) {
            case isTrancheActiveLoading ||
              isClaimedLoading ||
              isFeesLoading ||
              isUSDCLoading ||
              isNonceLoading ||
              isClaimPending ||
              isLoadingSendAccount ||
              isGasLoading:
              return (
                <ButtonOg.Icon>
                  <Spinner size="small" color="$color12" />
                </ButtonOg.Icon>
              )
            case isClaimed:
              return (
                <>
                  <ButtonOg.Icon>
                    <IconDollar color="$black" size={'$1.5'} />
                  </ButtonOg.Icon>
                  <ButtonOg.Text>Claimed</ButtonOg.Text>
                </>
              )
            case !isTrancheActive:
              return (
                <ButtonOg.Text opacity={0.5} disabled>
                  Not yet claimable
                </ButtonOg.Text>
              )
            case !!isTrancheActiveError ||
              !!isClaimedError ||
              !!nonceError ||
              !!feesPerGasError ||
              !!usdcFeesError:
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
              return (
                <>
                  <ButtonOg.Icon>
                    <IconDollar color="$black" size={'$1'} />
                  </ButtonOg.Icon>
                  <ButtonOg.Text fontWeight={'500'}>Claim Reward</ButtonOg.Text>
                </>
              )
          }
        })()}
      </Button>
    </YStack>
  )
}

function Button(props: ButtonProps) {
  return <ButtonOg py="$3.5" w={190} br={12} {...props} />
}
