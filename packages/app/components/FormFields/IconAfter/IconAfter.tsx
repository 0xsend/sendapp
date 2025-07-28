import type { PropsWithChildren } from 'react'
import { Stack, type StackProps } from '@my/ui'

export default function IconAfter({ children, ...props }: PropsWithChildren & StackProps) {
  return (
    <Stack
      pos={'absolute'}
      top="50%"
      p={'$3'}
      right={2}
      transform={'translateY(-50%)'}
      zIndex={1}
      {...props}
    >
      {children}
    </Stack>
  )
}
