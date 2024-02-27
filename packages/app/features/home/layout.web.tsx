import { Container, ScrollView, YStack } from '@my/ui'
import { HomeHeader } from 'app/components/HomeHeader'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { useThemeSetting } from '@tamagui/next-theme'

export function HomeLayout({
  children,
  header = '',
}: { children: React.ReactNode; header?: string }) {
  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'
  return (
    <HomeSideBarWrapper>
      <YStack h={'100%'} f={1}>
        <ScrollView f={3} fb={0} backgroundColor={'$background05'}>
          <Container $lg={{ borderBottomWidth: 1, borderColor: separatorColor }} $sm={{ pt: '$6' }}>
            <YStack gap="$6" py={'$3'} $gtLg={{ pt: '$11' }} w={'100%'}>
              <HomeHeader>{header}</HomeHeader>
            </YStack>
          </Container>
          {children}
        </ScrollView>
      </YStack>
    </HomeSideBarWrapper>
  )
}
