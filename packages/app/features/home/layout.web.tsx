import { Container, ScrollView, type ScrollViewProps, YStack } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { TagSearchProvider } from 'app/provider/tag-search'
import { useScrollDirection } from 'app/provider/scroll'
import { BOTTOM_NAV_BAR_HEIGHT } from 'app/components/BottomTabBar/BottomNavBar'
import { BottomNavBarWrapper } from 'app/components/BottomTabBar/BottomNavBarWrapper'

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

  return (
    <HomeSideBarWrapper>
      <BottomNavBarWrapper>
        <TagSearchProvider>
          <ScrollView
            ref={ref}
            mih="100%"
            contentContainerStyle={{
              mih: '100%',
              height: fullHeight ? '100%' : 'auto',
            }}
            scrollEventThrottle={128}
            onScroll={onScroll}
            onContentSizeChange={onContentSizeChange}
            showsVerticalScrollIndicator={false}
            {...props}
          >
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
              pb={BOTTOM_NAV_BAR_HEIGHT}
              $gtLg={{ pt: '$5', pb: '$0' }}
              height={fullHeight ? '100%' : 'auto'}
            >
              {children}
            </Container>
          </ScrollView>
        </TagSearchProvider>
      </BottomNavBarWrapper>
    </HomeSideBarWrapper>
  )
}
