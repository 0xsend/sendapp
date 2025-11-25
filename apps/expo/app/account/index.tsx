import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { MobileAccountLayout } from 'app/features/account/AccountScreenLayout'
import { useTranslation } from 'react-i18next'

export default function AccountScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.root'),
        }}
      />
      <ScreenContainer>
        <MobileAccountLayout />
      </ScreenContainer>
    </>
  )
}
