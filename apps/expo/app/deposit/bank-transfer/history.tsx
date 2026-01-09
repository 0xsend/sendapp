import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { BankTransferHistoryScreen } from 'app/features/deposit/bank-transfer'
import { useTranslation } from 'react-i18next'

export default function BankTransferHistoryScreenRoute() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.deposit.bankTransferHistory', 'Transfer History'),
        }}
      />
      <ScreenContainer>
        <BankTransferHistoryScreen />
      </ScreenContainer>
    </>
  )
}
