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
        <Container
          safeAreaProps={{
            style: { flex: 1 },
            edges: {
              top: 'maximum',
              bottom: 'maximum',
              left: 'additive',
              right: 'additive',
            },
          }}
          py="$5"
          height={fullHeight ? '100%' : 'auto'}
        >
          {children}
        </Container>
      </ScrollView>
    </TagSearchProvider>
  )
}
