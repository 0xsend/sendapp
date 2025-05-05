import { Anchor, Container, ScrollView, YStack } from '@my/ui'
import { useLink } from 'solito/link'
import { IconSendLogo } from 'app/components/icons'
import { Slot, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useHeaderHeight } from '@react-navigation/elements'

export default function AuthLayout() {
  const { top } = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Container
        safeAreaProps={{
          edges: ['top', 'bottom', 'left', 'right'],
          style: {
            flex: 1,
          },
        }}
        flex={1}
      >
        <YStack ai="center" f={1} position="relative" px="$4">
          <Anchor
            {...useLink({ href: '/' })}
            mx="auto"
            my="$4"
            position="absolute"
            top={headerHeight || top || '$4'}
          >
            <IconSendLogo size={'$4'} color={'$color12'} />
          </Anchor>
          <ScrollView
            pt="$2"
            mt="$14"
            f={1}
            w="100%"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 60, // Space for logo
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Slot />
          </ScrollView>
        </YStack>
      </Container>
    </>
  )
}
