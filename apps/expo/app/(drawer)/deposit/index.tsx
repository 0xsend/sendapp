import { Button, Container, H4, Paragraph, Stack, XStack, YStack } from '@my/ui'
import { Circle, CreditCard, Download } from '@tamagui/lucide-icons'
import { Stack as StackRouter, useRouter } from 'expo-router'

export default function DepositScreen() {
  const router = useRouter()

  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Deposit',
          headerShown: true,
        }}
      />

      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
      >
        <YStack f={1} p="$4" gap="$6" ai="center">
          <H4 mt="$6">Add Funds</H4>

          <YStack w="100%" gap="$4" mt="$4">
            <Button
              size="$5"
              theme="blue"
              mb="$2"
              iconAfter={<CreditCard size="$1.5" />}
              onPress={() => {
                router.push('/deposit/debit-card')
              }}
            >
              Debit Card
            </Button>

            <Button
              size="$5"
              theme="green"
              mb="$2"
              iconAfter={<Circle size="$1.5" />}
              onPress={() => {
                router.push('/deposit/crypto')
              }}
            >
              Crypto
            </Button>
          </YStack>

          <Paragraph ta="center" color="$color10" mt="$6">
            This screen allows you to add funds to your account through various methods.
          </Paragraph>
        </YStack>
      </Container>
    </>
  )
}
