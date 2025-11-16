import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { CantonWalletScreen } from 'app/features/canton-wallet/screen'
import { useTranslation } from 'react-i18next'

export default function CantonWallet() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.canton.root'),
        }}
      />
      <ScreenContainer>
        <CantonWalletScreen />
      </ScreenContainer>
    </>
  )
}
