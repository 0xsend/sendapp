import type { PropsWithChildren } from 'react'
import { H4 } from '@my/ui'

export const RowLabel = ({ children }: PropsWithChildren) => {
  return (
    <H4 fontWeight={'600'} size={'$7'}>
      {children}
    </H4>
  )
}
