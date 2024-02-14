import {
  Anchor,
  Avatar,
  Button,
  Card,
  Container,
  ListItem,
  Paragraph,
  ScrollView,
  Theme,
  ThemeName,
  XStack,
  YStack,
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
import { useState } from 'react'
import { Square } from 'tamagui'
export function HomeScreen() {
  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'
  const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  const [expandBalance, setExpandBalance] = useState(false)
  const actionButtons = [
    { label: 'Deposit', iconPNGPath: <IconDeposit />, href: '/' },
    { label: 'Recieve', iconPNGPath: <IconReceive />, href: '/receive' },
    { label: 'Send', iconPNGPath: <IconSendTile />, href: '/send' },
  ]
  const coins = [
    { label: 'USDC', icon: <IconUSDC size={'$2.5'} />, balance: 3.4567 },
    { label: 'Ethereum', icon: <IconEthereum size={'$2.5'} />, balance: 1.25696 },
    { label: 'Send', icon: <IconSend size={'$2.5'} />, balance: 12500123 },
  ]
  const balanceViewButtons = [
    { label: 'Ethereum', onPress: () => {} },
    { label: 'Cards', onPress: () => {} },
  ]
  const transactions = [
    {
      id: 1,
      user: {
        sendTag: 'ethantree',
      },
      type: 'inbound',
      amount: 200,
      currency: 'USDT',
      amountInUSD: 199.98,
      created_on: '',
    },
    {
      id: 2,
      user: {
        sendTag: 'You',
      },
      type: 'outbound',
      amount: 1,
      currency: 'ETH',
      amountInUSD: 1985.56,
      created_on: '',
    },
    {
      id: 3,
      user: {
        sendTag: 'You',
      },
      type: 'outbound',
      amount: 1,
      currency: 'ETH',
      amountInUSD: 1985.56,
      created_on: '',
    },
    {
      id: 4,
      user: {
        sendTag: 'You',
      },
      type: 'outbound',
      amount: 1,
      currency: 'ETH',
      amountInUSD: 1985.56,
      created_on: '',
    },
  ]
  const balanceDetails = [
    {
      currency: 'Ethereum',
      symbol: 'eth',
      balance: 1.45,
    },
    {
      currency: 'USDC',
      symbol: 'usdc',
      balance: 125,
    },
    {
      currency: 'SEND',
      symbol: 'send',
      balance: 71454457,
    },
    {
      currency: 'SEND',
      symbol: 'send',
      balance: 4412,
    },
    {
      currency: 'USDC',
      symbol: 'usdc',
      balance: 2.0,
    },
  ]
  const navigateToScreen = (href: string) => {
    window.location.href = href
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
                      {USDollar.format(9489).replace('$', '').split('.')[0]}
                    </Paragraph>
                    <Paragraph color={'$color12'} fontSize={'$6'} fontWeight={'500'} zIndex={1}>
                      {'USD'}
                    </Paragraph>
                  </XStack>
                </YStack>
              </YStack>
            </XStack>
          </XStack>
          <XStack w={'90%'} ai={'center'} jc={'space-evenly'} gap={'$4'} pt={'$7'}>
            <Card
              px={'$3.5'}
              py={'$5'}
              width={'100%'}
              backgroundColor={'$primary'}
              borderRadius={'$4'}
            >
              <XStack jc={'space-between'} ai={'center'}>
                <Paragraph fontWeight={'500'} textTransform={'uppercase'} color={'$black'}>
                  Add Funds
                </Paragraph>
                <XStack alignItems={'center'} justifyContent={'center'} zIndex={2}>
                  <IconDeposit size={'$2.5'} color={'$black'} />
                </XStack>
              </XStack>
            </Card>
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
                  {formatAmount(coin.balance, undefined, 3)}
                </Paragraph>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </MainLayout>
    </>
  )
}
