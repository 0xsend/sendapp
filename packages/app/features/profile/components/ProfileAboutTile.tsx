import type { Functions } from '@my/supabase/database.types'
import { Button, Fade, Image, LinearGradient, Paragraph, XStack, YStack } from '@my/ui'
import { IconX, IconXLogo } from 'app/components/icons'
import { Platform } from 'react-native'

export const ProfileAboutTile = ({
  profile,
  onClose,
}: {
  profile: Functions<'profile_lookup'>[number]
  onClose: () => void
}) => {
  const handleOnXRedirect = () => {
    const twitterUrl = `https://x.com/${profile.x_username}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Fade>
      <YStack w={'100%'} gap={'$4'} pb={'$4'} testID={'profile-about-tile'}>
        <YStack
          w={'100%'}
          bg={'$color1'}
          borderRadius={'$6'}
          padding={'$5'}
          gap={'$4'}
          elevation={'$0.75'}
        >
          <XStack ai="center" jc="space-between">
            {Platform.OS === 'web' && <Paragraph size={'$8'}>About</Paragraph>}
            <Button
              onPress={onClose}
              chromeless
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
              focusStyle={{ backgroundColor: 'transparent' }}
              display={'none'}
              $gtLg={{ display: 'flex' }}
            >
              <Button.Icon>
                <IconX
                  size={'$1.5'}
                  $theme-dark={{ color: '$primary' }}
                  $theme-light={{ color: '$color12' }}
                />
              </Button.Icon>
            </Button>
          </XStack>
          <YStack
            width="100%"
            aspectRatio={1}
            overflow="hidden"
            borderRadius={'$6'}
            position="relative"
            elevation={'$0.75'}
          >
            <Image
              width={'100%'}
              height={'100%'}
              borderRadius={'$6'}
              objectFit="cover"
              src={
                profile.avatar_url ??
                `https://ui-avatars.com/api?name=${profile?.main_tag_name ?? profile?.name ?? '??'}&size=256&format=png&background=86ad7f`
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
                  {profile?.main_tag_name ?? profile?.name ?? ''}
                </Paragraph>
                <XStack flexWrap="wrap" columnGap={'$2.5'} rowGap={'$2'}>
                  {profile?.all_tags?.map((tag: string) => (
                    <XStack
                      key={tag}
                      bg={'$gray3Dark'}
                      px={'$2.5'}
                      py={'$1'}
                      borderRadius={'$2'}
                      {...(tag === profile?.main_tag_name && {
                        borderWidth: 1,
                        borderColor: '$primary',
                      })}
                    >
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
          <Paragraph>{profile.about}</Paragraph>
        </YStack>
        {profile.x_username && (
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
            elevation={'$0.75'}
          >
            <IconXLogo
              size={'$1'}
              $theme-dark={{ color: '$primary' }}
              $theme-light={{ color: '$color12' }}
            />
            <Paragraph size={'$5'}>{profile.x_username}</Paragraph>
          </XStack>
        )}
      </YStack>
    </Fade>
  )
}
