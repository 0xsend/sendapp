import { XStack } from '@my/ui'
import type { PropsWithChildren } from 'react'

export const HeaderSlot = ({ children }: PropsWithChildren) => {
  return (
    <XStack
      px={'$4'}
      $gtMd={{
        px: '$6',
      }}
      $gtLg={{
        px: '$11',
      }}
    >
      {children}
    </XStack>
  )
}
