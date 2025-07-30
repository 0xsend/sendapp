import { Card, type CardProps, type StackProps } from 'tamagui'
import { Fade } from './Fade'

export const FadeCard = ({
  children,
  fadeProps,
  ...props
}: CardProps & { fadeProps?: StackProps }) => {
  return (
    <Fade {...fadeProps}>
      <Card
        w={'100%'}
        gap={'$3.5'}
        br={'$5'}
        p={'$5'}
        $gtLg={{ p: '$7', gap: '$5' }}
        elevation={'$0.75'}
        {...props}
      >
        {children}
      </Card>
    </Fade>
  )
}
