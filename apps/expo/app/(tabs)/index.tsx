import { Container, ScrollView } from '@my/ui'
import { HomeScreen } from 'app/features/home/screen'
import { Stack } from 'expo-router'

export default function HomeTabScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Send',
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
        <ScrollView
          flex={1}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 10,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always" // Android scroll indicator
        >
          <HomeScreen />
        </ScrollView>
      </Container>
    </>
  )
}
