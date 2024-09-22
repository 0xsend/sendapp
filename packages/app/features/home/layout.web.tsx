import { YStack, ScrollView, Container, type ScrollViewProps, useMedia } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { TagSearchProvider } from 'app/provider/tag-search'
import { usePathname } from 'app/utils/usePathname'
import { HomeButtonRow } from './HomeButtons'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { useState } from 'react'

export function HomeLayout({
  children,
  TopNav,
  ...props
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
} & ScrollViewProps) {
  const pathname = usePathname()
  const media = useMedia()
  const [isActionRowVisible, setIsActionRowVisible] = useState(true)
  const [, setScrollY] = useState(0)
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const isEndOfView = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50
    setScrollY((prev) => {
      if ((prev > contentOffset.y && !isEndOfView) || contentOffset.y < 50) {
        setIsActionRowVisible(true)
      } else if (prev < e.nativeEvent.contentOffset.y || isEndOfView) {
        setIsActionRowVisible(false)
      } else {
        setIsActionRowVisible(true)
      }
      return e.nativeEvent.contentOffset.y
    })
  }
  return (
    <HomeSideBarWrapper>
      <TagSearchProvider>
        <ScrollView
          mih="100%"
          contentContainerStyle={{
            mih: '100%',
          }}
          scrollEventThrottle={128}
          onScroll={onScroll}
          {...props}
        >
          <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
            {TopNav}
          </YStack>
          <Container $gtLg={{ pt: '$5', pb: '$0' }}>{children}</Container>
        </ScrollView>
        {media.lg && pathname === '/' && <HomeButtonRow isVisible={isActionRowVisible} />}
      </TagSearchProvider>
    </HomeSideBarWrapper>
  )
}
