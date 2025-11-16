import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ActivityDetails } from 'app/features/activity/ActivityDetails'
import { useTranslation } from 'react-i18next'

export default function ActivityDetailsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.activity.details'),
        }}
      />
      <ScreenContainer>
        <ActivityDetails />
      </ScreenContainer>
    </>
  )
}
