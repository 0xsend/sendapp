import {
  Anchor,
  Button as ButtonOg,
  ButtonText,
  Paragraph,
  ScrollView,
  Spinner,
  type ButtonProps,
  Stack,
} from '@my/ui'
import type { sendMerkleDropAddress } from '@my/wagmi'
import { assert } from 'app/utils/assert'
import {
  type UseDistributionsResultData,
  usePrepareSendMerkleDropClaimTrancheWrite,
  useSendMerkleDropIsClaimed,
  useSendMerkleDropTrancheActive,
} from 'app/utils/distributions'
import { shorten } from 'app/utils/strings'
import {
  useAccount,
  useConnect,
  useWriteContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi'

import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import { useWeb3Modal } from '@web3modal/wagmi/react'

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
  const { isConnected, address: account, chain: accountChain } = useAccount()
  const { open: openConnectModal } = useWeb3Modal()
  const { error: connectError } = useConnect()
  const { chains, switchChain, error: switchError } = useSwitchChain()
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
      <>
        <Paragraph size="$1" theme="alt2" mx="auto">
          Already claimed
          {claimReceiptSuccess && (
            <Paragraph size="$1" theme="alt2">
              <Anchor
                aria-label="View Claim on Etherscan"
                href={`${accountChain?.blockExplorers?.default.url}/tx/${claimWriteHash}`}
              >
                {shorten(claimWriteHash)}
              </Anchor>
            </Paragraph>
          )}
        </Paragraph>
      </>
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
          Claim Reward
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

  if (!isConnected) {
    return (
      <>
        <OpenConnectModalWrapper>
          <Button onPress={() => openConnectModal()}>
            <ButtonText col="$black">Connect Wallet to Claim</ButtonText>
          </Button>
        </OpenConnectModalWrapper>

        {connectError ? (
          connectError.message?.includes('Connector not found') ? (
            <ErrorMessage
              error={'Error finding wallet. Please install a web3 wallet like MetaMask.'}
            />
          ) : (
            <ErrorMessage
              error={`Error connecting wallet. Please try again later. ${connectError.message}`}
            />
          )
        ) : null}
      </>
    )
  }

  if (distribution.chain_id !== accountChain?.id) {
    const distributionChain = chains.find((c) => c.id === distribution.chain_id)
    assert(!!distributionChain, `No chain found for ${distribution.chain_id}`)
    return (
      <>
        <Button
          onPress={() => {
            assert(!!switchChain, 'No switchChain found')
            switchChain(
              { chainId: distributionChain.id as keyof typeof sendMerkleDropAddress },
              { onError: (error) => console.error(error) }
            )
          }}
        >
          <ButtonText col="$black">Switch Network</ButtonText>
        </Button>
        <ErrorMessage
          error={
            switchError
              ? `Error switching network. Please try again later. ${switchError.message}`
              : ''
          }
        />
      </>
    )
  }

  // If the user is eligible but has already claimed, show the claim button disabled
  if (isClaimed) {
    return (
      <Stack>
        <Paragraph size="$1" theme="alt2" mx="auto">
          Already claimed
          {claimReceiptSuccess && (
            <Paragraph size="$1" theme="alt2">
              <Anchor
                aria-label="View Claim on Etherscan"
                href={`${accountChain.blockExplorers?.default.url}/tx/${claimWriteHash}`}
              >
                {shorten(claimWriteHash)}
              </Anchor>
            </Paragraph>
          )}
        </Paragraph>
      </Stack>
    )
  }

  if (account !== share?.address) {
    return (
      <>
        <Paragraph size="$1" theme="alt2">
          Please switch to the address you verified previously to claim,{' '}
          <Anchor
            size="$1"
            target="_blank"
            aria-label="View on Etherscan"
            href={`${accountChain.blockExplorers?.default.url}/address/${share?.address}`}
          >
            {shorten(share?.address)}
          </Anchor>
          .
        </Paragraph>
        <Paragraph size="$1" theme="alt2">
          Connected address:{' '}
          <Anchor
            size="$1"
            target="_blank"
            aria-label="View on Etherscan"
            href={`${accountChain.blockExplorers?.default.url}/address/${account}`}
          >
            {shorten(account)}
          </Anchor>
        </Paragraph>
      </>
    )
  }

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
      {claimReceiptSuccess && (
        <Paragraph size="$1" theme="alt2">
          Claimed!{' '}
          <Anchor
            aria-label="View Claim on Etherscan"
            href={`${accountChain.blockExplorers?.default.url}/tx/${claimWriteHash}`}
          >
            {shorten(claimWriteHash)}
          </Anchor>
        </Paragraph>
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
