import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { LanguagePreferences } from 'app/features/account/components/language/screen'
import { useTranslation } from 'react-i18next'

export default function LanguageScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.language'),
        }}
      />
      <ScreenContainer>
        <LanguagePreferences />
      </ScreenContainer>
    </>
  )
}
