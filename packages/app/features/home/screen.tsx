import {
  Paragraph,
  Separator,
  XStack,
  YStack,
  Stack,
  Spinner,
  Link,
  H3,
  Card,
  AnimatePresence,
  H4,
  useMedia,
  type XStackProps,
  H5,
} from '@my/ui'
import { IconError, IconPlus } from 'app/components/icons'
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
import { parseUnits, formatUnits } from 'viem'
import { baseMainnet, sendTokenAddress, usdcAddress } from '@my/wagmi'
import { ActionButtonRow, DepositButton } from './ActionButtonRow'

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
    usdcBalance && usdcBalance >= parseUnits('.20', coinsDict[usdcAddress[baseMainnet.id]].decimals)

  const transfersUnavailable =
    !canSend && ((sendBalance && sendBalance > 0n) || (ethBalance && ethBalance > 0n))

  if (balancesIsLoading || isSendAccountLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner size="large" />
      </Stack>
    )

  if (!canSend) {
    return (
      <XStack w={'100%'} jc={'space-between'} $gtLg={{ gap: '$11' }} $lg={{ f: 1 }} {...props}>
        <YStack $gtLg={{ width: 455, display: 'flex' }} width="100%" ai={'center'}>
          <Card
            $lg={{ fd: 'column', bc: 'transparent' }}
            $gtLg={{ p: 36 }}
            py={'$6'}
            px={'$2'}
            ai={'center'}
            gap="$5"
            jc="space-around"
            w={'100%'}
          >
            <XStack w="100%">
              <DepositButton />
            </XStack>
            <XStack ai="center">
              <Paragraph fontWeight={'500'}>Or direct deposit on Base</Paragraph>
              <DepositAddress address={sendAccount?.address} />
            </XStack>
            {transfersUnavailable && (
              <>
                <XStack w="100%" theme="yellow_active" gap="$3" ai="center">
                  <IconError size={'$3'} />
                  <Paragraph $gtMd={{ fontSize: '$6', fontWeight: '500' }}>
                    A minimum of .20 USDC is required to unlock sending
                  </Paragraph>
                </XStack>
                <NoGasBalances />
              </>
            )}
          </Card>
          <Separator $gtLg={{ display: 'none' }} w={'100%'} />
          <YStack w={'100%'} ai={'center'}>
            <NoSendAccountMessage />
          </YStack>
        </YStack>
      </XStack>
    )
  }

  return (
    <XStack w={'100%'} jc={'space-between'} $gtLg={{ gap: '$11' }} $lg={{ f: 1 }} {...props}>
      <YStack
        $gtLg={{ width: 455, display: 'flex' }}
        display={!selectedCoin ? 'flex' : 'none'}
        width="100%"
        ai={'center'}
      >
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
          {<ActionButtonRow $lg={{ display: 'none' }} />}
        </Card>

        <Separator $gtLg={{ display: 'none' }} w={'100%'} />
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

const NoGasBalances = () => {
  const { balances } = useSendAccountBalances()

  const [usdcBalance, sendBalance, ethBalance] = [
    formatUnits(balances?.USDC ?? 0n, coinsDict[usdcAddress[baseMainnet.id]].decimals),
    formatUnits(balances?.SEND ?? 0n, coinsDict[sendTokenAddress[baseMainnet.id]].decimals),
    formatUnits(balances?.ETH ?? 0n, coinsDict.eth.decimals),
  ]

  return (
    <YStack gap="$1" alignSelf="flex-start">
      <H5>Current Balances </H5>
      <Paragraph fontWeight={'500'}>USDC: {Number(usdcBalance).toLocaleString()}</Paragraph>
      <Paragraph fontWeight={'500'}>ETH: {Number(ethBalance).toLocaleString()}</Paragraph>
      <Paragraph fontWeight={'500'}>SEND: {Number(sendBalance).toLocaleString()}</Paragraph>
    </YStack>
  )
}

const NoSendAccountMessage = () => {
  return (
    <YStack
      w="100%"
      ai="center"
      f={1}
      gap="$5"
      p="$6"
      $lg={{ bc: 'transparent' }}
      $gtLg={{ br: '$6' }}
    >
      <H3
        fontSize={'$9'}
        fontWeight={'700'}
        color={'$color12'}
        ta="center"
        textTransform="uppercase"
      >
        Register Your Sendtag Today!
      </H3>

      <YStack w="100%" gap="$3">
        <Paragraph
          fontSize={'$6'}
          fontWeight={'700'}
          color={'$color12'}
          fontFamily={'$mono'}
          ta="center"
        >
          Earn rewards, transfer funds, and claim your unique Sendtag before it's gone.
        </Paragraph>
      </YStack>
      <Stack jc="center" ai="center" $gtLg={{ mt: 'auto' }} $lg={{ m: 'auto' }}>
        <Link
          href={'/account/sendtag/checkout'}
          theme="green"
          borderRadius={'$4'}
          p={'$3.5'}
          $xs={{ p: '$2.5', px: '$4' }}
          px="$6"
          bg="$primary"
        >
          <XStack gap={'$1.5'} ai={'center'} jc="center">
            <IconPlus col={'$black'} />
            <Paragraph textTransform="uppercase" col={'$black'}>
              SENDTAG
            </Paragraph>
          </XStack>
        </Link>
      </Stack>
    </YStack>
  )
}
