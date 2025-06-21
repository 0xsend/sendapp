import type { ReactNode } from 'react'
import { ScrollView, type ScrollViewProps, PendingIndicatorBar } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { TagSearchProvider } from 'app/provider/tag-search'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { BottomNavBarWrapper } from 'app/components/BottomTabBar/BottomNavBarWrapper'
import { useRouteChange } from 'app/routers/useRouteChange.web'

/**
 * Profile Layout Component
 *
 * Specialized layout for profile pages without TopNav
 * Has bottom navigation, sidebar and proper scrolling support
 */
export function ProfileLayout({
  children,
  fullHeight,
  ...props
}: {
  children: ReactNode
  fullHeight?: boolean
} & ScrollViewProps) {
  const { onScroll, onContentSizeChange, ref } = useScrollDirection()
  const isPending = useRouteChange()

  return (
    <HomeSideBarWrapper>
      <BottomNavBarWrapper>
        <TagSearchProvider>
          <PendingIndicatorBar pending={isPending} />
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
            {children}s
          </ScrollView>
        </TagSearchProvider>
      </BottomNavBarWrapper>
    </HomeSideBarWrapper>
  )
}
