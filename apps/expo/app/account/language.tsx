import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { LanguagePreferences } from 'app/features/account/components/language/screen'

export default function LanguageScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Language',
        }}
      />
      <ScreenContainer>
        <LanguagePreferences />
      </ScreenContainer>
    </>
  )
}
