import type { PropsWithChildren } from 'react'
import { Stack, type StackProps } from '@my/ui'

export default function IconBefore({ children, ...props }: PropsWithChildren & StackProps) {
  return (
    <Stack
      pos={'absolute'}
      top={0}
      bottom={0}
      left={0}
      right={0}
      justifyContent="center"
      zIndex={1}
      pointerEvents="none"
      {...props}
    >
      {children}
    </Stack>
  )
}
