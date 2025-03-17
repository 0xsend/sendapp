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
} from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { useMemo } from 'react'
import { SectionList } from 'react-native'
import { type SendEarnActivity, useSendEarnActivity, useSendEarnCoinBalances } from '../hooks'
import { useERC20CoinAsset } from '../params'

export const EarningsBalance = () => {
  // const { push } = useRouter()

  // TODO loader when deposit balances are loading
  // if (false) {
  //   return <Spinner size="large" color={'$color12'} />
  // }

  // const handleClaimPress = () => {
  //   // TODO plug claim rewards logic

  //   push('/earn')
  // }

  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} $gtLg={{ w: '50%' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap={'$4'}>
          <TotalEarning />
          <Paragraph size={'$7'} fontWeight={'500'}>
            Earnings History
          </Paragraph>
          <EarningsFeed />
        </YStack>
      </ScrollView>
      {/* <SectionButton text={'CLAIM EARNINGS'} onPress={handleClaimPress} /> */}
    </YStack>
  )
}

export const EarningsFeed = () => {
  const coin = useERC20CoinAsset()
  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useSendEarnActivity({
      pageSize: 10,
    })

  const sections = useMemo(() => {
    if (!data?.pages) return []

    const activities = data.pages.flat()
    const groups = activities.reduce<Record<string, SendEarnActivity[]>>((acc, activity) => {
      const isToday =
        new Date(activity.block_time * 1000).toDateString() === new Date().toDateString()
      const dateKey = isToday
        ? 'Today'
        : new Date(activity.block_time * 1000).toLocaleDateString(undefined, {
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
  if (!sections.length) return <Paragraph>No earnings activity</Paragraph>

  return (
    <Fade>
      <SectionList
        sections={sections}
        showsVerticalScrollIndicator={false}
        keyExtractor={(activity) => activity.tx_hash}
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
              <XStack p="$3" justifyContent="space-between">
                <YStack>
                  <Paragraph>{activity.type === 'deposit' ? 'Deposit' : 'Withdraw'}</Paragraph>
                  <Paragraph size="$3" color="$gray10">
                    {coin.data
                      ? formatCoinAmount({ amount: activity.assets, coin: coin.data })
                      : ''}
                  </Paragraph>
                </YStack>
                <Paragraph size="$3" color="$gray10">
                  {new Date(activity.block_time * 1000).toLocaleDateString()}
                </Paragraph>
              </XStack>
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

function TotalEarning() {
  const coin = useERC20CoinAsset()
  const balances = useSendEarnCoinBalances(coin.data || undefined)
  const totalDeposits = useMemo(() => {
    if (!balances.data) return 0n
    const totalCurrentAssets = balances.data.reduce((acc, balance) => {
      return acc + balance.assets
    }, 0n)
    return totalCurrentAssets
  }, [balances.data])
  const totalEarnings = useMemo(() => {
    if (!coin.data) return '0'
    if (!balances.data) return '0'
    const totalAssets = balances.data.reduce((acc, balance) => {
      return acc + balance.currentAssets
    }, 0n)
    return formatCoinAmount({ amount: totalAssets - totalDeposits, coin: coin.data })
  }, [balances.data, totalDeposits, coin.data])

  if (!balances.isSuccess || !coin.isSuccess || !coin.data) return null

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <YStack gap={'$4'}>
          <XStack ai={'center'} gap={'$2'}>
            <IconCoin symbol={coin.data.symbol} size={'$2'} />
            <Paragraph size={'$7'}>{coin.data.symbol}</Paragraph>
          </XStack>
          <YStack gap={'$2'}>
            <Paragraph
              fontWeight={'500'}
              size={totalEarnings.length > 16 ? '$9' : '$11'}
              $gtLg={{
                size: totalEarnings.length > 16 ? '$9' : totalEarnings.length > 8 ? '$10' : '$11',
              }}
            >
              {totalEarnings}
            </Paragraph>
          </YStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <Paragraph
            size={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            ${totalEarnings}
          </Paragraph>
        </YStack>
      </Card>
    </Fade>
  )
}
