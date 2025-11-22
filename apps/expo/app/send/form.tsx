import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendAmountForm } from 'app/features/send/SendAmountForm'
import { useTranslation } from 'react-i18next'

export default function SendFormScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.send.enterAmount'),
        }}
      />
      <ScreenContainer>
        <SendAmountForm />
      </ScreenContainer>
    </>
  )
}
