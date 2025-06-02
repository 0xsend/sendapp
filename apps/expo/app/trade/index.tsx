import { Container, H4, Paragraph, Stack } from '@my/ui'
import { Stack as StackRouter } from 'expo-router'

export default function TradeScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Trade',
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
        <Stack f={1} ai="center" jc="center" p="$4">
          <H4 mb="$4">Trade</H4>
          <Paragraph ta="center" color="$color10">
            This screen will allow you to trade tokens on various exchanges.
          </Paragraph>
        </Stack>
      </Container>
    </>
  )
}
