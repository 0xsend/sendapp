import { Card, type CardProps } from 'tamagui'
import { Fade } from './Fade'

export const FadeCard = ({ children, ...props }: CardProps) => {
  return (
    <Fade>
      <Card w={'100%'} gap={'$3.5'} br={'$5'} p={'$5'} $gtLg={{ p: '$7', gap: '$5' }} {...props}>
        {children}
      </Card>
    </Fade>
  )
}
