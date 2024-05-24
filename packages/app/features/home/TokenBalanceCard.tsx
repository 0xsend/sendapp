import {
  Label,
  Paragraph,
  Spinner,
  Tooltip,
  TooltipGroup,
  XStack,
  YStack,
  Stack,
  styled,
} from '@my/ui'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'

const USDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const GreenSquare = styled(Stack, {
  name: 'Surface',
  w: 11,
  h: 11,
  theme: 'green_active',
  bc: '$background',
})

export const TokenBalanceCard = () => {
  const { totalBalance } = useSendAccountBalances()

  const formattedBalance = formatAmount(totalBalance, 9, 0)

  return (
    <XStack w={'100%'} zIndex={4}>
      <YStack jc={'center'} gap={'$4'}>
        <TooltipGroup delay={{ open: 0, close: 1500 }}>
          <Tooltip placement="bottom">
            <Tooltip.Trigger>
              <XStack ai="center" gap="$2.5">
                <GreenSquare />
                <Label
                  fontSize={'$4'}
                  zIndex={1}
                  fontWeight={'500'}
                  textTransform={'uppercase'}
                  lineHeight={0}
                  col={'$color10'}
                >
                  Total Balance
                </Label>
              </XStack>
              <XStack style={{ color: 'white' }} gap={'$2.5'} mt={'$3'}>
                {totalBalance === undefined ? (
                  <Spinner size={'large'} />
                ) : (
                  <Paragraph
                    fontFamily={'$mono'}
                    fontSize={96}
                    lineHeight={'$15'}
                    fontWeight={'500'}
                    zIndex={1}
                  >
                    {formatAmount(totalBalance, 4, 0)}
                  </Paragraph>
                )}
                <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1}>
                  {'USD'}
                </Paragraph>
              </XStack>
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
              <Paragraph fontSize={'$6'} fontWeight={'500'} themeInverse>
                {totalBalance === undefined ? null : USDollar.format(Number(totalBalance))}
              </Paragraph>
            </Tooltip.Content>
          </Tooltip>
        </TooltipGroup>
      </YStack>
    </XStack>
  )
}
