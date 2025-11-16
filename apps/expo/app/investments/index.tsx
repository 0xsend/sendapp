import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'
import { InvestmentsBody } from 'app/features/home/screen'
import { useTranslation } from 'react-i18next'

export default function InvestmentsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.investments.root'),
        }}
      />
      <ScreenContainer>
        <IsPriceHiddenProvider>
          <InvestmentsBody />
        </IsPriceHiddenProvider>
      </ScreenContainer>
    </>
  )
}
