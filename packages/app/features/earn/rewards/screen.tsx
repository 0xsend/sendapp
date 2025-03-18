import {
  Button,
  Card,
  Fade,
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
import { sendCoin, type erc20Coin } from 'app/data/coins'
import { useActivityFeed } from 'app/features/activity/utils/useActivityFeed'
import { SectionButton } from 'app/features/earn/components/SectionButton'
import { useMyAffiliateRewards } from 'app/features/earn/hooks'
import { useERC20AssetCoin } from 'app/features/earn/params'
import { useSendEarnClaimRewardsCalls } from 'app/features/earn/rewards/hooks'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'
import { TokenDetailsMarketData } from 'app/features/home/TokenDetails'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { signUserOp } from 'app/utils/signUserOp'
import { toNiceError } from 'app/utils/toNiceError'
import { useUserOp } from 'app/utils/userop'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import debug from 'debug'
import { useMemo, useState } from 'react'
import { useRouter } from 'solito/router'
import { formatUnits, withRetry } from 'viem'
import { useChainId } from 'wagmi'

const log = debug('app:features:earn:rewards')

export function RewardsBalanceScreen() {
  return <RewardsBalance />
}

function RewardsBalance() {
  const { push } = useRouter()
  const { tokensQuery } = useSendAccountBalances()
  const [useropState, setUseropState] = useState('')
  const toast = useToastController()
  const queryClient = useQueryClient()
  const chainId = useChainId()
  const coin = useERC20AssetCoin()

  // Get the user's send account
  const sendAccount = useSendAccount()
  const sender = useMemo(() => sendAccount?.data?.address, [sendAccount?.data?.address])

  // Get the user's affiliate rewards
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
  const hasRewards = useMemo(() => {
    if (!affiliateRewards.data) return false
    return affiliateRewards.data.assets > 0n
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

      toast.show('Rewards claimed successfully')
      push('/earn')
    },
    onSettled: (data, error, variables, context) => {
      // Error or success... doesn't matter!
      log('onSettled', data, error, variables, context)
      queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey })
    },
  })

  // Determine if the claim button should be enabled
  const canClaim =
    !affiliateRewards.isLoading &&
    !calls.isLoading &&
    !uop.isLoading &&
    hasRewards &&
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
  )
}

// TODO fetch activities that are rewards related, here are all ATM
// TODO add support for activity row and details for rewqrds related activities
const RewardsFeed = () => {
  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetching: isFetchingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = useActivityFeed()

  const { pages } = data ?? {}

  return (
    <>
      {(() => {
        switch (true) {
          case isLoadingActivities:
            return <Spinner size="small" />
          case activitiesError !== null:
            return (
              <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
                {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
              </Paragraph>
            )
          case pages?.length === 0:
            return (
              <>
                <Paragraph fontSize={'$5'}>No rewards activities</Paragraph>
              </>
            )
          default: {
            const activities = (pages || []).flat()

            return (
              <Fade>
                <YGroup bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }}>
                  {activities.map((activity) => (
                    <YGroup.Item key={`${activity.event_name}-${activity.created_at}`}>
                      <TokenActivityRow activity={activity} />
                    </YGroup.Item>
                  ))}
                </YGroup>
              </Fade>
            )
          }
        }
      })()}
      <Fade>
        {!isLoadingActivities && (isFetchingNextPageActivities || hasNextPage) ? (
          <>
            {isFetchingNextPageActivities && <Spinner size="small" />}
            {hasNextPage && (
              <Button
                onPress={() => {
                  void fetchNextPage()
                }}
                disabled={isFetchingNextPageActivities || isFetchingActivities}
                color="$color10"
                width={200}
                mx="auto"
                mt={'$3'}
              >
                Load More
              </Button>
            )}
          </>
        ) : null}
      </Fade>
    </>
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
