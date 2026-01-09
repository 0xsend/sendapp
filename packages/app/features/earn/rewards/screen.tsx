import {
  Card,
  Fade,
  Paragraph,
  PrimaryButton,
  ScrollView,
  Spinner,
  useAppToast,
  useThemeName,
  XStack,
  YStack,
  Separator,
} from '@my/ui'
import { sendBaseMainnetBundlerClient, entryPointAddress } from '@my/wagmi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'
import {
  ActivityRowFactory,
  getAvatarColors,
  getColors,
} from 'app/features/activity/rows/ActivityRowFactory'
import { isHeaderRow } from 'app/features/activity/utils/activityRowTypes'
import { transformActivitiesToRows } from 'app/features/activity/utils/activityTransform'
import { useSendEarn } from 'app/features/earn/providers/SendEarnProvider'
import { useERC20AssetCoin } from 'app/features/earn/params'
import { useSendEarnClaimRewardsCalls } from 'app/features/earn/rewards/hooks'
import { TokenDetailsMarketData } from 'app/features/home/TokenDetailsHeader'
import { useCoin } from 'app/provider/coins'
import { assert } from 'app/utils/assert'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { signUserOp } from 'app/utils/signUserOp'
import { toNiceError } from 'app/utils/toNiceError'
import { useAddressBook } from 'app/utils/useAddressBook'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useAccountNonce, useUserOp } from 'app/utils/userop'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import debug from 'debug'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
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
  const toast = useAppToast()
  const queryClient = useQueryClient()
  const chainId = useChainId()
  const coin = useERC20AssetCoin()
  const balanceCoin = useCoin(coin.data?.symbol)
  const { t } = useTranslation('earn')

  // Get the user's send account
  const sendAccount = useSendAccount()
  const sender = useMemo(() => sendAccount?.data?.address, [sendAccount?.data?.address])
  const nonce = useAccountNonce({ sender })

  // Get the user's affiliate rewards from provider
  const { affiliateRewards, invalidateQueries } = useSendEarn()

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

      setUseropState(t('rewards.status.sending'))

      const userOpHash = await sendBaseMainnetBundlerClient.sendUserOperation({
        userOperation: uop.data,
      })

      setUseropState(t('rewards.status.waiting'))

      const receipt = await withRetry(
        () =>
          sendBaseMainnetBundlerClient.waitForUserOperationReceipt({
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
      setUseropState(t('rewards.status.requesting'))
    },
    onError: (error, variables, context) => {
      // An error happened!
      log('onError', error, variables, context)
    },
    onSuccess: (data, variables, context) => {
      // Boom baby!
      log('onSuccess', data, variables, context)

      toast.show(t('rewards.toast.success'))
    },
    onSettled: (data, error, variables, context) => {
      // Error or success... doesn't matter!
      log('onSettled', data, error, variables, context)
      queryClient.invalidateQueries({ queryKey: nonce.queryKey })
      queryClient.invalidateQueries({ queryKey: calls.queryKey })
      invalidateQueries()
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
    <YStack
      w={'100%'}
      gap={'$4'}
      pb={'$3'}
      f={Platform.OS === 'web' ? undefined : 1}
      $gtLg={{ w: '50%' }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        overflow={'visible'}
        overScrollMode={'never'}
      >
        <YStack gap={'$4'}>
          <TotalRewards
            rewards={formattedRewards}
            isLoading={affiliateRewards.isLoading || coin.isLoading || balanceCoin.isLoading}
            coin={balanceCoin.coin || undefined}
          />
          <Paragraph size={'$7'} fontWeight={'500'}>
            {t('rewards.history.title')}
          </Paragraph>
          <RewardsFeed />
        </YStack>
      </ScrollView>

      <YStack>
        {hasAnyRewards && !hasEnoughRewards && coin.data ? (
          <Paragraph color={'$color10'} ta="center" size="$3">
            {t('rewards.messages.minimum', {
              amount: formatCoinAmount({ amount: MIN_REWARD_CLAIM, coin: coin.data }),
              symbol: coin.data.symbol,
            })}
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

        <PrimaryButton
          onPress={handleClaimPress}
          disabled={!canClaim || mutation.isPending}
          iconAfter={mutation.isPending ? <Spinner size="small" /> : undefined}
        >
          <PrimaryButton.Text>{t('rewards.actions.claim')}</PrimaryButton.Text>
        </PrimaryButton>
      </YStack>
    </YStack>
  )
}

const RewardsFeed = () => {
  const { t: tActivity, i18n } = useTranslation('activity')
  const { t: tEarn } = useTranslation('earn')
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en'
  const theme = useThemeName()
  const isDark = theme.includes('dark')

  const coin = useERC20AssetCoin()
  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useEarnRewardsActivityFeed({
      pageSize: 10,
    })

  // Get data for transform context
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { data: addressBook } = useAddressBook()

  // Transform activities to rows
  const processedData = useMemo(() => {
    if (!data?.pages) return []
    return transformActivitiesToRows(data.pages, {
      t: tActivity,
      locale,
      swapRouters,
      liquidityPools,
      addressBook,
    })
  }, [data?.pages, tActivity, locale, swapRouters, liquidityPools, addressBook])

  // Compute colors once
  const colors = useMemo(() => getColors(isDark), [isDark])
  const avatarColors = useMemo(() => getAvatarColors(isDark), [isDark])

  // Handle reaching end of list for pagination
  const handleLoadMore = useMemo(() => {
    if (!hasNextPage || isFetchingNextPage) return undefined
    return () => fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (!coin.isSuccess || !coin.data) return null
  if (isLoading) return <Spinner size="small" />
  if (error)
    return <Paragraph>{tEarn('rewards.history.error', { message: error.message })}</Paragraph>
  if (!processedData.length) return <Paragraph>{tEarn('rewards.history.empty')}</Paragraph>

  return (
    <Fade>
      <YStack gap="$0">
        {processedData.map((item) => {
          if (isHeaderRow(item)) {
            return (
              <ActivityRowFactory
                key={`header-${item.sectionIndex}-${item.title}`}
                item={item}
                colors={colors}
                avatarColors={avatarColors}
                isDark={isDark}
              />
            )
          }

          return (
            <YStack
              key={item.eventId}
              bc="$color1"
              p={10}
              h={122}
              mah={122}
              {...(item.isFirst && {
                borderTopLeftRadius: '$4',
                borderTopRightRadius: '$4',
              })}
              {...(item.isLast && {
                borderBottomLeftRadius: '$4',
                borderBottomRightRadius: '$4',
              })}
            >
              <ActivityRowFactory
                item={item}
                colors={colors}
                avatarColors={avatarColors}
                isDark={isDark}
              />
            </YStack>
          )
        })}
        {hasNextPage && (
          <XStack jc="center" py="$4">
            {isFetchingNextPage ? (
              <Spinner size="small" />
            ) : (
              <Paragraph
                color="$color10"
                pressStyle={{ opacity: 0.7 }}
                onPress={handleLoadMore}
                cursor="pointer"
              >
                Load more
              </Paragraph>
            )}
          </XStack>
        )}
      </YStack>
    </Fade>
  )
}

interface TotalRewardsProps {
  rewards?: string
  isLoading?: boolean
  coin?: CoinWithBalance
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
              testID={'availableRewards'}
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
