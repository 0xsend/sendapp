import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { DepositScreen } from 'app/features/deposit/screen'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.savings.root'),
        }}
      />
      <ScreenContainer>
        <DepositScreen />
      </ScreenContainer>
    </>
  )
}
