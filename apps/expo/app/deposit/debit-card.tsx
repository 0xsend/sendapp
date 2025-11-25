import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositCoinbaseScreen } from 'app/features/deposit/DepositCoinbase/screen'
import { useTranslation } from 'react-i18next'

export default function DebitCardDepositScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.deposit.debitCard'),
        }}
      />
      <ScreenContainer>
        <DepositCoinbaseScreen defaultPaymentMethod="CARD" />
      </ScreenContainer>
    </>
  )
}
