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
  useMedia,
  XStack,
  type XStackProps,
  YStack,
  Theme,
} from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { TokenDetails } from './TokenDetails'
import { useRootScreenParams } from 'app/routers/params'

import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useRouter } from 'solito/router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'

import { StablesBalanceCard } from './StablesBalanceCard'
import { SavingsBalanceCard } from './SavingsBalanceCard'
import { InvestmentsBalanceCard, InvestmentsPortfolioCard } from './InvestmentsBalanceCard'
import { InvestmentsBalanceList } from './InvestmentBalanceList'
import { StablesBalanceList } from './StablesBalanceList'
import { RewardsCard } from './RewardsCard'
import { FriendsCard } from './FriendsCard'
import { useCoins } from 'app/provider/coins'
import { useEffect, useMemo, useState } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { investmentCoins } from 'app/data/coins'
import { CoinSheet } from 'app/components/CoinSheet'
import { Link } from 'solito/link'
import { Platform } from 'react-native'
import { usePathname } from 'app/utils/usePathname'
import { useTokensMarketData } from 'app/utils/coin-gecko'
import { formatUnits } from 'viem'

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
          <SavingsBalanceCard href="/earn" w="100%" />
          <InvestmentsBalanceCard padded size="$5" gap="$3" w="100%">
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
      </XStack>
    </IsPriceHiddenProvider>
  )
}

export function InvestmentsBody() {
  const { investmentCoins: myInvestmentCoins, isLoading } = useCoins()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  useHoverStyles()
  const pathname = usePathname()

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
    const delta = assets.reduce((s, a) => s + (a.value * a.pct24h) / 100, 0)
    const weightedPct =
      total === 0 ? 0 : assets.reduce((s, a) => s + (a.value / total) * a.pct24h, 0)
    return { delta24hUSD: delta, pct24h: weightedPct }
  }, [marketData, ownedCoins])

  useEffect(() => {
    if (pathname === '/trade') {
      setIsSheetOpen(false)
    }
  }, [pathname])

  return (
    <YStack ai="center" $gtXs={{ gap: '$3' }} gap={'$3.5'} f={1}>
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
                  {`${delta24hUSD > 0 ? '+' : delta24hUSD < 0 ? '-' : ''}$${Math.abs(delta24hUSD).toFixed(2)}`}
                </Paragraph>
                {/* Small neutral pill to mirror style (no color change) */}
                <Theme name={pct24h >= 0 ? 'green_active' : 'red_active'}>
                  <Paragraph
                    fontSize={'$2'}
                    fontWeight={400}
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
                    {`${pct24h > 0 ? '+' : pct24h < 0 ? '-' : ''}${Math.abs(pct24h).toFixed(2)}%`}
                  </Paragraph>
                </Theme>
              </YStack>
            )}
          </YStack>
        </Card>
        <Card f={1} padded elevation={'$0.75'} jc={'center'} ai={'center'} w="100%">
          <YStack gap={'$2'} jc={'center'} ai={'center'}>
            <Paragraph color={'$color10'} size={'$4'}>
              Total Return
            </Paragraph>
            {isLoadingMarket ? (
              <Spinner size={'small'} />
            ) : (
              <YStack ai={'center'} gap={'$2'}>
                <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                  —
                </Paragraph>
                <Paragraph fontSize={'$2'} fontWeight={400} bc={'$color2'} px={'$1.5'} br={'$2'}>
                  —
                </Paragraph>
              </YStack>
            )}
          </YStack>
        </Card>
        <Card f={1} padded elevation={'$0.75'} jc={'center'} ai={'center'} w="100%">
          <YStack gap={'$2'} jc={'center'} ai={'center'}>
            <Paragraph color={'$color10'} size={'$4'}>
              Investment
            </Paragraph>
            {isLoadingMarket ? (
              <Spinner size={'small'} />
            ) : (
              <YStack ai={'center'} gap={'$2'}>
                <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                  —
                </Paragraph>
                <Paragraph fontSize={'$2'} fontWeight={400} bc={'$color2'} px={'$1.5'} br={'$2'}>
                  —
                </Paragraph>
              </YStack>
            )}
          </YStack>
        </Card>
      </XStack>

      {/* Holdings list */}
      <YStack w={'100%'} gap={'$2'}>
        <H4 fontWeight={600} size={'$7'}>
          Your Holdings
        </H4>
        <Card
          bc={'$color1'}
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
          {investmentCoins.map((coin) => (
            <Link
              key={coin.symbol}
              href={{
                pathname: '/',
                query: { token: coin.token },
              }}
            >
              <CoinSheet.Item coin={coin} />
            </Link>
          ))}
        </CoinSheet.Items>
      </CoinSheet>
    </YStack>
  )
}

export function StablesBody() {
  const media = useMedia()

  return (
    <YStack $gtXs={{ gap: '$3' }} gap={'$3.5'} f={1}>
      {media.lg && (
        <StablesBalanceCard>
          <StablesBalanceCard.StablesScreenHeader />
          <StablesBalanceCard.Footer>
            <StablesBalanceCard.Balance />
          </StablesBalanceCard.Footer>
        </StablesBalanceCard>
      )}

      <Card
        bc={'$color1'}
        width="100%"
        $gtSm={{
          p: '$4',
        }}
      >
        <StablesBalanceList />
      </Card>
    </YStack>
  )
}

export const HomeBodyCard = styled(Card, {
  size: '$5',
  br: '$7',
  f: 1,
  mah: 150,
  p: '$1.5',
})

export const HomeBodyCardRow = styled(XStack, {
  gap: '$3',
  w: '100%',
  mih: 125,
  jc: 'center',
})
