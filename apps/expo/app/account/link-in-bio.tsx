import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { LinkInBioScreen } from 'app/features/account/components/linkInBio/screen'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.linkInBio'),
        }}
      />
      <ScreenContainer>
        <LinkInBioScreen />
      </ScreenContainer>
    </>
  )
}
