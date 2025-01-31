import { Card, Fade, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { Row } from 'app/features/earn/components/Row'

export const CalculatedBenefits = ({
  apy,
  monthlyEarning,
  rewards,
  overrideApy,
  overrideMonthlyEarning,
  overrideRewards,
}: {
  apy: string
  monthlyEarning: string
  rewards: string
  overrideApy?: string
  overrideMonthlyEarning?: string
  overrideRewards?: string
}) => {
  return (
    <Fade>
      <YStack gap={'$3.5'}>
        <Paragraph size={'$7'} fontWeight={'500'}>
          Benefits
        </Paragraph>
        <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
          <YStack gap={'$3.5'}>
            <XStack gap={'$2.5'} jc={'space-between'}>
              <Paragraph size={'$6'}>Deposit APY</Paragraph>
              <XStack gap={'$2.5'}>
                <Paragraph size={'$6'} textDecorationLine={overrideApy ? 'line-through' : 'none'}>
                  {apy}%
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
              <Row
                label={'Estimated Monthly Earning'}
                value={`${monthlyEarning}${overrideMonthlyEarning ? '' : ' USDC'}`}
                overrideValue={
                  overrideMonthlyEarning ? `${overrideMonthlyEarning} USDC` : undefined
                }
              />
              <Row
                label={'Rewards'}
                value={`${rewards}${overrideRewards ? '' : ' SEND'}`}
                overrideValue={overrideRewards ? `${overrideRewards} SEND` : undefined}
              />
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </Fade>
  )
}
