import { SecretShopScreen } from 'app/features/secret-shop/screen'
import { configureScreenHeader } from 'apps-expo/utils/configureScreenHeader'
import { ScreenContentContainer } from 'app/components/ScreenContentContainer'

export default function SecretShopScreenWrapper() {
  return (
    <ScreenContentContainer>
      <SecretShopScreen />
    </ScreenContentContainer>
  )
}

configureScreenHeader(SecretShopScreenWrapper, {
  headerTitle: 'Secret Shop',
  headerBackTitle: 'Back',
})
