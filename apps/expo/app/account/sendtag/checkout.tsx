import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { CheckoutScreen } from 'app/features/account/sendtag/checkout/screen'
import { useTranslation } from 'react-i18next'

export default function CheckoutSendtagsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.sendtagsCheckout'),
        }}
      />
      <ScreenContainer>
        <CheckoutScreen />
      </ScreenContainer>
    </>
  )
}
