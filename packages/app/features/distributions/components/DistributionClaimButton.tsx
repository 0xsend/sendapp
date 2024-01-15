import { Anchor, Button, Paragraph, TooltipSimple, YStack } from '@my/ui'
import {
  UseDistributionsResultData,
  usePrepareSendMerkleDropClaimTrancheWrite,
  useSendMerkleDropIsClaimed,
  useSendMerkleDropTrancheActive,
} from 'app/utils/distributions'
import { shorten } from 'app/utils/strings'
import { useRpcChainId } from 'app/utils/viem/useRpcChainId'
import {
  useAccount,
  useConnect,
  useContractWrite,
  useNetwork,
  usePublicClient,
  useSwitchNetwork,
  useWaitForTransaction,
} from 'wagmi'

interface DistributionsClaimButtonProps {
  distribution: UseDistributionsResultData[number]
}
export const DistributionClaimButton = ({ distribution }: DistributionsClaimButtonProps) => {
  // Check if the user is eligible
  const share = distribution.distribution_shares?.[0]
  const isEligible = !!share && share.amount > 0
  const isClaimActive = distribution.qualification_end < new Date()
  const trancheId = BigInt(distribution.number - 1) // tranches are 0-indexed
  // find out if the tranche is active using SendMerkleDrop.trancheActive(uint256 _tranche)
  const {
    data: isTrancheActive,
    isLoading: isTrancheActiveLoading,
    error: isTrancheActiveError,
  } = useSendMerkleDropTrancheActive(trancheId)
  // find out if user is eligible onchain using SendMerkleDrop.isClaimed(uint256 _tranche, uint256 _index)
  const {
    data: isClaimed,
    isLoading: isClaimedLoading,
    error: isClaimedError,
    refetch: refetchIsClaimed,
  } = useSendMerkleDropIsClaimed(
    trancheId,
    share?.index !== undefined ? BigInt(share.index) : undefined
  )
  const { isConnected, address: account } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const publicClient = usePublicClient()
  const { data: rpcChainId, isLoading: isLoadingRpcChainId } = useRpcChainId()
  const network = useNetwork()
  const { switchNetwork } = useSwitchNetwork({ chainId: publicClient.chain.id })
  const { config: claimWriteConfig, error: claimWriteConfigError } =
    usePrepareSendMerkleDropClaimTrancheWrite({
      distribution,
      share,
    })
  const { data: claimWriteData, write: claimWrite } = useContractWrite(claimWriteConfig)
  const {
    isLoading: isClaimWriteLoading,
    isSuccess: isClaimWriteSuccess,
    error: claimWriteError,
  } = useWaitForTransaction({
    hash: claimWriteData?.hash,
  })

  if (!isClaimActive) {
    return null
  }

  if (!isEligible) {
    // If the user is not eligible, show the claim button disabled
    return <Button disabled>Not Eligible</Button>
  }

  if (isTrancheActiveLoading || isClaimedLoading) {
    return (
      <YStack ai="center" w="100%" mx="auto">
        <Button disabled f={1} w="100%">
          Claim
        </Button>
        <Paragraph size="$1" theme="alt2">
          Checking claimability...
        </Paragraph>
      </YStack>
    )
  }

  if (isTrancheActiveError || isClaimedError) {
    return (
      <YStack ai="center" w="100%" mx="auto">
        <Button disabled f={1} w="100%">
          Claim
        </Button>
        <Paragraph size="$1" theme="alt2">
          Error checking eligibility. Please try again later. {isTrancheActiveError?.message}
          {` ${isClaimedError?.message}`}
        </Paragraph>
      </YStack>
    )
  }

  // If the user is eligible but the tranche is inactive, show the claim button disabled
  if (!isTrancheActive) {
    return (
      <TooltipSimple
        contentProps={{ maw: 200 }}
        label={
          'You are eligible for this distribution, but the tranche is inactive. Please wait for it to be created.'
        }
      >
        <YStack ai="center" w="100%" mx="auto">
          <Button disabled f={1} w="100%">
            Claim
          </Button>
          <Paragraph size="$1" theme="alt2">
            Tranche is inactive.
          </Paragraph>
        </YStack>
      </TooltipSimple>
    )
  }

  // If the user is eligible but has already claimed, show the claim button disabled
  if (isClaimed) {
    return (
      <Paragraph size="$1" theme="alt2" mx="auto">
        Already claimed{' '}
        {isClaimWriteSuccess && (
          <Paragraph size="$1" theme="alt2">
            <Anchor
              accessibilityLabel="View Claim on Etherscan"
              href={`https://etherscan.io/tx/${claimWriteData?.hash}`}
            >
              {shorten(claimWriteData?.hash)}
            </Anchor>
          </Paragraph>
        )}
      </Paragraph>
    )
  }

  if (!isConnected) {
    return (
      <YStack ai="center" w="100%" mx="auto">
        <Paragraph size="$1" theme="alt2">
          Please connect a wallet to claim
        </Paragraph>
        <Button
          w="100%"
          onPress={() => {
            connect({ connector: connectors[0] })
          }}
        >
          Connect Wallet
        </Button>
        {connectError ? (
          connectError.message?.includes('Connector not found') ? (
            <Paragraph size="$1" theme="alt2">
              Error finding wallet. Please install a web3 wallet like MetaMask.
            </Paragraph>
          ) : (
            <Paragraph size="$1" theme="alt2">
              Error connecting wallet. Please try again later. {connectError.message}
            </Paragraph>
          )
        ) : null}
      </YStack>
    )
  }

  if (account !== share?.address) {
    return (
      <YStack ai="center" w="100%" mx="auto">
        <Paragraph size="$1" theme="alt2">
          Please switch to the address you verified previously to claim,{' '}
          <Anchor
            size="$1"
            target="_blank"
            accessibilityLabel="View on Etherscan"
            href={`https://etherscan.io/address/${share?.address}`}
          >
            {shorten(share?.address)}
          </Anchor>
          .
        </Paragraph>
        <Paragraph size="$1" theme="alt2" alignSelf="flex-start">
          Connected address:{' '}
          <Anchor
            size="$1"
            target="_blank"
            accessibilityLabel="View on Etherscan"
            href={`https://etherscan.io/address/${account}`}
          >
            {shorten(account)}
          </Anchor>
        </Paragraph>
      </YStack>
    )
  }

  if (!isLoadingRpcChainId && rpcChainId !== publicClient.chain?.id) {
    return (
      <YStack ai="center" w="100%" mx="auto">
        <Paragraph size="$1" theme="alt2">
          😵 Tell a dev! This should not happen. RPC chain id {rpcChainId} does not match public
          client chain id: {publicClient.chain.id}.
        </Paragraph>
      </YStack>
    )
  }

  if (publicClient.chain.id !== network.chain?.id) {
    return (
      <YStack ai="center" w="100%" mx="auto">
        <Paragraph size="$1" theme="alt2">
          Please switch to {network.chain?.name} to claim
        </Paragraph>
        <Button w="100%" onPress={() => switchNetwork?.()}>
          Switch Network
        </Button>
      </YStack>
    )
  }

  if (claimWriteConfigError) {
    return (
      <YStack ai="center" w="100%" mx="auto">
        <Button disabled f={1} w="100%">
          Claim
        </Button>
        <Paragraph size="$1" theme="alt2">
          Error preparing claim. Please try again later. {claimWriteConfigError.message}
        </Paragraph>
      </YStack>
    )
  }

  // If the user is eligible and the tranche is active, show the claim button
  return (
    <YStack ai="center" w="100%" mx="auto">
      <Button
        w="100%"
        disabled={!claimWrite || isClaimWriteLoading || isClaimWriteSuccess}
        onPress={() => {
          claimWrite?.()
          refetchIsClaimed?.()
        }}
      >
        {isClaimWriteLoading ? 'Claiming...' : 'Claim'}
      </Button>
      {claimWriteError && (
        <Paragraph size="$1" theme="alt2">
          Error claiming. Please try again later. {claimWriteError.message}
        </Paragraph>
      )}
      {isClaimWriteSuccess && (
        <Paragraph size="$1" theme="alt2">
          Claimed!{' '}
          <Anchor
            accessibilityLabel="View Claim on Etherscan"
            href={`https://etherscan.io/tx/${claimWriteData?.hash}`}
          >
            {shorten(claimWriteData?.hash)}
          </Anchor>
        </Paragraph>
      )}
    </YStack>
  )
}
