import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { ContactsScreen } from 'app/features/contacts/screen'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'

export default function ContactsRoute() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.contacts'),
        }}
      />
      <ScreenContainer scrollable={false}>
        <ContactsScreen />
      </ScreenContainer>
    </>
  )
}
