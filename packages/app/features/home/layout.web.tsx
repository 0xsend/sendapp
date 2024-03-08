import { Container, ScrollView, YStack } from '@my/ui'
import { HomeTopNav } from 'app/components/HomeTopNav'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { useThemeSetting } from '@tamagui/next-theme'

export function HomeLayout({
  children,
  header = '',
  backLink,
}: { children: React.ReactNode; header?: string; backLink?: string }) {
  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'
  return (
    <HomeSideBarWrapper>
      <YStack h={'100%'} f={1}>
        <ScrollView f={3} fb={0} backgroundColor={'$background05'}>
          <Container $lg={{ borderBottomWidth: 1, borderColor: separatorColor }} $sm={{ pt: '$6' }}>
            <YStack gap="$3" py={'$3'} $gtMd={{ pt: '$11' }} w={'100%'}>
              <HomeTopNav>{header}</HomeTopNav>
            </YStack>
          </Container>
          {children}
        </ScrollView>
      </YStack>
    </HomeSideBarWrapper>
  )
}
