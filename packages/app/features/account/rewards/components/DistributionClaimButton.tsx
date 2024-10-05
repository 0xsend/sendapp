import { Button as ButtonOg, Paragraph, ScrollView, Spinner, type ButtonProps, Stack } from '@my/ui'
import type { sendMerkleDropAddress } from '@my/wagmi'
import { IconDollar } from 'app/components/icons'
import { assert } from 'app/utils/assert'
import {
  type UseDistributionsResultData,
  usePrepareSendMerkleDropClaimTrancheWrite,
  useSendMerkleDropIsClaimed,
  useSendMerkleDropTrancheActive,
} from 'app/utils/distributions'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

interface DistributionsClaimButtonProps {
  distribution: UseDistributionsResultData[number]
}
export const DistributionClaimButton = ({ distribution }: DistributionsClaimButtonProps) => {
  // Check if the user is eligible
  const share = distribution.distribution_shares?.[0]
  const isEligible = !!share && share.amount > 0
  const isClaimActive = distribution.qualification_end < new Date()
  const trancheId = BigInt(distribution.number - 1) // tranches are 0-indexed
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  // find out if the tranche is active using SendMerkleDrop.trancheActive(uint256 _tranche)
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
    data: claimWriteConfig,
    error: claimWriteConfigError,
    isPending: isClaimWritePending,
  } = usePrepareSendMerkleDropClaimTrancheWrite({
    distribution,
    share,
  })

  const {
    data: claimWriteHash,
    writeContract: writeClaim,
    isPending: isClaimWriteSubmitted,
    error: writeClaimError,
  } = useWriteContract()

  const { isSuccess: claimReceiptSuccess, error: claimReceiptError } = useWaitForTransactionReceipt(
    {
      hash: claimWriteHash,
      query: {
        enabled: !!claimWriteHash,
      },
    }
  )

  if (!isClaimActive) return null

  if (!isEligible) return null

  // If the user is eligible but has already claimed, show the claim button disabled
  if (isClaimed) {
    return (
      <Paragraph size="$1" theme="alt2" mx="auto">
        Claimed
      </Paragraph>
    )
  }

  if (isTrancheActiveLoading || isClaimedLoading) {
    return (
      <Stack>
        <Spinner size="small" />
      </Stack>
    )
  }

  if (isTrancheActiveError || isClaimedError) {
    return (
      <>
        <Button disabled f={1}>
          <ButtonOg.Icon>
            <IconDollar size={'$2.5'} />
          </ButtonOg.Icon>
          <ButtonOg.Text>Claim Reward</ButtonOg.Text>
        </Button>
        <ErrorMessage
          error={`Error checking eligibility. Please try again later. ${isTrancheActiveError?.message} ${isClaimedError?.message}`}
        />
      </>
    )
  }

  // If the user is eligible but the tranche is inactive, show the claim button disabled
  if (!isTrancheActive)
    return (
      <Stack>
        <Button bc="$color5" opacity={0.5} disabled>
          Not yet claimable
        </Button>
      </Stack>
    )

  if (claimWriteConfigError) {
    return (
      <>
        <Button disabled>Claim Reward</Button>
        <ErrorMessage
          error={`Error preparing claim. Please try again later. ${claimWriteConfigError}`}
        />
      </>
    )
  }

  // If the user is eligible and the tranche is active, show the claim button
  return (
    <>
      <Button
        disabled={
          !writeClaim ||
          isClaimWritePending ||
          isClaimWriteSubmitted ||
          claimReceiptSuccess ||
          !!claimWriteHash
        }
        onPress={() => {
          assert(!!writeClaim, 'No writeClaim found')
          assert(!!claimWriteConfig, 'No claimWriteConfig found')
          assert(!!refetchIsClaimed, 'No refetchIsClaimed found')
          writeClaim(claimWriteConfig.request)
          refetchIsClaimed()
        }}
        theme={'green'}
      >
        {isClaimWriteSubmitted || claimWriteHash ? 'Claiming...' : 'Claim Reward'}
      </Button>
      {claimReceiptError && (
        <ErrorMessage
          error={`Error claiming. Please try again later. ${claimReceiptError.message}`}
        />
      )}

      {writeClaimError && (
        <ErrorMessage
          error={`Error claiming. Please try again later. ${writeClaimError.message}`}
        />
      )}
    </>
  )
}

function Button(props: ButtonProps) {
  return <ButtonOg py="$3.5" w="100%" br={12} bc="$green12Dark" {...props} />
}

function ErrorMessage({ error }: { error?: string }) {
  if (!error) return null
  return (
    <ScrollView pos="absolute" $gtLg={{ bottom: '$-12' }} bottom="$-10" height="$4">
      <Paragraph size="$1" w="$20" col={'$red500'} ta="center">
        {error.split('.').at(0)}
      </Paragraph>
    </ScrollView>
  )
}
