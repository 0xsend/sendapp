import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack, useLocalSearchParams } from 'expo-router'
import { CheckClaimPreviewScreen } from 'app/features/check/claim/preview'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')
  const { code } = useLocalSearchParams<{ code: string }>()

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.check.claim'),
        }}
      />
      <ScreenContainer>
        <CheckClaimPreviewScreen checkCode={code ?? ''} />
      </ScreenContainer>
    </>
  )
}
