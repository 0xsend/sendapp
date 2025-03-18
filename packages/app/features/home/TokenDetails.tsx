import {
  AnimatePresence,
  Button,
  Card,
  LinkableButton,
  Paragraph,
  Separator,
  Stack,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import { type CoinWithBalance, sendCoin, usdcCoin } from 'app/data/coins'
import { IconPlus, IconSwap } from 'app/components/icons'
import formatAmount from 'app/utils/formatAmount'
import { TokenActivity } from './TokenActivity'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import { IconCoin } from 'app/components/icons/IconCoin'
import { TokenDetailsMarketData } from 'app/components/TokenDetailsMarketData'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useSendAccount } from 'app/utils/send-accounts'
import { SWAP_ENABLED_USERS } from 'app/features/swap/constants'

export function AnimateEnter({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <Stack
        key="enter"
        animateOnly={['transform', 'opacity']}
        animation="200ms"
        enterStyle={{ opacity: 0, scale: 0.9 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
        opacity={1}
      >
        {children}
      </Stack>
    </AnimatePresence>
  )
}

export const TokenDetails = ({ coin }: { coin: CoinWithBalance }) => {
  const hoverStyles = useHoverStyles()

  // this code can be removed as swaps are no longer behind white list
  const { data: sendAccount } = useSendAccount()
  const isSwapEnabled = sendAccount?.id && SWAP_ENABLED_USERS.includes(sendAccount.id)

  const getSwapUrl = () => {
    if (coin?.symbol === sendCoin.symbol) {
      return `/swap?inToken=${coin?.token}&outToken=${usdcCoin.token}`
    }

    return `/swap?inToken=${coin?.token}`
  }

  return (
    <YStack f={1} gap="$5" $gtLg={{ w: '45%', pb: '$0' }} pb="$5">
      <YStack gap="$5">
        <Card p="$4.5" w={'100%'} jc={'space-between'} $gtLg={{ h: 244, p: '$6' }}>
          <YStack gap="$4">
            <XStack ai={'center'} gap={'$3'}>
              <IconCoin size={'$2'} symbol={coin.symbol} />
              <Paragraph
                size={'$7'}
                fontFamily={'$mono'}
                col={'$color12'}
                textTransform="uppercase"
                fontWeight={'700'}
              >
                {coin.label}
              </Paragraph>
            </XStack>
            <YStack gap={'$4'}>
              <TokenDetailsBalance coin={coin} />
              {coin.symbol !== 'USDC' && (
                <>
                  <Stack w={'100%'}>
                    <Separator bc={'$color10'} />
                  </Stack>
                  <TokenDetailsMarketData coin={coin} />
                </>
              )}
            </YStack>
          </YStack>
        </Card>
        {isSwapEnabled && (
          <XStack w={'100%'} gap={'$5'}>
            <LinkableButton
              href="/deposit"
              f={1}
              height={'auto'}
              hoverStyle={hoverStyles}
              focusStyle={hoverStyles}
            >
              <YStack gap="$2" jc={'space-between'} ai="center" p="$4">
                <IconPlus
                  size={'$1.5'}
                  $theme-dark={{ color: '$primary' }}
                  $theme-light={{ color: '$color12' }}
                />
                <Button.Text fontSize={'$4'} px="$2">
                  Deposit
                </Button.Text>
              </YStack>
            </LinkableButton>
            <LinkableButton
              href={getSwapUrl()}
              f={1}
              height={'auto'}
              hoverStyle={hoverStyles}
              focusStyle={hoverStyles}
            >
              <YStack gap="$2" jc={'space-between'} ai="center" p="$4" height={'auto'}>
                <Theme name="green">
                  <IconSwap
                    size={'$1'}
                    $theme-dark={{ color: '$primary' }}
                    $theme-light={{ color: '$color12' }}
                  />
                </Theme>
                <Button.Text fontSize={'$4'} px="$2">
                  Swap
                </Button.Text>
              </YStack>
            </LinkableButton>
          </XStack>
        )}
      </YStack>
      <YStack gap={'$3'}>
        <TokenActivity coin={coin} />
      </YStack>
    </YStack>
  )
}

const TokenDetailsBalance = ({ coin }: { coin: CoinWithBalance }) => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  const { balance, decimals, formatDecimals = 5 } = coin

  if (coin.balance === undefined) {
    return <></>
  }

  const balanceInUSD = convertBalanceToFiat(coin, tokenPrices?.[coin.token])

  const balanceWithDecimals = Number(balance) / 10 ** (decimals ?? 0)
  const balanceWithDecimalsLength = balanceWithDecimals.toString().replace('.', '').length

  return (
    <XStack ai="flex-end" gap="$2">
      <Paragraph
        $platform-web={{ width: 'fit-content' }}
        $sm={{ fontSize: balanceWithDecimalsLength ? '$10' : 68, lineHeight: 38 }}
        fontSize={60}
        fontWeight={'900'}
        lineHeight={57}
        color={'$color12'}
      >
        {formatAmount(balanceWithDecimals.toString(), 10, formatDecimals)}
      </Paragraph>

      <Paragraph color={'$color10'} fontSize={'$3'} fontFamily={'$mono'}>
        {isLoadingTokenPrices || balanceInUSD === undefined
          ? ''
          : `($${formatAmount(balanceInUSD)})`}
      </Paragraph>
    </XStack>
  )
}
