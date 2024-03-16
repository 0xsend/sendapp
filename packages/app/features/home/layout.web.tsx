import { YStack, ScrollView } from '@my/ui'
import { HomeTopNav } from 'app/components/HomeTopNav'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

export function HomeLayout({
  children,
  header = '',
  subheader = '',
}: { children: React.ReactNode; header?: string; subheader?: string }) {
  return (
    <HomeSideBarWrapper>
      <ScrollView mih="100%" contentContainerStyle={{ minHeight: '100%' }}>
        <YStack gap="$3" $gtLg={{ pt: '$10' }} w={'100%'}>
          <HomeTopNav header={header} subheader={subheader} />
        </YStack>
        {children}
      </ScrollView>
    </HomeSideBarWrapper>
  )
}
