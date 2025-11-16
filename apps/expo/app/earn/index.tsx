import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { EarnScreen } from 'app/features/earn/screen'
import { useTranslation } from 'react-i18next'

export default function SavingsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.earn.root'),
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <EarnScreen
            images={{
              learn: require('../../assets/images/deposit.jpg'),
            }}
          />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
