import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'
import { StablesBody } from 'app/features/home/screen'
import { useTranslation } from 'react-i18next'

export default function StablesScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.stables.root'),
        }}
      />
      <ScreenContainer>
        <IsPriceHiddenProvider>
          <StablesBody />
        </IsPriceHiddenProvider>
      </ScreenContainer>
    </>
  )
}
