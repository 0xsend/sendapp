import { Container, ScrollView, YStack } from '@my/ui'
import { HomeHeader } from 'app/components/HomeHeader'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

export function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <HomeSideBarWrapper>
      <ScrollView f={3} fb={0} backgroundColor={'$backgroundHover'}>
        <Container>
          <YStack gap="$6" pt="$5" pb="$2" w={'100%'}>
            <HomeHeader>
              {/* TODO: remove required children prop from HomeHeader */}
              {''}
            </HomeHeader>
          </YStack>
        </Container>
        {children}
      </ScrollView>
    </HomeSideBarWrapper>
  )
}
