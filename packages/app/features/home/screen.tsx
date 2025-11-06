import {
  AnimatePresence,
  Button,
  Card,
  createStyledContext,
  H1,
  H2,
  H4,
  isWeb,
  Paragraph,
  Shimmer,
  Spinner,
  Stack,
  styled,
  Theme,
  useMedia,
  View,
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
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import type { coin } from 'app/data/coins'
import { investmentCoins } from 'app/data/coins'
import { CoinsModal } from 'app/components/CoinsModal'
import { Link } from 'solito/link'
import type { LayoutChangeEvent } from 'react-native'
import { useTokensMarketData } from 'app/utils/coin-gecko'
import { formatUnits } from 'viem'
import { calculatePercentageChange } from './utils/calculatePercentageChange'
import { localizeAmount } from 'app/utils/formatAmount'
import { IconX } from 'app/components/icons'
import { dynamic } from './utils/dynamic'

export function HomeScreen() {
  const router = useRouter()
  const supabase = useSupabase()
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()

  return (
    <YStack f={1}>
      <AnimatePresence>
        {(() => {
          switch (true) {
            case !sendAccount && !isSendAccountLoading:
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
              return <HomeBody key="home-body" />
          }
        })()}
      </AnimatePresence>
    </YStack>
  )
}

/**
 * RightPanelPage mimics Next.js/Solito router syntax for consistency
 *
 * Example usage:
 *   setPage({ pathname: '/earn/[asset]', query: { asset: 'usdc' } })
 *   setPage({ pathname: '/earn/[asset]/deposit', query: { asset: 'eth' } })
 */
type RightPanelPage = {
  pathname: '/earn' | '/earn/[asset]' | '/earn/[asset]/deposit' | '/earn/[asset]/balance'
  query?: { [key: string]: string | undefined }
} | null

const HomeRightPanelContext = createStyledContext<{
  page: RightPanelPage
  setPage: (page: RightPanelPage) => void
  togglePage: (page: RightPanelPage) => void
  isInsideRightPanel: boolean
}>({
  page: null,
  setPage: () => {},
  togglePage: () => {},
  isInsideRightPanel: false,
})

export const useHomeRightPanel = () => {
  return HomeRightPanelContext.useStyledContext()
}

export const useHomeRightPanelParams = () => {
  const { page } = useHomeRightPanel()
  return page?.query || {}
}

const HomeRightPanelProvider = ({ children }: PropsWithChildren) => {
  const [queryParams, setParams] = useRootScreenParams()
  const [rightPanelPage, setRightPanelPage] = useState<RightPanelPage>(null)

  const handleSetRightPanelPage = useCallback(
    (page: RightPanelPage) => {
      setRightPanelPage(page)
      // clear the token query param to close some panels which opens based on the token query param
      setParams({
        ...queryParams,
        token: undefined,
      })
    },
    [queryParams, setParams]
  )
  const handleTogglePage = useCallback(
    (page: RightPanelPage) => {
      const isSamePage = page && rightPanelPage && page.pathname === rightPanelPage.pathname
      handleSetRightPanelPage(isSamePage ? null : page)
    },
    [handleSetRightPanelPage, rightPanelPage]
  )

  useEffect(() => {
    if (queryParams.token) {
      // when the token query param is set, close other panels which opens based on pathname
      setRightPanelPage(null)
    }
  }, [queryParams.token])

  return (
    <HomeRightPanelContext.Provider
      page={rightPanelPage}
      setPage={handleSetRightPanelPage}
      togglePage={handleTogglePage}
      isInsideRightPanel={true}
    >
      {children}
    </HomeRightPanelContext.Provider>
  )
}

function HomeBody(props: XStackProps) {
  const [queryParams] = useRootScreenParams()

  return (
    <HomeRightPanelProvider>
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
            display={!queryParams.token || !isWeb ? 'flex' : 'none'}
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
              <RewardsCard w="55%" href={'/rewards'} f={1} />
              <FriendsCard href="/account/affiliate" f={1} />
            </HomeBodyCardRow>
          </YStack>
          <RightPanel />
        </XStack>
      </IsPriceHiddenProvider>
    </HomeRightPanelProvider>
  )
}

const EarnScreenLazy = dynamic(
  () => import('app/features/earn/screen').then((mod) => mod.EarnScreen),
  {
    loading: () => <Spinner size="large" color={'$color12'} />,
  }
)

const ActiveEarnScreenLazy = dynamic(
  () => import('app/features/earn/active/screen').then((mod) => mod.ActiveEarningsScreen),
  {
    loading: () => (
      <YStack gap="$4" ai="stretch" f={1} w="100%">
        <Shimmer
          ov="hidden"
          br="$6"
          h={230}
          componentName="Card"
          bg="$background"
          $theme-light={{ bg: '$background' }}
        />
        <XStack gap="$4" h={55} ai="stretch" jc="space-between">
          <Shimmer
            ov="hidden"
            f={1}
            br="$6"
            componentName="Card"
            bg="$background"
            $theme-light={{ bg: '$background' }}
          />
          <Shimmer
            ov="hidden"
            f={1}
            br="$6"
            componentName="Card"
            bg="$background"
            $theme-light={{ bg: '$background' }}
          />
        </XStack>
        <Shimmer
          ov="hidden"
          br="$6"
          h={165}
          y={5}
          componentName="Card"
          bg="$background"
          $theme-light={{ bg: '$background' }}
        />
      </YStack>
    ),
  }
)

const EarnDepositScreenLazy = dynamic(
  () => import('app/features/earn/deposit/screen').then((mod) => mod.DepositScreen),
  {
    loading: () => (
      <YStack ai="stretch" gap="$3" f={1} w="100%">
        <Shimmer
          componentName="Card"
          bg="$background"
          $theme-light={{ bg: '$background' }}
          ov="hidden"
          br="$1"
          als="flex-start"
          w={150}
          h={30}
        />
        <Shimmer
          $theme-light={{ bg: '$background' }}
          bg="$background"
          componentName="Card"
          ov="hidden"
          br="$7"
          h={170}
        />
        <Shimmer
          bg="$background"
          $theme-light={{ bg: '$background' }}
          componentName="Card"
          ov="hidden"
          br="$1"
          mt="$2.5"
          als="flex-start"
          w={150}
          h={30}
        />
        <Shimmer
          $theme-light={{ bg: '$background' }}
          bg="$background"
          componentName="Card"
          ov="hidden"
          br="$7"
          h={220}
        />
        <Shimmer
          $theme-light={{ bg: '$background' }}
          bg="$background"
          componentName="Card"
          ov="hidden"
          br="$7"
          h={160}
          y={10}
        />
        <Shimmer
          $theme-light={{ bg: '$background' }}
          bg="$background"
          componentName="Card"
          ov="hidden"
          br="$3"
          h={50}
          y={60}
        />
      </YStack>
    ),
  }
)

const EarnBalanceScreenLazy = dynamic(
  () => import('app/features/earn/earnings/screen').then((mod) => mod.EarningsBalance),
  {
    loading: () => <Spinner size="large" color={'$color12'} />,
  }
)

const RightPanel = () => {
  const { coin: selectedCoin } = useCoinFromTokenParam()
  const [queryParams] = useRootScreenParams()
  const { page, setPage } = useHomeRightPanel()

  const { gtLg } = useMedia()

  useEffect(() => {
    if (!gtLg && page?.pathname) {
      setPage(null)
    }
  }, [gtLg, page?.pathname, setPage])

  console.log('page', page)

  const content = useMemo(() => {
    if (!isWeb) return null

    if (page?.pathname === '/earn') {
      return <EarnScreenLazy />
    }
    if (page?.pathname === '/earn/[asset]') {
      return <ActiveEarnScreenLazy />
    }
    if (page?.pathname === '/earn/[asset]/deposit') {
      return <EarnDepositScreenLazy />
    }
    if (page?.pathname === '/earn/[asset]/balance') {
      return <EarnBalanceScreenLazy />
    }
    if (selectedCoin !== undefined) {
      return <TokenDetails />
    }
    if (queryParams.token === 'investments') {
      return <InvestmentsBody />
    }
    if (queryParams.token === 'stables') {
      return <StablesBody />
    }
    return null
  }, [selectedCoin, queryParams.token, page])

  return (
    <View f={1} group>
      <AnimatePresence exitBeforeEnter>
        <View
          key={page?.pathname || queryParams.token || 'default'}
          fd="row"
          f={1}
          animation="100ms"
          animateOnly={['transform', 'opacity']}
          enterStyle={{ opacity: 0, x: -30 }}
          exitStyle={{ opacity: 0, x: -20 }}
        >
          {content}
        </View>
      </AnimatePresence>
    </View>
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

  const [modalContainerWidth, setModalContainerWidth] = useState(0)

  const onModalContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setModalContainerWidth(Math.floor(e.nativeEvent.layout.width))
  }, [])

  return (
    <YStack
      key={media.gtLg ? 'investments-body-lg' : 'investments-body-xs'}
      ai="center"
      $gtXs={{ gap: '$4' }}
      gap="$3.5"
      f={1}
    >
      <YStack w="100%" $gtXs={{ gap: '$3' }} gap="$3.5">
        <InvestmentsPortfolioCard
          onLayout={onModalContainerLayout}
          padded
          size="$6"
          w="100%"
          mah={220}
          gap="$5"
        >
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

          <CoinsModal
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            trigger={
              <CoinsModal.Trigger asChild>
                <Button theme="neon_active" br="$4" jc="center" ai="center" pos="relative" mah={32}>
                  <Button.Text color="$black">INVEST</Button.Text>
                </Button>
              </CoinsModal.Trigger>
            }
          >
            <CoinsModal.Content y={-3} w={modalContainerWidth - 24}>
              <XStack bbw={1} bbc="$gray6" p="$3" pl="$3.5" ai="center" jc="space-between" w="100%">
                <H2 size="$7" col="$aztec11" fow="300">
                  New Investments
                </H2>
                <CoinsModal.Close asChild>
                  <Button
                    pressStyle={{
                      scale: 0.9,
                      bg: '$backgroundHover',
                    }}
                    animation="100ms"
                    animateOnly={['transform']}
                    size="$2.5"
                    circular
                  >
                    <Button.Icon scaleIcon={2}>
                      <IconX color="$color10" />
                    </Button.Icon>
                  </Button>
                </CoinsModal.Close>
              </XStack>
              <YStack py="$2.5" w="100%">
                <CoinsModal.Items>
                  {investmentCoins.map((coin) =>
                    isWeb ? (
                      <InvestSheetItemWeb key={coin.symbol} coin={coin} />
                    ) : (
                      <InvestSheetItemNative
                        key={coin.symbol}
                        coin={coin}
                        onPress={() => setIsSheetOpen(false)}
                      />
                    )
                  )}
                </CoinsModal.Items>
              </YStack>
            </CoinsModal.Content>
          </CoinsModal>
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
                    {isPriceHidden ? '******' : `${sign}$${formattedDeltaUSD}`}
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
      </YStack>
      {/* Holdings list */}
      <YStack w="100%" gap="$2">
        <H4 size="$8" fow="400" col="$gray11">
          Your Holdings
        </H4>
        <View gap="$2.5" width="100%">
          {isLoading ? (
            <YStack p="$3.5" ai="center">
              <Spinner />
            </YStack>
          ) : (
            <>
              <InvestmentsBalanceList coins={myInvestmentCoins} />
            </>
          )}
        </View>
      </YStack>
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
      <CoinsModal.Item coin={coin} />
    </Link>
  )
}

const InvestSheetItemNative = ({ coin, onPress }: { coin: coin; onPress: () => void }) => {
  const router = useRouter()

  const handlePress = useCallback(() => {
    onPress()
    router.push({ pathname: '/token', query: { token: coin.token } })
  }, [coin.token, onPress, router])

  return <CoinsModal.Item key={coin.symbol} onPress={handlePress} coin={coin} />
}

export const StablesBody = YStack.styleable((props) => {
  const media = useMedia()

  return (
    <YStack
      key={media.gtLg ? 'stables-body-lg' : 'stables-body-xs'}
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
        materialInteractive
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
  mah: 150,
  p: '$1.5',
  materialInteractive: process.env.TAMAGUI_TARGET === 'web',
})

export const HomeBodyCardRow = styled(XStack, {
  gap: '$3',
  w: '100%',
  mih: 125,
  jc: 'center',
})
