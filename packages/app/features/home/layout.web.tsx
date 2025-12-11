import { Container, PendingIndicatorBar, ScrollView, type ScrollViewProps, YStack } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { TagSearchProvider } from 'app/provider/tag-search'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { BottomNavBarWrapper } from 'app/components/BottomTabBar/BottomNavBarWrapper'
import { useRouteChange } from 'app/routers/useRouteChange.web'
import { useTabBarSize } from 'app/components/BottomTabBar/useTabBarSize'

export function HomeLayout({
  children,
  TopNav,
  fullHeight,
  ...props
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
} & ScrollViewProps & { fullHeight?: boolean }) {
  const { onScroll, onContentSizeChange, ref } = useScrollDirection()
  const isPending = useRouteChange()
  const { height } = useTabBarSize()

  return (
    <HomeSideBarWrapper>
      <BottomNavBarWrapper>
        <TagSearchProvider>
          <PendingIndicatorBar pending={isPending} />
          <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
            {TopNav}
          </YStack>
          <Container
            safeAreaProps={{
              style: { flex: 1 },
              edges: {
                top: 'off',
                bottom: 'maximum',
                left: 'additive',
                right: 'additive',
              },
            }}
            pb={height}
            group
            $gtLg={{ pt: '$5', pb: '$0' }}
            height={fullHeight ? '100%' : 'auto'}
          >
            {children}
          </Container>
        </TagSearchProvider>
      </BottomNavBarWrapper>
    </HomeSideBarWrapper>
  )
}
