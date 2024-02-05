import { ScrollView, YStack, useWindowDimensions } from '@my/ui'

import { SignInSideBarWrapper } from 'app/components/sidebar/SignInSideBar'

export function AuthLayout({ children }: { children: React.ReactNode; header?: string }) {
  const { height: windowHeight } = useWindowDimensions()
  return (
    <SignInSideBarWrapper>
      <YStack h={windowHeight} f={1}>
        <ScrollView f={3} fb={0} jc="center" backgroundColor={'$backgroundHover'}>
          {children}
        </ScrollView>
      </YStack>
    </SignInSideBarWrapper>
  )
}
