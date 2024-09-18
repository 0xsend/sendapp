import { Card, H1, LinkableButton, Paragraph, XStack, YStack } from '@my/ui'
import { IconInfoCircle, IconQuestionCircle } from 'app/components/icons'

export const SupportScreen = () => {
  return (
    <YStack w={'100%'} als={'center'}>
      <YStack w={'100%'} mb={'$size.3.5'}>
        <H1 size={'$9'} fontWeight={'600'} color="$color12">
          Support
        </H1>
      </YStack>
      <YStack w={'100%'} $lg={{ jc: 'center' }} gap={'$6'}>
        <LinkableButton href={'https://support.send.app/en/'} unstyled>
          <Card bg={'$color0'} p={'$size.1.5'}>
            <XStack ai={'center'} gap={'$size.0.9'}>
              <IconInfoCircle color={'$primary'} size={24} />
              <Paragraph color={'$color12'} size={'$6'} fontWeight={600}>
                Learn more about Send
              </Paragraph>
            </XStack>
          </Card>
        </LinkableButton>

        <LinkableButton
          href={
            'https://support.send.app/en/articles/9783120-general-questions-support-suggestions-or-complaints'
          }
          unstyled
        >
          <Card bg={'$color0'} p={'$size.1.5'}>
            <XStack ai={'center'} gap={'$size.0.9'}>
              <IconQuestionCircle color={'$primary'} size={24} />
              <Paragraph color={'$color12'} size={'$6'} fontWeight={600}>
                Reach out
              </Paragraph>
            </XStack>
          </Card>
        </LinkableButton>
      </YStack>
    </YStack>
  )
}
