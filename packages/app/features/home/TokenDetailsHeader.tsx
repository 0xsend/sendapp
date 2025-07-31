import {
  Button,
  ButtonText,
  Card,
  type LinkableButtonProps,
  Paragraph,
  Separator,
  Spinner,
  Stack,
  Theme,
  useMedia,
  XStack,
  YStack,
} from '@my/ui'
import { ArrowDown, ArrowUp, Minus, Plus } from '@tamagui/lucide-icons'
import { IconArrowUp, IconCoin, IconError, IconPlus } from 'app/components/icons'
import { type allCoins, type CoinWithBalance, stableCoins, usdcCoin } from 'app/data/coins'
import { useTokenMarketData } from 'app/utils/coin-gecko'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import formatAmount from 'app/utils/formatAmount'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { useMemo } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { Platform } from 'react-native'
import { useLink } from 'solito/link'

export const TokenDetailsHeader = ({ coin }: { coin: CoinWithBalance }) => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs
  const isStableCoin = useMemo(() => {
    return stableCoins.some((c) => c.token === coin.token)
  }, [coin])

  return (
    <YStack gap="$3" pb="$3">
      <Card
        py="$5"
        px="$4"
        w={'100%'}
        jc={'space-between'}
        elevation={Platform.OS === 'web' ? '$0.75' : 0}
      >
        <YStack gap="$4">
          <XStack ai={'center'} gap={'$3'}>
            <IconCoin size={'$2'} symbol={coin.symbol} />
            <Paragraph size={isSmallScreen ? '$6' : '$7'} col={'$color12'} fontWeight={'600'}>
              {coin.label}
            </Paragraph>
          </XStack>
          <YStack gap={Platform.OS === 'web' ? '$4' : '$2'}>
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
      <XStack w={'100%'} gap={'$3'}>
        {isStableCoin ? (
          <>
            <AddMoneyButton />
            <WithdrawButton coin={coin} />
          </>
        ) : (
          <>
            <BuyButton coin={coin} />
            <SellButton coin={coin} />
          </>
        )}
      </XStack>
    </YStack>
  )
}
export const TokenDetailsMarketData = ({ coin }: { coin: allCoins[number] }) => {
  const { data: tokenMarketData, isLoading: isLoadingMarketData } = useTokenMarketData(
    coin.coingeckoTokenId
  )
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  const { data: prices, isLoading: isLoadingPrices } = useTokenPrices()

  const price = tokenMarketData?.at(0)?.current_price ?? prices?.[coin.token]

  const changePercent24h = tokenMarketData?.at(0)?.price_change_percentage_24h ?? null

  // Coingecko API returns a formatted price already. For now, we just want to make sure it doesn't have more than 8 digits
  // so the text doesn't get cut off.
  const formatPrice = (price: number) => price.toString().slice(0, 7)

  const formatPriceChange = (change: number) => {
    const fixedChange = change.toFixed(2)
    if (change > 0)
      return (
        <Theme name="green_active">
          <Paragraph
            fontSize={isSmallScreen ? '$3' : '$4'}
            fontWeight="500"
          >{`${fixedChange}%`}</Paragraph>
          <ArrowUp size={'$0.9'} />
        </Theme>
      )
    if (change < 0)
      return (
        <Theme name="red_active">
          <Paragraph
            fontSize={isSmallScreen ? '$3' : '$4'}
            fontWeight="500"
          >{`${fixedChange}%`}</Paragraph>
          <ArrowDown size={'$0.9'} />
        </Theme>
      )
    return (
      <Paragraph
        fontSize={isSmallScreen ? '$3' : '$4'}
        fontWeight="500"
      >{`${fixedChange}%`}</Paragraph>
    )
  }

  if (isLoadingMarketData && isLoadingPrices) return <Spinner size="small" color={'$color12'} />

  const isUSDC = coin.symbol === 'USDC'

  return (
    <XStack gap="$3" flexWrap="wrap">
      <Paragraph
        fontSize={isSmallScreen ? 12 : 14}
        fontWeight="500"
        $theme-dark={{ color: '$gray8Light' }}
        color={'$color12'}
      >
        {(() => {
          switch (true) {
            case isLoadingPrices:
              return <Spinner size="small" color={'$color12'} />
            case price === undefined:
              return null
            case isUSDC:
              return `1 ${coin.symbol} = 1 USD`
            default:
              return `1 ${coin.symbol} = ${formatPrice(price)} USD`
          }
        })()}
      </Paragraph>
      {(() => {
        switch (true) {
          case isLoadingMarketData:
            return <Spinner size="small" color={'$color12'} />
          case changePercent24h === null:
            return Platform.OS === 'web' ? (
              <XStack gap="$2" ai="center">
                <Paragraph color="$color10" fontSize={isSmallScreen ? 12 : 14}>
                  Failed to load market data
                </Paragraph>
                <IconError size="$1.5" color={'$error'} />
              </XStack>
            ) : null
          case isUSDC:
            return null
          default:
            return formatPriceChange(changePercent24h)
        }
      })()}
    </XStack>
  )
}

const TokenDetailsBalance = ({ coin }: { coin: CoinWithBalance }) => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  const { balance, decimals, formatDecimals = 5 } = coin
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  if (coin.balance === undefined) {
    return <></>
  }

  const balanceInUSD = convertBalanceToFiat(coin, tokenPrices?.[coin.token])

  const balanceWithDecimals = Number(balance) / 10 ** (decimals ?? 0)
  const balanceWithDecimalsLength = balanceWithDecimals.toString().replace('.', '').length

  return (
    <XStack alignItems={'baseline'} gap="$2">
      <Paragraph
        $platform-web={{ width: 'fit-content' }}
        $sm={{
          fontSize: balanceWithDecimalsLength ? '$10' : '$12',
          lineHeight: Platform.OS === 'web' ? 32 : 42,
        }}
        fontSize={isSmallScreen ? 42 : 60}
        fontWeight={'900'}
        lineHeight={isSmallScreen ? 48 : 57}
        color={'$color12'}
      >
        {formatAmount(balanceWithDecimals.toString(), 10, formatDecimals)}
      </Paragraph>

      {coin.symbol !== 'USDC' ? (
        <Paragraph color={'$color10'} fontSize={isSmallScreen ? '$2' : '$3'} fontFamily={'$mono'}>
          {isLoadingTokenPrices || balanceInUSD === undefined
            ? ''
            : `($${formatAmount(balanceInUSD)})`}
        </Paragraph>
      ) : null}
    </XStack>
  )
}

const QuickActionButton = ({ href, children }: LinkableButtonProps) => {
  const hoverStyles = useHoverStyles()
  const linkProps = useLink({ href })

  return (
    <Button
      elevation={Platform.OS === 'web' ? '$0.75' : 0}
      f={1}
      height={'auto'}
      hoverStyle={hoverStyles}
      focusStyle={hoverStyles}
      w="100%"
      {...linkProps}
    >
      {children}
    </Button>
  )
}

const BuyButton = ({ coin }: { coin: allCoins[number] }) => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  // Buy: USDC -> Token (inToken=USDC, outToken=selectedToken)
  const getBuyUrl = () => {
    return `/trade?inToken=${usdcCoin.token}&outToken=${coin.token}`
  }

  return (
    <QuickActionButton href={getBuyUrl()}>
      <YStack
        testID={'buy-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <Theme name="green">
          <Plus
            size={'$1.5'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
        </Theme>
        <ButtonText
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Buy
        </ButtonText>
      </YStack>
    </QuickActionButton>
  )
}

const SellButton = ({ coin }: { coin: allCoins[number] }) => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  // Sell: Token -> USDC (inToken=selectedToken, outToken=USDC)
  const getSellUrl = () => {
    return `/trade?inToken=${coin.token}&outToken=${usdcCoin.token}`
  }

  return (
    <QuickActionButton href={getSellUrl()}>
      <YStack
        testID={'sell-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <Theme name="red">
          <Minus
            size={'$1.5'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
        </Theme>
        <ButtonText
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Sell
        </ButtonText>
      </YStack>
    </QuickActionButton>
  )
}

const AddMoneyButton = () => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  return (
    <QuickActionButton href={'/deposit'}>
      <YStack
        testID={'add-money-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <IconPlus
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <ButtonText
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Add Money
        </ButtonText>
      </YStack>
    </QuickActionButton>
  )
}

const WithdrawButton = ({ coin }: { coin: allCoins[number] }) => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  // Withdraw: Navigate to send page with the stable coin pre-selected
  const getWithdrawUrl = () => {
    return `/send?sendToken=${coin.token}`
  }

  return (
    <QuickActionButton href={getWithdrawUrl()}>
      <YStack
        testID={'withdraw-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <IconArrowUp
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <ButtonText
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Withdraw
        </ButtonText>
      </YStack>
    </QuickActionButton>
  )
}
