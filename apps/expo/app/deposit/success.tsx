import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositSuccessScreen } from 'app/features/deposit/success/screen'
import { useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { useTranslation } from 'react-i18next'

export default function SuccessDepositScreen() {
  const { t } = useTranslation('navigation')

  useEffect(() => {
    void WebBrowser.dismissBrowser()
  }, [])

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.deposit.success'),
        }}
      />
      <ScreenContainer>
        <DepositSuccessScreen />
      </ScreenContainer>
    </>
  )
}
