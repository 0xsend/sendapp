import { Link, Paragraph, XStack, YStack } from '@my/ui'
import { IconFaq, IconNote } from 'app/components/icons'

export const SupportScreen = () => {
  return (
    <YStack w={'100%'} als={'center'}>
      <YStack w={'100%'} $lg={{ display: 'none' }}>
        <Paragraph size={'$8'} fontWeight={'300'} color={'$color05'}>
          Support
        </Paragraph>
      </YStack>
      <YStack w={'100%'} $gtLg={{ paddingTop: '$6' }} $lg={{ jc: 'center' }} gap={'$6'}>
        <XStack ai={'center'} gap={'$3.5'}>
          <IconNote color={'$primary'} />
          <Link href={'#'} color={'$primary'}>
            Submit a Request
          </Link>
        </XStack>
        <XStack ai={'center'} gap={'$3.5'}>
          <IconFaq color={'$primary'} />
          <Link href={'#'} color={'$primary'}>
            FAQs
          </Link>
        </XStack>
      </YStack>
    </YStack>
  )
}
