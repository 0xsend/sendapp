import { YStack, ScrollView } from '@my/ui'
import { HomeTopNav } from 'app/components/HomeTopNav'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

export function HomeLayout({
  children,
  header = '',
  subheader = '',
  submenuHeader = '',
}: { children: React.ReactNode; header?: string; subheader?: string; submenuHeader?: string }) {
  return (
    <HomeSideBarWrapper>
      <ScrollView mih="100%" contentContainerStyle={{ minHeight: '100%' }}>
        <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
          <HomeTopNav header={header} subheader={subheader} submenuHeader={submenuHeader} />
        </YStack>
        {children}
      </ScrollView>
    </HomeSideBarWrapper>
  )
}
