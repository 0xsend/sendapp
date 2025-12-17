import { Avatar, Paragraph, PrimaryButton, YStack, useMedia } from '@my/ui'
import { FadeIn } from 'app/features/wrapped/components/animations/FadeIn'
import { useWrappedData } from 'app/features/wrapped'

interface Step5Props {
  onNext: () => void
}

/**
 * Step 1: Welcome
 * Introduces the wrapped experience
 */
export function Step5({ onNext }: Step5Props) {
  const { data } = useWrappedData()
  const topSender = data?.topCounterparties[0]
  const media = useMedia()

  if (!topSender) return null

  return (
    <YStack gap="$8" ai="center" jc="center">
      <YStack gap="$4" ai="center">
        <FadeIn delay={500} duration={3000}>
          <Avatar size={media.gtSm ? 350 : 200} br={'$4'}>
            <Avatar.Image src={topSender.avatarUrl} objectFit="cover" />
            <Avatar.Fallback>
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${topSender.tagName}&size=256&format=png&background=86ad7f`}
              />
            </Avatar.Fallback>
          </Avatar>
        </FadeIn>
        <FadeIn delay={2000} duration={1000}>
          <Paragraph textAlign="center" size="$11" fontWeight={600} lineHeight={55}>
            /{topSender.tagName}
          </Paragraph>
        </FadeIn>
      </YStack>
      <FadeIn delay={2700} duration={1000}>
        <PrimaryButton onPress={onNext}>
          <PrimaryButton.Text>Continue</PrimaryButton.Text>
        </PrimaryButton>
      </FadeIn>
    </YStack>
  )
}
