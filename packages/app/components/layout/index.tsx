import { Avatar, Image, Link, Paragraph, ScrollView, Spinner, Theme, XStack, YStack } from '@my/ui'
import { LinearGradient } from '@tamagui/linear-gradient'
import { IconQr } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { Square } from 'tamagui'
import { MainFooter } from './footer'

const MainLayout = ({
  scrollable = false,
  children,
}: { scrollable?: boolean; children?: React.ReactNode }) => {
  const { profile } = useUser()
  const avatar_url = profile?.avatar_url
  return (
    <YStack>
      <YStack height={'100vh'} pb={'$size.10'} $shorter={{ pb: '$size.8' }}>
        <Theme name={'send'}>
          <XStack
            w={'90%'}
            ai={'center'}
            jc={'space-between'}
            marginHorizontal={'5%'}
            paddingTop={'$6'}
          >
            <Link href={'/profile'}>
              <Avatar br={'$6'} size={'$4.5'}>
                {avatar_url ? (
                  <Image source={{ uri: avatar_url }} width={48} height={48} />
                ) : (
                  <Spinner size="large" color="$primary" />
                )}
              </Avatar>
            </Link>
            <Paragraph size={'$9'} fontWeight={'700'}>
              Money
            </Paragraph>
            <IconQr />
          </XStack>
        </Theme>
        {scrollable ? (
          <>
            <ScrollView>{children}</ScrollView>
            <LinearGradient
              start={[0, 1]}
              end={[0, 0]}
              width={'100%'}
              height={'$6'}
              colors={['$background', '$backgroundTransparent']}
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
