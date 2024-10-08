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
} from '@my/ui'
import { IconError } from 'app/components/icons'
import { coins, coinsDict } from 'app/data/coins'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { TokenBalanceCard } from './TokenBalanceCard'
import { TokenBalanceList } from './TokenBalanceList'
import { TokenDetails } from './TokenDetails'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import Search from 'app/components/SearchBar'
import { useTagSearch } from 'app/provider/tag-search'
import { DepositAddress } from 'app/components/DepositAddress'
import { useRootScreenParams } from 'app/routers/params'
import { parseUnits } from 'viem'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { DepositButton, SendButton } from './HomeButtons'

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
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const selectedCoin = useCoinFromTokenParam()
  const { balances, isLoading: balancesIsLoading } = useSendAccountBalances()

  const [usdcBalance, sendBalance, ethBalance] = [balances?.USDC, balances?.SEND, balances?.ETH]

  const canSend =
    usdcBalance !== undefined &&
    usdcBalance >= parseUnits('.20', coinsDict[usdcAddress[baseMainnet.id]].decimals)

  const transfersUnavailable =
    !canSend && ((sendBalance && sendBalance > 0n) || (ethBalance && ethBalance > 0n))

  if (balancesIsLoading || isSendAccountLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner size="large" />
      </Stack>
    )

  return (
    <XStack w={'100%'} jc={'space-between'} $gtLg={{ gap: '$11' }} $lg={{ f: 1 }} {...props}>
      <YStack
        $gtLg={{ width: 455, display: 'flex' }}
        display={!selectedCoin ? 'flex' : 'none'}
        width="100%"
        ai={'center'}
      >
        {!canSend ? (
          <>
            <Card
              p={36}
              ai={'center'}
              gap="$5"
              jc="space-around"
              w={'100%'}
              $lg={{ bc: '$backgroundTransparent' }}
            >
              <YStack gap="$5" $lg={{ display: 'none' }}>
                <XStack w="100%">
                  <DepositButton />
                </XStack>
                <XStack ai="center">
                  <Paragraph fontWeight={'500'}>Or direct deposit on Base</Paragraph>
                  <DepositAddress address={sendAccount?.address} />
                </XStack>
              </YStack>
              {transfersUnavailable && (
                <>
                  <XStack w="100%" theme="yellow_active" gap="$3" ai="center">
                    <IconError size={'$3'} />
                    <Paragraph $gtMd={{ fontSize: '$6', fontWeight: '500' }}>
                      A minimum of .20 USDC is required to unlock sending
                    </Paragraph>
                  </XStack>
                </>
              )}
            </Card>
          </>
        ) : (
          <Card
            $gtLg={{ p: 36 }}
            $lg={{ bc: 'transparent' }}
            py={'$6'}
            px={'$2'}
            w={'100%'}
            jc="space-between"
            br={12}
            gap="$6"
          >
            <XStack w={'100%'} jc={'center'} ai="center" $lg={{ f: 1 }}>
              <TokenBalanceCard />
            </XStack>
            <XStack $lg={{ display: 'none' }} pt={'$4'} jc={'center'} gap={'$4'}>
              <Stack f={1} w="50%" flexDirection="row-reverse" maw={350}>
                <DepositButton />
              </Stack>
              {canSend && (
                <Stack f={1} w="50%" jc={'center'} maw={350}>
                  <SendButton />
                </Stack>
              )}
            </XStack>
          </Card>
        )}
        <YStack w={'100%'} ai={'center'}>
          <YStack width="100%">
            <TokenBalanceList coins={coins} />
          </YStack>
        </YStack>
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
