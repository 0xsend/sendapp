import {
  AnimatePresence,
  Button,
  Card,
  H1,
  H4,
  Paragraph,
  Spinner,
  Stack,
  styled,
  Theme,
  useMedia,
  XStack,
  type XStackProps,
  YStack,
} from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { TokenDetails } from './TokenDetails'
import { useRootScreenParams } from 'app/routers/params'

import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useRouter } from 'solito/router'
import { IsPriceHiddenProvider, useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'

import { StablesBalanceCard } from './StablesBalanceCard'
import { SavingsBalanceCard } from './SavingsBalanceCard'
import { InvestmentsBalanceCard, InvestmentsPortfolioCard } from './InvestmentsBalanceCard'
import { InvestmentsBalanceList } from './InvestmentBalanceList'
import { StablesBalanceList } from './StablesBalanceList'
import { RewardsCard } from './RewardsCard'
import { FriendsCard } from './FriendsCard'
import { useCoins } from 'app/provider/coins'
import { useMemo, useState } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import type { coin } from 'app/data/coins'
import { investmentCoins } from 'app/data/coins'
import { CoinSheet } from 'app/components/CoinSheet'
import { Link } from 'solito/link'
import { Platform } from 'react-native'
import { useTokensMarketData } from 'app/utils/coin-gecko'
import { formatUnits } from 'viem'
import { calculatePercentageChange } from './utils/calculatePercentageChange'
import { localizeAmount } from 'app/utils/formatAmount'

export function HomeScreen() {
  const media = useMedia()
  const router = useRouter()
  const supabase = useSupabase()
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()

  return (
    <YStack f={1}>
      <AnimatePresence>
        {(() => {
          switch (true) {
            case isSendAccountLoading:
              return (
                <Stack f={1} h={'100%'} ai={'center'} jc={'center'}>
                  <Spinner size="large" />
                </Stack>
              )
            case !sendAccount:
              return (
                <Stack f={1} h={'100%'} ai={'center'} jc={'center'} gap="$4">
                  <H1 theme="red">No send account found</H1>
                  <Paragraph>This should never happen.</Paragraph>
                  <Button
                    onPress={() => {
                      router.push('/_sitemap')
                    }}
                  >
                    Sitemap
                  </Button>
                  <Button onPress={() => router.push('/auth/onboarding')}>Go To Onboarding</Button>
                  <Button onPress={() => supabase.auth.signOut()}>Sign Out</Button>
                </Stack>
              )
            default:
              return (
                <HomeBody
                  key="home-body"
                  animation="200ms"
                  animateOnly={['opacity', 'transform']}
                  enterStyle={{
                    opacity: 0,
                    y: media.gtLg ? 0 : 300,
                  }}
                  exitStyle={{
                    opacity: 0,
                    y: media.gtLg ? 0 : 300,
                  }}
                />
              )
          }
        })()}
      </AnimatePresence>
    </YStack>
  )
}

function HomeBody(props: XStackProps) {
  const { coin: selectedCoin, isLoading } = useCoinFromTokenParam()
  const [queryParams] = useRootScreenParams()

  if (isLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner size="large" />
      </Stack>
    )

  return (
    <IsPriceHiddenProvider>
      <XStack
        w={'100%'}
        $gtLg={{ gap: '$5', pb: '$3.5' }}
        $lg={{ f: 1, pt: '$3' }}
        minHeight={'100%'}
        {...props}
      >
        <YStack
          $gtLg={{ display: 'flex', w: '45%', pb: 0 }}
          width="100%"
          display={!queryParams.token || Platform.OS !== 'web' ? 'flex' : 'none'}
          gap="$3"
          ai={'center'}
        >
          <StablesBalanceCard>
            <StablesBalanceCard.HomeScreenHeader />
            <StablesBalanceCard.Footer>
              <StablesBalanceCard.Balance />
              <StablesBalanceCard.Actions />
            </StablesBalanceCard.Footer>
          </StablesBalanceCard>
          <SavingsBalanceCard w="100%" />
          <InvestmentsBalanceCard padded gap="$3" w="100%">
            <InvestmentsBalanceCard.HomeScreenHeader />
            <Card.Footer jc="space-between" ai="center">
              <YStack gap="$3">
                <XStack ai="center" gap={'$3'} w="100%">
                  <InvestmentsBalanceCard.Balance />
                  <InvestmentsBalanceCard.Aggregate />
                </XStack>
                <InvestmentsBalanceCard.WeeklyDelta />
              </YStack>
              <InvestmentsBalanceCard.Preview />
            </Card.Footer>
          </InvestmentsBalanceCard>
          <HomeBodyCardRow>
            <RewardsCard w="55%" href={'/rewards'} />
            <FriendsCard href="/account/affiliate" />
          </HomeBodyCardRow>
        </YStack>
        <AnimatePresence>
          {(() => {
            switch (true) {
              case Platform.OS !== 'web':
                return null
              case selectedCoin !== undefined:
                return <TokenDetails />
              case queryParams.token === 'investments':
                return <InvestmentsBody />
              case queryParams.token === 'stables':
                return <StablesBody />
              default:
                return null
            }
          })()}
        </AnimatePresence>
      </XStack>
    </IsPriceHiddenProvider>
  )
}

export function InvestmentsBody() {
  const { investmentCoins: myInvestmentCoins, isLoading } = useCoins()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  useHoverStyles()
  const { isPriceHidden } = useIsPriceHidden()

  // Market data for portfolio-level computations
  const ownedCoins = myInvestmentCoins.filter((c) => c?.balance && c.balance > 0n)
  const { data: marketData, isLoading: isLoadingMarket } = useTokensMarketData()

  const { delta24hUSD, pct24h } = useMemo(() => {
    if (!marketData?.length || ownedCoins.length === 0) return { delta24hUSD: 0, pct24h: 0 }

    const assets = ownedCoins.map((coin) => {
      const md = marketData.find((m) => m.id === coin.coingeckoTokenId)
      if (!md || !coin.balance) return { value: 0, pct24h: 0 }
      const balance = Number(formatUnits(coin.balance, coin.decimals))
      const value = balance * (md.current_price ?? 0)
      const pct24h =
        md.price_change_percentage_24h_in_currency ?? md.price_change_percentage_24h ?? 0
      return { value, pct24h }
    })

    const total = assets.reduce((s, a) => s + a.value, 0)
    const delta = assets.reduce((s, a) => {
      const actualChange = calculatePercentageChange(a.value, a.pct24h)
      return s + actualChange
    }, 0)
    const weightedPct =
      total === 0 ? 0 : assets.reduce((s, a) => s + (a.value / total) * a.pct24h, 0)
    return { delta24hUSD: delta, pct24h: weightedPct }
  }, [marketData, ownedCoins])

  const formattedDeltaUSD = localizeAmount(Math.abs(delta24hUSD).toFixed(2))
  const sign = delta24hUSD >= 0 ? '+' : '-'

  const media = useMedia()

  return (
    <YStack
      key={media.gtLg ? 'investments-body-lg' : 'investments-body-xs'}
      {...(media.gtLg && {
        animation: '100ms',
        enterStyle: {
          o: 0,
          x: -30,
        },
        exitStyle: {
          o: 0,
          x: -20,
        },
      })}
      ai="center"
      $gtXs={{ gap: '$3' }}
      gap={'$3.5'}
      f={1}
    >
      <InvestmentsPortfolioCard padded size="$6" w="100%" mah={220} gap="$5">
        <Card.Header p={0}>
          <Paragraph
            fontSize={'$5'}
            fontWeight="400"
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Portfolio Value
          </Paragraph>
        </Card.Header>

        <InvestmentsBalanceCard.Body />
        <InvestmentsBalanceCard.Footer onInvest={() => setIsSheetOpen(true)} />
      </InvestmentsPortfolioCard>

      {/* Summary cards under the header */}
      <XStack w={'100%'} gap={'$3'}>
        <Card f={1} padded elevation={'$0.75'} jc={'center'} ai={'center'} w="100%">
          <YStack gap={'$2'} jc={'center'} ai={'center'}>
            <Paragraph color={'$color10'} size={'$4'}>
              Today
            </Paragraph>
            {isLoadingMarket ? (
              <Spinner size={'small'} />
            ) : (
              <YStack ai={'center'} gap={'$2'}>
                <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                  {isPriceHidden ? '///////' : `${sign}$${formattedDeltaUSD}`}
                </Paragraph>
                {/* Small neutral pill to mirror style (no color change) */}
                <Theme name={pct24h >= 0 ? 'green_active' : 'red_active'}>
                  <XStack
                    bc={'$color2'}
                    $theme-dark={{
                      bc: pct24h >= 0 ? 'rgba(134, 174, 128, 0.2)' : 'rgba(229, 115, 115, 0.2)',
                    }}
                    $theme-light={{
                      bc: pct24h >= 0 ? 'rgba(134, 174, 128, 0.16)' : 'rgba(229, 115, 115, 0.16)',
                    }}
                    px={'$1.5'}
                    br={'$2'}
                  >
                    <Paragraph fontSize={'$2'} fontWeight={400}>
                      {`${pct24h > 0 ? '+' : pct24h < 0 ? '-' : ''}${Math.abs(pct24h).toFixed(2)}%`}
                    </Paragraph>
                  </XStack>
                </Theme>
              </YStack>
            )}
          </YStack>
        </Card>
        <Card f={1} padded elevation={'$0.75'} jc={'center'} ai={'center'} w="100%">
          <YStack gap={'$2'} jc={'center'} ai={'center'}>
            {/* <Paragraph color={'$color10'} size={'$4'}>
              Total Return
            </Paragraph> */}
            {isLoadingMarket ? (
              <Spinner size={'small'} />
            ) : (
              <YStack ai={'center'} gap={'$2'}>
                {/* <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                  —
                </Paragraph> */}
                <XStack bc={'$color2'} px={'$1.5'} br={'$2'}>
                  {/* <Paragraph fontSize={'$2'} fontWeight={400}>
                    —
                  </Paragraph> */}
                </XStack>
              </YStack>
            )}
          </YStack>
        </Card>
        <Card f={1} padded elevation={'$0.75'} jc={'center'} ai={'center'} w="100%">
          <YStack gap={'$2'} jc={'center'} ai={'center'}>
            {/* <Paragraph color={'$color10'} size={'$4'}>
              Investment
            </Paragraph> */}
            {isLoadingMarket ? (
              <Spinner size={'small'} />
            ) : (
              <YStack ai={'center'} gap={'$2'}>
                {/* <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                  —
                </Paragraph> */}
                <XStack bc={'$color2'} px={'$1.5'} br={'$2'}>
                  {/* <Paragraph fontSize={'$2'} fontWeight={400}>
                    —
                  </Paragraph> */}
                </XStack>
              </YStack>
            )}
          </YStack>
        </Card>
      </XStack>

      {/* Holdings list */}
      <YStack w={'100%'} gap={'$2'}>
        <H4 size="$7">Your Holdings</H4>
        <Card
          width="100%"
          p="$2"
          $gtSm={{
            p: '$4',
          }}
        >
          {isLoading ? (
            <YStack p="$3.5" ai="center">
              <Spinner />
            </YStack>
          ) : (
            <InvestmentsBalanceList coins={myInvestmentCoins} />
          )}
        </Card>
      </YStack>

      <CoinSheet open={isSheetOpen} onOpenChange={() => setIsSheetOpen(false)}>
        {Platform.OS === 'web' && (
          <CoinSheet.Handle onPress={() => setIsSheetOpen(false)}>New Investments</CoinSheet.Handle>
        )}
        <CoinSheet.Items>
          {investmentCoins.map((coin) =>
            Platform.OS === 'web' ? (
              <InvestSheetItemWeb key={coin.symbol} coin={coin} />
            ) : (
              <InvestSheetItemNative
                key={coin.symbol}
                coin={coin}
                onPress={() => setIsSheetOpen(false)}
              />
            )
          )}
        </CoinSheet.Items>
      </CoinSheet>
    </YStack>
  )
}

const InvestSheetItemWeb = ({ coin }: { coin: coin }) => {
  return (
    <Link
      key={coin.symbol}
      href={{
        pathname: '/',
        query: { token: coin.token },
      }}
    >
      <CoinSheet.Item coin={coin} />
    </Link>
  )
}

const InvestSheetItemNative = ({ coin, onPress }: { coin: coin; onPress: () => void }) => {
  const router = useRouter()

  const handlePress = () => {
    onPress()
    router.push({ pathname: '/token', query: { token: coin.token } })
  }

  return (
    <XStack key={coin.symbol} onPress={handlePress}>
      <CoinSheet.Item coin={coin} />
    </XStack>
  )
}

export const StablesBody = YStack.styleable((props) => {
  const media = useMedia()

  return (
    <YStack
      key={media.gtLg ? 'stables-body-lg' : 'stables-body-xs'}
      {...(media.gtLg && {
        animation: '100ms',
        enterStyle: {
          o: 0,
          x: -30,
        },
        exitStyle: {
          o: 0,
          x: -20,
        },
      })}
      $gtXs={{ gap: '$3' }}
      gap={'$3.5'}
      f={1}
      {...props}
    >
      {media.lg && (
        <StablesBalanceCard materialInteractive={false}>
          <StablesBalanceCard.StablesScreenHeader />
          <StablesBalanceCard.Footer>
            <StablesBalanceCard.Balance />
          </StablesBalanceCard.Footer>
        </StablesBalanceCard>
      )}

      <Card
        width="100%"
        $gtSm={{
          p: '$4',
        }}
      >
        <StablesBalanceList />
      </Card>
    </YStack>
  )
})

StablesBody.displayName = 'StablesBody'

export const HomeBodyCard = styled(Card, {
  size: '$5',
  br: '$7',
  f: 1,
  mah: 150,
  p: '$1.5',
  materialInteractive: true,
})

export const HomeBodyCardRow = styled(XStack, {
  gap: '$3',
  w: '100%',
  mih: 125,
  jc: 'center',
})
