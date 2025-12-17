import { Paragraph, PrimaryButton, YStack } from '@my/ui'
import { FadeIn } from 'app/features/wrapped/components/animations/FadeIn'

interface Step2LetsGoProps {
  onNext: () => void
}

/**
 * Step 1: Welcome
 * Introduces the wrapped experience
 */
export function Step2LetsGo({ onNext }: Step2LetsGoProps) {
  return (
    <YStack gap="$8" ai="center" jc="center">
      <YStack gap="$7" ai="center">
        <FadeIn delay={500} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            Your
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1200} duration={1000}>
          <Paragraph textAlign="center" size="$11" fontWeight={600} lineHeight={55}>
            2025
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1900} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            /send
          </Paragraph>
        </FadeIn>
        <FadeIn delay={2600} duration={1000}>
          <Paragraph textAlign="center" size="$11" fontWeight={600} lineHeight={55}>
            wrapped
          </Paragraph>
        </FadeIn>
        <FadeIn delay={3300} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            is ready
          </Paragraph>
        </FadeIn>
      </YStack>
      <FadeIn delay={4500} duration={1000}>
        <PrimaryButton onPress={onNext}>
          <PrimaryButton.Text>Let's go</PrimaryButton.Text>
        </PrimaryButton>
      </FadeIn>
    </YStack>
  )
}
