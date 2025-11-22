import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ActivityRewardsScreen } from 'app/features/rewards/activity/screen'
import { useTranslation } from 'react-i18next'

export default function RewardsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.rewards.root'),
        }}
      />
      <ScreenContainer>
        <ActivityRewardsScreen />
      </ScreenContainer>
    </>
  )
}
