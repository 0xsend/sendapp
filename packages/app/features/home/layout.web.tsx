import { Container, ScrollView, YStack } from '@my/ui'
import { HomeHeader } from 'app/components/HomeHeader'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { useThemeSetting } from '@tamagui/next-theme'

export function HomeLayout({
  children,
  header = '',
  backButton,
}: { children: React.ReactNode; header?: string; backButton?: boolean }) {
  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'
  return (
    <HomeSideBarWrapper>
      <YStack h={'100%'} f={1}>
        <ScrollView f={3} fb={0} backgroundColor={'$background05'}>
          <Container
            mb={'$6'}
            $gtMd={{ mb: '$7' }}
            $md={{ borderBottomWidth: 1, borderColor: separatorColor }}
            $sm={{ pt: '$6' }}
          >
            <YStack gap="$6" py={'$3'} $gtMd={{ pt: '$11', pb: '$7' }} w={'100%'}>
              <HomeHeader backButton={backButton}>{header}</HomeHeader>
            </YStack>
          </Container>
          {children}
        </ScrollView>
      </YStack>
    </HomeSideBarWrapper>
  )
}
