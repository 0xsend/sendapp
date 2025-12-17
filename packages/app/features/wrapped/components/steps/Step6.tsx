import { Avatar, Paragraph, PrimaryButton, YStack, XStack } from '@my/ui'
import { FadeIn } from 'app/features/wrapped/components/animations/FadeIn'
import { useWrappedData } from 'app/features/wrapped'

interface Step5Props {
  onNext: () => void
}

/**
 * Step 1: Welcome
 * Introduces the wrapped experience
 */
export function Step6({ onNext }: Step5Props) {
  const { data } = useWrappedData()
  const topSenders = data?.topCounterparties

  if (!topSenders) return null

  return (
    <YStack gap="$8" ai="center" jc="center">
      <FadeIn delay={500} duration={1000}>
        <Paragraph textAlign="center" size="$8">
          Your TOP 2025 senders
        </Paragraph>
      </FadeIn>
      <YStack gap={'$3'}>
        {topSenders.map((x, i) => {
          return (
            <FadeIn key={x.sendId} delay={1200 + 700 * i} duration={1000}>
              <XStack gap={'$4'} alignItems={'center'}>
                <Paragraph
                  textAlign="center"
                  size="$8"
                  fontWeight={400}
                  fontFamily={'$mono'}
                  lineHeight={25}
                >
                  #{i + 1}
                </Paragraph>
                <Avatar size={50} borderRadius={'$4'}>
                  <Avatar.Image src={x.avatarUrl} objectFit="cover" />
                  <Avatar.Fallback>
                    <Avatar.Image
                      src={`https://ui-avatars.com/api/?name=${x.tagName}&size=256&format=png&background=86ad7f`}
                    />
                  </Avatar.Fallback>
                </Avatar>
                <Paragraph textAlign="center" size="$8" fontWeight={400} lineHeight={25}>
                  /{x.tagName}
                </Paragraph>
              </XStack>
            </FadeIn>
          )
        })}
      </YStack>
      <FadeIn delay={4700} duration={1000}>
        <PrimaryButton onPress={onNext}>
          <PrimaryButton.Text>Continue</PrimaryButton.Text>
        </PrimaryButton>
      </FadeIn>
    </YStack>
  )
}

//      <YStack gap="$4" ai="center">
//         <FadeIn delay={500} duration={3000}>

//         </FadeIn>
//         <FadeIn delay={2000} duration={1000}>
//           <Paragraph textAlign="center" size="$11" fontWeight={600}>
//             /{topSender.tagName}
//           </Paragraph>
//         </FadeIn>
//       </YStack>
