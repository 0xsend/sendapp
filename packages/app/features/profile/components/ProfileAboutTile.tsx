import type { Functions } from '@my/supabase/database.types'
import { Anchor, Button, Fade, Image, LinearGradient, Paragraph, XStack, YStack } from '@my/ui'
import { IconX, IconLinkInBio } from 'app/components/icons'
import { Platform } from 'react-native'

export const ProfileAboutTile = ({
  profile,
  onClose,
}: {
  profile: Functions<'profile_lookup'>[number]
  onClose: () => void
}) => {
  return (
    <Fade>
      <YStack w={'100%'} gap={'$4'} pb={'$4'} testID={'profile-about-tile'}>
        <YStack
          w={'100%'}
          bg={'$color1'}
          borderRadius={'$6'}
          padding={'$5'}
          gap={'$4'}
          elevation={Platform.OS === 'android' ? undefined : '$0.75'}
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
            elevation={Platform.OS === 'android' ? undefined : '$0.75'}
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
        {Array.isArray(profile.links_in_bio) && profile.links_in_bio.length > 0 && (
          <YStack
            bg={'$color1'}
            borderRadius={'$6'}
            padding={'$5'}
            gap={'$4'}
            elevation={Platform.OS === 'android' ? undefined : '$0.75'}
          >
            <Paragraph size={'$6'} fontWeight="600">
              Links
            </Paragraph>
            <YStack gap="$3">
              {profile.links_in_bio.map(({ domain, handle, domain_name }) => {
                const fullUrl = `https://${domain}${handle}`
                return (
                  <Anchor
                    key={domain_name}
                    href={fullUrl}
                    target="_blank"
                    width="100%"
                    f={1}
                    textDecorationLine="none"
                  >
                    <XStack
                      ai="center"
                      jc="space-between"
                      bg={'$color2'}
                      borderRadius={'$4'}
                      padding={'$4'}
                      w={'100%'}
                      gap={'$3'}
                      cursor={'pointer'}
                    >
                      <XStack gap={'$3'} ai="center" flex={1}>
                        <IconLinkInBio domain_name={domain_name} />
                        <YStack flex={1}>
                          <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
                            {domain_name}
                          </Paragraph>
                          <Paragraph size={'$3'} color={'$color10'}>
                            {handle}
                          </Paragraph>
                        </YStack>
                      </XStack>
                      <Paragraph size={'$3'} color={'$color10'}>
                        View →
                      </Paragraph>
                    </XStack>
                  </Anchor>
                )
              })}
            </YStack>
          </YStack>
        )}
      </YStack>
    </Fade>
  )
}
