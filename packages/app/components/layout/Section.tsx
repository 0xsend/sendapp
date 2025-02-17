import { Card, Fade } from '@my/ui'
import type { YStackProps } from 'tamagui'

export const Section = ({ children, ...props }: YStackProps) => {
  return (
    <Fade>
      <Card w={'100%'} gap={'$3.5'} br={'$5'} p={'$5'} $gtLg={{ p: '$7', gap: '$5' }} {...props}>
        {children}
      </Card>
    </Fade>
  )
}
