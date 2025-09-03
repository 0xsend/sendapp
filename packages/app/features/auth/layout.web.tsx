import { Container, Link, ScrollView, XStack, YStack, useMedia, usePwa } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import type { ReactNode } from 'react'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'

export function AuthLayout({ children }: { children: ReactNode }) {
  const { onScroll, onContentSizeChange, ref } = useScrollDirection()
  const { xxs } = useMedia()
  const isPwa = usePwa()

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
            style: { flex: 1 },
            edges: {
              top: 'maximum',
              bottom: 'maximum',
              left: 'additive',
              right: 'additive',
            },
          }}
          flexDirection={'column'}
        >
          {!(xxs && !isPwa) && (
            <XStack
              w={'100%'}
              alignSelf={'center'}
              jc={'center'}
              position={'absolute'}
              top={0}
              pt={'$3'}
            >
              <Link href={'/'}>
                <IconSendLogo size={'$3.5'} color={'$color12'} />
              </Link>
            </XStack>
          )}
          <YStack f={1} width={'100%'} maxWidth={600} alignSelf={'center'}>
            {children}
          </YStack>
        </Container>
      </ScrollView>
    </YStack>
  )
}
