import { Container, H4, Paragraph, Stack } from '@my/ui'
import { Stack as StackRouter } from 'expo-router'

export default function LeaderboardScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Leaderboard',
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
          <H4 mb="$4">Leaderboard</H4>
          <Paragraph ta="center" color="$color10">
            This screen will display the top users and their achievements.
          </Paragraph>
        </Stack>
      </Container>
    </>
  )
}
