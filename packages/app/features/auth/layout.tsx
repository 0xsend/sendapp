import type React from 'react'
import { Anchor, Container, ScrollView, YStack } from '@my/ui'
import { useLink } from 'solito/link'
import { IconSendLogo } from 'app/components/icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useHeaderHeight } from '@react-navigation/elements'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { top } = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()

  return (
    <Container
      safeAreaProps={{
        edges: ['top', 'bottom', 'left', 'right'],
        style: {
          flex: 1,
        },
      }}
      flex={1}
      backgroundColor="$background"
    >
      <YStack ai="center" f={1} position="relative" px="$4">
        <Anchor
          {...useLink({ href: '/' })}
          mx="auto"
          my="$4"
          position="absolute"
          top={headerHeight || top || '$4'}
        >
          <IconSendLogo size={'$8'} color={'$color12'} />
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
          {children}
        </ScrollView>
      </YStack>
    </Container>
  )
}
