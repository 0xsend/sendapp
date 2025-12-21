import { Paragraph, PrimaryButton, YStack, XStack } from '@my/ui'
import { FadeIn } from 'app/features/wrapped/components/animations/FadeIn'
import { useWrappedData } from 'app/features/wrapped'
import { CountDownNumber } from 'app/features/wrapped/components/animations/CountDownNumber'

interface Step3PeopleCountProps {
  onNext: () => void
}

/**
 * Step 1: Welcome
 * Introduces the wrapped experience
 */
export function Step8({ onNext }: Step3PeopleCountProps) {
  const { data } = useWrappedData()

  return (
    <YStack gap="$8" ai="center" jc="center">
      <YStack gap="$7" ai="center">
        <FadeIn delay={500} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            You ranked
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1200} duration={1000}>
          <XStack gap={'$3'}>
            <Paragraph size="$12" fontWeight={600} lineHeight={70}>
              #
            </Paragraph>
            <CountDownNumber
              value={data?.sendScoreRank || 100000}
              textAlign="center"
              size="$12"
              fontWeight={600}
              delay={1200}
              lineHeight={70}
            />
          </XStack>
        </FadeIn>
        <FadeIn delay={1900} duration={1000}>
          <Paragraph textAlign="center" size="$8" lineHeight={30}>
            amongst all /senders
          </Paragraph>
        </FadeIn>
      </YStack>
      <FadeIn delay={2600} duration={1000}>
        <PrimaryButton onPress={onNext}>
          <PrimaryButton.Text>Continue</PrimaryButton.Text>
        </PrimaryButton>
      </FadeIn>
    </YStack>
  )
}
