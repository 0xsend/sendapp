import type { PropsWithChildren } from 'react'
import { Fade, YStack } from '@my/ui'

export const Section = ({ children }: PropsWithChildren) => {
  return (
    <Fade>
      <YStack
        w={'100%'}
        gap={'$3.5'}
        bc={'$color1'}
        borderRadius={'$5'}
        p={'$5'}
        $gtLg={{ p: '$7', gap: '$5' }}
      >
        {children}
      </YStack>
    </Fade>
  )
}
