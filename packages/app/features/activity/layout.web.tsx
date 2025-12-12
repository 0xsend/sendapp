import { Container, PendingIndicatorBar, type ScrollViewProps, YStack } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { TagSearchProvider } from 'app/provider/tag-search'
import { BottomNavBarWrapper } from 'app/components/BottomTabBar/BottomNavBarWrapper'
import { useRouteChange } from 'app/routers/useRouteChange.web'

export function HomeLayout({
  children,
  TopNav,
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
} & ScrollViewProps & { fullHeight?: boolean }) {
  const isPending = useRouteChange()

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
            group
          >
            {children}
          </Container>
        </TagSearchProvider>
      </BottomNavBarWrapper>
    </HomeSideBarWrapper>
  )
}
