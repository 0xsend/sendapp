import { Card, H2, H6, Paragraph, Spinner, TooltipSimple, XStack, YStack } from '@my/ui'
import { IconSendToken, IconUSDC } from 'app/components/icons'
import { useSendPrice } from 'app/utils/coin-gecko'
import formatAmount from 'app/utils/formatAmount'
import { useSendBalance } from 'app/utils/useSendBalance'
import { formatUnits } from 'viem'

export const SendBalanceCard = ({ address }: { address?: `0x${string}` }) => {
  const { data, isLoading, isError } = useSendBalance(address)
  const value = data?.value.toLocaleString()
  return (
    <Card
      flex={1}
      width="100%"
      $theme-dark={{ backgroundColor: '#2F2F2F' }}
      $gtMd={{ minWidth: 200, flex: 1, flexBasis: 0, br: '$6' }}
    >
      <Card.Header f={1} jc="space-between">
        <H6 fontWeight="400" size="$4" theme="alt2">
          Send Balance
        </H6>
        {isLoading || !data ? (
          <Spinner color="$color" />
        ) : (
          <XStack>
            <TooltipSimple label={`${value} ${data?.symbol}`}>
              {isError ? (
                <YStack>
                  <Paragraph>Failed to fetch balance</Paragraph>
                </YStack>
              ) : (
                <XStack ai="center" jc="center" w="100%" gap="$4">
                  <IconSendToken size="$2" />
                  <H2
                    ta="center"
                    accessibilityLabel={`${formatUnits(data?.value, data?.decimals)} ${
                      data?.symbol
                    }`}
                  >
                    {formatAmount(formatUnits(data?.value, data?.decimals))}
                  </H2>
                </XStack>
              )}
            </TooltipSimple>
          </XStack>
        )}
      </Card.Header>
    </Card>
  )
}

export const SendUsdBalanceCard = ({ address }: { address?: `0x${string}` }) => {
  const { data: balanceData, isLoading, isError } = useSendBalance(address)
  const { data: sendPrice, isLoading: isLoadingSendPrice } = useSendPrice()
  const { value: sendValue, decimals } = balanceData || {}
  const { usd: sendPriceUsd } = sendPrice?.['send-token'] || {}
  const isBalanceLoading = isLoading || isLoadingSendPrice
  const formattedPriceData =
    sendValue && sendPriceUsd && decimals !== undefined
      ? formatAmount(Number(formatUnits(sendValue, decimals)) * sendPriceUsd)
      : 0

  return (
    <Card
      f={1}
      width="100%"
      $theme-dark={{ backgroundColor: '#2F2F2F' }}
      $gtMd={{ minWidth: 200, flex: 1, flexBasis: 0, br: '$6' }}
    >
      <Card.Header f={1} jc="space-between">
        <H6 fontWeight="400" size="$4" theme="alt2">
          in USDC
        </H6>
        {isBalanceLoading ? (
          <Spinner color="$color" />
        ) : (
          <XStack>
            <TooltipSimple
              label={`${formattedPriceData} USD. 1 send = $${formatAmount(
                sendPriceUsd || 0,
                1,
                6
              )}`}
            >
              <XStack ai="center" jc="center" w="100%" gap="$4">
                <IconUSDC color={'$gold8'} size="$2" />
                <H2 ta="center" accessibilityLabel={`${formattedPriceData} USD`}>
                  {isError ? (
                    <YStack>
                      <Paragraph>Failed to fetch balance</Paragraph>
                    </YStack>
                  ) : sendPrice && balanceData ? (
                    formattedPriceData
                  ) : (
                    <Paragraph>No price data available for send</Paragraph>
                  )}
                </H2>
              </XStack>
            </TooltipSimple>
          </XStack>
        )}
      </Card.Header>
    </Card>
  )
}
