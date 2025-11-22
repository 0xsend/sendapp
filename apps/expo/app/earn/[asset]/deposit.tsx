import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositScreen } from 'app/features/earn/deposit/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { useTranslation } from 'react-i18next'

export default function DepositAssetSavingsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.earn.deposit'),
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <DepositScreen />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
