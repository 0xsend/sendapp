import { Stack } from 'expo-router'
import { IsPriceHiddenProvider } from 'app/features/home/utils/useIsPriceHidden'
import { Paragraph, Spinner } from '@my/ui'
import { TokenDetails } from 'app/features/home/TokenDetails'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { useTranslation } from 'react-i18next'

export default function TokenScreen() {
  const { coin: selectedCoin, isLoading } = useCoinFromTokenParam()
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.token.root'),
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
                return <TokenDetails />
            }
          })()}
        </IsPriceHiddenProvider>
      </ScreenContainer>
    </>
  )
}
