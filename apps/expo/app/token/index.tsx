import { Stack } from 'expo-router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'
import { Container, Paragraph, Spinner, useSafeAreaInsets } from '@my/ui'
import { TokenDetails } from 'app/features/home/TokenDetails'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { CONTAINER_OFFSET } from 'apps-expo/components/layout/ScreenContainer'

export default function TokenScreen() {
  const { coin: selectedCoin, isLoading } = useCoinFromTokenParam()
  const insets = useSafeAreaInsets()

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Invest',
        }}
      />
      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
        overflow={'visible'}
        paddingTop={CONTAINER_OFFSET}
        paddingBottom={CONTAINER_OFFSET + insets.bottom}
      >
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
      </Container>
    </>
  )
}
