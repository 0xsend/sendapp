import { Container, Link, YStack, XStack, ScrollView } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import type { ReactNode } from 'react'
import { useScrollDirection } from 'app/provider/scroll'

export function AuthLayout({ children }: { children: ReactNode }) {
  const { onScroll, onContentSizeChange, ref } = useScrollDirection()

  return (
    <YStack f={1}>
      <ScrollView
        ref={ref}
        mih="100%"
        contentContainerStyle={{
          mih: '100%',
          height: '100%',
        }}
        scrollEventThrottle={128}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        showsVerticalScrollIndicator={false}
      >
        <Container
          safeAreaProps={{
            style: { flex: 1, pb: '$3.5' },
            edges: {
              top: 'off',
              bottom: 'maximum',
              left: 'additive',
              right: 'additive',
            },
          }}
          flexDirection={'column'}
        >
          <XStack w={'90%'} alignSelf={'center'}>
            <Link href={'/'} pt="$7">
              <IconSendLogo size={'$3.5'} color={'$color12'} />
            </Link>
          </XStack>
          <YStack f={1} width={'100%'} maxWidth={600} alignSelf={'center'}>
            {children}
          </YStack>
        </Container>
      </ScrollView>
    </YStack>
  )
}
