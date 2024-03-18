import { YStack, ScrollView } from '@my/ui'
import { HomeTopNav } from 'app/components/HomeTopNav'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

type TopNavProps = {
  header: string
  subheader: string
}

export function HomeLayout({
  children,
  header = '',
  subheader = '',
  TopNav,
}: {
  children: React.ReactNode
  header?: string
  subheader?: string
  TopNav?: React.ComponentType<TopNavProps>
}) {
  return (
    <HomeSideBarWrapper>
      <ScrollView mih="100%" contentContainerStyle={{ minHeight: '100%' }}>
        <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
          {TopNav ? (
            <TopNav header={header} subheader={subheader} />
          ) : (
            <HomeTopNav header={header} subheader={subheader} />
          )}
        </YStack>
        {children}
      </ScrollView>
    </HomeSideBarWrapper>
  )
}
