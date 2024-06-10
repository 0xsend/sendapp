import { AnimatePresence, Stack } from 'tamagui'

export function Fade({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <Stack
        key="enter"
        animateOnly={['transform', 'opacity']}
        animation="200ms"
        enterStyle={{ opacity: 0, scale: 0.9 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
        opacity={1}
      >
        {children}
      </Stack>
    </AnimatePresence>
  )
}
