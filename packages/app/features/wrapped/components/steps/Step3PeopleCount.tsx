import { Paragraph, PrimaryButton, YStack } from '@my/ui'
import { FadeIn } from 'app/features/wrapped/components/animations/FadeIn'
import { useWrappedData } from 'app/features/wrapped'
import { CountUpNumber } from 'app/features/wrapped/components/animations/CountUpNumber'

interface Step3PeopleCountProps {
  onNext: () => void
}

/**
 * Step 1: Welcome
 * Introduces the wrapped experience
 */
export function Step3PeopleCount({ onNext }: Step3PeopleCountProps) {
  const { data } = useWrappedData()

  return (
    <YStack gap="$8" ai="center" jc="center">
      <YStack gap="$7" ai="center">
        <FadeIn delay={500} duration={1000}>
          <Paragraph textAlign="center" size="$8" lineHeight={25}>
            During 2025
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1200} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            you sent to
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1900} duration={1000}>
          <CountUpNumber
            value={data?.uniqueRecipients || 0}
            textAlign="center"
            size="$12"
            fontWeight={600}
            delay={1900}
            lineHeight={70}
          />
        </FadeIn>
        <FadeIn delay={2600} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            senders
          </Paragraph>
        </FadeIn>
      </YStack>
      <FadeIn delay={3300} duration={1000}>
        <PrimaryButton onPress={onNext}>
          <PrimaryButton.Text>Continue</PrimaryButton.Text>
        </PrimaryButton>
      </FadeIn>
    </YStack>
  )
}
