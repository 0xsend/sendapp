import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { PersonalInfoScreen } from 'app/features/account/components/personalInfo/screen'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.personalInfo'),
        }}
      />
      <ScreenContainer>
        <PersonalInfoScreen />
      </ScreenContainer>
    </>
  )
}
