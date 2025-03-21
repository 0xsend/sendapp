import {
  Card,
  Fade,
  H4,
  Paragraph,
  ScrollView,
  Separator,
  Spinner,
  XStack,
  YGroup,
  YStack,
  useToastController,
} from '@my/ui'
import { baseMainnetBundlerClient, entryPointAddress } from '@my/wagmi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { erc20Coin } from 'app/data/coins'
import { SectionButton } from 'app/features/earn/components/SectionButton'
import { useMyAffiliateRewards, useMyAffiliateRewardsBalance } from 'app/features/earn/hooks'
import { useERC20AssetCoin } from 'app/features/earn/params'
import { useSendEarnClaimRewardsCalls } from 'app/features/earn/rewards/hooks'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'
import { TokenDetailsMarketData } from 'app/features/home/TokenDetails'
import { assert } from 'app/utils/assert'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { signUserOp } from 'app/utils/signUserOp'
import { toNiceError } from 'app/utils/toNiceError'
import { useAccountNonce, useUserOp } from 'app/utils/userop'
import debug from 'debug'
import { useMemo, useState } from 'react'
import { SectionList } from 'react-native'
import { formatUnits, withRetry } from 'viem'
import { useChainId } from 'wagmi'
import { useEarnRewardsActivityFeed } from './hooks'

const log = debug('app:features:earn:rewards')

const MIN_REWARD_CLAIM = BigInt(5 * 1e4) // ¢5 USDC

export function RewardsBalanceScreen() {
  return <RewardsBalance />
}

function RewardsBalance() {
  const [useropState, setUseropState] = useState('')
  const toast = useToastController()
  const queryClient = useQueryClient()
  const chainId = useChainId()
  const coin = useERC20AssetCoin()

  // Get the user's send account
  const sendAccount = useSendAccount()
  const sender = useMemo(() => sendAccount?.data?.address, [sendAccount?.data?.address])
  const nonce = useAccountNonce({ sender })

  // Get the user's affiliate rewards
  const balance = useMyAffiliateRewardsBalance()
  const affiliateRewards = useMyAffiliateRewards()

  // Get the webauthn credentials for signing
  const webauthnCreds = useMemo(
    () =>
      sendAccount?.data?.send_account_credentials
        .filter((c) => !!c.webauthn_credentials)
        .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.data?.send_account_credentials]
  )

  // Get the calls for claiming rewards
  const calls = useSendEarnClaimRewardsCalls({ sender })

  // Create the user operation
  const uop = useUserOp({
    sender,
    calls: calls.data ?? undefined,
  })

  // DEBUG
  log('uop', uop)
  log('calls', calls)

  // Check if the user has rewards to claim
  const hasAnyRewards = useMemo(() => {
    if (!affiliateRewards.data) return false
    return affiliateRewards.data.assets > 0n
  }, [affiliateRewards.data])
  const hasEnoughRewards = useMemo(() => {
    if (!affiliateRewards.data) return false
    return affiliateRewards.data.assets > MIN_REWARD_CLAIM
  }, [affiliateRewards.data])

  // Format the rewards amount for display
  const formattedRewards = useMemo(() => {
    if (!affiliateRewards.data || !affiliateRewards.data.assets) return '0'
    if (!coin.data) return '0'
    return formatUnits(affiliateRewards.data.assets, coin.data.decimals)
  }, [affiliateRewards.data, coin.data])

  // MUTATION CLAIM REWARDS USEROP
  const mutation = useMutation({
    mutationFn: async () => {
      assert(uop.isSuccess, 'uop is not success')

      uop.data.signature = await signUserOp({
        userOp: uop.data,
        webauthnCreds,
        chainId: chainId,
        entryPoint: entryPointAddress[chainId],
      })

      setUseropState('Sending transaction...')

      const userOpHash = await baseMainnetBundlerClient.sendUserOperation({
        userOperation: uop.data,
      })

      setUseropState('Waiting for confirmation...')

      const receipt = await withRetry(
        () =>
          baseMainnetBundlerClient.waitForUserOperationReceipt({
            hash: userOpHash,
            timeout: 10000,
          }),
        {
          delay: 100,
          retryCount: 3,
        }
      )

      log('receipt', receipt)

      assert(receipt.success, 'receipt status is not success')

      log('mutationFn', { uop })
      return
    },
    onMutate: (variables) => {
      // A mutation is about to happen!
      log('onMutate', variables)
      setUseropState('Requesting signature...')
    },
    onError: (error, variables, context) => {
      // An error happened!
      log('onError', error, variables, context)
    },
    onSuccess: (data, variables, context) => {
      // Boom baby!
      log('onSuccess', data, variables, context)

      toast.show('Rewards claimed')
    },
    onSettled: (data, error, variables, context) => {
      // Error or success... doesn't matter!
      log('onSettled', data, error, variables, context)
      queryClient.invalidateQueries({ queryKey: nonce.queryKey })
      queryClient.invalidateQueries({ queryKey: calls.queryKey })
      queryClient.invalidateQueries({ queryKey: balance.queryKey })
      queryClient.invalidateQueries({ queryKey: affiliateRewards.queryKey })
    },
  })

  // Determine if the claim button should be enabled
  const canClaim =
    !affiliateRewards.isLoading &&
    !calls.isLoading &&
    !uop.isLoading &&
    hasEnoughRewards &&
    calls.isSuccess &&
    uop.isSuccess &&
    !calls.isPending &&
    !uop.isPending &&
    mutation.isIdle

  const handleClaimPress = () => {
    if (canClaim) {
      mutation.mutate()
    }
  }

  // We don't need to show a loading spinner here since TotalRewards handles it

  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} $gtLg={{ w: '50%' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap={'$4'}>
          <TotalRewards
            rewards={formattedRewards}
            isLoading={affiliateRewards.isLoading || coin.isLoading}
            coin={coin.data || undefined}
          />
          <Paragraph size={'$7'} fontWeight={'500'}>
            Rewards History
          </Paragraph>
          <RewardsFeed />
        </YStack>
      </ScrollView>

      <YStack>
        {hasAnyRewards && !hasEnoughRewards && coin.data ? (
          <Paragraph color={'$color10'} ta="center" size="$3">
            You need to have at least{' '}
            {formatCoinAmount({ amount: MIN_REWARD_CLAIM, coin: coin.data })} {coin.data.symbol} to
            claim rewards
          </Paragraph>
        ) : null}

        {mutation.isPending ? (
          <Fade key="userop-state">
            <Paragraph color={'$color10'} ta="center" size="$3">
              {useropState}
            </Paragraph>
          </Fade>
        ) : null}

        <XStack alignItems="center" jc="center" gap={'$2'}>
          {[calls.error, sendAccount.error, uop.error, mutation.error, affiliateRewards.error]
            .filter(Boolean)
            .map((e) =>
              e ? (
                <Paragraph key={e.message} color="$error" role="alert">
                  {toNiceError(e)}
                </Paragraph>
              ) : null
            )}
        </XStack>

        <SectionButton
          onPress={handleClaimPress}
          disabled={!canClaim || mutation.isPending}
          iconAfter={mutation.isPending ? <Spinner size="small" /> : undefined}
        >
          CLAIM REWARDS
        </SectionButton>
      </YStack>
    </YStack>
  )
}

const RewardsFeed = () => {
  const coin = useERC20AssetCoin()
  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useEarnRewardsActivityFeed({
      pageSize: 10,
    })

  const sections = useMemo(() => {
    if (!data?.pages) return []

    const activities = data.pages.flat()
    const groups = activities.reduce<Record<string, typeof activities>>((acc, activity) => {
      const isToday = new Date(activity.created_at).toDateString() === new Date().toDateString()
      const dateKey = isToday
        ? 'Today'
        : new Date(activity.created_at).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
          })

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }

      acc[dateKey].push(activity)
      return acc
    }, {})

    return Object.entries(groups).map(([title, data], index) => ({
      title,
      data,
      index,
    }))
  }, [data?.pages])

  if (!coin.isSuccess || !coin.data) return null
  if (isLoading) return <Spinner size="small" />
  if (error) return <Paragraph>{error.message}</Paragraph>
  if (!sections.length) return <Paragraph>No rewards activity</Paragraph>

  return (
    <Fade>
      <SectionList
        sections={sections}
        showsVerticalScrollIndicator={false}
        keyExtractor={(activity) => `${activity.event_name}-${activity.created_at.getTime()}`}
        renderItem={({ item: activity, index, section }) => (
          <YGroup
            bc="$color1"
            px="$2"
            $gtLg={{
              px: '$3.5',
            }}
            {...(index === 0 && {
              pt: '$2',
              $gtLg: {
                pt: '$3.5',
              },
              borderTopLeftRadius: '$4',
              borderTopRightRadius: '$4',
            })}
            {...(index === section.data.length - 1 && {
              pb: '$2',
              $gtLg: {
                pb: '$3.5',
              },
              borderBottomLeftRadius: '$4',
              borderBottomRightRadius: '$4',
            })}
          >
            <YGroup.Item>
              <TokenActivityRow activity={activity} />
            </YGroup.Item>
          </YGroup>
        )}
        renderSectionHeader={({ section: { title, index } }) => (
          <H4
            fontWeight={'600'}
            size={'$7'}
            pt={index === 0 ? 0 : '$3.5'}
            pb="$3.5"
            bc="$background"
          >
            {title}
          </H4>
        )}
        onEndReached={() => hasNextPage && fetchNextPage()}
        ListFooterComponent={!isLoading && isFetchingNextPage ? <Spinner size="small" /> : null}
        stickySectionHeadersEnabled={true}
      />
    </Fade>
  )
}

interface TotalRewardsProps {
  rewards?: string
  isLoading?: boolean
  coin?: erc20Coin
}

const TotalRewards = ({ rewards, isLoading, coin }: TotalRewardsProps = {}) => {
  // Use the provided rewards or default to '0'
  const totalValue = rewards || '0'

  if (isLoading) {
    return (
      <Fade>
        <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
          <YStack gap={'$4'} ai="center" jc="center" h={120}>
            <Spinner size="large" color={'$color12'} />
          </YStack>
        </Card>
      </Fade>
    )
  }

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <YStack gap={'$4'}>
          <XStack ai={'center'} gap={'$2'}>
            <IconCoin symbol={coin?.symbol || ''} size={'$2'} />
            <Paragraph size={'$7'}>{coin?.symbol || ''}</Paragraph>
          </XStack>
          <YStack gap={'$2'}>
            <Paragraph
              fontWeight={'500'}
              size={(() => {
                switch (true) {
                  case totalValue.length > 16:
                    return '$9'
                  default:
                    return '$11'
                }
              })()}
              $gtLg={{
                size: (() => {
                  switch (true) {
                    case totalValue.length > 16:
                      return '$9'
                    case totalValue.length > 8:
                      return '$10'
                    default:
                      return '$11'
                  }
                })(),
              }}
            >
              {totalValue}
            </Paragraph>
          </YStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          {coin ? <TokenDetailsMarketData coin={coin} /> : <Spinner size="small" />}
        </YStack>
      </Card>
    </Fade>
  )
}
