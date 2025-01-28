import {
  AnimatePresence,
  Button,
  Card,
  H4,
  LinkableButton,
  Paragraph,
  Separator,
  Stack,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { IconPlus, IconSwap } from 'app/components/icons'
import formatAmount from 'app/utils/formatAmount'
import type { PropsWithChildren } from 'react'
import { TokenDetailsHistory } from './TokenDetailsHistory'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import { IconCoin } from 'app/components/icons/IconCoin'
import { TokenDetailsMarketData } from 'app/components/TokenDetailsMarketData'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'

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
  const { coin: selectedCoin } = useCoinFromTokenParam()
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
        <XStack w={'100%'} gap={25}>
          <LinkableButton href="/deposit" f={1} p="$7" mih={88} w="30%">
            <YStack gap="$2" jc={'space-between'} ai="center">
              <Theme name="green">
                <IconPlus
                  size={'$1.5'}
                  $theme-dark={{ color: '$color4' }}
                  $theme-light={{ color: '$color12' }}
                />
              </Theme>
              <Button.Text fontSize={'$4'} px="$2">
                Deposit
              </Button.Text>
            </YStack>
          </LinkableButton>
          <LinkableButton href={`/swap?token=${selectedCoin?.token}`} f={1} p="$7" mih={88} w="30%">
            <YStack gap="$2" jc={'space-between'} ai="center">
              <Theme name="green">
                <IconSwap
                  size={'$1'}
                  $theme-dark={{ color: '$color4' }}
                  $theme-light={{ color: '$color12' }}
                />
              </Theme>
              <Button.Text fontSize={'$4'} px="$2">
                Swap
              </Button.Text>
            </YStack>
          </LinkableButton>
        </XStack>
      </YStack>
      <YStack gap={'$3'}>
        <TokenDetailsHistory coin={coin} />
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
          : `($${formatAmount(balanceInUSD, 4, 2)})`}
      </Paragraph>
    </XStack>
  )
}

export function RowLabel({ children }: PropsWithChildren) {
  return (
    <H4
      // @TODO: Update with theme color variable
      color="$color12"
      fontFamily={'$mono'}
      fontWeight={'500'}
      size={'$5'}
      mt="$3"
      $gtMd={{ display: 'inline' }}
    >
      {children}
    </H4>
  )
}
