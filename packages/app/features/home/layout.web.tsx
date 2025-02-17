import { YStack, ScrollView, Container, type ScrollViewProps } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { TagSearchProvider } from 'app/provider/tag-search'
import { useScrollDirection } from 'app/provider/scroll'

export function HomeLayout({
  children,
  TopNav,
  fullHeight,
  ...props
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
} & ScrollViewProps & { fullHeight?: boolean }) {
  const { onScroll } = useScrollDirection()
  return (
    <HomeSideBarWrapper>
      <TagSearchProvider>
        <ScrollView
          mih="100%"
          contentContainerStyle={{
            mih: '100%',
            height: fullHeight ? '100%' : 'auto',
          }}
          scrollEventThrottle={128}
          onScroll={onScroll}
          {...props}
        >
          <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
            {TopNav}
          </YStack>
          <Container
            safeArea={'x'}
            $gtLg={{ pt: '$5', pb: '$0' }}
            height={fullHeight ? '100%' : 'auto'}
          >
            {children}
          </Container>
        </ScrollView>
      </TagSearchProvider>
    </HomeSideBarWrapper>
  )
}
