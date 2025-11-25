import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { WithdrawForm } from 'app/features/earn/withdraw/screen'
import { useTranslation } from 'react-i18next'

export default function WithdrawAssetSavingsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.earn.withdraw'),
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <WithdrawForm />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
