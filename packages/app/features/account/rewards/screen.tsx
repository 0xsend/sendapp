import { YStack, H1, Paragraph, XStack, LinkableButton, Button, Image, Stack } from '@my/ui'
import { IconArrowRight, IconSend } from 'app/components/icons'

export function RewardsScreen() {
  return (
    <YStack pt={'$size.3.5'} $gtLg={{ pt: 0 }} f={1} $gtMd={{ ml: '$4' }}>
      <YStack pb={'$size.3.5'}>
        <YStack w={'100%'} mb={'$size.3.5'} gap={'$size.0.9'}>
          <H1 size={'$9'} fontWeight={'900'} color="$color12" tt={'uppercase'}>
            Claim Your Network Benefits
          </H1>
          <Paragraph color={'$color10'} size={'$5'}>
            Participate in the Send Ecosystem and earn Send Tokens. Your Network! Your Rewards!
          </Paragraph>
        </YStack>

        <YStack $gtLg={{ flexDirection: 'row' }} gap={'$size.3.5'}>
          {/* @TODO: href, reward */}
          <Section
            title="Activity Rewards"
            href="/account/rewards/activity"
            reward="120,000 SEND"
          />
          <Section title="Lock &amp; Earn" href="/" reward="120,000 SEND" />
        </YStack>
      </YStack>
    </YStack>
  )
}

const Section = ({
  title,
  href,
  reward,
}: {
  title: string
  href: string
  reward: string
}) => {
  return (
    <YStack f={1} pos={'relative'} overflow="hidden" borderRadius={'$6'} backgroundColor={'$black'}>
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
      <Stack pos="absolute" t={0} l={0} h="100%" w="100%" backgroundColor={'black'} opacity={0.2} />
      <YStack p="$size.3.5" gap={'$size.11'}>
        <XStack
          gap={6}
          ai="center"
          alignSelf="flex-start"
          pos={'relative'}
          p={'$size.0.75'}
          pr={'$size.0.9'}
          borderRadius={'$4'}
          backgroundColor={'$color1'}
        >
          <IconSend size={24} color="$primary" />
          <Paragraph size={'$5'}>{title}</Paragraph>
        </XStack>
        <XStack gap={'$size.1'} jc="space-between">
          <YStack w="100%">
            <Paragraph
              fontWeight={400}
              color={'$color10'}
              $theme-light={{ color: '$color3' }}
              size={'$5'}
            >
              Claimable
            </Paragraph>
            <XStack ai={'center'} jc="space-between">
              <Paragraph
                fontWeight={500}
                ff={'$mono'}
                size={'$9'}
                $theme-light={{ color: '$color0' }}
              >
                {reward}
              </Paragraph>
              <LinkableButton href={href} unstyled borderRadius={'$3'} p={'$size.0.5'}>
                <Button.Icon>
                  <IconArrowRight size={26} color={'$primary'} />
                </Button.Icon>
              </LinkableButton>
            </XStack>
          </YStack>
        </XStack>
      </YStack>
    </YStack>
  )
}
