import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SwapFormScreen } from 'app/features/swap/form/screen'
import { useTranslation } from 'react-i18next'

export default function TradeScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.trade.root'),
        }}
      />
      <ScreenContainer>
        <SwapFormScreen />
      </ScreenContainer>
    </>
  )
}
