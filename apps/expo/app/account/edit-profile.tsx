import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { EditProfile } from 'app/features/account/components/editProfile/screen'
import { useTranslation } from 'react-i18next'

export default function ProfileScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.profile'),
        }}
      />
      <ScreenContainer>
        <EditProfile />
      </ScreenContainer>
    </>
  )
}
