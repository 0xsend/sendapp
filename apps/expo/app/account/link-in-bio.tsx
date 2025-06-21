import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { LinkInBioScreen } from 'app/features/account/components/linkInBio/screen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Link In Bio',
        }}
      />
      <ScreenContainer>
        <LinkInBioScreen />
      </ScreenContainer>
    </>
  )
}
