import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'
import { InvestmentsBody } from 'app/features/home/screen'

export default function InvestmentsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Invest',
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
