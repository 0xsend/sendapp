import { H1, YStack, Paragraph } from '@my/ui'

export const ComingSoon = () => {
  return (
    <YStack f={1} gap={'$3.5'}>
      <H1>👨‍🍳 Coming soon</H1>
      <Paragraph size={'$8'} fontWeight={600}>
        We&apos;re cooking up something awesome. Stay tuned!
      </Paragraph>
    </YStack>
  )
}
