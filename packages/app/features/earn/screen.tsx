import { Card, Fade, LinearGradient, Paragraph, Separator, XStack, YStack } from '@my/ui'
import type { ReactNode } from 'react'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowRight, IconStacks } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { useRouter } from 'solito/router'
import { Row } from 'app/features/earn/components/Row'
import { SectionButton } from 'app/features/earn/components/SectionButton'

export const EarnScreen = () => {
  return (
    <YStack w={'100%'} gap={'$4'} py={'$3'} $gtLg={{ w: '50%' }}>
      <LearnSection />
      <DetailsSection />
      {/*// TODO remove this line when pluging in real data*/}
      <EarningsSummary />
    </YStack>
  )
}

const ListItem = ({ children }: { children: ReactNode }) => {
  return (
    <XStack gap={'$2.5'} px={'$3'}>
      <Paragraph
        size={'$5'}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        •
      </Paragraph>
      <Paragraph
        size={'$5'}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        {children}
      </Paragraph>
    </XStack>
  )
}

const Badge = ({ text }: { text: string }) => {
  const { resolvedTheme } = useThemeSetting()

  const badgeBackgroundColor = resolvedTheme?.startsWith('dark')
    ? 'rgba(255,255,255, 0.1)'
    : 'rgba(0,0,0, 0.1)'

  return (
    <XStack
      width={'max-content'}
      backgroundColor={badgeBackgroundColor}
      px={'$3.5'}
      py={'$2'}
      br={'$4'}
      gap={'$3'}
      ai={'center'}
    >
      <IconStacks size={'$2'} color="$primary" $theme-light={{ color: '$color12' }} />
      <Paragraph size={'$5'}>{text}</Paragraph>
    </XStack>
  )
}

// TODO plug on press handler
const LearnSection = () => {
  return (
    <Fade>
      <Card
        w={'100%'}
        h={'300px'}
        p={'$5'}
        gap={'$7'}
        jc={'space-between'}
        $gtLg={{ p: '$7' }}
        backgroundImage={'url(https://ghassets.send.app/app_images/deposit.jpg)'}
        backgroundPosition={'center 15%'}
        backgroundRepeat={'no-repeat'}
        backgroundSize={'cover'}
        overflow={'hidden'}
      >
        <LinearGradient
          start={[0, 0]}
          end={[0, 1]}
          fullscreen
          colors={['transparent', 'rgba(0,0,0,0.4)']}
        >
          <YStack position="absolute" top={0} left={0} bottom={0} right={0} />
        </LinearGradient>
        <XStack
          width={'max-content'}
          backgroundColor={'#97b759'} // TODO WTF is this color
          px={'$3.5'}
          py={'$2'}
          br={'$4'}
          gap={'$2'}
          ai={'center'}
        >
          <IconCoin symbol={'USDC'} size={'$2'} />
          <Paragraph color={'$white'} size={'$5'}>
            Deposits
          </Paragraph>
        </XStack>
        <YStack>
          <Paragraph color={'$white'} size={'$9'}>
            Start Growing
          </Paragraph>
          <Paragraph color={'$white'} size={'$9'}>
            Your USDC Saving
          </Paragraph>
          <XStack mt={'$3'} ai={'center'} jc={'space-between'}>
            <Paragraph color={'$white'} size={'$5'}>
              Learn How It Works
            </Paragraph>
            <IconArrowRight size={'2'} color={'$primary'} />
          </XStack>
        </YStack>
      </Card>
    </Fade>
  )
}

// TODO plug on press handler
const EarningsCallToAction = () => {
  const { push } = useRouter()

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <Badge text={'Earnings'} />
        <YStack gap={'$3.5'}>
          <Paragraph size={'$7'} fontWeight={'500'}>
            Boost Your Savings Instantly
          </Paragraph>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <YStack gap={'$2'}>
            <ListItem>High APY: up to 12% on your deposits</ListItem>
            <ListItem>Full Flexibility: Access your funds anytime</ListItem>
            <ListItem>Rewards: Bonus SEND tokens</ListItem>
          </YStack>
        </YStack>
        <SectionButton text={'START EARNING'} onPress={() => push('/earn/earning-form')} />
      </Card>
    </Fade>
  )
}

// TODO plug real values
// TODO plug on press handler
const EarningsSummary = () => {
  const { push } = useRouter()
  const totalValue = '2,267.50'

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <Badge text={'Active Earnings'} />
        <YStack gap={'$3.5'}>
          <YStack gap={'$2'}>
            <Paragraph
              size={'$5'}
              color={'$lightGrayTextField'}
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Total Value
            </Paragraph>
            <XStack ai={'center'} jc={'space-between'}>
              <Paragraph
                fontWeight={'500'}
                size={(() => {
                  switch (true) {
                    case totalValue.length > 14:
                      return '$8'
                    case totalValue.length > 8:
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
              <XStack ai={'center'} gap={'$2'}>
                <IconCoin symbol={'USDC'} size={totalValue.length > 16 ? '$1.5' : '$2.5'} />
                <Paragraph size={'$7'}>USDC</Paragraph>
              </XStack>
            </XStack>
          </YStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <YStack gap={'$2'}>
            <Row label={'Deposits'} value={'1,200 USDC'} />
            <Row label={'Earnings'} value={'484,50 USDC'} />
            <Row label={'Rewards'} value={'15,000 SEND'} />
          </YStack>
        </YStack>
        <SectionButton text={'VIEW DETAILS'} onPress={() => push('/earn/active-earnings')} />
      </Card>
    </Fade>
  )
}

const DetailsSection = () => {
  // TODO fetch real data
  const areEarningsActive = false

  return areEarningsActive ? <EarningsSummary /> : <EarningsCallToAction />
}
