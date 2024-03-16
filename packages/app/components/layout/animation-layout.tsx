import { YStack, styled } from '@my/ui'
import { AnimatePresence } from '@tamagui/animate-presence'

type AnimationLayoutProps = {
  children: React.ReactNode
  currentKey: string // Unique identifier for the current screen or content
  direction: number
}

const YStackEnterable = styled(YStack, {
  variants: {
    isLeft: { true: { x: -300, opacity: 0, position: 'absolute' } },
    isRight: { true: { x: 300, opacity: 0, position: 'absolute' } },
  } as const,
})

export const AnimationLayout = ({
  children,
  currentKey,
  direction,
  fullscreen = true,
}: AnimationLayoutProps & { fullscreen?: boolean }) => {
  const enterVariant = direction === 1 || direction === 0 ? 'isRight' : 'isLeft'
  const exitVariant = direction === 1 ? 'isLeft' : 'isRight'

  return (
    <AnimatePresence enterVariant={enterVariant} exitVariant={exitVariant}>
      <YStackEnterable
        key={currentKey}
        animation="200ms"
        fullscreen={fullscreen}
        x={0}
        opacity={1}
        overflow="hidden"
      >
        {children}
      </YStackEnterable>
    </AnimatePresence>
  )
}
