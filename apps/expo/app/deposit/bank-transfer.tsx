import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { BankTransferScreen } from 'app/features/deposit/bank-transfer'
import { useTranslation } from 'react-i18next'

export default function BankTransferDepositScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.deposit.bankTransfer', 'Bank Transfer'),
        }}
      />
      <ScreenContainer>
        <BankTransferScreen />
      </ScreenContainer>
    </>
  )
}
