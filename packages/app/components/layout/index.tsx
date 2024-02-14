import { Avatar, Link, ScrollView, Spinner, Theme, XStack, YStack } from '@my/ui'
import { LinearGradient } from '@tamagui/linear-gradient'
import { IconQr } from 'app/components/icons'
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
  return (
    <YStack>
      <YStack height={'100vh'} pb={'$size.10'} $shorter={{ pb: '$size.8' }}>
        <XStack borderColor={separatorColor} borderBottomWidth={1} pt={'$6'}>
          <XStack w={'90%'} ai={'center'} jc={'space-between'} marginHorizontal={'5%'} py={'$6'}>
            <Link href={'/settings'}>
              <Avatar br={'$6'} size={'$4.5'}>
                {avatar_url ? (
                  <Avatar.Image src={avatar_url} width={48} height={48} />
                ) : (
                  <Avatar.Fallback jc={'center'}>
                    <Spinner size="large" color="$color" />
                  </Avatar.Fallback>
                )}
              </Avatar>
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
              b={'$size.10'}
              $shorter={{ b: '$size.8' }}
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
