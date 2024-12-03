import { YStack, H1, Paragraph, XStack, LinkableButton, Button, Image, Stack } from '@my/ui'
import type { sendMerkleDropAddress } from '@my/wagmi'
import { IconArrowRight, IconSend } from 'app/components/icons'
import {
  useActiveDistribution,
  useSendMerkleDropIsClaimed,
  useSendMerkleDropTrancheActive,
} from 'app/utils/distributions'

export function RewardsScreen() {
  const { distribution, isLoading: isLoadingDistribution } = useActiveDistribution()
  const trancheId = BigInt((distribution?.number ?? 0) - 1) // tranches are 0-indexed
  const chainId = distribution?.chain_id as keyof typeof sendMerkleDropAddress
  const share = distribution?.distribution_shares?.[0]

  // find out if the tranche is active using SendMerkleDrop.trancheActive(uint256 _tranche)
  const { data: isTrancheActive, isLoading: isTrancheActiveLoading } =
    useSendMerkleDropTrancheActive({
      tranche: trancheId,
      chainId: chainId,
      enabled: Boolean(trancheId && chainId),
    })
  // find out if user is eligible onchain using SendMerkleDrop.isClaimed(uint256 _tranche, uint256 _index)
  const { data: isClaimed, isLoading: isClaimedLoading } = useSendMerkleDropIsClaimed({
    chainId,
    tranche: trancheId,
    index: share?.index !== undefined ? BigInt(share.index) : undefined,
    enabled: Boolean(trancheId && chainId && share?.index !== undefined),
  })

  return (
    <YStack pt={'$size.3.5'} $gtLg={{ pt: 0 }} f={1}>
      <YStack pb={'$size.3.5'}>
        <YStack w={'100%'} mb={'$size.3.5'} gap={'$size.0.9'}>
          <H1
            size={'$9'}
            fontWeight={'900'}
            color="$color12"
            tt={'uppercase'}
            verticalAlign={'middle'}
          >
            Invest Time, EARN Send
          </H1>
          <Paragraph color={'$color10'} size={'$5'}>
            Participate in the Send Ecosystem and earn Send Tokens. Your Network! Your Rewards!
          </Paragraph>
        </YStack>

        <YStack $gtLg={{ flexDirection: 'row' }} gap={'$size.3.5'}>
          {/* @TODO: href, reward */}
          <Section
            title="Activity Rewards"
            href="/account/rewards/activity"
            isLoading={isLoadingDistribution || isTrancheActiveLoading || isClaimedLoading}
            reward={
              distribution?.distribution_shares?.[0]?.amount_after_slash.toLocaleString() ?? ''
            }
            claimStatus={(() => {
              switch (true) {
                case !share || !share.amount_after_slash:
                  return undefined
                case !isTrancheActive:
                  return 'Upcoming Reward'
                case isClaimed:
                  return 'Claimed'
                default:
                  return 'Claimable'
              }
            })()}
          />
        </YStack>
      </YStack>
    </YStack>
  )
}

const Section = ({
  title,
  href,
  reward,
  isLoading = false,
  claimStatus,
}: {
  //@todo: using props like this is weird, better to pass children so we don't have to pass as much state
  title: string
  href: string
  reward: string
  isLoading?: boolean
  claimStatus?: 'Claimable' | 'Claimed' | 'Upcoming Reward'
}) => {
  return (
    <YStack
      f={1}
      pos={'relative'}
      overflow="hidden"
      borderRadius={'$6'}
      backgroundColor={'$black'}
      maw={500}
    >
      <Image
        pos={'absolute'}
        br={'$6'}
        t={0}
        zIndex={0}
        source={{
          height: 1024,
          width: 1024,
          uri: 'https://ghassets.send.app/app_images/flower.jpg',
        }}
        h={'100%'}
        w={'100%'}
        objectFit="cover"
      />
      <Stack pos="absolute" t={0} l={0} h="100%" w="100%" backgroundColor={'black'} opacity={0.2} />

      <YStack p={'$5'} jc="space-between" mih={290}>
        <XStack
          gap={6}
          ai="center"
          alignSelf="flex-start"
          pos={'relative'}
          p={'$size.0.75'}
          pr={'$size.0.9'}
          borderRadius={'$4'}
          backgroundColor={'#1F352A'}
        >
          <IconSend size={24} color="$primary" />
          <Paragraph size={'$5'} color="$white">
            {title}
          </Paragraph>
        </XStack>
        <XStack gap={'$size.1'} jc="space-between">
          <YStack w="100%">
            <Paragraph fontWeight={400} color={'$white'} size={'$5'}>
              {isLoading ? '' : claimStatus}
            </Paragraph>
            <XStack ai={'center'} jc="space-between">
              {isLoading ? (
                <Stack />
              ) : (
                <Paragraph
                  fontWeight={500}
                  ff={'$mono'}
                  size={'$8'}
                  $gtXs={{ size: '$9' }}
                  color="$white"
                >
                  {reward === '' ? '' : `${reward} SEND`}
                </Paragraph>
              )}
              <LinkableButton href={href} unstyled borderRadius={'$3'} p={'$size.0.5'}>
                <Button.Icon>
                  <IconArrowRight size={'3'} color={'$primary'} />
                </Button.Icon>
              </LinkableButton>
            </XStack>
          </YStack>
        </XStack>
      </YStack>
    </YStack>
  )
}
