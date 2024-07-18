import {
  Button,
  Paragraph,
  Separator,
  XStack,
  YStack,
  Stack,
  Spinner,
  Link,
  H3,
  Card,
  LinkableButton,
} from '@my/ui'
import { IconArrowRight, IconPlus } from 'app/components/icons'
import { coins } from 'app/data/coins'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { DepositPopover } from '../deposit/DepositPopover'
import { TokenBalanceCard } from './TokenBalanceCard'
import { TokenBalanceList } from './TokenBalanceList'
import { TokenDetails } from './TokenDetails'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { DepositAddress } from 'app/components/DepositAddress'

function HomeBody() {
  const { data: sendAccount, isLoading: sendAccountLoading } = useSendAccount()
  const selectedCoin = useCoinFromTokenParam()

  const { balances } = useSendAccountBalances()
  const usdcBalance = balances?.[0]?.result
  const hasSendAccount = !!sendAccount
  const canSend = !!sendAccount && usdcBalance && usdcBalance > 0n

  return (
    <>
      <XStack w={'100%'} jc={'space-between'} $gtLg={{ gap: '$11' }} $lg={{ f: 1 }}>
        <YStack
          $gtLg={{ width: 455, display: 'flex' }}
          display={hasSendAccount && !selectedCoin ? 'flex' : 'none'}
          width="100%"
          ai={'center'}
        >
          {canSend ? (
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
              <XStack w={'100%'} ai={'center'} pt={'$4'} jc="space-around" gap={'$4'}>
                <Stack f={1} w="50%">
                  <DepositPopover />
                </Stack>
                <Stack f={1} w="50%">
                  <SendButton />
                </Stack>
              </XStack>
            </Card>
          ) : (
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
                <DepositPopover />
              </XStack>
              <XStack ai="center">
                <Paragraph>Or direct deposit on base</Paragraph>
                <DepositAddress address={sendAccount?.address} />
              </XStack>
            </Card>
          )}
          <Separator $gtLg={{ display: 'none' }} w={'100%'} />
          <YStack w={'100%'} ai={'center'}>
            {canSend ? (
              <YStack width="100%" $gtLg={{ pt: '$3' }} display={hasSendAccount ? 'flex' : 'none'}>
                <TokenBalanceList coins={coins} />
              </YStack>
            ) : (
              <NoSendAccountMessage />
            )}
          </YStack>
        </YStack>

        {(() => {
          switch (true) {
            case sendAccountLoading:
              return <Spinner size="large" />
            case !hasSendAccount:
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
                  <NoSendAccountMessage />
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
                          SENDTAGS
                        </Paragraph>
                      </XStack>
                    </Link>
                  </Stack>
                </YStack>
              )
            case selectedCoin !== undefined:
              return <TokenDetails coin={selectedCoin} />
            default:
              return <> </>
          }
        })()}
      </XStack>
    </>
  )
}
export function HomeScreen() {
  const { isLoading: sendAccountLoading } = useSendAccount()

  return (
    <YStack f={1} pt="$2">
      {(() => {
        switch (true) {
          case sendAccountLoading:
            return (
              <Stack f={1} h={'100%'} ai={'center'} jc={'center'}>
                <Spinner size="large" />
              </Stack>
            )
          default:
            return <HomeBody />
        }
      })()}
    </YStack>
  )
}

const SendButton = () => (
  <LinkableButton href={'/send'} theme="green" br="$4" px={'$3.5'} h={'$4.5'} w="100%">
    <XStack w={'100%'} jc={'space-between'} ai={'center'} h="100%">
      <Button.Text fontWeight={'500'} textTransform={'uppercase'} $theme-dark={{ col: '$color0' }}>
        Send
      </Button.Text>
      <Button.Icon>
        <IconArrowRight size={'$2.5'} $theme-dark={{ col: '$color0' }} />
      </Button.Icon>
    </XStack>
  </LinkableButton>
)

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
