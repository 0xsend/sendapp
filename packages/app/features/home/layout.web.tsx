import { YStack } from '@my/ui'
import { HomeTopNav } from 'app/components/HomeTopNav'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

export function HomeLayout({
  children,
  header = '',
  subheader = '',
}: { children: React.ReactNode; header?: string; subheader?: string }) {
  return (
    <HomeSideBarWrapper>
      <YStack h={'100%'} f={1}>
        <YStack gap="$3" $gtLg={{ pt: '$8' }} w={'100%'}>
          <HomeTopNav header={header} subheader={subheader} />
        </YStack>
        {children}
      </YStack>
    </HomeSideBarWrapper>
  )
}
