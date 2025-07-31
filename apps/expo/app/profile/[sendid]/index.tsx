import { Stack, useLocalSearchParams } from 'expo-router'
import { ProfileScreen } from 'app/features/profile/screen'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { useProfileLookup } from 'app/utils/useProfileLookup'

export default function Screen() {
  const sendid = useLocalSearchParams<{ sendid: string }>()?.sendid
  const { data: otherUserProfile, isLoading } = useProfileLookup('sendid', sendid)

  return (
    <>
      <Stack.Screen
        options={{
          title: isLoading
            ? ''
            : otherUserProfile?.name || otherUserProfile?.main_tag_name || `#${sendid}`,
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <ProfileScreen />
      </ScreenContainer>
    </>
  )
}
