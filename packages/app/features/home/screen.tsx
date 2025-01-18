import {
  Paragraph,
  XStack,
  YStack,
  Stack,
  Spinner,
  Card,
  AnimatePresence,
  H4,
  useMedia,
  type XStackProps,
  H1,
  Theme,
} from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { TokenBalanceCard } from './TokenBalanceCard'
import { TokenBalanceList } from './TokenBalanceList'
import { TokenDetails } from './TokenDetails'
import Search from 'app/components/SearchBar'
import { useTagSearch } from 'app/provider/tag-search'
import { DepositAddress } from 'app/components/DepositAddress'
import { useRootScreenParams } from 'app/routers/params'
import { HomeButtons } from './HomeButtons'
import { AlertCircle } from '@tamagui/lucide-icons'
import { useIsSendingUnlocked } from 'app/utils/useIsSendingUnlocked'

function SendSearchBody() {
  const { isLoading, error } = useTagSearch()

  return (
    <AnimatePresence>
      {isLoading && (
        <YStack key="loading" gap="$4" mb="$4">
          <Spinner size="large" color="$send1" />
        </YStack>
      )}
      {error && (
        <YStack key="red" gap="$4" mb="$4">
          <H4 theme={'alt2'}>Error</H4>
          <Paragraph>{error.message}</Paragraph>
        </YStack>
      )}
      <Search.Results />
    </AnimatePresence>
  )
}

function HomeBody(props: XStackProps) {
  const { data: sendAccount } = useSendAccount()
  const { coin: selectedCoin } = useCoinFromTokenParam()
  const { isSendingUnlocked, isLoading } = useIsSendingUnlocked()

  if (isLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner size="large" />
      </Stack>
    )

  return (
    <XStack w={'100%'} $gtLg={{ gap: '$5' }} $lg={{ f: 1, pt: '$3' }} {...props}>
      <YStack
        $gtLg={{ display: 'flex', w: '45%', gap: '$5' }}
        display={!selectedCoin ? 'flex' : 'none'}
        width="100%"
        gap="$5"
        ai={'center'}
      >
        {!isSendingUnlocked ? (
          <>
            <Card p={'$4.5'} ai={'center'} gap="$5" jc="space-around" w={'100%'}>
              <YStack gap="$6" jc="center" ai="center">
                <Theme name="red_active">
                  <AlertCircle size={'$3'} />
                </Theme>
                <YStack ai="center" gap="$2">
                  <H1 tt="uppercase" fontWeight={'800'}>
                    ADD FUNDS
                  </H1>
                  <Paragraph color="$color10" $gtMd={{ fontSize: '$6' }} ta="center">
                    Deposit at least .05 USDC to unlock sending
                  </Paragraph>
                </YStack>
                <XStack w="100%">
                  <HomeButtons.DepositButton mah={40} />
                </XStack>
              </YStack>
            </Card>
          </>
        ) : (
          <TokenBalanceCard />
        )}
        <YStack w={'100%'} ai={'center'}>
          <Card bc={'$color1'} width="100%" p="$4">
            <TokenBalanceList />
          </Card>
        </YStack>
        {isSendingUnlocked && (
          <XStack $lg={{ display: 'none' }} pt={'$4'} jc={'center'} gap={'$4'} w="100%">
            <Stack f={1} w="50%" flexDirection="row-reverse" maw={350}>
              <HomeButtons.GhostDepositButton />
            </Stack>
            <Stack f={1} w="50%" jc={'center'} maw={350}>
              <HomeButtons.SendButton />
            </Stack>
          </XStack>
        )}
      </YStack>

      {selectedCoin !== undefined && <TokenDetails coin={selectedCoin} />}
    </XStack>
  )
}

export function HomeScreen() {
  const media = useMedia()
  const [queryParams] = useRootScreenParams()
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const { search } = queryParams

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
                <Stack f={1} h={'100%'} ai={'center'} jc={'center'}>
                  <Paragraph theme="red_alt1">No send account found</Paragraph>
                </Stack>
              )
            case search !== undefined:
              return <SendSearchBody />
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
