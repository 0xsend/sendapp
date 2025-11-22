import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { ActiveEarningsScreen } from 'app/features/earn/active/screen'
import { useTranslation } from 'react-i18next'

export default function SavingsAssetScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.earn.details'),
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <ActiveEarningsScreen />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
