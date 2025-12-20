import { Paragraph, PrimaryButton, YStack, Text } from '@my/ui'
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
export function Step7({ onNext }: Step3PeopleCountProps) {
  const { data } = useWrappedData()

  return (
    <YStack gap="$8" ai="center" jc="center">
      <YStack gap="$7" ai="center" width={'100%'}>
        <FadeIn delay={500} duration={1000}>
          <CountUpNumber
            value={data?.totalTransfers || 0}
            textAlign="center"
            size="$12"
            fontWeight={600}
            delay={500}
            lineHeight={70}
          />
        </FadeIn>
        <FadeIn delay={1200} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            transactions in 2025.
          </Paragraph>
        </FadeIn>
        <FadeIn delay={1900} duration={1000} width={'100%'}>
          <Paragraph textAlign="center" size="$8" lineHeight={30} width={190}>
            Yeah… you were
          </Paragraph>
        </FadeIn>
        <FadeIn delay={2600} duration={1000}>
          <Paragraph textAlign="center" size="$8">
            <Text fontStyle={'italic'}>definitely</Text> /sending.
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
