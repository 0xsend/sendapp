import { Avatar, Link, ScrollView, Spinner, XStack, YStack, LinkableAvatar } from '@my/ui'
import { LinearGradient } from '@tamagui/linear-gradient'
import { IconBadgeCheckSolid2, IconQr } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { MainFooter } from './footer'
import { useThemeSetting } from '@tamagui/next-theme'

const MainLayout = ({
  scrollable = false,
  children,
}: { scrollable?: boolean; children?: React.ReactNode }) => {
  const { profile } = useUser()
  const avatar_url = profile?.avatar_url
  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'
  const isDark = resolvedTheme?.startsWith('dark')
  const isVerified = Boolean(profile?.verified_at)
  return (
    <YStack>
      <YStack height={'100%'} pb={'$10'} $shorter={{ pb: '$8' }} style={{ height: '100vh' }}>
        <XStack borderColor={separatorColor} borderBottomWidth={1} pt={'$6'}>
          <XStack w={'90%'} ai={'center'} jc={'space-between'} marginHorizontal={'5%'} py={'$6'}>
            <Link href={'/account'}>
              <XStack position="relative">
                <LinkableAvatar br={'$6'} size={'$4.5'} href={`/profile/${profile?.send_id}`}>
                  {avatar_url ? (
                    <Avatar.Image src={avatar_url} width={48} height={48} />
                  ) : (
                    <Avatar.Fallback jc={'center'}>
                      <Spinner size="large" color="$color12" />
                    </Avatar.Fallback>
                  )}
                </LinkableAvatar>
                {isVerified && (
                  <XStack zi={100} pos="absolute" bottom={0} right={0} x="$0.5" y="$0.5">
                    <XStack pos="absolute" elevation={'$1'} scale={0.5} br={1000} inset={0} />
                    <IconBadgeCheckSolid2
                      size="$1"
                      scale={0.7}
                      color="$neon8"
                      $theme-dark={{ color: '$neon7' }}
                      // @ts-expect-error - checkColor is not typed
                      checkColor={isDark ? '#082B1B' : '#fff'}
                    />
                  </XStack>
                )}
              </XStack>
            </Link>
            <IconQr color={iconColor} />
          </XStack>
        </XStack>
        {scrollable ? (
          <>
            <ScrollView>{children}</ScrollView>
            <LinearGradient
              start={[0, 1]}
              end={[0, 0]}
              width={'100%'}
              height={'$6'}
              colors={['$background', 'transparent']}
              pos={'absolute'}
              pointerEvents={'none'}
              b={'$10'}
              $shorter={{ b: '$8' }}
            />
          </>
        ) : (
          <>{children}</>
        )}
      </YStack>
      <MainFooter />
    </YStack>
  )
}

export { MainLayout }
