import {
  Anchor,
  Avatar,
  Button,
  Card,
  Container,
  ListItem,
  Paragraph,
  ScrollView,
  XStack,
  YStack,
  useToastController,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import {
  IconArrowDown,
  IconClose,
  IconDeposit,
  IconEthereum,
  IconReceive,
  IconSend,
  IconSendTile,
  IconUSDC,
} from 'app/components/icons'
import { MainLayout } from 'app/components/layout'
import { CommentsTime } from 'app/utils/dateHelper'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccounts } from 'app/utils/send-accounts'
import { useState } from 'react'
import { Square } from 'tamagui'
import { usdcAddress as usdcAddresses, sendAddress as sendAddresses } from '@my/wagmi'
import { useBalance, useChainId } from 'wagmi'

export function HomeScreen() {
  const chainId = useChainId()
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]

  const balances: {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    [key: string]: { balance: any; balanceIsPending: boolean; balanceRefetch: any }
  } = {}
  const tokens = [usdcAddresses[chainId], sendAddresses[chainId]]

  for (const token of tokens) {
    const {
      data: balance,
      isPending: balanceIsPending,
      refetch: balanceRefetch,
    } = useBalance({
      address: sendAccount?.address,
      token,
      query: { enabled: !!sendAccount },
      chainId: chainId,
    })

    // Assuming you're storing the balances in an object with chainId as key
    balances[token] = { balance, balanceIsPending, balanceRefetch }
  }

  const toast = useToastController()
  const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  const coins = [
    { label: 'USDC', token: usdcAddresses[chainId], icon: <IconUSDC size={'$2.5'} /> },
    // { label: 'Ethereum', icon: <IconEthereum size={'$2.5'} /> },
    { label: 'Send', token: sendAddresses[chainId], icon: <IconSend size={'$2.5'} /> },
  ]

  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'

  const totalBalance = () => {
    let total = 0
    for (const token of tokens) {
      const tokenBalance = parseFloat(balances[token]?.balance?.formatted)
      total += tokenBalance
    }
    return total
  }

  return (
    <>
      <MainLayout scrollable={true}>
        <YStack
          $gtLg={{ width: 600 }}
          $sm={{ width: '100vw' }}
          $gtSm={{ width: '100vw' }}
          ai={'center'}
        >
          {/* Balance Card */}
          <XStack w={'100%'} jc={'center'} borderColor={separatorColor} borderBottomWidth={1}>
            <XStack w={'90%'} zIndex={4}>
              <YStack mx={'$3'} py={'$11'}>
                <YStack jc={'center'} gap={'$6'}>
                  <Paragraph
                    fontSize={'$4'}
                    zIndex={1}
                    color={'$color12'}
                    textTransform={'uppercase'}
                  >
                    [ Total Balance ]
                  </Paragraph>
                  <XStack style={{ color: 'white' }} gap={'$2.5'}>
                    <Paragraph
                      color={'$color12'}
                      fontSize={96}
                      fontWeight={'500'}
                      lineHeight={'$12'}
                      zIndex={1}
                    >
                      {USDollar.format(totalBalance()).replace('$', '').split('.')[0]}
                    </Paragraph>
                    <Paragraph color={'$color12'} fontSize={'$6'} fontWeight={'500'} zIndex={1}>
                      {'USD'}
                    </Paragraph>
                  </XStack>
                </YStack>
              </YStack>
            </XStack>
          </XStack>
          <XStack w={'90%'} ai={'center'} pt={'$7'}>
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
          <YStack width={'90%'} gap={'$3.5'} pt={'$6'} pb={'$12'}>
            {coins.map((coin, index) => (
              <XStack
                jc={'space-between'}
                ai={'center'}
                p={'$3.5'}
                borderColor={separatorColor}
                borderBottomWidth={index !== coins.length - 1 ? 1 : 0}
                key={coin.label}
              >
                <XStack gap={'$2'}>
                  {coin.icon}
                  <Paragraph
                    fontSize={'$5'}
                    fontWeight={'500'}
                    textTransform={'uppercase'}
                    color={'$color12'}
                  >
                    {coin.label}
                  </Paragraph>
                </XStack>
                <Paragraph fontSize={'$9'} fontWeight={'500'} color={'$color12'}>
                  {formatAmount(balances[coin.token]?.balance?.formatted, undefined, 3)}
                </Paragraph>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </MainLayout>
    </>
  )
}
