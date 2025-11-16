import { SendConfirmScreen } from 'app/features/send/confirm/screen'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'

export default function SendConfirm() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.send.previewAndSend'),
        }}
      />
      <ScreenContainer>
        <SendConfirmScreen />
      </ScreenContainer>
    </>
  )
}
