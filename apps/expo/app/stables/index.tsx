import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'
import { StablesBody } from 'app/features/home/screen'

export default function StablesScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cash',
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
