import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { SwapSummaryScreen } from 'app/features/swap/summary/screen'
import { useTranslation } from 'react-i18next'

export default function TradeSummaryScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.trade.summary'),
        }}
      />
      <ScreenContainer>
        <SwapSummaryScreen />
      </ScreenContainer>
    </>
  )
}
