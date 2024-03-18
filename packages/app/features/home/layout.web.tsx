import { YStack, ScrollView } from '@my/ui'
import { HomeTopNav } from 'app/components/HomeTopNav'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

type TopNavProps = {
  header: string
}

export function HomeLayout({
  children,
  header = '',
  TopNav,
}: {
  children: React.ReactNode
  header?: string
  TopNav?: React.ComponentType<TopNavProps>
}) {
  return (
    <HomeSideBarWrapper>
      <ScrollView mih="100%" contentContainerStyle={{ minHeight: '100%' }}>
        <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
          {TopNav ? <TopNav header={header} /> : <HomeTopNav header={header} />}
        </YStack>
        {children}
      </ScrollView>
    </HomeSideBarWrapper>
  )
}
