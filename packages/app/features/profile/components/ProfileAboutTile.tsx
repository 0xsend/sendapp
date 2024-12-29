import type { Functions } from '@my/supabase/database.types'
import { Fade, Image, LinearGradient, Paragraph, Stack, XStack, YStack } from '@my/ui'
import { IconX, IconXLogo } from 'app/components/icons'

export const ProfileAboutTile = ({
  otherUserProfile,
  onClose,
}: {
  otherUserProfile?: Functions<'profile_lookup'>[number] | null
  onClose: () => void
}) => {
  const handleOnXRedirect = () => {
    const twitterUrl = `https://x.com/${otherUserProfile?.x_username}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Fade>
      <YStack w={'100%'} gap={'$4'} pb={'$4'}>
        <YStack w={'100%'} bg={'$color1'} borderRadius={'$6'} padding={'$5'} gap={'$4'}>
          <XStack ai="center" jc="space-between">
            <Paragraph size={'$8'}>About</Paragraph>
            <Stack onPress={onClose} cursor={'pointer'}>
              <IconX
                size={'$1.5'}
                $theme-dark={{ color: '$primary' }}
                $theme-light={{ color: '$color12' }}
              />
            </Stack>
          </XStack>
          <YStack width="100%" aspectRatio={1} overflow="hidden" position="relative">
            <Image
              width={'100%'}
              height={'100%'}
              borderRadius={'$6'}
              objectFit="cover"
              src={
                otherUserProfile?.avatar_url ??
                `https://ui-avatars.com/api.jpg?name=${otherUserProfile?.name ?? '??'}&size=256`
              }
            />
            <LinearGradient
              start={[0, 0]}
              end={[0, 1]}
              fullscreen
              colors={['transparent', '#000000A5']}
              borderRadius="$6"
            >
              <YStack
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                p={'$5'}
                justifyContent="flex-end"
                gap={'$3'}
              >
                <Paragraph size={'$9'} $theme-light={{ color: '$white' }}>
                  {otherUserProfile?.name ||
                    (otherUserProfile?.all_tags?.[0] ? `/${otherUserProfile?.all_tags[0]}` : '??')}
                </Paragraph>
                <XStack flexWrap="wrap" columnGap={'$2.5'} rowGap={'$2'}>
                  {otherUserProfile?.all_tags?.map((tag: string) => (
                    <XStack key={tag} bg={'$gray3Dark'} px={'$2.5'} py={'$1'} borderRadius={'$2'}>
                      <Paragraph
                        size={'$2'}
                        $theme-light={{ color: '$white' }}
                      >{`/${tag}`}</Paragraph>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            </LinearGradient>
          </YStack>
          <Paragraph>{otherUserProfile?.about}</Paragraph>
        </YStack>
        {otherUserProfile?.x_username && (
          <XStack
            ai="center"
            jc="center"
            bg={'$color1'}
            borderRadius={'$6'}
            padding={'$5'}
            w={'100%'}
            gap={'$2'}
            cursor={'pointer'}
            onPress={handleOnXRedirect}
          >
            <IconXLogo
              size={'$1'}
              $theme-dark={{ color: '$primary' }}
              $theme-light={{ color: '$color12' }}
            />
            <Paragraph size={'$5'}>{otherUserProfile?.x_username}</Paragraph>
          </XStack>
        )}
      </YStack>
    </Fade>
  )
}
