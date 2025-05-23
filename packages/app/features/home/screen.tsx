import {
  AnimatePresence,
  Button,
  Card,
  H1,
  Paragraph,
  Spinner,
  Stack,
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
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'

import { StablesBalanceCard } from './StablesBalanceCard'
import { SavingsBalanceCard } from './SavingsBalanceCard'
import { InvestmentsBalanceCard } from './InvestmentsBalanceCard'
import { InvestmentsBalanceList } from './InvestmentBalanceList'
import { StablesBalanceList } from './StablesBalanceList'
import { RewardsCard } from './RewardsCard'
import { FriendsCard } from './FriendsCard'
import { useCoins } from 'app/provider/coins'
import { useState } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { IconPlus } from 'app/components/icons'
import { investmentCoins } from 'app/data/coins'
import { CoinSheet } from 'app/components/CoinSheet'
import { Link } from 'solito/link'
import { baseMainnet, usdcAddress } from '@my/wagmi'

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
          display={!queryParams.token ? 'flex' : 'none'}
          gap="$3.5"
          ai={'center'}
        >
          <StablesBalanceCard />
          <XStack gap="$3.5" w="100%" mih={136} jc={'center'}>
            <SavingsBalanceCard href="/earn" maw="50%" f={1} />
            <InvestmentsBalanceCard maw="50%" f={1} />
          </XStack>
          <XStack gap="$3.5" w="100%" mih={136} jc={'center'}>
            <RewardsCard href="/explore/rewards" maw="50%" f={1} />
            <FriendsCard href="/account/affiliate" maw="50%" f={1} />
          </XStack>
        </YStack>
        {(() => {
          switch (true) {
            case selectedCoin !== undefined:
              return <TokenDetails coin={selectedCoin} />
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

function InvestmentsBody() {
  const media = useMedia()
  const { investmentCoins: myInvestmentCoins, isLoading } = useCoins()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const hoverStyles = useHoverStyles()

  return (
    <YStack ai="center" $gtXs={{ gap: '$3' }} gap={'$3.5'} f={1}>
      {media.lg && <InvestmentsBalanceCard />}
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
      <Button
        elevation={'$0.75'}
        p="$3"
        hoverStyle={hoverStyles}
        onPress={() => setIsSheetOpen(true)}
      >
        <Button.Icon>
          <IconPlus size="$1" color="$color10" />
        </Button.Icon>
        <Button.Text>See More</Button.Text>
      </Button>

      <CoinSheet open={isSheetOpen} onOpenChange={() => setIsSheetOpen(false)}>
        <CoinSheet.Handle onPress={() => setIsSheetOpen(false)}>New Investments</CoinSheet.Handle>
        <CoinSheet.Items>
          {investmentCoins.map((coin) => (
            <Link
              key={coin.symbol}
              href={{
                pathname: '/trade',
                query: { inToken: usdcAddress[baseMainnet.id], outToken: coin.token },
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

function StablesBody() {
  const media = useMedia()

  return (
    <YStack $gtXs={{ gap: '$3' }} gap={'$3.5'} f={1}>
      {media.lg && <StablesBalanceCard />}

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
