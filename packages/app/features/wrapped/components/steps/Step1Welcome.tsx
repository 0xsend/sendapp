import { Paragraph, PrimaryButton, YStack } from '@my/ui'
import { FadeIn } from 'app/features/wrapped/components/animations/FadeIn'
import { useUser } from 'app/utils/useUser'

interface Step1WelcomeProps {
  onNext: () => void
}

/**
 * Step 1: Welcome
 * Introduces the wrapped experience
 */
export function Step1Welcome({ onNext }: Step1WelcomeProps) {
  const { profile } = useUser()

  const name = profile?.main_tag?.name
    ? `/${profile?.main_tag?.name}`
    : profile?.tags?.[0]?.name
      ? `${profile?.tags?.[0]?.name}`
      : profile?.name || '??'

  return (
    <YStack gap="$8" ai="center" jc="center" width={'100%'}>
      <YStack gap="$7" ai="center">
        <FadeIn delay={500} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            Hey
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1200} duration={1000}>
          <Paragraph textAlign="center" size="$11" fontWeight={600} lineHeight={55}>
            {name}
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1900} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            have you been
          </Paragraph>
        </FadeIn>
        <FadeIn delay={2600} duration={1000}>
          <Paragraph textAlign="center" size="$11" fontWeight={600} lineHeight={55}>
            sending
          </Paragraph>
        </FadeIn>
        <FadeIn delay={3300} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            this year?
          </Paragraph>
        </FadeIn>
      </YStack>
      <FadeIn delay={4500} duration={1000}>
        <PrimaryButton onPress={onNext}>
          <PrimaryButton.Text>Continue</PrimaryButton.Text>
        </PrimaryButton>
      </FadeIn>
    </YStack>
  )
}
