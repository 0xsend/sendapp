import {
  AnimatePresence,
  Button,
  Card,
  H4,
  Paragraph,
  Separator,
  Spinner,
  Stack,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import { baseMainnet } from '@my/wagmi'
import type { coins } from 'app/data/coins'
import { useSendAccount } from 'app/utils/send-accounts'
import { useBalance, type UseBalanceReturnType } from 'wagmi'

import { ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import { IconError } from 'app/components/icons'
import { useTokenMarketData } from 'app/utils/coin-gecko'
import formatAmount from 'app/utils/formatAmount'
import type { PropsWithChildren } from 'react'
import { TokenDetailsHistory } from './TokenDetailsHistory'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import { IconCoin } from 'app/components/icons/IconCoin'

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
export const TokenDetails = ({ coin }: { coin: coins[number] }) => {
  const { data: sendAccount } = useSendAccount()
  const balance = useBalance({
    address: sendAccount?.address,
    token: coin.token === 'eth' ? undefined : coin.token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  return (
    <YStack f={1} gap="$5" $gtLg={{ w: '45%', pb: '$0' }} pb="$5">
      <YStack gap="$5">
        <Card p="$4.5" w={'100%'} jc={'space-between'} $gtLg={{ h: 244, p: '$6' }}>
          <YStack gap="$4">
            <Button
              disabled
              icon={<IconCoin coin={coin} />}
              bc="transparent"
              chromeless
              jc={'flex-start'}
              ai={'center'}
              gap="$2"
              p={0}
            >
              <Button.Text
                size={'$7'}
                fontFamily={'$mono'}
                col={'$color12'}
                textTransform="uppercase"
                fontWeight={'700'}
              >
                {coin.label}
              </Button.Text>
            </Button>
            <YStack gap={'$4'}>
              <TokenDetailsBalance balance={balance} coin={coin} />
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
        {/* <XStack w={'100%'}>
          <LinkableButton href="/deposit" p="$7" mih={88} w="30%">
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
        </XStack> */}
      </YStack>
      <YStack gap={'$3'}>
        <TokenDetailsHistory coin={coin} />
      </YStack>
    </YStack>
  )
}

export const TokenDetailsMarketData = ({ coin }: { coin: coins[number] }) => {
  const { data: tokenMarketData, status } = useTokenMarketData(coin.coingeckoTokenId)

  const price = tokenMarketData?.at(0)?.current_price

  const changePercent24h = tokenMarketData?.at(0)?.price_change_percentage_24h

  if (status === 'pending') return <Spinner size="small" color="$color12" />
  if (status === 'error' || price === undefined || changePercent24h === undefined)
    return (
      <XStack gap="$2" ai="center">
        <Paragraph color="$color10">Failed to load market data</Paragraph>
        <IconError size="$1.75" color={'$redVibrant'} />
      </XStack>
    )

  // Coingecko API returns a formatted price already. For now, we just want to make sure it doesn't have more than 8 digits
  // so the text doesn't get cut off.
  const formatPrice = (price: number) => price.toString().slice(0, 7)

  const formatPriceChange = (change: number) => {
    const fixedChange = change.toFixed(2)
    if (change > 0)
      return (
        <Theme name="green_active">
          <Paragraph fontSize="$4" fontWeight="500">{`${fixedChange}%`}</Paragraph>
          <ArrowUp size={'$0.9'} />
        </Theme>
      )
    if (change < 0)
      return (
        <Theme name="red_active">
          <Paragraph fontSize="$4" fontWeight="500">{`${fixedChange}%`}</Paragraph>
          <ArrowDown size={'$0.9'} />
        </Theme>
      )
    return <Paragraph fontSize="$4" fontWeight="500">{`${fixedChange}%`}</Paragraph>
  }

  return (
    <XStack gap="$3">
      <Paragraph
        fontSize={14}
        fontWeight="500"
        $theme-dark={{ color: '$gray8Light' }}
        color={'$color12'}
      >
        {`1 ${coin.symbol} = ${formatPrice(price)} USD`}
      </Paragraph>
      <XStack gap={'$1.5'} ai="center" jc={'space-around'}>
        {formatPriceChange(changePercent24h)}
      </XStack>
    </XStack>
  )
}

const TokenDetailsBalance = ({
  coin,
  balance,
}: { coin: coins[number]; balance: UseBalanceReturnType }) => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  if (balance?.isError) {
    return <>---</>
  }
  if (balance?.isFetching && balance?.isPending) {
    return <Spinner size={'small'} color="$color12" />
  }
  if (balance?.data?.value === undefined) {
    return <></>
  }

  const balanceInUSD = convertBalanceToFiat(
    coin.token,
    balance.data.value,
    tokenPrices?.[coin.coingeckoTokenId].usd
  )

  const balanceWithDecimals = Number(balance.data.value) / 10 ** (balance.data?.decimals ?? 0)
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
        {formatAmount(balanceWithDecimals.toString(), 10, 5)}
      </Paragraph>

      <Paragraph color={'$color10'} fontSize={'$3'} fontFamily={'$mono'}>
        {isLoadingTokenPrices || balanceInUSD ? `($${formatAmount(balanceInUSD, 4, 2)})` : ''}
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
