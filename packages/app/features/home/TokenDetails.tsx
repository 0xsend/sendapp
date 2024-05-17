import {
  BigHeading,
  H1,
  Label,
  Paragraph,
  Separator,
  Spinner,
  Stack,
  Tooltip,
  XStack,
  YStack,
  useMedia,
} from '@my/ui'
import type { coins } from 'app/data/coins'
import { type UseBalanceReturnType, useBalance } from 'wagmi'
import { baseMainnet } from '@my/wagmi'
import { useSendAccounts } from 'app/utils/send-accounts'

import formatAmount from 'app/utils/formatAmount'
import { useTokenMarketData } from 'app/utils/coin-gecko'
import { ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import { IconError } from 'app/components/icons'

export const TokenDetails = ({ coin }: { coin: coins[number] }) => {
  const media = useMedia()
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]
  const balance = useBalance({
    address: sendAccount?.address,
    token: coin.token === 'eth' ? undefined : coin.token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  return (
    <YStack f={1}>
      {media.gtLg && coin.label !== 'USDC' && (
        <XStack w={'100%'} ai={'center'} jc={'space-between'} $gtLg={{ mt: '$9' }} mt={'$6'}>
          <Separator $theme-dark={{ boc: '$decay' }} $theme-light={{ boc: '$gray4Light' }} />
          <Stack
            bw={1}
            br={'$2'}
            $theme-dark={{ boc: '$decay' }}
            $theme-light={{ boc: '$gray4Light' }}
            p={'$1.5'}
            jc="center"
            miw="$18"
          >
            <TokenDetailsMarketData coin={coin} />
          </Stack>
        </XStack>
      )}
      <YStack>
        <Label fontSize={'$5'} fontWeight={'500'} color={'$color11'} textTransform={'uppercase'}>
          {`${coin.label} BALANCE`}
        </Label>
        <TokenDetailsBalance balance={balance} symbol={coin.symbol} />
      </YStack>
      <Stack w={'100%'} py={'$6'}>
        <Separator $theme-dark={{ boc: '$decay' }} $theme-light={{ boc: '$gray4Light' }} />
      </Stack>
      <YStack>
        <Label fontSize="$7" fontWeight="500" color={'$color11'} textTransform={'uppercase'}>
          HISTORY
        </Label>
        <H1 fontSize="$9" fontWeight="700" color={'$color12'}>
          Coming Soon
        </H1>
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

  const formatPriceChange = (change: number) => {
    const fixedChange = change.toFixed(2)
    if (change > 0)
      return (
        <>
          <Paragraph fontSize="$4" fontWeight="500" color={'$olive'}>{`${fixedChange}%`}</Paragraph>
          <ArrowUp col={'$olive'} size={'$0.9'} />
        </>
      )
    if (change < 0)
      return (
        <>
          <Paragraph
            fontSize="$4"
            fontWeight="500"
            color={'$redVibrant'}
          >{`${fixedChange}%`}</Paragraph>
          <ArrowDown col={'$redVibrant'} size={'$0.9'} />
        </>
      )
    return (
      <>
        <Paragraph
          fontSize="$4"
          fontWeight="500"
          color={'$redVibrant'}
        >{`${fixedChange}%`}</Paragraph>
      </>
    )
  }

  return (
    <XStack gap="$2" ai="center" jc={'space-around'}>
      <Paragraph
        fontSize="$4"
        fontWeight="500"
        $theme-dark={{ color: '$gray8Light' }}
        color={'$color12'}
      >
        {`1 ${coin.symbol} = ${price} USD`}
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
  return (
    <Tooltip placement="bottom">
      <Tooltip.Trigger $platform-web={{ width: 'fit-content' }}>
        <BigHeading $platform-web={{ width: 'fit-content' }} color={'$color12'}>
          {formatAmount(balanceWithDecimals.toString())}
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
