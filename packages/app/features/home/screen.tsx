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
  LinkButton,
} from '@my/ui'
import { IconArrowRight, IconPlus } from 'app/components/icons'
import { coins } from 'app/data/coins'
import { useRootScreenParams } from 'app/routers/params'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { DepositPopover } from '../deposit/DepositPopover'
import { TokenBalanceCard } from './TokenBalanceCard'
import { TokenBalanceList } from './TokenBalanceList'
import { TokenDetails } from './TokenDetails'
import { X } from '@tamagui/lucide-icons'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'

export function HomeScreen() {
  const [queryParams, setParams] = useRootScreenParams()
  const { totalBalance, balances } = useSendAccountBalances()
  const usdcBalance = balances?.[0]?.result

  const selectedCoin = useCoinFromTokenParam()
  const { data: sendAccount, isLoading: sendAccountLoading } = useSendAccount()

  const hasSendAccount = !!sendAccount

  return (
    <YStack f={1}>
      <Stack display="none" $gtLg={{ display: hasSendAccount && selectedCoin ? 'flex' : 'none' }}>
        <Button
          top={'$-8'}
          right={0}
          position="absolute"
          bc="transparent"
          circular
          jc={'center'}
          ai={'center'}
          $lg={{ display: 'none' }}
          hoverStyle={{
            backgroundColor: 'transparent',
            borderColor: '$color11',
          }}
          pressStyle={{
            backgroundColor: 'transparent',
          }}
          focusStyle={{
            backgroundColor: 'transparent',
          }}
          icon={<X size={'$2.5'} />}
          onPress={() => {
            setParams({ ...queryParams, token: undefined })
          }}
        />
      </Stack>
      <XStack w={'100%'} jc={'space-between'} $gtLg={{ gap: '$11' }} $lg={{ f: 1 }}>
        <YStack
          $gtLg={{ width: 455, display: 'flex' }}
          display={hasSendAccount && !selectedCoin ? 'flex' : 'none'}
          width="100%"
          ai={'center'}
        >
          <Card
            $gtLg={{ p: 36 }}
            $lg={{ bc: 'transparent' }}
            py={'$9'}
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
              <DepositPopover />
              {!!totalBalance && usdcBalance && usdcBalance > 0n && (
                <Stack f={1}>
                  <LinkButton href={'/send'} theme="green" br="$4" px={'$3.5'} h={'$4.5'} bw={1}>
                    <XStack w={'100%'} jc={'space-between'} ai={'center'} h="100%">
                      <Button.Text fontWeight={'500'} textTransform={'uppercase'}>
                        Send
                      </Button.Text>
                      <Button.Icon>
                        <IconArrowRight size={'2.5'} />
                      </Button.Icon>
                    </XStack>
                  </LinkButton>
                </Stack>
              )}
            </XStack>
          </Card>
          <Separator $gtLg={{ display: 'none' }} w={'100%'} />
          <YStack w={'100%'} ai={'center'}>
            <YStack width="100%" $gtLg={{ pt: '$3' }} display={hasSendAccount ? 'flex' : 'none'}>
              <TokenBalanceList coins={coins} />
            </YStack>
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
    </YStack>
  )
}

const NoSendAccountMessage = () => {
  return (
    <>
      <H3 fontSize={'$9'} fontWeight={'700'} color={'$color12'} ta="center">
        Register Your Sendtag Today!
      </H3>

      <YStack w="100%" gap="$3">
        <Paragraph fontSize={'$6'} fontWeight={'700'} color={'$color12'} fontFamily={'$mono'}>
          By registering a Sendtag, you can:
        </Paragraph>
        <YStack>
          <Paragraph fontSize={'$4'} fontWeight={'500'} color={'$color12'} fontFamily={'$mono'}>
            1. Send and receive funds using your personalized identifier
          </Paragraph>
          <Paragraph fontSize={'$4'} fontWeight={'500'} color={'$color12'} fontFamily={'$mono'}>
            2. Earn Send It Rewards based on your token balance and referrals
          </Paragraph>
        </YStack>
        <Paragraph fontSize={'$4'} fontWeight={'500'} color={'$color12'} fontFamily={'$mono'}>
          Join us in shaping the Future of Finance.
        </Paragraph>
      </YStack>
    </>
  )
}
