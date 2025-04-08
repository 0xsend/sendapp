import { CheckCircle } from '@tamagui/lucide-icons'
import { Button, FadeCard, LinkableButton, Paragraph, YStack } from '@my/ui'

export function DepositSuccessScreen() {
  return (
    <YStack
      w={'100%'}
      gap="$5"
      py={'$3.5'}
      jc={'space-between'}
      $gtLg={{
        w: '50%',
      }}
    >
      <FadeCard ai={'center'}>
        <CheckCircle size={'$3'} color={'$primary'} $theme-light={{ color: '$color12' }} />
        <YStack ai={'center'} gap={'$2'}>
          <Paragraph size={'$8'} fontWeight={500} ta={'center'} $gtLg={{ size: '$9' }}>
            Deposit Complete
          </Paragraph>
          <Paragraph
            size={'$5'}
            ta={'center'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            You’re all set — your funds will appear in your wallet soon
          </Paragraph>
        </YStack>
        <LinkableButton href={'/deposit'} theme="green" py={'$5'} br={'$4'} mt={'$4'} w={'100%'}>
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
            deposit again
          </Button.Text>
        </LinkableButton>
      </FadeCard>
    </YStack>
  )
}
