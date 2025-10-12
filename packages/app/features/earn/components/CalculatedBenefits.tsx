import { Card, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { Row } from 'app/features/earn/components/Row'
import { memo } from 'react'

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
    return (
      <YStack gap={'$3.5'}>
        <Paragraph size={'$7'} fontWeight={'600'}>
          Benefits
        </Paragraph>
        <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
          <YStack gap={'$3.5'}>
            <XStack gap={'$2.5'} jc={'space-between'}>
              <Paragraph size={'$6'}>{showStaticInfo ? 'APY' : 'Deposit APY'}</Paragraph>
              <XStack gap={'$2.5'}>
                <Paragraph size={'$6'} textDecorationLine={overrideApy ? 'line-through' : 'none'}>
                  {showStaticInfo && apy === '...' ? 'up to 12' : apy}%
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
              {monthlyEarning && monthlyEarning !== '...' ? (
                <Row
                  label={'Estimated Monthly Earning'}
                  value={`${monthlyEarning}${overrideMonthlyEarning ? '' : ' USDC'}`}
                  overrideValue={
                    overrideMonthlyEarning ? `${overrideMonthlyEarning} USDC` : undefined
                  }
                />
              ) : null}
              {showStaticInfo ? (
                <Row label={'Withdraw Anytime'} value={'Full flexibility'} />
              ) : null}
              <Row
                label={'Rewards'}
                value={
                  rewards && rewards !== '...'
                    ? `${rewards}${overrideRewards ? '' : ' SEND'}`
                    : 'Bonus SEND tokens'
                }
                overrideValue={
                  rewards && rewards !== '...' && overrideRewards
                    ? `${overrideRewards} SEND`
                    : undefined
                }
              />
            </YStack>
          </YStack>
        </Card>
      </YStack>
    )
  }
)
CalculatedBenefits.displayName = 'CalculatedBenefits'
