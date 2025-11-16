import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { RewardsBalanceScreen } from 'app/features/earn/rewards/screen'
import { useTranslation } from 'react-i18next'

export default function RewardsBalance() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.earn.rewards'),
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <RewardsBalanceScreen />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
