import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SecretShopScreen } from 'app/features/secret-shop/screen'
import { useTranslation } from 'react-i18next'

export default function SecretShop() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.secretShop.root'),
        }}
      />
      <ScreenContainer>
        <SecretShopScreen />
      </ScreenContainer>
    </>
  )
}
