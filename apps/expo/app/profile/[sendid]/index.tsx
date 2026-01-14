import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { ProfileScreen } from 'app/features/profile/screen'
import { ExternalAddressScreen } from 'app/features/profile/ExternalAddressScreen'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { isAddress, type Address } from 'viem'
import { useEffect } from 'react'
import { useClearSendParamsOnBlur } from 'apps-expo/utils/useClearSendParamsOnBlur'

export default function Screen() {
  const sendid = useLocalSearchParams<{ sendid: string }>()?.sendid
  const router = useRouter()
  useClearSendParamsOnBlur()

  // Determine if identifier is an Ethereum address
  const isEthAddress = sendid ? isAddress(sendid) : false

  // For addresses, look up by 'address' type to check if they have a Send account
  // For non-addresses, look up by 'sendid' type
  const lookupType = isEthAddress ? 'address' : 'sendid'
  const { data: profile, isLoading } = useProfileLookup(lookupType, sendid ?? '')

  // If address has a Send account, redirect to canonical URL
  useEffect(() => {
    if (isEthAddress && profile && !isLoading) {
      const redirectUrl = profile.main_tag_name
        ? `/${profile.main_tag_name}`
        : `/profile/${profile.sendid}`
      router.replace(redirectUrl)
    }
  }, [isEthAddress, profile, isLoading, router])

  // For external addresses without a Send account, show ExternalAddressScreen
  if (isEthAddress && !isLoading && !profile) {
    return (
      <>
        <Stack.Screen
          options={{
            title: `${sendid?.slice(0, 6)}...${sendid?.slice(-4)}`,
            headerShown: true,
          }}
        />
        <ScreenContainer scrollable={false}>
          <ExternalAddressScreen address={sendid as Address} />
        </ScreenContainer>
      </>
    )
  }

  // For addresses with Send accounts, show loading while redirect happens
  if (isEthAddress && profile) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '',
            headerShown: true,
          }}
        />
        <ScreenContainer>{null}</ScreenContainer>
      </>
    )
  }

  // Standard sendid profile view
  return (
    <>
      <Stack.Screen
        options={{
          title: isLoading ? '' : profile?.name || profile?.main_tag_name || `#${sendid}`,
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <ProfileScreen />
      </ScreenContainer>
    </>
  )
}
