import { Button, type ButtonProps, Paragraph } from '@my/ui'

export const GradientButton = ({ children, ...props }: ButtonProps) => {
  return (
    <Button
      borderRadius={'$8'}
      height={'$6'}
      style={{
        backgroundImage:
          'linear-gradient(180deg, #FFF8EE -93.75%, #DAC5A5 -8.21%, #AB8F76 52.45%, #8F775D 90%, #A68B6E 127.2%, #B79A7A 185%)',
        boxShadow: '0px 9px 8px 0px rgba(167, 139, 114, 0.10)',
      }}
      {...props}
    >
      <Paragraph size={'$6'} color={'$color4'} fontWeight={'700'}>
        {children}
      </Paragraph>
    </Button>
  )
}
