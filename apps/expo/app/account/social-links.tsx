import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { SocialLinksScreen } from 'app/features/account/components/socialLinks/screen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Social Links',
        }}
      />
      <ScreenContainer>
        <SocialLinksScreen />
      </ScreenContainer>
    </>
  )
}
