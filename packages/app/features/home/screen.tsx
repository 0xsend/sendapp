import {
  Button,
  Container,
  Paragraph,
  Separator,
  XStack,
  YStack,
  useToastController,
  Stack,
  Spinner,
  Link,
  H3,
} from '@my/ui'
import { IconDeposit, IconPlus } from 'app/components/icons'
import { TokenBalanceList } from './TokenBalanceList'
import { coins } from 'app/data/coins'
import { TokenBalanceCard } from './TokenBalanceCard'
import { useToken } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { X } from '@tamagui/lucide-icons'
import { TokenDetails } from './TokenDetails'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useSendAccounts } from 'app/utils/send-accounts'

export function HomeScreen() {
  const toast = useToastController()
  const [, setTokenParam] = useToken()

  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'

  const selectedCoin = useCoinFromTokenParam()
  const { data: sendAccounts, isLoading: sendAccountLoading } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]

  const hasSendAccount = !(sendAccount === undefined || sendAccount.length === 0)

  return (
    <Container fd={'column'} $gtMd={{ pt: '$5' }}>
      <Stack display="none" $gtLg={{ display: hasSendAccount && selectedCoin ? 'flex' : 'none' }}>
        <Button
          top={'$-8'}
          right={0}
          position="absolute"
          bc="transparent"
          chromeless
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
          icon={<X size={'$2.5'} color={'$color11'} />}
          onPress={() => {
            setTokenParam(undefined)
          }}
        />
      </Stack>
      <XStack w={'100%'} jc={'space-between'} $gtLg={{ gap: '$11' }} $lg={{ f: 1 }}>
        <YStack
          $gtLg={{ width: 360, display: 'flex' }}
          display={hasSendAccount && !selectedCoin ? 'flex' : 'none'}
          width="100%"
          ai={'center'}
        >
          <XStack w={'100%'} jc={'center'} ai="center" $lg={{ f: 1 }}>
            <TokenBalanceCard />
          </XStack>
          <Separator $gtLg={{ display: 'none' }} w={'100%'} borderColor={separatorColor} />
          <YStack w={'100%'} ai={'center'}>
            <XStack w={'100%'} ai={'center'} pt={'$7'}>
              <Button
                px={'$3.5'}
                h={'$6'}
                width={'100%'}
                theme="accent"
                borderRadius={'$4'}
                onPress={() => {
                  // @todo onramp / deposit
                  toast.show('Coming Soon: Deposit')
                }}
                disabled={selectedCoin !== undefined}
                disabledStyle={{ opacity: 0.5 }}
              >
                <XStack w={'100%'} jc={'space-between'} ai={'center'}>
                  <Paragraph
                    // fontFamily={'$mono'}
                    fontWeight={'500'}
                    textTransform={'uppercase'}
                    color={'$black'}
                  >
                    Deposit
                  </Paragraph>
                  <XStack alignItems={'center'} justifyContent={'center'} zIndex={2}>
                    <IconDeposit size={'$2.5'} color={'$black'} />
                  </XStack>
                </XStack>
              </Button>
            </XStack>
            <YStack width="100%" pt="$6" pb="$12" display={hasSendAccount ? 'flex' : 'none'}>
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
                  $theme-dark={{ bc: '$darkest' }}
                  $theme-light={{ bc: '$gray3Light' }}
                  $lg={{ bc: 'transparent' }}
                  $gtLg={{ br: '$6' }}
                >
                  <NoSendAccountMessage />
                  <Stack jc="center" ai="center" $gtLg={{ mt: 'auto' }} $lg={{ m: 'auto' }}>
                    <Link
                      href={'/account/sendtag/checkout'}
                      theme="accent"
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
    </Container>
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
