import { AnimatePresence, Stack, type StackProps } from 'tamagui'

export function Fade(props: StackProps) {
  return (
    <AnimatePresence>
      <Stack
        key="enter"
        animateOnly={['transform', 'opacity']}
        animation="quick"
        enterStyle={{ scale: 0.9 }}
        exitStyle={{ scale: 0.95 }}
        opacity={1}
        {...props}
      />
    </AnimatePresence>
  )
}
