import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositCoinbaseScreen } from 'app/features/deposit/DepositCoinbase/screen'
import { useTranslation } from 'react-i18next'

export default function ApplePayDepositScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.deposit.applePay'),
        }}
      />
      <ScreenContainer>
        <DepositCoinbaseScreen defaultPaymentMethod="APPLE_PAY" />
      </ScreenContainer>
    </>
  )
}
