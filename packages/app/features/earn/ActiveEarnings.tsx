import { Card, Fade, Paragraph, Separator, Stack, XStack, YStack } from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import { SectionButton } from 'app/features/earn/components/SectionButton'
import { useRouter } from 'solito/router'
import type { NamedExoticComponent } from 'react'
import { ArrowDown } from '@tamagui/lucide-icons'
import { IconSendSingleLetter, IconStacks } from 'app/components/icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import type { IconProps } from '@tamagui/helpers-icon'
import debug from 'debug'
import { useAsset } from './params'
import { useCoin } from 'app/provider/coins'

const log = debug('app:pages:earn:active')

export const ActiveEarnings = () => {
  const { push } = useRouter()
  const asset = useAsset()
  const coin = useCoin(asset?.toUpperCase() ?? '')

  if (!coin) {
    push('/earn')
    return null
  }

  log('ActiveEarnings', { coin })

  // TODO loader when deposit balances are loading
  // if (false) {
  // }

  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} jc={'space-between'} $gtLg={{ w: '50%' }}>
      <YStack w={'100%'} gap={'$4'}>
        <TotalValue />
        <XStack flexGrow={1} gap={'$3.5'}>
          <EarningButton Icon={ArrowDown} label={'Withdraw'} href={'/earn/withdraw-form'} />
          <EarningButton Icon={IconStacks} label={'Earnings'} href={'/earn/earnings-balance'} />
          <EarningButton
            Icon={IconSendSingleLetter}
            label={'Rewards'}
            href={'/earn/rewards-balance'}
          />
        </XStack>
        <ActiveEarningBreakdown />
      </YStack>
      <SectionButton text={'ADD MORE DEPOSITS'} onPress={() => push('/earn/deposit')} />
    </YStack>
  )
}

// TODO plug real total value
const TotalValue = () => {
  const totalValue = '2,780.50'

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <YStack gap={'$4'}>
          <XStack ai={'center'} gap={'$2'}>
            <IconCoin symbol={'USDC'} size={'$2'} />
            <Paragraph size={'$7'}>USDC</Paragraph>
          </XStack>
          <YStack gap={'$2'}>
            <Paragraph
              fontWeight={'500'}
              size={(() => {
                switch (true) {
                  case totalValue.length > 16:
                    return '$9'
                  default:
                    return '$11'
                }
              })()}
              $gtLg={{
                size: (() => {
                  switch (true) {
                    case totalValue.length > 16:
                      return '$9'
                    case totalValue.length > 8:
                      return '$10'
                    default:
                      return '$11'
                  }
                })(),
              }}
            >
              {totalValue}
            </Paragraph>
          </YStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <Paragraph
            size={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Total Value
          </Paragraph>
        </YStack>
      </Card>
    </Fade>
  )
}

// TODO plug real values
const ActiveEarningBreakdown = () => {
  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$6'} $gtLg={{ p: '$7' }}>
        <BreakdownRow symbol={'USDC'} value={'1,200'} label={'Deposits'} />
        <BreakdownRow symbol={'USDC'} value={'484.50'} label={'Earnings'} />
        <BreakdownRow symbol={'SEND'} value={'15,000'} label={'Rewards'} />
      </Card>
    </Fade>
  )
}

const BreakdownRow = ({
  symbol,
  value,
  label,
}: {
  symbol: string
  label: string
  value: string
}) => {
  return (
    <XStack jc={'space-between'} ai={'center'} flexWrap={'wrap'} rowGap={'$3'} gap={'$3'}>
      <XStack ai={'center'} gap={'$3.5'}>
        <IconCoin symbol={symbol} size={'$2'} />
        <Paragraph size={'$7'}>{label}</Paragraph>
      </XStack>
      <Paragraph size={'$7'}>{value}</Paragraph>
    </XStack>
  )
}

const EarningButton = ({
  Icon,
  label,
  href,
}: {
  label: string
  Icon: NamedExoticComponent<IconProps>
  href: string
}) => {
  const router = useRouter()
  const hoverStyles = useHoverStyles()

  const handleOnPress = () => {
    router.push(href)
  }

  return (
    <Fade flexGrow={1} flexShrink={1}>
      <XStack
        jc={'center'}
        px={'$5'}
        py={'$3.5'}
        br={'$6'}
        backgroundColor={'$color1'}
        onPress={handleOnPress}
        hoverStyle={hoverStyles}
      >
        <Stack
          flexDirection={'column'}
          gap={'$2'}
          jc={'center'}
          ai={'center'}
          width={'100%'}
          flexWrap={'wrap'}
          $gtSm={{
            flexDirection: 'row',
            gap: '$3',
          }}
        >
          <Icon size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
          <Paragraph size={'$5'} $gtSm={{ size: '$6' }}>
            {label}
          </Paragraph>
        </Stack>
      </XStack>
    </Fade>
  )
}
