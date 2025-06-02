import { Button, Card, Container, H4, Paragraph, XStack, YStack } from '@my/ui'
import { ArrowRight, DollarSign } from '@tamagui/lucide-icons'
import { Stack as StackRouter } from 'expo-router'

export default function EarnTabScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Earn',
          headerShown: false, // We'll use the header from the tabs layout
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
        <YStack f={1} p="$4" gap="$6">
          <H4 textAlign="center" mt="$4">
            Earn Rewards
          </H4>

          <Card p="$4" my="$2">
            <YStack gap="$3">
              <XStack ai="center" gap="$3">
                <DollarSign size="$2" color="$color12" />
                <H4>Earn SEND</H4>
              </XStack>
              <Paragraph>Learn about ways to earn SEND rewards by using the app.</Paragraph>
              <Button
                alignSelf="flex-end"
                mt="$2"
                size="$3"
                icon={<ArrowRight size="$1" />}
                onPress={() => {
                  // TODO: Navigate to earn details page
                }}
              >
                View Rewards
              </Button>
            </YStack>
          </Card>

          <Card p="$4" my="$2">
            <YStack gap="$3">
              <Paragraph fontWeight="bold">Coming Soon</Paragraph>
              <Paragraph color="$color10">
                This screen will display all your earning opportunities and rewards history.
              </Paragraph>
            </YStack>
          </Card>
        </YStack>
      </Container>
    </>
  )
}
