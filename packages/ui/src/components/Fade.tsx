import { AnimatePresence, Stack, type StackProps } from 'tamagui'

export function Fade(props: StackProps) {
  return (
    <AnimatePresence>
      <Stack
        key="enter"
        animateOnly={['transform', 'opacity']}
        animation="200ms"
        enterStyle={{ opacity: 0, scale: 0.9 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
        opacity={1}
        {...props}
      />
    </AnimatePresence>
  )
}
