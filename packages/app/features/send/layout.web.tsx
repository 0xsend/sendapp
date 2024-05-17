import { YStack } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

export function SendLayout({
  children,
  TopNav,
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
}) {
  return (
    <HomeSideBarWrapper>
      <YStack mih="100%" f={1}>
        <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
          {TopNav}
        </YStack>
        {children}
      </YStack>
    </HomeSideBarWrapper>
  )
}
