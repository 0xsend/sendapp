import { Card, Fade, LinearGradient, Paragraph, Separator, Spinner, XStack, YStack } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowRight, IconStacks } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { Row } from 'app/features/earn/components/Row'
import { SectionButton } from 'app/features/earn/components/SectionButton'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import debug from 'debug'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'
import { useSendEarnBalances, useVaultConvertSharesToAssets, type SendEarnBalance } from './hooks'

const log = debug('app:earn:screen')

export function EarnScreen() {
  const sendAccount = useSendAccount()
  const balances = useSendEarnBalances()

  if (sendAccount.isLoading || balances.isLoading) {
    return <Spinner size="large" color={'$color12'} />
  }

  // Check if user has active deposits
  const hasActiveDeposits =
    Array.isArray(balances.data) &&
    balances.data.some((balance) => balance.assets > 0n && balance.log_addr !== null)

  // Convert undefined to null for type safety
  const balancesData = balances.data ?? null

  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} $gtLg={{ w: '50%' }}>
      <LearnSection />
      <DetailsSection hasActiveDeposits={hasActiveDeposits} balances={balancesData} />
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

const LearnSection = () => {
  return (
    <Fade>
      <Link href="https://info.send.it/send-docs/features-and-products/send-earn">
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
            backgroundColor={'$oliveDrab'}
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
      </Link>
    </Fade>
  )
}

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
        <SectionButton text={'START EARNING'} onPress={() => push('/earn/usdc/deposit')} />
      </Card>
    </Fade>
  )
}

const EarningsSummary = ({ balances }: { balances: SendEarnBalance[] | null }) => {
  const { push } = useRouter()

  // Extract vaults and shares from balances for conversion
  const vaults =
    balances
      ?.filter((balance) => balance.shares > 0n && balance.log_addr !== null)
      .map((balance) => balance.log_addr) || []

  const shares =
    balances
      ?.filter((balance) => balance.shares > 0n && balance.log_addr !== null)
      .map((balance) => balance.shares) || []

  // Use the hook to get current asset values based on onchain rate
  const currentAssets = useVaultConvertSharesToAssets({ vaults, shares })

  log('convertSharesToAssets results', {
    data: currentAssets.data,
    isLoading: currentAssets.isLoading,
    isError: currentAssets.isError,
  })

  const totalAssets = useMemo(
    () => formatUSDCValue(currentAssets.data?.reduce((sum, assets) => sum + assets, 0n) ?? 0n),
    [currentAssets.data]
  )
  const totalDeposits = useMemo(
    () => formatUSDCValue(balances?.reduce((sum, balance) => sum + balance.assets, 0n) ?? 0n),
    [balances]
  )

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
                    case totalAssets.length > 14:
                      return '$8'
                    case totalAssets.length > 8:
                      return '$9'
                    default:
                      return '$11'
                  }
                })()}
                $gtLg={{
                  size: (() => {
                    switch (true) {
                      case totalAssets.length > 16:
                        return '$9'
                      case totalAssets.length > 8:
                        return '$10'
                      default:
                        return '$11'
                    }
                  })(),
                }}
              >
                {totalAssets}
              </Paragraph>
              <XStack ai={'center'} gap={'$2'}>
                <IconCoin symbol={'USDC'} size={totalAssets.length > 16 ? '$1.5' : '$2.5'} />
                <Paragraph size={'$7'}>USDC</Paragraph>
              </XStack>
            </XStack>
          </YStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <YStack gap={'$2'}>
            <Row label={'Deposits'} value={`${totalDeposits} USDC`} />
            {/* Rewards section commented out since it won't be live on launch
            <Row label={'Earnings'} value={`+${formatUSDCValue(0n)} USDC`} />
            <Row label={'Rewards'} value={`+0 SEND`} />
            */}
          </YStack>
        </YStack>
        <SectionButton text={'VIEW DETAILS'} onPress={() => push('/earn/usdc')} />
      </Card>
    </Fade>
  )
}

const DetailsSection = ({
  hasActiveDeposits,
  balances,
}: {
  hasActiveDeposits: boolean
  balances: SendEarnBalance[] | null
}) => {
  return hasActiveDeposits ? <EarningsSummary balances={balances} /> : <EarningsCallToAction />
}

const formatUSDCValue = (value: bigint): string => {
  const valueInUSDC = Number(formatUnits(value, 6))
  return formatAmount(valueInUSDC, 10, 2)
}
