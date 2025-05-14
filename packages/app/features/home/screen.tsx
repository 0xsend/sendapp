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
import { StablesBalanceCard } from './StablesBalanceCard'
import { TokenDetails } from './TokenDetails'
import { useRootScreenParams } from 'app/routers/params'

import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useRouter } from 'solito/router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'

import { SavingsBalanceCard } from './SavingsBalanceCard'
import { InvestmentsBalanceCard } from './InvestmentsBalanceCard'
import { AddInvestmentLink, InvestmentsBalanceList } from './InvestmentBalanceList'
import { StablesBalanceList } from './StablesBalanceList'

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
          $gtLg={{ display: 'flex', w: '45%', gap: '$5', pb: 0 }}
          width="100%"
          display={!queryParams.token ? 'flex' : 'none'}
          gap="$5"
          ai={'center'}
        >
          <StablesBalanceCard />
          <Paragraph fontSize={'$7'} fontWeight={'500'} color={'$color12'} als="flex-start">
            Save & Invest
          </Paragraph>
          <SavingsBalanceCard />
          <InvestmentsBalanceCard />
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
        <InvestmentsBalanceList />
      </Card>
      <AddInvestmentLink />
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
