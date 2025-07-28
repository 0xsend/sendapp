import type { PropsWithChildren } from 'react'
import { Stack, type StackProps } from '@my/ui'

export default function IconAfter({ children, ...props }: PropsWithChildren & StackProps) {
  return (
    <Stack
      pos={'absolute'}
      top={0}
      bottom={0}
      left={0}
      right={0}
      justifyContent="center"
      alignItems={'flex-end'}
      zIndex={1}
      pointerEvents="box-none" // Prevent blocking interactions
      {...props}
    >
      {children}
    </Stack>
  )
}
