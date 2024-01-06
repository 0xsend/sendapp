// import { createPasskey, signWithPasskey } from '@daimo/expo-passkeys'
import { Button, Container, H1, ScrollView, YStack } from '@my/ui'
import { HomeHeader } from 'app/components/HomeHeader'

export function HomeScreen() {
  return (
    <ScrollView f={3} fb={0} p="$4" $gtSm={{ p: "$12" }} bg="#F0EEE9">
      <YStack gap="$6" pt="$5" pb="$8">
        <YStack space="$4">
          <HomeHeader>Dashboard</HomeHeader>
          <Button
            onPress={async () => {
              // const result = await createPasskey({
              //   domain: 'sendapp.localhost',
              //   challengeB64: window.btoa('some challenge'),
              //   passkeyName: 'sendappuser',
              //   passkeyDisplayTitle: 'SendAppUser',
              // })
              // // @ts-expect-error - for debugging
              // window.passkey = result
              // console.log(result)
            }}
          >
            Create
          </Button>
          <Button
            onPress={async () => {
              // const sign = await signWithPasskey({
              //   domain: 'sendapp.localhost',
              //   challengeB64: window.btoa('another challenge'),
              // })
              // // @ts-expect-error - for debugging
              // window.sign = sign
              // console.log(sign)
            }}
          >
            Sign
          </Button>
        </YStack>
      </YStack>
    </ScrollView >

  )
}
