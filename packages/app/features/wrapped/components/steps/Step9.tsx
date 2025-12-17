import { Paragraph, PrimaryButton, YStack } from '@my/ui'
import { FadeIn } from 'app/features/wrapped/components/animations/FadeIn'
import { useUser } from 'app/utils/useUser'
import { useWrappedData } from 'app/features/wrapped'
import { shareWrappedToTwitter } from 'app/features/wrapped/utils/share'

/**
 * Step 9: Thank You
 * Final step with share and close options
 */
export function Step9() {
  const { profile } = useUser()
  const { data } = useWrappedData()

  const name = profile?.main_tag?.name
    ? `/${profile?.main_tag?.name}`
    : profile?.tags?.[0]?.name
      ? `${profile?.tags?.[0]?.name}`
      : profile?.name || '??'

  const handleShare = async () => {
    if (data) {
      await shareWrappedToTwitter(data)
    }
  }

  return (
    <YStack gap="$8" ai="center" jc="center">
      <YStack gap="$7" ai="center">
        <FadeIn delay={500} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            Thank you
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1200} duration={1000}>
          <Paragraph textAlign="center" size="$11" fontWeight={600} lineHeight={55}>
            {name}
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1900} duration={1000}>
          <Paragraph textAlign="center" size="$7">
            for sending with us during
          </Paragraph>
        </FadeIn>
        <FadeIn delay={2600} duration={1000}>
          <Paragraph textAlign="center" size="$11" fontWeight={600} lineHeight={55}>
            2025
          </Paragraph>
        </FadeIn>
        <FadeIn delay={3300} duration={1000}>
          <Paragraph textAlign="center" size="$7">
            See you next year!
          </Paragraph>
        </FadeIn>
      </YStack>
      <FadeIn delay={4500} duration={1000}>
        <PrimaryButton onPress={handleShare}>
          <PrimaryButton.Text>Share</PrimaryButton.Text>
        </PrimaryButton>
      </FadeIn>
    </YStack>
  )
}
