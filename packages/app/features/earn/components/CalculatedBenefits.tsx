import { Card, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { Row } from 'app/features/earn/components/Row'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export const CalculatedBenefits = memo(
  ({
    apy,
    monthlyEarning,
    rewards,
    overrideApy,
    overrideMonthlyEarning,
    overrideRewards,
    showStaticInfo,
  }: {
    apy: string
    monthlyEarning: string
    rewards: string
    overrideApy?: string
    overrideMonthlyEarning?: string
    overrideRewards?: string
    showStaticInfo?: boolean
  }) => {
    const { t } = useTranslation('earn')
    const tokenSymbol = 'SEND'
    const stableSymbol = 'USDC'

    const apyLabel = showStaticInfo
      ? t('deposit.benefits.apy.staticLabel')
      : t('deposit.benefits.apy.dynamicLabel')

    const apyDisplay =
      showStaticInfo && apy === '...' ? t('deposit.benefits.apy.placeholder', { value: '12' }) : apy

    const monthlySuffix = t('deposit.benefits.monthlyEarning.symbol', { symbol: stableSymbol })
    const monthlyValue =
      monthlyEarning && monthlyEarning !== '...'
        ? `${monthlyEarning}${overrideMonthlyEarning ? '' : ` ${monthlySuffix}`}`
        : null

    const monthlyOverrideValue = overrideMonthlyEarning
      ? `${overrideMonthlyEarning} ${monthlySuffix}`
      : undefined

    const rewardsSuffix = t('deposit.benefits.rewards.symbol', { token: tokenSymbol })
    const rewardsValue =
      rewards && rewards !== '...'
        ? `${rewards}${overrideRewards ? '' : ` ${rewardsSuffix}`}`
        : t('deposit.benefits.rewards.fallback', { token: tokenSymbol })

    const rewardsOverrideValue =
      rewards && rewards !== '...' && overrideRewards
        ? `${overrideRewards} ${rewardsSuffix}`
        : undefined

    return (
      <YStack gap={'$3.5'}>
        <Paragraph size={'$7'} fontWeight={'600'}>
          {t('deposit.benefits.title')}
        </Paragraph>
        <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
          <YStack gap={'$3.5'}>
            <XStack gap={'$2.5'} jc={'space-between'}>
              <Paragraph size={'$6'}>{apyLabel}</Paragraph>
              <XStack gap={'$2.5'}>
                <Paragraph size={'$6'} textDecorationLine={overrideApy ? 'line-through' : 'none'}>
                  {apyDisplay}%
                </Paragraph>
                {overrideApy && (
                  <Paragraph size={'$6'} color={'$error'}>
                    {overrideApy}%
                  </Paragraph>
                )}
              </XStack>
            </XStack>
            <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
            <YStack gap={'$2'}>
              {monthlyValue ? (
                <Row
                  label={t('deposit.benefits.monthlyEarning.label')}
                  value={monthlyValue}
                  overrideValue={monthlyOverrideValue}
                />
              ) : null}
              {showStaticInfo ? (
                <Row
                  label={t('deposit.benefits.withdraw.label')}
                  value={t('deposit.benefits.withdraw.value')}
                />
              ) : null}
              <Row
                label={t('deposit.benefits.rewards.label')}
                value={rewardsValue}
                overrideValue={rewardsOverrideValue}
              />
            </YStack>
          </YStack>
        </Card>
      </YStack>
    )
  }
)
CalculatedBenefits.displayName = 'CalculatedBenefits'
