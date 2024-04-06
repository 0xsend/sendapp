import { YStack, ScrollView } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

export function HomeLayout({
  children,
  TopNav,
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
}) {
  return (
    <HomeSideBarWrapper>
      <ScrollView mih="100%" contentContainerStyle={{ minHeight: '100%' }}>
        <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
          {TopNav}
        </YStack>
        {children}
      </ScrollView>
    </HomeSideBarWrapper>
  )
}
