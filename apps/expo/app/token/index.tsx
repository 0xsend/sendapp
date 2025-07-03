import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'
import { Paragraph, Spinner } from '@my/ui'
import { TokenDetails } from 'app/features/home/TokenDetails'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'

export default function TokenScreen() {
  const { coin: selectedCoin, isLoading } = useCoinFromTokenParam()

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Balance',
        }}
      />
      <ScreenContainer>
        <IsPriceHiddenProvider>
          {(() => {
            switch (true) {
              case isLoading:
                return <Spinner size="large" />
              case !selectedCoin:
                return <Paragraph color={'$error'}>Error loading selected coin</Paragraph>
              default:
                return <TokenDetails coin={selectedCoin} />
            }
          })()}
        </IsPriceHiddenProvider>
      </ScreenContainer>
    </>
  )
}
