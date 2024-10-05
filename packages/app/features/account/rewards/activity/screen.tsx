import { YStack, H1, Paragraph, Image, LinearGradient, Stack } from '@my/ui'

export function ActivityRewardsScreen() {
  return (
    <YStack f={1} pb={'$2'} pt={'$6'} gap={'$7'}>
      <Stack w={'100%'} h={224} position="relative" jc={'center'} br={'$6'}>
        <Image
          pos={'absolute'}
          br={'$6'}
          t={0}
          zIndex={0}
          source={{
            height: 1024,
            width: 1024,
            uri: 'https://ghassets.send.app/app_images/flower.jpg',
          }}
          h={'100%'}
          w={'100%'}
          objectFit="cover"
        />
        <LinearGradient
          pos={'absolute'}
          br={'$6'}
          t={0}
          start={[0, 0]}
          end={[0, 1]}
          fullscreen
          colors={['$darkest', 'transparent', '$darkest']}
        />

        <YStack p="$size.2.5" pt={'$size.1.5'} maw={463} position="absolute" zIndex={1}>
          <H1 tt={'uppercase'} $theme-light={{ col: '$color0' }}>
            Unlock Extra Rewards
          </H1>
          <Paragraph $theme-light={{ col: '$color2' }} color={'$color10'} size={'$5'}>
            Register at least 1 Sendtag, maintain the minimum balance, avoid selling, and refer
            others for a bonus multiplier.
          </Paragraph>
        </YStack>
      </Stack>
    </YStack>
  )
}
