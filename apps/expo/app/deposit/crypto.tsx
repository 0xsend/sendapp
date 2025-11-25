import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositCryptoScreen } from 'app/features/deposit/crypto/screen'
import { useTranslation } from 'react-i18next'

export default function CryptoDepositScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.deposit.onBase'),
        }}
      />
      <ScreenContainer>
        <DepositCryptoScreen />
      </ScreenContainer>
    </>
  )
}
