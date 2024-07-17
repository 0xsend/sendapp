import { YStack, ScrollView, Container, type ScrollViewProps, usePwa } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

export function HomeLayout({
  children,
  TopNav,
  ...props
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
} & ScrollViewProps) {
  const isPwa = usePwa()
  return (
    <HomeSideBarWrapper>
      <ScrollView
        mih="100%"
        contentContainerStyle={{
          mih: '100%',
        }}
        {...props}
      >
        <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
          {TopNav}
        </YStack>
        <Container $gtLg={{ pt: '$5', pb: '$0' }} safeAreaPadding={isPwa && 'b'}>
          {children}
        </Container>
      </ScrollView>
    </HomeSideBarWrapper>
  )
}
