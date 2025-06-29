import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositSuccessScreen } from 'app/features/deposit/success/screen'
import { useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'

export default function SuccessDepositScreen() {
  useEffect(() => {
    void WebBrowser.dismissBrowser()
  }, [])

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Success',
        }}
      />
      <ScreenContainer>
        <DepositSuccessScreen />
      </ScreenContainer>
    </>
  )
}
