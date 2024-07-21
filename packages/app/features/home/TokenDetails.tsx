import {
  AnimatePresence,
  BigHeading,
  H4,
  Label,
  Paragraph,
  Separator,
  Spinner,
  Stack,
  Theme,
  Tooltip,
  XStack,
  YStack,
  useMedia,
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
  const media = useMedia()
  const { data: sendAccount } = useSendAccount()
  const balance = useBalance({
    address: sendAccount?.address,
    token: coin.token === 'eth' ? undefined : coin.token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  return (
    <YStack f={1}>
      {media.gtLg && (
        <XStack w={'100%'} ai={'center'} jc={'space-between'}>
          <Separator boc="$decay" my={coin.label === 'USDC' ? '$3.5' : '$0'} />
          {coin.label !== 'USDC' && (
            <Stack bw={1} br={'$2'} boc="$decay" p={'$1.5'} jc="center" miw="$18">
              <TokenDetailsMarketData coin={coin} />
            </Stack>
          )}
        </XStack>
      )}
      <YStack mt={'$4'}>
        <Label fontSize={'$5'} fontWeight={'500'} textTransform={'uppercase'}>
          {`${coin.label} BALANCE`}
        </Label>
        <TokenDetailsBalance balance={balance} symbol={coin.symbol} />
      </YStack>
      <Stack w={'100%'} py={'$4'}>
        <Separator />
      </Stack>
      <YStack>
        <TokenDetailsHistory coin={coin} />
      </YStack>
    </YStack>
  )
}

export const TokenDetailsMarketData = ({ coin }: { coin: coins[number] }) => {
  const { data: tokenMarketData, status } = useTokenMarketData(coin.coingeckoTokenId)

  const price = tokenMarketData?.at(0)?.current_price

  const changePercent24h = tokenMarketData?.at(0)?.price_change_percentage_24h

  if (status === 'pending') return <Spinner size="small" />
  if (status === 'error' || price === undefined || changePercent24h === undefined)
    return (
      <XStack gap="$2" ai="center" jc={'center'}>
        <Paragraph>Failed to load market data</Paragraph>
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
    <XStack gap="$2" ai="center" jc={'space-around'}>
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
  symbol,
  balance,
}: { symbol: string; balance: UseBalanceReturnType }) => {
  if (balance?.isError) {
    return <>---</>
  }
  if (balance?.isFetching && balance?.isPending) {
    return <Spinner size={'small'} />
  }
  if (balance?.data?.value === undefined) {
    return <></>
  }

  const balanceWithDecimals = Number(balance.data.value) / 10 ** (balance.data?.decimals ?? 0)
  const balanceWithDecimalsLength = balanceWithDecimals.toString().replace('.', '').length

  return (
    <Tooltip placement="bottom">
      <Tooltip.Trigger $platform-web={{ width: 'fit-content' }}>
        <BigHeading
          $platform-web={{ width: 'fit-content' }}
          $sm={{ fontSize: balanceWithDecimalsLength ? '$10' : 68 }}
          color={'$color12'}
        >
          {formatAmount(balanceWithDecimals.toString(), 10, 5)}
        </BigHeading>
      </Tooltip.Trigger>
      <Tooltip.Content
        enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        scale={1}
        x={0}
        y={0}
        opacity={1}
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
      >
        <Tooltip.Arrow />

        <Paragraph fontSize={'$6'} fontWeight={'500'}>
          {`${balanceWithDecimals.toLocaleString()} ${symbol}`}
        </Paragraph>
      </Tooltip.Content>
    </Tooltip>
  )
}

export function RowLabel({ children }: PropsWithChildren) {
  return (
    <H4
      // @TODO: Update with theme color variable
      color="hsl(0, 0%, 42.5%)"
      fontFamily={'$mono'}
      fontWeight={'500'}
      size={'$5'}
      mt="$3"
      display="none"
      $gtMd={{ display: 'inline' }}
    >
      {children}
    </H4>
  )
}
