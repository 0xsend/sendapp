import { Card, Fade, Paragraph, PrimaryButton, Separator, Spinner, XStack, YStack } from '@my/ui'
import { IconStacks } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { Row } from 'app/features/earn/components/Row'
import formatAmount from 'app/utils/formatAmount'
import debug from 'debug'
import { type ReactNode, useMemo, memo } from 'react'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'
import type { SendEarnBalance } from './hooks'
import { useSendEarn } from './providers/SendEarnProvider'
import { useThemeName } from 'tamagui'
import { usePathname } from 'app/utils/usePathname'
import { useTranslation } from 'react-i18next'

const log = debug('app:earn:screen')

export function EarnScreen() {
  const { allBalances, isLoading } = useSendEarn()

  if (isLoading) {
    return <Spinner size="large" color={'$color12'} />
  }

  // Check if user has active deposits
  const hasActiveDeposits =
    Array.isArray(allBalances.data) &&
    allBalances.data.some((balance) => balance.assets > 0n && balance.log_addr !== null)

  // Convert undefined to null for type safety
  const balancesData = allBalances.data ?? null

  return (
    <YStack w={'100%'} $group-gtLg={{ w: '50%' }}>
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

const Badge = memo(({ text }: { text: string }) => {
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  const badgeBackgroundColor = isDark ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'

  return (
    <XStack
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
})
Badge.displayName = 'Badge'

const EarningsCallToAction = memo(() => {
  const { push } = useRouter()

  const pathname = usePathname()
  const { t } = useTranslation('earn')

  const notInEarnScreen = !pathname.startsWith('/earn')

  const content = (
    <Card w="100%" p="$5" gap="$7" ai="flex-start" $gtLg={{ p: '$7' }}>
      <Badge text={t('cta.badge')} />
      <YStack gap={'$3.5'}>
        <Paragraph size={'$7'} fontWeight={'500'}>
          {t('cta.title')}
        </Paragraph>
        <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
        <YStack gap={'$2'}>
          <ListItem>{t('cta.bullets.apy')}</ListItem>
          <ListItem>{t('cta.bullets.flex')}</ListItem>
          <ListItem>{t('cta.bullets.rewards')}</ListItem>
        </YStack>
      </YStack>
      <PrimaryButton onPress={() => push('/earn/usdc/deposit')}>
        <PrimaryButton.Text>{t('cta.buttons.start')}</PrimaryButton.Text>
      </PrimaryButton>
    </Card>
  )

  if (notInEarnScreen) {
    return content
  }

  return <Fade>{content}</Fade>
})
EarningsCallToAction.displayName = 'EarningsCallToAction'

const EarningsSummary = ({ balances }: { balances: SendEarnBalance[] | null }) => {
  const { push } = useRouter()
  const { totalAssets: totalAssetsData } = useSendEarn()
  const { t } = useTranslation('earn')

  // Get total assets from provider (already computed and cached)
  const { totalCurrentValue } = totalAssetsData

  log('EarningsSummary using provider data', {
    totalCurrentValue,
    balances,
  })

  const totalAssets = useMemo(() => formatUSDCValue(totalCurrentValue), [totalCurrentValue])
  const totalDeposits = useMemo(
    () => formatUSDCValue(balances?.reduce((sum, balance) => sum + balance.assets, 0n) ?? 0n),
    [balances]
  )

  const pathname = usePathname()

  const notInEarnScreen = !pathname.startsWith('/earn')

  const content = (
    <Card
      key="earnings-summary"
      w="100%"
      p="$5"
      gap="$5"
      ai="flex-start"
      $gtLg={{ p: '$7', gap: '$7' }}
    >
      <Badge text={t('summary.badge')} />
      <YStack gap={'$3'} w={'100%'}>
        <YStack gap={'$2'}>
          <Paragraph
            size={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            {t('summary.labels.total')}
          </Paragraph>
          <XStack ai={'center'} jc={'space-between'}>
            <Paragraph
              fontWeight={'600'}
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
              style={{
                lineHeight: 55,
              }}
            >
              {totalAssets}
            </Paragraph>
            <XStack ai={'center'} gap={'$2'}>
              <IconCoin symbol={'USDC'} size={totalAssets.length > 16 ? '$1.5' : '$2.5'} />
              <Paragraph size={'$7'} fontWeight={600} lineHeight={26}>
                USDC
              </Paragraph>
            </XStack>
          </XStack>
        </YStack>
        <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
        <YStack gap={'$2'}>
          <Row label={t('summary.labels.deposits')} value={`${totalDeposits} USDC`} />
          {/* Rewards section commented out since it won't be live on launch
          <Row label={t('summary.labels.earnings')} value={`+${formatUSDCValue(0n)} USDC`} />
          <Row label={t('summary.labels.rewards')} value={`+0 SEND`} />
          */}
        </YStack>
      </YStack>
      <PrimaryButton onPress={() => push('/earn/usdc')}>
        <PrimaryButton.Text>{t('summary.buttons.viewDetails')}</PrimaryButton.Text>
      </PrimaryButton>
    </Card>
  )

  if (notInEarnScreen) {
    return content
  }

  return <Fade>{content}</Fade>
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
