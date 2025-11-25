import { Stack } from 'expo-router/build/layouts/Stack'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { EarningsBalance } from 'app/features/earn/earnings/screen'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { useTranslation } from 'react-i18next'

export default function BalanceAssetSavingsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.earn.balance'),
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <EarningsBalance />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
