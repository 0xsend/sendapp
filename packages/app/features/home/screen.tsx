import { Button, Container, Paragraph, Spinner, XStack, YStack, useToastController } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconDeposit, IconEthereum, IconSend, IconUSDC } from 'app/components/icons'
import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
} from '@my/wagmi'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import formatAmount from 'app/utils/formatAmount'
import TokenDetails from './TokenDetails'

export function HomeScreen() {
  const { totalBalance } = useSendAccountBalances()

  const toast = useToastController()
  const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  const coins = [
    { label: 'USDC', token: usdcAddresses[baseMainnet.id], icon: <IconUSDC size={'$2.5'} /> },
    { label: 'Ethereum', token: undefined, icon: <IconEthereum size={'$2.5'} /> },
    { label: 'Send', token: sendAddresses[baseMainnet.id], icon: <IconSend size={'$2.5'} /> },
  ]

  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  return (
    <>
      <Container fd={'column'}>
        <YStack
          $gtLg={{ width: 360 }}
          $sm={{ width: '100%' }}
          $gtSm={{ width: '100%' }}
          ai={'center'}
        >
          {/* Balance Card */}
          <XStack
            w={'100%'}
            jc={'center'}
            $md={{ borderColor: separatorColor, borderBottomWidth: 1 }}
          >
            <XStack w={'100%'} zIndex={4}>
              <YStack py={'$11'}>
                <YStack jc={'center'} gap={'$6'}>
                  <Paragraph
                    fontSize={'$4'}
                    zIndex={1}
                    color={'$color05'}
                    textTransform={'uppercase'}
                  >
                    Total Balance
                  </Paragraph>
                  <XStack style={{ color: 'white' }} gap={'$2.5'}>
                    {totalBalance === undefined ? (
                      <Spinner size={'large'} />
                    ) : (
                      <Paragraph color={'$color12'} fontSize={96} fontWeight={'500'} zIndex={1}>
                        {formatAmount(USDollar.format(totalBalance).split('.')[0])}
                      </Paragraph>
                    )}
                    <Paragraph color={'$color12'} fontSize={'$6'} fontWeight={'500'} zIndex={1}>
                      {'USD'}
                    </Paragraph>
                  </XStack>
                </YStack>
              </YStack>
            </XStack>
          </XStack>
          <XStack w={'100%'} ai={'center'} pt={'$7'}>
            <Button
              px={'$3.5'}
              h={'$8'}
              width={'100%'}
              backgroundColor={'$primary'}
              borderRadius={'$4'}
              onPress={() => {
                toast.show('TODO: Add Funds')
              }}
            >
              <XStack w={'100%'} jc={'space-between'} ai={'center'}>
                <Paragraph fontWeight={'500'} textTransform={'uppercase'} color={'$black'}>
                  Add Funds
                </Paragraph>
                <XStack alignItems={'center'} justifyContent={'center'} zIndex={2}>
                  <IconDeposit size={'$2.5'} color={'$black'} />
                </XStack>
              </XStack>
            </Button>
          </XStack>
          <YStack width={'100%'} gap={'$3.5'} pt={'$6'} pb={'$12'}>
            {coins.map((coin, index) => (
              <TokenDetails
                coin={coin}
                key={coin.label}
                jc={'space-between'}
                ai={'center'}
                py={'$3.5'}
                borderColor={separatorColor}
                borderBottomWidth={index !== coins.length - 1 ? 1 : 0}
              />
            ))}
          </YStack>
        </YStack>
      </Container>
    </>
  )
}
